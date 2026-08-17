import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth/auth.service';
import { AuthModalService } from '../../../core/services/auth/auth-modal.service';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { StartupReadinessService, type DbReadinessState } from '../../../core/services/startup-readiness.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let authModal: jasmine.SpyObj<AuthModalService>;
  let startupReadiness: jasmine.SpyObj<StartupReadinessService>;
  let state$: Subject<DbReadinessState>;

  function setup(): void {
    authService = jasmine.createSpyObj('AuthService', ['login', 'postLoginPath']);
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    authModal = jasmine.createSpyObj('AuthModalService', ['openRecuperar', 'openRegister', 'close']);
    state$ = new Subject<DbReadinessState>();
    startupReadiness = jasmine.createSpyObj('StartupReadinessService', ['resetDismiss', 'startPolling', 'stop']);
    (startupReadiness as unknown as { state$: Subject<DbReadinessState> }).state$ = state$;

    TestBed.configureTestingModule({
      providers: [
        LoginComponent,
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: NotificationService, useValue: notificationService },
        { provide: StartupReadinessService, useValue: startupReadiness },
        { provide: AuthModalService, useValue: authModal },
      ],
    });
    component = TestBed.inject(LoginComponent);
    component.readinessState = 'ready';
  }

  it('ngOnInit reinicia dismiss, arranca el polling y se suscribe a state$', () => {
    setup();
    component.ngOnInit();
    state$.next('ready');

    expect(startupReadiness.resetDismiss).toHaveBeenCalled();
    expect(startupReadiness.startPolling).toHaveBeenCalled();
    expect(component.readinessState).toBe('ready');
  });

  it('ngOnDestroy detiene el polling', () => {
    setup();
    component.ngOnInit();
    component.ngOnDestroy();
    expect(startupReadiness.stop).toHaveBeenCalled();
  });

  it('onLogin no hace nada si falta email o contraseña', () => {
    setup();
    component.email = '';
    component.password = '';
    component.onLogin();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('onLogin bloquea el envío si el backend aún no está listo', () => {
    setup();
    component.email = 'a@test.com';
    component.password = 'secret';
    component.readinessState = 'checking';

    component.onLogin();

    expect(authService.login).not.toHaveBeenCalled();
    expect(component.errorMsg).toContain('activando');
  });

  it('onLogin exitoso notifica éxito y navega a postLoginPath', () => {
    setup();
    component.email = 'a@test.com';
    component.password = 'secret';
    authService.login.and.returnValue(of({}) as unknown as ReturnType<AuthService['login']>);
    authService.postLoginPath.and.returnValue('/dashboard');

    component.onLogin();

    expect(notificationService.success).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(authModal.close).not.toHaveBeenCalled();
  });

  it('onLogin exitoso en modo embebido cierra el modal', () => {
    setup();
    component.embedModal = true;
    component.email = 'a@test.com';
    component.password = 'secret';
    authService.login.and.returnValue(of({}) as unknown as ReturnType<AuthService['login']>);
    authService.postLoginPath.and.returnValue('/dashboard');

    component.onLogin();

    expect(authModal.close).toHaveBeenCalled();
  });

  it('onLogin en error fija el mensaje del backend y detiene loading', () => {
    setup();
    component.email = 'a@test.com';
    component.password = 'mala';
    authService.login.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }))
    );

    component.onLogin();

    expect(component.errorMsg).toBeTruthy();
    expect(component.loading).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });
});
