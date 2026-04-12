import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// ── DTOs — Personales ─────────────────────────────────────────────────────────

export interface PersonalesDto {
  personalesId: number;
  curriculumId: number;
  tipoIdentificacion: string | null;
  numeroDocumento: string | null;
  fechaExpedicion: string | null;
  lugarExpedicion: string | null;
  libretaMilitarNumero: string | null;
  libretaMilitarClase: string | null;
  pasaporteNumero: string | null;
  pasaporteVigencia: string | null;
  visaNumero: string | null;
  visaVigencia: string | null;
  visaClase: string | null;
  primerNombre: string;
  segundoNombre: string | null;
  primerApellido: string;
  segundoApellido: string | null;
  fechaNacimiento: string | null;
  lugarNacimiento: string | null;
  genero: string | null;
  nacionalidad: string | null;
  tipoSangre: string | null;
  eps: string | null;
  pencion: string | null;
  cesantias: string | null;
  email: string | null;
  celular: string | null;
  telefonoFijo: string | null;
  pais: string | null;
  departamento: string | null;
  ciudad: string | null;
  barrio: string | null;
  codigoPostal: string | null;
  direccion: string | null;
  tipoResidencia: string | null;
  fotoUrl: string | null;
}

export type UpsertPersonalesRequest = Omit<PersonalesDto, 'personalesId' | 'curriculumId'>;

// ── DTOs — Perfiles ────────────────────────────────────────────────────────────

export interface PerfilDto {
  perfilId: number;
  nombrePerfil: string | null;
  descripcionPerfil: string | null;
  experienciaPerfilAnios: number | null;
  aspiracionSalarialPesos: number | null;
  aspiracionSalarialDolares: number | null;
  esActivo: boolean;
}

export type UpsertPerfilRequest = Omit<PerfilDto, 'perfilId'>;

// ── DTOs — Experiencias ────────────────────────────────────────────────────────

export interface ExperienciaDto {
  experienciaId: number;
  empresa: string | null;
  cargo: string | null;
  sector: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  tipoContrato: string | null;
  motivoRetiro: string | null;
  funciones: string | null;
  esActual: boolean;
  adjuntoSoporte: string | null;
  fechaRegistro: string;
}

export type UpsertExperienciaRequest = Omit<ExperienciaDto, 'experienciaId' | 'fechaRegistro'>;

// ── DTOs — Formaciones ─────────────────────────────────────────────────────────

export interface FormacionDto {
  formacionId: number;
  titulo: string | null;
  institucion: string | null;
  area: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  tipoFormacion: string | null;
  descripcion: string | null;
  adjuntoSoporte: string | null;
  fechaVigencia: string | null;
  duracionHoras: number | null;
}

export type UpsertFormacionRequest = Omit<FormacionDto, 'formacionId'>;

// ── DTOs — Habilidades ─────────────────────────────────────────────────────────

export interface HabilidadDto {
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

export type UpsertHabilidadRequest = Omit<HabilidadDto, 'habilidadId'>;

// ── DTOs — Proyectos ───────────────────────────────────────────────────────────

export interface ProyectoDto {
  proyectoId: number;
  nombreProyecto: string | null;
  rol: string | null;
  equipoTamano: number | null;
  duracionMeses: number | null;
  stackTecnologico: string | null;
  aporte: string | null;
  logro: string | null;
  desafio: string | null;
}

export type UpsertProyectoRequest = Omit<ProyectoDto, 'proyectoId'>;

// ── DTOs — Referencias ─────────────────────────────────────────────────────────

export interface ReferenciaDto {
  referenciaId: number;
  tipoReferencia: string;
  experienciaId: number | null;
  nombre: string;
  apellido: string | null;
  email: string | null;
  telefono: string | null;
  parentesco: string | null;
  cargo: string | null;
  empresa: string | null;
  relacion: string | null;
  observaciones: string | null;
  adjuntoSoporte: string | null;
  fechaRegistro: string;
}

export type UpsertReferenciaRequest = Omit<ReferenciaDto, 'referenciaId' | 'fechaRegistro'>;

// ── DTOs — Redes Sociales ──────────────────────────────────────────────────────

export interface RedSocialDto {
  redSocialId: number;
  nombreRed: string;
  linkPublico: string | null;
  usuarioContacto: string | null;
}

export type UpsertRedSocialRequest = Omit<RedSocialDto, 'redSocialId'>;

// ── DTOs — Familiares / Contactos de emergencia ────────────────────────────────

export interface FamiliarContactoDto {
  familiarId: number;
  parentesco: string | null;
  nombres: string | null;
  apellidos: string | null;
  email: string | null;
  telefono: string | null;
  esContactoPrincipal: boolean;
}

export type UpsertFamiliarContactoRequest = Omit<FamiliarContactoDto, 'familiarId'>;

// ── DTOs — Visibilidad ─────────────────────────────────────────────────────────

export interface VisibilidadSeccionDto {
  seccion: string;
  visible: boolean;
}

export interface UpdateVisibilidadRequest {
  seccion: string;
  visible: boolean;
}

interface VisibilidadSeccionApiDto {
  nombreSeccion: string;
  esVisible: boolean;
}

// ── Presentación (plantilla Mi CV) ────────────────────────────────────────────

export interface PresentacionCvDto {
  plantillaCodigo: string;
  experienciaLaboralMesesAcumulados: number;
  /** Slug del CV en la ruta pública /cv/:urlPublica */
  urlPublica: string;
  /** Si el curriculum está en estado Publicado (visible en búsqueda y detalle público). */
  publicado: boolean;
}

export interface UpdatePresentacionCvRequest {
  plantillaCodigo: string;
}

// ── Servicio ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class CvEditorService {
  private readonly BASE = '/api/cv';

  constructor(private http: HttpClient) {}

  // — Personales —
  getPersonales(): Observable<PersonalesDto> {
    return this.http.get<PersonalesDto>(`${this.BASE}/personales`);
  }
  upsertPersonales(data: UpsertPersonalesRequest): Observable<PersonalesDto> {
    return this.http.put<PersonalesDto>(`${this.BASE}/personales`, data);
  }

  // — Perfiles —
  getPerfiles(): Observable<PerfilDto[]> {
    return this.http.get<PerfilDto[]>(`${this.BASE}/perfiles`);
  }
  createPerfil(data: UpsertPerfilRequest): Observable<PerfilDto> {
    return this.http.post<PerfilDto>(`${this.BASE}/perfiles`, data);
  }
  updatePerfil(id: number, data: UpsertPerfilRequest): Observable<PerfilDto> {
    return this.http.put<PerfilDto>(`${this.BASE}/perfiles/${id}`, data);
  }
  deletePerfil(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/perfiles/${id}`);
  }

  // — Experiencias —
  getExperiencias(): Observable<ExperienciaDto[]> {
    return this.http.get<ExperienciaDto[]>(`${this.BASE}/experiencias`);
  }
  createExperiencia(data: UpsertExperienciaRequest): Observable<ExperienciaDto> {
    return this.http.post<ExperienciaDto>(`${this.BASE}/experiencias`, data);
  }
  updateExperiencia(id: number, data: UpsertExperienciaRequest): Observable<ExperienciaDto> {
    return this.http.put<ExperienciaDto>(`${this.BASE}/experiencias/${id}`, data);
  }
  deleteExperiencia(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/experiencias/${id}`);
  }

  // — Formaciones —
  getFormaciones(): Observable<FormacionDto[]> {
    return this.http.get<FormacionDto[]>(`${this.BASE}/formaciones`);
  }
  createFormacion(data: UpsertFormacionRequest): Observable<FormacionDto> {
    return this.http.post<FormacionDto>(`${this.BASE}/formaciones`, data);
  }
  updateFormacion(id: number, data: UpsertFormacionRequest): Observable<FormacionDto> {
    return this.http.put<FormacionDto>(`${this.BASE}/formaciones/${id}`, data);
  }
  deleteFormacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/formaciones/${id}`);
  }

  // — Habilidades —
  getHabilidades(): Observable<HabilidadDto[]> {
    return this.http.get<HabilidadDto[]>(`${this.BASE}/habilidades`);
  }
  createHabilidad(data: UpsertHabilidadRequest): Observable<HabilidadDto> {
    return this.http.post<HabilidadDto>(`${this.BASE}/habilidades`, data);
  }
  updateHabilidad(id: number, data: UpsertHabilidadRequest): Observable<HabilidadDto> {
    return this.http.put<HabilidadDto>(`${this.BASE}/habilidades/${id}`, data);
  }
  deleteHabilidad(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/habilidades/${id}`);
  }

  // — Proyectos —
  getProyectos(): Observable<ProyectoDto[]> {
    return this.http.get<ProyectoDto[]>(`${this.BASE}/proyectos`);
  }
  createProyecto(data: UpsertProyectoRequest): Observable<ProyectoDto> {
    return this.http.post<ProyectoDto>(`${this.BASE}/proyectos`, data);
  }
  updateProyecto(id: number, data: UpsertProyectoRequest): Observable<ProyectoDto> {
    return this.http.put<ProyectoDto>(`${this.BASE}/proyectos/${id}`, data);
  }
  deleteProyecto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/proyectos/${id}`);
  }

  // — Referencias —
  getReferencias(): Observable<ReferenciaDto[]> {
    return this.http.get<ReferenciaDto[]>(`${this.BASE}/referencias`);
  }
  createReferencia(data: UpsertReferenciaRequest): Observable<ReferenciaDto> {
    return this.http.post<ReferenciaDto>(`${this.BASE}/referencias`, data);
  }
  updateReferencia(id: number, data: UpsertReferenciaRequest): Observable<ReferenciaDto> {
    return this.http.put<ReferenciaDto>(`${this.BASE}/referencias/${id}`, data);
  }
  deleteReferencia(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/referencias/${id}`);
  }

  // — Redes Sociales —
  getRedesSociales(): Observable<RedSocialDto[]> {
    return this.http.get<RedSocialDto[]>(`${this.BASE}/redes-sociales`);
  }
  createRedSocial(data: UpsertRedSocialRequest): Observable<RedSocialDto> {
    return this.http.post<RedSocialDto>(`${this.BASE}/redes-sociales`, data);
  }
  updateRedSocial(id: number, data: UpsertRedSocialRequest): Observable<RedSocialDto> {
    return this.http.put<RedSocialDto>(`${this.BASE}/redes-sociales/${id}`, data);
  }
  deleteRedSocial(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/redes-sociales/${id}`);
  }

  // — Familiares / Contactos de emergencia —
  getFamiliares(): Observable<FamiliarContactoDto[]> {
    return this.http.get<FamiliarContactoDto[]>(`${this.BASE}/familiares`);
  }
  createFamiliar(data: UpsertFamiliarContactoRequest): Observable<FamiliarContactoDto> {
    return this.http.post<FamiliarContactoDto>(`${this.BASE}/familiares`, data);
  }
  updateFamiliar(id: number, data: UpsertFamiliarContactoRequest): Observable<FamiliarContactoDto> {
    return this.http.put<FamiliarContactoDto>(`${this.BASE}/familiares/${id}`, data);
  }
  deleteFamiliar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/familiares/${id}`);
  }

  // — Visibilidad —
  getVisibilidad(): Observable<VisibilidadSeccionDto[]> {
    return this.http.get<VisibilidadSeccionApiDto[]>(`${this.BASE}/visibilidad`).pipe(
      map(items =>
        items.map(item => ({
          seccion: item.nombreSeccion,
          visible: item.esVisible,
        }))
      )
    );
  }
  updateVisibilidad(cambios: UpdateVisibilidadRequest[]): Observable<VisibilidadSeccionDto[]> {
    const payload = cambios.map(c => ({
      nombreSeccion: c.seccion,
      esVisible: c.visible,
    }));
    return this.http.put<VisibilidadSeccionApiDto[]>(`${this.BASE}/visibilidad`, payload).pipe(
      map(items =>
        items.map(item => ({
          seccion: item.nombreSeccion,
          visible: item.esVisible,
        }))
      )
    );
  }

  // — Presentación / plantilla —
  getPresentacion(): Observable<PresentacionCvDto> {
    return this.http.get<PresentacionCvDto>(`${this.BASE}/presentacion`);
  }

  updatePresentacion(data: UpdatePresentacionCvRequest): Observable<PresentacionCvDto> {
    return this.http.put<PresentacionCvDto>(`${this.BASE}/presentacion`, data);
  }

  updateCurriculumPublicacion(publicado: boolean): Observable<PresentacionCvDto> {
    return this.http.put<PresentacionCvDto>(`${this.BASE}/presentacion/publicacion`, { publicado });
  }
}
