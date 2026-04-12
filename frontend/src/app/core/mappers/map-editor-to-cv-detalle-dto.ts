import type { CvDetalleDto } from '../services/public/public.service';
import type {
  ExperienciaDto,
  FormacionDto,
  HabilidadDto,
  PerfilDto,
  PersonalesDto,
  PresentacionCvDto,
  ProyectoDto,
  RedSocialDto,
  ReferenciaDto,
} from '../services/private/cv-editor.service';

/** Adapta respuestas del editor privado al DTO de detalle público (analíticas compartidas). */
export function mapEditorToCvDetalleDto(
  personales: PersonalesDto | null,
  presentacion: PresentacionCvDto,
  perfiles: PerfilDto[],
  experiencias: ExperienciaDto[],
  formaciones: FormacionDto[],
  habilidades: HabilidadDto[],
  proyectos: ProyectoDto[],
  referencias: ReferenciaDto[],
  redes: RedSocialDto[]
): CvDetalleDto {
  const nombreCompleto = !personales
    ? null
    : [personales.primerNombre, personales.segundoNombre, personales.primerApellido, personales.segundoApellido]
        .filter(Boolean)
        .join(' ')
        .trim() || null;

  return {
    curriculumId: personales?.curriculumId ?? 0,
    urlPublica: presentacion.urlPublica ?? '',
    plantillaCodigo: presentacion.plantillaCodigo ?? 'clasico',
    experienciaLaboralMesesAcumulados: presentacion.experienciaLaboralMesesAcumulados ?? 0,
    personales: !personales
      ? null
      : {
          nombreCompleto,
          fotoUrl: personales.fotoUrl?.trim() || null,
          ciudad: personales.ciudad?.trim() || null,
          pais: personales.pais?.trim() || null,
          celular: personales.celular?.trim() || null,
          email: personales.email?.trim() || null,
        },
    perfiles: perfiles.map(p => ({
      perfilId: p.perfilId,
      nombrePerfil: p.nombrePerfil,
      descripcionPerfil: p.descripcionPerfil,
      aspiracionSalarialPesos: p.aspiracionSalarialPesos,
      aspiracionSalarialDolares: p.aspiracionSalarialDolares,
      esActivo: p.esActivo,
    })),
    experiencias: experiencias.map(e => ({
      experienciaId: e.experienciaId,
      empresa: e.empresa,
      cargo: e.cargo,
      sector: e.sector,
      fechaInicio: e.fechaInicio,
      fechaFin: e.fechaFin,
      esActual: e.esActual,
      funciones: e.funciones,
      tipoContrato: e.tipoContrato,
    })),
    formaciones: formaciones.map(f => ({
      formacionId: f.formacionId,
      titulo: f.titulo,
      institucion: f.institucion,
      area: f.area,
      tipoFormacion: f.tipoFormacion,
      fechaInicio: f.fechaInicio,
      fechaFin: f.fechaFin,
    })),
    habilidades: habilidades.map(h => ({
      habilidadId: h.habilidadId,
      nombre: h.nombre,
      tipo: h.tipo,
      nivel: h.nivel,
      descripcion: h.descripcion,
      nivelLectura: h.nivelLectura,
      nivelEscritura: h.nivelEscritura,
      nivelEscucha: h.nivelEscucha,
      nivelHabla: h.nivelHabla,
    })),
    proyectos: proyectos.map(pr => ({
      proyectoId: pr.proyectoId,
      nombreProyecto: pr.nombreProyecto,
      rol: pr.rol,
      stackTecnologico: pr.stackTecnologico,
      aporte: pr.aporte,
      logro: pr.logro,
      equipoTamano: pr.equipoTamano,
      duracionMeses: pr.duracionMeses,
    })),
    referencias: referencias.map(r => ({
      referenciaId: r.referenciaId,
      tipoReferencia: r.tipoReferencia,
      nombre: r.nombre,
      apellido: r.apellido,
      cargo: r.cargo,
      empresa: r.empresa,
    })),
    redesSociales: redes.map(r => ({
      redSocialId: r.redSocialId,
      nombreRed: r.nombreRed,
      linkPublico: r.linkPublico,
      usuarioContacto: r.usuarioContacto,
    })),
    dashboardPublicoActivo: true,
    dashboardMostrarMetricas: true,
    dashboardMostrarGraficas: true,
  };
}
