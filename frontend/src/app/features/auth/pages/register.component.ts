import { Component, Input, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { AuthModalService } from '../../../core/services/auth/auth-modal.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';
import { StartupReadinessService } from '../../../core/services/startup-readiness.service';
import { AuthReadinessLifecycle } from '../auth-readiness-lifecycle';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
})
export class RegisterComponent extends AuthReadinessLifecycle {
  @Input() embedModal = false;

  name = '';
  email = '';
  password = '';
  loading = false;
  errorMsg = '';

  readonly authModal = inject(AuthModalService);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly notificationService: NotificationService,
    startupReadiness: StartupReadinessService
  ) {
    super(startupReadiness);
  }

  onRegister(): void {
    if (!this.name || !this.email || !this.password) return;
    if (this.readinessState !== 'ready') {
      this.errorMsg = 'El servidor aún se está activando. Intenta de nuevo en unos segundos.';
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    this.authService.register(this.name, this.email, this.password).subscribe({
      next: () => {
        this.authService.login(this.email, this.password).subscribe({
          next: () => {
            this.notificationService.success(NOTIFICATION_MESSAGES.operationSuccess);
            if (this.embedModal) {
              this.authModal.close();
            }
            void this.router.navigateByUrl(this.authService.postLoginPath());
          },
          error: () => {
            this.errorMsg = 'Cuenta creada. Inicia sesión con tu correo y contraseña.';
            this.notificationService.warning(NOTIFICATION_MESSAGES.operationPartial);
            this.loading = false;
            if (this.embedModal) {
              this.authModal.openLogin();
            } else {
              void this.router.navigate(['/'], { queryParams: { authModal: 'login' } });
            }
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.errorMsg =
          extractApiErrorMessage(err) ||
          'No se pudo crear la cuenta. Revisa la consola o que el API y la base de datos estén en marcha.';
        this.notificationService.error(NOTIFICATION_MESSAGES.operationError);
        this.loading = false;
      },
    });
  }
}
