import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from './auth.service';

/** Tiempo sin interacción del usuario antes de cerrar sesión en el cliente. */
const IDLE_MS = 10 * 60 * 1000;

/** Comprueba si se superó el umbral de inactividad. */
const CHECK_INTERVAL_MS = 15_000;

/**
 * Cierra la sesión en el SPA si el usuario autenticado deja de interactuar
 * con la página (clics, teclado, scroll, etc.). Independiente del cold start de SQL.
 *
 * El JWT actual sigue emitiéndose con caducidad larga en el backend; aquí solo se
 * limpia el almacenamiento local al vencer el tiempo de inactividad.
 */
@Injectable({ providedIn: 'root' })
export class SessionIdleTimeoutService implements OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private lastActivityAt = Date.now();
  private userSub: Subscription | null = null;
  private checkHandle: ReturnType<typeof setInterval> | null = null;
  private readonly boundMark = (): void => {
    this.lastActivityAt = Date.now();
  };

  constructor() {
    this.userSub = this.auth.currentUser$.subscribe(user => {
      if (user) {
        this.start();
      } else {
        this.stop();
      }
    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.userSub = null;
    this.stop();
  }

  private start(): void {
    this.lastActivityAt = Date.now();
    this.stopListenersOnly();
    this.zone.runOutsideAngular(() => {
      for (const type of ['click', 'keydown', 'scroll', 'touchstart', 'wheel'] as const) {
        document.addEventListener(type, this.boundMark, { capture: true, passive: true });
      }
    });
    if (this.checkHandle === null) {
      this.checkHandle = setInterval(() => this.zone.run(() => this.checkIdle()), CHECK_INTERVAL_MS);
    }
  }

  private stopListenersOnly(): void {
    this.zone.runOutsideAngular(() => {
      for (const type of ['click', 'keydown', 'scroll', 'touchstart', 'wheel'] as const) {
        document.removeEventListener(type, this.boundMark, { capture: true });
      }
    });
  }

  private stop(): void {
    this.stopListenersOnly();
    if (this.checkHandle !== null) {
      clearInterval(this.checkHandle);
      this.checkHandle = null;
    }
  }

  private checkIdle(): void {
    if (!this.auth.currentUser) {
      return;
    }
    if (Date.now() - this.lastActivityAt < IDLE_MS) {
      return;
    }
    this.stop();
    this.auth.logout();
    void this.router.navigate(['/'], { queryParams: { authModal: 'login' } });
  }
}
