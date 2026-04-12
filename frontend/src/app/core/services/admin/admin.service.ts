import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const BASE = '/api/admin';

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
}
