import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AlertaVisitaDto {
  alertaVisitaId: number;
  curriculumId: number;
  fechaVisita: string;   // DateTime ISO
  origen: string | null;
  tipoVisita: string | null;
  esLeida: boolean;
  titulo: string | null;
  descripcion: string | null;
  ciudad: string | null;
  pais: string | null;
  /** Solo tipo Vista con visitante deduplicado. */
  vistasAcumuladas?: number | null;
}

export interface AlertasPageDto {
  items: AlertaVisitaDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class AlertasService {
  private readonly BASE = '/api/alertas';

  constructor(private http: HttpClient) {}

  getAlertas(
    soloNoLeidas = false,
    tipo = '',
    periodo = 'mes',
    page = 1,
    pageSize = 10
  ): Observable<AlertasPageDto> {
    let params = new HttpParams()
      .set('soloNoLeidas', String(soloNoLeidas))
      .set('periodo', periodo)
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    if (tipo) params = params.set('tipo', tipo);

    return this.http.get<AlertasPageDto>(this.BASE, { params });
  }

  marcarLeida(id: number): Observable<void> {
    return this.http.put<void>(`${this.BASE}/${id}/leer`, null);
  }

  marcarTodasLeidas(): Observable<void> {
    return this.http.put<void>(`${this.BASE}/leer-todas`, null);
  }

  limpiarLeidas(): Observable<{ eliminadas: number }> {
    return this.http.delete<{ eliminadas: number }>(`${this.BASE}/leidas`);
  }

  getConteoNoLeidas(): Observable<number> {
    return this.http.get<{ conteo: number }>(`${this.BASE}/no-leidas/conteo`).pipe(
      map(r => r.conteo)
    );
  }
}
