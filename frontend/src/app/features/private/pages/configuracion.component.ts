import { Component } from '@angular/core';

@Component({
  selector: 'app-configuracion',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-gear-fill me-2 text-primary"></i>Configuración</h4>
        <span class="text-muted small">Privacidad, visibilidad del CV y ajustes de cuenta</span>
      </div>
    </div>

    <!-- Visibilidad del CV -->
    <div class="seccion-card">
      <div class="seccion-titulo">Visibilidad de campos del CV</div>
      <p class="text-muted small mb-3">Controla qué información es visible públicamente en tu perfil.</p>
      <div class="d-flex flex-column gap-2">
        <div *ngFor="let campo of camposVisibilidad"
             class="d-flex align-items-center justify-content-between p-3 rounded-3"
             style="background:#f8faff;border:1px solid #e4effd;">
          <div class="d-flex align-items-center gap-2">
            <i class="bi" [ngClass]="campo.icono" style="color:#2c7be5;font-size:1rem;"></i>
            <span style="font-size:.9rem;font-weight:500;">{{ campo.label }}</span>
          </div>
          <div class="form-check form-switch mb-0">
            <input class="form-check-input" type="checkbox" role="switch"
                   [(ngModel)]="campo.visible" [id]="'vis_'+campo.key"
                   style="cursor:pointer;">
          </div>
        </div>
      </div>
    </div>

    <!-- URL pública del CV -->
    <div class="seccion-card">
      <div class="seccion-titulo">URL pública del CV</div>
      <p class="text-muted small mb-3">Comparte este enlace para que otros puedan ver tu CV.</p>
      <div class="d-flex flex-column flex-sm-row gap-2">
        <div class="input-group">
          <span class="input-group-text">
            <i class="bi bi-link-45deg text-primary"></i>
          </span>
          <input type="text" class="form-control" [value]="urlCv" readonly>
        </div>
        <div class="d-flex gap-2 flex-shrink-0">
          <button class="btn btn-outline-primary btn-sm px-3" (click)="copiarUrl()">
            <i class="bi bi-clipboard me-1"></i>
            {{ copiado ? '¡Copiado!' : 'Copiar' }}
          </button>
          <button class="btn btn-primary btn-sm px-3">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Cambio de contraseña -->
    <div class="seccion-card">
      <div class="seccion-titulo">Cambiar contraseña</div>
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label">Contraseña actual</label>
          <input type="password" class="form-control">
        </div>
        <div class="col-md-4">
          <label class="form-label">Nueva contraseña</label>
          <input type="password" class="form-control">
        </div>
        <div class="col-md-4">
          <label class="form-label">Repetir nueva contraseña</label>
          <input type="password" class="form-control">
        </div>
        <div class="col-12">
          <button class="btn btn-primary btn-sm">
            <i class="bi bi-shield-lock me-1"></i>Actualizar contraseña
          </button>
        </div>
      </div>
    </div>

    <!-- Zona peligrosa -->
    <div class="seccion-card" style="border-color:#fecaca;">
      <div class="seccion-titulo" style="color:#dc3545;">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>Zona de peligro
      </div>
      <p class="text-muted small mb-3">
        Estas acciones son irreversibles. Procede con cautela.
      </p>
      <div class="d-flex flex-column flex-sm-row gap-2">
        <button class="btn btn-outline-warning btn-sm">
          <i class="bi bi-eye-slash me-1"></i>Hacer perfil privado
        </button>
        <button class="btn btn-outline-danger btn-sm">
          <i class="bi bi-trash me-1"></i>Eliminar mi cuenta
        </button>
      </div>
    </div>
  `
})
export class ConfiguracionComponent {
  urlCv = 'https://portalcv.app/cv/ana-garcia-martinez';
  copiado = false;

  camposVisibilidad = [
    { key: 'email', label: 'Correo electrónico', icono: 'bi-envelope-fill', visible: false },
    { key: 'telefono', label: 'Teléfono', icono: 'bi-phone-fill', visible: false },
    { key: 'ubicacion', label: 'Ciudad / Ubicación', icono: 'bi-geo-alt-fill', visible: true },
    { key: 'salario', label: 'Pretensión salarial', icono: 'bi-cash-stack', visible: false },
    { key: 'experiencia', label: 'Experiencia laboral', icono: 'bi-briefcase-fill', visible: true },
    { key: 'educacion', label: 'Educación', icono: 'bi-mortarboard-fill', visible: true },
    { key: 'habilidades', label: 'Habilidades', icono: 'bi-stars', visible: true },
    { key: 'proyectos', label: 'Proyectos', icono: 'bi-kanban-fill', visible: true },
  ];

  copiarUrl(): void {
    navigator.clipboard.writeText(this.urlCv);
    this.copiado = true;
    setTimeout(() => (this.copiado = false), 2000);
  }
}
