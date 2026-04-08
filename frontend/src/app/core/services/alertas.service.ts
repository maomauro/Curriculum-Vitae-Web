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
}

@Injectable({ providedIn: 'root' })
export class AlertasService {
  private readonly BASE = '/api/alertas';

  constructor(private http: HttpClient) {}

  getAlertas(soloNoLeidas = false): Observable<AlertaVisitaDto[]> {
    const params = new HttpParams().set('soloNoLeidas', String(soloNoLeidas));
    return this.http.get<AlertaVisitaDto[]>(this.BASE, { params });
  }

  marcarLeida(id: number): Observable<void> {
    return this.http.put<void>(`${this.BASE}/${id}/leer`, null);
  }

  marcarTodasLeidas(): Observable<void> {
    return this.http.put<void>(`${this.BASE}/leer-todas`, null);
  }

  getConteoNoLeidas(): Observable<number> {
    return this.http.get<{ conteo: number }>(`${this.BASE}/no-leidas/conteo`).pipe(
      map(r => r.conteo)
    );
  }
}
