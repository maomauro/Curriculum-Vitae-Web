import { Component } from '@angular/core';

@Component({
  selector: 'app-experiencia',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-briefcase-fill me-2 text-primary"></i>Experiencia Laboral</h4>
        <span class="text-muted small">Historial de empleos, cargos y referencias laborales</span>
      </div>
      <button class="btn btn-primary btn-sm" (click)="agregar()">
        <i class="bi bi-plus-circle me-1"></i>Agregar experiencia
      </button>
    </div>

    <!-- Lista de empleos -->
    <div *ngFor="let job of empleos; let i = index">
      <div class="bg-white rounded-3 shadow-sm mb-3 overflow-hidden">
        <!-- Cabecera del card -->
        <div class="p-4 d-flex align-items-center gap-3" style="cursor:pointer;"
             (click)="job.expanded = !job.expanded">
          <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
               style="width:44px;height:44px;background:#ebf2ff;color:#2c7be5;font-size:1.1rem;">
            <i class="bi bi-building"></i>
          </div>
          <div class="flex-grow-1">
            <div class="fw-bold" style="font-size:.95rem;">{{ job.cargo }}</div>
            <div style="font-size:.85rem;color:#2c7be5;font-weight:600;">{{ job.empresa }}</div>
          </div>
          <span class="text-muted small me-3">{{ job.periodo }}</span>
          <span class="badge" [style.background]="job.actual ? '#d1fae5' : '#f1f5f9'"
                [style.color]="job.actual ? '#065f46' : '#6c757d'"
                style="font-size:.7rem;border-radius:12px;padding:3px 10px;">
            {{ job.actual ? 'Actual' : 'Finalizado' }}
          </span>
          <i class="bi ms-2" [class.bi-chevron-down]="!job.expanded"
             [class.bi-chevron-up]="job.expanded" style="color:#adb5bd;"></i>
        </div>

        <!-- Cuerpo expandible -->
        <div *ngIf="job.expanded" class="px-4 pb-4" style="border-top:1px solid #f0f0f0;">
          <div class="row g-3 mt-1">
            <div class="col-md-6">
              <label class="form-label">Empresa</label>
              <input type="text" class="form-control" [value]="job.empresa">
            </div>
            <div class="col-md-6">
              <label class="form-label">Cargo</label>
              <input type="text" class="form-control" [value]="job.cargo">
            </div>
            <div class="col-md-3">
              <label class="form-label">Fecha inicio</label>
              <input type="date" class="form-control">
            </div>
            <div class="col-md-3">
              <label class="form-label">Fecha fin</label>
              <input type="date" class="form-control" [disabled]="job.actual">
            </div>
            <div class="col-md-3 d-flex align-items-end">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" [(ngModel)]="job.actual"
                       [id]="'actual_'+i">
                <label class="form-check-label" [for]="'actual_'+i">Trabajo actual</label>
              </div>
            </div>
            <div class="col-12">
              <label class="form-label">Descripción de funciones</label>
              <textarea class="form-control" rows="3" [value]="job.descripcion"></textarea>
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
export class ExperienciaComponent {
  empleos = [
    { empresa: 'Accenture España', cargo: 'Senior Frontend Developer',
      periodo: 'Ene 2022 — Actualidad', actual: true,
      descripcion: 'Desarrollo de aplicaciones SPA con Angular 16+ para clientes del sector bancario.',
      expanded: false },
    { empresa: 'Indra Sistemas', cargo: 'Frontend Developer',
      periodo: 'Mar 2019 — Dic 2021', actual: false,
      descripcion: 'Migración de aplicaciones legacy a Angular. Integración con APIs REST.',
      expanded: false },
  ];

  agregar(): void {
    this.empleos.push({ empresa: '', cargo: '', periodo: '', actual: false, descripcion: '', expanded: true });
  }
}
