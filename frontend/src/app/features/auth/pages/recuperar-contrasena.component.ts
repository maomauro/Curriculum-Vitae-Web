import { Component, Input, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth/auth.service';
import { AuthModalService } from '../../../core/services/auth/auth-modal.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: false,
  template: `
    <div class="login-box" [class.login-box--embed]="embedModal">

      <div class="login-logo" *ngIf="!embedModal">
        <a routerLink="/"><b>Portal</b>CV</a>
      </div>

      <div class="card" [class.border-0]="embedModal" [class.shadow-none]="embedModal">
        <div class="card-body login-card-body" [class.px-0]="embedModal" [class.pt-0]="embedModal">

          <p class="login-box-msg" *ngIf="!embedModal">Recupera el acceso a tu cuenta</p>

          <div *ngIf="sent" class="alert alert-success text-center mb-3">
            <i class="bi bi-envelope-check me-1"></i>
            Si el correo existe, recibirás instrucciones en breve.
          </div>

          <form *ngIf="!sent" (ngSubmit)="onSubmit()">
            <div class="input-group mb-4">
              <input type="email" class="form-control"
                placeholder="Correo electrónico"
                [(ngModel)]="email" name="email" required autocomplete="email">
              <button
                *ngIf="email?.trim()"
                type="button"
                class="btn btn-outline-secondary auth-input-clear"
                (click)="email = ''"
                aria-label="Limpiar correo">
                <i class="bi bi-x-lg" aria-hidden="true"></i>
              </button>
              <div class="input-group-text"><i class="bi bi-envelope"></i></div>
            </div>

            <div class="d-grid">
              <button type="submit" class="btn btn-primary" [disabled]="loading">
                <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>
                Enviar instrucciones
              </button>
            </div>
          </form>

          <p class="mt-3 mb-1 text-center small text-muted">
            <a *ngIf="!embedModal" routerLink="/" [queryParams]="{ authModal: 'login' }">Volver al inicio de sesión</a>
            <button *ngIf="embedModal" type="button" class="btn btn-link btn-sm p-0"
                    (click)="authModal.openLogin()">
              Volver al inicio de sesión
            </button>
          </p>
          <div class="d-grid mt-3" *ngIf="!embedModal">
            <a routerLink="/" class="btn btn-light border text-secondary">
              <i class="bi bi-house-door me-1"></i>Volver al inicio
            </a>
          </div>

        </div>
      </div>
    </div>
  `,
})
export class RecuperarContrasenaComponent {
  @Input() embedModal = false;

  email = '';
  loading = false;
  sent = false;

  readonly authModal = inject(AuthModalService);

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  onSubmit(): void {
    if (!this.email) return;
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
