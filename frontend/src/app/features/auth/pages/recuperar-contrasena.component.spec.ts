import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { RecuperarContrasenaComponent } from './recuperar-contrasena.component';
import { AuthService } from '../../../core/services/auth/auth.service';
import { AuthModalService } from '../../../core/services/auth/auth-modal.service';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { StartupReadinessService, type DbReadinessState } from '../../../core/services/startup-readiness.service';

describe('RecuperarContrasenaComponent', () => {
  let component: RecuperarContrasenaComponent;
  let authService: jasmine.SpyObj<AuthService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let startupReadiness: jasmine.SpyObj<StartupReadinessService>;

  function setup(): void {
    authService = jasmine.createSpyObj('AuthService', ['forgotPassword']);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'warning', 'error']);
    const authModal = jasmine.createSpyObj('AuthModalService', ['openLogin']);
    startupReadiness = jasmine.createSpyObj('StartupReadinessService', ['resetDismiss', 'startPolling', 'stop']);
    (startupReadiness as unknown as { state$: Subject<DbReadinessState> }).state$ = new Subject();

    TestBed.configureTestingModule({
      providers: [
        RecuperarContrasenaComponent,
        { provide: AuthService, useValue: authService },
        { provide: NotificationService, useValue: notificationService },
        { provide: StartupReadinessService, useValue: startupReadiness },
        { provide: AuthModalService, useValue: authModal },
      ],
    });
    component = TestBed.inject(RecuperarContrasenaComponent);
    component.readinessState = 'ready';
  }

  it('onSubmit no hace nada si el correo está vacío', () => {
    setup();
    component.email = '';
    component.onSubmit();
    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  it('onSubmit avisa y no llama al backend si aún no está listo', () => {
    setup();
    component.email = 'a@test.com';
    component.readinessState = 'checking';

    component.onSubmit();

    expect(authService.forgotPassword).not.toHaveBeenCalled();
    expect(notificationService.warning).toHaveBeenCalled();
  });

  it('onSubmit exitoso marca sent y notifica éxito', () => {
    setup();
    component.email = 'a@test.com';
    authService.forgotPassword.and.returnValue(of({}) as unknown as ReturnType<AuthService['forgotPassword']>);

    component.onSubmit();

    expect(component.sent).toBeTrue();
    expect(component.loading).toBeFalse();
    expect(notificationService.success).toHaveBeenCalled();
  });

  it('onSubmit en error detiene loading y notifica el mensaje del backend', () => {
    setup();
    component.email = 'a@test.com';
    authService.forgotPassword.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' }))
    );

    component.onSubmit();

    expect(component.sent).toBeFalse();
    expect(component.loading).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });
});
