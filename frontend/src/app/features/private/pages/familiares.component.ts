import { Component, OnInit } from '@angular/core';
import { CvEditorService, FamiliarContactoDto, UpsertFamiliarContactoRequest } from '../../../core/services/cv-editor.service';

interface FamiliarUI extends FamiliarContactoDto {
  editando: boolean;
  form: UpsertFamiliarContactoRequest;
}

@Component({
  selector: 'app-familiares',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-house-heart-fill me-2 text-primary"></i>Familiares / Contactos de Emergencia</h4>
        <span class="text-muted small">Personas de contacto en caso de emergencia</span>
      </div>
      <button class="btn btn-primary btn-sm" (click)="agregar()">
        <i class="bi bi-plus-circle me-1"></i>Agregar contacto
      </button>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Sin datos -->
    <div *ngIf="!loading && familiares.length === 0" class="text-center py-5 text-muted">
      <i class="bi bi-people display-5"></i>
      <p class="mt-3">No tienes contactos de emergencia registrados. Agrega el primero.</p>
    </div>

    <!-- Lista -->
    <div *ngFor="let fam of familiares">
      <div class="bg-white rounded-3 shadow-sm mb-3 overflow-hidden">

        <!-- Cabecera -->
        <div class="p-4 d-flex align-items-center gap-3" style="cursor:pointer;"
             (click)="fam.editando = !fam.editando; fam.form = toForm(fam)">
          <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
               style="width:44px;height:44px;background:#fef3c7;color:#d97706;font-size:1.1rem;">
            <i class="bi bi-person-heart"></i>
          </div>
          <div class="flex-grow-1">
            <div class="fw-bold" style="font-size:.95rem;">{{ fam.nombres }} {{ fam.apellidos }}</div>
            <div style="font-size:.85rem;color:#6c757d;">{{ fam.parentesco }}</div>
          </div>
          <span *ngIf="fam.esContactoPrincipal"
                class="badge rounded-pill"
                style="background:#d1fae5;color:#065f46;font-size:.7rem;padding:3px 10px;">
            Principal
          </span>
          <i class="bi ms-2" [class.bi-chevron-down]="!fam.editando"
             [class.bi-chevron-up]="fam.editando" style="color:#adb5bd;"></i>
        </div>

        <!-- Cuerpo expandible -->
        <div *ngIf="fam.editando" class="px-4 pb-4" style="border-top:1px solid #f0f0f0;">
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
                       [id]="'principal-' + fam.familiarId">
                <label class="form-check-label" [for]="'principal-' + fam.familiarId">
                  Contacto principal de emergencia
                </label>
              </div>
            </div>

          </div>

          <!-- Acciones -->
          <div class="d-flex gap-2 mt-3 justify-content-end">
            <button class="btn btn-outline-danger btn-sm" (click)="eliminar(fam)">
              <i class="bi bi-trash me-1"></i>Eliminar
            </button>
            <button class="btn btn-primary btn-sm" (click)="guardar(fam)" [disabled]="guardando">
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
  familiares: FamiliarUI[] = [];
  loading = false;
  guardando = false;

  constructor(private cvEditorService: CvEditorService) {}

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
      error: () => { this.loading = false; }
    });
  }

  toForm(f: FamiliarContactoDto): UpsertFamiliarContactoRequest {
    const { familiarId, ...rest } = f;
    return rest;
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
    this.guardando = true;
    const obs = fam.familiarId === 0
      ? this.cvEditorService.createFamiliar(fam.form)
      : this.cvEditorService.updateFamiliar(fam.familiarId, fam.form);

    obs.subscribe({
      next: data => {
        Object.assign(fam, data, { editando: false, form: this.toForm(data) });
        this.guardando = false;
      },
      error: () => { this.guardando = false; }
    });
  }

  eliminar(fam: FamiliarUI): void {
    if (fam.familiarId === 0) {
      this.familiares = this.familiares.filter(f => f !== fam);
      return;
    }
    if (!confirm('¿Eliminar este contacto?')) return;
    this.cvEditorService.deleteFamiliar(fam.familiarId).subscribe({
      next: () => { this.familiares = this.familiares.filter(f => f !== fam); }
    });
  }
}
