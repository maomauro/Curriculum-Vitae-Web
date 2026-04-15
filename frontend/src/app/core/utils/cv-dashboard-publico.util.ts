import type { CvDetalleDto } from '../services/public/public.service';

/** Pestaña «Dashboard analítico» visible en el CV público (respeta flags del API). */
export function cvPublicoMuestraPestanaDashboard(cv: CvDetalleDto | null | undefined): boolean {
  if (!cv) return false;
  const m = cv.dashboardMostrarMetricas ?? true;
  const g = cv.dashboardMostrarGraficas ?? true;
  return m || g;
}
