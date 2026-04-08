import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  template: `
    <div class="login-box">

      <div class="login-logo">
        <a routerLink="/"><b>Portal</b>CV</a>
      </div>

      <div class="card">
        <div class="card-body login-card-body">

          <p class="login-box-msg">Inicia sesión para continuar</p>

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
            <a routerLink="/auth/recuperar-contrasena">¿Olvidaste tu contraseña?</a>
          </p>
          <p class="mb-0 text-center small text-muted">
            ¿No tienes cuenta? <a routerLink="/auth/register">Regístrate aquí</a>
          </p>

        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  errorMsg = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(): void {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.errorMsg = '';
    this.authService.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.errorMsg = 'Correo o contraseña incorrectos. Inténtalo de nuevo.';
        this.loading = false;
      }
    });
  }
}
