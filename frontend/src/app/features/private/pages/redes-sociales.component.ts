import { Component, Input, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CvEditorService, RedSocialDto, UpsertRedSocialRequest } from '../../../core/services/private/cv-editor.service';
import { FORM_MESSAGES } from '../../../core/constants/form-messages';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';

interface RedSocialUI extends RedSocialDto {
  editando: boolean;
  form: UpsertRedSocialRequest;
}

const REDES_OPCIONES = [
  { nombre: 'LinkedIn',   icono: 'bi-linkedin',  color: '#0a66c2' },
  { nombre: 'GitHub',     icono: 'bi-github',    color: '#24292e' },
  { nombre: 'X',          icono: 'bi-twitter-x', color: '#000' },
  { nombre: 'Instagram',  icono: 'bi-instagram', color: '#e1306c' },
  { nombre: 'Facebook',   icono: 'bi-facebook',  color: '#1877f2' },
  { nombre: 'YouTube',    icono: 'bi-youtube',   color: '#ff0000' },
  { nombre: 'Portfolio',  icono: 'bi-globe',     color: '#2c7be5' },
  { nombre: 'Otra',       icono: 'bi-link-45deg',color: '#6c757d' },
];

@Component({
  selector: 'app-redes-sociales',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header" *ngIf="!embedded">
      <div>
        <h4><i class="bi bi-share-fill me-2 text-primary"></i>Redes Sociales</h4>
        <span class="text-muted small">Perfil público, portafolio y redes profesionales</span>
      </div>
      <button type="button" class="btn btn-primary btn-sm" (click)="agregar()">
        <i class="bi bi-plus-circle me-1"></i>Agregar red
      </button>
    </div>

    <div class="d-flex justify-content-end mb-2" *ngIf="embedded">
      <button type="button" class="btn btn-outline-secondary btn-sm" (click)="agregar()">
        <i class="bi bi-plus-circle me-1"></i>Agregar red
      </button>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="text-center" [class.py-5]="!embedded" [class.py-3]="embedded">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Sin datos -->
    <div *ngIf="!loading && redes.length === 0" class="text-center text-muted" [class.py-5]="!embedded" [class.py-3]="embedded">
      <i class="bi bi-share display-5"></i>
      <p class="mt-3">No tienes redes sociales registradas. Agrega la primera.</p>
    </div>

    <!-- Lista (ancho completo como referencias / familiares) -->
    <div *ngFor="let red of redes">
      <div class="bg-white rounded-3 shadow-sm mb-3 overflow-hidden">

        <!-- Vista normal -->
        <div *ngIf="!red.editando" class="p-4 d-flex align-items-center gap-3">
          <div class="cv-icon-box--social"
               [style.color]="iconoColor(red.nombreRed)">
            <i class="bi" [class]="iconoClase(red.nombreRed)"></i>
          </div>
          <div class="flex-grow-1 overflow-hidden">
            <div class="fw-semibold">{{ red.nombreRed }}</div>
            <div class="text-muted small text-truncate">
              {{ red.linkPublico || red.usuarioContacto || '—' }}
            </div>
          </div>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-sm btn-outline-secondary"
                    (click)="red.editando = true; red.form = toForm(red)">
              <i class="bi bi-pencil"></i>
            </button>
            <button type="button" class="btn btn-sm btn-outline-danger" (click)="eliminar(red)">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <!-- Modo edición -->
        <div *ngIf="red.editando" class="px-4 pb-4 cv-border-t-soft">
          <div class="row g-3 mt-1">
            <div class="col-md-6">
              <label class="form-label">Red social</label>
              <select class="form-select" [(ngModel)]="red.form.nombreRed">
                <option *ngFor="let op of redesOpciones" [value]="op.nombre">{{ op.nombre }}</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Usuario / Contacto</label>
              <input type="text" class="form-control" [(ngModel)]="red.form.usuarioContacto"
                     placeholder="@usuario">
            </div>
            <div class="col-12">
              <label class="form-label">URL / Enlace público</label>
              <input type="url" class="form-control" [(ngModel)]="red.form.linkPublico"
                     placeholder="https://...">
            </div>
          </div>
          <div class="d-flex gap-2 mt-3 justify-content-end">
            <button type="button" class="btn btn-outline-secondary btn-sm" (click)="cancelar(red)">Cancelar</button>
            <button type="button" class="btn btn-primary btn-sm" (click)="guardar(red)" [disabled]="guardando">
              <span *ngIf="guardando" class="spinner-border spinner-border-sm me-1"></span>
              <i *ngIf="!guardando" class="bi bi-floppy me-1"></i>Guardar
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class RedesSocialesComponent implements OnInit {
  @Input() embedded = false;

  redes: RedSocialUI[] = [];
  redesOpciones = REDES_OPCIONES;
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
    this.cvEditorService.getRedesSociales().subscribe({
      next: data => {
        this.redes = data.map(r => ({ ...r, editando: false, form: this.toForm(r) }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      }
    });
  }

  toForm(r: RedSocialDto): UpsertRedSocialRequest {
    return { nombreRed: r.nombreRed, linkPublico: r.linkPublico, usuarioContacto: r.usuarioContacto };
  }

  agregar(): void {
    this.redes.push({
      redSocialId: 0,
      nombreRed: 'LinkedIn',
      linkPublico: null,
      usuarioContacto: null,
      editando: true,
      form: { nombreRed: 'LinkedIn', linkPublico: null, usuarioContacto: null },
    });
  }

  guardar(red: RedSocialUI): void {
    const nombreRed = (red.form.nombreRed ?? '').trim();
    if (!nombreRed) {
      this.notificationService.warning(FORM_MESSAGES.redes.requiredNombreRed);
      return;
    }
    red.form = {
      nombreRed,
      linkPublico: red.form.linkPublico?.trim() || null,
      usuarioContacto: red.form.usuarioContacto?.trim() || null,
    };

    this.guardando = true;
    const obs = red.redSocialId === 0
      ? this.cvEditorService.createRedSocial(red.form)
      : this.cvEditorService.updateRedSocial(red.redSocialId, red.form);

    obs.subscribe({
      next: data => {
        Object.assign(red, data, { editando: false, form: this.toForm(data) });
        this.guardando = false;
        this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      }
    });
  }

  cancelar(red: RedSocialUI): void {
    if (red.redSocialId === 0) {
      this.redes = this.redes.filter(r => r !== red);
    } else {
      red.editando = false;
    }
  }

  eliminar(red: RedSocialUI): void {
    if (red.redSocialId === 0) {
      this.redes = this.redes.filter(r => r !== red);
      return;
    }
    if (!confirm('¿Eliminar esta red social?')) return;
    this.cvEditorService.deleteRedSocial(red.redSocialId).subscribe({
      next: () => {
        this.redes = this.redes.filter(r => r !== red);
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.deleteError)
    });
  }

  iconoClase(nombreRed: string): string {
    return REDES_OPCIONES.find(o => o.nombre === nombreRed)?.icono ?? 'bi-link-45deg';
  }

  iconoColor(nombreRed: string): string {
    return REDES_OPCIONES.find(o => o.nombre === nombreRed)?.color ?? '#6c757d';
  }
}
