import type { CvDetalleDto } from '../services/public/public.service';

/** Pestaña «Información profesional» visible en el CV público (respeta flag del API). */
export function cvPublicoMuestraPestanaProfesional(cv: CvDetalleDto | null | undefined): boolean {
  if (!cv) return false;
  return cv.informacionProfesionalPublicaActiva ?? true;
}
