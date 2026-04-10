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

    <div *ngIf="!loading" class="cv-mi-letter-wrap">
      <div [class]="previewRootClass">
        <div class="cv-mi-preview-stack">
      <ng-container *ngIf="plantillaCodigo !== 'corporativo'">
        <div
          class="cv-preview-header d-flex align-items-start"
          [class.text-white]="plantillaCodigo === 'clasico'">
          <div class="d-flex align-items-start w-100 cv-preview-header-body">
            <div *ngIf="visibleAtributoSafe('datos-personales','foto')" class="cv-mi-photo-slot me-3">
              <img *ngIf="fotoHeaderUrl" [src]="fotoHeaderUrl" alt="Foto de perfil" class="cv-mi-photo-img" />
              <div *ngIf="!fotoHeaderUrl" class="cv-mi-photo-placeholder" aria-hidden="true">
                {{ inicialesFoto }}
              </div>
            </div>
            <div class="flex-grow-1 min-w-0">
              <div class="fw-bold cv-preview-name">{{ nombreCompleto }}</div>
              <div class="cv-preview-sub" *ngIf="visibleSeccion('perfil')">
                {{ perfilPrincipal?.nombrePerfil || 'Perfil profesional' }}<ng-container *ngIf="perfilPrincipal?.esActivo"> — Perfil activo</ng-container>
              </div>
              <div
                class="small mt-1 cv-mi-trayectoria-acumulada"
                *ngIf="visibleSeccion('experiencia') && trayectoriaCabecera">
                <i class="bi bi-briefcase-fill me-1" aria-hidden="true"></i>{{ trayectoriaCabecera }}
              </div>
              <div class="d-flex flex-wrap mt-2 cv-preview-meta">
                <span *ngIf="visibleAtributoSafe('datos-personales','email') && personales?.email">
                  <i class="bi bi-envelope-fill"></i>{{ personales?.email }}
                </span>
                <span *ngIf="visibleAtributoSafe('datos-personales','telefono') && telefonoContacto">
                  <i class="bi bi-telephone-fill"></i>{{ telefonoContacto }}
                </span>
                <span *ngIf="visibleAtributoSafe('datos-personales','ciudad-pais') && ciudadPais">
                  <i class="bi bi-geo-alt-fill"></i>{{ ciudadPais }}
                </span>
                <span *ngIf="visibleAtributoSafe('datos-personales','linkedin') && linkedin">
                  <i class="bi bi-linkedin"></i>{{ linkedin }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <div class="cv-mi-body">
        <div class="cv-preview-sidebar" *ngIf="plantillaCodigo === 'clasico' || plantillaCodigo === 'corporativo'">
          <div class="cv-corp-identity" *ngIf="plantillaCodigo === 'corporativo'">
            <div class="cv-corp-name">{{ nombreCompleto }}</div>
            <div class="cv-corp-role" *ngIf="visibleSeccion('perfil')">
              {{ perfilPrincipal?.nombrePerfil || 'Perfil profesional' }}<ng-container *ngIf="perfilPrincipal?.esActivo"> — Activo</ng-container>
            </div>
            <div
              class="small mt-1 cv-mi-trayectoria-acumulada"
              *ngIf="visibleSeccion('experiencia') && trayectoriaCabecera">
              <i class="bi bi-briefcase-fill me-1" aria-hidden="true"></i>{{ trayectoriaCabecera }}
            </div>
            <div class="cv-corp-contact">
              <div *ngIf="visibleAtributoSafe('datos-personales','email') && personales?.email">
                <i class="bi bi-envelope-fill me-1" aria-hidden="true"></i>{{ personales?.email }}
              </div>
              <div *ngIf="visibleAtributoSafe('datos-personales','telefono') && telefonoContacto">
                <i class="bi bi-telephone-fill me-1" aria-hidden="true"></i>{{ telefonoContacto }}
              </div>
              <div *ngIf="visibleAtributoSafe('datos-personales','ciudad-pais') && ciudadPais">
                <i class="bi bi-geo-alt-fill me-1" aria-hidden="true"></i>{{ ciudadPais }}
              </div>
              <div *ngIf="visibleAtributoSafe('datos-personales','linkedin') && linkedin"><i class="bi bi-linkedin me-1" aria-hidden="true"></i>{{ linkedin }}</div>
            </div>
          </div>
          <div class="cv-mi-cv-section cv-mi-skill-block" *ngIf="visibleSeccion('habilidades') && habilidadesTecnicas.length">
            <div class="cv-mi-section-title">Habilidades Técnicas</div>
            <div *ngFor="let h of habilidadesTecnicas" class="cv-mi-skill-item">
              <div class="d-flex justify-content-between cv-skill-line" *ngIf="visibleAtributo('habilidades','nombre')">
                <span>{{ h.nombre }}</span><small class="text-muted" *ngIf="visibleAtributo('habilidades','nivel')">{{ h.nivel || '—' }}</small>
              </div>
              <div class="progress cv-progress-preview" *ngIf="visibleAtributo('habilidades','nivel')">
                <div class="progress-bar cv-progress-bar-fill" [style.width.%]="skillPercent(h.nivel)"></div>
              </div>
            </div>
          </div>

          <div class="cv-mi-cv-section cv-mi-skill-block" *ngIf="visibleSeccion('habilidades') && habilidadesBlandas.length">
            <div class="cv-mi-section-title">Habilidades Blandas</div>
            <div *ngFor="let h of habilidadesBlandas" class="cv-mi-skill-item">
              <div class="d-flex justify-content-between cv-skill-line" *ngIf="visibleAtributo('habilidades','nombre')">
                <span>{{ h.nombre }}</span><small class="text-muted" *ngIf="visibleAtributo('habilidades','nivel')">{{ h.nivel || '—' }}</small>
              </div>
              <div class="progress cv-progress-preview" *ngIf="visibleAtributo('habilidades','nivel')">
                <div class="progress-bar cv-progress-bar-fill" [style.width.%]="skillPercent(h.nivel)"></div>
              </div>
            </div>
          </div>

          <div class="cv-mi-cv-section cv-mi-skill-block" *ngIf="visibleSeccion('habilidades') && idiomas.length">
            <div class="cv-mi-section-title">Idiomas</div>
            <div *ngFor="let id of idiomas" class="cv-mi-skill-item">
              <div class="d-flex justify-content-between cv-skill-line" *ngIf="visibleAtributo('habilidades','nombre')">
                <span>{{ id.nombre }}</span><small class="text-muted" *ngIf="visibleAtributo('habilidades','nivel')">{{ id.nivel || '—' }}</small>
              </div>
              <div class="progress cv-progress-preview" *ngIf="visibleAtributo('habilidades','nivel')">
                <div class="progress-bar cv-progress-bar-fill" [style.width.%]="skillPercent(id.nivel)"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="cv-preview-main">
          <div class="cv-mi-section" *ngIf="mostrarBloquePerfil">
            <div class="cv-mi-section-title">Perfil Profesional</div>
            <p class="cv-mi-prose cv-summary-text" *ngIf="perfilPrincipal?.descripcionPerfil">
              {{ perfilPrincipal?.descripcionPerfil }}
            </p>
            <div class="cv-mi-profile-meta" *ngIf="visibleAtributoSafe('perfil','experiencia-perfil') && perfilPrincipal?.experienciaPerfilAnios != null">
              <span class="text-muted">Experiencia (perfil)</span> · {{ perfilPrincipal?.experienciaPerfilAnios }} años
            </div>
            <div class="cv-mi-profile-meta" *ngIf="visibleAtributoSafe('perfil','aspiracion-salarial') && aspiracionTexto">
              <span class="text-muted">Aspiración salarial</span> · {{ aspiracionTexto }}
            </div>
          </div>

          <div class="cv-mi-section" *ngIf="visibleSeccion('experiencia') && experiencias.length">
            <div class="cv-mi-section-title">Experiencia Laboral</div>
            <div class="cv-mi-timeline">
              <div class="timeline-item" *ngFor="let exp of experiencias">
                <div class="timeline-title" *ngIf="exp.cargo">{{ exp.cargo }}</div>
                <div class="timeline-sub" *ngIf="lineaEmpresaContrato(exp)">
                  {{ lineaEmpresaContrato(exp) }}
                </div>
                <div class="timeline-date" *ngIf="exp.fechaInicio">
                  {{ exp.fechaInicio | date:'MMM yyyy' }} —
                  {{ exp.esActual ? 'Presente' : (exp.fechaFin | date:'MMM yyyy') }}
                </div>
                <div class="cv-mi-exp-duration text-muted" *ngIf="exp.fechaInicio">{{ duracionExperiencia(exp) }}</div>
                <ul class="cv-pro-list mb-0 mt-1" *ngIf="esPlantillaProfesional && lineasBulletTexto(exp.funciones).length">
                  <li *ngFor="let linea of lineasBulletTexto(exp.funciones)">{{ linea }}</li>
                </ul>
                <div class="timeline-desc" *ngIf="!esPlantillaProfesional && exp.funciones">{{ exp.funciones }}</div>
                <ng-container *ngIf="visibleAtributoSafe('experiencia','referencia-laboral')">
                  <div class="cv-ref-block text-muted" *ngFor="let ref of referenciasLaboralesDe(exp.experienciaId)">
                    <strong>Referencia laboral:</strong> {{ textoReferenciaLaboral(ref) }}
                  </div>
                </ng-container>
                <div class="cv-mi-support" *ngIf="exp.adjuntoSoporte && visibleAtributoSafe('experiencia','soporte-certificacion-laboral')">
                  <a [href]="exp.adjuntoSoporte" target="_blank" rel="noopener noreferrer" class="cv-mi-support-link">
                    <i class="bi bi-download me-1"></i>Descargar soporte de certificación laboral
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="cv-mi-section" *ngIf="visibleBloqueFormacion('formacion-academica') && formacionesAcademicas.length">
            <div class="cv-mi-section-title">Formación Académica</div>
            <div class="cv-mi-timeline">
              <div class="timeline-item" *ngFor="let edu of formacionesAcademicas">
                <div class="timeline-title" *ngIf="visibleAtributoSafe('educacion','titulo')">{{ edu.titulo }}</div>
                <div class="timeline-sub" *ngIf="visibleAtributoSafe('educacion','institucion')">{{ edu.institucion }}</div>
                <div class="timeline-date" *ngIf="visibleAtributoSafe('educacion','fechas')">{{ rangoAcademico(edu) }}</div>
                <div class="cv-mi-support" *ngIf="edu.adjuntoSoporte && visibleDescargarSoporte('formacion-academica','descargar-soporte')">
                  <a [href]="edu.adjuntoSoporte" target="_blank" rel="noopener noreferrer" class="cv-mi-support-link">
                    <i class="bi bi-download me-1"></i>Descargar soporte
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="cv-mi-section" *ngIf="visibleBloqueFormacion('diplomados') && formacionesDiplomado.length">
            <div class="cv-mi-section-title">Diplomados</div>
            <div class="cv-mi-timeline">
              <div class="timeline-item timeline-item--compact" *ngFor="let edu of formacionesDiplomado">
                <div class="timeline-inline">
                  <span class="timeline-title" *ngIf="visibleAtributoSafe('educacion','titulo')">{{ edu.titulo }}</span>
                  <span class="timeline-sep" *ngIf="visibleAtributoSafe('educacion','institucion') && edu.institucion"> — </span>
                  <span class="timeline-sub" *ngIf="visibleAtributoSafe('educacion','institucion')">{{ edu.institucion }} </span>
                  <span class="timeline-date" *ngIf="visibleAtributoSafe('educacion','fechas') && anioEntreParentesis(edu)">{{ anioEntreParentesis(edu) }}</span>
                </div>
                <div class="cv-mi-support" *ngIf="edu.adjuntoSoporte && visibleDescargarSoporte('diplomados','descargar-soporte-certificado')">
                  <a [href]="edu.adjuntoSoporte" target="_blank" rel="noopener noreferrer" class="cv-mi-support-link">
                    <i class="bi bi-download me-1"></i>Descargar soporte certificado
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="cv-mi-section" *ngIf="visibleBloqueFormacion('certificaciones') && formacionesCertificacion.length">
            <div class="cv-mi-section-title">Certificaciones</div>
            <div class="cv-mi-timeline">
              <div class="timeline-item timeline-item--compact" *ngFor="let edu of formacionesCertificacion">
                <div class="timeline-inline">
                  <span class="timeline-title" *ngIf="visibleAtributoSafe('educacion','titulo')">{{ edu.titulo }}</span>
                  <span class="timeline-sep" *ngIf="visibleAtributoSafe('educacion','institucion') && edu.institucion"> — </span>
                  <span class="timeline-sub" *ngIf="visibleAtributoSafe('educacion','institucion')">{{ edu.institucion }} </span>
                  <span class="timeline-date" *ngIf="visibleAtributoSafe('educacion','fechas') && anioEntreParentesis(edu)">{{ anioEntreParentesis(edu) }}</span>
                </div>
                <div class="cv-mi-support" *ngIf="edu.adjuntoSoporte && visibleDescargarSoporte('certificaciones','descargar-soporte-certificado')">
                  <a [href]="edu.adjuntoSoporte" target="_blank" rel="noopener noreferrer" class="cv-mi-support-link">
                    <i class="bi bi-download me-1"></i>Descargar soporte certificado
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="cv-mi-section" *ngIf="visibleBloqueFormacion('cursos') && formacionesCurso.length">
            <div class="cv-mi-section-title">Cursos</div>
            <div class="cv-mi-timeline">
              <div class="timeline-item timeline-item--compact" *ngFor="let edu of formacionesCurso">
                <div class="timeline-inline">
                  <span class="timeline-title" *ngIf="visibleAtributoSafe('educacion','titulo')">{{ edu.titulo }}</span>
                  <span class="timeline-sep" *ngIf="visibleAtributoSafe('educacion','institucion') && edu.institucion"> — </span>
                  <span class="timeline-sub" *ngIf="visibleAtributoSafe('educacion','institucion')">{{ edu.institucion }} </span>
                  <span class="timeline-date" *ngIf="visibleAtributoSafe('educacion','fechas') && anioEntreParentesis(edu)">{{ anioEntreParentesis(edu) }}</span>
                </div>
                <div class="cv-mi-support" *ngIf="edu.adjuntoSoporte && visibleDescargarSoporte('cursos','descargar-soporte-certificado')">
                  <a [href]="edu.adjuntoSoporte" target="_blank" rel="noopener noreferrer" class="cv-mi-support-link">
                    <i class="bi bi-download me-1"></i>Descargar soporte certificado
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="cv-mi-section" *ngIf="visibleSeccion('proyectos') && proyectos.length">
            <div class="cv-mi-section-title">Proyectos Destacados</div>
            <div class="cv-mi-timeline">
              <div class="timeline-item" *ngFor="let pr of proyectos">
                <div class="timeline-title" *ngIf="visibleAtributo('proyectos','nombre')">{{ pr.nombreProyecto }}</div>
                <div class="timeline-sub" *ngIf="lineaProyectoMeta(pr)">{{ lineaProyectoMeta(pr) }}</div>
                <ul class="cv-pro-list mb-0 mt-1" *ngIf="esPlantillaProfesional && lineasBulletTexto(textoProyecto(pr)).length">
                  <li *ngFor="let linea of lineasBulletTexto(textoProyecto(pr))">{{ linea }}</li>
                </ul>
                <div class="timeline-desc" *ngIf="!esPlantillaProfesional && textoProyecto(pr)">{{ textoProyecto(pr) }}</div>
                <div class="cv-mi-tags" *ngIf="visibleAtributo('proyectos','stack') && stackTags(pr.stackTecnologico).length">
                  <span class="cv-mi-tag" *ngFor="let t of stackTags(pr.stackTecnologico)">{{ t }}</span>
                </div>
              </div>
            </div>
          </div>

          <ng-container *ngIf="esPlantillaProfesional">
            <div class="cv-mi-section" *ngIf="visibleSeccion('habilidades') && habilidadesTecnicas.length">
              <div class="cv-mi-section-title">Habilidades técnicas</div>
              <ul class="cv-pro-list">
                <li *ngFor="let h of habilidadesTecnicas">
                  <ng-container *ngIf="visibleAtributo('habilidades','nombre')">
                    <strong>{{ h.nombre }}</strong><ng-container *ngIf="visibleAtributo('habilidades','nivel') && h.nivel">: {{ h.nivel }}</ng-container><ng-container *ngIf="visibleAtributo('habilidades','descripcion') && h.descripcion?.trim()"> — {{ h.descripcion }}</ng-container>
                  </ng-container>
                </li>
              </ul>
            </div>
            <div class="cv-mi-section" *ngIf="visibleSeccion('habilidades') && habilidadesBlandas.length">
              <div class="cv-mi-section-title">Habilidades blandas</div>
              <ul class="cv-pro-list">
                <ng-container *ngFor="let h of habilidadesBlandas">
                  <li *ngIf="textoBlandaProfesional(h) as t">{{ t }}</li>
                </ng-container>
              </ul>
            </div>
            <div class="cv-mi-section" *ngIf="visibleSeccion('habilidades') && idiomas.length">
              <div class="cv-mi-section-title">Idiomas</div>
              <ul class="cv-pro-list">
                <li *ngFor="let id of idiomas">
                  <ng-container *ngIf="visibleAtributo('habilidades','nombre')">
                    <strong>{{ id.nombre }}</strong><ng-container *ngIf="visibleAtributo('habilidades','nivel') && id.nivel"> — {{ id.nivel }}</ng-container><ng-container *ngIf="visibleAtributo('habilidades','descripcion') && textoDetalleIdioma(id)"> · {{ textoDetalleIdioma(id) }}</ng-container>
                  </ng-container>
                </li>
              </ul>
            </div>
          </ng-container>
        </div>
      </div>
        </div>
      </div>
    </div>
  `,
})
export class MiCvComponent implements OnInit, OnDestroy {
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
  private readonly tiposAcademicos = new Set(['Posgrado', 'Pregrado', 'Tecnologo', 'Tecnico']);

  get previewRootClass(): string {
    return `cv-mi-preview bg-white rounded-3 overflow-hidden cv-tpl--${this.plantillaCodigo}`;
  }

  get plantillaResumen(): string {
    return CV_PLANTILLAS.find(p => p.codigo === this.plantillaCodigo)?.resumen ?? '';
  }

  get plantillaNombre(): string {
    return CV_PLANTILLAS.find(p => p.codigo === this.plantillaCodigo)?.nombre ?? 'Clásico';
  }

  get plantillaColor(): string {
    return CV_PLANTILLAS.find(p => p.codigo === this.plantillaCodigo)?.color ?? '#2c7be5';
  }

  /** Una columna, sin barra lateral (Profesional, ATS, Ejecutivo). */
  get esPlantillaCuerpoUnico(): boolean {
    return (
      this.plantillaCodigo === 'profesional' ||
      this.plantillaCodigo === 'ats' ||
      this.plantillaCodigo === 'ejecutivo'
    );
  }

  /** Viñetas en experiencia/proyectos y bloques de habilidades en columna principal. */
  get esPlantillaProfesional(): boolean {
    return this.esPlantillaCuerpoUnico;
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

  get nombreCompleto(): string {
    const p = this.personales;
    if (!p) return 'Tu nombre';
    return [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido]
      .filter(Boolean)
      .join(' ')
      .trim() || 'Tu nombre';
  }

  get perfilPrincipal(): PerfilDto | null {
    if (!this.perfiles.length) return null;
    return this.perfiles.find(p => p.esActivo) ?? this.perfiles[0] ?? null;
  }

  get trayectoriaCabecera(): string | null {
    const totalMeses = this.experienciaLaboralMesesAcumulados;
    if (totalMeses <= 0) return null;
    const anios = Math.floor(totalMeses / 12);
    const meses = totalMeses % 12;
    const etiqueta = 'Experiencia laboral acumulada';
    if (anios < 1) {
      return `${etiqueta}: ${meses} mes${meses === 1 ? '' : 'es'}`;
    }
    if (meses === 0) {
      return `${etiqueta}: ${anios} año${anios === 1 ? '' : 's'}`;
    }
    return `${etiqueta}: ${anios} año${anios === 1 ? '' : 's'} y ${meses} mes${meses === 1 ? '' : 'es'}`;
  }

  get aspiracionTexto(): string | null {
    const p = this.perfilPrincipal;
    if (!p) return null;
    const cop = p.aspiracionSalarialPesos;
    const usd = p.aspiracionSalarialDolares;
    if (cop == null && usd == null) return null;
    const parts: string[] = [];
    if (cop != null) {
      parts.push(
        `$${Math.round(cop).toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP`
      );
    }
    if (usd != null) {
      parts.push(
        `$${usd.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD mensuales`
      );
    }
    return parts.join(' / ');
  }

  get telefonoContacto(): string | null {
    const c = this.personales?.celular?.trim();
    const f = this.personales?.telefonoFijo?.trim();
    return c || f || null;
  }

  get fotoHeaderUrl(): string | null {
    const u = this.personales?.fotoUrl?.trim();
    if (!u || !this.visibleAtributoSafe('datos-personales', 'foto')) return null;
    return u;
  }

  get inicialesFoto(): string {
    const p = this.personales;
    if (!p) return 'CV';
    const a = (p.primerNombre?.trim()?.[0] ?? '').toUpperCase();
    const b = (p.primerApellido?.trim()?.[0] ?? '').toUpperCase();
    return (a + b) || 'CV';
  }

  get mostrarBloquePerfil(): boolean {
    return this.visibleSeccion('perfil') && this.perfilPrincipal != null;
  }

  get habilidadesTecnicas(): HabilidadDto[] {
    return this.habilidades.filter(h => h.tipo === 'Tecnica' || h.tipo === 'Otra');
  }

  get habilidadesBlandas(): HabilidadDto[] {
    return this.habilidades.filter(h => h.tipo === 'Blanda');
  }

  get idiomas(): HabilidadDto[] {
    return this.habilidades.filter(h => h.tipo === 'Idioma');
  }

  get formacionesAcademicas(): FormacionDto[] {
    return this.formaciones.filter(f => this.esTipoAcademico(f.tipoFormacion));
  }

  get formacionesDiplomado(): FormacionDto[] {
    return this.formaciones.filter(f => (f.tipoFormacion ?? '').trim() === 'Diplomado');
  }

  get formacionesCertificacion(): FormacionDto[] {
    return this.formaciones.filter(f => (f.tipoFormacion ?? '').trim() === 'Certificacion');
  }

  get formacionesCurso(): FormacionDto[] {
    return this.formaciones.filter(f => (f.tipoFormacion ?? '').trim() === 'Curso');
  }

  get linkedin(): string | null {
    const item = this.redes.find(r => (r.nombreRed ?? '').toLowerCase().includes('linkedin'));
    return item?.linkPublico ?? item?.usuarioContacto ?? null;
  }

  get ciudadPais(): string | null {
    const ciudad = this.personales?.ciudad?.trim();
    const pais = this.personales?.pais?.trim();
    if (!ciudad && !pais) return null;
    if (ciudad && pais) return `${ciudad}, ${pais}`;
    return ciudad || pais || null;
  }

  skillPercent(nivel: string | null): number {
    const n = (nivel ?? '').toLowerCase();
    if (n.includes('nativo')) return 100;
    switch (n) {
      case 'c2':
      case 'c1':
        return 95;
      case 'b2':
        return 65;
      case 'b1':
        return 50;
      case 'a2':
        return 35;
      case 'a1':
        return 25;
      case 'experto':
        return 95;
      case 'avanzado':
        return 80;
      case 'intermedio':
        return 60;
      case 'basico':
      case 'básico':
        return 40;
      default:
        return 50;
    }
  }

  /** Detalle de idioma (descripción o subniveles CEFR) para timeline / lista profesional. */
  textoDetalleIdioma(h: HabilidadDto): string | null {
    const d = h.descripcion?.trim();
    if (d) return d;
    const bits: string[] = [];
    if (h.nivelLectura?.trim()) bits.push(`Lectura: ${h.nivelLectura}`);
    if (h.nivelEscritura?.trim()) bits.push(`Escritura: ${h.nivelEscritura}`);
    if (h.nivelEscucha?.trim()) bits.push(`Escucha: ${h.nivelEscucha}`);
    if (h.nivelHabla?.trim()) bits.push(`Habla: ${h.nivelHabla}`);
    return bits.length ? bits.join(' · ') : null;
  }

  /** Una línea por renglón; quita viñeta inicial si el usuario ya la escribió (como en Word/PDF). */
  lineasBulletTexto(raw: string | null | undefined): string[] {
    if (raw == null || !String(raw).trim()) return [];
    return String(raw)
      .split(/\r?\n/)
      .map(l => l.replace(/^\s*[•\u2022\u00B7\-*]\s*/, '').trim())
      .filter(Boolean);
  }

  /** Texto para lista de habilidades blandas en plantilla Profesional. */
  textoBlandaProfesional(h: HabilidadDto): string | null {
    const n = h.nombre?.trim();
    const d = h.descripcion?.trim();
    const showDesc = this.visibleAtributo('habilidades', 'descripcion');
    if (!n && !d) return null;
    if (n && d && showDesc) return `${n} — ${d}`;
    if (n) return n;
    return showDesc ? d ?? null : null;
  }

  lineaEmpresaContrato(exp: ExperienciaDto): string | null {
    if (!this.visibleSeccion('experiencia')) return null;
    const emp = (exp.empresa ?? '').trim();
    const tc = (exp.tipoContrato ?? '').trim();
    if (!emp && !tc) return null;
    if (emp && tc) return `${emp} · ${tc}`;
    return emp || tc;
  }

  duracionExperiencia(exp: ExperienciaDto): string {
    if (!exp.fechaInicio) return '—';
    const start = new Date(exp.fechaInicio);
    const end = this.resolverFinExperiencia(exp, new Date());
    if (!end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return '—';
    const months = this.diffInMonths(start, end);
    const y = Math.floor(months / 12);
    const m = months % 12;
    if (y === 0) return `${m} mes${m === 1 ? '' : 'es'}`;
    if (m === 0) return `${y} año${y === 1 ? '' : 's'}`;
    return `${y} año${y === 1 ? '' : 's'} | ${m} mes${m === 1 ? '' : 'es'}`;
  }

  rangoAcademico(f: FormacionDto): string {
    const esCert = (f.tipoFormacion ?? '').trim() === 'Certificacion';
    if (esCert) {
      const d = f.fechaInicio || f.fechaFin;
      return d ? d.slice(0, 4) : '—';
    }
    const yi = f.fechaInicio?.slice(0, 4);
    const yf = f.fechaFin?.slice(0, 4);
    if (yi && yf && yi !== yf) return `${yi}-${yf}`;
    return yf || yi || '—';
  }

  anioEntreParentesis(f: FormacionDto): string {
    const d = f.fechaInicio || f.fechaFin;
    if (!d) return '';
    const y = d.slice(0, 4);
    return /^\d{4}$/.test(y) ? `(${y})` : '';
  }

  lineaProyectoMeta(pr: ProyectoDto): string | null {
    const parts: string[] = [];
    if (this.visibleAtributo('proyectos', 'rol') && pr.rol?.trim()) {
      parts.push(`Rol: ${pr.rol.trim()}`);
    }
    if (this.visibleAtributo('proyectos', 'equipo') && pr.equipoTamano != null && pr.equipoTamano > 0) {
      parts.push(`Equipo: ${pr.equipoTamano} persona${pr.equipoTamano === 1 ? '' : 's'}`);
    }
    if (this.visibleAtributo('proyectos', 'duracion') && pr.duracionMeses != null && pr.duracionMeses > 0) {
      parts.push(`${pr.duracionMeses} mes${pr.duracionMeses === 1 ? '' : 'es'}`);
    }
    return parts.length ? parts.join(' · ') : null;
  }

  textoProyecto(pr: ProyectoDto): string | null {
    if (this.visibleAtributo('proyectos', 'aporte') && pr.aporte?.trim()) return pr.aporte.trim();
    if (this.visibleAtributo('proyectos', 'logro') && pr.logro?.trim()) return pr.logro.trim();
    if (this.visibleAtributo('proyectos', 'desafio') && pr.desafio?.trim()) return pr.desafio.trim();
    if (this.visibleAtributo('proyectos', 'stack') && pr.stackTecnologico?.trim()) {
      const s = pr.stackTecnologico.trim();
      if (!this.stackTags(s).length) return s;
    }
    return null;
  }

  stackTags(stack: string | null | undefined): string[] {
    return (stack ?? '')
      .split(/[,;]/)
      .map(t => t.trim())
      .filter(Boolean);
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

  referenciasLaboralesDe(experienciaId: number): ReferenciaDto[] {
    return this.referencias.filter(
      r =>
        r.experienciaId === experienciaId &&
        (r.tipoReferencia ?? '').toLowerCase() === 'laboral'
    );
  }

  textoReferenciaLaboral(r: ReferenciaDto): string {
    const name = [r.nombre, r.apellido].filter(Boolean).join(' ').trim();
    const parts = [name, r.cargo, r.telefono].filter(Boolean);
    return parts.join(' · ');
  }

  private esTipoAcademico(tipo: string | null | undefined): boolean {
    const t = (tipo ?? '').trim();
    if (!t) return true;
    return this.tiposAcademicos.has(t);
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

  private resolverFinExperiencia(exp: ExperienciaDto, referencia: Date): Date | null {
    if (exp.esActual) return referencia;
    const fin = exp.fechaFin?.trim();
    if (fin) return new Date(fin);
    return referencia;
  }

  private diffInMonths(start: Date, end: Date): number {
    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();
    let total = years * 12 + months;
    if (end.getDate() < start.getDate()) total -= 1;
    return Math.max(0, total);
  }
}
