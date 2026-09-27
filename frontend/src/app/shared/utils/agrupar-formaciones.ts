/** Palabras genéricas que no aportan al "tema" de una formación -- se ignoran al buscar
 * la primera palabra significativa de un título (ej. "Certificación Scrum Master" ->
 * tema "scrum", no "certificación"). */
const CONECTORES_INICIO = new Set([
  'certificacion', 'certificación', 'diplomado', 'curso', 'especializacion',
  'especialización', 'taller', 'seminario', 'programa', 'maestria', 'maestría',
  'en', 'de', 'del', 'la', 'el', 'los', 'las', 'para', 'y',
]);

function normalizar(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function primeraPalabraClave(titulo: string | null): string | null {
  const palabras = normalizar(titulo ?? '').split(/\s+/).filter(Boolean);
  for (const p of palabras) {
    if (!CONECTORES_INICIO.has(p) && p.length >= 3) return p;
  }
  return null;
}

export interface FormacionAgrupable {
  titulo: string | null;
  institucion: string | null;
}

export interface GrupoFormacionVm<T> {
  items: T[];
  /** Prefijo de palabras compartido por los títulos del grupo (ej. "Certificación Scrum").
   * Solo se calcula (no null) cuando el grupo tiene 2+ ítems -- con 1 solo ítem se
   * renderiza igual que antes de existir el agrupamiento. */
  prefijoComun: string | null;
}

/** Agrupa formaciones (ya filtradas por un mismo tipoFormacion, ej. "Certificacion") que
 * comparten institución y la primera palabra significativa del título -- evita listas
 * repetitivas cuando el candidato tiene varias credenciales del mismo tema (ej. 5
 * certificaciones Scrum de un mismo proveedor). Preserva el orden original: cada grupo
 * aparece en la posición de su primer ítem. */
export function agruparFormacionesPorTema<T extends FormacionAgrupable>(items: T[]): GrupoFormacionVm<T>[] {
  const resultado: GrupoFormacionVm<T>[] = [];
  const indicePorClave = new Map<string, number>();

  for (const item of items) {
    const tema = primeraPalabraClave(item.titulo);
    const institucion = (item.institucion ?? '').trim();
    if (!tema || !institucion) {
      resultado.push({ items: [item], prefijoComun: null });
      continue;
    }
    const clave = `${normalizar(institucion)}::${tema}`;
    const idx = indicePorClave.get(clave);
    if (idx == null) {
      indicePorClave.set(clave, resultado.length);
      resultado.push({ items: [item], prefijoComun: null });
    } else {
      resultado[idx].items.push(item);
    }
  }

  resultado.forEach(grupo => {
    if (grupo.items.length > 1) {
      grupo.prefijoComun = prefijoComunPalabras(grupo.items.map(i => i.titulo ?? ''));
    }
  });

  return resultado;
}

/** Prefijo de palabras común a todos los títulos, comparado sin distinguir mayúsculas. */
export function prefijoComunPalabras(titulos: string[]): string {
  if (!titulos.length) return '';
  const listas = titulos.map(t => t.trim().split(/\s+/));
  const largoMinimo = Math.min(...listas.map(l => l.length));
  const prefijo: string[] = [];
  for (let i = 0; i < largoMinimo; i++) {
    const palabra = listas[0][i];
    if (listas.every(l => l[i].toLowerCase() === palabra.toLowerCase())) {
      prefijo.push(palabra);
    } else {
      break;
    }
  }
  return prefijo.join(' ');
}

/** Parte de un título que queda tras quitarle el prefijo común del grupo -- si no queda
 * nada (título idéntico al prefijo), se devuelve el título completo. */
export function diferenciadorTitulo(titulo: string, prefijoComun: string): string {
  const t = titulo.trim();
  if (!prefijoComun) return t;
  if (t.toLowerCase().startsWith(prefijoComun.toLowerCase())) {
    const resto = t.slice(prefijoComun.length).trim();
    return resto || t;
  }
  return t;
}

/** Prefijo común sin la palabra genérica del tipo (ej. "Certificación Scrum" -> "Scrum")
 * -- esa palabra ya la dice el título de la sección ("CERTIFICACIONES"), repetirla en cada
 * grupo es redundante. Si tras quitarla no queda nada, se devuelve el prefijo original
 * (nunca vacío). Solo afecta el texto mostrado como encabezado del grupo -- diferenciadorTitulo
 * sigue usando el prefijoComun completo para cortar cada título individual. */
export function prefijoVisiblePorTema(prefijoComun: string): string {
  const palabras = prefijoComun.trim().split(/\s+/).filter(Boolean);
  while (palabras.length > 1 && CONECTORES_INICIO.has(normalizar(palabras[0]))) {
    palabras.shift();
  }
  return palabras.join(' ') || prefijoComun;
}
