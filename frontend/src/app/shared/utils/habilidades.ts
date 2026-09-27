export type CategoriaHabilidad = 'tecnica' | 'blanda' | 'idioma';

/** Clasifica una habilidad por su tipo real para agruparla en la barra lateral
 * (Técnicas/Blandas/Idiomas) de las plantillas de CV -- criterio único compartido por
 * `cv-plantilla-preview` (Información profesional), `mi-cv` y `cv-hoja-de-vida-contenido`
 * (Mi CV / Hoja de vida). Sin tipo reconocido, o "Otra", cae en "tecnica" por defecto --
 * antes este fallback solo vivía en 2 de los 3 lugares, lo que hacía que una habilidad
 * sin tipo desapareciera en Información profesional aunque siguiera visible en Mi CV. */
export function perteneceCategoriaHabilidad(
  tipo: string | null | undefined,
  categoria: CategoriaHabilidad
): boolean {
  const t = (tipo ?? '').trim();
  if (categoria === 'blanda') return t === 'Blanda';
  if (categoria === 'idioma') return t === 'Idioma';
  return t === 'Tecnica' || t === 'Otra' || !t;
}
