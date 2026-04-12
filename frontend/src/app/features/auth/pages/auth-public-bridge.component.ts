import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthModalService } from '../../../core/services/auth/auth-modal.service';

/**
 * Rutas legadas /auth/login|register|recuperar: abre el modal en el portal público y vuelve al inicio.
 */
@Component({
  selector: 'app-auth-public-bridge',
  standalone: false,
  template: '',
})
export class AuthPublicBridgeComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authModal = inject(AuthModalService);

  ngOnInit(): void {
    const path = this.route.snapshot.routeConfig?.path ?? '';
    if (path === 'register') {
      this.authModal.openRegister();
    } else if (path === 'recuperar-contrasena') {
      this.authModal.openRecuperar();
    } else {
      this.authModal.openLogin();
    }
    void this.router.navigate(['/'], { replaceUrl: true });
  }
}
