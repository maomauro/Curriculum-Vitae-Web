import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  CvEditorService,
  FormacionDto,
  UpdateFormacionVisibilidadRequest,
  UpsertFormacionRequest,
} from '../../../core/services/private/cv-editor.service';
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
    <div class="page-header d-flex flex-wrap justify-content-between align-items-center gap-3">
      <div>
        <h4><i class="bi bi-mortarboard-fill me-2 text-primary"></i>Formación Académica</h4>
        <p class="text-muted small mb-0">Registra títulos, certificaciones y estudios; elige el tipo en cada tarjeta. Cada registro se guarda por separado.</p>
      </div>
      <button type="button" class="btn btn-primary btn-sm" (click)="agregar()">
        <i class="bi bi-plus-circle me-1"></i>Agregar formación
      </button>
    </div>

    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <div *ngIf="!loading && formaciones.length === 0" class="text-center py-5 text-muted">
      <i class="bi bi-mortarboard display-5"></i>
      <p class="mt-3">No tienes registros de formación. Agrega el primero.</p>
    </div>

    <div *ngFor="let edu of formaciones; let i = index; trackBy: trackByFormacion">
      <div class="edu-formacion-card"
           [class.edu-formacion-card--nuevo]="edu.formacionId === 0">
        <div class="p-4 d-flex align-items-center gap-3" (click)="onHeaderClick(edu, $event)">
          <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 cv-icon-box"
               [style.background]="iconoBg(tipoParaCabecera(edu))"
               [style.color]="iconoColor(tipoParaCabecera(edu))">
            <i class="bi" [ngClass]="icono(tipoParaCabecera(edu))"></i>
          </div>
          <div class="flex-grow-1 min-w-0">
            <div class="fw-bold cv-accordion-title cv-cursor-pointer">{{ tituloCabecera(edu) }}</div>
            <div class="cv-accordion-sub-primary">{{ subtituloCabecera(edu) }}</div>
          </div>
          <span class="text-muted small me-2 d-none d-sm-inline flex-shrink-0 text-nowrap"
                *ngIf="rangoFechasCabecera(edu) as rango">{{ rango }}</span>
          <span class="badge rounded-pill flex-shrink-0"
                [class.bg-primary-subtle]="edu.formacionId === 0"
                [class.text-primary]="edu.formacionId === 0"
                [class.cv-badge-neutral]="edu.formacionId !== 0">
            {{ edu.formacionId === 0 ? 'Nueva' : labelTipo(tipoParaCabecera(edu)) }}
          </span>
          <div *ngIf="edu.formacionId !== 0" class="profile-toggle-row flex-shrink-0" (click)="$event.stopPropagation()">
            <span class="profile-toggle-label">Mostrar en Mi CV</span>
            <div class="form-check form-switch mb-0">
              <input class="form-check-input" type="checkbox" role="switch"
                     [id]="'edu-hdr-cv-'+i"
                     [(ngModel)]="edu.form.mostrarEnCv"
                     (ngModelChange)="onMostrarEnCvChange(edu, $event)"
                     [disabled]="guardando || guardandoVisibilidadFormacionId === edu.formacionId">
            </div>
          </div>
          <i class="bi ms-2 cv-chevron-muted flex-shrink-0" [class.bi-chevron-down]="!edu.expanded"
             [class.bi-chevron-up]="edu.expanded" aria-hidden="true"></i>
        </div>

        <div *ngIf="edu.expanded" class="px-4 pb-4 cv-border-t-soft">
          <div class="row g-3 mt-1">
            <div class="col-md-4">
              <label class="form-label">Tipo de formación</label>
              <select class="form-select" [(ngModel)]="edu.form.tipoFormacion">
                <option *ngFor="let opt of tipoFormacionOptions" [ngValue]="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">
                {{ etiquetaTitulo(edu) }} <span class="text-danger">*</span>
              </label>
              <input type="text" class="form-control" [(ngModel)]="edu.form.titulo"
                     [placeholder]="placeholderTitulo(edu)">
            </div>
            <div class="col-md-4">
              <label class="form-label">
                {{ etiquetaInstitucion(edu) }} <span class="text-danger">*</span>
              </label>
              <input type="text" class="form-control" [(ngModel)]="edu.form.institucion"
                     [placeholder]="placeholderInstitucion(edu)">
            </div>
            <div class="col-md-4" *ngIf="!esCertificacion(edu.form.tipoFormacion)">
              <label class="form-label">Área de estudio</label>
              <input type="text" class="form-control" [(ngModel)]="edu.form.area" maxlength="300"
                     placeholder="Ej: Ingeniería de Software">
            </div>
            <div class="col-md-4" *ngIf="!esCertificacion(edu.form.tipoFormacion)">
              <label class="form-label">Duración (horas)</label>
              <input type="number" class="form-control" min="0" [(ngModel)]="edu.form.duracionHoras"
                     placeholder="Opcional">
            </div>
            <div class="col-md-6 col-lg-2">
              <label class="form-label">{{ etiquetaFechaInicio(edu) }}</label>
              <input type="date" class="form-control" [max]="todayDate" [(ngModel)]="edu.form.fechaInicio">
            </div>
            <div class="col-md-6 col-lg-2" *ngIf="!esCertificacion(edu.form.tipoFormacion)">
              <label class="form-label">Fecha fin</label>
              <input type="date" class="form-control" [max]="todayDate" [(ngModel)]="edu.form.fechaFin">
            </div>
            <div class="col-md-6 col-lg-2" *ngIf="esCertificacion(edu.form.tipoFormacion)">
              <label class="form-label">Vigencia hasta</label>
              <input type="date" class="form-control" [(ngModel)]="edu.form.fechaVigencia">
            </div>
            <div class="col-md-6 col-lg-4" *ngIf="!esCertificacion(edu.form.tipoFormacion)">
              <label class="form-label">Soporte / diploma</label>
              <input type="file" class="form-control" accept=".pdf,.jpg,.jpeg,.png" disabled
                     [title]="hintAdjuntoSoporte">
              <small class="text-muted">{{ notaAdjuntoSoporte }}</small>
            </div>
            <div class="col-md-6 col-lg-4" *ngIf="esCertificacion(edu.form.tipoFormacion)">
              <label class="form-label">Archivo del certificado</label>
              <input type="file" class="form-control" accept=".pdf,.jpg,.jpeg,.png" disabled
                     [title]="hintAdjuntoSoporte">
              <small class="text-muted">{{ notaAdjuntoSoporte }}</small>
            </div>
            <div class="col-12">
              <label class="form-label">Descripción adicional</label>
              <textarea class="form-control" rows="2" [(ngModel)]="edu.form.descripcion"
                        placeholder="Información adicional sobre tu formación…"></textarea>
            </div>
          </div>

          <div class="d-flex gap-2 mt-3 justify-content-end">
            <button *ngIf="edu.formacionId === 0" type="button" class="btn btn-outline-secondary btn-sm"
                    (click)="cancelar(edu)">
              Cancelar
            </button>
            <button *ngIf="edu.formacionId !== 0" type="button" class="btn btn-outline-danger btn-sm"
                    (click)="eliminar(edu)">
              <i class="bi bi-trash3 me-1"></i>Eliminar
            </button>
            <button type="button" class="btn btn-primary btn-sm" (click)="guardar(edu)"
                    [disabled]="guardando || (edu.formacionId !== 0 && guardandoVisibilidadFormacionId === edu.formacionId)">
              <span *ngIf="guardando" class="spinner-border spinner-border-sm me-1"></span>
              <i *ngIf="!guardando" class="bi bi-floppy-fill me-1"></i>Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class EducacionComponent implements OnInit {
  formaciones: FormacionUI[] = [];
  loading = false;
  guardando = false;
  todayDate = getTodayDateString();
  guardandoVisibilidadFormacionId: number | null = null;

  /** Valores enviados al API (string libre en backend, máx. 50 caracteres). */
  readonly tipoFormacionOptions = [
    { value: 'Posgrado', label: 'Posgrado' },
    { value: 'Pregrado', label: 'Pregrado' },
    { value: 'Tecnologo', label: 'Tecnólogo' },
    { value: 'Tecnico', label: 'Técnico' },
    { value: 'Diplomado', label: 'Diplomado' },
    { value: 'Certificacion', label: 'Certificación' },
    { value: 'Curso', label: 'Curso' },
  ] as const;

  readonly hintAdjuntoSoporte =
    'Próximamente podrás adjuntar el diploma o certificado; el campo está deshabilitado por ahora.';
  readonly notaAdjuntoSoporte =
    'La carga de archivos se habilitará próximamente; por ahora el CV no almacena el adjunto desde el navegador.';

  constructor(
    private cvEditorService: CvEditorService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  esCertificacion(tipo: string | null | undefined): boolean {
    return (tipo ?? '').trim() === 'Certificacion';
  }

  /** Evita NaN u otros valores que rompen la deserialización a int? en el API. */
  private normalizeDuracionHoras(value: number | null | undefined): number | null {
    if (value == null) {
      return null;
    }
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n) || n < 0) {
      return null;
    }
    return Math.floor(n);
  }

  etiquetaTitulo(edu: FormacionUI): string {
    return this.esCertificacion(edu.form.tipoFormacion) ? 'Nombre del certificado' : 'Título obtenido';
  }

  etiquetaInstitucion(edu: FormacionUI): string {
    return this.esCertificacion(edu.form.tipoFormacion) ? 'Entidad certificadora' : 'Institución';
  }

  etiquetaFechaInicio(edu: FormacionUI): string {
    return this.esCertificacion(edu.form.tipoFormacion) ? 'Fecha de obtención' : 'Fecha inicio';
  }

  placeholderTitulo(edu: FormacionUI): string {
    return this.esCertificacion(edu.form.tipoFormacion)
      ? 'Ej: AWS Certified Developer – Associate'
      : 'Ej: Especialización en Ingeniería de Software';
  }

  placeholderInstitucion(edu: FormacionUI): string {
    return this.esCertificacion(edu.form.tipoFormacion)
      ? 'Ej: Amazon Web Services'
      : 'Ej: Universidad de los Andes';
  }

  trackByFormacion(_index: number, edu: FormacionUI): number {
    return edu.formacionId;
  }

  onHeaderClick(edu: FormacionUI, ev: MouseEvent): void {
    const el = ev.target as HTMLElement;
    if (el.closest('button')) {
      return;
    }
    edu.expanded = !edu.expanded;
  }

  private datosCabecera(edu: FormacionUI): UpsertFormacionRequest {
    return edu.formacionId === 0 || edu.expanded ? edu.form : this.toForm(edu);
  }

  tituloCabecera(edu: FormacionUI): string {
    const d = this.datosCabecera(edu);
    return (d.titulo ?? '').trim() || 'Nueva formación';
  }

  subtituloCabecera(edu: FormacionUI): string {
    const d = this.datosCabecera(edu);
    return (d.institucion ?? '').trim() || '—';
  }

  tipoParaCabecera(edu: FormacionUI): string | null {
    return this.datosCabecera(edu).tipoFormacion;
  }

  /** Año o rango tipo prototipo (ej. 2020 — 2021 o 2023). */
  rangoFechasCabecera(edu: FormacionUI): string | null {
    const d = this.datosCabecera(edu);
    const y = (s: string | null | undefined): string | null => {
      if (!s) {
        return null;
      }
      const yy = s.slice(0, 4);
      return /^\d{4}$/.test(yy) ? yy : null;
    };

    if (this.esCertificacion(d.tipoFormacion)) {
      const a = y(d.fechaInicio);
      return a;
    }

    const ini = y(d.fechaInicio);
    const fin = y(d.fechaFin);
    if (ini && fin && ini !== fin) {
      return `${ini} — ${fin}`;
    }
    return fin ?? ini ?? null;
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
      },
    });
  }

  private toForm(f: FormacionDto): UpsertFormacionRequest {
    const { formacionId: _id, ...rest } = f;
    return { ...rest, mostrarEnCv: rest.mostrarEnCv !== false };
  }

  onMostrarEnCvChange(edu: FormacionUI, visible: boolean): void {
    if (edu.formacionId === 0) {
      return;
    }
    const prev = !visible;
    if (this.guardandoVisibilidadFormacionId === edu.formacionId) {
      return;
    }
    this.guardandoVisibilidadFormacionId = edu.formacionId;
    const payload: UpdateFormacionVisibilidadRequest = { mostrarEnCv: visible };
    this.cvEditorService.updateFormacionVisibilidad(edu.formacionId, payload).subscribe({
      next: actualizada => {
        Object.assign(edu, actualizada, { expanded: edu.expanded, form: this.toForm(actualizada) });
        this.guardandoVisibilidadFormacionId = null;
        this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
      },
      error: (error: HttpErrorResponse) => {
        edu.form.mostrarEnCv = prev;
        this.guardandoVisibilidadFormacionId = null;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
    });
  }

  agregar(): void {
    if (this.formaciones.some(f => f.formacionId === 0)) {
      this.notificationService.warning(FORM_MESSAGES.educacion.completeNuevaAntesDeOtra);
      return;
    }
    const nueva: FormacionUI = {
      formacionId: 0,
      titulo: null,
      institucion: null,
      area: null,
      fechaInicio: null,
      fechaFin: null,
      tipoFormacion: 'Posgrado',
      descripcion: null,
      adjuntoSoporte: null,
      fechaVigencia: null,
      duracionHoras: null,
      mostrarEnCv: true,
      expanded: true,
      form: {
        titulo: null,
        institucion: null,
        area: null,
        fechaInicio: null,
        fechaFin: null,
        tipoFormacion: 'Posgrado',
        descripcion: null,
        adjuntoSoporte: null,
        fechaVigencia: null,
        duracionHoras: null,
        mostrarEnCv: true,
      },
    };
    this.formaciones.unshift(nueva);
  }

  cancelar(edu: FormacionUI): void {
    if (edu.formacionId !== 0) {
      return;
    }
    this.formaciones = this.formaciones.filter(f => f !== edu);
  }

  guardar(edu: FormacionUI): void {
    const titulo = (edu.form.titulo ?? '').trim();
    const institucion = (edu.form.institucion ?? '').trim();
    const esCert = this.esCertificacion(edu.form.tipoFormacion);

    if (!titulo) {
      this.notificationService.warning(
        esCert ? FORM_MESSAGES.educacion.requiredNombreCertificado : FORM_MESSAGES.educacion.requiredTituloObtenido
      );
      return;
    }
    if (!institucion) {
      this.notificationService.warning(
        esCert
          ? FORM_MESSAGES.educacion.requiredEntidadCertificadora
          : FORM_MESSAGES.educacion.requiredInstitucion
      );
      return;
    }
    edu.form.titulo = titulo;
    edu.form.institucion = institucion;

    const fechaFinNorm = esCert ? null : normalizeDateOrNull(edu.form.fechaFin);
    const fechaVigenciaNorm = esCert ? normalizeDateOrNull(edu.form.fechaVigencia) : null;

    const payload: UpsertFormacionRequest = {
      ...edu.form,
      fechaInicio: normalizeDateOrNull(edu.form.fechaInicio),
      fechaFin: fechaFinNorm,
      fechaVigencia: fechaVigenciaNorm,
      duracionHoras: this.normalizeDuracionHoras(edu.form.duracionHoras),
    };

    if (edu.form.fechaInicio && !payload.fechaInicio) {
      this.notificationService.warning(FORM_MESSAGES.educacion.invalidDate);
      return;
    }

    if (!esCert && edu.form.fechaFin && !payload.fechaFin) {
      this.notificationService.warning(FORM_MESSAGES.educacion.invalidDate);
      return;
    }

    if (esCert && edu.form.fechaVigencia && !payload.fechaVigencia) {
      this.notificationService.warning(FORM_MESSAGES.educacion.invalidDate);
      return;
    }

    this.guardando = true;
    if (edu.formacionId === 0) {
      this.cvEditorService.createFormacion(payload).subscribe({
        next: creada => {
          Object.assign(edu, creada, { expanded: false, form: this.toForm(creada) });
          this.guardando = false;
          this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
        },
        error: (error: HttpErrorResponse) => {
          this.guardando = false;
          this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
        },
      });
    } else {
      this.cvEditorService.updateFormacion(edu.formacionId, payload).subscribe({
        next: actualizada => {
          Object.assign(edu, actualizada, { expanded: false, form: this.toForm(actualizada) });
          this.guardando = false;
          this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
        },
        error: (error: HttpErrorResponse) => {
          this.guardando = false;
          this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
        },
      });
    }
  }

  eliminar(edu: FormacionUI): void {
    if (edu.formacionId === 0) {
      return;
    }
    if (!confirm(FORM_MESSAGES.educacion.confirmDelete)) {
      return;
    }
    this.cvEditorService.deleteFormacion(edu.formacionId).subscribe({
      next: () => {
        this.formaciones = this.formaciones.filter(f => f !== edu);
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.deleteError),
    });
  }

  icono(tipo: string | null): string {
    const map: Record<string, string> = {
      Posgrado: 'bi-award-fill',
      Pregrado: 'bi-mortarboard-fill',
      Tecnologo: 'bi-mortarboard-fill',
      Tecnico: 'bi-tools',
      Diplomado: 'bi-journal-richtext',
      Certificacion: 'bi-patch-check-fill',
      Curso: 'bi-play-circle-fill',
    };
    return tipo ? (map[tipo] ?? 'bi-mortarboard-fill') : 'bi-mortarboard-fill';
  }

  iconoBg(tipo: string | null): string {
    const map: Record<string, string> = {
      Posgrado: '#f3e8ff',
      Pregrado: '#ebf2ff',
      Tecnologo: '#d1fae5',
      Tecnico: '#d1fae5',
      Diplomado: '#e0e7ff',
      Certificacion: '#fef9c3',
      Curso: '#fff3e0',
    };
    return tipo ? (map[tipo] ?? '#f1f5f9') : '#f1f5f9';
  }

  iconoColor(tipo: string | null): string {
    const map: Record<string, string> = {
      Posgrado: '#7c3aed',
      Pregrado: '#2c7be5',
      Tecnologo: '#065f46',
      Tecnico: '#065f46',
      Diplomado: '#4338ca',
      Certificacion: '#92400e',
      Curso: '#e65100',
    };
    return tipo ? (map[tipo] ?? '#6c757d') : '#6c757d';
  }

  /** Etiqueta para badge; si el API devuelve un valor legacy no listado, se muestra tal cual. */
  labelTipo(tipo: string | null): string {
    if (!tipo) {
      return '—';
    }
    const opt = this.tipoFormacionOptions.find(o => o.value === tipo);
    return opt?.label ?? tipo;
  }
}
