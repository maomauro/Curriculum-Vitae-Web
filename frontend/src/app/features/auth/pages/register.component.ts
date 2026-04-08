import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';

@Component({
  selector: 'app-register',
  standalone: false,
  template: `
    <div class="login-box">
      <div class="login-logo">
        <a routerLink="/" class="text-decoration-none"><b>Portal</b>CV</a>
      </div>
      <div class="card">
        <div class="card-body login-card-body">
          <p class="login-box-msg">Crea tu cuenta gratuita</p>
          <div *ngIf="errorMsg" class="alert alert-danger py-2 mb-3">{{ errorMsg }}</div>
          <form (ngSubmit)="onRegister()">
            <div class="input-group mb-3">
              <input type="text" class="form-control" placeholder="Nombre completo"
                [(ngModel)]="name" name="name" required>
              <div class="input-group-text"><span class="bi bi-person"></span></div>
            </div>
            <div class="input-group mb-3">
              <input type="email" class="form-control" placeholder="Correo electrónico"
                [(ngModel)]="email" name="email" required>
              <div class="input-group-text"><span class="bi bi-envelope"></span></div>
            </div>
            <div class="input-group mb-3">
              <input type="password" class="form-control" placeholder="Contraseña (min. 8 caracteres)"
                [(ngModel)]="password" name="password" required minlength="8">
              <div class="input-group-text"><span class="bi bi-lock-fill"></span></div>
            </div>
            <div class="row">
              <div class="col-12">
                <div class="d-grid">
                  <button type="submit" class="btn btn-success" [disabled]="loading">
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>
                    Crear cuenta
                  </button>
                </div>
              </div>
            </div>
          </form>
          <p class="mt-3 mb-1 text-center">
            <a routerLink="/auth/login">¿Ya tienes cuenta? Inicia sesión</a>
          </p>
          <div class="d-grid mt-3">
            <a routerLink="/" class="btn btn-light border text-secondary">
              <i class="bi bi-house-door me-1"></i>Volver al inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  loading = false;
  errorMsg = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  onRegister(): void {
    if (!this.name || !this.email || !this.password) return;
    this.loading = true;
    this.errorMsg = '';
    this.authService.register(this.name, this.email, this.password).subscribe({
      next: () => {
        // El API no devuelve JWT en register; iniciamos sesión con las mismas credenciales.
        this.authService.login(this.email, this.password).subscribe({
          next: () => {
            this.notificationService.success(NOTIFICATION_MESSAGES.operationSuccess);
            this.router.navigate(['/dashboard']);
          },
          error: () => {
            this.errorMsg = 'Cuenta creada. Inicia sesión con tu correo y contraseña.';
            this.notificationService.warning(NOTIFICATION_MESSAGES.operationPartial);
            this.loading = false;
            void this.router.navigate(['/auth/login']);
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        const body = err.error as { message?: string } | null;
        this.errorMsg =
          typeof body?.message === 'string'
            ? body.message
            : 'No se pudo crear la cuenta. Revisa la consola o que el API y la base de datos estén en marcha.';
        this.notificationService.error(NOTIFICATION_MESSAGES.operationError);
        this.loading = false;
      }
    });
  }
}
