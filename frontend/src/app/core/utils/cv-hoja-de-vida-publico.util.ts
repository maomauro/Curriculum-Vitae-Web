import type { CvDetalleDto } from '../services/public/public.service';

/** Pestaña «Hoja de vida» visible en el CV público (respeta flag del API). */
export function cvPublicoMuestraPestanaHojaDeVida(cv: CvDetalleDto | null | undefined): boolean {
  if (!cv) return false;
  return cv.hojaDeVidaPublicaActiva ?? true;
}
