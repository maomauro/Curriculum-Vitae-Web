import { normalizeCvPlantillaCodigo } from '../../core/constants/cv-plantillas';
import type { CvDetalleDto } from '../../core/services/public/public.service';
import type {
  CvPreviewFormacionVm,
  CvPreviewHabilidadVm,
  CvPreviewPerfilVm,
  CvPreviewPersonalesVm,
  CvPreviewProyectoVm,
  CvPreviewReferenciaVm,
  CvPreviewVm,
} from '../models/cv-preview-vm';

export function cvDetalleDtoToPreviewVm(d: CvDetalleDto): CvPreviewVm {
  const p = d.personales;
  const personales: CvPreviewPersonalesVm | null = !p
    ? null
    : {
        nombreCompleto: (p.nombreCompleto ?? '').trim() || 'Candidato',
        fotoUrl: p.fotoUrl?.trim() || null,
        email: p.email?.trim() || null,
        telefono: p.celular?.trim() || null,
        ciudad: p.ciudad?.trim() || null,
        pais: p.pais?.trim() || null,
      };

  const perfiles: CvPreviewPerfilVm[] = (d.perfiles ?? []).map(x => ({
    perfilId: x.perfilId,
    nombrePerfil: x.nombrePerfil,
    descripcionPerfil: x.descripcionPerfil,
    esActivo: x.esActivo,
    aspiracionSalarialPesos: x.aspiracionSalarialPesos,
    aspiracionSalarialDolares: x.aspiracionSalarialDolares,
  }));

  const experiencias = (d.experiencias ?? []).map(x => ({
    experienciaId: x.experienciaId,
    empresa: x.empresa,
    cargo: x.cargo,
    fechaInicio: x.fechaInicio,
    fechaFin: x.fechaFin,
    esActual: x.esActual,
    funciones: x.funciones,
    tipoContrato: x.tipoContrato,
  }));

  const formaciones: CvPreviewFormacionVm[] = (d.formaciones ?? []).map(x => ({
    formacionId: x.formacionId,
    titulo: x.titulo,
    institucion: x.institucion,
    tipoFormacion: x.tipoFormacion,
    fechaInicio: x.fechaInicio,
    fechaFin: x.fechaFin,
  }));

  const habilidades: CvPreviewHabilidadVm[] = (d.habilidades ?? []).map(x => ({
    habilidadId: x.habilidadId,
    nombre: x.nombre,
    tipo: x.tipo,
    nivel: x.nivel,
    descripcion: x.descripcion,
    nivelLectura: x.nivelLectura,
    nivelEscritura: x.nivelEscritura,
    nivelEscucha: x.nivelEscucha,
    nivelHabla: x.nivelHabla,
  }));

  const proyectos: CvPreviewProyectoVm[] = (d.proyectos ?? []).map(x => ({
    proyectoId: x.proyectoId,
    nombreProyecto: x.nombreProyecto,
    rol: x.rol,
    equipoTamano: x.equipoTamano,
    duracionMeses: x.duracionMeses,
    stackTecnologico: x.stackTecnologico,
    aporte: x.aporte,
    logro: x.logro,
  }));

  const redesSociales = (d.redesSociales ?? []).map(x => ({
    redSocialId: x.redSocialId,
    nombreRed: x.nombreRed,
    linkPublico: x.linkPublico,
    usuarioContacto: x.usuarioContacto,
  }));

  const referenciasLaborales: CvPreviewReferenciaVm[] = (d.referencias ?? []).map(x => ({
    referenciaId: x.referenciaId,
    experienciaId: null,
    nombre: x.nombre,
    apellido: x.apellido,
    cargo: x.cargo,
    empresa: x.empresa,
  }));

  return {
    plantillaCodigo: normalizeCvPlantillaCodigo(d.plantillaCodigo),
    experienciaLaboralMesesAcumulados: d.experienciaLaboralMesesAcumulados ?? 0,
    personales,
    perfiles,
    experiencias,
    formaciones,
    habilidades,
    proyectos,
    redesSociales,
    referenciasLaborales,
  };
}
