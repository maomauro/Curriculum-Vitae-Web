import { Component, inject } from '@angular/core';
import { AuthModalService } from '../../core/services/auth/auth-modal.service';

@Component({
  selector: 'app-navbar-public',
  standalone: false,
  template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-white sticky-top shadow-sm cv-navbar-public">
      <div
        class="container cv-navbar-public-container d-flex align-items-center justify-content-between gap-2 flex-wrap flex-lg-nowrap">
        <a
          class="navbar-brand fw-bold text-primary d-flex align-items-center gap-1 mb-0 py-1 flex-shrink-0"
          routerLink="/"
          (click)="cerrarMenuMovil()">
          <i class="bi bi-file-earmark-person-fill"></i>PortalCV
        </a>

        <button
          class="navbar-toggler d-lg-none border-0 flex-shrink-0"
          type="button"
          (click)="toggleMenuMovil()"
          [attr.aria-expanded]="menuMovilAbierto"
          aria-controls="navbarPublic"
          aria-label="Abrir o cerrar menú">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div
          id="navbarPublic"
          class="collapse navbar-collapse cv-navbar-collapse w-100 flex-lg-grow-0 flex-lg-shrink-0 w-lg-auto order-3 order-lg-0 mt-0 align-self-lg-center"
          [class.show]="menuMovilAbierto">
          <div
            class="d-flex flex-column flex-lg-row flex-nowrap gap-2 mt-2 mt-lg-0 justify-content-lg-end">
            <button
              type="button"
              class="btn btn-outline-primary btn-sm px-3"
              (click)="abrirLogin()">
              Iniciar sesión
            </button>
            <button
              type="button"
              class="btn btn-primary btn-sm px-3"
              (click)="abrirRegistro()">
              Registrarse
            </button>
          </div>
        </div>
      </div>
    </nav>
  `,
  styleUrls: ['./navbar-public.component.scss'],
})
export class NavbarPublicComponent {
  private readonly authModal = inject(AuthModalService);

  /** En pantallas chicas controla la clase `show`; desde `lg` el CSS de Bootstrap deja el menú visible. */
  menuMovilAbierto = false;

  abrirLogin(): void {
    this.cerrarMenuMovil();
    this.authModal.openLogin();
  }

  abrirRegistro(): void {
    this.cerrarMenuMovil();
    this.authModal.openRegister();
  }

  toggleMenuMovil(): void {
    this.menuMovilAbierto = !this.menuMovilAbierto;
  }

  cerrarMenuMovil(): void {
    this.menuMovilAbierto = false;
  }
}
