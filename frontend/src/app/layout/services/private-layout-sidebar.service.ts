import { Injectable } from '@angular/core';

/**
 * Replica la lógica de PushMenu de AdminLTE 4 para SPAs donde el script global
 * corre antes de que exista `.app-sidebar` en el DOM.
 */
@Injectable()
export class PrivateLayoutSidebarService {
  readonly breakpoint = 992;

  toggle(): void {
    const body = document.body;
    const mobile = window.innerWidth <= this.breakpoint;
    if (body.classList.contains('sidebar-collapse')) {
      body.classList.remove('sidebar-collapse');
      if (mobile) {
        body.classList.add('sidebar-open');
      }
    } else {
      body.classList.remove('sidebar-open');
      body.classList.add('sidebar-collapse');
    }
  }

  /** Cierra drawer móvil (overlay). */
  closeMobileDrawer(): void {
    if (window.innerWidth > this.breakpoint) {
      return;
    }
    document.body.classList.remove('sidebar-open');
    document.body.classList.add('sidebar-collapse');
  }

  /** Alinea el estado con el ancho actual (p. ej. carga o resize). */
  syncWithViewport(): void {
    const body = document.body;
    const mobile = window.innerWidth <= this.breakpoint;
    if (mobile) {
      if (!body.classList.contains('sidebar-open')) {
        body.classList.add('sidebar-collapse');
      }
    } else {
      body.classList.remove('sidebar-open');
      body.classList.remove('sidebar-collapse');
    }
  }
}
