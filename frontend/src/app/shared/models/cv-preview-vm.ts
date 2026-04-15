import type { CvPlantillaCodigo } from '../../core/constants/cv-plantillas';

/** Visibilidad opcional (Mi CV); si es null, se muestra todo lo que traiga el modelo. */
export interface CvPreviewVisibilidad {
  visibleSeccion(seccion: string): boolean;
  visibleAtributo(seccion: string, attr: string): boolean;
  visibleAtributoSafe(seccion: string, attr: string): boolean;
  visibleBloqueFormacion(bloque: 'formacion-academica' | 'diplomados' | 'certificaciones' | 'cursos'): boolean;
  visibleDescargarSoporte(
    bloque: 'formacion-academica' | 'diplomados' | 'certificaciones' | 'cursos',
    attr: string
  ): boolean;
}

export interface CvPreviewPersonalesVm {
  nombreCompleto: string;
  fotoUrl: string | null;
  email: string | null;
  telefono: string | null;
  ciudad: string | null;
  pais: string | null;
}

export interface CvPreviewPerfilVm {
  perfilId: number;
  nombrePerfil: string | null;
  descripcionPerfil: string | null;
  esActivo: boolean;
  aspiracionSalarialPesos: number | null;
  aspiracionSalarialDolares: number | null;
  experienciaPerfilAnios?: number | null;
}

export interface CvPreviewExperienciaVm {
  experienciaId: number;
  empresa: string | null;
  cargo: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  esActual: boolean;
  funciones: string | null;
  tipoContrato: string | null;
  adjuntoSoporte?: string | null;
}

export interface CvPreviewFormacionVm {
  formacionId: number;
  titulo: string | null;
  institucion: string | null;
  tipoFormacion: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  adjuntoSoporte?: string | null;
}

export interface CvPreviewHabilidadVm {
  habilidadId: number;
  nombre: string;
  tipo: string | null;
  nivel: string | null;
  descripcion: string | null;
  nivelLectura: string | null;
  nivelEscritura: string | null;
  nivelEscucha: string | null;
  nivelHabla: string | null;
}

export interface CvPreviewProyectoVm {
  proyectoId: number;
  nombreProyecto: string | null;
  rol: string | null;
  equipoTamano: number | null;
  duracionMeses: number | null;
  stackTecnologico: string | null;
  aporte: string | null;
  logro: string | null;
  desafio?: string | null;
}

export interface CvPreviewRedVm {
  redSocialId: number;
  nombreRed: string | null;
  linkPublico: string | null;
  usuarioContacto: string | null;
}

export interface CvPreviewReferenciaVm {
  referenciaId: number;
  /** null = solo lista al pie (vista pública agregada). */
  experienciaId: number | null;
  nombre: string;
  apellido: string | null;
  cargo: string | null;
  empresa: string | null;
  telefono?: string | null;
}

export interface CvPreviewVm {
  plantillaCodigo: CvPlantillaCodigo;
  experienciaLaboralMesesAcumulados: number;
  personales: CvPreviewPersonalesVm | null;
  perfiles: CvPreviewPerfilVm[];
  experiencias: CvPreviewExperienciaVm[];
  formaciones: CvPreviewFormacionVm[];
  habilidades: CvPreviewHabilidadVm[];
  proyectos: CvPreviewProyectoVm[];
  redesSociales: CvPreviewRedVm[];
  referenciasLaborales: CvPreviewReferenciaVm[];
}
