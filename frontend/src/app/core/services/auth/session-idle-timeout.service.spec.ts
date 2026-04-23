import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import type { UserInfo } from './auth.service';
import { AuthService } from './auth.service';
import { SessionIdleTimeoutService } from './session-idle-timeout.service';

const IDLE_MS = 10 * 60 * 1000;
const CHECK_INTERVAL_MS = 15_000;

const usuarioDemo: UserInfo = {
  id: 1,
  nombre: 'Demo',
  email: 'demo@test.local',
  rol: 'Publicador',
  roles: ['Publicador'],
  curriculumId: 1,
};

describe('SessionIdleTimeoutService', () => {
  let userSubject: BehaviorSubject<UserInfo | null>;
  let authMock: {
    currentUser$: ReturnType<BehaviorSubject<UserInfo | null>['asObservable']>;
    currentUser: UserInfo | null;
    logout: jasmine.Spy;
  };
  let navigateSpy: jasmine.Spy;

  function setup(): SessionIdleTimeoutService {
    userSubject = new BehaviorSubject<UserInfo | null>(null);
    authMock = {
      currentUser$: userSubject.asObservable(),
      get currentUser() {
        return userSubject.value;
      },
      logout: jasmine.createSpy('logout'),
    };
    navigateSpy = jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true));

    TestBed.configureTestingModule({
      providers: [
        SessionIdleTimeoutService,
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: { navigate: navigateSpy } },
      ],
    });

    return TestBed.inject(SessionIdleTimeoutService);
  }

  it('no registra logout si no hay usuario', fakeAsync(() => {
    setup();
    tick(IDLE_MS + CHECK_INTERVAL_MS + 1);
    expect(authMock.logout).not.toHaveBeenCalled();
  }));

  it('tras login avanza el reloj y cierra sesión si pasó el umbral de inactividad', fakeAsync(() => {
    setup();
    userSubject.next(usuarioDemo);
    tick(IDLE_MS + CHECK_INTERVAL_MS);
    expect(authMock.logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/'], { queryParams: { authModal: 'login' } });
  }));

  it('reinicia el contador de inactividad tras un click', fakeAsync(() => {
    setup();
    userSubject.next(usuarioDemo);
    tick(9 * 60 * 1000);
    expect(authMock.logout).not.toHaveBeenCalled();
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    tick(9 * 60 * 1000 + CHECK_INTERVAL_MS);
    expect(authMock.logout).not.toHaveBeenCalled();
    tick(1 * 60 * 1000 + CHECK_INTERVAL_MS);
    expect(authMock.logout).toHaveBeenCalled();
  }));

  it('al pasar a usuario null detiene timers sin logout', fakeAsync(() => {
    const svc = setup();
    userSubject.next(usuarioDemo);
    tick(CHECK_INTERVAL_MS);
    expect(authMock.logout).not.toHaveBeenCalled();
    userSubject.next(null);
    tick(IDLE_MS + CHECK_INTERVAL_MS);
    expect(authMock.logout).not.toHaveBeenCalled();
    svc.ngOnDestroy();
  }));

  it('ngOnDestroy cancela suscripción y no lanza si se llama dos veces', fakeAsync(() => {
    const svc = setup();
    userSubject.next(usuarioDemo);
    svc.ngOnDestroy();
    svc.ngOnDestroy();
    tick(IDLE_MS + CHECK_INTERVAL_MS);
    expect(authMock.logout).not.toHaveBeenCalled();
  }));

  it('vuelve a armar el temporizador si el usuario pasa a null y vuelve a autenticarse', fakeAsync(() => {
    setup();
    userSubject.next(usuarioDemo);
    tick(IDLE_MS + CHECK_INTERVAL_MS);
    expect(authMock.logout).toHaveBeenCalledTimes(1);
    authMock.logout.calls.reset();
    userSubject.next(null);
    userSubject.next(usuarioDemo);
    tick(IDLE_MS + CHECK_INTERVAL_MS);
    expect(authMock.logout).toHaveBeenCalledTimes(1);
  }));
});
