import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { StartupReadinessService, type DbReadinessState } from '../../core/services/startup-readiness.service';

@Component({
  selector: 'app-startup-readiness-host',
  standalone: false,
  template: `
    <ng-container *ngIf="visible()">
      <div class="portal-modal__backdrop" aria-hidden="true"></div>
      <div
        class="modal show d-block portal-modal__root"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="tituloId">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable portal-modal__dialog">
          <div class="modal-content portal-modal__panel">
            <div class="modal-header portal-modal__header">
              <div class="portal-modal__title-row w-100">
                <span class="portal-modal__icon" aria-hidden="true">
                  <i class="bi bi-hand-thumbs-up"></i>
                </span>
                <div class="flex-grow-1">
                  <h2 class="portal-modal__title" [id]="tituloId">
                    Bienvenido a PortalCV
                  </h2>
                  <span class="portal-modal__subtitle">
                    Estamos preparando tu conexión segura con el servidor. Esto puede tardar unos segundos si la base de datos estaba en reposo.
                  </span>
                </div>
                <div class="startup-readiness__status ms-2 text-end" [attr.aria-live]="'polite'">
                  <div class="startup-readiness__label small text-white-50">Base de datos</div>
                  <div class="startup-readiness__pill" [ngClass]="pillClass()">
                    <span class="startup-readiness__dot" aria-hidden="true"></span>
                    <span>{{ pillText() }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-body portal-modal__body">
              <p class="mb-3">
                PortalCV es un espacio para explorar CVs públicos y, si creas cuenta, administrar tu perfil profesional.
                Mientras el servicio termina de despertar, puedes leer este instructivo breve:
              </p>
              <ul class="small mb-3">
                <li><strong>Explorar:</strong> usa el buscador para ver CVs publicados.</li>
                <li><strong>Registrarte:</strong> crea una cuenta para acceder al panel privado.</li>
                <li><strong>Privacidad:</strong> no compartas tu contraseña; cierra sesión en equipos compartidos.</li>
              </ul>
              <div class="alert alert-info border-0 border-start border-4 border-primary mb-0" role="note">
                <strong>Nota.</strong> Si el indicador pasa a “En espera” o “Revisar”, espera unos segundos y reintenta;
                en planes gratuitos de Azure SQL es normal un arranque lento tras inactividad.
              </div>
            </div>
            <div class="modal-footer portal-modal__footer d-flex flex-wrap gap-2 justify-content-between">
              <button type="button" class="btn btn-link btn-sm text-secondary px-0" (click)="continuarDeTodasFormas()">
                Continuar de todas formas
              </button>
              <div class="d-flex gap-2 ms-auto">
                <button
                  *ngIf="state() === 'degraded'"
                  type="button"
                  class="btn btn-outline-secondary btn-sm"
                  (click)="reintentar()">
                  Reintentar
                </button>
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  [disabled]="state() !== 'ready'"
                  (click)="entrar()">
                  Entrar al portal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styleUrls: ['./startup-readiness-host.component.scss'],
})
export class StartupReadinessHostComponent implements OnInit, OnDestroy {
  private readonly readiness = inject(StartupReadinessService);

  readonly tituloId = 'startupReadinessTitulo';

  readonly state = toSignal(this.readiness.state$, { initialValue: 'checking' as DbReadinessState });
  readonly dismissed = toSignal(this.readiness.dismissed$, { initialValue: false });

  ngOnInit(): void {
    this.readiness.resetDismiss();
    this.readiness.startPolling();
  }

  ngOnDestroy(): void {
    this.readiness.stop();
  }

  visible(): boolean {
    return !this.dismissed() && this.state() !== 'ready';
  }

  pillText(): string {
    switch (this.state()) {
      case 'ready':
        return 'Lista';
      case 'degraded':
        return 'Revisar';
      default:
        return 'En espera';
    }
  }

  pillClass(): string {
    switch (this.state()) {
      case 'ready':
        return 'startup-readiness__pill--ok';
      case 'degraded':
        return 'startup-readiness__pill--warn';
      default:
        return 'startup-readiness__pill--pending';
    }
  }

  entrar(): void {
    this.readiness.stop();
    this.readiness.dismiss();
  }

  continuarDeTodasFormas(): void {
    this.readiness.dismiss();
  }

  reintentar(): void {
    this.readiness.startPolling();
  }
}
