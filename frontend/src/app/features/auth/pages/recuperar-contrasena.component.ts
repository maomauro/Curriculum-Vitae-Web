import { Component } from '@angular/core';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: false,
  template: `
    <div class="login-box">

      <div class="login-logo">
        <a routerLink="/"><b>Portal</b>CV</a>
      </div>

      <div class="card">
        <div class="card-body login-card-body">

          <p class="login-box-msg">Recupera el acceso a tu cuenta</p>

          <div *ngIf="sent" class="alert alert-success text-center mb-3">
            <i class="bi bi-envelope-check me-1"></i>
            Si el correo existe, recibirás instrucciones en breve.
          </div>

          <form *ngIf="!sent" (ngSubmit)="onSubmit()">
            <div class="input-group mb-4">
              <input type="email" class="form-control"
                placeholder="Correo electrónico"
                [(ngModel)]="email" name="email" required autocomplete="email">
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
            <a routerLink="/auth/login">Volver al inicio de sesión</a>
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
export class RecuperarContrasenaComponent {
  email = '';
  loading = false;
  sent = false;

  onSubmit(): void {
    if (!this.email) return;
    this.loading = true;
    // TODO: conectar con API cuando esté disponible
    setTimeout(() => {
      this.sent = true;
      this.loading = false;
    }, 800);
  }
}
