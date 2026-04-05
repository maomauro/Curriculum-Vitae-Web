import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: false,
  template: `
    <div class="login-box">
      <div class="card card-outline card-success shadow">
        <div class="card-header text-center">
          <h1 class="h4 fw-bold text-success">PortalCV</h1>
          <p class="text-muted mb-0">Crea tu cuenta gratuita</p>
        </div>
        <div class="card-body">
          <div *ngIf="errorMsg" class="alert alert-danger alert-dismissible fade show py-2" role="alert">
            {{ errorMsg }}
            <button type="button" class="btn-close" (click)="errorMsg = ''"></button>
          </div>
          <form (ngSubmit)="onRegister()">
            <div class="mb-3">
              <label class="form-label">Nombre completo</label>
              <div class="input-group">
                <input type="text" class="form-control" placeholder="Tu nombre y apellido"
                  [(ngModel)]="name" name="name" required>
                <span class="input-group-text"><i class="bi bi-person"></i></span>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Correo electrónico</label>
              <div class="input-group">
                <input type="email" class="form-control" placeholder="correo@ejemplo.com"
                  [(ngModel)]="email" name="email" required>
                <span class="input-group-text"><i class="bi bi-envelope"></i></span>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Contraseña</label>
              <div class="input-group">
                <input type="password" class="form-control" placeholder="Mínimo 8 caracteres"
                  [(ngModel)]="password" name="password" required minlength="8">
                <span class="input-group-text"><i class="bi bi-lock"></i></span>
              </div>
            </div>
            <div class="d-grid mt-4">
              <button type="submit" class="btn btn-success" [disabled]="loading">
                <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                Crear cuenta
              </button>
            </div>
          </form>
          <div class="text-center mt-3">
            <small class="text-muted">¿Ya tienes cuenta?
              <a routerLink="/auth/login">Inicia sesión</a>
            </small>
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

  constructor(private authService: AuthService, private router: Router) {}

  onRegister(): void {
    if (!this.name || !this.email || !this.password) return;
    this.loading = true;
    this.errorMsg = '';
    this.authService.register(this.name, this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.errorMsg = 'No se pudo crear la cuenta. Intenta de nuevo.';
        this.loading = false;
      }
    });
  }
}
