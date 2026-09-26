import { Component, Input } from '@angular/core';
import { normalizeCvPlantillaCodigo, type CvPlantillaCodigo } from '../../../core/constants/cv-plantillas';
import type {
  HojaDeVidaContenidoDto,
  PersonalesPublicoDto,
  PerfilPublicoDto,
  RedSocialPublicoDto,
} from '../../../core/services/public/public.service';
import type { CvPreviewVisibilidad } from '../../models/cv-preview-vm';

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

/** Renderiza el CV generado por IA del Perfil activo (Experiencia/Educación/Proyectos/
 * Habilidades condensados) con encabezado (foto, nombre, contacto) y la plantilla de
 * color vigente -- mismas clases CSS globales (`cv-mi-preview`, `cv-tpl--*`) que usan
 * "Mi CV" y `app-cv-plantilla-preview`, para no reinventar el look. Compartido entre la
 * pestaña pública "Hoja de vida" (hoja-de-vida.component) y el panel "Así lo ve un
 * visitante" de Configuración (preview-publico-panel.component). Solo lectura: acá no
 * se elige plantilla, esa decisión vive en "Mi CV". */
@Component({
  selector: 'app-cv-hoja-de-vida-contenido',
  standalone: false,
  templateUrl: './cv-hoja-de-vida-contenido.component.html',
})
export class CvHojaDeVidaContenidoComponent {
  @Input() contenido: HojaDeVidaContenidoDto | null = null;
  @Input() personales: PersonalesPublicoDto | null = null;
  @Input() redesSociales: RedSocialPublicoDto[] = [];
  @Input() perfilActivo: PerfilPublicoDto | null = null;
  @Input() vis: CvPreviewVisibilidad | null = null;
  @Input() mostrarControlesZoom = true;

  private plantillaCodigoRaw: CvPlantillaCodigo = 'clasico';

  @Input()
  set plantillaCodigo(raw: CvPlantillaCodigo | string | null | undefined) {
    this.plantillaCodigoRaw = normalizeCvPlantillaCodigo(raw);
  }
  get plantillaCodigo(): CvPlantillaCodigo {
    return this.plantillaCodigoRaw;
  }

  /** Rango de zoom solo pantalla; impresión fuerza 100% en CSS (mismo criterio que cv-plantilla-preview). */
  readonly zoomMin = 0.75;
  readonly zoomMax = 1.75;
  readonly zoomPaso = 0.1;
  nivelZoom = 1;

  get etiquetaZoom(): string {
    return `${Math.round(this.nivelZoom * 100)}%`;
  }

  acercarZoom(): void {
    this.ajustarZoom(this.nivelZoom + this.zoomPaso);
  }

  alejarZoom(): void {
    this.ajustarZoom(this.nivelZoom - this.zoomPaso);
  }

  restablecerZoom(): void {
    this.nivelZoom = 1;
  }

  private ajustarZoom(valor: number): void {
    const r = Math.round(valor * 100) / 100;
    this.nivelZoom = Math.min(this.zoomMax, Math.max(this.zoomMin, r));
  }

  attrSafe(seccion: string, attr: string): boolean {
    return this.vis?.visibleAtributoSafe(seccion, attr) ?? true;
  }

  get previewRootClass(): string {
    return `cv-mi-preview bg-white rounded-3 overflow-hidden cv-tpl--${this.plantillaCodigo}`;
  }

  get nombreCompleto(): string {
    return (this.personales?.nombreCompleto ?? '').trim() || 'Tu nombre';
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
    return this.attrSafe('datos-personales', 'foto') ? u : null;
  }

  get mostrarEmail(): boolean {
    return this.attrSafe('datos-personales', 'email') && !!this.personales?.email?.trim();
  }

  get telefonoContacto(): string | null {
    return this.personales?.celular?.trim() || null;
  }

  get mostrarTelefono(): boolean {
    return this.attrSafe('datos-personales', 'telefono') && !!this.telefonoContacto;
  }

  get ciudadPais(): string | null {
    const ciudad = this.personales?.ciudad?.trim();
    const pais = this.personales?.pais?.trim();
    if (!ciudad && !pais) return null;
    return ciudad && pais ? `${ciudad}, ${pais}` : ciudad || pais || null;
  }

  get mostrarCiudadPais(): boolean {
    return this.attrSafe('datos-personales', 'ciudad-pais') && !!this.ciudadPais;
  }

  get redesConTexto(): { icono: string; texto: string }[] {
    return (this.redesSociales ?? [])
      .map(r => ({
        icono: ICONOS_RED[(r.nombreRed ?? '').trim().toLowerCase()] ?? 'bi-link-45deg',
        texto: (r.linkPublico?.trim() || r.usuarioContacto?.trim() || '').trim(),
      }))
      .filter(r => r.texto);
  }

  get aspiracionTexto(): string | null {
    const p = this.perfilActivo;
    if (!p) return null;
    const cop = p.aspiracionSalarialPesos;
    const usd = p.aspiracionSalarialDolares;
    if (cop == null && usd == null) return null;
    const parts: string[] = [];
    if (cop != null) parts.push(`$${Math.round(Number(cop)).toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP`);
    if (usd != null) parts.push(`$${Number(usd).toLocaleString('en-US', { maximumFractionDigits: 0 })} USD mensuales`);
    return parts.join(' / ');
  }

  /** Nombres de habilidades por tipo real -- usado por la plantilla Corporativo para
   * agruparlas en la barra lateral (Técnicas/Blandas/Idiomas), igual que en Mi CV. */
  habilidadesPorTipo(tipo: 'tecnica' | 'blanda' | 'idioma'): string[] {
    const habilidades = this.contenido?.habilidades ?? [];
    return habilidades
      .filter(h => {
        const t = (h.tipo ?? '').trim();
        if (tipo === 'blanda') return t === 'Blanda';
        if (tipo === 'idioma') return t === 'Idioma';
        return t === 'Tecnica' || t === 'Otra' || !t;
      })
      .map(h => h.nombre);
  }
}
