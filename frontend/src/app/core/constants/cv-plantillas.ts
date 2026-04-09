/** Códigos persistidos en API/BD (minúsculas). */
export const CV_PLANTILLA_CODIGOS = ['clasico', 'profesional'] as const;
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
    resumen: 'Cabecera azul, columna lateral y contenido principal (corporativo).',
  },
  {
    codigo: 'profesional',
    nombre: 'Profesional',
    color: '#212529',
    resumen:
      'Estilo hoja de vida en PDF: una columna, cabecera clara, logros en viñetas y habilidades en lista.',
  },
] as const;

/** Códigos antiguos que ya no existen: se normalizan a clásico al leer. */
const PLANTILLA_DEPRECADAS: Record<string, CvPlantillaCodigo> = {
  moderno: 'clasico',
  minimal: 'clasico',
  creativo: 'clasico',
};

export function normalizeCvPlantillaCodigo(raw: string | null | undefined): CvPlantillaCodigo {
  const v = (raw ?? '').trim().toLowerCase();
  const migrado = PLANTILLA_DEPRECADAS[v];
  if (migrado) return migrado;
  return (CV_PLANTILLA_CODIGOS as readonly string[]).includes(v) ? (v as CvPlantillaCodigo) : 'clasico';
}
