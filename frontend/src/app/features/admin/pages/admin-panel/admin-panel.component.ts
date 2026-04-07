import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-panel',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4>
          <i class="bi bi-shield-fill-check me-2" style="color:#dc3545;"></i>
          Panel de Administración
        </h4>
        <span class="text-muted small">Vista global del sistema: usuarios, CVs y actividad reciente</span>
      </div>
    </div>

    <!-- Métricas -->
    <div class="row g-3 mb-4">
      <div class="col-md-3" *ngFor="let m of metricas">
        <div class="bg-white rounded-3 shadow-sm p-4 d-flex align-items-center gap-3">
          <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
               style="width:48px;height:48px;"
               [style.background]="m.bg" [style.color]="m.color">
            <i class="bi" [ngClass]="m.icono" style="font-size:1.2rem;"></i>
          </div>
          <div>
            <div style="font-size:1.4rem;font-weight:700;line-height:1;">{{ m.valor }}</div>
            <div class="text-muted" style="font-size:.8rem;">{{ m.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de usuarios recientes -->
    <div class="seccion-card">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div class="seccion-titulo mb-0">Usuarios recientes</div>
        <input type="text" class="form-control form-control-sm w-auto"
               placeholder="Buscar usuario..." style="min-width:200px;">
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead style="background:#f8faff;">
            <tr>
              <th style="font-size:.8rem;color:#6c757d;font-weight:600;">USUARIO</th>
              <th style="font-size:.8rem;color:#6c757d;font-weight:600;">EMAIL</th>
              <th style="font-size:.8rem;color:#6c757d;font-weight:600;">REGISTRO</th>
              <th style="font-size:.8rem;color:#6c757d;font-weight:600;">ESTADO</th>
              <th style="font-size:.8rem;color:#6c757d;font-weight:600;"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of usuarios">
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="avatar-circle avatar-circle-sm blue">{{ u.iniciales }}</div>
                  <span class="fw-semibold" style="font-size:.9rem;">{{ u.nombre }}</span>
                </div>
              </td>
              <td style="font-size:.85rem;color:#6c757d;">{{ u.email }}</td>
              <td style="font-size:.85rem;color:#6c757d;">{{ u.registro }}</td>
              <td>
                <span class="badge rounded-pill"
                      [style.background]="u.activo ? '#d1fae5' : '#fee2e2'"
                      [style.color]="u.activo ? '#065f46' : '#991b1b'"
                      style="font-size:.72rem;padding:4px 10px;">
                  {{ u.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-secondary">
                  <i class="bi bi-three-dots"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Actividad del sistema -->
    <div class="seccion-card">
      <div class="seccion-titulo">Actividad reciente del sistema</div>
      <div class="d-flex flex-column gap-2">
        <div *ngFor="let ev of actividad"
             class="d-flex align-items-start gap-3 p-3 rounded-3"
             style="background:#f8faff;">
          <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
               style="width:32px;height:32px;"
               [style.background]="ev.bg" [style.color]="ev.color">
            <i class="bi" [ngClass]="ev.icono" style="font-size:.8rem;"></i>
          </div>
          <div class="flex-grow-1">
            <span style="font-size:.85rem;" [innerHTML]="ev.mensaje"></span>
          </div>
          <span class="text-muted" style="font-size:.75rem;white-space:nowrap;">{{ ev.tiempo }}</span>
        </div>
      </div>
    </div>
  `
})
export class AdminPanelComponent {
  metricas = [
    { label: 'Usuarios registrados', valor: '1.248', icono: 'bi-people-fill', bg: '#ebf2ff', color: '#2c7be5' },
    { label: 'CVs publicados', valor: '934', icono: 'bi-file-earmark-person-fill', bg: '#d1fae5', color: '#065f46' },
    { label: 'Contactos recibidos', valor: '156', icono: 'bi-envelope-fill', bg: '#fef9c3', color: '#92400e' },
    { label: 'Descargas este mes', valor: '412', icono: 'bi-download', bg: '#ede9fe', color: '#5b21b6' },
  ];

  usuarios = [
    { nombre: 'Ana García', email: 'ana@example.com', iniciales: 'AG', registro: '12/01/2025', activo: true },
    { nombre: 'Carlos López', email: 'carlos@example.com', iniciales: 'CL', registro: '08/01/2025', activo: true },
    { nombre: 'María Sánchez', email: 'maria@example.com', iniciales: 'MS', registro: '03/01/2025', activo: false },
    { nombre: 'Pedro Ruiz', email: 'pedro@example.com', iniciales: 'PR', registro: '28/12/2024', activo: true },
  ];

  actividad = [
    { mensaje: '<strong>Ana García</strong> actualizó su experiencia laboral', tiempo: 'hace 5 min', icono: 'bi-pencil-fill', bg: '#ebf2ff', color: '#2c7be5' },
    { mensaje: '<strong>Carlos López</strong> descargó su CV en PDF', tiempo: 'hace 18 min', icono: 'bi-download', bg: '#ede9fe', color: '#5b21b6' },
    { mensaje: 'Nuevo usuario <strong>María Sánchez</strong> se registró', tiempo: 'hace 32 min', icono: 'bi-person-plus-fill', bg: '#d1fae5', color: '#065f46' },
    { mensaje: '<strong>Pedro Ruiz</strong> recibió un mensaje de contacto', tiempo: 'hace 1 h', icono: 'bi-envelope-fill', bg: '#fef9c3', color: '#92400e' },
  ];
}
