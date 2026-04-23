import { Component, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthModalService } from './core/services/auth/auth-modal.service';
import { SessionIdleTimeoutService } from './core/services/auth/session-idle-timeout.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('portalcv-web');
  private readonly router = inject(Router);
  private readonly authModal = inject(AuthModalService);
  /** Inactividad → cierre de sesión en cliente (10 min); instancia el servicio `providedIn: 'root'`. */
  private readonly _sessionIdle = inject(SessionIdleTimeoutService);

  ngOnInit(): void {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.aplicarAuthModalDesdeQuery());
  }

  /** Tras cerrar sesión o guard: `/?authModal=login|register|recuperar` abre el modal y limpia la URL. */
  private aplicarAuthModalDesdeQuery(): void {
    const raw = this.router.parseUrl(this.router.url).queryParams['authModal'];
    if (!raw || typeof raw !== 'string') return;
    const v = raw.trim().toLowerCase();
    if (v === 'register') {
      this.authModal.openRegister();
    } else if (v === 'recuperar' || v === 'recuperar-contrasena') {
      this.authModal.openRecuperar();
    } else {
      this.authModal.openLogin();
    }
    void this.router.navigate(['/'], { replaceUrl: true });
  }
}
