import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../constants/api-base-url';

// ── DTOs (espejo de DashboardDtos.cs) ────────────────────────────────────────

export interface DashboardStatsDto {
  totalVisitas: number;
  totalContactos: number;
  alertasNoLeidas: number;
  porcentajeCompletitud: number;
  ultimaVisita: string | null;
  fechaActualizacion: string;
}

export interface ContactoDto {
  visitanteContactoId: number;
  nombre: string | null;
  correo: string;
  empresa: string | null;
  motivoContacto: string | null;
  asunto: string | null;
  mensaje: string | null;
  fechaContacto: string;
  esLeido: boolean;
}

export interface NotificacionItemDto {
  alertaVisitaId: number;
  tipoVisita: string | null;
  titulo: string | null;
  descripcion: string | null;
  esLeida: boolean;
  fechaVisita: string;
}

export interface NotificacionesResumenDto {
  conteoNoLeidas: number;
  recientes: NotificacionItemDto[];
}

// ── Servicio ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly BASE = `${API_BASE_URL}/api`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStatsDto> {
    return this.http.get<DashboardStatsDto>(`${this.BASE}/dashboard/stats`);
  }

  getContactos(): Observable<ContactoDto[]> {
    return this.http.get<ContactoDto[]>(`${this.BASE}/contactos`);
  }

  marcarContactoLeido(id: number): Observable<void> {
    return this.http.put<void>(`${this.BASE}/contactos/${id}/leer`, {});
  }

  getNotificaciones(limite = 10): Observable<NotificacionesResumenDto> {
    const params = new HttpParams().set('limite', limite);
    return this.http.get<NotificacionesResumenDto>(`${this.BASE}/notificaciones`, { params });
  }
}
