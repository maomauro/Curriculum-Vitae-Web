import { Component, Input, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CvEditorService, ReferenciaDto, UpsertReferenciaRequest } from '../../../core/services/private/cv-editor.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { FORM_MESSAGES } from '../../../core/constants/form-messages';
import { extractApiErrorMessage, isValidEmail } from '../../../core/utils/form-validation.util';

interface ReferenciaUI extends ReferenciaDto {
  expanded: boolean;
  form: UpsertReferenciaRequest;
}

@Component({
  selector: 'app-referencias',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header" *ngIf="!embedded">
      <div>
        <h4><i class="bi bi-people-fill me-2 text-primary"></i>Referencias</h4>
        <span class="text-muted small">Personas que pueden dar referencias laborales o personales</span>
      </div>
      <button type="button" class="btn btn-primary btn-sm" (click)="agregar()">
        <i class="bi bi-plus-circle me-1"></i>Agregar referencia
      </button>
    </div>

    <div class="d-flex justify-content-end mb-2" *ngIf="embedded">
      <button type="button" class="btn btn-outline-secondary btn-sm" (click)="agregar()">
        <i class="bi bi-plus-circle me-1"></i>Agregar referencia
      </button>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="text-center" [class.py-5]="!embedded" [class.py-3]="embedded">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Sin datos -->
    <div *ngIf="!loading && referencias.length === 0" class="text-center text-muted" [class.py-5]="!embedded" [class.py-3]="embedded">
      <i class="bi bi-people display-5"></i>
      <p class="mt-3">No tienes referencias registradas. Agrega la primera.</p>
    </div>

    <!-- Lista -->
    <div *ngFor="let ref of referencias">
      <div class="bg-white rounded-3 shadow-sm mb-3 overflow-hidden">

        <!-- Cabecera -->
        <div class="p-4 d-flex align-items-center gap-3" style="cursor:pointer;"
             (click)="ref.expanded = !ref.expanded">
          <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
               style="width:44px;height:44px;background:#ebf2ff;color:#2c7be5;font-size:1.1rem;">
            <i class="bi bi-person-lines-fill"></i>
          </div>
          <div class="flex-grow-1">
            <div class="fw-bold" style="font-size:.95rem;">{{ tituloCabecera(ref) }}</div>
            <div style="font-size:.85rem;color:#2c7be5;font-weight:600;">
              {{ subtituloCabecera(ref) }}
            </div>
          </div>
          <span class="badge rounded-pill"
                [style.background]="tipoRef(ref) === 'Laboral' ? '#dbeafe' : '#fef9c3'"
                [style.color]="tipoRef(ref) === 'Laboral' ? '#1e40af' : '#854d0e'"
                style="font-size:.7rem;padding:3px 10px;">
            {{ tipoRef(ref) }}
          </span>
          <i class="bi ms-2" [class.bi-chevron-down]="!ref.expanded"
             [class.bi-chevron-up]="ref.expanded" style="color:#adb5bd;"></i>
        </div>

        <!-- Cuerpo expandible -->
        <div *ngIf="ref.expanded" class="px-4 pb-4" style="border-top:1px solid #f0f0f0;">
          <div class="row g-3 mt-1">

            <div class="col-md-4">
              <label class="form-label">Tipo de referencia</label>
              <select class="form-select" [(ngModel)]="ref.form.tipoReferencia">
                <option value="Laboral">Laboral</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Nombre <span class="text-danger">*</span></label>
              <input type="text" class="form-control" [(ngModel)]="ref.form.nombre" autocomplete="name">
            </div>
            <div class="col-md-4">
              <label class="form-label">Apellido</label>
              <input type="text" class="form-control" [(ngModel)]="ref.form.apellido">
            </div>

            <div class="col-md-4">
              <label class="form-label">Cargo</label>
              <input type="text" class="form-control" [(ngModel)]="ref.form.cargo">
            </div>
            <div class="col-md-4">
              <label class="form-label">Empresa</label>
              <input type="text" class="form-control" [(ngModel)]="ref.form.empresa">
            </div>
            <div class="col-md-4">
              <label class="form-label">Relación</label>
              <input type="text" class="form-control" [(ngModel)]="ref.form.relacion"
                     placeholder="Ej: Jefe directo, Colega">
            </div>

            <div class="col-md-4">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" [(ngModel)]="ref.form.email">
            </div>
            <div class="col-md-4">
              <label class="form-label">Teléfono</label>
              <input type="text" class="form-control" [(ngModel)]="ref.form.telefono">
            </div>
            <div class="col-md-4">
              <label class="form-label">Parentesco</label>
              <input type="text" class="form-control" [(ngModel)]="ref.form.parentesco"
                     placeholder="Solo si aplica">
            </div>

            <div class="col-12">
              <label class="form-label">Observaciones</label>
              <textarea class="form-control" rows="2" [(ngModel)]="ref.form.observaciones"></textarea>
            </div>

          </div>

          <!-- Acciones -->
          <div class="d-flex gap-2 mt-3 justify-content-end">
            <button *ngIf="ref.referenciaId === 0" type="button" class="btn btn-outline-secondary btn-sm"
                    (click)="cancelar(ref)">
              Cancelar
            </button>
            <button *ngIf="ref.referenciaId !== 0" type="button" class="btn btn-outline-danger btn-sm"
                    (click)="eliminar(ref)">
              <i class="bi bi-trash me-1"></i>Eliminar
            </button>
            <button type="button" class="btn btn-primary btn-sm" (click)="guardar(ref)" [disabled]="guardando">
              <span *ngIf="guardando" class="spinner-border spinner-border-sm me-1"></span>
              <i *ngIf="!guardando" class="bi bi-floppy me-1"></i>Guardar
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class ReferenciasComponent implements OnInit {
  @Input() embedded = false;

  referencias: ReferenciaUI[] = [];
  loading = false;
  guardando = false;

  constructor(
    private cvEditorService: CvEditorService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.cvEditorService.getReferencias().subscribe({
      next: data => {
        this.referencias = data.map(r => ({ ...r, expanded: false, form: this.toForm(r) }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      }
    });
  }

  private toForm(r: ReferenciaDto): UpsertReferenciaRequest {
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

  agregar(): void {
    const nueva: ReferenciaUI = {
      referenciaId: 0,
      tipoReferencia: 'Laboral',
      experienciaId: null,
      nombre: '',
      apellido: null,
      email: null,
      telefono: null,
      parentesco: null,
      cargo: null,
      empresa: null,
      relacion: null,
      observaciones: null,
      adjuntoSoporte: null,
      fechaRegistro: '',
      expanded: true,
      form: {
        tipoReferencia: 'Laboral',
        experienciaId: null,
        nombre: '',
        apellido: null,
        email: null,
        telefono: null,
        parentesco: null,
        cargo: null,
        empresa: null,
        relacion: null,
        observaciones: null,
        adjuntoSoporte: null,
      },
    };
    this.referencias.unshift(nueva);
  }

  tituloCabecera(ref: ReferenciaUI): string {
    const usarForm = ref.referenciaId === 0 || ref.expanded;
    const nombre = (usarForm ? ref.form.nombre : ref.nombre) ?? '';
    const apellido = (usarForm ? ref.form.apellido : ref.apellido) ?? '';
    const linea = `${nombre} ${apellido}`.trim();
    return linea || 'Nueva referencia';
  }

  subtituloCabecera(ref: ReferenciaUI): string {
    const usarForm = ref.referenciaId === 0 || ref.expanded;
    const cargo = usarForm ? ref.form.cargo : ref.cargo;
    const empresa = usarForm ? ref.form.empresa : ref.empresa;
    const c = (cargo ?? '').trim();
    const e = (empresa ?? '').trim();
    if (c && e) return `${c} — ${e}`;
    return c || e || '—';
  }

  tipoRef(ref: ReferenciaUI): string {
    return ref.referenciaId === 0 || ref.expanded ? ref.form.tipoReferencia : ref.tipoReferencia;
  }

  guardar(ref: ReferenciaUI): void {
    const nombre = (ref.form.nombre ?? '').trim();
    if (!nombre) {
      this.notificationService.warning(FORM_MESSAGES.referencias.requiredNombre);
      return;
    }
    const emailRaw = (ref.form.email ?? '').trim();
    if (emailRaw && !isValidEmail(emailRaw)) {
      this.notificationService.warning(FORM_MESSAGES.referencias.invalidEmail);
      return;
    }

    ref.form = {
      ...ref.form,
      nombre,
      apellido: ref.form.apellido?.trim() || null,
      email: emailRaw || null,
      telefono: ref.form.telefono?.trim() || null,
      parentesco: ref.form.parentesco?.trim() || null,
      cargo: ref.form.cargo?.trim() || null,
      empresa: ref.form.empresa?.trim() || null,
      relacion: ref.form.relacion?.trim() || null,
      observaciones: ref.form.observaciones?.trim() || null,
    };

    this.guardando = true;
    const obs = ref.referenciaId === 0
      ? this.cvEditorService.createReferencia(ref.form)
      : this.cvEditorService.updateReferencia(ref.referenciaId, ref.form);

    obs.subscribe({
      next: data => {
        Object.assign(ref, data, { expanded: false, form: this.toForm(data) });
        this.guardando = false;
        this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      }
    });
  }

  cancelar(ref: ReferenciaUI): void {
    if (ref.referenciaId !== 0) return;
    this.referencias = this.referencias.filter(r => r !== ref);
  }

  eliminar(ref: ReferenciaUI): void {
    if (ref.referenciaId === 0) return;
    if (!confirm('¿Eliminar esta referencia?')) return;
    this.cvEditorService.deleteReferencia(ref.referenciaId).subscribe({
      next: () => {
        this.referencias = this.referencias.filter(r => r !== ref);
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.deleteError)
    });
  }
}
