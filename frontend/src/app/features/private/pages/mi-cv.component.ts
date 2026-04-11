import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { filter, skip, takeUntil } from 'rxjs/operators';
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

@Component({
  selector: 'app-mi-cv',
  standalone: false,
  template: `
    <div class="page-header cv-mi-screen-only">
      <div>
        <h4><i class="bi bi-file-earmark-person-fill me-2 text-primary"></i>Mi CV</h4>
        <span class="text-muted small">
          Vista previa en ancho tamaño carta (8,5"); un solo bloque con scroll. Al imprimir o guardar PDF el
          navegador pagina automáticamente.
        </span>
        <div *ngIf="!loading" class="mt-2 d-flex flex-wrap align-items-center gap-2 cv-mi-plantilla-bar">
          <span class="small text-muted mb-0 d-inline-flex align-items-center text-nowrap">
            <i class="bi bi-palette2 me-1 text-primary" aria-hidden="true"></i>
            Plantilla
          </span>
          <div
            class="d-inline-flex align-items-center cv-mi-plantilla-dots"
            role="group"
            aria-label="Elegir plantilla por color">
            <button
              *ngFor="let t of plantillas"
              type="button"
              class="cv-mi-plantilla-dot"
              [class.cv-mi-plantilla-dot--active]="t.codigo === plantillaCodigo"
              [style.background-color]="t.color"
              [disabled]="savingPlantilla"
              [attr.aria-pressed]="t.codigo === plantillaCodigo"
              [attr.title]="t.nombre + ' — ' + t.resumen"
              (click)="onPlantillaSelect(t.codigo)">
              <span class="visually-hidden">{{ t.nombre }}</span>
            </button>
          </div>
          <span
            class="small cv-mi-plantilla-nombre text-truncate"
            [style.borderLeftColor]="plantillaColor"
            [attr.title]="plantillaNombre + ' — ' + plantillaResumen">
            {{ plantillaNombre }}
          </span>
          <span *ngIf="savingPlantilla" class="small text-muted d-inline-flex align-items-center">
            <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            Guardando…
          </span>
          <span *ngIf="hayCambiosPlantilla && !savingPlantilla" class="small text-warning-emphasis">
            Cambios sin guardar
          </span>
          <button
            type="button"
            class="btn btn-primary btn-sm"
            [disabled]="!hayCambiosPlantilla || savingPlantilla"
            (click)="guardarPlantilla()">
            Guardar plantilla
          </button>
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm"
            [disabled]="!hayCambiosPlantilla || savingPlantilla"
            (click)="revertirPlantilla()">
            Cancelar
          </button>
        </div>
      </div>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center" (click)="imprimir()">
          <i class="bi bi-printer-fill me-1"></i>Imprimir / PDF
        </button>
      </div>
    </div>

    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <div *ngIf="!loading">
      <app-cv-plantilla-preview [vm]="previewVm" [vis]="this"></app-cv-plantilla-preview>
    </div>
  `,
})
export class MiCvComponent implements OnInit, OnDestroy, CvPreviewVisibilidad {
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
  private visibilidadMap = new Map<string, boolean>();
  private readonly destroy$ = new Subject<void>();

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
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        skip(1),
        takeUntil(this.destroy$)
      )
      .subscribe(e => {
        if (e.urlAfterRedirects.includes('/mi-cv')) {
          this.cargarDatos();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
        aspiracionSalarialPesos: x.aspiracionSalarialPesos,
        aspiracionSalarialDolares: x.aspiracionSalarialDolares,
        experienciaPerfilAnios: x.experienciaPerfilAnios,
      })),
      experiencias: this.experiencias.map(e => ({
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
      formaciones: this.formaciones.map(f => ({
        formacionId: f.formacionId,
        titulo: f.titulo,
        institucion: f.institucion,
        tipoFormacion: f.tipoFormacion,
        fechaInicio: f.fechaInicio,
        fechaFin: f.fechaFin,
        adjuntoSoporte: f.adjuntoSoporte,
      })),
      habilidades: this.habilidades.map(h => ({
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
      proyectos: this.proyectos.map(pr => ({
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
      redesSociales: this.redes.map(r => ({
        redSocialId: r.redSocialId,
        nombreRed: r.nombreRed,
        linkPublico: r.linkPublico,
        usuarioContacto: r.usuarioContacto,
      })),
      referenciasLaborales: this.referencias
        .filter(r => (r.tipoReferencia ?? '').toLowerCase() === 'laboral')
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

  visibleSeccion(seccion: string): boolean {
    return this.isVisible(seccion);
  }

  visibleAtributo(seccion: string, attr: string): boolean {
    return this.isVisible(seccion) && this.isVisible(`${seccion}.${attr}`);
  }

  /** Si la clave no está guardada en BD, se considera visible (retrocompatibilidad). */
  visibleAtributoSafe(seccion: string, attr: string): boolean {
    if (!this.isVisible(seccion)) return false;
    const key = `${seccion}.${attr}`;
    if (!this.visibilidadMap.has(key)) return true;
    return this.visibilidadMap.get(key) === true;
  }

  visibleBloqueFormacion(bloque: 'formacion-academica' | 'diplomados' | 'certificaciones' | 'cursos'): boolean {
    if (this.visibilidadMap.has(bloque)) {
      return this.isVisible(bloque);
    }
    return this.isVisible('educacion');
  }

  visibleDescargarSoporte(
    bloque: 'formacion-academica' | 'diplomados' | 'certificaciones' | 'cursos',
    attr: string
  ): boolean {
    if (!this.visibleBloqueFormacion(bloque)) return false;
    const key = `${bloque}.${attr}`;
    if (!this.visibilidadMap.has(key)) return true;
    return this.visibilidadMap.get(key) === true;
  }

  /** Secciones que siguen presentes en el CV aunque no tengan interruptor de sección en configuración. */
  private seccionSiempreVisibleEnCv(key: string): boolean {
    const k = (key ?? '').trim().toLowerCase();
    return (
      k === 'datos-personales' ||
      k === 'perfil' ||
      k === 'experiencia' ||
      k === 'formacion-academica'
    );
  }

  private isVisible(key: string): boolean {
    const k = key.trim().toLowerCase();
    if (this.seccionSiempreVisibleEnCv(k)) return true;
    if (!this.visibilidadMap.has(k)) return true;
    return this.visibilidadMap.get(k) === true;
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
      visibilidad: this.cvEditorService.getVisibilidad(),
      presentacion: this.cvEditorService.getPresentacion(),
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
        visibilidad,
        presentacion,
      }) => {
        this.personales = personales;
        this.perfiles = perfiles;
        this.experiencias = experiencias;
        this.formaciones = formaciones;
        this.habilidades = habilidades;
        this.proyectos = proyectos;
        this.redes = redes;
        this.referencias = referencias;
        this.setVisibilidad(visibilidad);
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

  private setVisibilidad(data: VisibilidadSeccionDto[]): void {
    this.visibilidadMap.clear();
    data.forEach(v => this.visibilidadMap.set((v.seccion ?? '').trim().toLowerCase(), v.visible));
  }
}
