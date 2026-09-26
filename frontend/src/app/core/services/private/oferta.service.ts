import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../constants/api-base-url';

export type OfertaOrigenEntrada = 'texto' | 'imagen' | 'ambos';
export type OfertaEstado = 'Analizada' | 'PerfilAsignado' | 'EnviadaPorCorreo';

/** Atributos adicionales de la oferta -- de solo texto libre (la IA los transcribe tal
 * cual los redactó el reclutador, no intenta clasificarlos en categorías fijas, porque
 * cada oferta los expresa de forma distinta). Comunes a OfertaDto/UpsertOfertaRequest/
 * OfertaAnalizadaDto, así que van en una sola interfaz reutilizada por las tres. */
export interface OfertaAtributosDetallados {
  modalidad: string | null;
  tipoContrato: string | null;
  moneda: string | null;
  duracion: string | null;
  horario: string | null;
  experienciaRequerida: string | null;
  stackTecnologico: string | null;
  nivelIdioma: string | null;
}

export interface OfertaDto extends Partial<OfertaAtributosDetallados> {
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
  fechaEnvioCorreo: string | null;
}

export interface UpsertOfertaRequest extends Partial<OfertaAtributosDetallados> {
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

/** Respuesta de POST /ofertas/analizar -- todavía no persistida (se revisa/edita antes de guardar). */
export interface OfertaAnalizadaDto extends Partial<OfertaAtributosDetallados> {
  cargo: string;
  empresa: string;
  descripcion: string | null;
  correoReclutador: string | null;
  nombreReclutador: string | null;
  textoOriginal: string;
  origenEntrada: OfertaOrigenEntrada;
  /** true si el CV todavía no tiene una versión activa propia de EXTRACTOR_OFERTA
   * y se usó el prompt por defecto del sistema. */
  promptPorDefecto: boolean;
}

export interface SeleccionarPerfilRequest {
  cargo: string;
  empresa: string;
  descripcion?: string | null;
}

/** Respuesta de POST /ofertas/seleccionar-perfil -- todavía no aplica nada. Siempre
 * apunta a un Perfil ya existente del candidato -- este flujo no crea perfiles nuevos. */
export interface PerfilSugeridoDto {
  perfilId: number;
  perfilNombre: string;
  razon: string;
  /** true si el CV todavía no tiene una versión activa propia de SELECTOR_PERFIL
   * y se usó el prompt por defecto del sistema. */
  promptPorDefecto: boolean;
}

/** Borrador de correo redactado por IA -- no persiste nada, se revisa/edita antes de
 * POST .../enviar-correo. */
export interface CorreoBorradorDto {
  asunto: string;
  cuerpo: string;
  /** true si el CV todavía no tiene una versión activa propia de
   * REDACTOR_CORREO_OFERTA y se usó el prompt por defecto del sistema. */
  promptPorDefecto: boolean;
}

/** Valores finales (posiblemente editados por el usuario) para el envío real -- no
 * vuelve a llamar a la IA. */
export interface EnviarCorreoRequest {
  destinatario: string;
  asunto: string;
  cuerpo: string;
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

  /** Extrae cargo/empresa/descripción/reclutador con IA. Al menos texto o archivo debe venir con contenido. */
  analizarOferta(texto: string | null, archivo: File | null): Observable<OfertaAnalizadaDto> {
    const formData = new FormData();
    if (texto) formData.append('texto', texto);
    if (archivo) formData.append('archivo', archivo);
    return this.http.post<OfertaAnalizadaDto>(`${this.BASE}/analizar`, formData);
  }

  /** Sugiere reutilizar un Perfil existente o crear uno nuevo, con IA. No persiste nada. */
  seleccionarPerfil(request: SeleccionarPerfilRequest): Observable<PerfilSugeridoDto> {
    return this.http.post<PerfilSugeridoDto>(`${this.BASE}/seleccionar-perfil`, request);
  }

  /** Redacta con IA el asunto/cuerpo del correo para el reclutador de esta oferta. No
   * persiste ni envía nada. */
  redactarCorreo(ofertaId: number): Observable<CorreoBorradorDto> {
    return this.http.post<CorreoBorradorDto>(`${this.BASE}/${ofertaId}/redactar-correo`, null);
  }

  /** Envía el correo al reclutador con el CV ya construido del Perfil asignado adjunto en PDF. */
  enviarCorreo(ofertaId: number, request: EnviarCorreoRequest): Observable<OfertaDto> {
    return this.http.post<OfertaDto>(`${this.BASE}/${ofertaId}/enviar-correo`, request);
  }
}
