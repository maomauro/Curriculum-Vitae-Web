import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import Chart from 'chart.js/auto';
import {
  PublicService,
  CvDetalleDto,
  ContactarDto,
  ExperienciaPublicoDto,
  FormacionPublicoDto,
  HabilidadPublicoDto,
  ProyectoPublicoDto,
} from '../../../core/services/public/public.service';

type DashboardEstado = 'cargando' | 'listo' | 'no_encontrado' | 'error';

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
  rol: string | null;
  equipoTamano: number | null;
}

/** Paleta prototipo dashboard-candidato.html */
const CHART_COLOR_VERDE = '#6EE7B7';
const CHART_COLOR_PURPLE = '#818CF8';
/** Barras “Proyectos”: naranja tipo Bootstrap #fd7e14, relleno suave */
const CHART_COLOR_PROYECTOS_FILL = 'rgba(253, 126, 20, 0.68)';
const CHART_COLOR_PROYECTOS_BORDER = 'rgba(230, 105, 15, 0.55)';
const CHART_COLOR_BARRAS = '#7C6FCD';
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
  if (totalMeses <= 0) return '—';
  const anios = Math.floor(totalMeses / 12);
  const meses = totalMeses % 12;
  const parts: string[] = [];
  if (anios > 0) parts.push(`${anios} año${anios === 1 ? '' : 's'}`);
  if (meses > 0) parts.push(`${meses} mes${meses === 1 ? '' : 'es'}`);
  return parts.join(' ') || '—';
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

/** Filas para gráfico de proyectos (eje Y = nombre corto; tooltip usa nombre largo y rol). */
function buildProyectosChartRows(proyectos: ProyectoPublicoDto[]): ProyectoChartRow[] {
  return (proyectos ?? []).map(p => {
    const nombreLargo = (p.nombreProyecto ?? '').trim() || `Proyecto ${p.proyectoId}`;
    const meses = p.duracionMeses != null && p.duracionMeses >= 0 ? p.duracionMeses : 0;
    return {
      etiqueta: truncarEtiquetaGrafico(nombreLargo, 44),
      nombreLargo,
      meses,
      rol: (p.rol ?? '').trim() || null,
      equipoTamano: p.equipoTamano,
    };
  });
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
    <div class="public-cv-ficha">
      <div class="container py-5 text-center" *ngIf="estado === 'cargando'">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando dashboard…</span>
        </div>
        <p class="text-muted small mt-3 mb-0">Cargando analíticas del perfil…</p>
      </div>

      <div class="container py-4" *ngIf="estado === 'listo' && cv">
        <a routerLink="/cvs" class="btn btn-sm btn-outline-secondary mb-3">
          <i class="bi bi-arrow-left me-1"></i>Volver al listado
        </a>

        <ul class="nav gap-1 mb-3 cv-tabs-nav">
          <li class="nav-item">
            <a class="nav-link fw-semibold text-muted cv-nav-link-passive"
               [routerLink]="['/cv', urlPublica]">
              <i class="bi bi-file-earmark-person me-1"></i>Hoja de vida
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link fw-semibold cv-nav-link-active">
              <i class="bi bi-bar-chart-fill me-1"></i>Dashboard analítico
            </a>
          </li>
        </ul>

        <div class="d-flex flex-wrap justify-content-end gap-2 mb-4">
          <button type="button" class="btn btn-primary" (click)="abrirModalContacto()">
            <i class="bi bi-envelope-fill me-2"></i>Contactar a {{ primerNombre(cv.personales?.nombreCompleto) }}
          </button>
        </div>

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

        <div class="cv-metricas-grid mb-4" *ngIf="metricas.length">
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

        <div class="row g-3 mb-4">
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

        <div class="row g-3 mb-5">
          <div class="col-lg-6">
            <div class="cv-chart-card">
              <div class="cv-ct-title">Proyectos y duración</div>
              <div class="cv-ct-subtitle">
                Meses declarados por proyecto; en el detalle del gráfico verás rol y tamaño de equipo si están registrados.
              </div>
              <p *ngIf="!proyectosChart.length" class="text-muted small mb-0">No hay proyectos en este CV.</p>
              <div
                *ngIf="proyectosChart.length"
                class="cv-chart-canvas-h"
                [style.height.px]="chartProyectosHeightPx">
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
      </div>

      <div class="container py-5 text-center" *ngIf="estado === 'no_encontrado'">
        <i class="bi bi-file-earmark-x display-4 text-muted"></i>
        <p class="text-muted mt-3">CV no encontrado o ya no está publicado.</p>
        <a routerLink="/cvs" class="btn btn-outline-primary">Ver todos los CVs</a>
      </div>

      <div class="container py-5 text-center" *ngIf="estado === 'error'">
        <i class="bi bi-wifi-off display-4 text-muted"></i>
        <p class="text-muted mt-3">No pudimos cargar el dashboard. Revisa tu conexión o inténtalo de nuevo.</p>
        <button type="button" class="btn btn-outline-primary me-2" (click)="reintentar()">Reintentar</button>
        <a routerLink="/cvs" class="btn btn-outline-secondary">Volver al listado</a>
      </div>

      <!-- Sin bootstrap.bundle.js: modal controlado por Angular + clases BS -->
      <ng-container *ngIf="cv && modalContactoAbierto">
        <div class="modal-backdrop fade show" (click)="cerrarModalContacto()" aria-hidden="true"></div>
        <div
          id="modalContactoDash"
          class="modal fade show d-block"
          tabindex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalContactoDashLabel"
          (click)="cerrarModalContacto()">
          <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
          <div class="modal-content cv-modal-soft">
            <div class="modal-header border-0 pb-0">
              <h5 class="modal-title fw-bold" id="modalContactoDashLabel">
                <i class="bi bi-envelope-fill me-2 text-primary"></i>
                Contactar a {{ cv.personales?.nombreCompleto }}
              </h5>
              <button type="button" class="btn-close" (click)="cerrarModalContacto()" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body pt-2">
              <p class="text-muted small mb-4">
                Completa el formulario y {{ primerNombre(cv.personales?.nombreCompleto) }} recibirá tu mensaje directamente.
              </p>
              <div *ngIf="contactoEnviado" class="alert alert-success d-flex align-items-center gap-2 mb-3">
                <i class="bi bi-check-circle-fill"></i>
                <div>¡Mensaje enviado correctamente!</div>
              </div>
              <form *ngIf="!contactoEnviado">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label fw-semibold small">Tu nombre</label>
                    <input type="text" class="form-control" [(ngModel)]="contacto.nombre"
                           name="dashCtcNombre" placeholder="Juan Pérez">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-semibold small">Tu empresa</label>
                    <input type="text" class="form-control" [(ngModel)]="contacto.empresa"
                           name="dashCtcEmpresa" placeholder="Empresa SA">
                  </div>
                  <div class="col-12">
                    <label class="form-label fw-semibold small">Tu correo electrónico</label>
                    <input type="email" class="form-control" [(ngModel)]="contacto.email"
                           name="dashCtcEmail" placeholder="tu@empresa.com">
                  </div>
                  <div class="col-12">
                    <label class="form-label fw-semibold small">Motivo de contacto</label>
                    <select class="form-select" [(ngModel)]="contacto.motivoContacto" name="dashCtcMotivo">
                      <option value="">— Selecciona un motivo —</option>
                      <option value="oferta_laboral">Oferta laboral</option>
                      <option value="freelance">Proyecto freelance</option>
                      <option value="consulta">Consulta</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div class="col-12">
                    <label class="form-label fw-semibold small">Asunto</label>
                    <input type="text" class="form-control" [(ngModel)]="contacto.asunto"
                           name="dashCtcAsunto" placeholder="Motivo del contacto">
                  </div>
                  <div class="col-12">
                    <label class="form-label fw-semibold small">Mensaje</label>
                    <textarea class="form-control" rows="4" [(ngModel)]="contacto.mensaje"
                              name="dashCtcMensaje" placeholder="Escribe tu mensaje aquí..."></textarea>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer border-0 pt-0">
              <button type="button" class="btn btn-outline-secondary" (click)="cerrarModalContacto()">
                Cancelar
              </button>
              <button type="button" class="btn btn-primary px-4"
                      (click)="enviarContacto()"
                      [disabled]="contactoEnviado || enviandoContacto">
                <span *ngIf="enviandoContacto" class="spinner-border spinner-border-sm me-2" role="status"></span>
                <i *ngIf="!enviandoContacto" class="bi bi-send-fill me-2"></i>Enviar mensaje
              </button>
            </div>
          </div>
        </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class DashboardCandidatoComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly publicService = inject(PublicService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('cvDashChartExp') private chartExpEl?: ElementRef<HTMLCanvasElement>;
  @ViewChild('cvDashChartTimeline') private chartTimelineEl?: ElementRef<HTMLCanvasElement>;
  @ViewChild('cvDashChartProyectos') private chartProyectosEl?: ElementRef<HTMLCanvasElement>;
  @ViewChild('cvDashChartRadar') private chartRadarEl?: ElementRef<HTMLCanvasElement>;

  estado: DashboardEstado = 'cargando';
  urlPublica = '';
  cv: CvDetalleDto | null = null;

  modalContactoAbierto = false;

  contactoEnviado = false;
  enviandoContacto = false;
  contacto: ContactarDto = {
    nombre: '',
    empresa: null,
    email: '',
    motivoContacto: null,
    asunto: null,
    mensaje: '',
  };

  metricas: MetricaCard[] = [];
  expEmpresas: ExpEmpresa[] = [];
  timelineYearSeries: TimelineYearSeries = { labels: [], edu: [], exp: [] };
  proyectosChart: ProyectoChartRow[] = [];
  nivelPromedio: { tipo: string; promedio: number }[] = [];
  completitud = 0;
  chartExpHeightPx = 260;
  chartProyectosHeightPx = 220;

  /** Chart.js tipa cada chart por tipo; guardamos solo instancias con destroy(). */
  private chartInstances: Array<{ destroy(): void }> = [];

  primerNombre(nombreCompleto: string | null | undefined): string {
    const t = nombreCompleto?.trim();
    return t ? t.split(/\s+/)[0] : '';
  }

  enviarContacto(): void {
    if (!this.cv) return;
    this.enviandoContacto = true;
    this.publicService.contactar(this.cv.urlPublica, this.contacto).subscribe({
      next: () => {
        this.contactoEnviado = true;
        this.enviandoContacto = false;
      },
      error: () => {
        this.enviandoContacto = false;
      },
    });
  }

  abrirModalContacto(): void {
    this.modalContactoAbierto = true;
    document.body.style.overflow = 'hidden';
  }

  cerrarModalContacto(): void {
    this.modalContactoAbierto = false;
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscapeCerrarModal(): void {
    if (this.modalContactoAbierto) {
      this.cerrarModalContacto();
    }
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map(p => p.get('urlPublica')?.trim() ?? ''),
        distinctUntilChanged(),
        switchMap(slug => {
          if (!slug) {
            this.urlPublica = '';
            this.estado = 'no_encontrado';
            return of(null);
          }
          this.estado = 'cargando';
          this.urlPublica = slug;
          return this.publicService.getDetalle(slug).pipe(
            catchError((err: unknown) => {
              if (err instanceof HttpErrorResponse && err.status === 404) {
                return of<CvDetalleDto | null>(null);
              }
              throw err;
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: detalle => {
          if (detalle === null && !this.urlPublica) return;
          if (!detalle) {
            this.cv = null;
            this.estado = 'no_encontrado';
            return;
          }
          this.cv = detalle;
          this.modalContactoAbierto = false;
          document.body.style.overflow = '';
          this.contactoEnviado = false;
          this.contacto = {
            nombre: '',
            empresa: null,
            email: '',
            motivoContacto: null,
            asunto: null,
            mensaje: '',
          };
          this.rellenarDesdeCv(detalle);
          this.estado = 'listo';
          this.cdr.detectChanges();
          this.scheduleRenderCharts();
        },
        error: () => {
          this.estado = 'error';
        },
      });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    this.destroyCharts();
  }

  reintentar(): void {
    const slug = this.urlPublica || this.route.snapshot.paramMap.get('urlPublica')?.trim();
    if (!slug) {
      this.estado = 'no_encontrado';
      return;
    }
    this.estado = 'cargando';
    this.publicService.getDetalle(slug).subscribe({
      next: detalle => {
        if (!detalle) {
          this.cv = null;
          this.estado = 'no_encontrado';
          return;
        }
        this.cv = detalle;
        this.urlPublica = slug;
        this.modalContactoAbierto = false;
        document.body.style.overflow = '';
        this.contactoEnviado = false;
        this.contacto = {
          nombre: '',
          empresa: null,
          email: '',
          motivoContacto: null,
          asunto: null,
          mensaje: '',
        };
        this.rellenarDesdeCv(detalle);
        this.estado = 'listo';
        this.cdr.detectChanges();
        this.scheduleRenderCharts();
      },
      error: (err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 404) {
          this.estado = 'no_encontrado';
        } else {
          this.estado = 'error';
        }
      },
    });
  }

  /** Tras *ngIf y ViewChild, Chart.js necesita DOM ya pintado (CD + siguiente frame). */
  private scheduleRenderCharts(): void {
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
    this.metricas = buildMetricas(cv);
    this.completitud = completitudAproximada(cv);
    this.expEmpresas = buildExpPorEmpresa(cv.experiencias ?? []);
    this.timelineYearSeries = buildTimelineYearSeries(cv);
    this.proyectosChart = buildProyectosChartRows(cv.proyectos ?? []);
    this.nivelPromedio = buildNivelPromedioPorTipo(cv.habilidades ?? []);
    this.chartExpHeightPx = Math.min(420, Math.max(200, this.expEmpresas.length * 40 + 80));
    this.chartProyectosHeightPx = Math.min(
      420,
      Math.max(180, this.proyectosChart.length * 40 + 80)
    );
  }

  private destroyCharts(): void {
    for (const c of this.chartInstances) {
      c.destroy();
    }
    this.chartInstances = [];
  }

  private renderCharts(): void {
    this.destroyCharts();
    if (this.estado !== 'listo' || !this.cv) return;

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
            type: 'bar',
            data: {
              labels: rows.map(r => r.etiqueta),
              datasets: [
                {
                  label: 'Meses',
                  data: rows.map(r => r.meses),
                  backgroundColor: CHART_COLOR_PROYECTOS_FILL,
                  borderColor: CHART_COLOR_PROYECTOS_BORDER,
                  borderWidth: 1,
                  borderRadius: 4,
                  borderSkipped: false,
                },
              ],
            },
            options: {
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
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
                    label: item => `${item.dataset.label ?? 'Duración'}: ${item.raw} meses`,
                  },
                },
              },
              scales: {
                x: {
                  grid: { color: '#f0f0f0' },
                  beginAtZero: true,
                  ticks: { callback: v => `${v}m` },
                },
                y: { grid: { display: false } },
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
