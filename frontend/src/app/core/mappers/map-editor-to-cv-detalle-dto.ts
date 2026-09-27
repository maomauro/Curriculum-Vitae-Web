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
  VisibilidadSeccionDto,
} from '../services/private/cv-editor.service';

const DASH_PUBLICO = 'dashboard.publico';
const DASH_METRICAS = 'dashboard.metricas';
const DASH_GRAFICAS = 'dashboard.graficas';
const DASH_GRAFICA_EXPERIENCIA = 'dashboard.graficas.experiencia';
const DASH_GRAFICA_FORMACION = 'dashboard.graficas.formacion';
const DASH_GRAFICA_PROYECTOS = 'dashboard.graficas.proyectos';
const DASH_GRAFICA_HABILIDADES = 'dashboard.graficas.habilidades';

function buscarVisible(vis: VisibilidadSeccionDto[], seccion: string): boolean | null {
  const row = vis.find(v => v.seccion === seccion);
  return row ? row.visible : null;
}

/** Misma lógica que PublicCvService.ResolverFlagsDashboardPublico (backend). Se duplica acá
 * porque el Dashboard privado arma su CvDetalleDto a partir de los endpoints del editor
 * (GetVisibilidadAsync), no del endpoint público que ya la devuelve resuelta -- así el
 * Dashboard privado muestra exactamente lo mismo que ve un visitante, no todo sin filtrar. */
function resolverFlagsDashboard(vis: VisibilidadSeccionDto[]): {
  activo: boolean;
  metricas: boolean;
  graficas: boolean;
  graficaExperiencia: boolean;
  graficaFormacion: boolean;
  graficaProyectos: boolean;
  graficaHabilidades: boolean;
} {
  const master = buscarVisible(vis, DASH_PUBLICO) ?? true;
  const metricas = buscarVisible(vis, DASH_METRICAS) ?? true;
  const graficas = buscarVisible(vis, DASH_GRAFICAS) ?? true;
  const mg = master && graficas;
  return {
    activo: master,
    metricas: master && metricas,
    graficas: mg,
    graficaExperiencia: mg && (buscarVisible(vis, DASH_GRAFICA_EXPERIENCIA) ?? true),
    graficaFormacion: mg && (buscarVisible(vis, DASH_GRAFICA_FORMACION) ?? true),
    graficaProyectos: mg && (buscarVisible(vis, DASH_GRAFICA_PROYECTOS) ?? true),
    graficaHabilidades: mg && (buscarVisible(vis, DASH_GRAFICA_HABILIDADES) ?? true),
  };
}

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
  redes: RedSocialDto[],
  visibilidad: VisibilidadSeccionDto[]
): CvDetalleDto {
  const dash = resolverFlagsDashboard(visibilidad);
  const experienciasVisibles = experiencias.filter(e => e.mostrarEnCv !== false);
  const formacionesVisibles = formaciones.filter(f => f.mostrarEnCv !== false);
  const habilidadesVisibles = habilidades.filter(h => h.mostrarEnCv !== false);
  const proyectosVisibles = proyectos.filter(pr => pr.mostrarEnCv !== false);
  const redesVisibles = redes.filter(r => r.mostrarEnCv !== false);
  const idsExpCv = new Set(experienciasVisibles.map(e => e.experienciaId));

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
      experienciaPerfilAnios: p.mostrarExperienciaPerfil ? p.experienciaPerfilAnios : null,
      aspiracionSalarialPesos: p.mostrarAspiracionSalarial ? p.aspiracionSalarialPesos : null,
      aspiracionSalarialDolares: p.mostrarAspiracionSalarial ? p.aspiracionSalarialDolares : null,
      esActivo: p.esActivo,
    })),
    experiencias: experienciasVisibles.map(e => ({
      experienciaId: e.experienciaId,
      empresa: e.empresa,
      cargo: e.cargo,
      sector: e.sector,
      fechaInicio: e.fechaInicio,
      fechaFin: e.fechaFin,
      esActual: e.esActual,
      funciones: e.funciones,
      tipoContrato: e.tipoContrato,
      adjuntoSoporte: e.adjuntoSoporte,
    })),
    formaciones: formacionesVisibles.map(f => ({
      formacionId: f.formacionId,
      titulo: f.titulo,
      institucion: f.institucion,
      area: f.area,
      tipoFormacion: f.tipoFormacion,
      fechaInicio: f.fechaInicio,
      fechaFin: f.fechaFin,
      adjuntoSoporte: f.adjuntoSoporte,
    })),
    habilidades: habilidadesVisibles.map(h => ({
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
    proyectos: proyectosVisibles.map(pr => ({
      proyectoId: pr.proyectoId,
      nombreProyecto: pr.nombreProyecto,
      rol: pr.rol,
      stackTecnologico: pr.stackTecnologico,
      aporte: pr.aporte,
      logro: pr.logro,
      equipoTamano: pr.equipoTamano,
      duracionMeses: pr.duracionMeses,
    })),
    referencias: referencias
      .filter(
        r =>
          r.mostrarEnCv !== false &&
          (r.tipoReferencia !== 'Laboral' ||
            r.experienciaId == null ||
            idsExpCv.has(r.experienciaId))
      )
      .map(r => ({
        referenciaId: r.referenciaId,
        tipoReferencia: r.tipoReferencia,
        nombre: r.nombre,
        apellido: r.apellido,
        cargo: r.cargo,
        empresa: r.empresa,
      })),
    redesSociales: redesVisibles.map(r => ({
      redSocialId: r.redSocialId,
      nombreRed: r.nombreRed,
      linkPublico: r.linkPublico,
      usuarioContacto: r.usuarioContacto,
    })),
    dashboardPublicoActivo: dash.activo,
    dashboardMostrarMetricas: dash.metricas,
    dashboardMostrarGraficas: dash.graficas,
    dashboardMostrarGraficaExperiencia: dash.graficaExperiencia,
    dashboardMostrarGraficaFormacion: dash.graficaFormacion,
    dashboardMostrarGraficaProyectos: dash.graficaProyectos,
    dashboardMostrarGraficaHabilidades: dash.graficaHabilidades,
  };
}
