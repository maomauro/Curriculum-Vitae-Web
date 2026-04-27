import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, timeout } from 'rxjs/operators';
import { getOrCreatePortalCvVisitorId } from '../../utils/portal-cv-visitor-id.util';
import { API_BASE_URL } from '../../constants/api-base-url';
import {
  PUBLIC_CVS_SNAPSHOT_API_URL,
  PUBLIC_CVS_SNAPSHOT_STATIC_URL,
} from '../../constants/public-snapshot-url';

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

/**
 * El API puede responder 200 con `bootstrap-empty` e `items: []` tras un reinicio de contenedor;
 * el JSON estático del SWA puede traer última copia publicada. Preferimos quien tenga CVs.
 */
function pickPublicSnapshotRicher(
  api: PublicCvsSnapshotDto | null,
  st: PublicCvsSnapshotDto | null
): PublicCvsSnapshotDto | null {
  const apiCount = api?.items?.length ?? 0;
  const stCount = st?.items?.length ?? 0;
  if (apiCount > 0) {
    return api;
  }
  if (stCount > 0) {
    return st;
  }
  return api ?? st;
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

export interface PublicSnapshotItemDto {
  listado: CvListadoItemDto;
  detalle: CvDetalleDto;
  estadisticas?: CvEstadisticasDto;
}

export interface PublicCvsSnapshotDto {
  generatedAtUtc: string;
  sourceVersion?: string | null;
  items: PublicSnapshotItemDto[];
}

export interface SnapshotListadoResponse extends CvListadoResponse {
  generatedAtUtc: string;
  /** Alineado con backend / JSON estático; p. ej. `seed-local` vs `api-background-v1`. */
  sourceVersion?: string | null;
}

/** Payload cuando existe detalle en el snapshot cacheado. */
export interface PublicDetalleSnapshotDto {
  detalle: CvDetalleDto;
  generatedAtUtc: string;
  sourceVersion?: string | null;
}

// ── Servicio ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class PublicService {
  private readonly BASE = `${API_BASE_URL}/api/public`;
  private snapshotCache$?: Observable<PublicCvsSnapshotDto | null>;

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

  getDetalleSnapshot(urlPublica: string): Observable<PublicDetalleSnapshotDto | null> {
    const slug = (urlPublica ?? '').trim().toLowerCase();
    if (!slug) return of(null);
    return this.getSnapshot().pipe(
      map(snapshot => {
        if (!snapshot) return null;
        const hit = snapshot.items.find(i => (i.detalle.urlPublica ?? '').trim().toLowerCase() === slug);
        return hit
          ? {
              detalle: hit.detalle,
              generatedAtUtc: snapshot.generatedAtUtc,
              sourceVersion: snapshot.sourceVersion,
            }
          : null;
      })
    );
  }

  getEstadisticasSnapshot(urlPublica: string): Observable<{
    stats: CvEstadisticasDto;
    generatedAtUtc: string;
    sourceVersion?: string | null;
  } | null> {
    const slug = (urlPublica ?? '').trim().toLowerCase();
    if (!slug) return of(null);
    return this.getSnapshot().pipe(
      map(snapshot => {
        if (!snapshot) return null;
        const hit = snapshot.items.find(i => (i.detalle.urlPublica ?? '').trim().toLowerCase() === slug);
        if (!hit?.estadisticas) return null;
        return {
          stats: hit.estadisticas,
          generatedAtUtc: snapshot.generatedAtUtc,
          sourceVersion: snapshot.sourceVersion,
        };
      })
    );
  }

  buscarCvsSnapshot(params: BuscarCvsParams = {}): Observable<SnapshotListadoResponse | null> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 12;
    const q = (params.q ?? '').trim().toLowerCase();
    const ciudad = (params.ciudad ?? '').trim().toLowerCase();
    const habilidad = (params.habilidad ?? '').trim().toLowerCase();

    return this.getSnapshot().pipe(
      map(snapshot => {
        if (!snapshot) return null;

        const filtered = snapshot.items
          .map(i => i.listado)
          .filter(item => {
            if (ciudad) {
              const c = `${item.ciudad ?? ''} ${item.pais ?? ''}`.toLowerCase();
              if (!c.includes(ciudad)) return false;
            }
            if (habilidad) {
              const hs = (item.habilidades ?? []).map(h => h.toLowerCase());
              if (!hs.some(h => h.includes(habilidad))) return false;
            }
            if (q) {
              const haystack = [
                item.nombreCompleto ?? '',
                item.nombrePerfil ?? '',
                item.ciudad ?? '',
                item.pais ?? '',
                ...(item.habilidades ?? []),
              ]
                .join(' ')
                .toLowerCase();
              if (!haystack.includes(q)) return false;
            }
            return true;
          });

        const total = filtered.length;
        const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);
        const safePage = Math.min(page, totalPages);
        const start = (safePage - 1) * pageSize;
        const items = filtered.slice(start, start + pageSize);

        return {
          generatedAtUtc: snapshot.generatedAtUtc,
          sourceVersion: snapshot.sourceVersion,
          items,
          total,
          page: safePage,
          pageSize,
          totalPages,
        };
      })
    );
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

  private getSnapshot(): Observable<PublicCvsSnapshotDto | null> {
    if (!this.snapshotCache$) {
      const normalize = (raw: unknown): PublicCvsSnapshotDto | null => {
        const snapshot = deepToCamel(raw) as PublicCvsSnapshotDto;
        if (!snapshot || !Array.isArray(snapshot.items) || typeof snapshot.generatedAtUtc !== 'string') {
          return null;
        }
        return snapshot;
      };
      /** Contenedor lento: timeout en API; siempre pedimos estático en paralelo para poder fusionar. */
      const snapshotApiTimeoutMs = 5_000;
      const api$ = this.http.get<unknown>(PUBLIC_CVS_SNAPSHOT_API_URL).pipe(
        timeout(snapshotApiTimeoutMs),
        map(normalize),
        catchError(() => of<PublicCvsSnapshotDto | null>(null))
      );
      const static$ = this.http.get<unknown>(PUBLIC_CVS_SNAPSHOT_STATIC_URL).pipe(
        map(normalize),
        catchError(() => of<PublicCvsSnapshotDto | null>(null))
      );
      this.snapshotCache$ = forkJoin({ api: api$, st: static$ }).pipe(
        map(({ api, st }) => pickPublicSnapshotRicher(api, st)),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.snapshotCache$;
  }
}
