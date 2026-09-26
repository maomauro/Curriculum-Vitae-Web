import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';
import {
  CvEditorService,
  ExperienciaDto,
  FormacionDto,
  HabilidadDto,
  ProyectoDto,
} from '../../../core/services/private/cv-editor.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import {
  ConfiguracionCorreoService,
  ConfiguracionCorreoDto,
} from '../../../core/services/private/configuracion-correo.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { APP_MESSAGES, DEFAULT_APP_LOCALE } from '../../../core/constants/messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';
import { PreviewPublicoPanelComponent } from './preview-publico-panel.component';

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

interface ConfiguracionCorreoForm {
  host: string;
  puerto: number;
  usarTls: boolean;
  password: string;
}

function configuracionCorreoFormVacio(): ConfiguracionCorreoForm {
  return { host: 'smtp.gmail.com', puerto: 587, usarTls: true, password: '' };
}

@Component({
  selector: 'app-configuracion',
  standalone: false,
  templateUrl: './configuracion.component.html',
})
export class ConfiguracionComponent implements OnInit {
  readonly pwdFormMsg = APP_MESSAGES[DEFAULT_APP_LOCALE].forms.configuracion;

  /** Panel de vista previa en vivo (Dashboard/Información profesional) -- se recarga
   * después de cada cambio de visibilidad guardado, ver guardarVisibilidad(). */
  @ViewChild(PreviewPublicoPanelComponent) previewPanel?: PreviewPublicoPanelComponent;

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

  /** Configuración SMTP para enviar correos a reclutadores desde Analizar Oferta ->
   * Enviar correo. Una sola por CV -- el remitente/login SMTP siempre es el correo de
   * Información Personal, no se pide otro dato acá. */
  loadingCorreo = true;
  correoConfig: ConfiguracionCorreoDto | null = null;
  correoForm: ConfiguracionCorreoForm = configuracionCorreoFormVacio();
  guardandoCorreo = false;

  /** Listas completas de Experiencia/Educación/Proyectos/Habilidades -- solo para los
   * controles "Activar todos"/"Inactivar todos" en bloque de acá abajo (accesos rápidos
   * a la misma acción que ya existe en cada vista de edición; no se editan acá). */
  experiencias: ExperienciaDto[] = [];
  formaciones: FormacionDto[] = [];
  proyectos: ProyectoDto[] = [];
  habilidades: HabilidadDto[] = [];
  guardandoVisibilidadBloqueExperiencia = false;
  guardandoVisibilidadBloqueFormacion = false;
  guardandoVisibilidadBloqueProyecto = false;
  guardandoVisibilidadBloqueHabilidad = false;

  get hayExperienciasOcultas(): boolean {
    return this.experiencias.some(e => !e.mostrarEnCv);
  }
  get hayExperienciasVisibles(): boolean {
    return this.experiencias.some(e => e.mostrarEnCv);
  }
  get hayFormacionesOcultas(): boolean {
    return this.formaciones.some(f => !f.mostrarEnCv);
  }
  get hayFormacionesVisibles(): boolean {
    return this.formaciones.some(f => f.mostrarEnCv);
  }
  get hayProyectosOcultos(): boolean {
    return this.proyectos.some(p => !p.mostrarEnCv);
  }
  get hayProyectosVisibles(): boolean {
    return this.proyectos.some(p => p.mostrarEnCv);
  }
  get hayHabilidadesOcultas(): boolean {
    return this.habilidades.some(h => !h.mostrarEnCv);
  }
  get hayHabilidadesVisibles(): boolean {
    return this.habilidades.some(h => h.mostrarEnCv);
  }

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

  /** Interruptores maestros: si la pestaña existe en el CV público. Mismo orden que los
   * tabs (Dashboard -> Profesional -> Hoja de vida). Se guardan igual que cualquier otro
   * ConfigVisItem (ver allVisItems/onToggleSeccion) -- solo se muestran fuera del
   * acordeón, sin agrupar, porque no tienen atributos propios. */
  pestanasPublicasCv: ConfigVisItem[] = [
    {
      key: 'dashboard.publico',
      label: 'Dashboard analítico',
      icon: 'bi-bar-chart-line',
      iconStyle: 'vis-icon--perfil',
      visible: true,
      atributos: [],
    },
    {
      key: 'profesional.publico',
      label: 'Información profesional',
      icon: 'bi-person-lines-fill',
      iconStyle: 'vis-icon--datos',
      visible: true,
      atributos: [],
    },
    {
      key: 'hoja-de-vida.publico',
      label: 'Hoja de vida',
      icon: 'bi-file-earmark-person',
      iconStyle: 'vis-icon--proyectos',
      visible: true,
      atributos: [],
    },
  ];

  visibilidadGrupos: ConfigVisGroup[] = [
    {
      id: 'dashboard-publico',
      titulo: 'Contenido del Dashboard analítico',
      icon: 'bi-bar-chart-steps',
      clase: 'vis-group-label--profesional',
      accordionOpen: false,
      items: [
        {
          key: 'dashboard.metricas',
          label: 'Tarjetas de métricas (3)',
          icon: 'bi-speedometer2',
          iconStyle: 'vis-icon--datos',
          visible: true,
          atributos: [],
        },
        {
          key: 'dashboard.graficas',
          label: 'Gráficas analíticas (4)',
          icon: 'bi-pie-chart-fill',
          iconStyle: 'vis-icon--proyectos',
          visible: true,
          atributos: [],
        },
      ],
    },
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
      items: [],
    },
  ];

  interruptorVisibilidadDeshabilitado(campo: ConfigVisItem): boolean {
    if (campo.key === 'dashboard.metricas' || campo.key === 'dashboard.graficas') {
      const maestro = this.allVisItems().find(i => i.key === 'dashboard.publico');
      return !maestro?.visible;
    }
    return false;
  }

  constructor(
    private cvEditorService: CvEditorService,
    private authService: AuthService,
    private configuracionCorreoService: ConfiguracionCorreoService,
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
          } else if (
            !campo.sinSwitchSeccion &&
            campo.visible &&
            campo.atributos.length > 0 &&
            !campo.atributos.some(a => a.visible)
          ) {
            campo.visible = false;
          }
        });
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.loadError),
    });

    this.cargarConfiguracionCorreo();
    this.cargarListasProfesional();
  }

  private cargarListasProfesional(): void {
    forkJoin({
      experiencias: this.cvEditorService.getExperiencias(),
      formaciones: this.cvEditorService.getFormaciones(),
      proyectos: this.cvEditorService.getProyectos(),
      habilidades: this.cvEditorService.getHabilidades(),
    }).subscribe({
      next: ({ experiencias, formaciones, proyectos, habilidades }) => {
        this.experiencias = experiencias;
        this.formaciones = formaciones;
        this.proyectos = proyectos;
        this.habilidades = habilidades;
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.loadError),
    });
  }

  private actualizarVisibilidadEnBloque<T extends { mostrarEnCv: boolean }>(
    items: T[],
    getId: (item: T) => number,
    mostrar: boolean,
    actualizarUno: (id: number) => Observable<T>,
    aplicarResultado: (items: T[], actualizado: T) => void,
    guardando: (valor: boolean) => void
  ): void {
    const objetivo = items.filter(i => i.mostrarEnCv !== mostrar);
    if (objetivo.length === 0) {
      return;
    }
    guardando(true);
    forkJoin(objetivo.map(i => actualizarUno(getId(i)))).subscribe({
      next: actualizados => {
        actualizados.forEach(actualizado => aplicarResultado(items, actualizado));
        guardando(false);
        this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
        this.previewPanel?.recargar();
      },
      error: (error: HttpErrorResponse) => {
        guardando(false);
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
    });
  }

  activarTodasExperiencias(): void {
    this.actualizarVisibilidadEnBloqueExperiencia(true);
  }
  inactivarTodasExperiencias(): void {
    this.actualizarVisibilidadEnBloqueExperiencia(false);
  }
  /** Switch único "Experiencia" del bloque de acciones: ON = mostrar todas, OFF = ocultar todas. */
  onToggleBloqueExperiencias(checked: boolean): void {
    if (checked) this.activarTodasExperiencias();
    else this.inactivarTodasExperiencias();
  }
  private actualizarVisibilidadEnBloqueExperiencia(mostrar: boolean): void {
    if (this.guardandoVisibilidadBloqueExperiencia) return;
    this.actualizarVisibilidadEnBloque(
      this.experiencias,
      e => e.experienciaId,
      mostrar,
      id => this.cvEditorService.updateExperienciaVisibilidad(id, { mostrarEnCv: mostrar }),
      (items, actualizado) => {
        const i = items.find(e => e.experienciaId === actualizado.experienciaId);
        if (i) Object.assign(i, actualizado);
      },
      v => (this.guardandoVisibilidadBloqueExperiencia = v)
    );
  }

  activarTodasFormaciones(): void {
    this.actualizarVisibilidadEnBloqueFormacion(true);
  }
  inactivarTodasFormaciones(): void {
    this.actualizarVisibilidadEnBloqueFormacion(false);
  }
  onToggleBloqueFormaciones(checked: boolean): void {
    if (checked) this.activarTodasFormaciones();
    else this.inactivarTodasFormaciones();
  }
  private actualizarVisibilidadEnBloqueFormacion(mostrar: boolean): void {
    if (this.guardandoVisibilidadBloqueFormacion) return;
    this.actualizarVisibilidadEnBloque(
      this.formaciones,
      f => f.formacionId,
      mostrar,
      id => this.cvEditorService.updateFormacionVisibilidad(id, { mostrarEnCv: mostrar }),
      (items, actualizado) => {
        const i = items.find(f => f.formacionId === actualizado.formacionId);
        if (i) Object.assign(i, actualizado);
      },
      v => (this.guardandoVisibilidadBloqueFormacion = v)
    );
  }

  activarTodosProyectos(): void {
    this.actualizarVisibilidadEnBloqueProyecto(true);
  }
  inactivarTodosProyectos(): void {
    this.actualizarVisibilidadEnBloqueProyecto(false);
  }
  onToggleBloqueProyectos(checked: boolean): void {
    if (checked) this.activarTodosProyectos();
    else this.inactivarTodosProyectos();
  }
  private actualizarVisibilidadEnBloqueProyecto(mostrar: boolean): void {
    if (this.guardandoVisibilidadBloqueProyecto) return;
    this.actualizarVisibilidadEnBloque(
      this.proyectos,
      p => p.proyectoId,
      mostrar,
      id => this.cvEditorService.updateProyectoVisibilidad(id, { mostrarEnCv: mostrar }),
      (items, actualizado) => {
        const i = items.find(p => p.proyectoId === actualizado.proyectoId);
        if (i) Object.assign(i, actualizado);
      },
      v => (this.guardandoVisibilidadBloqueProyecto = v)
    );
  }

  activarTodasHabilidades(): void {
    this.actualizarVisibilidadEnBloqueHabilidad(true);
  }
  inactivarTodasHabilidades(): void {
    this.actualizarVisibilidadEnBloqueHabilidad(false);
  }
  onToggleBloqueHabilidades(checked: boolean): void {
    if (checked) this.activarTodasHabilidades();
    else this.inactivarTodasHabilidades();
  }
  private actualizarVisibilidadEnBloqueHabilidad(mostrar: boolean): void {
    if (this.guardandoVisibilidadBloqueHabilidad) return;
    this.actualizarVisibilidadEnBloque(
      this.habilidades,
      h => h.habilidadId,
      mostrar,
      id => this.cvEditorService.updateHabilidadVisibilidad(id, { mostrarEnCv: mostrar }),
      (items, actualizado) => {
        const i = items.find(h => h.habilidadId === actualizado.habilidadId);
        if (i) Object.assign(i, actualizado);
      },
      v => (this.guardandoVisibilidadBloqueHabilidad = v)
    );
  }

  private cargarConfiguracionCorreo(): void {
    this.loadingCorreo = true;
    this.configuracionCorreoService.getConfig().subscribe({
      next: data => {
        this.correoConfig = data;
        this.correoForm = { host: data.host, puerto: data.puerto, usarTls: data.usarTls, password: '' };
        this.loadingCorreo = false;
      },
      error: () => {
        this.loadingCorreo = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      },
    });
  }

  guardarConfiguracionCorreo(): void {
    if (this.guardandoCorreo) return;
    if (!this.correoForm.host.trim()) {
      this.notificationService.warning('El host SMTP es requerido.');
      return;
    }
    if (!this.correoConfig?.tieneConfiguracion && !this.correoForm.password.trim()) {
      this.notificationService.warning('La contraseña es requerida para configurar el correo por primera vez.');
      return;
    }

    this.guardandoCorreo = true;
    this.configuracionCorreoService
      .guardarConfig({
        host: this.correoForm.host.trim(),
        puerto: this.correoForm.puerto,
        usarTls: this.correoForm.usarTls,
        password: this.correoForm.password.trim() || null,
      })
      .subscribe({
        next: data => {
          this.correoConfig = data;
          this.correoForm = { host: data.host, puerto: data.puerto, usarTls: data.usarTls, password: '' };
          this.guardandoCorreo = false;
          this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
        },
        error: (error: HttpErrorResponse) => {
          this.guardandoCorreo = false;
          this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
        },
      });
  }

  private allVisItems(): ConfigVisItem[] {
    return [...this.pestanasPublicasCv, ...this.visibilidadGrupos.flatMap(g => g.items)];
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
      default:
        return raw;
    }
  }

  private guardarVisibilidad(cambios: { seccion: string; visible: boolean }[]): void {
    this.cvEditorService.updateVisibilidad(cambios).subscribe({
      next: () => {
        this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
        this.previewPanel?.recargar();
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

  /**
   * `preventDefault` en el click: el navegador no cambia el checkbox hasta confirmar.
   * Si cancelas, el estado sigue siendo el anterior (p. ej. ON sigue ON).
   */
  onCvPublicacionClick(ev: MouseEvent): void {
    if (!this.presentacionLista || this.guardandoPublicacion) {
      ev.preventDefault();
      return;
    }
    ev.preventDefault();

    const nuevoValor = !this.cvPublicado;
    const mensaje = nuevoValor
      ? '¿Publicar tu CV en el portal? Aparecerá en las búsquedas públicas y quien tenga el enlace podrá ver tu perfil.'
      : '¿Pasar tu CV a borrador? Dejará de mostrarse en el listado público y el enlace ya no mostrará tu CV a los visitantes.';
    if (!window.confirm(mensaje)) {
      return;
    }

    this.cvPublicado = nuevoValor;
    this.guardandoPublicacion = true;
    this.cvEditorService.updateCurriculumPublicacion(nuevoValor).subscribe({
      next: p => {
        this.cvPublicado = !!p.publicado;
        this.guardandoPublicacion = false;
        this.notificationService.success(NOTIFICATION_MESSAGES.cvPublicacionUpdated);
      },
      error: (error: HttpErrorResponse) => {
        this.cvPublicado = !nuevoValor;
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
