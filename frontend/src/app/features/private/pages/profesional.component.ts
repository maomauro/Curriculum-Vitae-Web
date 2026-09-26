import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  CvEditorService,
  ExperienciaDto,
  FormacionDto,
  HabilidadDto,
  PerfilDto,
  PersonalesDto,
  ProyectoDto,
  RedSocialDto,
  ReferenciaDto,
  VisibilidadSeccionDto,
} from '../../../core/services/private/cv-editor.service';
import {
  CV_PLANTILLAS,
  type CvPlantillaCodigo,
  normalizeCvPlantillaCodigo,
} from '../../../core/constants/cv-plantillas';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import type { CvPreviewVm, CvPreviewVisibilidad } from '../../../shared/models/cv-preview-vm';
import { VisibilidadSeccionResolver } from '../../../core/utils/visibilidad-seccion-resolver';

@Component({
  selector: 'app-profesional',
  standalone: false,
  templateUrl: './profesional.component.html',
})
export class ProfesionalComponent implements OnInit, CvPreviewVisibilidad {
  readonly plantillas = CV_PLANTILLAS;

  loading = false;
  savingPlantilla = false;

  personales: PersonalesDto | null = null;
  perfiles: PerfilDto[] = [];
  experiencias: ExperienciaDto[] = [];
  formaciones: FormacionDto[] = [];
  habilidades: HabilidadDto[] = [];
  proyectos: ProyectoDto[] = [];
  redes: RedSocialDto[] = [];
  referencias: ReferenciaDto[] = [];
  private visibilidadSeccion: VisibilidadSeccionDto[] = [];

  /** Plantilla de presentación (API). */
  plantillaCodigo: CvPlantillaCodigo = 'clasico';
  private plantillaCodigoPersistida: CvPlantillaCodigo = 'clasico';
  experienciaLaboralMesesAcumulados = 0;

  get plantillaResumen(): string {
    return CV_PLANTILLAS.find(p => p.codigo === this.plantillaCodigo)?.resumen ?? '';
  }

  get plantillaNombre(): string {
    return CV_PLANTILLAS.find(p => p.codigo === this.plantillaCodigo)?.nombre ?? 'Clásico';
  }

  get plantillaColor(): string {
    return CV_PLANTILLAS.find(p => p.codigo === this.plantillaCodigo)?.color ?? '#2c7be5';
  }

  get hayCambiosPlantilla(): boolean {
    return this.plantillaCodigo !== this.plantillaCodigoPersistida;
  }

  constructor(
    private cvEditorService: CvEditorService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  imprimir(): void {
    window.print();
  }

  onPlantillaSelect(raw: CvPlantillaCodigo | string): void {
    const codigo = normalizeCvPlantillaCodigo(raw);
    if (codigo === this.plantillaCodigo || this.savingPlantilla) {
      return;
    }
    this.plantillaCodigo = codigo;
  }

  guardarPlantilla(): void {
    if (!this.hayCambiosPlantilla || this.savingPlantilla) return;
    const objetivo = this.plantillaCodigo;
    const anterior = this.plantillaCodigoPersistida;
    this.savingPlantilla = true;
    this.cvEditorService.updatePresentacion({ plantillaCodigo: objetivo }).subscribe({
      next: p => {
        this.plantillaCodigo = normalizeCvPlantillaCodigo(p.plantillaCodigo);
        this.plantillaCodigoPersistida = this.plantillaCodigo;
        this.experienciaLaboralMesesAcumulados = p.experienciaLaboralMesesAcumulados ?? 0;
        this.savingPlantilla = false;
        this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
      },
      error: () => {
        this.plantillaCodigo = anterior;
        this.plantillaCodigoPersistida = anterior;
        this.savingPlantilla = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.saveError);
      },
    });
  }

  revertirPlantilla(): void {
    if (this.savingPlantilla) return;
    this.plantillaCodigo = this.plantillaCodigoPersistida;
  }

  /** Modelo único para la vista de plantilla (compartida con el portal público). */
  get previewVm(): CvPreviewVm {
    const p = this.personales;
    const nombreCompleto = !p
      ? 'Tu nombre'
      : [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido]
          .filter(Boolean)
          .join(' ')
          .trim() || 'Tu nombre';
    return {
      plantillaCodigo: this.plantillaCodigo,
      experienciaLaboralMesesAcumulados: this.experienciaLaboralMesesAcumulados,
      personales: !p
        ? null
        : {
            nombreCompleto,
            fotoUrl: p.fotoUrl?.trim() || null,
            email: p.email?.trim() || null,
            telefono: p.celular?.trim() || p.telefonoFijo?.trim() || null,
            ciudad: p.ciudad?.trim() || null,
            pais: p.pais?.trim() || null,
          },
      perfiles: this.perfiles.map(x => ({
        perfilId: x.perfilId,
        nombrePerfil: x.nombrePerfil,
        descripcionPerfil: x.descripcionPerfil,
        esActivo: x.esActivo,
        aspiracionSalarialPesos: x.mostrarAspiracionSalarial ? x.aspiracionSalarialPesos : null,
        aspiracionSalarialDolares: x.mostrarAspiracionSalarial ? x.aspiracionSalarialDolares : null,
        experienciaPerfilAnios: x.mostrarExperienciaPerfil ? x.experienciaPerfilAnios : null,
      })),
      experiencias: this.experiencias
        .filter(e => e.mostrarEnCv !== false)
        .map(e => ({
          experienciaId: e.experienciaId,
          empresa: e.empresa,
          cargo: e.cargo,
          fechaInicio: e.fechaInicio,
          fechaFin: e.fechaFin,
          esActual: e.esActual,
          funciones: e.funciones,
          tipoContrato: e.tipoContrato,
          adjuntoSoporte: e.adjuntoSoporte,
        })),
      formaciones: this.formaciones.filter(f => f.mostrarEnCv !== false).map(f => ({
        formacionId: f.formacionId,
        titulo: f.titulo,
        institucion: f.institucion,
        tipoFormacion: f.tipoFormacion,
        fechaInicio: f.fechaInicio,
        fechaFin: f.fechaFin,
        adjuntoSoporte: f.adjuntoSoporte,
      })),
      habilidades: this.habilidades.filter(h => h.mostrarEnCv !== false).map(h => ({
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
      proyectos: this.proyectos.filter(pr => pr.mostrarEnCv !== false).map(pr => ({
        proyectoId: pr.proyectoId,
        nombreProyecto: pr.nombreProyecto,
        rol: pr.rol,
        equipoTamano: pr.equipoTamano,
        duracionMeses: pr.duracionMeses,
        stackTecnologico: pr.stackTecnologico,
        aporte: pr.aporte,
        logro: pr.logro,
        desafio: pr.desafio,
      })),
      redesSociales: this.redes.filter(r => r.mostrarEnCv !== false).map(r => ({
        redSocialId: r.redSocialId,
        nombreRed: r.nombreRed,
        linkPublico: r.linkPublico,
        usuarioContacto: r.usuarioContacto,
      })),
      referenciasLaborales: this.referencias
        .filter(r => (r.tipoReferencia ?? '').toLowerCase() === 'laboral' && r.mostrarEnCv !== false)
        .map(r => ({
          referenciaId: r.referenciaId,
          experienciaId: r.experienciaId,
          nombre: r.nombre,
          apellido: r.apellido,
          cargo: r.cargo,
          empresa: r.empresa,
          telefono: r.telefono,
        })),
    };
  }

  // Esta vista refleja exactamente lo que verá un visitante: los interruptores de
  // "Contenido de cada pestaña" en Configuración aplican aquí igual que en el CV
  // público (se delega en el mismo resolver que usa la pestaña pública y el panel
  // de vista previa, ver visibilidad-seccion-resolver.ts).
  private get visibilidad(): VisibilidadSeccionResolver {
    return new VisibilidadSeccionResolver(this.visibilidadSeccion);
  }

  visibleSeccion(seccion: string): boolean {
    return this.visibilidad.visibleSeccion(seccion);
  }

  visibleAtributo(seccion: string, attr: string): boolean {
    return this.visibilidad.visibleAtributo(seccion, attr);
  }

  visibleAtributoSafe(seccion: string, attr: string): boolean {
    return this.visibilidad.visibleAtributoSafe(seccion, attr);
  }

  private cargarDatos(): void {
    this.loading = true;
    forkJoin({
      personales: this.cvEditorService.getPersonales(),
      perfiles: this.cvEditorService.getPerfiles(),
      experiencias: this.cvEditorService.getExperiencias(),
      formaciones: this.cvEditorService.getFormaciones(),
      habilidades: this.cvEditorService.getHabilidades(),
      proyectos: this.cvEditorService.getProyectos(),
      redes: this.cvEditorService.getRedesSociales(),
      referencias: this.cvEditorService.getReferencias(),
      presentacion: this.cvEditorService.getPresentacion(),
      visibilidadSeccion: this.cvEditorService.getVisibilidad(),
    }).subscribe({
      next: ({
        personales,
        perfiles,
        experiencias,
        formaciones,
        habilidades,
        proyectos,
        redes,
        referencias,
        presentacion,
        visibilidadSeccion,
      }) => {
        this.personales = personales;
        this.perfiles = perfiles;
        this.experiencias = experiencias;
        this.formaciones = formaciones;
        this.habilidades = habilidades;
        this.proyectos = proyectos;
        this.redes = redes;
        this.referencias = referencias;
        this.visibilidadSeccion = visibilidadSeccion;
        this.plantillaCodigo = normalizeCvPlantillaCodigo(presentacion.plantillaCodigo);
        this.plantillaCodigoPersistida = this.plantillaCodigo;
        this.experienciaLaboralMesesAcumulados = presentacion.experienciaLaboralMesesAcumulados ?? 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      },
    });
  }
}
