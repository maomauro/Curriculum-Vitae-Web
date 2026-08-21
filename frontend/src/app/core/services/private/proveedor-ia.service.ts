import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../constants/api-base-url';

export type ProveedorIaCodigo = 'claude' | 'openai' | 'gemini' | 'ollama' | 'otro';

/** Nunca incluye la clave de API — ni cifrada ni en texto plano. */
export interface ProveedorIaConfigDto {
  proveedorIaConfigId: number;
  proveedor: ProveedorIaCodigo;
  nombre: string | null;
  modelo: string | null;
  endpoint: string | null;
  esActivo: boolean;
  fechaActualizacion: string;
}

export interface CrearProveedorIaConfigRequest {
  proveedor: ProveedorIaCodigo;
  nombre?: string | null;
  modelo?: string | null;
  endpoint?: string | null;
  apiKey?: string | null;
}

/** apiKey null/vacío en una actualización = no cambiar la clave guardada. */
export interface ActualizarProveedorIaConfigRequest {
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

  getConfigs(): Observable<ProveedorIaConfigDto[]> {
    return this.http.get<ProveedorIaConfigDto[]>(this.BASE);
  }

  crearConfig(request: CrearProveedorIaConfigRequest): Observable<ProveedorIaConfigDto> {
    return this.http.post<ProveedorIaConfigDto>(this.BASE, request);
  }

  actualizarConfig(id: number, request: ActualizarProveedorIaConfigRequest): Observable<ProveedorIaConfigDto> {
    return this.http.put<ProveedorIaConfigDto>(`${this.BASE}/${id}`, request);
  }

  eliminarConfig(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }

  activarConfig(id: number): Observable<ProveedorIaConfigDto> {
    return this.http.put<ProveedorIaConfigDto>(`${this.BASE}/${id}/activar`, null);
  }

  probarConexion(request: ProbarConexionIaRequest): Observable<ProbarConexionIaResponse> {
    return this.http.post<ProbarConexionIaResponse>(`${this.BASE}/probar`, request);
  }

  /** Prueba una conexión ya guardada -- el backend descifra su clave, el front-end no la envía. */
  probarConexionGuardada(id: number): Observable<ProbarConexionIaResponse> {
    return this.http.post<ProbarConexionIaResponse>(`${this.BASE}/${id}/probar`, null);
  }
}
