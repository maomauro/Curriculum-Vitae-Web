import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../constants/api-base-url';

export type ProveedorIaCodigo = 'claude' | 'openai' | 'gemini' | 'groq' | 'ollama' | 'otro';

/** Nunca incluye la clave de API — ni cifrada ni en texto plano. */
export interface ProveedorIaDto {
  proveedorIaId: number;
  proveedor: ProveedorIaCodigo;
  nombre: string | null;
  modelo: string | null;
  endpoint: string | null;
  esActivo: boolean;
  fechaActualizacion: string;
}

export interface CrearProveedorIaRequest {
  proveedor: ProveedorIaCodigo;
  nombre?: string | null;
  modelo?: string | null;
  endpoint?: string | null;
  apiKey?: string | null;
}

/** apiKey null/vacío en una actualización = no cambiar la clave guardada. */
export interface ActualizarProveedorIaRequest {
  proveedor: ProveedorIaCodigo;
  nombre?: string | null;
  modelo?: string | null;
  endpoint?: string | null;
  apiKey?: string | null;
}

export interface ProbarConexionIaRequest {
  proveedor: ProveedorIaCodigo;
  modelo?: string | null;
  endpoint?: string | null;
  apiKey?: string | null;
}

export interface ProbarConexionIaResponse {
  ok: boolean;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class ProveedorIaService {
  private readonly BASE = `${API_BASE_URL}/api/cv/proveedor-ia`;

  constructor(private http: HttpClient) {}

  getConfigs(): Observable<ProveedorIaDto[]> {
    return this.http.get<ProveedorIaDto[]>(this.BASE);
  }

  crearConfig(request: CrearProveedorIaRequest): Observable<ProveedorIaDto> {
    return this.http.post<ProveedorIaDto>(this.BASE, request);
  }

  actualizarConfig(id: number, request: ActualizarProveedorIaRequest): Observable<ProveedorIaDto> {
    return this.http.put<ProveedorIaDto>(`${this.BASE}/${id}`, request);
  }

  eliminarConfig(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }

  activarConfig(id: number): Observable<ProveedorIaDto> {
    return this.http.put<ProveedorIaDto>(`${this.BASE}/${id}/activar`, null);
  }

  probarConexion(request: ProbarConexionIaRequest): Observable<ProbarConexionIaResponse> {
    return this.http.post<ProbarConexionIaResponse>(`${this.BASE}/probar`, request);
  }

  /** Prueba una conexión ya guardada -- el backend descifra su clave, el front-end no la envía. */
  probarConexionGuardada(id: number): Observable<ProbarConexionIaResponse> {
    return this.http.post<ProbarConexionIaResponse>(`${this.BASE}/${id}/probar`, null);
  }
}
