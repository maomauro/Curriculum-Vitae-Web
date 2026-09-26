import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../constants/api-base-url';

export interface PromptIaListItemDto {
  promptIaId: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  versionActiva: number;
  fechaActualizacion: string;
}

export interface PromptIaVersionDto {
  promptIaId: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  rolContexto: string;
  tarea: string;
  reglas: string | null;
  formatoSalida: string;
  ejemplos: string | null;
  contenido: string;
  version: number;
  esActivo: boolean;
  fechaCreacion: string;
}

export interface CrearPromptIaRequest {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  rolContexto: string;
  tarea: string;
  reglas?: string | null;
  formatoSalida: string;
  ejemplos?: string | null;
}

export interface CrearVersionPromptIaRequest {
  nombre: string;
  descripcion?: string | null;
  rolContexto: string;
  tarea: string;
  reglas?: string | null;
  formatoSalida: string;
  ejemplos?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PromptIaService {
  private readonly BASE = `${API_BASE_URL}/api/prompts-ia`;

  constructor(private http: HttpClient) {}

  getPrompts(): Observable<PromptIaListItemDto[]> {
    return this.http.get<PromptIaListItemDto[]>(this.BASE);
  }

  getVersiones(codigo: string): Observable<PromptIaVersionDto[]> {
    return this.http.get<PromptIaVersionDto[]>(`${this.BASE}/${codigo}`);
  }

  crearPrompt(request: CrearPromptIaRequest): Observable<PromptIaVersionDto> {
    return this.http.post<PromptIaVersionDto>(this.BASE, request);
  }

  crearVersion(codigo: string, request: CrearVersionPromptIaRequest): Observable<PromptIaVersionDto> {
    return this.http.post<PromptIaVersionDto>(`${this.BASE}/${codigo}/versiones`, request);
  }

  activarVersion(promptIaId: number): Observable<PromptIaVersionDto> {
    return this.http.put<PromptIaVersionDto>(`${this.BASE}/versiones/${promptIaId}/activar`, null);
  }
}
