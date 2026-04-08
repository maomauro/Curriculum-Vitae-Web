import { Component, OnInit } from '@angular/core';
import { CvEditorService, ExperienciaDto, UpsertExperienciaRequest } from '../../../core/services/cv-editor.service';

interface ExperienciaUI extends ExperienciaDto {
  expanded: boolean;
  form: UpsertExperienciaRequest;
}

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

    <!-- Loading -->
    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Sin datos -->
    <div *ngIf="!loading && experiencias.length === 0" class="text-center py-5 text-muted">
      <i class="bi bi-briefcase display-5"></i>
      <p class="mt-3">No tienes experiencias registradas. Agrega la primera.</p>
    </div>

    <!-- Lista de experiencias -->
    <div *ngFor="let exp of experiencias; let i = index">
      <div class="bg-white rounded-3 shadow-sm mb-3 overflow-hidden">
        <!-- Cabecera del card -->
        <div class="p-4 d-flex align-items-center gap-3" style="cursor:pointer;"
             (click)="exp.expanded = !exp.expanded">
          <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
               style="width:44px;height:44px;background:#ebf2ff;color:#2c7be5;font-size:1.1rem;">
            <i class="bi bi-building"></i>
          </div>
          <div class="flex-grow-1">
            <div class="fw-bold" style="font-size:.95rem;">{{ exp.cargo }}</div>
            <div style="font-size:.85rem;color:#2c7be5;font-weight:600;">{{ exp.empresa }}</div>
          </div>
          <span class="text-muted small me-3">
            {{ exp.fechaInicio | date:'MMM yyyy' }} —
            {{ exp.esActual ? 'Actualidad' : (exp.fechaFin | date:'MMM yyyy') }}
          </span>
          <span class="badge" [style.background]="exp.esActual ? '#d1fae5' : '#f1f5f9'"
                [style.color]="exp.esActual ? '#065f46' : '#6c757d'"
                style="font-size:.7rem;border-radius:12px;padding:3px 10px;">
            {{ exp.esActual ? 'Actual' : 'Finalizado' }}
          </span>
          <i class="bi ms-2" [class.bi-chevron-down]="!exp.expanded"
             [class.bi-chevron-up]="exp.expanded" style="color:#adb5bd;"></i>
        </div>

        <!-- Cuerpo expandible -->
        <div *ngIf="exp.expanded" class="px-4 pb-4" style="border-top:1px solid #f0f0f0;">
          <div class="row g-3 mt-1">
            <div class="col-md-6">
              <label class="form-label">Empresa</label>
              <input type="text" class="form-control" [(ngModel)]="exp.form.empresa">
            </div>
            <div class="col-md-6">
              <label class="form-label">Cargo</label>
              <input type="text" class="form-control" [(ngModel)]="exp.form.cargo">
            </div>
            <div class="col-md-4">
              <label class="form-label">Sector</label>
              <input type="text" class="form-control" [(ngModel)]="exp.form.sector">
            </div>
            <div class="col-md-4">
              <label class="form-label">Tipo de contrato</label>
              <select class="form-select" [(ngModel)]="exp.form.tipoContrato">
                <option value="">— Seleccionar —</option>
                <option value="Indefinido">Indefinido</option>
                <option value="Fijo">Término fijo</option>
                <option value="Prestacion">Prestación de servicios</option>
                <option value="Practicas">Prácticas</option>
              </select>
            </div>
            <div class="col-md-4 d-flex align-items-end pb-1">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" [(ngModel)]="exp.form.esActual"
                       [id]="'actual_'+i">
                <label class="form-check-label" [for]="'actual_'+i">Trabajo actual</label>
              </div>
            </div>
            <div class="col-md-3">
              <label class="form-label">Fecha inicio</label>
              <input type="date" class="form-control" [(ngModel)]="exp.form.fechaInicio">
            </div>
            <div class="col-md-3">
              <label class="form-label">Fecha fin</label>
              <input type="date" class="form-control" [(ngModel)]="exp.form.fechaFin"
                     [disabled]="exp.form.esActual">
            </div>
            <div class="col-md-6">
              <label class="form-label">Motivo de retiro</label>
              <input type="text" class="form-control" [(ngModel)]="exp.form.motivoRetiro">
            </div>
            <div class="col-12">
              <label class="form-label">Descripción de funciones</label>
              <textarea class="form-control" rows="3" [(ngModel)]="exp.form.funciones"></textarea>
            </div>
            <div class="col-12 d-flex justify-content-end gap-2 pt-2"
                 style="border-top:1px solid #f0f0f0;">
              <button class="btn btn-outline-danger btn-sm" (click)="eliminar(exp)">
                <i class="bi bi-trash me-1"></i>Eliminar
              </button>
              <button class="btn btn-primary btn-sm" (click)="guardar(exp)" [disabled]="guardando">
                <i class="bi bi-floppy-fill me-1"></i>Guardar
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class ExperienciaComponent implements OnInit {
  experiencias: ExperienciaUI[] = [];
  loading = false;
  guardando = false;

  constructor(private cvEditorService: CvEditorService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.cvEditorService.getExperiencias().subscribe({
      next: data => {
        this.experiencias = data.map(e => ({ ...e, expanded: false, form: this.toForm(e) }));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private toForm(e: ExperienciaDto): UpsertExperienciaRequest {
    const { experienciaId, fechaRegistro, ...rest } = e;
    return { ...rest };
  }

  agregar(): void {
    const nueva: ExperienciaUI = {
      experienciaId: 0, fechaRegistro: '',
      empresa: null, cargo: null, sector: null, fechaInicio: null, fechaFin: null,
      tipoContrato: null, motivoRetiro: null, funciones: null, esActual: false, adjuntoSoporte: null,
      expanded: true,
      form: { empresa: null, cargo: null, sector: null, fechaInicio: null, fechaFin: null,
              tipoContrato: null, motivoRetiro: null, funciones: null, esActual: false, adjuntoSoporte: null }
    };
    this.experiencias.unshift(nueva);
  }

  guardar(exp: ExperienciaUI): void {
    this.guardando = true;
    if (exp.experienciaId === 0) {
      this.cvEditorService.createExperiencia(exp.form).subscribe({
        next: creada => {
          Object.assign(exp, creada, { expanded: false, form: this.toForm(creada) });
          this.guardando = false;
        },
        error: () => { this.guardando = false; }
      });
    } else {
      this.cvEditorService.updateExperiencia(exp.experienciaId, exp.form).subscribe({
        next: actualizada => {
          Object.assign(exp, actualizada, { expanded: false, form: this.toForm(actualizada) });
          this.guardando = false;
        },
        error: () => { this.guardando = false; }
      });
    }
  }

  eliminar(exp: ExperienciaUI): void {
    if (exp.experienciaId === 0) {
      this.experiencias = this.experiencias.filter(e => e !== exp);
      return;
    }
    if (!confirm('¿Eliminar esta experiencia?')) return;
    this.cvEditorService.deleteExperiencia(exp.experienciaId).subscribe({
      next: () => { this.experiencias = this.experiencias.filter(e => e !== exp); }
    });
  }
}
