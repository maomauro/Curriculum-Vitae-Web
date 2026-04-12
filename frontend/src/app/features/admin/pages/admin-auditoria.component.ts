import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-auditoria',
  standalone: false,
  template: `
    <div class="page-header">
      <div>
        <h4>
          <i class="bi bi-journal-text me-2 text-primary"></i>
          Auditoría
        </h4>
        <span class="text-muted small">
          Registro de acciones administrativas (pendiente de API en backend).
        </span>
      </div>
    </div>

    <div class="seccion-card text-center py-5">
      <i class="bi bi-hourglass-split text-muted display-4 d-block"></i>
      <p class="text-muted mt-3 mb-1 fw-semibold">Módulo en preparación</p>
      <p class="text-muted small mb-0 mx-auto" style="max-width: 420px">
        Aquí se mostrará el historial de cambios (roles, estados de usuario, etc.) cuando exista el
        endpoint correspondiente. La navegación y permisos por rol ya están alineados con el modelo
        Visitante / Publicador / Admin.
      </p>
    </div>
  `,
})
export class AdminAuditoriaComponent {}
