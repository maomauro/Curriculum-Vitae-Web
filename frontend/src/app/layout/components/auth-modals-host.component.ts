import { Component, HostListener, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthModalService, type AuthModalKind } from '../../core/services/auth/auth-modal.service';

@Component({
  selector: 'app-auth-modals-host',
  standalone: false,
  template: `
    <ng-container *ngIf="kind() !== 'none'">
      <div class="portal-modal__backdrop" aria-hidden="true" (click)="cerrar()"></div>
      <div
        class="modal show d-block portal-modal__root"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="tituloId"
        (click)="cerrarSiBackdrop($event)">
        <div
          class="modal-dialog modal-dialog-centered modal-dialog-scrollable portal-modal__dialog"
          [class.portal-modal__dialog--wide]="kind() === 'register'">
          <div class="modal-content portal-modal__panel">
            <div class="modal-header portal-modal__header">
              <div class="portal-modal__title-row">
                <span class="portal-modal__icon" aria-hidden="true">
                  <i
                    class="bi"
                    [ngClass]="{
                      'bi-box-arrow-in-right': kind() === 'login',
                      'bi-person-plus': kind() === 'register',
                      'bi-key': kind() === 'recuperar'
                    }"></i>
                </span>
                <div>
                  <h2 class="portal-modal__title" [id]="tituloId">
                    <ng-container [ngSwitch]="kind()">
                      <span *ngSwitchCase="'login'">Iniciar sesión</span>
                      <span *ngSwitchCase="'register'">Crear cuenta</span>
                      <span *ngSwitchCase="'recuperar'">Recuperar contraseña</span>
                    </ng-container>
                  </h2>
                  <span class="portal-modal__subtitle" *ngIf="kind() === 'login'">
                    Accede a tu panel para editar y publicar tu CV.
                  </span>
                  <span class="portal-modal__subtitle" *ngIf="kind() === 'register'">
                    Registro gratuito. Podrás publicar tu perfil cuando quieras.
                  </span>
                  <span class="portal-modal__subtitle" *ngIf="kind() === 'recuperar'">
                    Te enviaremos instrucciones si el correo está registrado.
                  </span>
                </div>
              </div>
              <button
                type="button"
                class="btn-close portal-modal__close"
                aria-label="Cerrar"
                (click)="cerrar()"></button>
            </div>
            <div class="modal-body portal-modal__body auth-modal-embed">
              <app-login *ngIf="kind() === 'login'" [embedModal]="true"></app-login>
              <app-register *ngIf="kind() === 'register'" [embedModal]="true"></app-register>
              <app-recuperar-contrasena *ngIf="kind() === 'recuperar'" [embedModal]="true"></app-recuperar-contrasena>
            </div>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styleUrls: ['./auth-modals-host.component.scss'],
})
export class AuthModalsHostComponent {
  private readonly authModal = inject(AuthModalService);
  readonly tituloId = 'authModalTitulo';
  readonly kind = toSignal(this.authModal.kind$, { initialValue: 'none' as AuthModalKind });

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.kind() !== 'none') {
      this.cerrar();
    }
  }

  cerrar(): void {
    this.authModal.close();
  }

  cerrarSiBackdrop(ev: MouseEvent): void {
    if (ev.target === ev.currentTarget) {
      this.cerrar();
    }
  }
}
