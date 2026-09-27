/** Meses exactos entre dos fechas, ajustando por día del mes (ej. del 15 de enero al 10 de
 * marzo son 1 mes, no 2, porque no se completó el segundo mes) -- criterio único compartido
 * por experiencia.component (editor), cv-plantilla-preview (CV público) y
 * dashboard-candidato (gráficas). Nunca negativo. */
export function mesesEntreFechas(inicio: Date, fin: Date): number {
  const years = fin.getFullYear() - inicio.getFullYear();
  const months = fin.getMonth() - inicio.getMonth();
  let total = years * 12 + months;
  if (fin.getDate() < inicio.getDate()) total -= 1;
  return Math.max(0, total);
}

/** "3 meses" / "1 año" / "2 años y 3 meses" -- nunca por debajo de "1 mes": un cargo real
 * (con fechas válidas) siempre muestra al menos 1 mes, aunque el cálculo exacto dé 0 (ej.
 * empezó y terminó la misma semana). Solo llamar con una duración de datos válidos; para
 * "sin datos" usar '' o '—' antes de llegar acá. */
export function formatearDuracion(mesesExactos: number): string {
  const meses = Math.max(1, mesesExactos);
  if (meses < 12) return meses === 1 ? '1 mes' : `${meses} meses`;
  const anios = Math.floor(meses / 12);
  const resto = meses % 12;
  const yearPart = anios === 1 ? '1 año' : `${anios} años`;
  if (resto === 0) return yearPart;
  const monthPart = resto === 1 ? '1 mes' : `${resto} meses`;
  return `${yearPart} y ${monthPart}`;
}
