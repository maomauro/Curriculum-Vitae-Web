import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
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
          Vista de tu hoja de vida en ancho tamaño carta (8,5" × 11"): el mismo que al imprimir, en PDF o el que
          suele ver un reclutador.
        </span>
      </div>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-outline-secondary btn-sm d-none d-md-inline-flex align-items-center" (click)="imprimir()">
          <i class="bi bi-printer-fill me-1"></i>Imprimir / PDF
        </button>
        <a routerLink="/editor" class="btn btn-outline-primary btn-sm">
          <i class="bi bi-pencil-fill me-1"></i>Editar CV
        </a>
      </div>
    </div>

    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <div *ngIf="!loading" class="cv-mi-letter-wrap">
      <div #cvMiSheet class="cv-mi-preview bg-white rounded-3 overflow-hidden">
        <div class="cv-mi-page-guide cv-mi-screen-only" aria-hidden="true"></div>
        <div class="cv-mi-preview-stack">
      <div class="text-white d-flex align-items-start cv-preview-header">
        <ng-container *ngIf="fotoHeaderUrl as url">
          <img [src]="url" alt="" class="cv-preview-photo rounded-circle" />
        </ng-container>
        <div *ngIf="!fotoHeaderUrl" class="avatar-circle blue cv-preview-avatar">{{ iniciales() }}</div>
        <div class="flex-grow-1 min-w-0">
          <div class="fw-bold cv-preview-name">{{ nombreCompleto }}</div>
          <div class="cv-preview-sub">
            {{ perfilPrincipal?.nombrePerfil || 'Perfil profesional' }}<ng-container *ngIf="perfilPrincipal?.esActivo"> — Perfil activo</ng-container>
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
            <span *ngIf="linkedin">
              <i class="bi bi-linkedin"></i>{{ linkedin }}
            </span>
            <span *ngIf="trayectoriaCabecera">
              <i class="bi bi-briefcase-fill"></i>{{ trayectoriaCabecera }}
            </span>
          </div>
        </div>
      </div>

      <div class="cv-mi-body">
        <div class="cv-preview-sidebar">
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
            <div class="cv-mi-profile-meta text-muted">
              Trayectoria profesional: {{ trayectoriaTotalTexto }}
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
                <div class="timeline-desc" *ngIf="exp.funciones">{{ exp.funciones }}</div>
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
                <div class="timeline-desc" *ngIf="textoProyecto(pr)">{{ textoProyecto(pr) }}</div>
                <div class="cv-mi-tags" *ngIf="visibleAtributo('proyectos','stack') && stackTags(pr.stackTecnologico).length">
                  <span class="cv-mi-tag" *ngFor="let t of stackTags(pr.stackTecnologico)">{{ t }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  `,
})
export class MiCvComponent implements OnInit, AfterViewInit, OnDestroy {
  loading = false;

  @ViewChild('cvMiSheet', { static: false }) private cvMiSheet?: ElementRef<HTMLElement>;
  private sheetResizeObserver?: ResizeObserver;
  private pageFlowDebounce?: ReturnType<typeof setTimeout>;

  personales: PersonalesDto | null = null;
  perfiles: PerfilDto[] = [];
  experiencias: ExperienciaDto[] = [];
  formaciones: FormacionDto[] = [];
  habilidades: HabilidadDto[] = [];
  proyectos: ProyectoDto[] = [];
  redes: RedSocialDto[] = [];
  referencias: ReferenciaDto[] = [];
  private visibilidadMap = new Map<string, boolean>();

  private readonly tiposAcademicos = new Set(['Posgrado', 'Pregrado', 'Tecnologo', 'Tecnico']);

  constructor(
    private cvEditorService: CvEditorService,
    private notificationService: NotificationService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    this.tryAttachSheetObserver();
  }

  ngOnDestroy(): void {
    this.sheetResizeObserver?.disconnect();
    this.sheetResizeObserver = undefined;
    if (this.pageFlowDebounce != null) {
      clearTimeout(this.pageFlowDebounce);
      this.pageFlowDebounce = undefined;
    }
  }

  imprimir(): void {
    window.print();
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

  get trayectoriaTotalTexto(): string {
    const totalMeses = this.calcularMesesTrayectoria(this.experiencias);
    const anios = Math.floor(totalMeses / 12);
    const meses = totalMeses % 12;
    return `${anios} años | ${meses} meses`;
  }

  get trayectoriaCabecera(): string | null {
    const totalMeses = this.calcularMesesTrayectoria(this.experiencias);
    if (totalMeses <= 0) return null;
    const anios = Math.floor(totalMeses / 12);
    const meses = totalMeses % 12;
    if (anios < 1) {
      return `+${meses} mes${meses === 1 ? '' : 'es'} de experiencia total`;
    }
    const extra = meses > 0 ? ` (+${meses} mes${meses === 1 ? '' : 'es'})` : '';
    return `+${anios} año${anios === 1 ? '' : 's'} de experiencia total${extra}`;
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

  iniciales(): string {
    const parts = this.nombreCompleto.split(' ').filter(Boolean);
    if (!parts.length) return '?';
    return parts
      .slice(0, 2)
      .map(p => p[0])
      .join('')
      .toUpperCase();
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
    const end = exp.esActual
      ? new Date()
      : exp.fechaFin
        ? new Date(exp.fechaFin)
        : new Date();
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return '—';
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

  /** Estas secciones son esenciales en la HV; no se pueden apagar desde configuración. */
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
        this.loading = false;
        queueMicrotask(() => {
          this.tryAttachSheetObserver();
          this.scheduleApplyScreenPageFlow();
        });
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      },
    });
  }

  private tryAttachSheetObserver(): void {
    const el = this.cvMiSheet?.nativeElement;
    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }

    if (!this.sheetResizeObserver) {
      this.sheetResizeObserver = new ResizeObserver(() => {
        this.ngZone.run(() => this.scheduleApplyScreenPageFlow());
      });
      this.sheetResizeObserver.observe(el);
    }
    this.scheduleApplyScreenPageFlow();
  }

  /** En pantalla, empuja bloques que cruzan cada 11" para alinearlos con las “hojas” (no afecta impresión). */
  private scheduleApplyScreenPageFlow(): void {
    if (this.pageFlowDebounce != null) {
      clearTimeout(this.pageFlowDebounce);
    }
    this.pageFlowDebounce = setTimeout(() => {
      this.pageFlowDebounce = undefined;
      this.ngZone.run(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => this.applyScreenPageFlow());
        });
      });
    }, 50);
  }

  private clearScreenPageFlow(stack: HTMLElement): void {
    stack.querySelectorAll('.cv-mi-screen-flow').forEach(node => {
      const el = node as HTMLElement;
      el.style.marginTop = '';
      el.classList.remove('cv-mi-screen-flow');
    });
  }

  /**
   * Para el primer ítem de un timeline, el bloque “atómico” incluye el título de sección encima.
   * Así título + primer experiencia/proyecto/etc. saltan juntos a la siguiente hoja.
   */
  private getFlowBlockBounds(
    el: HTMLElement,
    pRect: DOMRect
  ): { topRel: number; bottomRel: number; height: number } {
    const r = el.getBoundingClientRect();
    const timeline = el.parentElement;
    if (timeline?.classList.contains('cv-mi-timeline') && el === timeline.firstElementChild) {
      const section = timeline.parentElement;
      const title = section?.querySelector(':scope > .cv-mi-section-title') as HTMLElement | null;
      if (title) {
        const tr = title.getBoundingClientRect();
        const topRel = tr.top - pRect.top;
        const bottomRel = r.bottom - pRect.top;
        return { topRel, bottomRel, height: Math.max(0, bottomRel - topRel) };
      }
    }
    const topRel = r.top - pRect.top;
    const bottomRel = r.bottom - pRect.top;
    return { topRel, bottomRel, height: Math.max(0, bottomRel - topRel) };
  }

  /** Dónde aplicar margin-top para que se mueva el bloque completo (título + timeline si aplica). */
  private getPageFlowMarginTarget(el: HTMLElement): HTMLElement {
    const timeline = el.parentElement;
    if (!timeline?.classList.contains('cv-mi-timeline')) {
      return el;
    }
    const section = timeline.parentElement;
    if (!section?.classList.contains('cv-mi-section')) {
      return el;
    }
    const isFirst = el === timeline.firstElementChild;
    const title = section.querySelector(':scope > .cv-mi-section-title') as HTMLElement | null;
    if (isFirst && title) {
      return title;
    }
    return el;
  }

  private collectPageAlignTargets(stack: HTMLElement): HTMLElement[] {
    const out: HTMLElement[] = [];
    stack.querySelectorAll('.cv-preview-sidebar > .cv-mi-cv-section').forEach(el => {
      out.push(el as HTMLElement);
    });
    stack.querySelectorAll('.cv-preview-main > .cv-mi-section').forEach(section => {
      const timeline = section.querySelector('.cv-mi-timeline');
      if (timeline) {
        timeline.querySelectorAll(':scope > .timeline-item').forEach(item => {
          out.push(item as HTMLElement);
        });
      } else {
        out.push(section as HTMLElement);
      }
    });
    return out;
  }

  private applyScreenPageFlow(): void {
    if (typeof window !== 'undefined' && window.matchMedia?.('print').matches) {
      return;
    }
    const preview = this.cvMiSheet?.nativeElement;
    const stack = preview?.querySelector('.cv-mi-preview-stack') as HTMLElement | null;
    if (!preview || !stack) {
      return;
    }

    this.clearScreenPageFlow(stack);

    const pagePx = this.cssInchesToPx(11);
    if (pagePx <= 0) {
      return;
    }

    /** Espacio bajo la franja decorativa para que el texto no quede pegado al corte. */
    const bandClearPx = 18;
    /** Tolerancia por subpíxeles, bordes y fuentes. */
    const roomBufferPx = 6;
    const maxPasses = 64;

    for (let pass = 0; pass < maxPasses; pass++) {
      const pRect = preview.getBoundingClientRect();
      const targets = this.collectPageAlignTargets(stack).sort((a, b) => {
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        if (Math.abs(ra.top - rb.top) > 4) {
          return ra.top - rb.top;
        }
        return ra.left - rb.left;
      });
      let changed = false;

      for (const el of targets) {
        const { topRel, bottomRel, height: h } = this.getFlowBlockBounds(el, pRect);
        if (h < 2) {
          continue;
        }

        const pageIdx = Math.max(0, Math.floor(topRel / pagePx));
        const pageEnd = (pageIdx + 1) * pagePx;
        const remainingOnSheet = pageEnd - topRel;

        const spillsPastCut = bottomRel > pageEnd - roomBufferPx;
        const doesNotFitRemainder = h > remainingOnSheet - roomBufferPx;

        if (spillsPastCut || doesNotFitRemainder) {
          const delta = Math.ceil(remainingOnSheet + bandClearPx);
          if (delta < 4) {
            continue;
          }
          const target = this.getPageFlowMarginTarget(el);
          const prev = parseFloat(target.style.marginTop) || 0;
          target.style.marginTop = `${prev + delta}px`;
          target.classList.add('cv-mi-screen-flow');
          changed = true;
        }
      }

      if (!changed) {
        break;
      }
    }
  }

  /** Convierte pulgadas CSS a píxeles según el dispositivo (coherente con líneas 11" en CSS). */
  private cssInchesToPx(inches: number): number {
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:absolute;left:-9999px;top:0;height:0;width:0;visibility:hidden;pointer-events:none;';
    probe.style.height = `${inches}in`;
    document.body.appendChild(probe);
    const px = probe.offsetHeight;
    document.body.removeChild(probe);
    return px;
  }

  private setVisibilidad(data: VisibilidadSeccionDto[]): void {
    this.visibilidadMap.clear();
    data.forEach(v => this.visibilidadMap.set((v.seccion ?? '').trim().toLowerCase(), v.visible));
  }

  private calcularMesesTrayectoria(exps: ExperienciaDto[]): number {
    const ranges: Array<{ start: Date; end: Date }> = [];
    exps.forEach(exp => {
      if (!exp.fechaInicio) return;
      const start = new Date(exp.fechaInicio);
      const end = exp.esActual
        ? new Date()
        : exp.fechaFin
          ? new Date(exp.fechaFin)
          : new Date();
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return;
      ranges.push({ start, end });
    });
    if (!ranges.length) return 0;
    ranges.sort((a, b) => a.start.getTime() - b.start.getTime());
    const merged: Array<{ start: Date; end: Date }> = [ranges[0]];
    for (let i = 1; i < ranges.length; i++) {
      const current = ranges[i];
      const last = merged[merged.length - 1];
      if (current.start <= last.end) {
        if (current.end > last.end) last.end = current.end;
      } else {
        merged.push({ ...current });
      }
    }
    return merged.reduce((sum, r) => sum + this.diffInMonths(r.start, r.end), 0);
  }

  private diffInMonths(start: Date, end: Date): number {
    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();
    let total = years * 12 + months;
    if (end.getDate() < start.getDate()) total -= 1;
    return Math.max(0, total);
  }
}
