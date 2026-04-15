import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CvEditorService, PerfilDto, UpsertPerfilRequest } from '../../../core/services/private/cv-editor.service';
import { FORM_MESSAGES } from '../../../core/constants/form-messages';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';

interface PerfilUI extends PerfilDto {
  form: UpsertPerfilRequest;
}

@Component({
  selector: 'app-perfil',
  standalone: false,
  template: `
    <div class="page-header d-flex flex-wrap justify-content-between align-items-center gap-3">
      <div>
        <h4><i class="bi bi-person-badge-fill me-2 text-primary"></i>Perfil Profesional</h4>
        <p class="text-muted small mb-0">
          Define el cargo y descripción con que te presentas ante empleadores. Solo un perfil puede estar activo a la vez.
        </p>
      </div>
      <button type="button" class="btn btn-primary btn-sm" (click)="abrirNuevo()">
        <i class="bi bi-plus-circle me-1"></i>Agregar perfil
      </button>
    </div>

    <div class="perfil-gap-notice">
      <i class="bi bi-info-circle-fill me-1"></i>
      El perfil <strong>activo</strong> es el que se prioriza en búsquedas y vistas públicas. Al activar uno, los demás se desactivan automáticamente al guardar el cambio de estado.
    </div>

    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Nuevo perfil -->
    <div *ngIf="!loading && mostrarFormNuevo" class="perfil-nuevo-card">
      <div class="profile-card-header">
        <div class="profile-name">
          <i class="bi bi-plus-circle text-primary" aria-hidden="true"></i>
          Nuevo perfil
        </div>
        <button type="button" class="btn btn-outline-secondary btn-sm" (click)="cancelarNuevo()">
          <i class="bi bi-x-lg me-1"></i>Cancelar
        </button>
      </div>
      <div class="row g-3">
        <div class="col-md-5">
          <label class="form-label">Nombre del perfil / Cargo objetivo <span class="text-danger">*</span></label>
          <input type="text" class="form-control" placeholder="Ej: Scrum Master, Data Analyst…"
                 [(ngModel)]="formNuevo.nombrePerfil">
        </div>
        <div class="col-md-7">
          <label class="form-label">Descripción / Resumen profesional</label>
          <textarea class="form-control" rows="3"
                    placeholder="Escribe un resumen corto de este perfil profesional…"
                    [(ngModel)]="formNuevo.descripcionPerfil"></textarea>
        </div>
        <div class="col-md-3">
          <label class="form-label">Experiencia en este perfil (años)</label>
          <input type="number" class="form-control" min="0" step="0.5" placeholder="Ej: 7.5"
                 [(ngModel)]="formNuevo.experienciaPerfilAnios">
        </div>
        <div class="col-md-3">
          <label class="form-label">Aspiración salarial (COP)</label>
          <div class="input-group">
            <span class="input-group-text">$</span>
            <input type="number" class="form-control" min="0" placeholder="0"
                   [(ngModel)]="formNuevo.aspiracionSalarialPesos">
          </div>
        </div>
        <div class="col-md-3">
          <label class="form-label">Aspiración salarial (USD)</label>
          <div class="input-group">
            <span class="input-group-text">$</span>
            <input type="number" class="form-control" min="0" placeholder="0"
                   [(ngModel)]="formNuevo.aspiracionSalarialDolares">
          </div>
        </div>
        <div class="col-12 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div class="form-check form-switch mb-0">
            <input class="form-check-input" type="checkbox" id="activoNuevo"
                   [(ngModel)]="formNuevo.esActivo" [disabled]="guardando">
            <label class="form-check-label" for="activoNuevo">Activar este perfil al crearlo</label>
          </div>
          <button type="button" class="btn btn-primary px-4" (click)="crear()" [disabled]="guardando">
            <span *ngIf="guardando" class="spinner-border spinner-border-sm me-1"></span>
            <i *ngIf="!guardando" class="bi bi-floppy-fill me-2"></i>Crear perfil
          </button>
        </div>
      </div>
    </div>

    <ng-container *ngIf="!loading">
      <div *ngIf="perfiles.length === 0 && !mostrarFormNuevo" class="text-center py-5 text-muted">
        <i class="bi bi-person-badge display-5"></i>
        <p class="mt-3">Aún no tienes perfiles laborales. Agrega uno.</p>
      </div>

      <div *ngFor="let p of perfiles; trackBy: trackByPerfil"
           class="profile-card"
           [class.is-active]="p.form.esActivo">

        <div class="profile-card-header">
          <div class="profile-name cv-cursor-pointer"
               role="button"
               tabindex="0"
               [attr.aria-expanded]="isPerfilAccordionOpen(p.perfilId)"
               [attr.aria-controls]="'perfil-panel-' + p.perfilId"
               (click)="togglePerfilAccordion(p.perfilId)"
               (keydown.enter)="togglePerfilAccordion(p.perfilId)"
               (keydown.space)="$event.preventDefault(); togglePerfilAccordion(p.perfilId)">
            <i class="bi cv-chevron-muted" aria-hidden="true"
               [class.bi-chevron-down]="!isPerfilAccordionOpen(p.perfilId)"
               [class.bi-chevron-up]="isPerfilAccordionOpen(p.perfilId)"></i>
            {{ p.form.nombrePerfil || 'Sin nombre' }}
            <span *ngIf="p.form.esActivo" class="badge-active">
              <i class="bi bi-check-circle-fill" aria-hidden="true"></i>Activo
            </span>
            <span *ngIf="!p.form.esActivo" class="badge-inactive">Inactivo</span>
          </div>
          <div class="profile-toggle-row">
            <span class="profile-toggle-label">Activar este perfil</span>
            <div class="form-check form-switch mb-0">
              <input class="form-check-input" type="checkbox" role="switch"
                     [id]="'toggle-perfil-' + p.perfilId"
                     [ngModel]="p.form.esActivo"
                     (ngModelChange)="onActivoChange(p, $event)"
                     [disabled]="guardando">
            </div>
          </div>
        </div>

        <div *ngIf="isPerfilAccordionOpen(p.perfilId)"
             class="row g-3"
             [id]="'perfil-panel-' + p.perfilId"
             role="region">
          <div class="col-md-5">
            <label class="form-label" [attr.for]="'nombre-' + p.perfilId">Nombre del perfil / Cargo objetivo <span class="text-danger">*</span></label>
            <input type="text" class="form-control" [id]="'nombre-' + p.perfilId"
                   [(ngModel)]="p.form.nombrePerfil">
          </div>
          <div class="col-md-7">
            <label class="form-label" [attr.for]="'desc-' + p.perfilId">Descripción / Resumen profesional</label>
            <textarea class="form-control" rows="3" [id]="'desc-' + p.perfilId"
                      [(ngModel)]="p.form.descripcionPerfil"></textarea>
          </div>
          <div class="col-md-3">
            <label class="form-label">Experiencia en este perfil (años)</label>
            <input type="number" class="form-control" min="0" step="0.5"
                   [(ngModel)]="p.form.experienciaPerfilAnios">
          </div>
          <div class="col-md-3">
            <label class="form-label">Aspiración salarial (COP)</label>
            <div class="input-group">
              <span class="input-group-text">$</span>
              <input type="number" class="form-control" min="0"
                     [(ngModel)]="p.form.aspiracionSalarialPesos">
            </div>
          </div>
          <div class="col-md-3">
            <label class="form-label">Aspiración salarial (USD)</label>
            <div class="input-group">
              <span class="input-group-text">$</span>
              <input type="number" class="form-control" min="0"
                     [(ngModel)]="p.form.aspiracionSalarialDolares">
            </div>
          </div>
        </div>

        <div *ngIf="isPerfilAccordionOpen(p.perfilId)" class="perfil-action-row">
          <button type="button" class="btn btn-outline-danger btn-sm" (click)="eliminar(p)" [disabled]="guardando">
            <i class="bi bi-trash3 me-1"></i>Eliminar
          </button>
          <button type="button" class="btn btn-primary px-4" (click)="guardar(p)" [disabled]="guardando">
            <span *ngIf="guardando" class="spinner-border spinner-border-sm me-1"></span>
            <i *ngIf="!guardando" class="bi bi-floppy-fill me-2"></i>Guardar
          </button>
        </div>
      </div>
    </ng-container>
  `,
})
export class PerfilComponent implements OnInit {
  perfiles: PerfilUI[] = [];
  loading = false;
  guardando = false;
  mostrarFormNuevo = false;
  private perfilesAbiertos = new Set<number>();

  formNuevo: UpsertPerfilRequest = {
    nombrePerfil: null,
    descripcionPerfil: null,
    experienciaPerfilAnios: null,
    aspiracionSalarialPesos: null,
    aspiracionSalarialDolares: null,
    esActivo: true,
  };

  constructor(
    private cvEditorService: CvEditorService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  trackByPerfil(_index: number, p: PerfilUI): number {
    return p.perfilId;
  }

  togglePerfilAccordion(perfilId: number): void {
    if (this.perfilesAbiertos.has(perfilId)) {
      this.perfilesAbiertos.delete(perfilId);
      return;
    }
    this.perfilesAbiertos.add(perfilId);
  }

  isPerfilAccordionOpen(perfilId: number): boolean {
    return this.perfilesAbiertos.has(perfilId);
  }

  private toForm(p: PerfilDto): UpsertPerfilRequest {
    return {
      nombrePerfil: p.nombrePerfil,
      descripcionPerfil: p.descripcionPerfil,
      experienciaPerfilAnios: p.experienciaPerfilAnios,
      aspiracionSalarialPesos: p.aspiracionSalarialPesos,
      aspiracionSalarialDolares: p.aspiracionSalarialDolares,
      esActivo: p.esActivo,
    };
  }

  private buildRequest(ui: PerfilUI): UpsertPerfilRequest {
    const f = ui.form;
    return {
      nombrePerfil: f.nombrePerfil?.trim() || null,
      descripcionPerfil: f.descripcionPerfil?.trim() || null,
      experienciaPerfilAnios: f.experienciaPerfilAnios ?? null,
      aspiracionSalarialPesos: f.aspiracionSalarialPesos ?? null,
      aspiracionSalarialDolares: f.aspiracionSalarialDolares ?? null,
      esActivo: f.esActivo,
    };
  }

  cargar(): void {
    this.loading = true;
    this.cvEditorService.getPerfiles().subscribe({
      next: data => {
        this.perfiles = data.map(p => ({ ...p, form: this.toForm(p) }));
        this.perfilesAbiertos.clear();
        this.loading = false;
        this.guardando = false;
      },
      error: () => {
        this.loading = false;
        this.guardando = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      },
    });
  }

  abrirNuevo(): void {
    this.formNuevo = {
      nombrePerfil: null,
      descripcionPerfil: null,
      experienciaPerfilAnios: null,
      aspiracionSalarialPesos: null,
      aspiracionSalarialDolares: null,
      esActivo: true,
    };
    this.mostrarFormNuevo = true;
  }

  cancelarNuevo(): void {
    this.mostrarFormNuevo = false;
  }

  /** Al activar un perfil, se desactivan el resto en servidor y se refresca la lista. */
  onActivoChange(p: PerfilUI, checked: boolean): void {
    if (checked) {
      this.perfiles.forEach(x => {
        if (x.perfilId !== p.perfilId) {
          x.form.esActivo = false;
        }
      });
      p.form.esActivo = true;
      this.persistirActivacionUnica(p);
    } else {
      p.form.esActivo = false;
    }
  }

  private persistirActivacionUnica(p: PerfilUI): void {
    const otros = this.perfiles.filter(x => x.perfilId !== p.perfilId);
    const desactivar$: Observable<PerfilDto[] | null> =
      otros.length > 0
        ? forkJoin(
            otros.map(o =>
              this.cvEditorService.updatePerfil(o.perfilId, {
                ...this.buildRequest(o),
                esActivo: false,
              })
            )
          )
        : of(null);

    this.guardando = true;
    desactivar$
      .pipe(
        switchMap(() =>
          this.cvEditorService.updatePerfil(p.perfilId, {
            ...this.buildRequest(p),
            esActivo: true,
          })
        )
      )
      .subscribe({
        next: () => {
          this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
          this.cargar();
        },
        error: (error: HttpErrorResponse) => {
          this.guardando = false;
          this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
          this.cargar();
        },
      });
  }

  crear(): void {
    const nombre = (this.formNuevo.nombrePerfil ?? '').trim();
    if (!nombre) {
      this.notificationService.warning(FORM_MESSAGES.perfil.requiredNombre);
      return;
    }

    const payload: UpsertPerfilRequest = {
      nombrePerfil: nombre,
      descripcionPerfil: this.formNuevo.descripcionPerfil?.trim() || null,
      experienciaPerfilAnios: this.formNuevo.experienciaPerfilAnios ?? null,
      aspiracionSalarialPesos: this.formNuevo.aspiracionSalarialPesos ?? null,
      aspiracionSalarialDolares: this.formNuevo.aspiracionSalarialDolares ?? null,
      esActivo: this.formNuevo.esActivo,
    };

    this.guardando = true;

    const desactivarExistentes$: Observable<PerfilDto[] | null> =
      payload.esActivo && this.perfiles.length > 0
        ? forkJoin(
            this.perfiles.map(o =>
              this.cvEditorService.updatePerfil(o.perfilId, {
                ...this.buildRequest(o),
                esActivo: false,
              })
            )
          )
        : of(null);

    desactivarExistentes$
      .pipe(switchMap(() => this.cvEditorService.createPerfil(payload)))
      .subscribe({
        next: () => {
          this.mostrarFormNuevo = false;
          this.notificationService.success(NOTIFICATION_MESSAGES.createSuccess);
          this.cargar();
        },
        error: (error: HttpErrorResponse) => {
          this.guardando = false;
          this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
        },
      });
  }

  guardar(p: PerfilUI): void {
    const nombre = (p.form.nombrePerfil ?? '').trim();
    if (!nombre) {
      this.notificationService.warning(FORM_MESSAGES.perfil.requiredNombre);
      return;
    }
    p.form.nombrePerfil = nombre;
    const payload = this.buildRequest(p);

    this.guardando = true;

    if (payload.esActivo) {
      const otros = this.perfiles.filter(x => x.perfilId !== p.perfilId);
      const desactivar$: Observable<PerfilDto[] | null> =
        otros.length > 0
          ? forkJoin(
              otros.map(o =>
                this.cvEditorService.updatePerfil(o.perfilId, {
                  ...this.buildRequest(o),
                  esActivo: false,
                })
              )
            )
          : of(null);

      desactivar$
        .pipe(switchMap(() => this.cvEditorService.updatePerfil(p.perfilId, { ...payload, esActivo: true })))
        .subscribe({
          next: () => {
            this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
            this.cargar();
          },
          error: (error: HttpErrorResponse) => {
            this.guardando = false;
            this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
            this.cargar();
          },
        });
    } else {
      this.cvEditorService.updatePerfil(p.perfilId, payload).subscribe({
        next: () => {
          this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
          this.cargar();
        },
        error: (error: HttpErrorResponse) => {
          this.guardando = false;
          this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
          this.cargar();
        },
      });
    }
  }

  eliminar(p: PerfilUI): void {
    if (!confirm('¿Eliminar este perfil?')) {
      return;
    }
    this.guardando = true;
    this.cvEditorService.deletePerfil(p.perfilId).subscribe({
      next: () => {
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
        this.cargar();
      },
      error: () => {
        this.guardando = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.deleteError);
      },
    });
  }
}
