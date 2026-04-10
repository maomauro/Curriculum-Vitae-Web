import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CvEditorService } from '../../../core/services/private/cv-editor.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { APP_MESSAGES, DEFAULT_APP_LOCALE } from '../../../core/constants/messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';

interface ConfigVisItem {
  key: string;
  label: string;
  icon: string;
  iconStyle: string;
  visible: boolean;
  atributos: ConfigVisAtributo[];
  /** Sin interruptor de sección: la HV siempre incluye este bloque; solo se administran atributos. */
  sinSwitchSeccion?: boolean;
}

interface ConfigVisAtributo {
  key: string;
  label: string;
  visible: boolean;
}

interface ConfigVisGroup {
  id: string;
  titulo: string;
  icon: string;
  clase: string;
  items: ConfigVisItem[];
  /** Panel del acordeón de visibilidad (por defecto colapsado al entrar). */
  accordionOpen: boolean;
}

@Component({
  selector: 'app-configuracion',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-gear-fill me-2 text-primary"></i>Configuración</h4>
        <span class="text-muted small">Privacidad, visibilidad del CV y ajustes de cuenta</span>
      </div>
    </div>

    <!-- Visibilidad del CV -->
    <div class="seccion-card">
      <div class="seccion-titulo"><i class="bi bi-eye-fill"></i>Visibilidad del CV</div>
      <div class="seccion-subtitulo">
        Clasifica la visibilidad por páginas ya implementadas. En cada sección se listan los atributos que se mostrarán
        en tu CV público cuando el switch esté activo.
        <strong class="d-block mt-2">Los cambios se guardan automáticamente</strong> al activar o desactivar cada opción.
      </div>
      <div class="vis-accordion">
        <div class="vis-accordion-item" *ngFor="let grupo of visibilidadGrupos">
          <button
            type="button"
            class="vis-accordion-header"
            [id]="'vis-acc-trigger-' + grupo.id"
            [attr.aria-expanded]="grupo.accordionOpen"
            [attr.aria-controls]="grupo.accordionOpen ? 'vis-acc-panel-' + grupo.id : null"
            (click)="toggleVisGrupo(grupo)">
            <span class="vis-accordion-grupo-titulo" [ngClass]="grupo.clase">
              <i class="bi" [ngClass]="grupo.icon" aria-hidden="true"></i>
              {{ grupo.titulo }}
            </span>
            <i class="bi flex-shrink-0 cv-chevron-muted" aria-hidden="true"
               [class.bi-chevron-down]="!grupo.accordionOpen"
               [class.bi-chevron-up]="grupo.accordionOpen"></i>
          </button>
          <div
            *ngIf="grupo.accordionOpen"
            class="vis-accordion-body"
            [id]="'vis-acc-panel-' + grupo.id"
            role="region"
            [attr.aria-labelledby]="'vis-acc-trigger-' + grupo.id">
            <ng-container *ngFor="let campo of grupo.items">
              <div class="vis-row" [class.vis-row--sin-switch-seccion]="campo.sinSwitchSeccion">
                <div class="vis-info">
                  <div class="vis-icon" [ngClass]="campo.iconStyle">
                    <i class="bi" [ngClass]="campo.icon"></i>
                  </div>
                  <div>
                    <div class="vis-name">{{ campo.label }}</div>
                    <div class="vis-desc">
                      <ng-container *ngIf="campo.sinSwitchSeccion">
                        Esta información forma parte esencial del CV; solo puedes ajustar los atributos indicados.
                      </ng-container>
                      <ng-container *ngIf="!campo.sinSwitchSeccion">
                        Activa/desactiva la sección completa o personaliza atributos.
                      </ng-container>
                    </div>
                  </div>
                </div>
                <div class="form-check form-switch mb-0" *ngIf="!campo.sinSwitchSeccion">
                  <input class="form-check-input cv-switch-cursor" type="checkbox" role="switch"
                         [(ngModel)]="campo.visible" [id]="'vis_' + campo.key"
                         (change)="onToggleSeccion(campo)">
                </div>
              </div>
              <div class="vis-attr-list">
                <div class="vis-attr-row" *ngFor="let attr of campo.atributos">
                  <div class="vis-attr-name">{{ attr.label }}</div>
                  <div class="form-check form-switch mb-0">
                    <input class="form-check-input cv-switch-cursor" type="checkbox" role="switch"
                           [(ngModel)]="attr.visible" [id]="'vis_' + attr.key"
                           [disabled]="!campo.sinSwitchSeccion && !campo.visible"
                           (change)="onToggleAtributo(campo, attr)">
                  </div>
                </div>
              </div>
            </ng-container>
          </div>
        </div>
      </div>
    </div>

    <!-- URL pública del CV -->
    <div class="seccion-card">
      <div class="seccion-titulo">URL pública del CV</div>
      <p class="text-muted small mb-3">
        Comparte este enlace para que otros puedan ver tu CV. El dominio es el de esta misma ventana (por ejemplo
        <code class="small">localhost</code> en desarrollo o tu sitio en producción); no hace falta configurarlo a mano.
      </p>
      <div class="d-flex flex-column flex-sm-row gap-2">
        <div class="input-group">
          <span class="input-group-text">
            <i class="bi bi-link-45deg text-primary"></i>
          </span>
          <input
            type="text"
            class="form-control"
            [value]="urlCv"
            [placeholder]="urlCvCargando ? 'Cargando enlace…' : 'No disponible'"
            readonly>
        </div>
        <div class="d-flex gap-2 flex-shrink-0">
          <button
            type="button"
            class="btn btn-outline-primary btn-sm px-3"
            [disabled]="!urlCv"
            (click)="copiarUrl()">
            <i class="bi bi-clipboard me-1"></i>
            {{ copiado ? '¡Copiado!' : 'Copiar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Cambio de contraseña -->
    <div class="seccion-card">
      <div class="seccion-titulo">Cambiar contraseña</div>
      <p class="text-muted small mb-3">Mínimo 8 caracteres. Tras guardar, sigue usando tu correo para iniciar sesión.</p>
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label" for="cfg_pwd_actual">Contraseña actual</label>
          <input
            id="cfg_pwd_actual"
            type="password"
            class="form-control"
            name="cfgPwdActual"
            [(ngModel)]="passwordActual"
            autocomplete="current-password"
            [disabled]="guardandoContrasena">
        </div>
        <div class="col-md-4">
          <label class="form-label" for="cfg_pwd_nueva">Nueva contraseña</label>
          <input
            id="cfg_pwd_nueva"
            type="password"
            class="form-control"
            name="cfgPwdNueva"
            [(ngModel)]="passwordNueva"
            autocomplete="new-password"
            minlength="8"
            [disabled]="guardandoContrasena"
            [class.is-invalid]="nuevaContrasenaMuyCorta || contrasenasNuevasDesalineadas"
            [class.is-valid]="contrasenasNuevasCoincidenOk"
            [attr.aria-invalid]="nuevaContrasenaMuyCorta || contrasenasNuevasDesalineadas">
          <div class="invalid-feedback d-block" *ngIf="nuevaContrasenaMuyCorta">
            {{ pwdFormMsg.passwordMinLength }}
          </div>
        </div>
        <div class="col-md-4">
          <label class="form-label" for="cfg_pwd_nueva2">Repetir nueva contraseña</label>
          <input
            id="cfg_pwd_nueva2"
            type="password"
            class="form-control"
            name="cfgPwdNueva2"
            [(ngModel)]="passwordNueva2"
            autocomplete="new-password"
            minlength="8"
            [disabled]="guardandoContrasena"
            [class.is-invalid]="repetirContrasenaMismatchEnVivo"
            [class.is-valid]="contrasenasNuevasCoincidenOk"
            [attr.aria-invalid]="repetirContrasenaMismatchEnVivo">
          <div class="invalid-feedback d-block" *ngIf="repetirContrasenaMismatchEnVivo">
            {{ pwdFormMsg.passwordMismatch }}
          </div>
        </div>
        <div class="col-12">
          <button
            type="button"
            class="btn btn-primary btn-sm"
            [disabled]="guardandoContrasena"
            (click)="actualizarContrasena()">
            <span *ngIf="guardandoContrasena" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            <i *ngIf="!guardandoContrasena" class="bi bi-shield-lock me-1"></i>
            {{ guardandoContrasena ? 'Guardando…' : 'Actualizar contraseña' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Publicación en el portal (Estado Publicado / Borrador en curriculum) -->
    <div class="seccion-card">
      <div class="seccion-titulo">
        <i class="bi bi-megaphone me-2 text-primary"></i>Publicación del CV
      </div>
      <p class="text-muted small mb-3">
        Con el interruptor activo tu CV queda <strong>publicado</strong>: aparece en la búsqueda pública y el enlace de arriba
        funciona para quien lo visite. Si lo desactivas, pasa a <strong>borrador</strong>: solo tú lo ves en el portal privado;
        el enlace público ya no mostrará tu CV.
      </p>
      <div class="vis-row align-items-center py-1">
        <div class="vis-info flex-grow-1 min-w-0">
          <div class="vis-name">Publicar mi CV en el portal</div>
          <div class="vis-desc small text-muted mb-0">
            Estado actual: <strong>{{ cvPublicado ? 'Publicado' : 'Borrador' }}</strong>
          </div>
        </div>
        <div class="form-check form-switch mb-0 flex-shrink-0">
          <input
            class="form-check-input cv-switch-cursor"
            type="checkbox"
            role="switch"
            id="cfg_cv_publicado"
            name="cfgCvPublicado"
            [(ngModel)]="cvPublicado"
            [disabled]="!presentacionLista || guardandoPublicacion"
            (change)="onCvPublicadoChange()">
        </div>
      </div>
      <p class="small text-muted mb-0 mt-2" *ngIf="guardandoPublicacion">
        <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
        Actualizando publicación…
      </p>
    </div>
  `
})
export class ConfiguracionComponent implements OnInit {
  readonly pwdFormMsg = APP_MESSAGES[DEFAULT_APP_LOCALE].forms.configuracion;

  /** URL absoluta del CV público (origen actual + /cv/{slug}). */
  urlCv = '';
  urlCvCargando = true;
  copiado = false;

  /** Curriculum en estado Publicado (visible en API pública). */
  cvPublicado = false;
  presentacionLista = false;
  guardandoPublicacion = false;

  passwordActual = '';
  passwordNueva = '';
  passwordNueva2 = '';
  guardandoContrasena = false;

  /** Hay texto en “repetir” y no coincide con “nueva” (validación mientras escribe). */
  get repetirContrasenaMismatchEnVivo(): boolean {
    const r = this.passwordNueva2.trim();
    if (!r.length) return false;
    return this.passwordNueva.trim() !== r;
  }

  /** Ambas nuevas tienen el mismo valor y longitud ≥ 8. */
  get contrasenasNuevasCoincidenOk(): boolean {
    const n = this.passwordNueva.trim();
    const r = this.passwordNueva2.trim();
    return n.length >= 8 && r.length >= 8 && n === r;
  }

  /** “Nueva” tiene contenido pero aún no cumple 8 caracteres. */
  get nuevaContrasenaMuyCorta(): boolean {
    const n = this.passwordNueva.trim();
    return n.length > 0 && n.length < 8;
  }

  /** Desalineación entre las dos nuevas (para marcar también el primer campo). */
  get contrasenasNuevasDesalineadas(): boolean {
    return this.repetirContrasenaMismatchEnVivo;
  }

  visibilidadGrupos: ConfigVisGroup[] = [
    {
      id: 'personal',
      titulo: 'Información Personal',
      icon: 'bi-person-fill',
      clase: 'vis-group-label--personal',
      accordionOpen: false,
      items: [
        {
          key: 'datos-personales',
          label: 'Datos Personales',
          icon: 'bi-person-vcard-fill',
          iconStyle: 'vis-icon--datos',
          visible: true,
          sinSwitchSeccion: true,
          atributos: [
            { key: 'datos-personales.foto', label: 'Foto', visible: true },
            { key: 'datos-personales.email', label: 'Correo electrónico', visible: true },
            { key: 'datos-personales.telefono', label: 'Teléfono', visible: true },
            { key: 'datos-personales.ciudad-pais', label: 'Ciudad y país', visible: true },
            { key: 'datos-personales.linkedin', label: 'LinkedIn', visible: true },
          ],
        },
      ],
    },
    {
      id: 'profesional',
      titulo: 'Información Profesional',
      icon: 'bi-briefcase-fill',
      clase: 'vis-group-label--profesional',
      accordionOpen: false,
      items: [
        {
          key: 'perfil',
          label: 'Perfil',
          icon: 'bi-person-badge-fill',
          iconStyle: 'vis-icon--perfil',
          visible: true,
          sinSwitchSeccion: true,
          atributos: [
            { key: 'perfil.experiencia-perfil', label: 'Experiencia (perfil)', visible: true },
            { key: 'perfil.aspiracion-salarial', label: 'Salarios', visible: true },
          ],
        },
        {
          key: 'experiencia',
          label: 'Experiencia',
          icon: 'bi-briefcase-fill',
          iconStyle: 'vis-icon--experiencia',
          visible: true,
          sinSwitchSeccion: true,
          atributos: [
            { key: 'experiencia.referencia-laboral', label: 'Referencia laboral', visible: true },
            {
              key: 'experiencia.soporte-certificacion-laboral',
              label: 'Soportes certificación laboral',
              visible: true,
            },
          ],
        },
        {
          key: 'formacion-academica',
          label: 'Formación Académica',
          icon: 'bi-mortarboard-fill',
          iconStyle: 'vis-icon--educacion',
          visible: true,
          sinSwitchSeccion: true,
          atributos: [
            { key: 'formacion-academica.descargar-soporte', label: 'Descargar soporte', visible: true },
          ],
        },
        {
          key: 'diplomados',
          label: 'Diplomados',
          icon: 'bi-award-fill',
          iconStyle: 'vis-icon--educacion',
          visible: true,
          atributos: [
            {
              key: 'diplomados.descargar-soporte-certificado',
              label: 'Descargar soporte certificado',
              visible: true,
            },
          ],
        },
        {
          key: 'certificaciones',
          label: 'Certificaciones',
          icon: 'bi-patch-check-fill',
          iconStyle: 'vis-icon--educacion',
          visible: true,
          atributos: [
            {
              key: 'certificaciones.descargar-soporte-certificado',
              label: 'Descargar soporte certificado',
              visible: true,
            },
          ],
        },
        {
          key: 'cursos',
          label: 'Cursos',
          icon: 'bi-book-half',
          iconStyle: 'vis-icon--educacion',
          visible: true,
          atributos: [
            {
              key: 'cursos.descargar-soporte-certificado',
              label: 'Descargar soporte certificado',
              visible: true,
            },
          ],
        },
        {
          key: 'proyectos',
          label: 'Proyectos',
          icon: 'bi-kanban-fill',
          iconStyle: 'vis-icon--proyectos',
          visible: true,
          atributos: [
            { key: 'proyectos.nombre', label: 'Nombre', visible: true },
            { key: 'proyectos.rol', label: 'Rol', visible: true },
            { key: 'proyectos.equipo', label: 'Tamaño del equipo', visible: true },
            { key: 'proyectos.duracion', label: 'Duración', visible: true },
            { key: 'proyectos.stack', label: 'Stack tecnológico', visible: true },
            { key: 'proyectos.aporte', label: 'Aporte', visible: true },
            { key: 'proyectos.logro', label: 'Logro', visible: true },
            { key: 'proyectos.desafio', label: 'Desafío', visible: true },
          ],
        },
        {
          key: 'habilidades',
          label: 'Habilidades',
          icon: 'bi-stars',
          iconStyle: 'vis-icon--habilidades',
          visible: true,
          atributos: [
            { key: 'habilidades.nombre', label: 'Nombre', visible: true },
            { key: 'habilidades.tipo', label: 'Tipo', visible: true },
            { key: 'habilidades.nivel', label: 'Nivel', visible: true },
            { key: 'habilidades.descripcion', label: 'Descripción', visible: true },
          ],
        },
      ],
    },
  ];

  constructor(
    private cvEditorService: CvEditorService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  toggleVisGrupo(grupo: ConfigVisGroup): void {
    grupo.accordionOpen = !grupo.accordionOpen;
  }

  ngOnInit(): void {
    this.cvEditorService.getPresentacion().subscribe({
      next: p => {
        this.urlCv = this.construirUrlCvPublico(p.urlPublica);
        this.cvPublicado = !!p.publicado;
        this.urlCvCargando = false;
        this.presentacionLista = true;
      },
      error: () => {
        this.urlCv = '';
        this.cvPublicado = false;
        this.urlCvCargando = false;
        this.presentacionLista = false;
      },
    });

    this.cvEditorService.getVisibilidad().subscribe({
      next: data => {
        const map = new Map<string, boolean>();
        data.forEach(item => map.set(this.normalizeSeccionKey(item.seccion), item.visible));
        this.allVisItems().forEach(campo => {
          const sectionVal = map.get(campo.key);
          if (campo.sinSwitchSeccion) {
            campo.visible = true;
          } else if (sectionVal != null) {
            campo.visible = sectionVal;
          }
          campo.atributos.forEach(attr => {
            const attrVal = map.get(attr.key);
            if (attrVal != null) attr.visible = attrVal;
          });
          if (!campo.visible && !campo.sinSwitchSeccion) {
            campo.atributos.forEach(attr => (attr.visible = false));
          } else if (!campo.sinSwitchSeccion && campo.visible && !campo.atributos.some(a => a.visible)) {
            campo.visible = false;
          }
        });

        const educLegacy = map.get('educacion');
        const subFormKeys = ['formacion-academica', 'diplomados', 'certificaciones', 'cursos'] as const;
        if (educLegacy != null) {
          subFormKeys.forEach(k => {
            if (map.has(k)) return;
            const item = this.allVisItems().find(i => i.key === k);
            if (!item) return;
            item.visible = educLegacy;
            item.atributos.forEach(a => {
              if (!map.has(a.key)) a.visible = educLegacy;
            });
          });
        }
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.loadError),
    });
  }

  private allVisItems(): ConfigVisItem[] {
    return this.visibilidadGrupos.flatMap(g => g.items);
  }

  private normalizeSeccionKey(seccion: string | null | undefined): string {
    const raw = (seccion ?? '').trim().toLowerCase();
    if (raw.includes('.')) return raw;
    switch (raw) {
      case 'datospersonales':
      case 'datos_personales':
      case 'datos-personales':
      case 'personales':
      case 'ubicacion':
      case 'email':
      case 'telefono':
        return 'datos-personales';
      case 'perfil':
      case 'salario':
        return 'perfil';
      case 'experiencia':
      case 'experiencia-laboral':
        return 'experiencia';
      case 'formacion':
      case 'educacion':
        return 'educacion';
      case 'formacion-academica':
      case 'formacionacademica':
        return 'formacion-academica';
      case 'diplomados':
        return 'diplomados';
      case 'certificaciones':
        return 'certificaciones';
      case 'cursos':
        return 'cursos';
      case 'habilidades':
        return 'habilidades';
      case 'proyectos':
        return 'proyectos';
      default:
        return raw;
    }
  }

  private guardarVisibilidad(cambios: Array<{ seccion: string; visible: boolean }>): void {
    this.cvEditorService.updateVisibilidad(cambios).subscribe({
      next: () => {
        this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
      },
      error: (error: HttpErrorResponse) =>
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError),
    });
  }

  onToggleSeccion(campo: ConfigVisItem): void {
    if (!campo.visible) {
      campo.atributos.forEach(attr => {
        attr.visible = false;
      });
    }
    const cambios = [
      { seccion: campo.key, visible: campo.visible },
      ...campo.atributos.map(attr => ({ seccion: attr.key, visible: campo.visible ? attr.visible : false })),
    ];
    this.guardarVisibilidad(cambios);
  }

  onToggleAtributo(campo: ConfigVisItem, attr: ConfigVisAtributo): void {
    if (attr.visible && !campo.visible && !campo.sinSwitchSeccion) {
      campo.visible = true;
    }
    if (campo.sinSwitchSeccion) {
      campo.visible = true;
    } else {
      const visibles = campo.atributos.some(a => a.visible);
      if (!visibles) campo.visible = false;
    }
    this.guardarVisibilidad([
      { seccion: campo.key, visible: campo.sinSwitchSeccion ? true : campo.visible },
      { seccion: attr.key, visible: attr.visible },
    ]);
  }

  copiarUrl(): void {
    const u = this.urlCv?.trim();
    if (!u) return;
    navigator.clipboard.writeText(u);
    this.copiado = true;
    setTimeout(() => (this.copiado = false), 2000);
  }

  onCvPublicadoChange(): void {
    if (!this.presentacionLista || this.guardandoPublicacion) return;
    const deseado = this.cvPublicado;
    this.guardandoPublicacion = true;
    this.cvEditorService.updateCurriculumPublicacion(deseado).subscribe({
      next: p => {
        this.cvPublicado = !!p.publicado;
        this.guardandoPublicacion = false;
        this.notificationService.success(NOTIFICATION_MESSAGES.cvPublicacionUpdated);
      },
      error: (error: HttpErrorResponse) => {
        this.cvPublicado = !deseado;
        this.guardandoPublicacion = false;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
    });
  }

  actualizarContrasena(): void {
    const actual = this.passwordActual.trim();
    const nueva = this.passwordNueva.trim();
    const nueva2 = this.passwordNueva2.trim();

    if (!actual) {
      this.notificationService.warning(this.pwdFormMsg.passwordCurrentRequired);
      return;
    }
    if (!nueva) {
      this.notificationService.warning(this.pwdFormMsg.passwordNewRequired);
      return;
    }
    if (nueva.length < 8) {
      this.notificationService.warning(this.pwdFormMsg.passwordMinLength);
      return;
    }
    if (nueva !== nueva2) {
      this.notificationService.warning(this.pwdFormMsg.passwordMismatch);
      return;
    }

    this.guardandoContrasena = true;
    this.authService.changePassword(actual, nueva).subscribe({
      next: res => {
        this.notificationService.success(
          (res.message && res.message.trim()) || NOTIFICATION_MESSAGES.passwordChanged
        );
        this.limpiarCamposContrasena();
        this.guardandoContrasena = false;
      },
      error: (error: HttpErrorResponse) => {
        this.notificationService.error(
          extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError
        );
        this.guardandoContrasena = false;
      },
    });
  }

  private limpiarCamposContrasena(): void {
    this.passwordActual = '';
    this.passwordNueva = '';
    this.passwordNueva2 = '';
  }

  /** Origen del navegador + ruta de la app pública `/cv/{slug}` (mismo despliegue que esta SPA). */
  private construirUrlCvPublico(urlPublica: string | null | undefined): string {
    const slug = (urlPublica ?? '').trim();
    if (!slug || typeof window === 'undefined') return '';
    const origin = window.location.origin.replace(/\/$/, '');
    return `${origin}/cv/${encodeURIComponent(slug)}`;
  }
}
