import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CvEditorService, FormacionDto, UpsertFormacionRequest } from '../../../core/services/private/cv-editor.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { FORM_MESSAGES } from '../../../core/constants/form-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage, getTodayDateString, normalizeDateOrNull } from '../../../core/utils/form-validation.util';

interface FormacionUI extends FormacionDto {
  expanded: boolean;
  form: UpsertFormacionRequest;
}

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

    <!-- Loading -->
    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Sin datos -->
    <div *ngIf="!loading && formaciones.length === 0" class="text-center py-5 text-muted">
      <i class="bi bi-mortarboard display-5"></i>
      <p class="mt-3">No tienes formaciones registradas. Agrega la primera.</p>
    </div>

    <!-- Lista de formaciones -->
    <div *ngFor="let edu of formaciones; let i = index">
      <div class="bg-white rounded-3 shadow-sm mb-3 overflow-hidden">
        <div class="p-4 d-flex align-items-center gap-3" style="cursor:pointer;"
             (click)="edu.expanded = !edu.expanded">
          <!-- Ícono por tipo -->
          <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
               style="width:44px;height:44px;font-size:1.1rem;"
               [style.background]="iconoBg(edu.tipoFormacion)"
               [style.color]="iconoColor(edu.tipoFormacion)">
            <i class="bi" [ngClass]="icono(edu.tipoFormacion)"></i>
          </div>
          <div class="flex-grow-1">
            <div class="fw-bold" style="font-size:.95rem;">{{ edu.titulo }}</div>
            <div style="font-size:.85rem;color:#6c757d;">{{ edu.institucion }}</div>
          </div>
          <span class="text-muted small me-3">{{ edu.fechaFin | date:'yyyy' }}</span>
          <span class="badge" style="background:#f1f5f9;color:#6c757d;font-size:.7rem;border-radius:12px;padding:3px 10px;">
            {{ labelTipo(edu.tipoFormacion) }}
          </span>
          <i class="bi ms-2" [class.bi-chevron-down]="!edu.expanded"
             [class.bi-chevron-up]="edu.expanded" style="color:#adb5bd;"></i>
        </div>

        <div *ngIf="edu.expanded" class="px-4 pb-4" style="border-top:1px solid #f0f0f0;">
          <div class="row g-3 mt-1">
            <div class="col-md-6">
              <label class="form-label">Título / Certificación</label>
              <input type="text" class="form-control" [(ngModel)]="edu.form.titulo">
            </div>
            <div class="col-md-6">
              <label class="form-label">Institución</label>
              <input type="text" class="form-control" [(ngModel)]="edu.form.institucion">
            </div>
            <div class="col-md-4">
              <label class="form-label">Área de estudio</label>
              <input type="text" class="form-control" [(ngModel)]="edu.form.area">
            </div>
            <div class="col-md-4">
              <label class="form-label">Tipo</label>
              <select class="form-select" [(ngModel)]="edu.form.tipoFormacion">
                <option value="Posgrado">Posgrado / Máster</option>
                <option value="Pregrado">Pregrado / Grado</option>
                <option value="Tecnico">Técnico / FP</option>
                <option value="Certificacion">Certificación</option>
                <option value="Curso">Curso</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Duración (horas)</label>
              <input type="number" class="form-control" min="0" [(ngModel)]="edu.form.duracionHoras">
            </div>
            <div class="col-md-4">
              <label class="form-label">Fecha inicio</label>
              <input type="date" class="form-control" [max]="todayDate" [(ngModel)]="edu.form.fechaInicio">
            </div>
            <div class="col-md-4">
              <label class="form-label">Fecha fin / Graduación</label>
              <input type="date" class="form-control" [max]="todayDate" [(ngModel)]="edu.form.fechaFin">
            </div>
            <div class="col-md-4">
              <label class="form-label">Vigencia del certificado</label>
              <input type="date" class="form-control" [(ngModel)]="edu.form.fechaVigencia">
            </div>
            <div class="col-12">
              <label class="form-label">Descripción</label>
              <textarea class="form-control" rows="2" [(ngModel)]="edu.form.descripcion"></textarea>
            </div>
            <div class="col-12 d-flex justify-content-end gap-2 pt-2"
                 style="border-top:1px solid #f0f0f0;">
              <button class="btn btn-outline-danger btn-sm" (click)="eliminar(edu)">
                <i class="bi bi-trash me-1"></i>Eliminar
              </button>
              <button class="btn btn-primary btn-sm" (click)="guardar(edu)" [disabled]="guardando">
                <i class="bi bi-floppy-fill me-1"></i>Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EducacionComponent implements OnInit {
  formaciones: FormacionUI[] = [];
  loading = false;
  guardando = false;
  todayDate = getTodayDateString();

  constructor(
    private cvEditorService: CvEditorService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.cvEditorService.getFormaciones().subscribe({
      next: data => {
        this.formaciones = data.map(f => ({ ...f, expanded: false, form: this.toForm(f) }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      }
    });
  }

  private toForm(f: FormacionDto): UpsertFormacionRequest {
    const { formacionId, ...rest } = f;
    return { ...rest };
  }

  agregar(): void {
    const nueva: FormacionUI = {
      formacionId: 0, titulo: null, institucion: null, area: null,
      fechaInicio: null, fechaFin: null, tipoFormacion: 'Pregrado',
      descripcion: null, adjuntoSoporte: null, fechaVigencia: null, duracionHoras: null,
      expanded: true,
      form: { titulo: null, institucion: null, area: null, fechaInicio: null, fechaFin: null,
              tipoFormacion: 'Pregrado', descripcion: null, adjuntoSoporte: null,
              fechaVigencia: null, duracionHoras: null }
    };
    this.formaciones.unshift(nueva);
  }

  guardar(edu: FormacionUI): void {
    const payload: UpsertFormacionRequest = {
      ...edu.form,
      fechaInicio: normalizeDateOrNull(edu.form.fechaInicio),
      fechaFin: normalizeDateOrNull(edu.form.fechaFin),
      fechaVigencia: normalizeDateOrNull(edu.form.fechaVigencia)
    };

    if (edu.form.fechaInicio && !payload.fechaInicio) {
      this.notificationService.warning(FORM_MESSAGES.educacion.invalidDate);
      return;
    }

    if (edu.form.fechaFin && !payload.fechaFin) {
      this.notificationService.warning(FORM_MESSAGES.educacion.invalidDate);
      return;
    }

    if (edu.form.fechaVigencia && !payload.fechaVigencia) {
      this.notificationService.warning(FORM_MESSAGES.educacion.invalidDate);
      return;
    }

    this.guardando = true;
    if (edu.formacionId === 0) {
      this.cvEditorService.createFormacion(payload).subscribe({
        next: creada => {
          Object.assign(edu, creada, { expanded: false, form: this.toForm(creada) });
          this.guardando = false;
          this.notificationService.success(NOTIFICATION_MESSAGES.createSuccess);
        },
        error: (error: HttpErrorResponse) => {
          this.guardando = false;
          this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
        }
      });
    } else {
      this.cvEditorService.updateFormacion(edu.formacionId, payload).subscribe({
        next: actualizada => {
          Object.assign(edu, actualizada, { expanded: false, form: this.toForm(actualizada) });
          this.guardando = false;
          this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
        },
        error: (error: HttpErrorResponse) => {
          this.guardando = false;
          this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
        }
      });
    }
  }

  eliminar(edu: FormacionUI): void {
    if (edu.formacionId === 0) { this.formaciones = this.formaciones.filter(f => f !== edu); return; }
    if (!confirm('¿Eliminar esta formación?')) return;
    this.cvEditorService.deleteFormacion(edu.formacionId).subscribe({
      next: () => {
        this.formaciones = this.formaciones.filter(f => f !== edu);
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.deleteError)
    });
  }

  icono(tipo: string | null): string {
    const map: Record<string, string> = {
      'Posgrado': 'bi-award-fill', 'Pregrado': 'bi-book-fill',
      'Tecnico': 'bi-tools', 'Certificacion': 'bi-patch-check-fill', 'Curso': 'bi-play-circle-fill'
    };
    return tipo ? (map[tipo] ?? 'bi-mortarboard-fill') : 'bi-mortarboard-fill';
  }

  iconoBg(tipo: string | null): string {
    const map: Record<string, string> = {
      'Posgrado': '#f3e8ff', 'Pregrado': '#ebf2ff',
      'Tecnico': '#d1fae5', 'Certificacion': '#fef9c3', 'Curso': '#fff3e0'
    };
    return tipo ? (map[tipo] ?? '#f1f5f9') : '#f1f5f9';
  }

  iconoColor(tipo: string | null): string {
    const map: Record<string, string> = {
      'Posgrado': '#7c3aed', 'Pregrado': '#2c7be5',
      'Tecnico': '#065f46', 'Certificacion': '#92400e', 'Curso': '#e65100'
    };
    return tipo ? (map[tipo] ?? '#6c757d') : '#6c757d';
  }

  labelTipo(tipo: string | null): string {
    const map: Record<string, string> = {
      'Posgrado': 'Posgrado', 'Pregrado': 'Pregrado',
      'Tecnico': 'Técnico', 'Certificacion': 'Certificación', 'Curso': 'Curso'
    };
    return tipo ? (map[tipo] ?? tipo) : '—';
  }
}
