import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CvEditorService, ProyectoDto, UpsertProyectoRequest } from '../../../core/services/private/cv-editor.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';

interface ProyectoUI extends ProyectoDto {
  expanded: boolean;
  form: UpsertProyectoRequest & { stackTexto: string };
}

@Component({
  selector: 'app-proyectos',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-kanban-fill me-2 text-primary"></i>Proyectos</h4>
        <span class="text-muted small">Portfolio de proyectos personales y profesionales</span>
      </div>
      <button class="btn btn-primary btn-sm" (click)="agregar()">
        <i class="bi bi-plus-circle me-1"></i>Agregar proyecto
      </button>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Sin datos -->
    <div *ngIf="!loading && proyectos.length === 0" class="text-center py-5 text-muted">
      <i class="bi bi-kanban display-5"></i>
      <p class="mt-3">No tienes proyectos registrados. Agrega el primero.</p>
    </div>

    <!-- Lista de proyectos -->
    <div *ngFor="let p of proyectos; let i = index">
      <div class="bg-white rounded-3 shadow-sm mb-3 overflow-hidden">
        <!-- Cabecera -->
        <div class="p-4 d-flex align-items-center gap-3" style="cursor:pointer;"
             (click)="p.expanded = !p.expanded">
          <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
               style="width:44px;height:44px;background:#ebf2ff;color:#2c7be5;font-size:1.1rem;">
            <i class="bi bi-kanban-fill"></i>
          </div>
          <div class="flex-grow-1">
            <div class="fw-bold" style="font-size:.95rem;">{{ p.nombreProyecto }}</div>
            <div class="d-flex flex-wrap gap-1 mt-1">
              <span *ngFor="let tag of stackArray(p.stackTecnologico)"
                    style="background:#ebf2ff;color:#2c7be5;font-size:.7rem;font-weight:600;padding:2px 8px;border-radius:10px;">
                {{ tag }}
              </span>
            </div>
          </div>
          <i class="bi ms-2" [class.bi-chevron-down]="!p.expanded"
             [class.bi-chevron-up]="p.expanded" style="color:#adb5bd;"></i>
        </div>

        <!-- Cuerpo expandible -->
        <div *ngIf="p.expanded" class="px-4 pb-4" style="border-top:1px solid #f0f0f0;">
          <div class="row g-3 mt-1">
            <div class="col-md-8">
              <label class="form-label">Nombre del proyecto</label>
              <input type="text" class="form-control" [(ngModel)]="p.form.nombreProyecto">
            </div>
            <div class="col-md-2">
              <label class="form-label">Equipo (personas)</label>
              <input type="number" class="form-control" min="1" [(ngModel)]="p.form.equipoTamano">
            </div>
            <div class="col-md-2">
              <label class="form-label">Duración (meses)</label>
              <input type="number" class="form-control" min="1" [(ngModel)]="p.form.duracionMeses">
            </div>
            <div class="col-md-6">
              <label class="form-label">Rol en el proyecto</label>
              <input type="text" class="form-control" [(ngModel)]="p.form.rol">
            </div>
            <div class="col-md-6">
              <label class="form-label">Stack tecnológico
                <span class="text-muted small">(separar por coma)</span></label>
              <input type="text" class="form-control" [(ngModel)]="p.form.stackTexto"
                     placeholder="Angular, .NET, Docker">
            </div>
            <div class="col-12">
              <label class="form-label">Aporte / descripción</label>
              <textarea class="form-control" rows="2" [(ngModel)]="p.form.aporte"></textarea>
            </div>
            <div class="col-md-6">
              <label class="form-label">Logro destacado</label>
              <input type="text" class="form-control" [(ngModel)]="p.form.logro">
            </div>
            <div class="col-md-6">
              <label class="form-label">Principal desafío</label>
              <input type="text" class="form-control" [(ngModel)]="p.form.desafio">
            </div>
            <div class="col-12 d-flex justify-content-end gap-2 pt-2"
                 style="border-top:1px solid #f0f0f0;">
              <button class="btn btn-outline-danger btn-sm" (click)="eliminar(p)">
                <i class="bi bi-trash me-1"></i>Eliminar
              </button>
              <button class="btn btn-primary btn-sm" (click)="guardar(p)" [disabled]="guardando">
                <i class="bi bi-floppy-fill me-1"></i>Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProyectosComponent implements OnInit {
  proyectos: ProyectoUI[] = [];
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
    this.cvEditorService.getProyectos().subscribe({
      next: data => {
        this.proyectos = data.map(p => ({ ...p, expanded: false, form: this.toForm(p) }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      }
    });
  }

  private toForm(p: ProyectoDto): ProyectoUI['form'] {
    const { proyectoId, ...rest } = p;
    return { ...rest, stackTexto: p.stackTecnologico ?? '' };
  }

  stackArray(stack: string | null): string[] {
    return stack ? stack.split(',').map(s => s.trim()).filter(Boolean) : [];
  }

  agregar(): void {
    const nuevo: ProyectoUI = {
      proyectoId: 0, nombreProyecto: null, rol: null, equipoTamano: null,
      duracionMeses: null, stackTecnologico: null, aporte: null, logro: null, desafio: null,
      expanded: true,
      form: { nombreProyecto: null, rol: null, equipoTamano: null, duracionMeses: null,
              stackTecnologico: null, aporte: null, logro: null, desafio: null, stackTexto: '' }
    };
    this.proyectos.unshift(nuevo);
  }

  guardar(p: ProyectoUI): void {
    p.form.stackTecnologico = p.form.stackTexto;
    const { stackTexto, ...dto } = p.form;
    this.guardando = true;
    if (p.proyectoId === 0) {
      this.cvEditorService.createProyecto(dto).subscribe({
        next: creado => {
          Object.assign(p, creado, { expanded: false, form: this.toForm(creado) });
          this.guardando = false;
          this.notificationService.success(NOTIFICATION_MESSAGES.createSuccess);
        },
        error: (error: HttpErrorResponse) => {
          this.guardando = false;
          this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
        }
      });
    } else {
      this.cvEditorService.updateProyecto(p.proyectoId, dto).subscribe({
        next: actualizado => {
          Object.assign(p, actualizado, { expanded: false, form: this.toForm(actualizado) });
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

  eliminar(p: ProyectoUI): void {
    if (p.proyectoId === 0) { this.proyectos = this.proyectos.filter(x => x !== p); return; }
    if (!confirm('¿Eliminar este proyecto?')) return;
    this.cvEditorService.deleteProyecto(p.proyectoId).subscribe({
      next: () => {
        this.proyectos = this.proyectos.filter(x => x !== p);
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.deleteError)
    });
  }
}
