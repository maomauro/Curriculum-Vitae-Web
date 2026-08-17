import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth/auth.service';
import { AuthModalService } from '../../../core/services/auth/auth-modal.service';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { StartupReadinessService, type DbReadinessState } from '../../../core/services/startup-readiness.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let authModal: jasmine.SpyObj<AuthModalService>;
  let startupReadiness: jasmine.SpyObj<StartupReadinessService>;

  function setup(): void {
    authService = jasmine.createSpyObj('AuthService', ['register', 'login', 'postLoginPath']);
    router = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'warning', 'error']);
    authModal = jasmine.createSpyObj('AuthModalService', ['openLogin', 'close']);
    startupReadiness = jasmine.createSpyObj('StartupReadinessService', ['resetDismiss', 'startPolling', 'stop']);
    (startupReadiness as unknown as { state$: Subject<DbReadinessState> }).state$ = new Subject();

    TestBed.configureTestingModule({
      providers: [
        RegisterComponent,
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: NotificationService, useValue: notificationService },
        { provide: StartupReadinessService, useValue: startupReadiness },
        { provide: AuthModalService, useValue: authModal },
      ],
    });
    component = TestBed.inject(RegisterComponent);
    component.readinessState = 'ready';
  }

  function fillForm(): void {
    component.name = 'Ana';
    component.email = 'ana@test.com';
    component.password = 'secreto1';
  }

  it('onRegister no hace nada si falta algún campo', () => {
    setup();
    component.onRegister();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('onRegister bloquea el envío si el backend aún no está listo', () => {
    setup();
    fillForm();
    component.readinessState = 'checking';

    component.onRegister();

    expect(authService.register).not.toHaveBeenCalled();
    expect(component.errorMsg).toContain('activando');
  });

  it('onRegister exitoso hace login automático y navega a postLoginPath', () => {
    setup();
    fillForm();
    authService.register.and.returnValue(of({}) as unknown as ReturnType<AuthService['register']>);
    authService.login.and.returnValue(of({}) as unknown as ReturnType<AuthService['login']>);
    authService.postLoginPath.and.returnValue('/dashboard');

    component.onRegister();

    expect(authService.register).toHaveBeenCalledWith('Ana', 'ana@test.com', 'secreto1');
    expect(notificationService.success).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('onRegister exitoso en modo embebido cierra el modal tras el login automático', () => {
    setup();
    component.embedModal = true;
    fillForm();
    authService.register.and.returnValue(of({}) as unknown as ReturnType<AuthService['register']>);
    authService.login.and.returnValue(of({}) as unknown as ReturnType<AuthService['login']>);
    authService.postLoginPath.and.returnValue('/dashboard');

    component.onRegister();

    expect(authModal.close).toHaveBeenCalled();
  });

  it('si el registro funciona pero el login automático falla, pide iniciar sesión manualmente', () => {
    setup();
    fillForm();
    authService.register.and.returnValue(of({}) as unknown as ReturnType<AuthService['register']>);
    authService.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    component.onRegister();

    expect(component.errorMsg).toContain('Cuenta creada');
    expect(notificationService.warning).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/'], { queryParams: { authModal: 'login' } });
  });

  it('si el registro falla en modo embebido y el login automático falla, abre el modal de login', () => {
    setup();
    component.embedModal = true;
    fillForm();
    authService.register.and.returnValue(of({}) as unknown as ReturnType<AuthService['register']>);
    authService.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    component.onRegister();

    expect(authModal.openLogin).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('onRegister en error fija el mensaje del backend y detiene loading', () => {
    setup();
    fillForm();
    authService.register.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 409, statusText: 'Conflict' }))
    );

    component.onRegister();

    expect(component.errorMsg).toBeTruthy();
    expect(component.loading).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });
});
