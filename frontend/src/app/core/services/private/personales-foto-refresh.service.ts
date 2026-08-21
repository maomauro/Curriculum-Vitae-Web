import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Cuando el usuario sube o quita su foto de perfil en Datos Personales, el avatar del
 * sidebar debe volver a consultar el API; este servicio coordina ese refresco sin
 * acoplar componentes (mismo patrón que AlertasConteoRefreshService).
 */
@Injectable({ providedIn: 'root' })
export class PersonalesFotoRefreshService {
  private readonly refreshRequested = new Subject<void>();

  /** Suscribirse para repetir la carga de la foto de perfil actual. */
  readonly refreshRequested$ = this.refreshRequested.asObservable();

  requestRefresh(): void {
    this.refreshRequested.next();
  }
}
