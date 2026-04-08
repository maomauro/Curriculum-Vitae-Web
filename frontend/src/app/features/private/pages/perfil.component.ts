import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CvEditorService, PerfilDto, UpsertPerfilRequest } from '../../../core/services/private/cv-editor.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';

interface PerfilUI extends PerfilDto {
  editando: boolean;
  form: UpsertPerfilRequest;
}

@Component({
  selector: 'app-perfil',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-person-badge-fill me-2 text-primary"></i>Perfil Profesional</h4>
        <span class="text-muted small">Define los perfiles laborales que buscas y tu disponibilidad</span>
      </div>
      <button class="btn btn-primary btn-sm" (click)="abrirNuevo()">
        <i class="bi bi-plus-circle me-1"></i>Agregar perfil
      </button>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Formulario nuevo perfil -->
    <div *ngIf="!loading && mostrarFormNuevo" class="seccion-card mb-4"
         style="border-color:#2c7be5;box-shadow:0 0 0 4px rgba(44,123,229,.08);">
      <div class="seccion-titulo"><i class="bi bi-plus-circle-fill"></i>Nuevo perfil</div>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Nombre del perfil <span class="text-danger">*</span></label>
          <input type="text" class="form-control" placeholder="Ej: Frontend Developer"
                 [(ngModel)]="formNuevo.nombrePerfil">
        </div>
        <div class="col-md-3">
          <label class="form-label">Sueldo mínimo (COP)</label>
          <input type="number" class="form-control" min="0"
                 [(ngModel)]="formNuevo.aspiracionSalarialPesos">
        </div>
        <div class="col-md-3">
          <label class="form-label">Sueldo mínimo (USD)</label>
          <input type="number" class="form-control" min="0"
                 [(ngModel)]="formNuevo.aspiracionSalarialDolares">
        </div>
        <div class="col-12">
          <label class="form-label">Descripción / Resumen profesional</label>
          <textarea class="form-control" rows="3"
                    placeholder="Describe brevemente tu perfil..."
                    [(ngModel)]="formNuevo.descripcionPerfil"></textarea>
        </div>
        <div class="col-12 d-flex align-items-center justify-content-between">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="esActivoNuevo"
                   [(ngModel)]="formNuevo.esActivo">
            <label class="form-check-label" for="esActivoNuevo">Marcar como perfil activo</label>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary btn-sm" (click)="cancelarNuevo()">Cancelar</button>
            <button class="btn btn-primary btn-sm" (click)="crear()" [disabled]="guardando">
              <i class="bi bi-floppy-fill me-1"></i>Guardar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de perfiles -->
    <ng-container *ngIf="!loading">
      <div *ngIf="perfiles.length === 0 && !mostrarFormNuevo" class="text-center py-5 text-muted">
        <i class="bi bi-person-badge display-5"></i>
        <p class="mt-3">Aún no tienes perfiles laborales. Agrega uno.</p>
      </div>

      <div *ngFor="let p of perfiles"
           class="seccion-card mb-4"
           [style.border-color]="p.esActivo ? '#2c7be5' : '#e9ecef'"
           [style.box-shadow]="p.esActivo ? '0 0 0 4px rgba(44,123,229,.08)' : ''">

        <!-- Vista -->
        <ng-container *ngIf="!p.editando">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <span class="fw-bold">{{ p.nombrePerfil }}</span>
              <span *ngIf="p.esActivo" class="ms-2 badge"
                    style="background:#d1fae5;color:#065f46;font-size:.7rem;border-radius:20px;padding:3px 10px;">
                <i class="bi bi-check-circle-fill me-1"></i>Activo
              </span>
              <span *ngIf="!p.esActivo" class="ms-2 badge"
                    style="background:#f1f5f9;color:#94a3b8;font-size:.7rem;border-radius:20px;padding:3px 10px;">
                Inactivo
              </span>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-secondary btn-sm" (click)="abrirEdicion(p)">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-outline-danger btn-sm" (click)="eliminar(p)">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
          <p *ngIf="p.descripcionPerfil" class="text-muted small mb-2">{{ p.descripcionPerfil }}</p>
          <div class="row g-2">
            <div *ngIf="p.aspiracionSalarialPesos" class="col-md-6">
              <small class="text-muted d-block">Salario mínimo (COP)</small>
              <strong>$ {{ p.aspiracionSalarialPesos | number }} COP</strong>
            </div>
            <div *ngIf="p.aspiracionSalarialDolares" class="col-md-6">
              <small class="text-muted d-block">Salario mínimo (USD)</small>
              <strong>$ {{ p.aspiracionSalarialDolares | number }} USD</strong>
            </div>
          </div>
        </ng-container>

        <!-- Edición inline -->
        <ng-container *ngIf="p.editando">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Nombre del perfil <span class="text-danger">*</span></label>
              <input type="text" class="form-control" [(ngModel)]="p.form.nombrePerfil">
            </div>
            <div class="col-md-3">
              <label class="form-label">Sueldo mínimo (COP)</label>
              <input type="number" class="form-control" min="0"
                     [(ngModel)]="p.form.aspiracionSalarialPesos">
            </div>
            <div class="col-md-3">
              <label class="form-label">Sueldo mínimo (USD)</label>
              <input type="number" class="form-control" min="0"
                     [(ngModel)]="p.form.aspiracionSalarialDolares">
            </div>
            <div class="col-12">
              <label class="form-label">Descripción / Resumen profesional</label>
              <textarea class="form-control" rows="3" [(ngModel)]="p.form.descripcionPerfil"></textarea>
            </div>
            <div class="col-12 d-flex align-items-center justify-content-between">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" [id]="'esActivo_'+p.perfilId"
                       [(ngModel)]="p.form.esActivo">
                <label class="form-check-label" [for]="'esActivo_'+p.perfilId">Perfil activo</label>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-outline-secondary btn-sm" (click)="p.editando=false">Cancelar</button>
                <button class="btn btn-outline-danger btn-sm" (click)="eliminar(p)">
                  <i class="bi bi-trash me-1"></i>Eliminar
                </button>
                <button class="btn btn-primary btn-sm" (click)="actualizar(p)" [disabled]="guardando">
                  <i class="bi bi-floppy-fill me-1"></i>Guardar
                </button>
              </div>
            </div>
          </div>
        </ng-container>

      </div>
    </ng-container>
  `
})
export class PerfilComponent implements OnInit {
  perfiles: PerfilUI[] = [];
  loading = false;
  guardando = false;
  mostrarFormNuevo = false;

  formNuevo: UpsertPerfilRequest = {
    nombrePerfil: null, descripcionPerfil: null,
    aspiracionSalarialPesos: null, aspiracionSalarialDolares: null, esActivo: true
  };

  constructor(
    private cvEditorService: CvEditorService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.cvEditorService.getPerfiles().subscribe({
      next: data => {
        this.perfiles = data.map(p => ({ ...p, editando: false, form: { ...p } }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      }
    });
  }

  abrirNuevo(): void {
    this.formNuevo = { nombrePerfil: null, descripcionPerfil: null,
                       aspiracionSalarialPesos: null, aspiracionSalarialDolares: null, esActivo: true };
    this.mostrarFormNuevo = true;
  }

  cancelarNuevo(): void {
    this.mostrarFormNuevo = false;
  }

  crear(): void {
    if (!this.formNuevo.nombrePerfil?.trim()) return;
    this.guardando = true;
    this.cvEditorService.createPerfil(this.formNuevo).subscribe({
      next: nuevo => {
        this.perfiles.push({ ...nuevo, editando: false, form: { ...nuevo } });
        this.mostrarFormNuevo = false;
        this.guardando = false;
        this.notificationService.success(NOTIFICATION_MESSAGES.createSuccess);
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      }
    });
  }

  abrirEdicion(p: PerfilUI): void {
    p.form = { nombrePerfil: p.nombrePerfil, descripcionPerfil: p.descripcionPerfil,
               aspiracionSalarialPesos: p.aspiracionSalarialPesos,
               aspiracionSalarialDolares: p.aspiracionSalarialDolares, esActivo: p.esActivo };
    p.editando = true;
  }

  actualizar(p: PerfilUI): void {
    if (!p.form.nombrePerfil?.trim()) return;
    this.guardando = true;
    this.cvEditorService.updatePerfil(p.perfilId, p.form).subscribe({
      next: actualizado => {
        Object.assign(p, actualizado, { editando: false, form: { ...actualizado } });
        this.guardando = false;
        this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      }
    });
  }

  eliminar(p: PerfilUI): void {
    if (!confirm('¿Eliminar este perfil?')) return;
    this.cvEditorService.deletePerfil(p.perfilId).subscribe({
      next: () => {
        this.perfiles = this.perfiles.filter(x => x.perfilId !== p.perfilId);
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.deleteError)
    });
  }
}
