import { Component, Input, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CvEditorService, FamiliarContactoDto, UpsertFamiliarContactoRequest } from '../../../core/services/private/cv-editor.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { FORM_MESSAGES } from '../../../core/constants/form-messages';
import { extractApiErrorMessage, isValidEmail } from '../../../core/utils/form-validation.util';

interface FamiliarUI extends FamiliarContactoDto {
  editando: boolean;
  form: UpsertFamiliarContactoRequest;
}

@Component({
  selector: 'app-familiares',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header" *ngIf="!embedded">
      <div>
        <h4><i class="bi bi-house-heart-fill me-2 text-primary"></i>Familiares / Contactos de Emergencia</h4>
        <span class="text-muted small">Personas de contacto en caso de emergencia</span>
      </div>
      <button type="button" class="btn btn-primary btn-sm" (click)="agregar()">
        <i class="bi bi-plus-circle me-1"></i>Agregar contacto
      </button>
    </div>

    <div class="d-flex justify-content-end mb-2" *ngIf="embedded">
      <button type="button" class="btn btn-outline-secondary btn-sm" (click)="agregar()">
        <i class="bi bi-plus-circle me-1"></i>Agregar contacto
      </button>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="text-center" [class.py-5]="!embedded" [class.py-3]="embedded">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Sin datos -->
    <div *ngIf="!loading && familiares.length === 0" class="text-center text-muted" [class.py-5]="!embedded" [class.py-3]="embedded">
      <i class="bi bi-people display-5"></i>
      <p class="mt-3">No tienes contactos de emergencia registrados. Agrega el primero.</p>
    </div>

    <!-- Lista -->
    <div *ngFor="let fam of familiares; let i = index; trackBy: trackByFamiliar">
      <div class="bg-white rounded-3 shadow-sm mb-3 overflow-hidden">

        <!-- Cabecera -->
        <div class="p-4 d-flex align-items-center gap-3 cv-cursor-pointer"
             (click)="toggleEditarFamiliar(fam)">
          <div class="rounded-3 cv-icon-box cv-icon-box--warning">
            <i class="bi bi-person-heart"></i>
          </div>
          <div class="flex-grow-1">
            <div class="fw-bold cv-accordion-title">{{ tituloCabecera(fam) }}</div>
            <div class="cv-accordion-sub-muted">{{ subtituloCabecera(fam) }}</div>
          </div>
          <span *ngIf="esPrincipalCabecera(fam)"
                class="badge rounded-pill cv-badge-pill cv-badge-actual">
            Principal
          </span>
          <i class="bi ms-2 cv-chevron-muted" [class.bi-chevron-down]="!fam.editando"
             [class.bi-chevron-up]="fam.editando" aria-hidden="true"></i>
        </div>

        <!-- Cuerpo expandible -->
        <div *ngIf="fam.editando" class="px-4 pb-4 cv-border-t-soft">
          <div class="row g-3 mt-1">

            <div class="col-md-4">
              <label class="form-label">Nombres</label>
              <input type="text" class="form-control" [(ngModel)]="fam.form.nombres">
            </div>
            <div class="col-md-4">
              <label class="form-label">Apellidos</label>
              <input type="text" class="form-control" [(ngModel)]="fam.form.apellidos">
            </div>
            <div class="col-md-4">
              <label class="form-label">Parentesco</label>
              <select class="form-select" [(ngModel)]="fam.form.parentesco">
                <option value="">— Selecciona —</option>
                <option value="Padre">Padre</option>
                <option value="Madre">Madre</option>
                <option value="Cónyuge">Cónyuge</option>
                <option value="Hermano/a">Hermano/a</option>
                <option value="Hijo/a">Hijo/a</option>
                <option value="Abuelo/a">Abuelo/a</option>
                <option value="Tío/a">Tío/a</option>
                <option value="Primo/a">Primo/a</option>
                <option value="Amigo/a">Amigo/a</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div class="col-md-4">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" [(ngModel)]="fam.form.email">
            </div>
            <div class="col-md-4">
              <label class="form-label">Teléfono</label>
              <input type="text" class="form-control" [(ngModel)]="fam.form.telefono">
            </div>
            <div class="col-md-4 d-flex align-items-end pb-1">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" [(ngModel)]="fam.form.esContactoPrincipal"
                       [id]="'principal-fam-' + i">
                <label class="form-check-label" [for]="'principal-fam-' + i">
                  Contacto principal de emergencia
                </label>
              </div>
            </div>

          </div>

          <!-- Acciones -->
          <div class="d-flex gap-2 mt-3 justify-content-end">
            <button *ngIf="fam.familiarId === 0" type="button" class="btn btn-outline-secondary btn-sm"
                    (click)="cancelar(fam)">
              Cancelar
            </button>
            <button *ngIf="fam.familiarId !== 0" type="button" class="btn btn-outline-danger btn-sm"
                    (click)="eliminar(fam)">
              <i class="bi bi-trash me-1"></i>Eliminar
            </button>
            <button type="button" class="btn btn-primary btn-sm" (click)="guardar(fam)" [disabled]="guardando">
              <span *ngIf="guardando" class="spinner-border spinner-border-sm me-1"></span>
              <i *ngIf="!guardando" class="bi bi-floppy me-1"></i>Guardar
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class FamiliaresComponent implements OnInit {
  /** Cuando es true, oculta la cabecera de página (uso dentro de Datos personales). */
  @Input() embedded = false;

  familiares: FamiliarUI[] = [];
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
    this.cvEditorService.getFamiliares().subscribe({
      next: data => {
        this.familiares = data.map(f => ({ ...f, editando: false, form: this.toForm(f) }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      }
    });
  }

  trackByFamiliar(_index: number, fam: FamiliarUI): string | number {
    return fam.familiarId > 0 ? fam.familiarId : `nuevo-${_index}`;
  }

  tituloCabecera(fam: FamiliarUI): string {
    const d = this.datosFamiliarParaCabecera(fam);
    const linea = `${d.nombres ?? ''} ${d.apellidos ?? ''}`.trim();
    return linea || 'Nuevo contacto';
  }

  subtituloCabecera(fam: FamiliarUI): string {
    const p = (this.datosFamiliarParaCabecera(fam).parentesco ?? '') as string;
    return p.trim() || '—';
  }

  /** En edición o contacto nuevo, la cabecera sigue el formulario; si no, los datos guardados. */
  private datosFamiliarParaCabecera(fam: FamiliarUI): UpsertFamiliarContactoRequest {
    return fam.familiarId === 0 || fam.editando ? fam.form : this.toForm(fam);
  }

  esPrincipalCabecera(fam: FamiliarUI): boolean {
    return fam.familiarId === 0 || fam.editando ? fam.form.esContactoPrincipal : fam.esContactoPrincipal;
  }

  toggleEditarFamiliar(fam: FamiliarUI): void {
    fam.editando = !fam.editando;
    if (fam.editando && fam.familiarId !== 0) {
      fam.form = this.toForm(fam);
    }
  }

  toForm(f: FamiliarContactoDto): UpsertFamiliarContactoRequest {
    return {
      parentesco: f.parentesco ?? null,
      nombres: f.nombres,
      apellidos: f.apellidos,
      email: f.email,
      telefono: f.telefono,
      esContactoPrincipal: f.esContactoPrincipal,
    };
  }

  agregar(): void {
    this.familiares.push({
      familiarId: 0,
      parentesco: null,
      nombres: null,
      apellidos: null,
      email: null,
      telefono: null,
      esContactoPrincipal: false,
      editando: true,
      form: { parentesco: null, nombres: null, apellidos: null, email: null, telefono: null, esContactoPrincipal: false },
    });
  }

  guardar(fam: FamiliarUI): void {
    const nombres = (fam.form.nombres ?? '').trim();
    if (!nombres) {
      this.notificationService.warning(FORM_MESSAGES.familiares.requiredNombres);
      return;
    }
    const emailRaw = (fam.form.email ?? '').trim();
    if (emailRaw && !isValidEmail(emailRaw)) {
      this.notificationService.warning(FORM_MESSAGES.familiares.invalidEmail);
      return;
    }

    fam.form = {
      parentesco: fam.form.parentesco?.trim() || null,
      nombres,
      apellidos: fam.form.apellidos?.trim() || null,
      email: emailRaw || null,
      telefono: fam.form.telefono?.trim() || null,
      esContactoPrincipal: fam.form.esContactoPrincipal,
    };

    this.guardando = true;
    const obs = fam.familiarId === 0
      ? this.cvEditorService.createFamiliar(fam.form)
      : this.cvEditorService.updateFamiliar(fam.familiarId, fam.form);

    obs.subscribe({
      next: data => {
        Object.assign(fam, data, { editando: false, form: this.toForm(data) });
        this.guardando = false;
        this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      }
    });
  }

  /** Quita un contacto recién agregado que aún no se ha guardado en el servidor. */
  cancelar(fam: FamiliarUI): void {
    if (fam.familiarId !== 0) return;
    this.familiares = this.familiares.filter(f => f !== fam);
  }

  eliminar(fam: FamiliarUI): void {
    if (fam.familiarId === 0) return;
    if (!confirm('¿Eliminar este contacto?')) return;
    this.cvEditorService.deleteFamiliar(fam.familiarId).subscribe({
      next: () => {
        this.familiares = this.familiares.filter(f => f !== fam);
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.deleteError)
    });
  }
}
