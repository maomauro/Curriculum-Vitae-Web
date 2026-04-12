import { Component, Input, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { AuthModalService } from '../../../core/services/auth/auth-modal.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';

@Component({
  selector: 'app-login',
  standalone: false,
  template: `
    <div class="login-box" [class.login-box--embed]="embedModal">

      <div class="login-logo" *ngIf="!embedModal">
        <a routerLink="/"><b>Portal</b>CV</a>
      </div>

      <div class="card" [class.border-0]="embedModal" [class.shadow-none]="embedModal">
        <div class="card-body login-card-body" [class.px-0]="embedModal" [class.pt-0]="embedModal">

          <p class="login-box-msg" *ngIf="!embedModal">Inicia sesión para continuar</p>

          <div *ngIf="errorMsg" class="alert alert-danger d-flex align-items-center gap-2 mb-3" role="alert">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <div>{{ errorMsg }}</div>
          </div>

          <form (ngSubmit)="onLogin()">
            <div class="input-group mb-3">
              <input type="email" class="form-control"
                placeholder="Correo electrónico"
                [(ngModel)]="email" name="email" required autocomplete="username">
              <div class="input-group-text"><i class="bi bi-envelope"></i></div>
            </div>

            <div class="input-group mb-4">
              <input type="password" class="form-control"
                placeholder="Contraseña"
                [(ngModel)]="password" name="password" required autocomplete="current-password">
              <div class="input-group-text"><i class="bi bi-lock-fill"></i></div>
            </div>

            <div class="d-grid">
              <button type="submit" class="btn btn-primary" [disabled]="loading">
                <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>
                Iniciar sesión
              </button>
            </div>
          </form>

          <p class="mt-3 mb-1 text-center small">
            <a *ngIf="!embedModal" routerLink="/" [queryParams]="{ authModal: 'recuperar' }">¿Olvidaste tu contraseña?</a>
            <button *ngIf="embedModal" type="button" class="btn btn-link btn-sm p-0 align-baseline"
                    (click)="authModal.openRecuperar()">
              ¿Olvidaste tu contraseña?
            </button>
          </p>
          <p class="mb-1 text-center small text-muted">
            ¿No tienes cuenta?
            <a *ngIf="!embedModal" routerLink="/" [queryParams]="{ authModal: 'register' }">Regístrate aquí</a>
            <button *ngIf="embedModal" type="button" class="btn btn-link btn-sm p-0 align-baseline"
                    (click)="authModal.openRegister()">
              Regístrate aquí
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
export class LoginComponent {
  @Input() embedModal = false;

  email = '';
  password = '';
  loading = false;
  errorMsg = '';

  readonly authModal = inject(AuthModalService);

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  onLogin(): void {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.errorMsg = '';
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.notificationService.success(NOTIFICATION_MESSAGES.operationSuccess);
        if (this.embedModal) {
          this.authModal.close();
        }
        this.router.navigate(['/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMsg = extractApiErrorMessage(error) || 'Correo o contraseña incorrectos. Inténtalo de nuevo.';
        this.notificationService.error(NOTIFICATION_MESSAGES.operationError);
        this.loading = false;
      },
    });
  }
}
