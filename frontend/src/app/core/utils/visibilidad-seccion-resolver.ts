import type { VisibilidadSeccionPublicaDto } from '../services/public/public.service';
import type { CvPreviewVisibilidad } from '../../shared/models/cv-preview-vm';

/** Secciones que la Hoja de Vida siempre incluye -- solo sus atributos son
 * configurables (mismo criterio que Configuración: sin interruptor de sección para
 * estas 4, ver configuracion.component.ts). */
function seccionSiempreVisible(key: string): boolean {
  return (
    key === 'datos-personales' ||
    key === 'perfil' ||
    key === 'experiencia' ||
    key === 'formacion-academica'
  );
}

/** Implementación de CvPreviewVisibilidad a partir de las filas crudas de
 * VisibilidadSeccion que trae el CvDetalleDto -- usada por la pestaña pública
 * "Información profesional" y por el panel de vista previa en Configuración, para
 * filtrar el consolidado exactamente como lo haría un visitante real. */
export class VisibilidadSeccionResolver implements CvPreviewVisibilidad {
  private readonly mapa = new Map<string, boolean>();

  constructor(data: VisibilidadSeccionPublicaDto[] | null | undefined) {
    (data ?? []).forEach(v => this.mapa.set((v.seccion ?? '').trim().toLowerCase(), v.visible));
  }

  visibleSeccion(seccion: string): boolean {
    return this.isVisible(seccion);
  }

  visibleAtributo(seccion: string, attr: string): boolean {
    return this.isVisible(seccion) && this.isVisible(`${seccion}.${attr}`);
  }

  /** Si la clave no está guardada, se considera visible (retrocompatibilidad). */
  visibleAtributoSafe(seccion: string, attr: string): boolean {
    if (!this.isVisible(seccion)) return false;
    const key = `${seccion}.${attr}`;
    if (!this.mapa.has(key)) return true;
    return this.mapa.get(key) === true;
  }

  private isVisible(key: string): boolean {
    const k = key.trim().toLowerCase();
    if (seccionSiempreVisible(k)) return true;
    if (!this.mapa.has(k)) return true;
    return this.mapa.get(k) === true;
  }
}
