import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { getOrCreatePortalCvVisitorId } from '../../utils/portal-cv-visitor-id.util';

/** Alinea respuestas JSON en PascalCase (p. ej. algunos proxies) con los DTOs camelCase del front. */
function deepToCamel(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(deepToCamel);
  if (typeof value !== 'object') return value;
  const o = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    const camel = k.length ? k.charAt(0).toLowerCase() + k.slice(1) : k;
    out[camel] = deepToCamel(v);
  }
  return out;
}

// ── DTOs (espejo de PublicDtos.cs del backend) ──────────────────────────────

export interface CvListadoItemDto {
  curriculumId: number;
  urlPublica: string;
  nombreCompleto: string | null;
  fotoUrl: string | null;
  ciudad: string | null;
  pais: string | null;
  nombrePerfil: string | null;
  contadorVisitas: number;
  contadorContactos: number;
  habilidades: string[];
}

export interface CvListadoResponse {
  items: CvListadoItemDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PersonalesPublicoDto {
  nombreCompleto: string | null;
  fotoUrl: string | null;
  ciudad: string | null;
  pais: string | null;
  celular: string | null;
  email: string | null;
}

export interface PerfilPublicoDto {
  perfilId: number;
  nombrePerfil: string | null;
  descripcionPerfil: string | null;
  aspiracionSalarialPesos: number | null;
  aspiracionSalarialDolares: number | null;
  esActivo: boolean;
}

export interface ExperienciaPublicoDto {
  experienciaId: number;
  empresa: string | null;
  cargo: string | null;
  sector: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  esActual: boolean;
  funciones: string | null;
  tipoContrato: string | null;
}

export interface FormacionPublicoDto {
  formacionId: number;
  titulo: string | null;
  institucion: string | null;
  area: string | null;
  tipoFormacion: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
}

export interface HabilidadPublicoDto {
  habilidadId: number;
  nombre: string;
  tipo: string | null;
  nivel: string | null;
  descripcion: string | null;
  nivelLectura: string | null;
  nivelEscritura: string | null;
  nivelEscucha: string | null;
  nivelHabla: string | null;
}

export interface ProyectoPublicoDto {
  proyectoId: number;
  nombreProyecto: string | null;
  rol: string | null;
  stackTecnologico: string | null;
  aporte: string | null;
  logro: string | null;
  equipoTamano: number | null;
  duracionMeses: number | null;
}

export interface RedSocialPublicoDto {
  redSocialId: number;
  nombreRed: string | null;
  linkPublico: string | null;
  usuarioContacto: string | null;
}

export interface ReferenciaPublicoDto {
  referenciaId: number;
  tipoReferencia: string;
  nombre: string;
  apellido: string | null;
  cargo: string | null;
  empresa: string | null;
}

export interface CvDetalleDto {
  curriculumId: number;
  urlPublica: string;
  plantillaCodigo: string;
  experienciaLaboralMesesAcumulados: number;
  personales: PersonalesPublicoDto | null;
  perfiles: PerfilPublicoDto[];
  experiencias: ExperienciaPublicoDto[];
  formaciones: FormacionPublicoDto[];
  habilidades: HabilidadPublicoDto[];
  proyectos: ProyectoPublicoDto[];
  referencias: ReferenciaPublicoDto[];
  redesSociales: RedSocialPublicoDto[];
  /** Visibilidad pública: interruptor maestro del dashboard (default true si la API no envía el campo). */
  dashboardPublicoActivo?: boolean;
  /** Métricas (3 tarjetas) en el dashboard público. */
  dashboardMostrarMetricas?: boolean;
  /** Gráficas (4) en el dashboard público. */
  dashboardMostrarGraficas?: boolean;
}

/** Espejo de CvEstadisticasDto (backend). */
export interface CvEstadisticasDto {
  curriculumId: number;
  urlPublica: string;
  totalVisitas: number;
  totalContactos: number;
  ultimaVisita: string | null;
  fechaActualizacion: string;
}

export interface ContactarDto {
  nombre: string;
  empresa: string;
  email: string;
  motivoContacto: string;
}

export interface BuscarCvsParams {
  ciudad?: string;
  habilidad?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

// ── Servicio ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class PublicService {
  private readonly BASE = '/api/public';

  constructor(private http: HttpClient) {}

  buscarCvs(params: BuscarCvsParams = {}): Observable<CvListadoResponse> {
    let httpParams = new HttpParams();
    if (params.ciudad)    httpParams = httpParams.set('ciudad', params.ciudad);
    if (params.habilidad) httpParams = httpParams.set('habilidad', params.habilidad);
    if (params.q)         httpParams = httpParams.set('q', params.q);
    if (params.page)      httpParams = httpParams.set('page', String(params.page));
    if (params.pageSize)  httpParams = httpParams.set('pageSize', String(params.pageSize));

    return this.http.get<CvListadoResponse>(`${this.BASE}/cvs`, { params: httpParams });
  }

  getDetalle(urlPublica: string): Observable<CvDetalleDto> {
    const vid = getOrCreatePortalCvVisitorId();
    let params = new HttpParams();
    if (vid) {
      params = params.set('vid', vid);
    }
    return this.http
      .get<unknown>(`${this.BASE}/cvs/${encodeURIComponent(urlPublica)}`, { params })
      .pipe(map(raw => deepToCamel(raw) as CvDetalleDto));
  }

  getEstadisticas(urlPublica: string): Observable<CvEstadisticasDto> {
    return this.http
      .get<unknown>(`${this.BASE}/cvs/${encodeURIComponent(urlPublica)}/stats`)
      .pipe(map(raw => deepToCamel(raw) as CvEstadisticasDto));
  }

  contactar(urlPublica: string, dto: ContactarDto): Observable<void> {
    return this.http.post<void>(`${this.BASE}/cvs/${encodeURIComponent(urlPublica)}/contactar`, dto);
  }

  /** Notifica al backend Imprimir / PDF (alerta Descarga deduplicada por visitante anónimo). */
  registrarImpresionPdf(urlPublica: string, visitanteAnonimoId: string): Observable<void> {
    return this.http.post<void>(`${this.BASE}/acciones/imprimir-cv`, {
      urlPublica,
      visitanteAnonimoId: visitanteAnonimoId || undefined,
    });
  }
}
