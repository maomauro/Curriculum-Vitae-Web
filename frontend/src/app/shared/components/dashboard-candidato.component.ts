import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';
import type { Plugin } from 'chart.js';
import {
  CvDetalleDto,
  ExperienciaPublicoDto,
  FormacionPublicoDto,
  HabilidadPublicoDto,
  ProyectoPublicoDto,
} from '../../core/services/public/public.service';
import { CvDetalleVistaContext } from '../contexts/cv-detalle-vista.context';
import { cvPublicoMuestraPestanaDashboard } from '../../core/utils/cv-dashboard-publico.util';

interface MetricaCard {
  label: string;
  valor: string;
  sub: string;
  icono: string;
  gradiente: string;
}

interface ExpEmpresa {
  empresa: string;
  meses: number;
  porcentaje: number;
}

interface TimelineYearSeries {
  labels: string[];
  edu: number[];
  exp: number[];
}

interface EducacionTipoSeries {
  labels: string[];
  values: number[];
}

interface HabilidadNivelSerie {
  labels: string[];
  basico: number[];
  intermedio: number[];
  avanzado: number[];
  experto: number[];
}

interface HabilidadStrategicPoint {
  grupo: string;
  total: number;
  madurezPromedio: number;
  basico: number;
  intermedio: number;
  avanzado: number;
  experto: number;
}

interface TecnologiaProyectoRow {
  etiqueta: string;
  cantidadProyectos: number;
  proyectos: string[];
  /** true solo en el pedazo sintético "Otras" que agrega el resto (ver buildTecnologiasProyectosDona). */
  esOtras?: boolean;
}

/** Paleta prototipo dashboard-candidato.html */
const CHART_COLOR_VERDE = '#6EE7B7';
const CHART_COLOR_BARRAS = '#7C6FCD';
/** Un color por grupo/tecnología (mapa de cuadrantes y dona de tecnologías) -- ayuda a
 * distinguir puntos/pedazos cercanos además de la etiqueta de texto. */
const CHART_HABILIDADES_COLORS = [
  'rgba(37, 99, 235, 0.9)',
  'rgba(14, 165, 233, 0.9)',
  'rgba(34, 197, 94, 0.9)',
  'rgba(124, 111, 205, 0.9)',
  'rgba(253, 126, 20, 0.9)',
  'rgba(236, 72, 153, 0.9)',
  'rgba(234, 179, 8, 0.9)',
  'rgba(99, 102, 241, 0.9)',
];
/** Gris neutro para el pedazo "Otras" de la dona -- lo distingue de las tecnologías
 * puntuales (que usan la paleta de colores de arriba). */
const CHART_OTRAS_COLOR = 'rgba(156, 163, 175, 0.85)';
const TIPOS_FORMACION_ACADEMICA = new Set([
  'Posgrado',
  'Pregrado',
  'Tecnologo',
  'Tecnico',
  'Técnologo',
]);

function parseDateOnly(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(`${s}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthsInclusive(start: Date, end: Date): number {
  const total =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  return Math.max(0, total);
}

function mesesExperiencia(exp: ExperienciaPublicoDto): number {
  const start = parseDateOnly(exp.fechaInicio);
  if (!start) return 0;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  let end = exp.esActual ? today : parseDateOnly(exp.fechaFin) ?? today;
  if (end > today) end = today;
  if (end < start) return 0;
  let meses = monthsInclusive(start, end);
  if (meses > 600) meses = 600;
  return meses;
}

function formatTrayectoriaMeses(totalMeses: number): string {
  if (totalMeses <= 0) return '0';
  const anios = Math.floor(totalMeses / 12);
  const meses = totalMeses % 12;
  const parts: string[] = [];
  if (anios > 0) parts.push(`${anios} año${anios === 1 ? '' : 's'}`);
  if (meses > 0) parts.push(`${meses} mes${meses === 1 ? '' : 'es'}`);
  return parts.join(' ') || '0';
}

function nivelHabilidadANumero(nivel: string | null | undefined): number | null {
  if (!nivel?.trim()) return null;
  const t = nivel.trim().toLowerCase();
  if (t.includes('bás') || t.includes('basic')) return 1;
  if (t.includes('intermedio')) return 2;
  if (t.includes('avanz')) return 3;
  if (t.includes('expert')) return 4;
  return null;
}

function contarTitulosAcademicos(formaciones: FormacionPublicoDto[]): number {
  return formaciones.filter(f => {
    const tipo = (f.tipoFormacion ?? '').trim();
    return TIPOS_FORMACION_ACADEMICA.has(tipo);
  }).length;
}

function completitudAproximada(cv: CvDetalleDto): number {
  let ok = 0;
  const total = 6;
  const p = cv.personales;
  if (p?.nombreCompleto?.trim()) ok++;
  if ((cv.perfiles?.length ?? 0) > 0) ok++;
  if ((cv.experiencias?.length ?? 0) > 0) ok++;
  if ((cv.formaciones?.length ?? 0) > 0) ok++;
  if ((cv.habilidades?.length ?? 0) > 0) ok++;
  if ((cv.proyectos?.length ?? 0) > 0 || (cv.redesSociales?.length ?? 0) > 0) ok++;
  return Math.round((100 * ok) / total);
}

function buildMetricas(cv: CvDetalleDto): MetricaCard[] {
  const tray = formatTrayectoriaMeses(cv.experienciaLaboralMesesAcumulados ?? 0);

  return [
    {
      label: 'Experiencia acumulada',
      valor: tray,
      sub: 'Suma de periodos laborales',
      icono: 'bi-graph-up-arrow',
      gradiente: 'linear-gradient(135deg,#22c55e,#15803d)',
    },
    {
      label: 'Experiencias laborales',
      valor: String(cv.experiencias?.length ?? 0),
      sub: 'Registros de empleo',
      icono: 'bi-buildings',
      gradiente: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
    },
    {
      label: 'Títulos académicos',
      valor: String(contarTitulosAcademicos(cv.formaciones ?? [])),
      sub: 'Posgrado, pregrado, técnico…',
      icono: 'bi-mortarboard-fill',
      gradiente: 'linear-gradient(135deg,#a855f7,#7c3aed)',
    },
  ];
}

export function buildExpPorEmpresa(experiencias: ExperienciaPublicoDto[]): ExpEmpresa[] {
  const map = new Map<string, { meses: number; primeraFechaInicio: Date | null }>();
  for (const e of experiencias) {
    const emp = (e.empresa ?? 'Sin empresa').trim() || 'Sin empresa';
    const fechaInicio = parseDateOnly(e.fechaInicio);
    const current = map.get(emp) ?? { meses: 0, primeraFechaInicio: null };
    const primeraFechaInicio =
      current.primeraFechaInicio && fechaInicio
        ? current.primeraFechaInicio <= fechaInicio
          ? current.primeraFechaInicio
          : fechaInicio
        : current.primeraFechaInicio ?? fechaInicio;

    map.set(emp, {
      meses: current.meses + mesesExperiencia(e),
      primeraFechaInicio,
    });
  }
  const rows = [...map.entries()]
    .map(([empresa, data]) => ({
      empresa,
      meses: data.meses,
      primeraFechaInicio: data.primeraFechaInicio,
    }))
    .filter(r => r.meses > 0)
    .sort((a, b) => {
      const ta = a.primeraFechaInicio?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const tb = b.primeraFechaInicio?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return ta - tb;
    });
  const max = rows[0]?.meses ?? 1;
  return rows.map(r => ({
    empresa: r.empresa,
    meses: r.meses,
    porcentaje: Math.round((100 * r.meses) / max),
  }));
}

function buildTimelineYearSeries(cv: CvDetalleDto): TimelineYearSeries {
  const years = new Set<number>();
  for (const e of cv.experiencias ?? []) {
    const d = parseDateOnly(e.fechaInicio);
    if (d) years.add(d.getFullYear());
  }
  for (const f of cv.formaciones ?? []) {
    const d = parseDateOnly(f.fechaInicio);
    if (d) years.add(d.getFullYear());
  }
  if (years.size === 0) {
    return { labels: [], edu: [], exp: [] };
  }
  const ymin = Math.min(...years);
  const ymax = Math.max(...years);
  const labels: string[] = [];
  const edu: number[] = [];
  const exp: number[] = [];
  for (let y = ymin; y <= ymax; y++) {
    labels.push(String(y));
    let ec = 0;
    for (const f of cv.formaciones ?? []) {
      const d = parseDateOnly(f.fechaInicio);
      if (d && d.getFullYear() === y) ec++;
    }
    edu.push(ec);
    let xc = 0;
    for (const e of cv.experiencias ?? []) {
      const d = parseDateOnly(e.fechaInicio);
      if (d && d.getFullYear() === y) xc++;
    }
    exp.push(xc);
  }
  return { labels, edu, exp };
}

export function normalizarTipoFormacion(tipo: string | null | undefined): string {
  const value = (tipo ?? '').trim();
  return value || 'Sin tipo';
}

export function buildEducacionTipoSeries(formaciones: FormacionPublicoDto[]): EducacionTipoSeries {
  const countByType = new Map<string, number>();
  for (const formacion of formaciones ?? []) {
    const tipo = normalizarTipoFormacion(formacion.tipoFormacion);
    countByType.set(tipo, (countByType.get(tipo) ?? 0) + 1);
  }

  const rows = [...countByType.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'));

  return {
    labels: rows.map(([tipo]) => tipo),
    values: rows.map(([, total]) => total),
  };
}

function truncarEtiquetaGrafico(s: string, max = 44): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** Mediana usada para dividir el mapa de cuadrantes por cobertura/madurez -- relativa al
 * propio perfil del candidato, no un umbral fijo. */
function mediana(valores: number[]): number {
  if (!valores.length) return 0;
  const s = [...valores].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Tags de tecnología de un proyecto (mismo separador que cv-plantilla-preview.stackTags). */
function parseStackTagsProyecto(stack: string | null | undefined): string[] {
  return (stack ?? '')
    .split(/[,;]/)
    .map(t => t.trim())
    .filter(Boolean);
}

/** Ranking de tecnologías por cantidad de proyectos donde aparecen -- no depende de
 * fechas/duración, así que incluye TODOS los proyectos con stack declarado (a diferencia
 * de un cruce por tiempo, que descartaría los que no tienen duración en meses). */
export function buildTecnologiasProyectos(proyectos: ProyectoPublicoDto[]): TecnologiaProyectoRow[] {
  const map = new Map<string, { etiqueta: string; proyectos: Set<string> }>();
  for (const p of proyectos ?? []) {
    const tags = parseStackTagsProyecto(p.stackTecnologico);
    if (!tags.length) continue;
    const nombreProyecto = (p.nombreProyecto ?? '').trim() || `Proyecto ${p.proyectoId}`;
    for (const tag of tags) {
      const key = tag.toLowerCase();
      const current = map.get(key) ?? { etiqueta: tag, proyectos: new Set<string>() };
      current.proyectos.add(nombreProyecto);
      map.set(key, current);
    }
  }
  return [...map.values()]
    .map(v => ({
      etiqueta: v.etiqueta,
      cantidadProyectos: v.proyectos.size,
      proyectos: [...v.proyectos],
    }))
    .sort((a, b) => b.cantidadProyectos - a.cantidadProyectos || a.etiqueta.localeCompare(b.etiqueta, 'es'));
}

/** Para la dona: top N tecnologías + un pedazo "Otras" agregando el resto -- evita una
 * dona con demasiados pedazos finos. `rows` ya viene ordenado desc por cantidadProyectos
 * (ver buildTecnologiasProyectos). */
export function buildTecnologiasProyectosDona(rows: TecnologiaProyectoRow[], maxRows: number): TecnologiaProyectoRow[] {
  const top = rows.slice(0, maxRows);
  const resto = rows.slice(maxRows);
  if (!resto.length) return top;
  const proyectosOtras = new Set<string>();
  resto.forEach(r => r.proyectos.forEach(p => proyectosOtras.add(p)));
  return [
    ...top,
    {
      etiqueta: `Otras (${resto.length})`,
      cantidadProyectos: resto.reduce((s, r) => s + r.cantidadProyectos, 0),
      proyectos: [...proyectosOtras],
      esOtras: true,
    },
  ];
}

function buildNivelPromedioPorTipo(habs: HabilidadPublicoDto[]): { tipo: string; promedio: number }[] {
  const sum = new Map<string, { n: number; c: number }>();
  for (const h of habs) {
    const tipo = (h.tipo ?? '').trim() || 'Sin categoría';
    const nv = nivelHabilidadANumero(h.nivel);
    if (nv === null) continue;
    const cur = sum.get(tipo) ?? { n: 0, c: 0 };
    cur.n += nv;
    cur.c += 1;
    sum.set(tipo, cur);
  }
  return [...sum.entries()]
    .filter(([, v]) => v.c > 0)
    .map(([tipo, v]) => ({ tipo, promedio: v.n / v.c }))
    .sort((a, b) => b.promedio - a.promedio);
}

export function normalizarNivelHabilidad(nivel: string | null | undefined): 'basico' | 'intermedio' | 'avanzado' | 'experto' | null {
  if (!nivel?.trim()) return null;
  const t = nivel.trim().toLowerCase();
  if (t.includes('bás') || t.includes('basic')) return 'basico';
  if (t.includes('intermedio')) return 'intermedio';
  if (t.includes('avanz')) return 'avanzado';
  if (t.includes('expert')) return 'experto';
  return null;
}

export function contieneAlguno(texto: string, keywords: string[]): boolean {
  return keywords.some(keyword => texto.includes(keyword));
}

export function clasificarGrupoHabilidad(habilidad: HabilidadPublicoDto): string {
  const tipo = (habilidad.tipo ?? '').trim().toLowerCase();
  const texto = [habilidad.nombre, habilidad.descripcion, habilidad.tipo]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (tipo === 'idioma' || contieneAlguno(texto, ['ingles', 'inglés', 'spanish', 'español', 'portugues', 'portugués', 'frances', 'francés'])) {
    return 'Idiomas';
  }

  if (
    tipo === 'blanda' &&
    contieneAlguno(texto, ['liderazgo', 'gestión de equipos', 'gestion de equipos', 'toma de decisiones', 'delegación', 'delegacion'])
  ) {
    return 'Liderazgo y Gestión';
  }

  if (
    tipo === 'blanda' &&
    contieneAlguno(texto, ['pensamiento analítico', 'pensamiento analitico', 'resolución de problemas', 'resolucion de problemas', 'pensamiento crítico', 'pensamiento critico'])
  ) {
    return 'Pensamiento Analítico';
  }

  if (
    tipo === 'blanda' &&
    contieneAlguno(texto, ['comunicación', 'comunicacion', 'stakeholder', 'negociación', 'negociacion', 'empatía', 'empatia'])
  ) {
    return 'Comunicación';
  }

  if (
    tipo === 'blanda' &&
    contieneAlguno(texto, ['adaptabilidad', 'mejora continua', 'aprendizaje continuo'])
  ) {
    return 'Adaptabilidad y Mejora';
  }

  if (
    tipo === 'blanda' &&
    contieneAlguno(texto, ['orientación a resultados', 'orientacion a resultados', 'planificación', 'planificacion', 'gestión del tiempo', 'gestion del tiempo'])
  ) {
    return 'Orientación a Resultados';
  }

  if (
    tipo === 'blanda' &&
    contieneAlguno(texto, ['integridad', 'ética', 'etica', 'responsabilidad'])
  ) {
    return 'Integridad y Ética';
  }

  if (tipo === 'blanda') {
    return 'Habilidades blandas';
  }

  if (
    contieneAlguno(texto, ['togaf', 'archimate', 'mrae', 'uml', 'enterprise architect', 'archi', 'draw.io', 'drawio', 'arquitectura', 'modelado'])
  ) {
    return 'Arquitectura y Modelado';
  }

  if (
    contieneAlguno(texto, ['google cloud', 'gcp', 'aws', 'azure devops', 'docker', 'kubernetes', 'gitlab', 'github', 'devops', 'terraform', 'jenkins'])
  ) {
    return 'Cloud y DevOps';
  }

  if (
    contieneAlguno(texto, ['java', '.net', 'c#', 'php', 'python', 'typescript', 'angular', 'react', 'vue', 'javascript', 'desarrollo'])
  ) {
    return 'Desarrollo de Software';
  }

  if (
    contieneAlguno(texto, ['jira', 'postman', 'soapui', 'sonarqube', 'figma', 'testing', 'qa', 'pruebas', 'swagger'])
  ) {
    return 'Gestión y Testing';
  }

  if (
    contieneAlguno(texto, ['ssis', 'odi', 'airflow', 'data lakehouse', 'delta lake', 'wso2', 'etl', 'integración', 'integracion', 'sql server', 'postgresql', 'mysql', 'mongodb', 'data warehouse'])
  ) {
    return 'Datos e Integración';
  }

  if (
    contieneAlguno(texto, ['scikit-learn', 'mlflow', 'power bi', 'power automate', 'machine learning', 'analítica', 'analitica', 'automatización', 'automatizacion', 'bi'])
  ) {
    return 'IA, Analítica y Automatización';
  }

  if (tipo === 'tecnica') {
    return 'Otras habilidades técnicas';
  }

  return 'Otros';
}

export function buildHabilidadNivelSerie(habs: HabilidadPublicoDto[]): HabilidadNivelSerie {
  const map = new Map<string, { basico: number; intermedio: number; avanzado: number; experto: number; total: number }>();
  for (const habilidad of habs ?? []) {
    const tipo = clasificarGrupoHabilidad(habilidad);
    const nivel = normalizarNivelHabilidad(habilidad.nivel);
    if (!nivel) continue;
    const current = map.get(tipo) ?? { basico: 0, intermedio: 0, avanzado: 0, experto: 0, total: 0 };
    current[nivel] += 1;
    current.total += 1;
    map.set(tipo, current);
  }

  const rows = [...map.entries()]
    .sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0], 'es'));

  return {
    labels: rows.map(([tipo]) => tipo),
    basico: rows.map(([, v]) => v.basico),
    intermedio: rows.map(([, v]) => v.intermedio),
    avanzado: rows.map(([, v]) => v.avanzado),
    experto: rows.map(([, v]) => v.experto),
  };
}

export function buildHabilidadStrategicPoints(habs: HabilidadPublicoDto[]): HabilidadStrategicPoint[] {
  const map = new Map<
    string,
    { basico: number; intermedio: number; avanzado: number; experto: number; total: number; sumaMadurez: number }
  >();

  for (const habilidad of habs ?? []) {
    const grupo = clasificarGrupoHabilidad(habilidad);
    const nivel = normalizarNivelHabilidad(habilidad.nivel);
    if (!nivel) continue;

    const valorMadurez =
      nivel === 'basico' ? 1 : nivel === 'intermedio' ? 2 : nivel === 'avanzado' ? 3 : 4;
    const current = map.get(grupo) ?? {
      basico: 0,
      intermedio: 0,
      avanzado: 0,
      experto: 0,
      total: 0,
      sumaMadurez: 0,
    };

    current[nivel] += 1;
    current.total += 1;
    current.sumaMadurez += valorMadurez;
    map.set(grupo, current);
  }

  return [...map.entries()]
    .map(([grupo, value]) => ({
      grupo,
      total: value.total,
      madurezPromedio: value.total > 0 ? Math.round((value.sumaMadurez / value.total) * 10) / 10 : 0,
      basico: value.basico,
      intermedio: value.intermedio,
      avanzado: value.avanzado,
      experto: value.experto,
    }))
    .sort((a, b) => b.total - a.total || b.madurezPromedio - a.madurezPromedio || a.grupo.localeCompare(b.grupo, 'es'));
}

@Component({
  selector: 'app-dashboard-candidato',
  standalone: false,
  templateUrl: './dashboard-candidato.component.html',
})
export class DashboardCandidatoComponent implements OnInit, OnDestroy {
  private readonly shellCtx = inject(CvDetalleVistaContext);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  @ViewChild('cvDashChartExp') private chartExpEl?: ElementRef<HTMLCanvasElement>;
  @ViewChild('cvDashChartTimeline') private chartTimelineEl?: ElementRef<HTMLCanvasElement>;
  @ViewChild('cvDashChartProyectos') private chartProyectosEl?: ElementRef<HTMLCanvasElement>;
  @ViewChild('cvDashChartRadar') private chartRadarEl?: ElementRef<HTMLCanvasElement>;

  metricas: MetricaCard[] = [];
  expEmpresas: ExpEmpresa[] = [];
  timelineYearSeries: TimelineYearSeries = { labels: [], edu: [], exp: [] };
  educacionTipoSeries: EducacionTipoSeries = { labels: [], values: [] };
  tecnologiasProyectos: TecnologiaProyectoRow[] = [];
  /** Total de registros de proyecto en el CV (aunque no tengan stack declarado). */
  proyectosRawCount = 0;
  nivelPromedio: { tipo: string; promedio: number }[] = [];
  habilidadNivelSerie: HabilidadNivelSerie = { labels: [], basico: [], intermedio: [], avanzado: [], experto: [] };
  habilidadStrategicPoints: HabilidadStrategicPoint[] = [];
  completitud = 0;
  chartExpHeightPx = 260;
  chartProyectosHeightPx = 320;
  chartHabilidadesHeightPx = 300;
  readonly habilidadStrategicMaxRows = 8;
  readonly tecnologiasProyectosMaxRows = 8;

  /** Calculados UNA vez en rellenarDesdeCv() (no getters): un getter que arma un array
   * nuevo en cada acceso, ligado directo a un *ngFor, hace que Angular vea un valor
   * distinto entre sus dos pasadas de verificación en modo desarrollo y lance
   * ExpressionChangedAfterItHasBeenCheckedError -- eso corta el change detection antes
   * de llegar a scheduleRenderCharts() y ninguna gráfica se dibuja. */
  habilidadStrategicPointsVisible: HabilidadStrategicPoint[] = [];
  tecnologiasProyectosVisible: TecnologiaProyectoRow[] = [];

  /** En CV público: según visibilidad; en área privada siempre true. */
  mostrarMetricas = true;
  mostrarGraficas = true;

  /** Panel de vista previa en Configuración: respeta los switches de visibilidad igual
   * que el CV público real, pero sin el redirect si el dashboard completo queda oculto
   * (no tiene sentido navegar fuera de Configuración). */
  @Input() modoVistaPrevia = false;

  /** Chart.js tipa cada chart por tipo; guardamos solo instancias con destroy(). */
  private chartInstances: { destroy(): void }[] = [];

  ngOnInit(): void {
    const detalle = this.shellCtx.cv;
    if (!detalle) return;

    if (this.modoVistaPrevia) {
      this.mostrarMetricas = detalle.dashboardMostrarMetricas ?? true;
      this.mostrarGraficas = detalle.dashboardMostrarGraficas ?? true;
    } else if (this.esRutaCvPublicoDashboard()) {
      if (!cvPublicoMuestraPestanaDashboard(detalle)) {
        const slug = this.slugCvPublicoDesdeUrl();
        if (slug) {
          void this.router.navigate(['/cv', slug], { replaceUrl: true });
        }
        return;
      }
      this.mostrarMetricas = detalle.dashboardMostrarMetricas ?? true;
      this.mostrarGraficas = detalle.dashboardMostrarGraficas ?? true;
    } else {
      this.mostrarMetricas = true;
      this.mostrarGraficas = true;
    }

    this.rellenarDesdeCv(detalle);
    this.cdr.detectChanges();
    this.scheduleRenderCharts();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  /** Tras *ngIf y ViewChild, Chart.js necesita DOM ya pintado (CD + siguiente frame). */
  private scheduleRenderCharts(): void {
    if (!this.mostrarGraficas) return;
    requestAnimationFrame(() => {
      this.renderCharts();
      requestAnimationFrame(() => {
        for (const c of this.chartInstances) {
          const ch = c as { resize?: () => void };
          ch.resize?.();
        }
      });
    });
  }

  private rellenarDesdeCv(cv: CvDetalleDto): void {
    this.destroyCharts();
    this.metricas = this.mostrarMetricas ? buildMetricas(cv) : [];
    this.completitud = completitudAproximada(cv);
    if (this.mostrarGraficas) {
      this.expEmpresas = buildExpPorEmpresa(cv.experiencias ?? []);
      this.timelineYearSeries = buildTimelineYearSeries(cv);
      this.educacionTipoSeries = buildEducacionTipoSeries(cv.formaciones ?? []);
      this.proyectosRawCount = cv.proyectos?.length ?? 0;
      this.tecnologiasProyectos = buildTecnologiasProyectos(cv.proyectos ?? []);
      this.tecnologiasProyectosVisible = buildTecnologiasProyectosDona(this.tecnologiasProyectos, this.tecnologiasProyectosMaxRows);
      this.nivelPromedio = buildNivelPromedioPorTipo(cv.habilidades ?? []);
      this.habilidadNivelSerie = buildHabilidadNivelSerie(cv.habilidades ?? []);
      this.habilidadStrategicPoints = buildHabilidadStrategicPoints(cv.habilidades ?? []);
      this.habilidadStrategicPointsVisible = this.habilidadStrategicPoints.slice(0, this.habilidadStrategicMaxRows);
      this.chartExpHeightPx = Math.min(420, Math.max(200, this.expEmpresas.length * 40 + 80));
      this.chartProyectosHeightPx = 320;
      this.chartHabilidadesHeightPx = 360;
    } else {
      this.expEmpresas = [];
      this.timelineYearSeries = { labels: [], edu: [], exp: [] };
      this.educacionTipoSeries = { labels: [], values: [] };
      this.proyectosRawCount = cv.proyectos?.length ?? 0;
      this.tecnologiasProyectos = [];
      this.tecnologiasProyectosVisible = [];
      this.nivelPromedio = [];
      this.habilidadNivelSerie = { labels: [], basico: [], intermedio: [], avanzado: [], experto: [] };
      this.habilidadStrategicPoints = [];
      this.habilidadStrategicPointsVisible = [];
      this.chartExpHeightPx = 260;
      this.chartProyectosHeightPx = 320;
      this.chartHabilidadesHeightPx = 300;
    }
  }

  private esRutaCvPublicoDashboard(): boolean {
    const u = this.router.url;
    return /\/cv\/[^/]+\/dashboard(?:[/?#]|$)/.test(u);
  }

  private slugCvPublicoDesdeUrl(): string | null {
    const m = this.router.url.match(/\/cv\/([^/?#]+)\/dashboard(?:[/?#]|$)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  private destroyCharts(): void {
    for (const c of this.chartInstances) {
      c.destroy();
    }
    this.chartInstances = [];
  }

  private renderCharts(): void {
    this.destroyCharts();
    if (!this.shellCtx.cv) return;

    const exp = this.chartExpEl?.nativeElement;
    if (this.expEmpresas.length && exp) {
      const ctx = exp.getContext('2d');
      if (ctx) {
        try {
          this.chartInstances.push(
            new Chart(ctx, {
              type: 'bar',
              data: {
                labels: this.expEmpresas.map(e => e.empresa),
                datasets: [
                  {
                    label: 'Meses',
                    data: this.expEmpresas.map(e => e.meses),
                    backgroundColor: CHART_COLOR_BARRAS,
                    borderRadius: 4,
                    borderSkipped: false,
                  },
                ],
              },
              options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    grid: { color: '#f0f0f0' },
                    ticks: { callback: v => `${v}m` },
                  },
                  y: { grid: { display: false } },
                },
              },
            })
          );
        } catch (err) {
          console.error('[dashboard-candidato] Error renderizando "Experiencia laboral por empresa":', err);
        }
      }
    }

    const tl = this.chartTimelineEl?.nativeElement;
    if (this.educacionTipoSeries.labels.length && tl) {
      const ctx = tl.getContext('2d');
      if (ctx) {
        try {
          this.chartInstances.push(
            new Chart(ctx, {
              type: 'bar',
              data: {
                labels: this.educacionTipoSeries.labels,
                datasets: [
                  {
                    label: 'Formaciones',
                    data: this.educacionTipoSeries.values,
                    backgroundColor: CHART_COLOR_VERDE,
                    borderRadius: 2,
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { font: { size: 10 }, maxRotation: 35, minRotation: 0 },
                  },
                  y: {
                    grid: { color: '#f0f0f0' },
                    beginAtZero: true,
                    ticks: { precision: 0 },
                  },
                },
              },
            })
          );
        } catch (err) {
          console.error('[dashboard-candidato] Error renderizando "Educación por tipo de formación":', err);
        }
      }
    }

    const pr = this.chartProyectosEl?.nativeElement;
    const tecnologias = this.tecnologiasProyectosVisible;
    if (tecnologias.length && pr) {
      const ctx = pr.getContext('2d');
      if (ctx) {
       try {
        const centerTextPlugin: Plugin<'doughnut'> = {
          id: 'cvTecnologiasCenterText',
          afterDraw: chart => {
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return;
            const cx = (chartArea.left + chartArea.right) / 2;
            const cy = (chartArea.top + chartArea.bottom) / 2;
            c.save();
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillStyle = '#212529';
            c.font = "700 22px system-ui, -apple-system, 'Segoe UI', sans-serif";
            c.fillText(String(this.proyectosRawCount), cx, cy - 9);
            c.fillStyle = '#6c757d';
            c.font = "600 11px system-ui, -apple-system, 'Segoe UI', sans-serif";
            c.fillText(this.proyectosRawCount === 1 ? 'proyecto' : 'proyectos', cx, cy + 13);
            c.restore();
          },
        };
        this.chartInstances.push(
          new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: tecnologias.map(t => t.etiqueta),
              datasets: [
                {
                  data: tecnologias.map(t => t.cantidadProyectos),
                  backgroundColor: tecnologias.map((t, i) => this.getTecnologiaColor(t, i)),
                  borderColor: '#fff',
                  borderWidth: 3,
                  borderRadius: 6,
                  spacing: 2,
                  hoverOffset: 8,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '68%',
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: 'rgba(17, 24, 39, 0.92)',
                  padding: 10,
                  cornerRadius: 8,
                  boxPadding: 4,
                  titleFont: { weight: 600 },
                  callbacks: {
                    title: items => {
                      const i = items[0]?.dataIndex ?? 0;
                      return tecnologias[i]?.etiqueta ?? '';
                    },
                    label: item => {
                      const t = tecnologias[item.dataIndex];
                      if (!t) return '';
                      return `${t.cantidadProyectos} proyecto${t.cantidadProyectos === 1 ? '' : 's'}`;
                    },
                    afterLabel: item => {
                      const t = tecnologias[item.dataIndex];
                      if (!t) return '';
                      return truncarEtiquetaGrafico(t.proyectos.join(', '), 90);
                    },
                  },
                },
              },
            },
            plugins: [centerTextPlugin],
          })
        );
       } catch (err) {
         console.error('[dashboard-candidato] Error renderizando "Tecnologías más usadas en proyectos":', err);
       }
      }
    }

    const radar = this.chartRadarEl?.nativeElement;
    const puntos = this.habilidadStrategicPointsVisible;
    if (puntos.length && radar) {
      const ctx = radar.getContext('2d');
      if (ctx) {
       try {
        const xs = puntos.map(p => p.total);
        const ys = puntos.map(p => p.madurezPromedio);
        const medianaX = mediana(xs);
        const medianaY = mediana(ys);
        const maxX = Math.max(...xs);

        const quadrantPlugin: Plugin<'scatter'> = {
          id: 'cvCapacidadesCuadrantes',
          beforeDatasetsDraw: chart => {
            const { ctx: c, chartArea, scales } = chart;
            if (!chartArea) return;
            const xPix = scales['x'].getPixelForValue(medianaX);
            const yPix = scales['y'].getPixelForValue(medianaY);
            c.save();
            c.fillStyle = 'rgba(37, 99, 235, 0.07)';
            c.fillRect(xPix, chartArea.top, chartArea.right - xPix, yPix - chartArea.top);
            c.fillStyle = 'rgba(107, 114, 128, 0.05)';
            c.fillRect(chartArea.left, chartArea.top, xPix - chartArea.left, yPix - chartArea.top);
            c.fillRect(xPix, yPix, chartArea.right - xPix, chartArea.bottom - yPix);
            c.fillStyle = 'rgba(239, 68, 68, 0.06)';
            c.fillRect(chartArea.left, yPix, xPix - chartArea.left, chartArea.bottom - yPix);

            c.strokeStyle = '#d1d5db';
            c.setLineDash([4, 4]);
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(xPix, chartArea.top);
            c.lineTo(xPix, chartArea.bottom);
            c.moveTo(chartArea.left, yPix);
            c.lineTo(chartArea.right, yPix);
            c.stroke();
            c.setLineDash([]);

            c.font = "700 9px system-ui, -apple-system, 'Segoe UI', sans-serif";
            c.fillStyle = '#9ca3af';
            c.textBaseline = 'top';
            c.textAlign = 'right';
            c.fillText('FORTALEZAS NÚCLEO', chartArea.right - 6, chartArea.top + 6);
            c.textAlign = 'left';
            c.fillText('NICHO PROFUNDO', chartArea.left + 6, chartArea.top + 6);
            c.textBaseline = 'bottom';
            c.textAlign = 'right';
            c.fillText('AMPLIO, POR PROFUNDIZAR', chartArea.right - 6, chartArea.bottom - 6);
            c.textAlign = 'left';
            c.fillText('POR DESARROLLAR', chartArea.left + 6, chartArea.bottom - 6);
            c.restore();
          },
          afterDatasetsDraw: chart => {
            const { ctx: c } = chart;
            const meta = chart.getDatasetMeta(0);
            c.save();
            c.font = "600 11px system-ui, -apple-system, 'Segoe UI', sans-serif";
            c.fillStyle = '#374151';
            c.textBaseline = 'middle';
            c.textAlign = 'left';
            meta.data.forEach((el, i) => {
              const p = puntos[i];
              if (!p) return;
              const pos = el as unknown as { x: number; y: number };
              c.fillText(truncarEtiquetaGrafico(p.grupo, 20), pos.x + 9, pos.y);
            });
            c.restore();
          },
        };

        this.chartInstances.push(
          new Chart(ctx, {
            type: 'scatter',
            data: {
              datasets: [
                {
                  data: puntos.map(p => ({ x: p.total, y: p.madurezPromedio })),
                  backgroundColor: puntos.map((_, i) => CHART_HABILIDADES_COLORS[i % CHART_HABILIDADES_COLORS.length]),
                  borderColor: '#ffffff',
                  borderWidth: 2,
                  pointRadius: 7,
                  pointHoverRadius: 9,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              layout: { padding: { right: 90, top: 18, bottom: 6 } },
              scales: {
                x: {
                  beginAtZero: true,
                  suggestedMax: maxX + 1,
                  title: { display: true, text: 'Cobertura (cantidad de habilidades)' },
                  ticks: { stepSize: 1, font: { size: 10 } },
                  grid: { color: '#eef0f4' },
                },
                y: {
                  min: 0.5,
                  max: 4.5,
                  title: { display: true, text: 'Madurez promedio' },
                  ticks: {
                    stepSize: 1,
                    callback: value => {
                      if (value === 1) return 'Básico';
                      if (value === 2) return 'Intermedio';
                      if (value === 3) return 'Avanzado';
                      if (value === 4) return 'Experto';
                      return '';
                    },
                  },
                  grid: { color: '#eef0f4' },
                },
              },
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  backgroundColor: 'rgba(17, 24, 39, 0.92)',
                  padding: 10,
                  cornerRadius: 8,
                  boxPadding: 4,
                  titleFont: { weight: 600 },
                  callbacks: {
                    title: items => {
                      const i = items[0]?.dataIndex ?? 0;
                      return puntos[i]?.grupo ?? '';
                    },
                    label: item => {
                      const punto = puntos[item.dataIndex];
                      if (!punto) return '';
                      return [
                        `Madurez promedio: ${punto.madurezPromedio}/4`,
                        `Cobertura: ${punto.total} habilidades`,
                        `Básico: ${punto.basico} · Intermedio: ${punto.intermedio}`,
                        `Avanzado: ${punto.avanzado} · Experto: ${punto.experto}`,
                      ];
                    },
                  },
                },
              },
            },
            plugins: [quadrantPlugin],
          })
        );
       } catch (err) {
         console.error('[dashboard-candidato] Error renderizando "Mapa estratégico de capacidades":', err);
       }
      }
    }
  }

  getHabilidadColor(index: number): string {
    return CHART_HABILIDADES_COLORS[index % CHART_HABILIDADES_COLORS.length];
  }

  getTecnologiaColor(t: TecnologiaProyectoRow, index: number): string {
    return t.esOtras ? CHART_OTRAS_COLOR : CHART_HABILIDADES_COLORS[index % CHART_HABILIDADES_COLORS.length];
  }
}
