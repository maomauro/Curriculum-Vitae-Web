import { Component } from '@angular/core';

@Component({
  selector: 'app-educacion',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-mortarboard-fill me-2 text-primary"></i>Educación</h4>
        <span class="text-muted small">Títulos, certificaciones y formación académica</span>
      </div>
      <button class="btn btn-primary btn-sm" (click)="agregar()">
        <i class="bi bi-plus-circle me-1"></i>Agregar educación
      </button>
    </div>

    <!-- Lista de estudios -->
    <div *ngFor="let edu of estudios; let i = index">
      <div class="bg-white rounded-3 shadow-sm mb-3 overflow-hidden">
        <div class="p-4 d-flex align-items-center gap-3" style="cursor:pointer;"
             (click)="edu.expanded = !edu.expanded">
          <!-- Ícono por tipo -->
          <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
               style="width:44px;height:44px;font-size:1.1rem;"
               [style.background]="iconoBg(edu.tipo)"
               [style.color]="iconoColor(edu.tipo)">
            <i class="bi" [ngClass]="icono(edu.tipo)"></i>
          </div>
          <div class="flex-grow-1">
            <div class="fw-bold" style="font-size:.95rem;">{{ edu.titulo }}</div>
            <div style="font-size:.85rem;color:#6c757d;">{{ edu.institucion }}</div>
          </div>
          <span class="text-muted small me-3">{{ edu.anio }}</span>
          <span class="badge" style="background:#f1f5f9;color:#6c757d;font-size:.7rem;border-radius:12px;padding:3px 10px;">
            {{ labelTipo(edu.tipo) }}
          </span>
          <i class="bi ms-2" [class.bi-chevron-down]="!edu.expanded"
             [class.bi-chevron-up]="edu.expanded" style="color:#adb5bd;"></i>
        </div>

        <div *ngIf="edu.expanded" class="px-4 pb-4" style="border-top:1px solid #f0f0f0;">
          <div class="row g-3 mt-1">
            <div class="col-md-6">
              <label class="form-label">Título / Certificación</label>
              <input type="text" class="form-control" [value]="edu.titulo">
            </div>
            <div class="col-md-6">
              <label class="form-label">Institución</label>
              <input type="text" class="form-control" [value]="edu.institucion">
            </div>
            <div class="col-md-4">
              <label class="form-label">Tipo</label>
              <select class="form-select" [(ngModel)]="edu.tipo">
                <option value="posgrado">Posgrado / Máster</option>
                <option value="pregrado">Pregrado / Grado</option>
                <option value="tecnico">Técnico / FP</option>
                <option value="certificacion">Certificación</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Año de graduación</label>
              <input type="number" class="form-control" [value]="edu.anio" min="1980" max="2099">
            </div>
            <div class="col-md-4">
              <label class="form-label">Modalidad</label>
              <select class="form-select">
                <option>Presencial</option>
                <option>Online</option>
                <option>Semipresencial</option>
              </select>
            </div>
            <div class="col-12 d-flex justify-content-end gap-2 pt-2"
                 style="border-top:1px solid #f0f0f0;">
              <button class="btn btn-outline-danger btn-sm">
                <i class="bi bi-trash me-1"></i>Eliminar
              </button>
              <button class="btn btn-primary btn-sm">
                <i class="bi bi-floppy-fill me-1"></i>Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EducacionComponent {
  estudios = [
    { titulo: 'Máster en Ingeniería del Software', institucion: 'Universidad Politécnica de Madrid',
      tipo: 'posgrado', anio: 2019, expanded: false },
    { titulo: 'Grado en Ingeniería Informática', institucion: 'Universidad de Madrid',
      tipo: 'pregrado', anio: 2017, expanded: false },
    { titulo: 'AWS Solutions Architect Associate', institucion: 'Amazon Web Services',
      tipo: 'certificacion', anio: 2023, expanded: false },
  ];

  icono(tipo: string): string {
    const map: Record<string, string> = {
      posgrado: 'bi-award-fill', pregrado: 'bi-book-fill',
      tecnico: 'bi-tools', certificacion: 'bi-patch-check-fill'
    };
    return map[tipo] ?? 'bi-mortarboard-fill';
  }

  iconoBg(tipo: string): string {
    const map: Record<string, string> = {
      posgrado: '#f3e8ff', pregrado: '#ebf2ff',
      tecnico: '#d1fae5', certificacion: '#fef9c3'
    };
    return map[tipo] ?? '#f1f5f9';
  }

  iconoColor(tipo: string): string {
    const map: Record<string, string> = {
      posgrado: '#7c3aed', pregrado: '#2c7be5',
      tecnico: '#065f46', certificacion: '#92400e'
    };
    return map[tipo] ?? '#6c757d';
  }

  labelTipo(tipo: string): string {
    const map: Record<string, string> = {
      posgrado: 'Posgrado', pregrado: 'Pregrado',
      tecnico: 'Técnico', certificacion: 'Certificación'
    };
    return map[tipo] ?? tipo;
  }

  agregar(): void {
    this.estudios.push({ titulo: '', institucion: '', tipo: 'pregrado', anio: new Date().getFullYear(), expanded: true });
  }
}
