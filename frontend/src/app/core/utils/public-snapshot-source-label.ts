/**
 * Texto legible para el visitante: origen del snapshot (estático del sitio vs memoria del API).
 * `sourceVersion` viene del JSON (`PublicCvsSnapshotDto.sourceVersion`).
 */
export function etiquetaOrigenSnapshot(sourceVersion: string | null | undefined): string {
  const v = (sourceVersion ?? '').trim();
  if (v === 'seed-local') {
    return 'Copia estática del sitio (archivo publicado con el portal).';
  }
  if (v === 'bootstrap-empty') {
    return 'Estado inicial del API: el snapshot en memoria aún no se ha generado desde la base de datos (o el servidor acaba de iniciar).';
  }
  if (v.length > 0) {
    return `Snapshot del servidor (referencia: ${v}).`;
  }
  return 'Snapshot del servidor.';
}

/** No mostrar "última generación" cuando la fecha es placeholder (época Unix) o el origen no aplica. */
export function mostrarFechaGeneracionSnapshot(
  generatedAtUtc: string | null | undefined,
  sourceVersion: string | null | undefined
): boolean {
  if (!generatedAtUtc) return false;
  const sv = (sourceVersion ?? '').trim();
  if (sv === 'bootstrap-empty' || sv === 'seed-local') return false;
  const t = Date.parse(generatedAtUtc);
  if (Number.isNaN(t)) return false;
  return t > Date.parse('1970-01-02T00:00:00.000Z');
}
