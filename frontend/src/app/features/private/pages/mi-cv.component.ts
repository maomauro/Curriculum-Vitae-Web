import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { CvGeneradoService, CvGeneradoDto } from '../../../core/services/private/cv-generado.service';
import {
  CvEditorService,
  PerfilDto,
  PersonalesDto,
  RedSocialDto,
  VisibilidadSeccionDto,
} from '../../../core/services/private/cv-editor.service';
import { CV_PLANTILLAS, normalizeCvPlantillaCodigo, type CvPlantillaCodigo } from '../../../core/constants/cv-plantillas';
import { VisibilidadSeccionResolver } from '../../../core/utils/visibilidad-seccion-resolver';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';

/** Icono por red social conocida (mismo criterio que cv-plantilla-preview.component.ts). */
const ICONOS_RED: Record<string, string> = {
  linkedin: 'bi-linkedin',
  github: 'bi-github',
  x: 'bi-twitter-x',
  twitter: 'bi-twitter-x',
  instagram: 'bi-instagram',
  facebook: 'bi-facebook',
  youtube: 'bi-youtube',
  portafolio: 'bi-globe',
};

/** "Mi CV": general por Perfil (perfil + currículum completo, sin oferta de por medio):
 * la IA redacta un resumen y condensa experiencia/formación/proyectos/habilidades para
 * caber en máximo 3 hojas, mostrado con la misma apariencia visual (colores, tipografía,
 * foto y encabezado) que "Profesional", pero como bloques de texto, no como las tarjetas
 * estructuradas de esa vista -- el encabezado (foto, nombre, contacto) sí usa los datos
 * reales de Personales tal cual, nunca los de la IA.
 * El consolidado de toda la información profesional (lo que esta página mostraba antes)
 * vive ahora en ProfesionalComponent. */
@Component({
  selector: 'app-mi-cv',
  standalone: false,
  templateUrl: './mi-cv.component.html',
})
export class MiCvComponent implements OnInit {
  loading = true;

  perfiles: PerfilDto[] = [];
  cvsGenerados: CvGeneradoDto[] = [];
  perfilSeleccionadoId: number | null = null;
  generandoCvPerfil = false;

  cvPerfilAbierto: CvGeneradoDto | null = null;

  /** Datos crudos del encabezado (foto, nombre, contacto, plantilla) para el CV por
   * perfil -- se cargan una sola vez, recién cuando se abre el primer CV por perfil (no
   * hace falta si el usuario solo mira CVs por oferta). */
  private datosEncabezadoCargados = false;
  /** Público: el encabezado del CV por perfil lo lee directo desde la plantilla
   * (personales?.email). */
  personales: PersonalesDto | null = null;
  private redes: RedSocialDto[] = [];
  private visibilidadSeccion: VisibilidadSeccionDto[] = [];
  plantillaCodigo: CvPlantillaCodigo = 'clasico';
  private plantillaCodigoPersistida: CvPlantillaCodigo = 'clasico';

  /** Selector de plantilla (mismo control que ProfesionalComponent) -- la plantilla es
   * una preferencia única del currículum, compartida con Profesional y el CV público. */
  readonly plantillas = CV_PLANTILLAS;
  savingPlantilla = false;

  get plantillaResumen(): string {
    return CV_PLANTILLAS.find(p => p.codigo === this.plantillaCodigo)?.resumen ?? '';
  }

  get plantillaNombre(): string {
    return CV_PLANTILLAS.find(p => p.codigo === this.plantillaCodigo)?.nombre ?? 'Clásico';
  }

  get plantillaColor(): string {
    return CV_PLANTILLAS.find(p => p.codigo === this.plantillaCodigo)?.color ?? '#2c7be5';
  }

  get hayCambiosPlantilla(): boolean {
    return this.plantillaCodigo !== this.plantillaCodigoPersistida;
  }

  constructor(
    private cvGeneradoService: CvGeneradoService,
    private cvEditorService: CvEditorService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    forkJoin({
      perfiles: this.cvEditorService.getPerfiles(),
      cvsGenerados: this.cvGeneradoService.listar(),
    }).subscribe({
      next: ({ perfiles, cvsGenerados }) => {
        this.perfiles = perfiles;
        this.cvsGenerados = cvsGenerados;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      },
    });
  }

  private cargarCvsPorPerfil(): void {
    this.cvGeneradoService.listar().subscribe({
      next: data => (this.cvsGenerados = data),
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.loadError),
    });
  }

  trackByCvGenerado(_index: number, cv: CvGeneradoDto): number {
    return cv.cvGeneradoId;
  }

  /** Fecha del CV ya generado (si existe) para el Perfil seleccionado en el combo --
   * el botón dice "Regenerar" en vez de "Generar" cuando ya hay uno. */
  get cvExistenteParaPerfilSeleccionado(): CvGeneradoDto | null {
    if (this.perfilSeleccionadoId === null) return null;
    return this.cvsGenerados.find(c => c.perfilId === this.perfilSeleccionadoId) ?? null;
  }

  generarCvDesdePerfil(): void {
    if (this.perfilSeleccionadoId === null || this.generandoCvPerfil) return;

    this.generandoCvPerfil = true;
    this.cvGeneradoService.generar(this.perfilSeleccionadoId).subscribe({
      next: cv => {
        this.generandoCvPerfil = false;
        this.cargarCvsPorPerfil();
        this.abrirCvPerfil(cv);
      },
      error: (error: HttpErrorResponse) => {
        this.generandoCvPerfil = false;
        this.notificationService.error(extractApiErrorMessage(error) || 'No se pudo generar el CV.');
      },
    });
  }

  abrirCvPerfil(cv: CvGeneradoDto): void {
    if (this.datosEncabezadoCargados) {
      this.cvPerfilAbierto = cv;
      return;
    }
    this.cargarDatosEncabezado(() => (this.cvPerfilAbierto = cv));
  }

  cerrarCv(): void {
    this.cvPerfilAbierto = null;
  }

  imprimirCv(): void {
    window.print();
  }

  onPlantillaSelect(raw: CvPlantillaCodigo | string): void {
    const codigo = normalizeCvPlantillaCodigo(raw);
    if (codigo === this.plantillaCodigo || this.savingPlantilla) {
      return;
    }
    this.plantillaCodigo = codigo;
  }

  guardarPlantilla(): void {
    if (!this.hayCambiosPlantilla || this.savingPlantilla) return;
    const objetivo = this.plantillaCodigo;
    const anterior = this.plantillaCodigoPersistida;
    this.savingPlantilla = true;
    this.cvEditorService.updatePresentacion({ plantillaCodigo: objetivo }).subscribe({
      next: p => {
        this.plantillaCodigo = normalizeCvPlantillaCodigo(p.plantillaCodigo);
        this.plantillaCodigoPersistida = this.plantillaCodigo;
        this.savingPlantilla = false;
        this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
      },
      error: () => {
        this.plantillaCodigo = anterior;
        this.plantillaCodigoPersistida = anterior;
        this.savingPlantilla = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.saveError);
      },
    });
  }

  revertirPlantilla(): void {
    if (this.savingPlantilla) return;
    this.plantillaCodigo = this.plantillaCodigoPersistida;
  }

  /** Nombres de las habilidades elegidas por la IA para el CV por perfil abierto, según
   * su tipo real -- usado por la plantilla Corporativo para agruparlas en la barra
   * lateral (Técnicas/Blandas/Idiomas), igual que en Profesional. Sin tipo reconocido
   * (o "Otra") cae en "tecnica", mismo criterio que CvPlantillaPreviewComponent. */
  habilidadesPorTipo(tipo: 'tecnica' | 'blanda' | 'idioma'): string[] {
    const habilidades = this.cvPerfilAbierto?.contenido.habilidades ?? [];
    return habilidades
      .filter(h => {
        const t = (h.tipo ?? '').trim();
        if (tipo === 'blanda') return t === 'Blanda';
        if (tipo === 'idioma') return t === 'Idioma';
        return t === 'Tecnica' || t === 'Otra' || !t;
      })
      .map(h => h.nombre);
  }

  /** Datos del Perfil elegido tal cual están guardados (para años/aspiración salarial
   * en el bloque "Perfil Profesional" -- la IA no toca esos campos). */
  get perfilBaseAbierto(): PerfilDto | null {
    if (!this.cvPerfilAbierto) return null;
    return this.perfiles.find(p => p.perfilId === this.cvPerfilAbierto!.perfilId) ?? null;
  }

  get nombreCompleto(): string {
    const p = this.personales;
    if (!p) return 'Tu nombre';
    return (
      [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido].filter(Boolean).join(' ').trim() ||
      'Tu nombre'
    );
  }

  get inicialesFoto(): string {
    const parts = this.nombreCompleto.split(/\s+/).filter(Boolean);
    const a = (parts[0]?.[0] ?? '').toUpperCase();
    const b = (parts[1]?.[0] ?? parts[0]?.[1] ?? '').toUpperCase();
    return a + b || 'CV';
  }

  get fotoHeaderUrl(): string | null {
    const u = this.personales?.fotoUrl?.trim();
    if (!u) return null;
    return this.visibilidad.visibleAtributoSafe('datos-personales', 'foto') ? u : null;
  }

  get mostrarEmail(): boolean {
    return this.visibilidad.visibleAtributoSafe('datos-personales', 'email') && !!this.personales?.email?.trim();
  }

  get telefonoContacto(): string | null {
    return this.personales?.celular?.trim() || this.personales?.telefonoFijo?.trim() || null;
  }

  get mostrarTelefono(): boolean {
    return this.visibilidad.visibleAtributoSafe('datos-personales', 'telefono') && !!this.telefonoContacto;
  }

  get ciudadPais(): string | null {
    const ciudad = this.personales?.ciudad?.trim();
    const pais = this.personales?.pais?.trim();
    if (!ciudad && !pais) return null;
    return ciudad && pais ? `${ciudad}, ${pais}` : ciudad || pais || null;
  }

  get mostrarCiudadPais(): boolean {
    return this.visibilidad.visibleAtributoSafe('datos-personales', 'ciudad-pais') && !!this.ciudadPais;
  }

  get redesConTexto(): { icono: string; texto: string }[] {
    return this.redes
      .filter(r => r.mostrarEnCv !== false)
      .map(r => ({
        icono: ICONOS_RED[(r.nombreRed ?? '').trim().toLowerCase()] ?? 'bi-link-45deg',
        texto: (r.linkPublico?.trim() || r.usuarioContacto?.trim() || '').trim(),
      }))
      .filter(r => r.texto);
  }

  get aspiracionTexto(): string | null {
    const p = this.perfilBaseAbierto;
    if (!p) return null;
    const cop = p.aspiracionSalarialPesos;
    const usd = p.aspiracionSalarialDolares;
    if (cop == null && usd == null) return null;
    const parts: string[] = [];
    if (cop != null) parts.push(`$${Math.round(Number(cop)).toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP`);
    if (usd != null) parts.push(`$${Number(usd).toLocaleString('en-US', { maximumFractionDigits: 0 })} USD mensuales`);
    return parts.join(' / ');
  }

  private cargarDatosEncabezado(alTerminar: () => void): void {
    forkJoin({
      personales: this.cvEditorService.getPersonales(),
      redes: this.cvEditorService.getRedesSociales(),
      visibilidadSeccion: this.cvEditorService.getVisibilidad(),
      presentacion: this.cvEditorService.getPresentacion(),
    }).subscribe({
      next: ({ personales, redes, visibilidadSeccion, presentacion }) => {
        this.personales = personales;
        this.redes = redes;
        this.visibilidadSeccion = visibilidadSeccion;
        this.plantillaCodigo = normalizeCvPlantillaCodigo(presentacion.plantillaCodigo);
        this.plantillaCodigoPersistida = this.plantillaCodigo;
        this.datosEncabezadoCargados = true;
        alTerminar();
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.loadError),
    });
  }

  // Misma lógica de visibilidad que ProfesionalComponent -- respeta los interruptores
  // de "Contenido de cada pestaña" de Configuración (solo para el encabezado acá).
  private get visibilidad(): VisibilidadSeccionResolver {
    return new VisibilidadSeccionResolver(this.visibilidadSeccion);
  }
}
