import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../constants/api-base-url';

/** Nunca incluye la contraseña -- ni cifrada ni en texto plano. El remitente no viaja
 * acá: siempre es el correo de Información Personal en el momento de enviar. */
export interface ConfiguracionCorreoDto {
  configuracionCorreoId: number;
  host: string;
  puerto: number;
  usarTls: boolean;
  tieneConfiguracion: boolean;
  fechaActualizacion: string | null;
}

/** password null/vacío en una actualización = no cambiar la contraseña guardada. */
export interface GuardarConfiguracionCorreoRequest {
  host: string;
  puerto: number;
  usarTls: boolean;
  password?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionCorreoService {
  private readonly BASE = `${API_BASE_URL}/api/cv/configuracion-correo`;

  constructor(private http: HttpClient) {}

  getConfig(): Observable<ConfiguracionCorreoDto> {
    return this.http.get<ConfiguracionCorreoDto>(this.BASE);
  }

  guardarConfig(request: GuardarConfiguracionCorreoRequest): Observable<ConfiguracionCorreoDto> {
    return this.http.put<ConfiguracionCorreoDto>(this.BASE, request);
  }
}
