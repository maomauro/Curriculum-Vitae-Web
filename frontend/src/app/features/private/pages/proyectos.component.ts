import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CvEditorService, ProyectoDto, UpsertProyectoRequest } from '../../../core/services/private/cv-editor.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { FORM_MESSAGES } from '../../../core/constants/form-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';

const PROJECT_ICONS = [
  'bi-kanban-fill',
  'bi-cart4',
  'bi-bank2',
  'bi-lightning-charge-fill',
  'bi-globe2',
] as const;

interface ProyectoUI extends ProyectoDto {
  expanded: boolean;
  form: UpsertProyectoRequest;
  stackTags: string[];
  stackDraft: string;
}

@Component({
  selector: 'app-proyectos',
  standalone: false,
  template: `
    <div class="page-header d-flex flex-wrap justify-content-between align-items-center gap-3">
      <div>
        <h4><i class="bi bi-kanban-fill me-2 text-primary"></i>Proyectos</h4>
        <p class="text-muted small mb-0">
          Muestra los proyectos más relevantes de tu carrera: rol, impacto y tecnologías usadas
        </p>
      </div>
      <button
        type="button"
        class="btn btn-primary"
        (click)="agregar()"
        [disabled]="!!borrador">
        <i class="bi bi-plus-circle me-2"></i>Agregar proyecto
      </button>
    </div>

    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <div *ngIf="!loading && proyectos.length === 0 && !borrador" class="text-center py-5 text-muted">
      <i class="bi bi-kanban display-5"></i>
      <p class="mt-3">No tienes proyectos registrados. Agrega el primero.</p>
    </div>

    <!-- Borrador: tarjeta discontinua (prototipo newProject) -->
    <div *ngIf="borrador" class="project-card project-card--nuevo expanded">
      <div class="project-card-header">
        <div class="project-icon"><i class="bi bi-plus-lg"></i></div>
        <div class="flex-grow-1 min-w-0">
          <div class="project-title">Nuevo proyecto</div>
        </div>
        <button type="button" class="btn btn-outline-secondary btn-sm" (click)="cancelarBorrador()">
          <i class="bi bi-x-lg me-1"></i>Cancelar
        </button>
      </div>
      <div class="project-body">
        <ng-container *ngTemplateOutlet="formularioProyecto; context: { $implicit: borrador, esNuevo: true }"></ng-container>
      </div>
    </div>

    <div
      *ngFor="let p of proyectos; let i = index; trackBy: trackByProyectoId"
      class="project-card"
      [class.expanded]="p.expanded">
      <div class="project-card-header" (click)="toggleExpanded(p)">
        <div class="project-icon"><i class="bi" [ngClass]="iconClass(i)"></i></div>
        <div class="flex-grow-1 min-w-0">
          <div class="project-title text-truncate">{{ tituloCard(p) }}</div>
          <div class="project-role text-truncate">{{ subtituloRol(p) }}</div>
        </div>
        <div class="project-meta d-none d-sm-flex">
          <span *ngIf="pillMeses(p)" class="meta-pill">
            <i class="bi bi-clock me-1"></i>{{ pillMeses(p) }}
          </span>
          <span *ngIf="pillEquipo(p)" class="meta-pill">
            <i class="bi bi-people me-1"></i>{{ pillEquipo(p) }}
          </span>
        </div>
        <i class="bi bi-chevron-down project-chevron"></i>
      </div>
      <div class="project-body" (click)="$event.stopPropagation()">
        <ng-container *ngTemplateOutlet="formularioProyecto; context: { $implicit: p, esNuevo: false }"></ng-container>
      </div>
    </div>

    <ng-template #formularioProyecto let-p let-esNuevo="esNuevo">
      <div class="row g-3">
        <div class="col-md-5">
          <label class="form-label">
            Nombre del proyecto <span class="text-danger">*</span>
          </label>
          <input type="text" class="form-control" [(ngModel)]="p.form.nombreProyecto"
                 [placeholder]="esNuevo ? 'Ej: App de reservas de turnos' : ''" />
        </div>
        <div class="col-md-4">
          <label class="form-label">
            Rol en el proyecto <span class="text-danger">*</span>
          </label>
          <input type="text" class="form-control" [(ngModel)]="p.form.rol"
                 [placeholder]="esNuevo ? 'Ej: Tech Lead, QA Engineer…' : ''" />
        </div>
        <div class="col-6 col-md-1">
          <label class="form-label">Equipo</label>
          <input type="number" class="form-control" min="1" [(ngModel)]="p.form.equipoTamano" />
        </div>
        <div class="col-6 col-md-2">
          <label class="form-label">Duración (meses)</label>
          <input type="number" class="form-control" min="1" [(ngModel)]="p.form.duracionMeses" />
        </div>
        <div class="col-12">
          <label class="form-label">Stack tecnológico</label>
          <div class="stack-tags mb-2">
            <span *ngFor="let tag of p.stackTags; let ti = index" class="stack-tag">
              {{ tag }}
              <button type="button" class="stack-tag-del" (click)="quitarStack(p, ti)" [attr.aria-label]="'Quitar ' + tag">
                <i class="bi bi-x"></i>
              </button>
            </span>
          </div>
          <div class="input-group input-group-sm stack-input-group">
            <input
              type="text"
              class="form-control"
              [(ngModel)]="p.stackDraft"
              [placeholder]="esNuevo ? 'Ej: Vue.js, Django…' : 'Ej: Docker, PostgreSQL…'"
              (keydown.enter)="agregarStack(p, $event)" />
            <button type="button" class="btn btn-outline-primary" (click)="agregarStack(p, $event)">
              <i class="bi bi-plus"></i>
            </button>
          </div>
        </div>
        <div class="col-12">
          <label class="form-label">Mi aporte al proyecto</label>
          <textarea class="form-control" rows="2" [(ngModel)]="p.form.aporte"
                    placeholder="¿En qué parte trabajaste específicamente?"></textarea>
        </div>
        <div class="col-md-6">
          <label class="form-label">Logro principal</label>
          <textarea class="form-control" rows="2" [(ngModel)]="p.form.logro"
                    placeholder="¿Qué impacto tuvo tu trabajo?"></textarea>
        </div>
        <div class="col-md-6">
          <label class="form-label">Principal desafío</label>
          <textarea class="form-control" rows="2" [(ngModel)]="p.form.desafio"
                    placeholder="¿Cuál fue el mayor reto técnico o de gestión?"></textarea>
        </div>
      </div>
      <div class="project-action-row justify-content-end gap-2">
        <button
          *ngIf="!esNuevo"
          type="button"
          class="btn btn-outline-danger btn-sm"
          (click)="eliminar(p)">
          <i class="bi bi-trash3 me-1"></i>Eliminar
        </button>
        <button
          type="button"
          class="btn btn-primary px-4"
          (click)="guardar(p, esNuevo)"
          [disabled]="guardando">
          <i class="bi bi-floppy-fill me-2"></i>{{ esNuevo ? 'Crear proyecto' : 'Guardar' }}
        </button>
      </div>
    </ng-template>
  `,
})
export class ProyectosComponent implements OnInit {
  proyectos: ProyectoUI[] = [];
  borrador: ProyectoUI | null = null;
  loading = false;
  guardando = false;

  constructor(
    private cvEditorService: CvEditorService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  trackByProyectoId(_i: number, p: ProyectoUI): number {
    return p.proyectoId;
  }

  iconClass(index: number): string {
    return PROJECT_ICONS[index % PROJECT_ICONS.length] ?? 'bi-kanban-fill';
  }

  tituloCard(p: ProyectoUI): string {
    const n = (p.form.nombreProyecto ?? '').trim() || (p.nombreProyecto ?? '').trim();
    return n || 'Sin nombre';
  }

  subtituloRol(p: ProyectoUI): string {
    const rol = (p.form.rol ?? p.rol ?? '').trim() || 'Sin rol';
    const eq = p.form.equipoTamano;
    if (eq != null && eq > 0) {
      const persona = eq === 1 ? 'persona' : 'personas';
      return `${rol} · Equipo de ${eq} ${persona}`;
    }
    return rol;
  }

  pillMeses(p: ProyectoUI): string | null {
    const m = p.form.duracionMeses;
    if (m == null || m < 1) return null;
    return `${m} ${m === 1 ? 'mes' : 'meses'}`;
  }

  pillEquipo(p: ProyectoUI): string | null {
    const n = p.form.equipoTamano;
    if (n == null || n < 1) return null;
    return `${n} ${n === 1 ? 'persona' : 'personas'}`;
  }

  toggleExpanded(p: ProyectoUI): void {
    p.expanded = !p.expanded;
  }

  agregar(): void {
    if (this.borrador) {
      this.notificationService.warning(FORM_MESSAGES.proyectos.completeNuevoAntesDeOtro);
      return;
    }
    this.borrador = this.crearProyectoVacio();
  }

  cancelarBorrador(): void {
    this.borrador = null;
  }

  agregarStack(p: ProyectoUI, ev?: Event): void {
    ev?.preventDefault();
    const raw = (p.stackDraft ?? '').trim();
    if (!raw) return;
    if (!p.stackTags.includes(raw)) {
      p.stackTags = [...p.stackTags, raw];
    }
    p.stackDraft = '';
  }

  quitarStack(p: ProyectoUI, index: number): void {
    p.stackTags = p.stackTags.filter((_, i) => i !== index);
  }

  cargar(): void {
    this.loading = true;
    this.cvEditorService.getProyectos().subscribe({
      next: data => {
        this.proyectos = data.map(p => this.dtoToUi(p, false));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      },
    });
  }

  private crearProyectoVacio(): ProyectoUI {
    const base: ProyectoDto = {
      proyectoId: 0,
      nombreProyecto: null,
      rol: null,
      equipoTamano: 1,
      duracionMeses: 1,
      stackTecnologico: null,
      aporte: null,
      logro: null,
      desafio: null,
    };
    return this.dtoToUi(base, true);
  }

  private dtoToUi(p: ProyectoDto, expanded: boolean): ProyectoUI {
    const { proyectoId, ...rest } = p;
    return {
      ...p,
      expanded,
      form: { ...rest },
      stackTags: this.parseStack(p.stackTecnologico),
      stackDraft: '',
    };
  }

  private parseStack(stack: string | null | undefined): string[] {
    if (!stack?.trim()) return [];
    return stack.split(',').map(s => s.trim()).filter(Boolean);
  }

  private syncStackToForm(p: ProyectoUI): void {
    p.form.stackTecnologico =
      p.stackTags.length > 0 ? p.stackTags.join(', ') : null;
  }

  private validar(p: ProyectoUI): boolean {
    const nom = (p.form.nombreProyecto ?? '').trim();
    const rol = (p.form.rol ?? '').trim();
    if (!nom || !rol) {
      this.notificationService.warning(FORM_MESSAGES.proyectos.requiredNombreRol);
      return false;
    }
    return true;
  }

  guardar(p: ProyectoUI, esNuevo: boolean): void {
    if (!this.validar(p)) return;
    this.syncStackToForm(p);
    const dto: UpsertProyectoRequest = { ...p.form };
    this.guardando = true;
    if (p.proyectoId === 0) {
      this.cvEditorService.createProyecto(dto).subscribe({
        next: creado => {
          const ui = this.dtoToUi(creado, false);
          this.proyectos.unshift(ui);
          if (esNuevo) this.borrador = null;
          this.guardando = false;
          this.notificationService.success(NOTIFICATION_MESSAGES.createSuccess);
        },
        error: (error: HttpErrorResponse) => {
          this.guardando = false;
          this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
        },
      });
    } else {
      this.cvEditorService.updateProyecto(p.proyectoId, dto).subscribe({
        next: actualizado => {
          Object.assign(p, this.dtoToUi(actualizado, p.expanded));
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

  eliminar(p: ProyectoUI): void {
    if (p.proyectoId === 0) {
      this.proyectos = this.proyectos.filter(x => x !== p);
      return;
    }
    if (!confirm(FORM_MESSAGES.proyectos.confirmDelete)) return;
    this.cvEditorService.deleteProyecto(p.proyectoId).subscribe({
      next: () => {
        this.proyectos = this.proyectos.filter(x => x !== p);
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.deleteError),
    });
  }
}
