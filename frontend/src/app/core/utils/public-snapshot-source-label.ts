/**
 * Texto legible para el visitante: origen del snapshot (estático del sitio vs memoria del API).
 * `sourceVersion` viene del JSON (`PublicCvsSnapshotDto.sourceVersion`).
 */
export function etiquetaOrigenSnapshot(sourceVersion: string | null | undefined): string {
  const v = (sourceVersion ?? '').trim();
  if (v === 'seed-local') {
    return 'Copia estática del sitio (archivo publicado con el portal).';
  }
  if (v.length > 0) {
    return `Snapshot del servidor (referencia: ${v}).`;
  }
  return 'Snapshot del servidor.';
}
