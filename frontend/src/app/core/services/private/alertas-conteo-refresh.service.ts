import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Cuando el usuario marca alertas/contactos como leídos, la campana y el badge del menú
 * deben volver a consultar el API; este servicio coordina ese refresco sin acoplar componentes.
 */
@Injectable({ providedIn: 'root' })
export class AlertasConteoRefreshService {
  private readonly refreshRequested = new Subject<void>();

  /** Suscribirse para repetir la carga del conteo de alertas no leídas. */
  readonly refreshRequested$ = this.refreshRequested.asObservable();

  requestRefresh(): void {
    this.refreshRequested.next();
  }
}
