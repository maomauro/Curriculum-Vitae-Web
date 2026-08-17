import { Component, HostListener, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthModalService, type AuthModalKind } from '../../core/services/auth/auth-modal.service';

@Component({
  selector: 'app-auth-modals-host',
  standalone: false,
  templateUrl: './auth-modals-host.component.html',
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

  cerrarSiBackdrop(ev: MouseEvent | KeyboardEvent): void {
    if (ev.target === ev.currentTarget) {
      this.cerrar();
    }
  }
}
