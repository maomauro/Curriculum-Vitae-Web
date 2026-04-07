import { Component } from '@angular/core';

@Component({
  selector: 'app-alertas',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-bell-fill me-2 text-primary"></i>Alertas privadas</h4>
        <span class="text-muted small">Notificaciones de actividad en tu CV — Solo tú puedes verlas</span>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm">
          <i class="bi bi-check2-all me-1"></i>Marcar todas como leídas
        </button>
        <button class="btn btn-outline-danger btn-sm">
          <i class="bi bi-trash3 me-1"></i>Limpiar leídas
        </button>
      </div>
    </div>

    <!-- Resumen -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-md-3">
        <div class="bg-white rounded-3 p-3 shadow-sm text-center">
          <div class="fw-bold fs-4 text-primary">5</div>
          <div class="text-muted small">No leídas</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="bg-white rounded-3 p-3 shadow-sm text-center">
          <div class="fw-bold fs-4" style="color:#2c7be5;">3</div>
          <div class="text-muted small">Contactos nuevos</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="bg-white rounded-3 p-3 shadow-sm text-center">
          <div class="fw-bold fs-4 text-success">8</div>
          <div class="text-muted small">Vistas hoy</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="bg-white rounded-3 p-3 shadow-sm text-center">
          <div class="fw-bold fs-4 text-warning">2</div>
          <div class="text-muted small">Descargas PDF</div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-3 p-3 shadow-sm mb-4 d-flex flex-wrap gap-2 align-items-center">
      <span class="fw-semibold small text-muted">Filtrar por:</span>
      <div class="btn-group btn-group-sm">
        <button class="btn btn-primary" [class.btn-primary]="filtro==='todas'"
                [class.btn-outline-secondary]="filtro!=='todas'" (click)="filtro='todas'">
          Todas (12)
        </button>
        <button class="btn" [class.btn-primary]="filtro==='noleidas'"
                [class.btn-outline-secondary]="filtro!=='noleidas'" (click)="filtro='noleidas'">
          No leídas (5)
        </button>
      </div>
      <select class="form-select form-select-sm" style="width:auto;" [(ngModel)]="tipo">
        <option value="">Tipo: Todos</option>
        <option value="contact">Contactos recibidos</option>
        <option value="view">Vistas del CV</option>
        <option value="download">Descargas</option>
        <option value="system">Sistema</option>
      </select>
    </div>

    <!-- Lista de alertas -->
    <div class="alert-item unread type-contact">
      <div class="alert-icon contact"><i class="bi bi-envelope-fill"></i></div>
      <div class="alert-body">
        <div class="alert-title">Nuevo mensaje de contacto recibido</div>
        <div class="alert-desc">
          <strong>Juan Pérez</strong> de <strong>Consulting Partners SL</strong> te envió un mensaje.
        </div>
        <div class="alert-meta">
          <span><i class="bi bi-clock me-1"></i>Hace 15 minutos</span>
          <span><i class="bi bi-envelope me-1"></i>juan.perez@consulting.com</span>
          <a href="#" class="text-primary fw-semibold">Ver mensaje →</a>
        </div>
      </div>
      <div class="unread-dot"></div>
    </div>

    <div class="alert-item unread type-download">
      <div class="alert-icon download"><i class="bi bi-file-earmark-arrow-down-fill"></i></div>
      <div class="alert-body">
        <div class="alert-title">Tu CV fue descargado en PDF</div>
        <div class="alert-desc">Alguien desde <strong>Madrid, España</strong> descargó tu CV "Frontend Developer — 2026".</div>
        <div class="alert-meta">
          <span><i class="bi bi-clock me-1"></i>Hace 1 hora</span>
          <span><i class="bi bi-geo-alt me-1"></i>Madrid, España</span>
        </div>
      </div>
      <div class="unread-dot"></div>
    </div>

    <div class="alert-item unread type-view">
      <div class="alert-icon view"><i class="bi bi-eye-fill"></i></div>
      <div class="alert-body">
        <div class="alert-title">Tu CV fue visto 15+ veces hoy</div>
        <div class="alert-desc">Tu CV "Frontend Developer — 2026" superó las 15 visualizaciones en las últimas 24 horas.</div>
        <div class="alert-meta">
          <span><i class="bi bi-clock me-1"></i>Hace 4 horas</span>
          <span><i class="bi bi-graph-up me-1"></i>+120% vs. día anterior</span>
        </div>
      </div>
      <div class="unread-dot"></div>
    </div>

    <!-- Separador leídas -->
    <div class="d-flex align-items-center gap-3 my-4">
      <hr class="flex-grow-1">
      <span class="text-muted small fw-semibold">Alertas anteriores (leídas)</span>
      <hr class="flex-grow-1">
    </div>

    <div class="alert-item type-view">
      <div class="alert-icon view"><i class="bi bi-eye-fill"></i></div>
      <div class="alert-body">
        <div class="alert-title">CV visto desde Barcelona</div>
        <div class="alert-desc">Alguien desde <strong>Barcelona, España</strong> visitó tu CV.</div>
        <div class="alert-meta"><span><i class="bi bi-clock me-1"></i>Hace 2 días</span></div>
      </div>
      <div style="width:8px;"></div>
    </div>

    <div class="alert-item type-system">
      <div class="alert-icon system"><i class="bi bi-gear-fill"></i></div>
      <div class="alert-body">
        <div class="alert-title">CV publicado exitosamente</div>
        <div class="alert-desc">Tu CV "Fullstack Developer — 2026" ya es visible para todos los reclutadores.</div>
        <div class="alert-meta"><span><i class="bi bi-clock me-1"></i>Hace 3 días</span></div>
      </div>
      <div style="width:8px;"></div>
    </div>
  `
})
export class AlertasComponent {
  filtro = 'todas';
  tipo = '';
}
