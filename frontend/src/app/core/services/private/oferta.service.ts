import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../constants/api-base-url';

export type OfertaOrigenEntrada = 'texto' | 'imagen';
export type OfertaEstado = 'Analizada' | 'PerfilAsignado' | 'CvGenerado';

export interface OfertaDto {
  ofertaId: number;
  cargo: string;
  empresa: string;
  descripcion: string | null;
  correoReclutador: string | null;
  nombreReclutador: string | null;
  textoOriginal: string;
  origenEntrada: OfertaOrigenEntrada;
  estado: OfertaEstado;
  perfilId: number | null;
  fechaAnalisis: string;
}

export interface UpsertOfertaRequest {
  cargo: string;
  empresa: string;
  descripcion?: string | null;
  correoReclutador?: string | null;
  nombreReclutador?: string | null;
  textoOriginal: string;
  origenEntrada: OfertaOrigenEntrada;
  estado: OfertaEstado;
  perfilId?: number | null;
}

@Injectable({ providedIn: 'root' })
export class OfertaService {
  private readonly BASE = `${API_BASE_URL}/api/cv/ofertas`;

  constructor(private http: HttpClient) {}

  getOfertas(): Observable<OfertaDto[]> {
    return this.http.get<OfertaDto[]>(this.BASE);
  }

  crearOferta(request: UpsertOfertaRequest): Observable<OfertaDto> {
    return this.http.post<OfertaDto>(this.BASE, request);
  }

  actualizarOferta(ofertaId: number, request: UpsertOfertaRequest): Observable<OfertaDto> {
    return this.http.put<OfertaDto>(`${this.BASE}/${ofertaId}`, request);
  }

  eliminarOferta(ofertaId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${ofertaId}`);
  }
}
