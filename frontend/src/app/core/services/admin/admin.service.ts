import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../constants/api-base-url';

const BASE = `${API_BASE_URL}/api/admin`;

// ── DTOs (espejo de AdminDtos.cs) ────────────────────────────────────────────

export interface RolDto {
  rolId: number;
  nombreRol: string;
  descripcion: string | null;
}

export interface UsuarioAdminDto {
  usuarioId: number;
  email: string;
  estado: string;            // 'Activo' | 'Inactivo'
  fechaRegistro: string;
  /** CV en estado publicado en el portal (admin puede cambiarlo). */
  cvPublicado: boolean;
  roles: RolDto[];
}

export interface AuditoriaAdminListItemDto {
  auditoriaAdminId: number;
  fechaUtc: string;
  actorUsuarioId: number | null;
  actorEmail: string | null;
  accion: string;
  entidadTipo: string;
  entidadId: number | null;
  detalleJson: string | null;
}

export interface AuditoriaAdminPageDto {
  items: AuditoriaAdminListItemDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuditoriaCvListItemDto {
  auditoriaCvId: number;
  fechaUtc: string;
  actorUsuarioId: number | null;
  actorEmail: string | null;
  curriculumId: number;
  accion: string;
  entidadTipo: string;
  entidadId: number | null;
  detalleJson: string | null;
  propietarioEmail: string | null;
  urlPublica: string | null;
}

export interface AuditoriaCvPageDto {
  items: AuditoriaCvListItemDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Debe coincidir con `AuditoriaPurgeConfirmacion.VaciarTodo` en la API. */
export const AUDITORIA_PURGE_CONFIRMACION_VACIAR = 'VACIAR_AUDITORIA';

export interface PurgeAuditoriaRequest {
  tabla: 'admin' | 'cv';
  modo: 'anioMes' | 'anio' | 'todo';
  anio?: number;
  mes?: number;
  confirmacion?: string;
}

export interface PurgeAuditoriaResponseDto {
  eliminados: number;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  // Usuarios
  getUsuarios(): Observable<UsuarioAdminDto[]> {
    return this.http.get<UsuarioAdminDto[]>(`${BASE}/usuarios`);
  }

  setEstado(id: number, activo: boolean): Observable<{ usuarioId: number; estado: string }> {
    return this.http.put<{ usuarioId: number; estado: string }>(
      `${BASE}/usuarios/${id}/estado`, { activo }
    );
  }

  setCvPublicacion(
    id: number,
    publicado: boolean
  ): Observable<{ usuarioId: number; cvPublicado: boolean }> {
    return this.http.put<{ usuarioId: number; cvPublicado: boolean }>(
      `${BASE}/usuarios/${id}/cv-publicacion`,
      { publicado }
    );
  }

  // Roles
  getRoles(): Observable<RolDto[]> {
    return this.http.get<RolDto[]>(`${BASE}/roles`);
  }

  asignarRol(usuarioId: number, rolId: number): Observable<unknown> {
    return this.http.post(`${BASE}/usuarios/${usuarioId}/roles/${rolId}`, {});
  }

  quitarRol(usuarioId: number, rolId: number): Observable<unknown> {
    return this.http.delete(`${BASE}/usuarios/${usuarioId}/roles/${rolId}`);
  }

  getAuditoria(
    page = 1,
    pageSize = 10,
    accion?: string | null,
    q?: string | null
  ): Observable<AuditoriaAdminPageDto> {
    let params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    const a = accion?.trim();
    const qq = q?.trim();
    if (a) params = params.set('accion', a);
    if (qq) params = params.set('q', qq);
    return this.http.get<AuditoriaAdminPageDto>(`${BASE}/auditoria`, { params });
  }

  /** Listado global de auditoría de edición de CV (solo rol Admin). */
  getAuditoriaCvGlobal(
    page = 1,
    pageSize = 10,
    accion?: string | null,
    q?: string | null
  ): Observable<AuditoriaCvPageDto> {
    let params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    const a = accion?.trim();
    const qq = q?.trim();
    if (a) params = params.set('accion', a);
    if (qq) params = params.set('q', qq);
    return this.http.get<AuditoriaCvPageDto>(`${BASE}/auditoria-cv`, { params });
  }

  purgeAuditoria(body: PurgeAuditoriaRequest): Observable<PurgeAuditoriaResponseDto> {
    return this.http.post<PurgeAuditoriaResponseDto>(`${BASE}/auditoria/purge`, body);
  }
}
