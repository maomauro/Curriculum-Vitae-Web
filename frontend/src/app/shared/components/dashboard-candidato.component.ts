import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';
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

interface ProyectoChartRow {
  etiqueta: string;
  nombreLargo: string;
  meses: number;
  /** % del total de meses entre proyectos con duración (dona). */
  porcentajeTiempo: number;
  rol: string | null;
  equipoTamano: number | null;
}

/** Paleta prototipo dashboard-candidato.html */
const CHART_COLOR_VERDE = '#6EE7B7';
const CHART_COLOR_BARRAS = '#7C6FCD';
/** Dona participación proyectos: colores alternados (naranja portal + paleta suave) */
const CHART_PROYECTOS_DONA_COLORS = [
  'rgba(253, 126, 20, 0.88)',
  '#7C6FCD',
  '#6EE7B7',
  '#818CF8',
  '#f472b6',
  '#22c55e',
  '#0ea5e9',
  '#eab308',
];
const CHART_HABILIDADES_BUBBLE_COLORS = [
  'rgba(37, 99, 235, 0.78)',
  'rgba(14, 165, 233, 0.78)',
  'rgba(34, 197, 94, 0.78)',
  'rgba(124, 111, 205, 0.78)',
  'rgba(253, 126, 20, 0.82)',
  'rgba(236, 72, 153, 0.78)',
  'rgba(234, 179, 8, 0.82)',
  'rgba(99, 102, 241, 0.78)',
];
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

function buildExpPorEmpresa(experiencias: ExperienciaPublicoDto[]): ExpEmpresa[] {
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

function normalizarTipoFormacion(tipo: string | null | undefined): string {
  const value = (tipo ?? '').trim();
  return value || 'Sin tipo';
}

function buildEducacionTipoSeries(formaciones: FormacionPublicoDto[]): EducacionTipoSeries {
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

/** Proyectos con meses > 0, ordenados; % respecto al total de meses-proyecto (dona participación). */
function buildProyectosParticipacionPorTiempo(proyectos: ProyectoPublicoDto[]): ProyectoChartRow[] {
  const base = (proyectos ?? []).map(p => {
    const nombreLargo = (p.nombreProyecto ?? '').trim() || `Proyecto ${p.proyectoId}`;
    const meses = p.duracionMeses != null && p.duracionMeses >= 0 ? p.duracionMeses : 0;
    return {
      etiqueta: truncarEtiquetaGrafico(nombreLargo, 36),
      nombreLargo,
      meses,
      porcentajeTiempo: 0,
      rol: (p.rol ?? '').trim() || null,
      equipoTamano: p.equipoTamano,
    };
  });
  const conMeses = base.filter(r => r.meses > 0);
  const total = conMeses.reduce((s, r) => s + r.meses, 0);
  if (total <= 0) return [];
  return conMeses
    .sort((a, b) => b.meses - a.meses)
    .map(r => ({
      ...r,
      porcentajeTiempo: Math.round((1000 * r.meses) / total) / 10,
    }));
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

function normalizarNivelHabilidad(nivel: string | null | undefined): 'basico' | 'intermedio' | 'avanzado' | 'experto' | null {
  if (!nivel?.trim()) return null;
  const t = nivel.trim().toLowerCase();
  if (t.includes('bás') || t.includes('basic')) return 'basico';
  if (t.includes('intermedio')) return 'intermedio';
  if (t.includes('avanz')) return 'avanzado';
  if (t.includes('expert')) return 'experto';
  return null;
}

function contieneAlguno(texto: string, keywords: string[]): boolean {
  return keywords.some(keyword => texto.includes(keyword));
}

function clasificarGrupoHabilidad(habilidad: HabilidadPublicoDto): string {
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

function buildHabilidadNivelSerie(habs: HabilidadPublicoDto[]): HabilidadNivelSerie {
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

function buildHabilidadStrategicPoints(habs: HabilidadPublicoDto[]): HabilidadStrategicPoint[] {
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
  template: `
        <div class="cv-page-header-card">
          <div class="cv-ph-icon" aria-hidden="true">
            <i class="bi bi-bar-chart-steps"></i>
          </div>
          <div>
            <h5 class="fw-bold mb-0">Dashboard de Hoja de Vida</h5>
            <p class="text-muted mb-0 cv-analytics-lead">
              Visualiza y analiza la información personal, profesional y académica.<span *ngIf="completitud > 0">
                · Completitud aproximada {{ completitud }}%.</span>
            </p>
          </div>
        </div>

        <div class="cv-metricas-grid mb-4" *ngIf="mostrarMetricas && metricas.length">
          <div *ngFor="let m of metricas" class="min-w-0">
            <div class="cv-dash-metric-card" [style.background]="m.gradiente">
              <div class="d-flex justify-content-between align-items-start">
                <div class="min-w-0 pe-2">
                  <div class="mc-label">{{ m.label }}</div>
                  <div class="mc-value">{{ m.valor }}</div>
                  <div class="mc-sub">{{ m.sub }}</div>
                </div>
                <i class="bi mc-icon flex-shrink-0" [ngClass]="m.icono"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-3 mb-4" *ngIf="mostrarGraficas">
          <div class="col-lg-6">
            <div class="cv-chart-card">
              <div class="cv-ct-title">Experiencia laboral por empresa</div>
              <div class="cv-ct-subtitle">Duración aproximada en meses por empleador.</div>
              <p *ngIf="!expEmpresas.length" class="text-muted small mb-0">No hay experiencias con fechas para graficar.</p>
              <div
                *ngIf="expEmpresas.length"
                class="cv-chart-canvas-h"
                [style.height.px]="chartExpHeightPx">
                <canvas #cvDashChartExp></canvas>
              </div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="cv-chart-card">
              <div class="cv-ct-title">Educación por tipo de formación</div>
              <div class="cv-ct-subtitle">Cantidad de registros académicos agrupados por categoría.</div>
              <p *ngIf="!educacionTipoSeries.labels.length" class="text-muted small mb-0">No hay formaciones registradas para graficar.</p>
              <div *ngIf="educacionTipoSeries.labels.length" class="cv-chart-canvas-timeline">
                <canvas #cvDashChartTimeline></canvas>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-3 mb-5" *ngIf="mostrarGraficas">
          <div class="col-lg-6">
            <div class="cv-chart-card">
              <div class="cv-ct-title">Participación por tiempo (proyectos)</div>
              <div class="cv-ct-subtitle">
                Porcentaje de los meses totales dedicados a cada proyecto (solo proyectos con duración declarada).
              </div>
              <p *ngIf="proyectosRawCount === 0" class="text-muted small mb-0">No hay proyectos en este CV.</p>
              <p *ngIf="proyectosRawCount > 0 && !proyectosChart.length" class="text-muted small mb-0">
                Los proyectos no tienen duración en meses; no se puede calcular la participación.
              </p>
              <div *ngIf="proyectosChart.length" class="cv-chart-canvas-dona" [style.height.px]="chartProyectosHeightPx">
                <canvas #cvDashChartProyectos></canvas>
              </div>
              <div *ngIf="proyectosChart.length" class="mt-3 d-grid gap-2">
                <div
                  *ngFor="let proyecto of proyectosChart; let i = index"
                  class="d-flex align-items-start gap-2 small min-w-0">
                  <span
                    class="rounded-circle flex-shrink-0 mt-1"
                    [style.background-color]="getProyectoColor(i)"
                    style="width:12px;height:12px;"></span>
                  <div class="min-w-0 flex-grow-1">
                    <div class="fw-semibold text-break">{{ proyecto.nombreLargo }}</div>
                    <div class="text-muted">{{ proyecto.porcentajeTiempo }}% · {{ proyecto.meses }} meses</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="cv-chart-card">
              <div class="cv-ct-title">Mapa estratégico de capacidades</div>
              <div class="cv-ct-subtitle">Cada grupo combina cobertura total y madurez promedio declarada.</div>
              <p *ngIf="!habilidadStrategicPoints.length" class="text-muted small mb-0">No hay niveles categorizados para mapear.</p>
              <div *ngIf="habilidadStrategicPoints.length" class="cv-chart-canvas-radar" [style.height.px]="chartHabilidadesHeightPx">
                <canvas #cvDashChartRadar></canvas>
              </div>
              <div *ngIf="habilidadStrategicPoints.length" class="mt-3 row g-2">
                <div *ngFor="let p of habilidadStrategicPointsVisible" class="col-12 col-xl-6">
                  <div class="d-flex justify-content-between gap-3 small border-top pt-2">
                    <div class="fw-semibold text-break">{{ p.grupo }}</div>
                    <div class="text-muted text-end text-nowrap">{{ p.total }} hab. · {{ p.madurezPromedio }}/4</div>
                  </div>
                </div>
              </div>
              <div *ngIf="habilidadStrategicPoints.length > habilidadStrategicMaxRows" class="small text-muted mt-2">
                Mostrando {{ habilidadStrategicMaxRows }} de {{ habilidadStrategicPoints.length }} grupos.
              </div>
            </div>
          </div>
        </div>
  `,
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
  proyectosChart: ProyectoChartRow[] = [];
  /** Total de registros de proyecto en el CV (aunque no tengan meses). */
  proyectosRawCount = 0;
  nivelPromedio: { tipo: string; promedio: number }[] = [];
  habilidadNivelSerie: HabilidadNivelSerie = { labels: [], basico: [], intermedio: [], avanzado: [], experto: [] };
  habilidadStrategicPoints: HabilidadStrategicPoint[] = [];
  completitud = 0;
  chartExpHeightPx = 260;
  chartProyectosHeightPx = 320;
  chartHabilidadesHeightPx = 300;
  readonly habilidadStrategicMaxRows = 8;

  get habilidadStrategicPointsVisible(): HabilidadStrategicPoint[] {
    return this.habilidadStrategicPoints.slice(0, this.habilidadStrategicMaxRows);
  }

  /** En CV público: según visibilidad; en área privada siempre true. */
  mostrarMetricas = true;
  mostrarGraficas = true;

  /** Chart.js tipa cada chart por tipo; guardamos solo instancias con destroy(). */
  private chartInstances: { destroy(): void }[] = [];

  ngOnInit(): void {
    const detalle = this.shellCtx.cv;
    if (!detalle) return;

    if (this.esRutaCvPublicoDashboard()) {
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
      this.proyectosChart = buildProyectosParticipacionPorTiempo(cv.proyectos ?? []);
      this.nivelPromedio = buildNivelPromedioPorTipo(cv.habilidades ?? []);
      this.habilidadNivelSerie = buildHabilidadNivelSerie(cv.habilidades ?? []);
      this.habilidadStrategicPoints = buildHabilidadStrategicPoints(cv.habilidades ?? []);
      this.chartExpHeightPx = Math.min(420, Math.max(200, this.expEmpresas.length * 40 + 80));
      this.chartProyectosHeightPx = Math.min(380, Math.max(260, this.proyectosChart.length > 4 ? 300 : 260));
      this.chartHabilidadesHeightPx = Math.min(440, Math.max(280, this.habilidadStrategicPoints.length * 28 + 120));
    } else {
      this.expEmpresas = [];
      this.timelineYearSeries = { labels: [], edu: [], exp: [] };
      this.educacionTipoSeries = { labels: [], values: [] };
      this.proyectosRawCount = cv.proyectos?.length ?? 0;
      this.proyectosChart = [];
      this.nivelPromedio = [];
      this.habilidadNivelSerie = { labels: [], basico: [], intermedio: [], avanzado: [], experto: [] };
      this.habilidadStrategicPoints = [];
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
      }
    }

    const tl = this.chartTimelineEl?.nativeElement;
    if (this.educacionTipoSeries.labels.length && tl) {
      const ctx = tl.getContext('2d');
      if (ctx) {
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
      }
    }

    const pr = this.chartProyectosEl?.nativeElement;
    if (this.proyectosChart.length && pr) {
      const ctx = pr.getContext('2d');
      if (ctx) {
        const rows = this.proyectosChart;
        this.chartInstances.push(
          new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: rows.map(r => r.etiqueta),
              datasets: [
                {
                  data: rows.map(r => r.meses),
                  backgroundColor: rows.map(
                    (_, i) => CHART_PROYECTOS_DONA_COLORS[i % CHART_PROYECTOS_DONA_COLORS.length]
                  ),
                  borderColor: '#fff',
                  borderWidth: 2,
                  hoverOffset: 6,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '56%',
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  callbacks: {
                    title: items => {
                      const i = items[0]?.dataIndex ?? 0;
                      return rows[i]?.nombreLargo ?? '';
                    },
                    afterTitle: items => {
                      const i = items[0]?.dataIndex ?? 0;
                      const r = rows[i];
                      if (!r) return '';
                      const partes: string[] = [];
                      if (r.rol) partes.push(`Rol: ${r.rol}`);
                      if (r.equipoTamano != null) partes.push(`Equipo: ${r.equipoTamano} pers.`);
                      return partes.length ? partes.join('\n') : '';
                    },
                    label: item => {
                      const i = item.dataIndex;
                      const r = rows[i];
                      if (!r) return '';
                      return `${r.meses} meses · ${r.porcentajeTiempo}% del tiempo en proyectos`;
                    },
                  },
                },
              },
            },
          })
        );
      }
    }

    const radar = this.chartRadarEl?.nativeElement;
    if (this.habilidadStrategicPoints.length && radar) {
      const ctx = radar.getContext('2d');
      if (ctx) {
        const puntos = this.habilidadStrategicPoints;
        this.chartInstances.push(
          new Chart(ctx, {
            type: 'bubble',
            data: {
              datasets: puntos.map((punto, index) => ({
                label: punto.grupo,
                data: [
                  {
                    x: punto.total,
                    y: punto.madurezPromedio,
                    r: Math.max(8, Math.min(22, 6 + punto.total * 1.4)),
                  },
                ],
                backgroundColor: CHART_HABILIDADES_BUBBLE_COLORS[index % CHART_HABILIDADES_BUBBLE_COLORS.length],
                borderColor: '#ffffff',
                borderWidth: 2,
              })),
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Cobertura (cantidad de habilidades)',
                  },
                  ticks: {
                    stepSize: 1,
                    font: { size: 10 },
                  },
                  grid: { color: '#e5e7eb' },
                },
                y: {
                  min: 1,
                  max: 4,
                  title: {
                    display: true,
                    text: 'Madurez promedio',
                  },
                  ticks: {
                    stepSize: 1,
                    callback: value => {
                      if (value === 1) return 'Básico';
                      if (value === 2) return 'Intermedio';
                      if (value === 3) return 'Avanzado';
                      if (value === 4) return 'Experto';
                      return value;
                    },
                  },
                  grid: { color: '#e5e7eb' },
                },
              },
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  callbacks: {
                    title: items => items[0]?.dataset?.label ?? '',
                    label: item => {
                      const punto = puntos[item.datasetIndex];
                      if (!punto) return '';
                      return [
                        `Cobertura: ${punto.total} habilidades`,
                        `Madurez: ${punto.madurezPromedio}/4`,
                        `Básico: ${punto.basico} · Intermedio: ${punto.intermedio}`,
                        `Avanzado: ${punto.avanzado} · Experto: ${punto.experto}`,
                      ];
                    },
                  },
                },
              },
            },
          })
        );
      }
    }
  }

  getProyectoColor(index: number): string {
    return CHART_PROYECTOS_DONA_COLORS[index % CHART_PROYECTOS_DONA_COLORS.length];
  }
}
