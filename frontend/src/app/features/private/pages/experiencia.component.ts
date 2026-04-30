import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import {
  CvEditorService,
  ExperienciaDto,
  ReferenciaDto,
  UpsertExperienciaRequest,
  UpsertReferenciaRequest,
} from '../../../core/services/private/cv-editor.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { FORM_MESSAGES } from '../../../core/constants/form-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import {
  extractApiErrorMessage,
  getTodayDateString,
  isValidEmail,
  normalizeDateOrNull,
} from '../../../core/utils/form-validation.util';

interface ExperienciaUI extends ExperienciaDto {
  expanded: boolean;
  form: UpsertExperienciaRequest;
}

interface BorradorRefLaboral {
  clientKey: string;
  experienciaId: number;
  expanded: boolean;
  form: UpsertReferenciaRequest;
  /** Empleo nuevo (experienciaId 0): tras Guardar válido, se incluye al pulsar Crear empleo. */
  committed?: boolean;
}

@Component({
  selector: 'app-experiencia',
  standalone: false,
  template: `
    <div class="page-header d-flex flex-wrap justify-content-between align-items-center gap-3">
      <div>
        <h4><i class="bi bi-briefcase-fill me-2 text-primary"></i>Experiencia Laboral</h4>
        <p class="text-muted small mb-0">Registra tu trayectoria profesional y las referencias de cada empleo</p>
      </div>
      <button type="button" class="btn btn-primary btn-sm" (click)="agregar()">
        <i class="bi bi-plus-circle me-2"></i>Agregar empleo
      </button>
    </div>

    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <div *ngIf="!loading && experiencias.length === 0" class="text-center py-5 text-muted">
      <i class="bi bi-briefcase display-5"></i>
      <p class="mt-3">No tienes experiencias registradas. Agrega la primera.</p>
    </div>

    <div *ngFor="let exp of experiencias; let i = index; trackBy: trackByExp"
         class="job-card"
         [class.job-card--nuevo]="exp.experienciaId === 0"
         [class.job-card--expanded]="exp.experienciaId === 0 || exp.expanded">

      <div class="job-card-header"
           [class.profile-card-header]="exp.experienciaId !== 0">
        <ng-container *ngIf="exp.experienciaId === 0">
          <div class="job-icon">
            <i class="bi bi-plus-lg"></i>
          </div>
          <div class="flex-grow-1 min-w-0 job-card-title-block">
            <div class="job-title">Nuevo empleo</div>
          </div>
          <button type="button" class="btn btn-outline-secondary btn-sm"
                  (click)="cancelarNuevo(exp)">
            <i class="bi bi-x-lg me-1"></i>Cancelar
          </button>
        </ng-container>

        <ng-container *ngIf="exp.experienciaId !== 0">
          <div class="job-icon">
            <i class="bi bi-building"></i>
          </div>
          <div class="flex-grow-1 min-w-0 job-card-title-block">
            <div class="profile-name cv-cursor-pointer min-w-0"
                 role="button"
                 tabindex="0"
                 [attr.aria-expanded]="exp.expanded"
                 (click)="toggleExpAccordion(exp)"
                 (keydown.enter)="toggleExpAccordion(exp)"
                 (keydown.space)="$event.preventDefault(); toggleExpAccordion(exp)">
              <i class="bi cv-chevron-muted flex-shrink-0" aria-hidden="true"
                 [class.bi-chevron-down]="!exp.expanded"
                 [class.bi-chevron-up]="exp.expanded"></i>
              <span class="job-title mb-0">{{ exp.cargo || 'Sin cargo' }}</span>
              <span *ngIf="exp.form.mostrarEnCv" class="badge-active">
                <i class="bi bi-check-circle-fill" aria-hidden="true"></i>En CV
              </span>
              <span *ngIf="!exp.form.mostrarEnCv" class="badge-inactive">No visible en CV</span>
            </div>
            <div class="job-company">{{ exp.empresa || '—' }}</div>
            <div class="job-dates-compact d-sm-none small text-muted mt-1">
              {{ exp.fechaInicio | date:'MMM yyyy' }} —
              {{ exp.esActual ? 'Actualidad' : (exp.fechaFin ? (exp.fechaFin | date:'MMM yyyy') : '—') }}
              <span *ngIf="exp.esActual"> · Empleo actual</span>
              <span *ngIf="!exp.esActual && duracionLabel(exp)"> · {{ duracionLabel(exp) }}</span>
            </div>
          </div>
          <div class="job-card-metrics d-none d-sm-flex align-items-center flex-shrink-0">
            <div class="job-metric-dates text-muted">
              {{ exp.fechaInicio | date:'MMM yyyy' }} —
              {{ exp.esActual ? 'Actualidad' : (exp.fechaFin ? (exp.fechaFin | date:'MMM yyyy') : '—') }}
            </div>
            <div class="job-metric-duration">
              <span *ngIf="exp.esActual" class="badge bg-success-subtle text-success">Empleo actual</span>
              <span *ngIf="!exp.esActual" class="badge bg-secondary-subtle text-secondary">{{ duracionLabel(exp) }}</span>
            </div>
          </div>
          <div class="profile-toggle-row flex-shrink-0" (click)="$event.stopPropagation()">
            <span class="profile-toggle-label">Mostrar en Mi CV</span>
            <div class="form-check form-switch mb-0">
              <input class="form-check-input" type="checkbox" role="switch"
                     [id]="'exp-hdr-cv-'+i"
                     [(ngModel)]="exp.form.mostrarEnCv"
                     (ngModelChange)="onMostrarEnCvChange(exp, $event)"
                     [disabled]="guardando || guardandoVisibilidadExpId === exp.experienciaId">
            </div>
          </div>
        </ng-container>
      </div>

      <div *ngIf="exp.experienciaId === 0 || exp.expanded" class="job-body">
        <section class="seccion-card experiencia-empleo-nucleo mb-3"
                 aria-label="Datos del empleo o contrato">
        <div class="experiencia-empleo-nucleo-fields">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">Empresa <span class="text-danger">*</span></label>
            <input type="text" class="form-control" [(ngModel)]="exp.form.empresa"
                   [placeholder]="exp.experienciaId === 0 ? 'Nombre de la empresa' : ''">
          </div>
          <div class="col-md-4">
            <label class="form-label">Cargo <span class="text-danger">*</span></label>
            <input type="text" class="form-control" [(ngModel)]="exp.form.cargo"
                   [placeholder]="exp.experienciaId === 0 ? 'Tu cargo en esta empresa' : ''">
          </div>
          <div class="col-md-4">
            <label class="form-label">Sector</label>
            <input type="text" class="form-control" [(ngModel)]="exp.form.sector"
                   placeholder="Ej: Tecnología, Banca…">
          </div>
          <div class="col-md-3">
            <label class="form-label">Fecha de inicio</label>
            <input type="date" class="form-control" [min]="minDate" [max]="todayDate" [(ngModel)]="exp.form.fechaInicio">
          </div>
          <div class="col-md-3">
            <label class="form-label">Fecha de fin</label>
            <div class="input-group">
              <input type="date" class="form-control" [min]="minDate" [max]="todayDate" [(ngModel)]="exp.form.fechaFin"
                     [disabled]="exp.form.esActual">
              <div class="input-group-text p-0 px-2 bg-white">
                <div class="form-check mb-0 py-1">
                  <input class="form-check-input" type="checkbox" [id]="'exp-actual-'+i"
                         [(ngModel)]="exp.form.esActual" (ngModelChange)="onEsActualChange(exp, $event)">
                  <label class="form-check-label small" [for]="'exp-actual-'+i">Actual</label>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <label class="form-label">Tipo de contrato</label>
            <select class="form-select" [(ngModel)]="exp.form.tipoContrato">
              <option [ngValue]="null">— Seleccionar —</option>
              <option value="Indefinido">Término indefinido</option>
              <option value="Fijo">Término fijo</option>
              <option value="Prestacion">Prestación de servicios</option>
              <option value="Obra">Obra o labor</option>
              <option value="Practicas">Pasantía</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Motivo de retiro</label>
            <input type="text" class="form-control" [(ngModel)]="exp.form.motivoRetiro"
                   [disabled]="exp.form.esActual"
                   [placeholder]="exp.form.esActual ? '— Empleo actual —' : ''">
          </div>
          <div class="col-12">
            <label class="form-label">Funciones y logros principales</label>
            <textarea class="form-control" rows="4" [(ngModel)]="exp.form.funciones"
                      placeholder="Describe tus principales responsabilidades y logros…"></textarea>
          </div>
          <div class="col-12">
            <label class="form-label">
              Certificación laboral
              <small class="text-muted fw-normal">Carta laboral, contrato u otro soporte — PDF / JPG / PNG</small>
            </label>
            <input type="file" class="form-control" accept=".pdf,.jpg,.jpeg,.png" disabled
                   [title]="hintAdjunto">
            <small class="text-muted">La carga de archivos se habilitará próximamente; por ahora el CV no almacena el adjunto desde el navegador.</small>
          </div>
        </div>
        </div>

        <div class="experiencia-empleo-guardar-footer">
          <div class="d-flex flex-column flex-md-row flex-md-wrap align-items-md-center justify-content-md-between gap-3">
            <div class="seccion-subtitulo border-0 pt-0 mb-0 text-muted small">
              Estos campos guardan el empleo. Las referencias laborales de abajo se guardan con su propio botón Guardar.
            </div>
            <div class="d-flex flex-wrap gap-2 justify-content-md-end flex-shrink-0">
              <button *ngIf="exp.experienciaId !== 0" type="button" class="btn btn-outline-danger btn-sm"
                      (click)="eliminar(exp)" [disabled]="guardando">
                <i class="bi bi-trash3 me-1"></i>Eliminar empleo
              </button>
              <button type="button" class="btn btn-primary px-4" (click)="guardar(exp)"
                      [disabled]="guardando || (exp.experienciaId !== 0 && guardandoVisibilidadExpId === exp.experienciaId)">
                <span *ngIf="guardando" class="spinner-border spinner-border-sm me-1"></span>
                <i *ngIf="!guardando" class="bi bi-floppy-fill me-2"></i>
                {{ exp.experienciaId === 0 ? 'Crear empleo' : 'Guardar empleo' }}
              </button>
            </div>
          </div>
        </div>
        </section>

        <section class="experiencia-ref-relaciones" aria-label="Referencias laborales vinculadas a este empleo">
        <div class="exp-ref-subsection">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
            <div class="exp-ref-subsection-title mb-0">
              <i class="bi bi-person-lines-fill me-2 text-primary"></i>Referencias laborales de este empleo
            </div>
            <button type="button" class="btn btn-outline-secondary btn-sm"
                    (click)="agregarBorradorLaboral(exp)" [disabled]="guardandoRef || guardando">
              <i class="bi bi-plus-circle me-1"></i>Agregar referencia
            </button>
          </div>

          <p *ngIf="exp.experienciaId === 0" class="small text-muted mb-2">
            {{ formMessages.experiencia.refPendientesAlCrearEmpleo }}
          </p>

            <div *ngFor="let b of borradoresDeExp(exp); trackBy: trackByBorradorKey"
                 class="bg-white rounded-3 shadow-sm mb-2 overflow-hidden">
              <div class="p-3 d-flex align-items-center gap-3 cv-cursor-pointer"
                   (click)="toggleBorradorHeader(b, $event)">
                <div class="rounded-3 cv-icon-box cv-icon-box--primary">
                  <i class="bi bi-person-lines-fill"></i>
                </div>
                <div class="flex-grow-1 min-w-0">
                  <div class="fw-bold cv-accordion-title">{{ tituloBorradorLaboral(b) }}</div>
                  <div class="cv-accordion-sub-primary">{{ subtituloBorradorLaboral(b) }}</div>
                </div>
                <span class="badge rounded-pill badge-ref-type badge-ref-type--laboral">Laboral</span>
                <i class="bi ms-2 cv-chevron-muted flex-shrink-0" [class.bi-chevron-down]="!b.expanded"
                   [class.bi-chevron-up]="b.expanded" aria-hidden="true"></i>
              </div>
              <div *ngIf="b.expanded" class="px-3 pb-3 cv-border-t-soft">
                <div class="row g-3 mt-1">
                  <div class="col-md-4">
                    <label class="form-label">Tipo de referencia</label>
                    <select class="form-select" [disabled]="true">
                      <option>Laboral</option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Nombre <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" [(ngModel)]="b.form.nombre" autocomplete="name">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Apellido</label>
                    <input type="text" class="form-control" [(ngModel)]="b.form.apellido">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Cargo</label>
                    <input type="text" class="form-control" [(ngModel)]="b.form.cargo">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Empresa</label>
                    <input type="text" class="form-control" [(ngModel)]="b.form.empresa">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Relación</label>
                    <input type="text" class="form-control" [(ngModel)]="b.form.relacion"
                           placeholder="Ej: Jefe directo, Colega">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" [(ngModel)]="b.form.email">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Teléfono</label>
                    <input type="text" class="form-control" [(ngModel)]="b.form.telefono">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Parentesco</label>
                    <input type="text" class="form-control" [(ngModel)]="b.form.parentesco"
                           placeholder="Solo si aplica">
                  </div>
                  <div class="col-12">
                    <label class="form-label">Observaciones</label>
                    <textarea class="form-control" rows="2" [(ngModel)]="b.form.observaciones"></textarea>
                  </div>
                </div>
                <div class="d-flex gap-2 mt-3 justify-content-end">
                  <button *ngIf="exp.experienciaId !== 0 || !b.committed" type="button"
                          class="btn btn-outline-secondary btn-sm" (click)="cancelarBorradorLaboral(b)">
                    Cancelar
                  </button>
                  <button *ngIf="exp.experienciaId === 0 && b.committed" type="button"
                          class="btn btn-outline-danger btn-sm" (click)="cancelarBorradorLaboral(b)"
                          [disabled]="guardandoRef || guardando">
                    <i class="bi bi-trash me-1"></i>Eliminar
                  </button>
                  <button type="button" class="btn btn-primary btn-sm" (click)="guardarBorradorLaboral(b, exp)"
                          [disabled]="guardandoRef || guardando">
                    <span *ngIf="guardandoRef && exp.experienciaId !== 0" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="!(guardandoRef && exp.experienciaId !== 0)" class="bi bi-floppy me-1"></i>Guardar
                  </button>
                </div>
              </div>
            </div>

            <div *ngFor="let ref of referenciasLaboralesDe(exp.experienciaId); trackBy: trackByRefId"
                 class="bg-white rounded-3 shadow-sm mb-2 overflow-hidden">
              <div class="p-3 d-flex align-items-center gap-3 cv-cursor-pointer"
                   (click)="toggleLaborRefHeader(ref, $event)">
                <div class="rounded-3 cv-icon-box cv-icon-box--primary">
                  <i class="bi bi-person-lines-fill"></i>
                </div>
                <div class="flex-grow-1 min-w-0">
                  <div class="fw-bold cv-accordion-title">{{ tituloLaboralCabecera(ref) }}</div>
                  <div class="cv-accordion-sub-primary">{{ subtituloLaboralCabecera(ref) }}</div>
                </div>
                <span class="badge rounded-pill badge-ref-type badge-ref-type--laboral">Laboral</span>
                <i class="bi ms-2 cv-chevron-muted flex-shrink-0"
                   [class.bi-chevron-down]="!getLaborRefUi(ref).expanded"
                   [class.bi-chevron-up]="getLaborRefUi(ref).expanded" aria-hidden="true"></i>
              </div>
              <div *ngIf="getLaborRefUi(ref).expanded" class="px-3 pb-3 cv-border-t-soft">
                <div class="row g-3 mt-1">
                  <div class="col-md-4">
                    <label class="form-label">Tipo de referencia</label>
                    <select class="form-select" [disabled]="true">
                      <option>Laboral</option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Nombre <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" [(ngModel)]="getLaborRefUi(ref).form.nombre"
                           autocomplete="name">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Apellido</label>
                    <input type="text" class="form-control" [(ngModel)]="getLaborRefUi(ref).form.apellido">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Cargo</label>
                    <input type="text" class="form-control" [(ngModel)]="getLaborRefUi(ref).form.cargo">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Empresa</label>
                    <input type="text" class="form-control" [(ngModel)]="getLaborRefUi(ref).form.empresa">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Relación</label>
                    <input type="text" class="form-control" [(ngModel)]="getLaborRefUi(ref).form.relacion"
                           placeholder="Ej: Jefe directo, Colega">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" [(ngModel)]="getLaborRefUi(ref).form.email">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Teléfono</label>
                    <input type="text" class="form-control" [(ngModel)]="getLaborRefUi(ref).form.telefono">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Parentesco</label>
                    <input type="text" class="form-control" [(ngModel)]="getLaborRefUi(ref).form.parentesco"
                           placeholder="Solo si aplica">
                  </div>
                  <div class="col-12">
                    <label class="form-label">Observaciones</label>
                    <textarea class="form-control" rows="2"
                                [(ngModel)]="getLaborRefUi(ref).form.observaciones"></textarea>
                  </div>
                </div>
                <div class="d-flex gap-2 mt-3 justify-content-end">
                  <button type="button" class="btn btn-outline-danger btn-sm" (click)="eliminarReferencia(ref)"
                          [disabled]="guardandoRef || guardando">
                    <i class="bi bi-trash me-1"></i>Eliminar
                  </button>
                  <button type="button" class="btn btn-primary btn-sm" (click)="guardarReferenciaLaboral(ref, exp)"
                          [disabled]="guardandoRef || guardando">
                    <span *ngIf="guardandoRef" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="!guardandoRef" class="bi bi-floppy me-1"></i>Guardar
                  </button>
                </div>
              </div>
            </div>
        </div>
        </section>
      </div>
    </div>
  `,
})
export class ExperienciaComponent implements OnInit {
  readonly minDate = '1950-01-01';
  experiencias: ExperienciaUI[] = [];
  referencias: ReferenciaDto[] = [];
  /** Borradores por empleo (experienciaId real o 0 = empleo nuevo); mismas tarjetas en ambos casos. */
  borradoresLaborales: BorradorRefLaboral[] = [];
  private laborRefUi: Record<number, { expanded: boolean; form: UpsertReferenciaRequest }> = {};
  loading = false;
  guardando = false;
  /** PUT de visibilidad desde el switch de cabecera. */
  guardandoVisibilidadExpId: number | null = null;
  guardandoRef = false;
  todayDate = getTodayDateString();
  readonly hintAdjunto =
    'Próximamente podrás adjuntar certificación; el campo está deshabilitado por ahora.';
  readonly formMessages = FORM_MESSAGES;

  constructor(
    private cvEditorService: CvEditorService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  trackByExp(_index: number, exp: ExperienciaUI): number {
    return exp.experienciaId;
  }

  toggleExpAccordion(exp: ExperienciaUI): void {
    if (exp.experienciaId === 0) {
      return;
    }
    exp.expanded = !exp.expanded;
  }

  onEsActualChange(exp: ExperienciaUI, checked: boolean): void {
    if (checked) {
      exp.form.fechaFin = null;
    }
  }

  trackByRefId(_index: number, ref: ReferenciaDto): number {
    return ref.referenciaId;
  }

  trackByBorradorKey(_index: number, b: BorradorRefLaboral): string {
    return b.clientKey;
  }

  borradoresDeExp(exp: ExperienciaUI): BorradorRefLaboral[] {
    return this.borradoresLaborales.filter(b => b.experienciaId === exp.experienciaId);
  }

  getLaborRefUi(ref: ReferenciaDto): { expanded: boolean; form: UpsertReferenciaRequest } {
    let s = this.laborRefUi[ref.referenciaId];
    if (!s) {
      s = { expanded: false, form: this.referenciaToForm(ref) };
      this.laborRefUi[ref.referenciaId] = s;
    }
    return s;
  }

  private referenciaToForm(r: ReferenciaDto): UpsertReferenciaRequest {
    return {
      tipoReferencia: r.tipoReferencia,
      experienciaId: r.experienciaId,
      nombre: r.nombre,
      apellido: r.apellido,
      email: r.email,
      telefono: r.telefono,
      parentesco: r.parentesco,
      cargo: r.cargo,
      empresa: r.empresa,
      relacion: r.relacion,
      observaciones: r.observaciones,
      adjuntoSoporte: r.adjuntoSoporte,
    };
  }

  toggleLaborRefHeader(ref: ReferenciaDto, ev: MouseEvent): void {
    const el = ev.target as HTMLElement;
    if (el.closest('button')) {
      return;
    }
    const ui = this.getLaborRefUi(ref);
    ui.expanded = !ui.expanded;
  }

  tituloLaboralCabecera(ref: ReferenciaDto): string {
    const ui = this.getLaborRefUi(ref);
    const useForm = ui.expanded;
    const nombre = (useForm ? ui.form.nombre : ref.nombre) ?? '';
    const apellido = (useForm ? ui.form.apellido : ref.apellido) ?? '';
    const linea = `${nombre} ${apellido}`.trim();
    return linea || 'Referencia laboral';
  }

  subtituloLaboralCabecera(ref: ReferenciaDto): string {
    const ui = this.getLaborRefUi(ref);
    const useForm = ui.expanded;
    const cargo = useForm ? ui.form.cargo : ref.cargo;
    const empresa = useForm ? ui.form.empresa : ref.empresa;
    const c = (cargo ?? '').trim();
    const e = (empresa ?? '').trim();
    if (c && e) {
      return `${c} — ${e}`;
    }
    return c || e || '—';
  }

  agregarBorradorLaboral(exp: ExperienciaUI): void {
    this.borradoresLaborales.push({
      clientKey: `n-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      experienciaId: exp.experienciaId,
      expanded: true,
      committed: exp.experienciaId === 0 ? false : undefined,
      form: this.emptyLaboralFormForExp(exp),
    });
  }

  private emptyLaboralFormForExp(exp: ExperienciaUI): UpsertReferenciaRequest {
    return {
      tipoReferencia: 'Laboral',
      experienciaId: exp.experienciaId === 0 ? null : exp.experienciaId,
      nombre: '',
      apellido: null,
      email: null,
      telefono: null,
      parentesco: null,
      cargo: null,
      empresa: (exp.form.empresa ?? '').trim() || null,
      relacion: null,
      observaciones: null,
      adjuntoSoporte: null,
    };
  }

  toggleBorradorHeader(b: BorradorRefLaboral, ev: MouseEvent): void {
    const el = ev.target as HTMLElement;
    if (el.closest('button')) {
      return;
    }
    b.expanded = !b.expanded;
  }

  tituloBorradorLaboral(b: BorradorRefLaboral): string {
    const nombre = (b.form.nombre ?? '').trim();
    const apellido = (b.form.apellido ?? '').trim();
    const linea = `${nombre} ${apellido}`.trim();
    return linea || 'Nueva referencia';
  }

  subtituloBorradorLaboral(b: BorradorRefLaboral): string {
    const c = (b.form.cargo ?? '').trim();
    const e = (b.form.empresa ?? '').trim();
    if (c && e) {
      return `${c} — ${e}`;
    }
    return c || e || '—';
  }

  cancelarBorradorLaboral(b: BorradorRefLaboral): void {
    this.borradoresLaborales = this.borradoresLaborales.filter(x => x.clientKey !== b.clientKey);
  }

  private normalizeRefLaboralForm(
    form: UpsertReferenciaRequest,
    exp: ExperienciaUI
  ): UpsertReferenciaRequest {
    const emailRaw = (form.email ?? '').trim();
    return {
      tipoReferencia: 'Laboral',
      experienciaId: exp.experienciaId,
      nombre: (form.nombre ?? '').trim(),
      apellido: form.apellido?.trim() || null,
      email: emailRaw || null,
      telefono: form.telefono?.trim() || null,
      parentesco: form.parentesco?.trim() || null,
      cargo: form.cargo?.trim() || null,
      empresa: form.empresa?.trim() || null,
      relacion: form.relacion?.trim() || null,
      observaciones: form.observaciones?.trim() || null,
      adjuntoSoporte: form.adjuntoSoporte ?? null,
    };
  }

  /** Normaliza borrador de referencia ligada a empleo aún no creado (sin experienciaId en servidor). */
  private normalizeFormNuevoEmpleoRef(
    form: UpsertReferenciaRequest,
    exp: ExperienciaUI
  ): UpsertReferenciaRequest {
    const emailRaw = (form.email ?? '').trim();
    const empEmpleo = (exp.form.empresa ?? '').trim();
    return {
      tipoReferencia: 'Laboral',
      experienciaId: null,
      nombre: (form.nombre ?? '').trim(),
      apellido: form.apellido?.trim() || null,
      email: emailRaw || null,
      telefono: form.telefono?.trim() || null,
      parentesco: form.parentesco?.trim() || null,
      cargo: form.cargo?.trim() || null,
      empresa: (form.empresa ?? '').trim() || empEmpleo || null,
      relacion: form.relacion?.trim() || null,
      observaciones: form.observaciones?.trim() || null,
      adjuntoSoporte: form.adjuntoSoporte ?? null,
    };
  }

  guardarBorradorLaboral(b: BorradorRefLaboral, exp: ExperienciaUI): void {
    if (exp.experienciaId === 0) {
      const f = this.normalizeFormNuevoEmpleoRef(b.form, exp);
      if (!f.nombre) {
        this.notificationService.warning(FORM_MESSAGES.referencias.requiredNombre);
        return;
      }
      if (f.email && !isValidEmail(f.email)) {
        this.notificationService.warning(FORM_MESSAGES.referencias.invalidEmail);
        return;
      }
      b.form = { ...f };
      b.committed = true;
      b.expanded = false;
      return;
    }

    const payload = this.normalizeRefLaboralForm(b.form, exp);
    if (!payload.nombre) {
      this.notificationService.warning(FORM_MESSAGES.referencias.requiredNombre);
      return;
    }
    if (payload.email && !isValidEmail(payload.email)) {
      this.notificationService.warning(FORM_MESSAGES.referencias.invalidEmail);
      return;
    }
    this.guardandoRef = true;
    this.cvEditorService.createReferencia(payload).subscribe({
      next: r => {
        this.referencias = [...this.referencias, r];
        this.borradoresLaborales = this.borradoresLaborales.filter(x => x.clientKey !== b.clientKey);
        this.laborRefUi[r.referenciaId] = { expanded: false, form: this.referenciaToForm(r) };
        this.guardandoRef = false;
        this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
      },
      error: (error: HttpErrorResponse) => {
        this.guardandoRef = false;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
    });
  }

  guardarReferenciaLaboral(ref: ReferenciaDto, exp: ExperienciaUI): void {
    const ui = this.getLaborRefUi(ref);
    const payload = this.normalizeRefLaboralForm(ui.form, exp);
    if (!payload.nombre) {
      this.notificationService.warning(FORM_MESSAGES.referencias.requiredNombre);
      return;
    }
    if (payload.email && !isValidEmail(payload.email)) {
      this.notificationService.warning(FORM_MESSAGES.referencias.invalidEmail);
      return;
    }
    this.guardandoRef = true;
    this.cvEditorService.updateReferencia(ref.referenciaId, payload).subscribe({
      next: data => {
        this.referencias = this.referencias.map(x => (x.referenciaId === data.referenciaId ? data : x));
        ui.form = this.referenciaToForm(data);
        ui.expanded = false;
        this.guardandoRef = false;
        this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
      },
      error: (error: HttpErrorResponse) => {
        this.guardandoRef = false;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
    });
  }

  referenciasLaboralesDe(experienciaId: number): ReferenciaDto[] {
    if (experienciaId === 0) {
      return [];
    }
    return this.referencias.filter(
      r => r.tipoReferencia === 'Laboral' && r.experienciaId === experienciaId
    );
  }

  duracionLabel(exp: ExperienciaDto): string {
    if (!exp.fechaInicio || exp.esActual) {
      return '';
    }
    const start = new Date(`${exp.fechaInicio}T12:00:00`);
    const end = exp.fechaFin ? new Date(`${exp.fechaFin}T12:00:00`) : start;
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return '—';
    }
    let months =
      (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months < 0) {
      months = 0;
    }
    if (months < 12) {
      return months <= 1 ? '1 mes' : `${months} meses`;
    }
    const years = Math.floor(months / 12);
    const rest = months % 12;
    const yearPart = years === 1 ? '1 año' : `${years} años`;
    if (rest === 0) {
      return yearPart;
    }
    const monthPart = rest === 1 ? '1 mes' : `${rest} meses`;
    return `${yearPart} y ${monthPart}`;
  }

  cargar(): void {
    this.loading = true;
    forkJoin({
      experiencias: this.cvEditorService.getExperiencias(),
      referencias: this.cvEditorService.getReferencias(),
    }).subscribe({
      next: ({ experiencias, referencias }) => {
        this.experiencias = experiencias.map(e => ({ ...e, expanded: false, form: this.toForm(e) }));
        this.referencias = referencias;
        this.laborRefUi = {};
        this.borradoresLaborales = [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      },
    });
  }

  private toForm(e: ExperienciaDto): UpsertExperienciaRequest {
    const { experienciaId: _experienciaId, fechaRegistro: _fechaRegistro, ...rest } = e;
    return { ...rest, mostrarEnCv: rest.mostrarEnCv !== false };
  }

  private buildExperienciaUpsertPayload(exp: ExperienciaUI): UpsertExperienciaRequest {
    return {
      ...exp.form,
      mostrarEnCv: exp.form.mostrarEnCv,
      fechaInicio: normalizeDateOrNull(exp.form.fechaInicio),
      fechaFin: normalizeDateOrNull(exp.form.fechaFin),
    };
  }

  /** Guarda visibilidad al cambiar el switch de cabecera. Solo empleos ya persistidos. */
  onMostrarEnCvChange(exp: ExperienciaUI, nuevo: boolean): void {
    if (exp.experienciaId === 0) {
      return;
    }
    const prev = !nuevo;
    if (this.guardandoVisibilidadExpId === exp.experienciaId) {
      return;
    }
    this.guardandoVisibilidadExpId = exp.experienciaId;
    this.cvEditorService
      .updateExperienciaVisibilidad(exp.experienciaId, { mostrarEnCv: nuevo })
      .subscribe({
      next: actualizada => {
        Object.assign(exp, actualizada, { expanded: exp.expanded, form: this.toForm(actualizada) });
        this.guardandoVisibilidadExpId = null;
        this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
      },
      error: (error: HttpErrorResponse) => {
        exp.form.mostrarEnCv = prev;
        this.guardandoVisibilidadExpId = null;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
    });
  }

  agregar(): void {
    if (this.experiencias.some(e => e.experienciaId === 0)) {
      this.notificationService.warning(FORM_MESSAGES.experiencia.completeNuevoAntesDeOtro);
      return;
    }
    const nueva: ExperienciaUI = {
      experienciaId: 0,
      fechaRegistro: '',
      empresa: null,
      cargo: null,
      sector: null,
      fechaInicio: null,
      fechaFin: null,
      tipoContrato: null,
      motivoRetiro: null,
      funciones: null,
      esActual: true,
      mostrarEnCv: true,
      adjuntoSoporte: null,
      expanded: true,
      form: {
        empresa: null,
        cargo: null,
        sector: null,
        fechaInicio: null,
        fechaFin: null,
        tipoContrato: null,
        motivoRetiro: null,
        funciones: null,
        esActual: true,
        mostrarEnCv: true,
        adjuntoSoporte: null,
      },
    };
    this.experiencias.unshift(nueva);
  }

  cancelarNuevo(exp: ExperienciaUI): void {
    if (exp.experienciaId !== 0) {
      return;
    }
    this.borradoresLaborales = this.borradoresLaborales.filter(b => b.experienciaId !== 0);
    this.experiencias = this.experiencias.filter(e => e !== exp);
  }

  guardar(exp: ExperienciaUI): void {
    const emp = (exp.form.empresa ?? '').trim();
    const cargo = (exp.form.cargo ?? '').trim();
    if (!emp) {
      this.notificationService.warning(FORM_MESSAGES.experiencia.requiredEmpresa);
      return;
    }
    if (!cargo) {
      this.notificationService.warning(FORM_MESSAGES.experiencia.requiredCargo);
      return;
    }
    exp.form.empresa = emp;
    exp.form.cargo = cargo;

    const payload = this.buildExperienciaUpsertPayload(exp);

    if (exp.form.fechaInicio && !payload.fechaInicio) {
      this.notificationService.warning(FORM_MESSAGES.experiencia.invalidDate);
      return;
    }

    if (!exp.form.esActual && exp.form.fechaFin && !payload.fechaFin) {
      this.notificationService.warning(FORM_MESSAGES.experiencia.invalidDate);
      return;
    }

    if (payload.fechaInicio && (payload.fechaInicio < this.minDate || payload.fechaInicio > this.todayDate)) {
      this.notificationService.warning(FORM_MESSAGES.experiencia.invalidDateRange);
      return;
    }

    if (payload.fechaFin && (payload.fechaFin < this.minDate || payload.fechaFin > this.todayDate)) {
      this.notificationService.warning(FORM_MESSAGES.experiencia.invalidDateRange);
      return;
    }

    if (!payload.esActual && payload.fechaInicio && payload.fechaFin && payload.fechaFin < payload.fechaInicio) {
      this.notificationService.warning(FORM_MESSAGES.experiencia.endBeforeStart);
      return;
    }

    if (exp.experienciaId === 0) {
      const borradorSinGuardar = this.borradoresLaborales.some(
        b => b.experienciaId === 0 && !b.committed && (b.form.nombre ?? '').trim()
      );
      if (borradorSinGuardar) {
        this.notificationService.warning(FORM_MESSAGES.experiencia.refBorradorSinGuardar);
        return;
      }
      const refsToCreate = this.collectRefsToCreateBeforeSave(exp);
      const emailErr = this.validateRefPayloadEmails(refsToCreate);
      if (emailErr) {
        this.notificationService.warning(emailErr);
        return;
      }
      this.guardando = true;
      this.cvEditorService.createExperiencia(payload).subscribe({
        next: creada => {
          Object.assign(exp, creada, { expanded: false, form: this.toForm(creada) });
          this.borradoresLaborales = this.borradoresLaborales.filter(b => b.experienciaId !== 0);
          this.guardando = false;
          this.notificationService.success(NOTIFICATION_MESSAGES.createSuccess);
          this.crearReferenciasEnLote(creada.experienciaId, emp, refsToCreate);
        },
        error: (error: HttpErrorResponse) => {
          this.guardando = false;
          this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
        },
      });
    } else {
      this.guardando = true;
      this.cvEditorService.updateExperiencia(exp.experienciaId, payload).subscribe({
        next: actualizada => {
          Object.assign(exp, actualizada, { expanded: false, form: this.toForm(actualizada) });
          this.guardando = false;
          this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
        },
        error: (error: HttpErrorResponse) => {
          this.guardando = false;
          this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
        },
      });
    }
  }

  private collectRefsToCreateBeforeSave(exp: ExperienciaUI): UpsertReferenciaRequest[] {
    return this.borradoresLaborales
      .filter(b => b.experienciaId === 0 && b.committed && (b.form.nombre ?? '').trim())
      .map(b => this.normalizeFormNuevoEmpleoRef(b.form, exp));
  }

  private validateRefPayloadEmails(refs: UpsertReferenciaRequest[]): string | null {
    for (const r of refs) {
      const e = (r.email ?? '').trim();
      if (e && !isValidEmail(e)) {
        return FORM_MESSAGES.referencias.invalidEmail;
      }
    }
    return null;
  }

  private buildRefPayloadForCreate(
    experienciaId: number,
    empresaDefault: string,
    ref: UpsertReferenciaRequest
  ): UpsertReferenciaRequest {
    return {
      tipoReferencia: 'Laboral',
      experienciaId,
      nombre: (ref.nombre ?? '').trim(),
      apellido: ref.apellido?.trim() || null,
      email: (ref.email ?? '').trim() || null,
      telefono: ref.telefono?.trim() || null,
      parentesco: ref.parentesco?.trim() || null,
      cargo: ref.cargo?.trim() || null,
      empresa: (ref.empresa ?? '').trim() || empresaDefault || null,
      relacion: ref.relacion?.trim() || null,
      observaciones: ref.observaciones?.trim() || null,
      adjuntoSoporte: ref.adjuntoSoporte ?? null,
    };
  }

  private crearReferenciasEnLote(
    experienciaId: number,
    empresa: string,
    refs: UpsertReferenciaRequest[]
  ): void {
    if (refs.length === 0) {
      return;
    }
    this.guardandoRef = true;
    forkJoin(
      refs.map(r =>
        this.cvEditorService.createReferencia(this.buildRefPayloadForCreate(experienciaId, empresa, r))
      )
    ).subscribe({
      next: creadas => {
        this.referencias = [...this.referencias, ...creadas];
        for (const r of creadas) {
          this.laborRefUi[r.referenciaId] = { expanded: false, form: this.referenciaToForm(r) };
        }
        this.guardandoRef = false;
      },
      error: (error: HttpErrorResponse) => {
        this.guardandoRef = false;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
    });
  }

  eliminarReferencia(ref: ReferenciaDto): void {
    if (!confirm('¿Eliminar esta referencia laboral?')) {
      return;
    }
    this.guardandoRef = true;
    this.cvEditorService.deleteReferencia(ref.referenciaId).subscribe({
      next: () => {
        this.referencias = this.referencias.filter(r => r.referenciaId !== ref.referenciaId);
        delete this.laborRefUi[ref.referenciaId];
        this.guardandoRef = false;
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
      },
      error: () => {
        this.guardandoRef = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.deleteError);
      },
    });
  }

  eliminar(exp: ExperienciaUI): void {
    if (exp.experienciaId === 0) {
      this.cancelarNuevo(exp);
      return;
    }
    if (!confirm('¿Eliminar este empleo?')) {
      return;
    }
    this.cvEditorService.deleteExperiencia(exp.experienciaId).subscribe({
      next: () => {
        const id = exp.experienciaId;
        const refsDelEmpleo = this.referencias.filter(r => r.experienciaId === id);
        for (const r of refsDelEmpleo) {
          delete this.laborRefUi[r.referenciaId];
        }
        this.experiencias = this.experiencias.filter(e => e !== exp);
        this.referencias = this.referencias.filter(r => r.experienciaId !== id);
        this.borradoresLaborales = this.borradoresLaborales.filter(b => b.experienciaId !== id);
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.deleteError),
    });
  }
}
