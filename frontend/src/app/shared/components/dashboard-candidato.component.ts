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
const CHART_COLOR_PURPLE = '#818CF8';
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
  const map = new Map<string, number>();
  for (const e of experiencias) {
    const emp = (e.empresa ?? 'Sin empresa').trim() || 'Sin empresa';
    map.set(emp, (map.get(emp) ?? 0) + mesesExperiencia(e));
  }
  const rows = [...map.entries()]
    .map(([empresa, meses]) => ({ empresa, meses }))
    .filter(r => r.meses > 0)
    .sort((a, b) => b.meses - a.meses);
  const max = rows[0]?.meses ?? 1;
  return rows.map(r => ({
    ...r,
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
              <div class="cv-ct-title">Línea de tiempo: Educación y experiencia</div>
              <div class="cv-ct-subtitle">Eventos académicos y laborales por año.</div>
              <p *ngIf="!timelineYearSeries.labels.length" class="text-muted small mb-0">No hay fechas en formaciones ni experiencias.</p>
              <div *ngIf="timelineYearSeries.labels.length" class="cv-chart-canvas-timeline">
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
              <div *ngIf="proyectosChart.length" class="cv-chart-canvas-dona">
                <canvas #cvDashChartProyectos></canvas>
              </div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="cv-chart-card">
              <div class="cv-ct-title">Nivel promedio de habilidades por tipo</div>
              <div class="cv-ct-subtitle">Nivel promedio en cada categoría (1 = Básico → 4 = Experto).</div>
              <p *ngIf="!nivelPromedio.length" class="text-muted small mb-0">No hay niveles categorizados para promediar.</p>
              <div *ngIf="nivelPromedio.length" class="cv-chart-canvas-radar">
                <canvas #cvDashChartRadar></canvas>
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
  proyectosChart: ProyectoChartRow[] = [];
  /** Total de registros de proyecto en el CV (aunque no tengan meses). */
  proyectosRawCount = 0;
  nivelPromedio: { tipo: string; promedio: number }[] = [];
  completitud = 0;
  chartExpHeightPx = 260;

  /** En CV público: según visibilidad; en área privada siempre true. */
  mostrarMetricas = true;
  mostrarGraficas = true;

  /** Chart.js tipa cada chart por tipo; guardamos solo instancias con destroy(). */
  private chartInstances: Array<{ destroy(): void }> = [];

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
      this.proyectosRawCount = cv.proyectos?.length ?? 0;
      this.proyectosChart = buildProyectosParticipacionPorTiempo(cv.proyectos ?? []);
      this.nivelPromedio = buildNivelPromedioPorTipo(cv.habilidades ?? []);
      this.chartExpHeightPx = Math.min(420, Math.max(200, this.expEmpresas.length * 40 + 80));
    } else {
      this.expEmpresas = [];
      this.timelineYearSeries = { labels: [], edu: [], exp: [] };
      this.proyectosRawCount = cv.proyectos?.length ?? 0;
      this.proyectosChart = [];
      this.nivelPromedio = [];
      this.chartExpHeightPx = 260;
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
    if (this.timelineYearSeries.labels.length && tl) {
      const ctx = tl.getContext('2d');
      if (ctx) {
        this.chartInstances.push(
          new Chart(ctx, {
            type: 'bar',
            data: {
              labels: this.timelineYearSeries.labels,
              datasets: [
                {
                  label: 'Educación',
                  data: this.timelineYearSeries.edu,
                  backgroundColor: CHART_COLOR_VERDE,
                  borderRadius: 2,
                },
                {
                  label: 'Experiencia',
                  data: this.timelineYearSeries.exp,
                  backgroundColor: CHART_COLOR_PURPLE,
                  borderRadius: 2,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: { boxWidth: 12, padding: 14, font: { size: 12 } },
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 0 },
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
                  position: 'bottom',
                  labels: {
                    boxWidth: 12,
                    padding: 14,
                    font: { size: 11 },
                    usePointStyle: true,
                  },
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
    if (this.nivelPromedio.length && radar) {
      const ctx = radar.getContext('2d');
      if (ctx) {
        this.chartInstances.push(
          new Chart(ctx, {
            type: 'radar',
            data: {
              labels: this.nivelPromedio.map(n => n.tipo),
              datasets: [
                {
                  label: 'Nivel promedio',
                  data: this.nivelPromedio.map(n => n.promedio),
                  backgroundColor: 'rgba(129, 140, 248, 0.30)',
                  borderColor: CHART_COLOR_PURPLE,
                  borderWidth: 2,
                  pointBackgroundColor: CHART_COLOR_PURPLE,
                  pointRadius: 4,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                r: {
                  min: 0,
                  max: 4,
                  ticks: {
                    stepSize: 1,
                    font: { size: 10 },
                    backdropColor: 'transparent',
                  },
                  pointLabels: { font: { size: 13 } },
                  grid: { color: '#e5e7eb' },
                  angleLines: { color: '#e5e7eb' },
                },
              },
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: { boxWidth: 14, padding: 16, font: { size: 12 } },
                },
              },
            },
          })
        );
      }
    }
  }
}
