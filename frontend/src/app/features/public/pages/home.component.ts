import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthModalService } from '../../../core/services/auth/auth-modal.service';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
})
export class HomeComponent {
  busqueda = '';

  private readonly router = inject(Router);
  private readonly authModal = inject(AuthModalService);

  abrirLogin(): void {
    this.authModal.openLogin();
  }

  abrirRegistro(): void {
    this.authModal.openRegister();
  }

  buscar(): void {
    const q = this.busqueda.trim();
    this.router.navigate(['/cvs'], {
      queryParams: q ? { q } : {},
    });
  }
}
