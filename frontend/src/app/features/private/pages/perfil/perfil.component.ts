import { Component } from '@angular/core';

@Component({
  selector: 'app-perfil',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-person-badge-fill me-2 text-primary"></i>Perfil Profesional</h4>
        <span class="text-muted small">Define los perfiles laborales que buscas y tu disponibilidad</span>
      </div>
      <button class="btn btn-primary btn-sm">
        <i class="bi bi-plus-circle me-1"></i>Agregar perfil
      </button>
    </div>

    <!-- Resumen profesional -->
    <div class="seccion-card mb-4">
      <div class="seccion-titulo"><i class="bi bi-file-text-fill"></i>Resumen profesional</div>
      <div class="seccion-subtitulo">Descripción corta que aparece en la cabecera de tu CV público</div>
      <textarea class="form-control" rows="4"
        placeholder="Describe brevemente tu perfil profesional, experiencia principal y objetivos..."></textarea>
      <div class="text-end mt-3">
        <button class="btn btn-primary px-4">
          <i class="bi bi-floppy-fill me-2"></i>Guardar
        </button>
      </div>
    </div>

    <!-- Perfiles laborales -->
    <div class="seccion-card mb-4">
      <div class="seccion-titulo"><i class="bi bi-briefcase-fill"></i>Perfiles laborales</div>
      <div class="seccion-subtitulo">Cargos e industrias en los que tienes experiencia o interés</div>

      <div class="border rounded-3 p-3 mb-3" style="border-color:#2c7be5!important;box-shadow:0 0 0 4px rgba(44,123,229,.08);">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div>
            <span class="fw-bold">Frontend Developer</span>
            <span class="ms-2 badge" style="background:#d1fae5;color:#065f46;font-size:.7rem;border-radius:20px;padding:3px 10px;">
              <i class="bi bi-check-circle-fill me-1"></i>Activo
            </span>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary btn-sm"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-outline-danger btn-sm"><i class="bi bi-trash"></i></button>
          </div>
        </div>
        <div class="row g-2">
          <div class="col-md-6">
            <small class="text-muted d-block">Salario mínimo</small>
            <strong>$4.500.000 COP</strong>
          </div>
          <div class="col-md-6">
            <small class="text-muted d-block">Modalidad</small>
            <strong>Remoto / Híbrido</strong>
          </div>
        </div>
      </div>

      <div class="border rounded-3 p-3" style="border-color:#e9ecef;">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div>
            <span class="fw-bold">Fullstack Developer</span>
            <span class="ms-2 badge" style="background:#f1f5f9;color:#94a3b8;font-size:.7rem;border-radius:20px;padding:3px 10px;">
              Inactivo
            </span>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary btn-sm"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-outline-danger btn-sm"><i class="bi bi-trash"></i></button>
          </div>
        </div>
      </div>
    </div>

    <!-- Disponibilidad -->
    <div class="seccion-card">
      <div class="seccion-titulo"><i class="bi bi-calendar-check-fill"></i>Disponibilidad</div>
      <div class="seccion-subtitulo">Tu disponibilidad para iniciar un nuevo empleo</div>
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label">Disponibilidad para iniciar</label>
          <select class="form-select">
            <option>Inmediata</option>
            <option>15 días</option>
            <option>1 mes</option>
            <option>Más de 1 mes</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">Disponibilidad para viajar</label>
          <select class="form-select">
            <option>No disponible</option>
            <option>Ocasionalmente</option>
            <option>Frecuentemente</option>
          </select>
        </div>
        <div class="col-12 text-end">
          <button class="btn btn-primary px-4">
            <i class="bi bi-floppy-fill me-2"></i>Guardar
          </button>
        </div>
      </div>
    </div>
  `
})
export class PerfilComponent { }
