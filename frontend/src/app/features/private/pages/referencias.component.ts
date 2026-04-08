import { Component, OnInit } from '@angular/core';
import { CvEditorService, ReferenciaDto, UpsertReferenciaRequest } from '../../../core/services/private/cv-editor.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';

interface ReferenciaUI extends ReferenciaDto {
  expanded: boolean;
  form: UpsertReferenciaRequest;
}

@Component({
  selector: 'app-referencias',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-people-fill me-2 text-primary"></i>Referencias</h4>
        <span class="text-muted small">Personas que pueden dar referencias laborales o personales</span>
      </div>
      <button class="btn btn-primary btn-sm" (click)="agregar()">
        <i class="bi bi-plus-circle me-1"></i>Agregar referencia
      </button>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Sin datos -->
    <div *ngIf="!loading && referencias.length === 0" class="text-center py-5 text-muted">
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
            <div class="fw-bold" style="font-size:.95rem;">{{ ref.nombre }} {{ ref.apellido }}</div>
            <div style="font-size:.85rem;color:#2c7be5;font-weight:600;">
              {{ ref.cargo }}<ng-container *ngIf="ref.cargo && ref.empresa"> — </ng-container>{{ ref.empresa }}
            </div>
          </div>
          <span class="badge rounded-pill"
                [style.background]="ref.tipoReferencia === 'Laboral' ? '#dbeafe' : '#fef9c3'"
                [style.color]="ref.tipoReferencia === 'Laboral' ? '#1e40af' : '#854d0e'"
                style="font-size:.7rem;padding:3px 10px;">
            {{ ref.tipoReferencia }}
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
                <option value="Académica">Académica</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Nombre</label>
              <input type="text" class="form-control" [(ngModel)]="ref.form.nombre">
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
            <button class="btn btn-outline-danger btn-sm" (click)="eliminar(ref)">
              <i class="bi bi-trash me-1"></i>Eliminar
            </button>
            <button class="btn btn-primary btn-sm" (click)="guardar(ref)" [disabled]="guardando">
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
    const { referenciaId, fechaRegistro, ...rest } = r;
    return rest;
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

  guardar(ref: ReferenciaUI): void {
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
      error: () => {
        this.guardando = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.saveError);
      }
    });
  }

  eliminar(ref: ReferenciaUI): void {
    if (ref.referenciaId === 0) {
      this.referencias = this.referencias.filter(r => r !== ref);
      return;
    }
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
