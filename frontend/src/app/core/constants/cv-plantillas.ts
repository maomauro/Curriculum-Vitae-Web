/** Códigos persistidos en API/BD (minúsculas). Incluye plantillas originales + prototipos en docs/diseño/prototipos/privada/plantillas-cv/. */
export const CV_PLANTILLA_CODIGOS = [
  'clasico',
  'profesional',
  'ats',
  'corporativo',
  'ejecutivo',
] as const;
export type CvPlantillaCodigo = (typeof CV_PLANTILLA_CODIGOS)[number];

export interface CvPlantillaMeta {
  codigo: CvPlantillaCodigo;
  nombre: string;
  color: string;
  /** Texto corto (ayuda / tooltips) */
  resumen: string;
}

/** Plantillas disponibles en Mi CV (selector). */
export const CV_PLANTILLAS: readonly CvPlantillaMeta[] = [
  {
    codigo: 'clasico',
    nombre: 'Clásico',
    color: '#2c7be5',
    resumen: 'Cabecera azul, barra lateral clara con competencias y cuerpo principal con timeline.',
  },
  {
    codigo: 'profesional',
    nombre: 'Profesional',
    color: '#212529',
    resumen: 'Una columna, estilo documento: viñetas en experiencia y listas de habilidades en el cuerpo.',
  },
  {
    codigo: 'ats',
    nombre: 'ATS / Tradicional',
    color: '#1a365d',
    resumen: 'Una columna, títulos claros y texto lineal; pensado para ATS y lectura rápida.',
  },
  {
    codigo: 'corporativo',
    nombre: 'Corporativo',
    color: '#1e3a5f',
    resumen: 'Columna lateral oscura (contacto y competencias) y narrativa en el cuerpo principal.',
  },
  {
    codigo: 'ejecutivo',
    nombre: 'Ejecutivo',
    color: '#111827',
    resumen: 'Tipografía serif + sans, mucho aire y secciones sobrias para perfiles senior.',
  },
] as const;

export function normalizeCvPlantillaCodigo(raw: string | null | undefined): CvPlantillaCodigo {
  const v = (raw ?? '').trim().toLowerCase();
  return (CV_PLANTILLA_CODIGOS as readonly string[]).includes(v) ? (v as CvPlantillaCodigo) : 'clasico';
}
