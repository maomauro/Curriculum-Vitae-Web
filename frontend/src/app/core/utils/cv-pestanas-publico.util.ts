import type { CvDetalleDto } from '../services/public/public.service';
import { cvPublicoMuestraPestanaDashboard } from './cv-dashboard-publico.util';
import { cvPublicoMuestraPestanaProfesional } from './cv-profesional-publico.util';
import { cvPublicoMuestraPestanaHojaDeVida } from './cv-hoja-de-vida-publico.util';

/** Path de ruta hija bajo cv/:urlPublica -- '' es la pestaña Hoja de vida (ruta raíz). */
export type PestanaPublicaPath = '' | 'profesional' | 'dashboard';

/** Mismo orden que los tabs en el shell: Dashboard -> Profesional -> Hoja de vida. */
const ORDEN_PESTANAS: readonly PestanaPublicaPath[] = ['dashboard', 'profesional', ''];

export function pestanaPublicaHabilitada(path: PestanaPublicaPath, cv: CvDetalleDto | null | undefined): boolean {
  if (path === 'dashboard') return cvPublicoMuestraPestanaDashboard(cv);
  if (path === 'profesional') return cvPublicoMuestraPestanaProfesional(cv);
  return cvPublicoMuestraPestanaHojaDeVida(cv);
}

/** Si `path` está deshabilitada (el postulante apagó esa pestaña en Configuración), la
 * pestaña no debe verse ni siquiera por link directo -- esto evita que ocultar el tab en
 * el menú sea solo cosmético. Devuelve `path` si ya está habilitada, el path de la
 * primera pestaña habilitada en su lugar, o null si las tres están apagadas (no hay a
 * dónde redirigir dentro del CV). */
export function pestanaPublicaDeRespaldo(
  path: PestanaPublicaPath,
  cv: CvDetalleDto | null | undefined
): PestanaPublicaPath | null {
  if (pestanaPublicaHabilitada(path, cv)) return path;
  const alternativa = ORDEN_PESTANAS.find(p => p !== path && pestanaPublicaHabilitada(p, cv));
  return alternativa ?? null;
}
