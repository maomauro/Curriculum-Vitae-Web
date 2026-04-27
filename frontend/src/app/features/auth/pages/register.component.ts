import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth/auth.service';
import { AuthModalService } from '../../../core/services/auth/auth-modal.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';
import { StartupReadinessService, type DbReadinessState } from '../../../core/services/startup-readiness.service';

@Component({
  selector: 'app-register',
  standalone: false,
  template: `
    <div class="login-box" [class.login-box--embed]="embedModal">
      <div class="login-logo" *ngIf="!embedModal">
        <a routerLink="/" class="text-decoration-none"><b>Portal</b>CV</a>
      </div>
      <div class="card" [class.border-0]="embedModal" [class.shadow-none]="embedModal">
        <div class="card-body login-card-body" [class.px-0]="embedModal" [class.pt-0]="embedModal">
          <p class="login-box-msg" *ngIf="!embedModal">Crea tu cuenta gratuita</p>
          <div
            *ngIf="readinessState !== 'ready'"
            class="alert alert-warning d-flex align-items-center gap-2 mb-3 py-2"
            role="status"
            aria-live="polite">
            <i class="bi bi-clock-history"></i>
            <div>Estamos iniciando servicios. Si una acción falla, espera unos segundos y reintenta.</div>
          </div>
          <div *ngIf="errorMsg" class="alert alert-danger py-2 mb-3">{{ errorMsg }}</div>
          <form (ngSubmit)="onRegister()">
            <div class="input-group mb-3">
              <input type="text" class="form-control" placeholder="Nombre completo"
                [(ngModel)]="name" name="name" required autocomplete="name">
              <button
                *ngIf="name?.trim()"
                type="button"
                class="btn btn-outline-secondary auth-input-clear"
                (click)="name = ''"
                aria-label="Limpiar nombre">
                <i class="bi bi-x-lg" aria-hidden="true"></i>
              </button>
              <div class="input-group-text"><span class="bi bi-person"></span></div>
            </div>
            <div class="input-group mb-3">
              <input type="email" class="form-control" placeholder="Correo electrónico"
                [(ngModel)]="email" name="email" required autocomplete="email">
              <button
                *ngIf="email?.trim()"
                type="button"
                class="btn btn-outline-secondary auth-input-clear"
                (click)="email = ''"
                aria-label="Limpiar correo">
                <i class="bi bi-x-lg" aria-hidden="true"></i>
              </button>
              <div class="input-group-text"><span class="bi bi-envelope"></span></div>
            </div>
            <div class="input-group mb-3">
              <input type="password" class="form-control" placeholder="Contraseña (min. 8 caracteres)"
                [(ngModel)]="password" name="password" required minlength="8" autocomplete="new-password">
              <button
                *ngIf="password.length > 0"
                type="button"
                class="btn btn-outline-secondary auth-input-clear"
                (click)="password = ''"
                aria-label="Limpiar contraseña">
                <i class="bi bi-x-lg" aria-hidden="true"></i>
              </button>
              <div class="input-group-text"><span class="bi bi-lock-fill"></span></div>
            </div>
            <div class="d-grid">
              <button type="submit" class="btn btn-success" [disabled]="loading">
                <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>
                Crear cuenta
              </button>
            </div>
          </form>
          <p class="mt-3 mb-1 text-center">
            <a *ngIf="!embedModal" routerLink="/" [queryParams]="{ authModal: 'login' }">¿Ya tienes cuenta? Inicia sesión</a>
            <button *ngIf="embedModal" type="button" class="btn btn-link btn-sm p-0"
                    (click)="authModal.openLogin()">
              ¿Ya tienes cuenta? Inicia sesión
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
export class RegisterComponent implements OnInit, OnDestroy {
  @Input() embedModal = false;

  name = '';
  email = '';
  password = '';
  loading = false;
  errorMsg = '';
  readinessState: DbReadinessState = 'checking';
  private readinessSub: Subscription | null = null;

  readonly authModal = inject(AuthModalService);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly notificationService: NotificationService,
    private readonly startupReadiness: StartupReadinessService
  ) {}

  ngOnInit(): void {
    this.startupReadiness.resetDismiss();
    this.startupReadiness.startPolling();
    this.readinessSub = this.startupReadiness.state$.subscribe(state => {
      this.readinessState = state;
    });
  }

  ngOnDestroy(): void {
    this.readinessSub?.unsubscribe();
    this.readinessSub = null;
    this.startupReadiness.stop();
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
