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
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
})
export class LoginComponent extends AuthReadinessLifecycle {
  @Input() embedModal = false;

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

  onLogin(): void {
    if (!this.email || !this.password) return;
    if (this.readinessState !== 'ready') {
      this.errorMsg = 'El servidor aún se está activando. Intenta de nuevo en unos segundos.';
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.notificationService.success(NOTIFICATION_MESSAGES.operationSuccess);
        if (this.embedModal) {
          this.authModal.close();
        }
        void this.router.navigateByUrl(this.authService.postLoginPath());
      },
      error: (error: HttpErrorResponse) => {
        this.errorMsg = extractApiErrorMessage(error) || 'Correo o contraseña incorrectos. Inténtalo de nuevo.';
        this.notificationService.error(NOTIFICATION_MESSAGES.operationError);
        this.loading = false;
      },
    });
  }
}
