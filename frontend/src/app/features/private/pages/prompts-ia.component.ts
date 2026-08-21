import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  PromptIaService,
  PromptIaListItemDto,
  PromptIaVersionDto,
} from '../../../core/services/private/prompt-ia.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';

interface PromptForm {
  codigo: string;
  nombre: string;
  descripcion: string;
  rolContexto: string;
  tarea: string;
  reglas: string;
  formatoSalida: string;
  ejemplos: string;
}

interface PromptUI extends PromptIaListItemDto {
  form: PromptForm;
  historial: PromptIaVersionDto[];
  cargandoHistorial: boolean;
  guardando: boolean;
  error: string | null;
}

function formVacio(): PromptForm {
  return {
    codigo: '', nombre: '', descripcion: '',
    rolContexto: '', tarea: '', reglas: '', formatoSalida: '', ejemplos: '',
  };
}

@Component({
  selector: 'app-prompts-ia',
  standalone: false,
  templateUrl: './prompts-ia.component.html',
})
export class PromptsIaComponent implements OnInit {
  loading = true;
  prompts: PromptUI[] = [];

  mostrarFormNuevo = false;
  formNuevo: PromptForm = formVacio();
  guardandoNuevo = false;
  errorNuevo: string | null = null;

  private promptsAbiertos = new Set<string>();
  activandoVersionId: number | null = null;
  versionExpandidaId: number | null = null;

  readonly tareaPlaceholder =
    'Qué debe hacer exactamente. Incluye marcadores como {{OFERTA_TEXTO}} o {{CURRICULUM_JSON}}.';

  private static readonly CODIGO_VALIDO = /^[A-Z0-9_]{2,50}$/;

  constructor(
    private promptIaService: PromptIaService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  trackByPrompt(_index: number, p: PromptUI): string {
    return p.codigo;
  }

  /** Recarga la lista. Si se indica `codigoAAbrir`, esa tarjeta queda expandida
   * (con su historial recién traído) en vez de que la recarga colapse todo —
   * evita que guardar una versión nueva o activar un rollback cierre de golpe
   * la tarjeta que el usuario tenía abierta. */
  cargar(codigoAAbrir?: string): void {
    this.loading = true;
    this.promptIaService.getPrompts().subscribe({
      next: data => {
        this.prompts = data.map(p => ({
          ...p,
          form: { ...formVacio(), codigo: p.codigo },
          historial: [],
          cargandoHistorial: false,
          guardando: false,
          error: null,
        }));
        this.promptsAbiertos.clear();
        this.loading = false;

        const p = codigoAAbrir && this.prompts.find(x => x.codigo === codigoAAbrir);
        if (p) this.togglePromptAccordion(p);
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      },
    });
  }

  togglePromptAccordion(p: PromptUI): void {
    if (this.promptsAbiertos.has(p.codigo)) {
      this.promptsAbiertos.delete(p.codigo);
      return;
    }
    this.promptsAbiertos.add(p.codigo);
    this.versionExpandidaId = null;
    if (p.historial.length === 0) {
      this.cargarHistorial(p);
    }
  }

  isPromptAccordionOpen(codigo: string): boolean {
    return this.promptsAbiertos.has(codigo);
  }

  private cargarHistorial(p: PromptUI): void {
    p.cargandoHistorial = true;
    this.promptIaService.getVersiones(p.codigo).subscribe({
      next: versiones => {
        p.historial = versiones;
        p.cargandoHistorial = false;

        const activa = versiones.find(v => v.esActivo);
        if (activa) {
          p.form = {
            codigo: activa.codigo,
            nombre: activa.nombre,
            descripcion: activa.descripcion ?? '',
            rolContexto: activa.rolContexto,
            tarea: activa.tarea,
            reglas: activa.reglas ?? '',
            formatoSalida: activa.formatoSalida,
            ejemplos: activa.ejemplos ?? '',
          };
        }
      },
      error: () => {
        p.cargandoHistorial = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      },
    });
  }

  toggleVersionExpandida(v: PromptIaVersionDto): void {
    this.versionExpandidaId = this.versionExpandidaId === v.promptIaId ? null : v.promptIaId;
  }

  abrirNuevo(): void {
    this.formNuevo = formVacio();
    this.errorNuevo = null;
    this.mostrarFormNuevo = true;
  }

  cancelarNuevo(): void {
    this.mostrarFormNuevo = false;
  }

  private validar(form: PromptForm, validarCodigo: boolean): string | null {
    if (validarCodigo) {
      const codigo = form.codigo.trim().toUpperCase();
      if (!codigo) return 'El código del prompt es requerido.';
      if (!PromptsIaComponent.CODIGO_VALIDO.test(codigo)) {
        return 'El código solo puede tener letras, números y guion bajo (p. ej. EXTRACTOR_OFERTA).';
      }
    }
    if (!form.nombre.trim()) return 'El nombre del prompt es requerido.';
    if (!form.rolContexto.trim()) return 'El rol/contexto del prompt es requerido.';
    if (!form.tarea.trim()) return 'La tarea del prompt es requerida.';
    if (!form.formatoSalida.trim()) return 'El formato de salida del prompt es requerido.';
    return null;
  }

  private buildCuerpo(form: PromptForm) {
    return {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      rolContexto: form.rolContexto.trim(),
      tarea: form.tarea.trim(),
      reglas: form.reglas.trim() || null,
      formatoSalida: form.formatoSalida.trim(),
      ejemplos: form.ejemplos.trim() || null,
    };
  }

  crear(): void {
    const error = this.validar(this.formNuevo, true);
    if (error) {
      this.notificationService.warning(error);
      return;
    }

    const codigo = this.formNuevo.codigo.trim().toUpperCase();
    this.guardandoNuevo = true;
    this.errorNuevo = null;

    this.promptIaService
      .crearPrompt({ codigo, ...this.buildCuerpo(this.formNuevo) })
      .subscribe({
        next: () => {
          this.guardandoNuevo = false;
          this.mostrarFormNuevo = false;
          this.notificationService.success(NOTIFICATION_MESSAGES.createSuccess);
          this.cargar(codigo);
        },
        error: (error: HttpErrorResponse) => {
          this.guardandoNuevo = false;
          this.errorNuevo = extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError;
        },
      });
  }

  guardarVersion(p: PromptUI): void {
    const error = this.validar(p.form, false);
    if (error) {
      this.notificationService.warning(error);
      return;
    }

    p.guardando = true;
    p.error = null;

    this.promptIaService.crearVersion(p.codigo, this.buildCuerpo(p.form)).subscribe({
      next: () => {
        p.guardando = false;
        this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
        this.cargar(p.codigo);
      },
      error: (error: HttpErrorResponse) => {
        p.guardando = false;
        p.error = extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError;
      },
    });
  }

  activarVersion(p: PromptUI, v: PromptIaVersionDto): void {
    if (v.esActivo || this.activandoVersionId) return;

    const confirmar = globalThis.confirm(
      `¿Activar la versión ${v.version}? Se desactivará la versión ${p.versionActiva}, actualmente activa. ` +
      'No se pierde ningún contenido: queda en el historial.'
    );
    if (!confirmar) return;

    this.activandoVersionId = v.promptIaId;
    this.promptIaService.activarVersion(v.promptIaId).subscribe({
      next: () => {
        this.activandoVersionId = null;
        this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
        this.cargar(p.codigo);
      },
      error: (error: HttpErrorResponse) => {
        this.activandoVersionId = null;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
    });
  }
}
