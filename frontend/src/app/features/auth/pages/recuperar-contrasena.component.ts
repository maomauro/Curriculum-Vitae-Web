import { Component, Input, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth/auth.service';
import { AuthModalService } from '../../../core/services/auth/auth-modal.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';
import { StartupReadinessService } from '../../../core/services/startup-readiness.service';
import { AuthReadinessLifecycle } from '../auth-readiness-lifecycle';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: false,
  templateUrl: './recuperar-contrasena.component.html',
})
export class RecuperarContrasenaComponent extends AuthReadinessLifecycle {
  @Input() embedModal = false;

  email = '';
  loading = false;
  sent = false;

  readonly authModal = inject(AuthModalService);

  constructor(
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    startupReadiness: StartupReadinessService
  ) {
    super(startupReadiness);
  }

  onSubmit(): void {
    if (!this.email) return;
    if (this.readinessState !== 'ready') {
      this.notificationService.warning('El servidor aún se está activando. Intenta de nuevo en unos segundos.');
      return;
    }
    this.loading = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.sent = true;
        this.loading = false;
        this.notificationService.success(NOTIFICATION_MESSAGES.operationSuccess);
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.operationError);
      },
    });
  }
}
