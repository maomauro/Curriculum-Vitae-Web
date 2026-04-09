import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  privacidadEmail: string;
  privacidadTelefono: string;
}

export interface PerfilPublicoDto {
  perfilId: number;
  nombrePerfil: string | null;
  descripcionPerfil: string | null;
  aspiracionSalarialPesos: number | null;
  aspiracionSalarialDolares: number | null;
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
  nombre: string | null;
  descripcion: string | null;
  urlProyecto: string | null;
  urlRepositorio: string | null;
  tecnologias: string[];
}

export interface RedSocialPublicoDto {
  redSocialId: number;
  tipo: string | null;
  url: string | null;
}

export interface CvDetalleDto {
  curriculumId: number;
  urlPublica: string;
  personales: PersonalesPublicoDto | null;
  perfiles: PerfilPublicoDto[];
  experiencias: ExperienciaPublicoDto[];
  formaciones: FormacionPublicoDto[];
  habilidades: HabilidadPublicoDto[];
  proyectos: ProyectoPublicoDto[];
  referencias: unknown[];
  redesSociales: RedSocialPublicoDto[];
}

export interface EstadisticasPublicasDto {
  contadorVisitas: number;
  contadorContactos: number;
  contadorDescargas: number;
  ultimaVisita: string | null;
}

export interface ContactarDto {
  nombre: string;
  empresa: string | null;
  email: string;
  motivoContacto: string | null;
  asunto: string | null;
  mensaje: string;
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
    return this.http.get<CvDetalleDto>(`${this.BASE}/cvs/${encodeURIComponent(urlPublica)}`);
  }

  getEstadisticas(urlPublica: string): Observable<EstadisticasPublicasDto> {
    return this.http.get<EstadisticasPublicasDto>(`${this.BASE}/cvs/${encodeURIComponent(urlPublica)}/stats`);
  }

  contactar(urlPublica: string, dto: ContactarDto): Observable<void> {
    return this.http.post<void>(`${this.BASE}/cvs/${encodeURIComponent(urlPublica)}/contactar`, dto);
  }
}
