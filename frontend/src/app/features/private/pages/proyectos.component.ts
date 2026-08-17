import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  CvEditorService,
  ProyectoDto,
  UpdateProyectoVisibilidadRequest,
  UpsertProyectoRequest,
} from '../../../core/services/private/cv-editor.service';
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
  templateUrl: './proyectos.component.html',
})
export class ProyectosComponent implements OnInit {
  proyectos: ProyectoUI[] = [];
  borrador: ProyectoUI | null = null;
  loading = false;
  guardando = false;
  guardandoVisibilidadProyectoId: number | null = null;

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

  onMostrarEnCvChange(p: ProyectoUI, visible: boolean): void {
    if (p.proyectoId === 0) {
      return;
    }
    const prev = !visible;
    if (this.guardandoVisibilidadProyectoId === p.proyectoId) {
      return;
    }
    this.guardandoVisibilidadProyectoId = p.proyectoId;
    const payload: UpdateProyectoVisibilidadRequest = { mostrarEnCv: visible };
    this.cvEditorService.updateProyectoVisibilidad(p.proyectoId, payload).subscribe({
      next: actualizado => {
        Object.assign(p, this.dtoToUi(actualizado, p.expanded));
        this.guardandoVisibilidadProyectoId = null;
        this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
      },
      error: (error: HttpErrorResponse) => {
        p.form.mostrarEnCv = prev;
        this.guardandoVisibilidadProyectoId = null;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
    });
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
      mostrarEnCv: true,
    };
    return this.dtoToUi(base, true);
  }

  private dtoToUi(p: ProyectoDto, expanded: boolean): ProyectoUI {
    const { proyectoId: _proyectoId, ...rest } = p;
    return {
      ...p,
      expanded,
      form: { ...rest, mostrarEnCv: rest.mostrarEnCv !== false },
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
