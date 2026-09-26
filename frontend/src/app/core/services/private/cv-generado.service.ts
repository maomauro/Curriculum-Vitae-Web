import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../constants/api-base-url';

/** Una experiencia condensada por la IA: cabecera (cargo, empresa y período en una
 * línea) y una selección/resumen de 2-4 funciones reales relevantes al perfil -- la
 * experiencia original puede traer muchas funciones, no se aplanan a una sola frase. */
export interface ExperienciaCondensadaDto {
  cabecera: string;
  funciones: string[];
}

/** Una habilidad elegida por la IA -- el nombre lo redacta la IA, el tipo (Tecnica /
 * Blanda / Idioma / Otra) lo resuelve el backend cruzando contra las Habilidades reales
 * del candidato (puede ser null si no encontró coincidencia). */
export interface HabilidadCondensadaDto {
  nombre: string;
  tipo: string | null;
}

/** Contenido redactado por la IA: experiencia/formación/proyectos/habilidades
 * condensados (para caber en máximo 3 hojas). Sin resumen del perfil ni datos de
 * contacto -- Mi CV muestra el Perfil y los datos reales de Personales tal cual, nunca
 * los de la IA. */
export interface ContenidoCvGeneradoDto {
  experiencia: ExperienciaCondensadaDto[];
  educacion: string[];
  proyectos: string[];
  habilidades: HabilidadCondensadaDto[];
}

/** CV general de un Perfil (sin oferta de por medio): la IA redacta el contenido
 * condensado, mostrado con la misma apariencia visual (colores, tipografía, foto y
 * encabezado) que "Profesional" -- ver MiCvComponent. Uno por Perfil. */
export interface CvGeneradoDto {
  cvGeneradoId: number;
  perfilId: number;
  perfilNombre: string;
  contenido: ContenidoCvGeneradoDto;
  fechaGeneracion: string;
  /** true si el CV todavía no tiene una versión activa propia de GENERADOR_CV_PERFIL
   * y se usó el prompt por defecto del sistema. */
  promptPorDefecto: boolean;
}

@Injectable({ providedIn: 'root' })
export class CvGeneradoService {
  private readonly BASE = `${API_BASE_URL}/api/cv`;

  constructor(private http: HttpClient) {}

  listar(): Observable<CvGeneradoDto[]> {
    return this.http.get<CvGeneradoDto[]>(`${this.BASE}/cv-generado`);
  }

  generar(perfilId: number): Observable<CvGeneradoDto> {
    return this.http.post<CvGeneradoDto>(`${this.BASE}/perfiles/${perfilId}/generar-cv`, {});
  }
}
