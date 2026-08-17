import { Component, inject } from '@angular/core';
import { AuthModalService } from '../../core/services/auth/auth-modal.service';

@Component({
  selector: 'app-navbar-public',
  standalone: false,
  templateUrl: './navbar-public.component.html',
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
