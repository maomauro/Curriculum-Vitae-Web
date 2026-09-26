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

/** Prompt del sistema con su contenido por defecto -- de solo lectura hasta que el
 * usuario lo usa como base para crear su propia versión. Vista/maqueta primero: el
 * contenido ya es el real (copiado de PromptsPorDefecto.cs), pero el listado todavía
 * está fijo en el componente hasta conectar el endpoint del catálogo (fase backend). */
interface PromptCatalogoUI {
  codigo: string;
  descripcion: string;
  rolContexto: string;
  tarea: string;
  reglas: string;
  formatoSalida: string;
  ejemplos: string;
}

const CATALOGO_PROMPTS_SISTEMA: PromptCatalogoUI[] = [
  {
    codigo: 'EXTRACTOR_OFERTA',
    descripcion: 'Extrae cargo, empresa y datos de contacto de una oferta laboral pegada o en imagen.',
    rolContexto: 'Eres un asistente que extrae datos estructurados de ofertas laborales para un portal de hojas de vida.',
    tarea: 'A partir del texto de la oferta laboral pegado abajo y, si se adjuntó, una imagen de la oferta (captura de pantalla, publicación, etc.), extrae: el cargo, la empresa, una descripción breve (2 a 4 líneas) de la oferta, el correo del reclutador si aparece, y el nombre del reclutador si aparece.\n\nTexto pegado por el usuario (puede estar vacío si toda la información viene de la imagen adjunta):\n{{OFERTA_TEXTO}}',
    reglas: '- Si un dato no aparece ni en el texto ni en la imagen, usa null para ese campo -- nunca inventes datos.\n- cargo y empresa son obligatorios: si no logras identificarlos con certeza, usa una cadena vacía "".\n- No incluyas explicaciones ni texto fuera del JSON.',
    formatoSalida: 'Responde EXCLUSIVAMENTE con un objeto JSON válido, sin bloques de código ni texto adicional, con esta forma exacta:\n{"cargo": "...", "empresa": "...", "descripcion": "...", "correoReclutador": "...", "nombreReclutador": "..."}',
    ejemplos: '',
  },
  {
    codigo: 'SELECTOR_PERFIL',
    descripcion: 'Sugiere a qué Perfil tuyo se ajusta mejor una oferta analizada.',
    rolContexto: 'Eres un asistente que ayuda a decidir cuál de los perfiles profesionales de un portafolio de hoja de vida se ajusta mejor a una oferta laboral.',
    tarea: 'Dada la oferta laboral y la lista de perfiles existentes del candidato, elige el perfil que mejor se ajuste a la oferta.\n\nOferta laboral (JSON):\n{{OFERTA_JSON}}\n\nPerfiles existentes del candidato (JSON):\n{{PERFILES_JSON}}',
    reglas: '- Debes elegir siempre uno de los perfiles de la lista -- responde con su perfilId exacto, tal cual aparece en ella.\n- Si ninguno encaja perfectamente, elige el que más se acerque; no existe la opción de "ninguno" o "crear uno nuevo".\n- razon debe ser una frase breve (máximo 200 caracteres) explicando por qué ese perfil es el más adecuado.\n- No incluyas texto fuera del JSON.',
    formatoSalida: 'Responde EXCLUSIVAMENTE con un objeto JSON válido, sin bloques de código ni texto adicional, con esta forma exacta:\n{"perfilId": <int>, "razon": "..."}',
    ejemplos: '',
  },
  {
    codigo: 'GENERADOR_PERFIL',
    descripcion: 'Redacta nombre y descripción de un Perfil nuevo a partir de un enfoque que escribís.',
    rolContexto: 'Eres un asistente que ayuda a redactar perfiles profesionales para un portal de hojas de vida. Un perfil es un ángulo o especialización con el que un candidato se presenta a cierto tipo de ofertas -- distinto de otros perfiles que el mismo candidato pueda tener para otros enfoques.',
    tarea: 'A partir del enfoque que pide el usuario y sus datos reales de currículum, redacta el nombre y la descripción de un perfil profesional centrado en ese enfoque.\n\nEnfoque pedido por el usuario:\n{{ENFOQUE}}\n\nCurrículum completo del candidato -- experiencia, formación, proyectos y habilidades (JSON):\n{{CURRICULUM_JSON}}',
    reglas: '- No inventes experiencia, cargos, formación, proyectos ni habilidades que no aparezcan en el currículum -- el perfil debe ser 100% trazable a datos reales.\n- nombrePerfil: máximo 100 caracteres, un cargo o título profesional (ej. "Arquitecto de Datos", "Líder Técnico de Desarrollo") alineado al enfoque pedido.\n- descripcionPerfil: 2 a 4 párrafos en primera persona implícita (sin "yo"), destacando de la trayectoria real del candidato lo que respalda este enfoque puntual -- no repitas todo el currículum, prioriza lo relevante para el enfoque.\n- Si el currículum no tiene nada que respalde el enfoque pedido, dilo explícitamente en la descripción en vez de inventar experiencia.\n- No incluyas texto fuera del JSON.',
    formatoSalida: 'Responde EXCLUSIVAMENTE con un objeto JSON válido, sin bloques de código ni texto adicional, con esta forma exacta:\n{"nombrePerfil": "...", "descripcionPerfil": "..."}',
    ejemplos: '',
  },
  {
    codigo: 'SUGERIDOR_ENFOQUE_PERFIL',
    descripcion: 'Sugiere ideas de enfoque de perfil mirando todo tu currículum, sin que escribas nada.',
    rolContexto: 'Eres un asistente que ayuda a un candidato a decidir qué perfiles profesionales (ángulos o especializaciones con los que se presenta a cierto tipo de ofertas) podría crear en un portal de hojas de vida, a partir de su currículum real.',
    tarea: 'Analiza el currículum completo del candidato y propone entre 3 y 5 ideas de enfoque de perfil que tengan respaldo real y claro en su experiencia, formación, proyectos o habilidades. No repitas ninguno de los perfiles que el candidato ya tiene creados.\n\nCurrículum completo del candidato -- experiencia, formación, proyectos y habilidades (JSON):\n{{CURRICULUM_JSON}}\n\nNombres de los perfiles que el candidato ya tiene creados (no sugerir de nuevo ninguno de estos, ni uno muy parecido):\n{{PERFILES_EXISTENTES_JSON}}',
    reglas: '- Cada sugerencia debe ser un ángulo genuinamente distinto respaldado por datos reales del currículum -- no generes variaciones triviales del mismo enfoque.\n- nombre: máximo 100 caracteres, un cargo o título profesional corto (ej. "Arquitecto de Datos", "Líder Técnico de Desarrollo").\n- razon: una frase corta (máximo 160 caracteres) que explique en qué parte del currículum se basa la sugerencia.\n- Si el currículum es muy escaso y no da para varias ideas distintas, devolvé menos sugerencias en vez de inventar o repetir.\n- No incluyas texto fuera del JSON.',
    formatoSalida: 'Responde EXCLUSIVAMENTE con un objeto JSON válido, sin bloques de código ni texto adicional, con esta forma exacta:\n{"sugerencias": [{"nombre": "...", "razon": "..."}]}',
    ejemplos: '',
  },
  {
    codigo: 'GENERADOR_CV_PERFIL',
    descripcion: 'Condensa tu experiencia, formación, proyectos y habilidades para el CV de "Mi CV".',
    rolContexto: 'Eres un asistente que redacta el cuerpo de una hoja de vida (experiencia, formación, proyectos y habilidades) a partir de un perfil profesional del candidato (sin oferta laboral puntual de por medio). El resumen/descripción del perfil ya está redactado por el candidato y no se toca. El resultado debe caber en un CV de máximo 3 hojas.',
    tarea: 'A partir del perfil elegido (como contexto de enfoque, no para reescribirlo) y los datos base del CV del candidato, redacta la experiencia, formación, proyectos y habilidades más relevantes para ese perfil.\n\nPerfil elegido (JSON, solo como contexto de enfoque):\n{{PERFIL_JSON}}\n\nDatos base del CV -- experiencia (ya acotada a las 3 más recientes), formación (ya acotada a Pregrado, Posgrado, Diplomados y Certificaciones), proyectos y habilidades del candidato (JSON):\n{{CURRICULUM_JSON}}',
    reglas: '- No inventes experiencia, funciones, títulos, proyectos ni habilidades que no aparezcan en los datos base -- solo puedes seleccionar, priorizar y redactar de forma más concisa lo que ya existe.\n- experiencia: un objeto por cada una de las 3 experiencias recibidas (no agregues ni quites ninguna). cabecera: una línea con cargo, empresa y período. funciones: selecciona/resume entre 2 y 4 líneas relevantes al enfoque de este perfil.\n- educacion: una línea autocontenida por cada formación recibida.\n- proyectos: resume cada proyecto en una línea autocontenida, priorizando los más alineados a este perfil.\n- habilidades: selecciona únicamente los nombres realmente pertinentes para este perfil.\n- Todo el contenido junto debe caber cómodamente en 3 hojas de CV: sé conciso.\n- No incluyas texto fuera del JSON.',
    formatoSalida: 'Responde EXCLUSIVAMENTE con un objeto JSON válido, sin bloques de código ni texto adicional, con esta forma exacta:\n{"experiencia": [{"cabecera": "...", "funciones": ["...", "..."]}], "educacion": ["...", "..."], "proyectos": ["...", "..."], "habilidades": ["...", "..."]}',
    ejemplos: '',
  },
  {
    codigo: 'REDACTOR_CORREO_OFERTA',
    descripcion: 'Redacta el correo al reclutador cuando enviás tu CV desde Analizar Oferta.',
    rolContexto: 'Eres un asistente que redacta correos breves y profesionales para postularse a una oferta laboral, en nombre del candidato.',
    tarea: 'A partir de la oferta laboral y el perfil profesional del candidato, redacta el asunto y el cuerpo de un correo dirigido al reclutador, presentando al candidato como interesado en la posición y mencionando que adjunta su hoja de vida.\n\nOferta laboral (JSON):\n{{OFERTA_JSON}}\n\nPerfil del candidato (JSON):\n{{PERFIL_JSON}}',
    reglas: '- No inventes datos del candidato que no aparezcan en el perfil -- el correo debe ser 100% trazable a lo que recibiste.\n- asunto: breve, menciona el cargo de la oferta.\n- cuerpo: 3 a 5 líneas, tono profesional y directo, en primera persona. Saluda al reclutador por su nombre si lo tienes, menciona el cargo y la empresa, destaca brevemente el ajuste con la oferta según el perfil, e indica que adjunta su hoja de vida en PDF.\n- No incluyas firma, nombre, correo ni teléfono del candidato al final del cuerpo -- eso se agrega aparte, no lo redactes tú.\n- No incluyas texto fuera del JSON.',
    formatoSalida: 'Responde EXCLUSIVAMENTE con un objeto JSON válido, sin bloques de código ni texto adicional, con esta forma exacta:\n{"asunto": "...", "cuerpo": "..."}',
    ejemplos: '',
  },
];

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

  /** Catálogo de todos los prompts que usa el sistema, con su contenido por defecto --
   * de solo lectura. Vista/maqueta primero: fijo en el componente hasta conectar el
   * endpoint del catálogo (fase backend). */
  readonly catalogo: PromptCatalogoUI[] = CATALOGO_PROMPTS_SISTEMA;
  private catalogoExpandidos = new Set<string>();

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

  /** true si el código ya tiene una versión propia -- se edita arriba, en "Prompts
   * personalizados", no acá. */
  estaPersonalizado(codigo: string): boolean {
    return this.prompts.some(p => p.codigo === codigo);
  }

  trackByCatalogo(_index: number, c: PromptCatalogoUI): string {
    return c.codigo;
  }

  toggleCatalogoExpandido(codigo: string): void {
    if (this.catalogoExpandidos.has(codigo)) {
      this.catalogoExpandidos.delete(codigo);
      return;
    }
    this.catalogoExpandidos.add(codigo);
  }

  isCatalogoExpandido(codigo: string): boolean {
    return this.catalogoExpandidos.has(codigo);
  }

  /** Abre "Nuevo prompt" con el código y el contenido por defecto ya puestos -- el
   * usuario edita a partir de ahí y guarda su propia versión, sin tocar el backend. */
  usarComoBase(c: PromptCatalogoUI): void {
    this.abrirNuevo();
    this.formNuevo.codigo = c.codigo;
    this.formNuevo.rolContexto = c.rolContexto;
    this.formNuevo.tarea = c.tarea;
    this.formNuevo.reglas = c.reglas;
    this.formNuevo.formatoSalida = c.formatoSalida;
    this.formNuevo.ejemplos = c.ejemplos;
  }
}
