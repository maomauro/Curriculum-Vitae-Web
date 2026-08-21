import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CvEditorService } from '../../../core/services/private/cv-editor.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import {
  ProveedorIaService,
  ProveedorIaCodigo,
  ProveedorIaConfigDto,
} from '../../../core/services/private/proveedor-ia.service';
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

interface ProveedorIaForm {
  proveedor: ProveedorIaCodigo;
  nombre: string;
  modelo: string;
  endpoint: string;
  apiKey: string;
}

function proveedorIaFormVacio(): ProveedorIaForm {
  return { proveedor: 'claude', nombre: '', modelo: '', endpoint: '', apiKey: '' };
}

const PROVEEDORES_SIN_API_KEY_OBLIGATORIA: readonly ProveedorIaCodigo[] = ['ollama', 'otro'];
const PROVEEDORES_QUE_REQUIEREN_ENDPOINT: readonly ProveedorIaCodigo[] = ['ollama'];

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

  /** Conexiones con proveedores de IA que usan "Analizar Oferta" y "Prompts de IA" al
   * invocar al modelo. Puede haber varias guardadas (Claude, OpenAI, Gemini, Ollama/
   * self-hosted, otro); exactamente una queda marcada como activa a la vez. */
  loadingProveedoresIa = true;
  proveedoresIa: ProveedorIaConfigDto[] = [];
  mostrarFormProveedorIa = false;
  editandoProveedorIaId: number | null = null;
  proveedorIaForm: ProveedorIaForm = proveedorIaFormVacio();
  guardandoProveedorIa = false;
  probandoConexionIa = false;
  resultadoPruebaIa: 'ok' | 'error' | null = null;
  mensajePruebaIa: string | null = null;
  activandoProveedorIaId: number | null = null;
  eliminandoProveedorIaId: number | null = null;
  probandoGuardadaProveedorIaId: number | null = null;

  readonly modelosSugeridosPorProveedor: Record<ProveedorIaCodigo, string> = {
    claude: 'claude-opus-4-20250514',
    openai: 'gpt-4.1',
    gemini: 'gemini-flash-latest',
    ollama: 'llama3.1',
    otro: '',
  };

  readonly nombresProveedor: Record<ProveedorIaCodigo, string> = {
    claude: 'Claude (Anthropic)',
    openai: 'OpenAI',
    gemini: 'Gemini (Google)',
    ollama: 'Ollama (local / self-hosted)',
    otro: 'Otro (compatible con API REST)',
  };

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
      ],
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
    private proveedorIaService: ProveedorIaService,
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

    this.cargarProveedoresIa();
  }

  private cargarProveedoresIa(): void {
    this.loadingProveedoresIa = true;
    this.proveedorIaService.getConfigs().subscribe({
      next: data => {
        this.proveedoresIa = data;
        this.loadingProveedoresIa = false;
      },
      error: () => {
        this.loadingProveedoresIa = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
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

  trackByProveedorIa(_index: number, p: ProveedorIaConfigDto): number {
    return p.proveedorIaConfigId;
  }

  nombreProveedor(codigo: ProveedorIaCodigo): string {
    return this.nombresProveedor[codigo];
  }

  etiquetaConexionIa(p: ProveedorIaConfigDto): string {
    return p.nombre?.trim() || this.nombresProveedor[p.proveedor];
  }

  get requiereEndpointIa(): boolean {
    return PROVEEDORES_QUE_REQUIEREN_ENDPOINT.includes(this.proveedorIaForm.proveedor);
  }

  get requiereApiKeyIa(): boolean {
    return !PROVEEDORES_SIN_API_KEY_OBLIGATORIA.includes(this.proveedorIaForm.proveedor);
  }

  onProveedorIaChange(): void {
    this.resultadoPruebaIa = null;
    this.mensajePruebaIa = null;
    if (!this.proveedorIaForm.modelo.trim()) {
      this.proveedorIaForm.modelo = this.modelosSugeridosPorProveedor[this.proveedorIaForm.proveedor];
    }
  }

  abrirNuevaConexionIa(): void {
    this.editandoProveedorIaId = null;
    this.proveedorIaForm = proveedorIaFormVacio();
    this.resultadoPruebaIa = null;
    this.mensajePruebaIa = null;
    this.mostrarFormProveedorIa = true;
  }

  editarConexionIa(p: ProveedorIaConfigDto): void {
    this.editandoProveedorIaId = p.proveedorIaConfigId;
    this.proveedorIaForm = {
      proveedor: p.proveedor,
      nombre: p.nombre ?? '',
      modelo: p.modelo ?? '',
      endpoint: p.endpoint ?? '',
      apiKey: '',
    };
    this.resultadoPruebaIa = null;
    this.mensajePruebaIa = null;
    this.mostrarFormProveedorIa = true;
  }

  cancelarFormProveedorIa(): void {
    this.mostrarFormProveedorIa = false;
  }

  probarConexionIa(): void {
    if (this.probandoConexionIa) return;
    if (this.requiereEndpointIa && !this.proveedorIaForm.endpoint.trim()) {
      this.notificationService.warning('La URL del servidor es requerida para este proveedor.');
      return;
    }

    this.probandoConexionIa = true;
    this.resultadoPruebaIa = null;
    this.mensajePruebaIa = null;
    this.proveedorIaService
      .probarConexion({
        proveedor: this.proveedorIaForm.proveedor,
        modelo: this.proveedorIaForm.modelo.trim() || null,
        endpoint: this.proveedorIaForm.endpoint.trim() || null,
        apiKey: this.proveedorIaForm.apiKey.trim() || null,
      })
      .subscribe({
        next: res => {
          this.probandoConexionIa = false;
          this.resultadoPruebaIa = res.ok ? 'ok' : 'error';
          this.mensajePruebaIa = res.mensaje;
        },
        error: (error: HttpErrorResponse) => {
          this.probandoConexionIa = false;
          this.resultadoPruebaIa = 'error';
          this.mensajePruebaIa = extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError;
        },
      });
  }

  guardarConexionIa(): void {
    if (this.guardandoProveedorIa) return;
    if (this.requiereEndpointIa && !this.proveedorIaForm.endpoint.trim()) {
      this.notificationService.warning('La URL del servidor es requerida para este proveedor.');
      return;
    }
    if (this.editandoProveedorIaId === null && this.requiereApiKeyIa && !this.proveedorIaForm.apiKey.trim()) {
      this.notificationService.warning('La clave de API es requerida para este proveedor.');
      return;
    }

    const payload = {
      proveedor: this.proveedorIaForm.proveedor,
      nombre: this.proveedorIaForm.nombre.trim() || null,
      modelo: this.proveedorIaForm.modelo.trim() || null,
      endpoint: this.proveedorIaForm.endpoint.trim() || null,
      apiKey: this.proveedorIaForm.apiKey.trim() || null,
    };

    this.guardandoProveedorIa = true;
    const guardado$ = this.editandoProveedorIaId !== null
      ? this.proveedorIaService.actualizarConfig(this.editandoProveedorIaId, payload)
      : this.proveedorIaService.crearConfig(payload);

    guardado$.subscribe({
      next: () => {
        this.guardandoProveedorIa = false;
        this.mostrarFormProveedorIa = false;
        this.notificationService.success(
          this.editandoProveedorIaId !== null ? NOTIFICATION_MESSAGES.updateSuccess : NOTIFICATION_MESSAGES.createSuccess
        );
        this.cargarProveedoresIa();
      },
      error: (error: HttpErrorResponse) => {
        this.guardandoProveedorIa = false;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
    });
  }

  activarConexionIa(p: ProveedorIaConfigDto): void {
    if (p.esActivo || this.activandoProveedorIaId) return;

    this.activandoProveedorIaId = p.proveedorIaConfigId;
    this.proveedorIaService.activarConfig(p.proveedorIaConfigId).subscribe({
      next: () => {
        this.activandoProveedorIaId = null;
        this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
        this.cargarProveedoresIa();
      },
      error: (error: HttpErrorResponse) => {
        this.activandoProveedorIaId = null;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
    });
  }

  probarConexionGuardada(p: ProveedorIaConfigDto): void {
    if (this.probandoGuardadaProveedorIaId) return;

    this.probandoGuardadaProveedorIaId = p.proveedorIaConfigId;
    this.proveedorIaService.probarConexionGuardada(p.proveedorIaConfigId).subscribe({
      next: res => {
        this.probandoGuardadaProveedorIaId = null;
        if (res.ok) {
          this.notificationService.success(res.mensaje);
        } else {
          this.notificationService.warning(res.mensaje);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.probandoGuardadaProveedorIaId = null;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.loadError);
      },
    });
  }

  eliminarConexionIa(p: ProveedorIaConfigDto): void {
    if (!confirm(`¿Eliminar la conexión "${this.etiquetaConexionIa(p)}"?`)) return;

    this.eliminandoProveedorIaId = p.proveedorIaConfigId;
    this.proveedorIaService.eliminarConfig(p.proveedorIaConfigId).subscribe({
      next: () => {
        this.eliminandoProveedorIaId = null;
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
        this.cargarProveedoresIa();
      },
      error: (error: HttpErrorResponse) => {
        this.eliminandoProveedorIaId = null;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.deleteError);
      },
    });
  }
}
