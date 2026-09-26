import { Component, HostListener, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdminService,
  AUDITORIA_PURGE_CONFIRMACION_VACIAR,
  AuditoriaAdminListItemDto,
  AuditoriaAuthListItemDto,
  AuditoriaCvListItemDto,
} from '../../../core/services/admin/admin.service';
import {
  AUDITORIA_ADMIN_ACCION_LABELS,
  AUDITORIA_AUTH_ACCION_LABELS,
  AUDITORIA_CV_ACCION_LABELS,
  etiquetaAuditoriaAccion,
} from '../../../core/constants/auditoria-accion-labels';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';

type AuditoriaPurgeModo = 'anioMes' | 'anio' | 'todo';
type AuditoriaPurgeTabla = 'admin' | 'cv' | 'auth';

interface PaginaAuditoria<TItem> {
  items: TItem[] | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Estado (lista + filtros + paginación + mantenimiento) de una pestaña de auditoría.
 * Una instancia por pestaña (admin/cv/auth) — mismo shape, item tipado distinto. */
class AuditoriaTabState<TItem> {
  loading: boolean;
  error: string | null = null;
  items: TItem[] = [];
  total = 0;
  page = 1;
  pageSize = 10;
  totalPages = 1;

  filtroAccion = '';
  busqueda = '';

  modalMantenimiento = false;
  anioPurge = new Date().getUTCFullYear();
  mesPurge = 1;
  confirmVaciar = '';
  showConfirmError = false;
  purging = false;

  constructor(loadingInicial = false) {
    this.loading = loadingInicial;
  }

  get hayFiltros(): boolean {
    return !!(this.filtroAccion?.trim() || this.busqueda?.trim());
  }

  get rangoTexto(): string {
    if (this.total === 0) return '';
    const desde = (this.page - 1) * this.pageSize + 1;
    const hasta = Math.min(this.page * this.pageSize, this.total);
    return `Mostrando ${desde}–${hasta} de ${this.total}`;
  }

  get canVaciarCompleto(): boolean {
    return this.confirmVaciar.trim() === AUDITORIA_PURGE_CONFIRMACION_VACIAR;
  }
}

@Component({
  selector: 'app-admin-auditoria',
  standalone: false,
  templateUrl: './admin-auditoria.component.html',
})
export class AdminAuditoriaComponent implements OnInit {
  pestana: AuditoriaPurgeTabla = 'admin';

  readonly admin = new AuditoriaTabState<AuditoriaAdminListItemDto>(true);
  readonly cv = new AuditoriaTabState<AuditoriaCvListItemDto>();
  readonly auth = new AuditoriaTabState<AuditoriaAuthListItemDto>();

  readonly opcionesAccionAdmin = Object.entries(AUDITORIA_ADMIN_ACCION_LABELS).map(([codigo, etiqueta]) => ({
    codigo,
    etiqueta,
  }));
  readonly opcionesAccionCv = Object.entries(AUDITORIA_CV_ACCION_LABELS).map(([codigo, etiqueta]) => ({
    codigo,
    etiqueta,
  }));
  readonly opcionesAccionAuth = Object.entries(AUDITORIA_AUTH_ACCION_LABELS).map(([codigo, etiqueta]) => ({
    codigo,
    etiqueta,
  }));

  readonly fraseVaciar = AUDITORIA_PURGE_CONFIRMACION_VACIAR;
  aniosPurge: number[] = [];
  mesesPurge = [
    { v: 1, n: 'Enero' },
    { v: 2, n: 'Febrero' },
    { v: 3, n: 'Marzo' },
    { v: 4, n: 'Abril' },
    { v: 5, n: 'Mayo' },
    { v: 6, n: 'Junio' },
    { v: 7, n: 'Julio' },
    { v: 8, n: 'Agosto' },
    { v: 9, n: 'Septiembre' },
    { v: 10, n: 'Octubre' },
    { v: 11, n: 'Noviembre' },
    { v: 12, n: 'Diciembre' },
  ];

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const y = new Date().getUTCFullYear();
    for (let i = 0; i <= 20; i++) {
      this.aniosPurge.push(y - i);
    }
    this.cargarAdmin();
  }

  cambiarPestana(t: AuditoriaPurgeTabla): void {
    if (this.pestana === t) return;
    this.cerrarModalesMantenimiento();
    this.pestana = t;
    if (t === 'admin') this.cargarAdmin();
    else if (t === 'cv') this.cargarCv();
    else this.cargarAuth();
  }

  onCambioFiltrosAdmin(): void {
    this.admin.page = 1;
    this.cargarAdmin();
  }

  onCambioFiltrosCv(): void {
    this.cv.page = 1;
    this.cargarCv();
  }

  onCambioFiltrosAuth(): void {
    this.auth.page = 1;
    this.cargarAuth();
  }

  limpiarBusquedaAdmin(): void {
    this.admin.busqueda = '';
    this.onCambioFiltrosAdmin();
  }

  limpiarBusquedaCv(): void {
    this.cv.busqueda = '';
    this.onCambioFiltrosCv();
  }

  limpiarBusquedaAuth(): void {
    this.auth.busqueda = '';
    this.onCambioFiltrosAuth();
  }

  limpiarConfirmVaciarAdmin(): void {
    this.admin.confirmVaciar = '';
    this.admin.showConfirmError = false;
  }

  limpiarConfirmVaciarCv(): void {
    this.cv.confirmVaciar = '';
    this.cv.showConfirmError = false;
  }

  limpiarConfirmVaciarAuth(): void {
    this.auth.confirmVaciar = '';
    this.auth.showConfirmError = false;
  }

  onConfirmVaciarAdminChange(): void {
    this.admin.showConfirmError = false;
  }

  onConfirmVaciarCvChange(): void {
    this.cv.showConfirmError = false;
  }

  onConfirmVaciarAuthChange(): void {
    this.auth.showConfirmError = false;
  }

  abrirModalMantenimientoAdmin(): void {
    this.cv.modalMantenimiento = false;
    this.auth.modalMantenimiento = false;
    this.admin.showConfirmError = false;
    this.admin.modalMantenimiento = true;
  }

  cerrarModalMantenimientoAdmin(): void {
    this.admin.modalMantenimiento = false;
  }

  cerrarModalMantenimientoAdminSiBackdrop(ev: MouseEvent | KeyboardEvent): void {
    this.cerrarSiBackdrop(ev, () => this.cerrarModalMantenimientoAdmin());
  }

  abrirModalMantenimientoCv(): void {
    this.admin.modalMantenimiento = false;
    this.auth.modalMantenimiento = false;
    this.cv.showConfirmError = false;
    this.cv.modalMantenimiento = true;
  }

  cerrarModalMantenimientoCv(): void {
    this.cv.modalMantenimiento = false;
  }

  cerrarModalMantenimientoCvSiBackdrop(ev: MouseEvent | KeyboardEvent): void {
    this.cerrarSiBackdrop(ev, () => this.cerrarModalMantenimientoCv());
  }

  abrirModalMantenimientoAuth(): void {
    this.admin.modalMantenimiento = false;
    this.cv.modalMantenimiento = false;
    this.auth.showConfirmError = false;
    this.auth.modalMantenimiento = true;
  }

  cerrarModalMantenimientoAuth(): void {
    this.auth.modalMantenimiento = false;
  }

  cerrarModalMantenimientoAuthSiBackdrop(ev: MouseEvent | KeyboardEvent): void {
    this.cerrarSiBackdrop(ev, () => this.cerrarModalMantenimientoAuth());
  }

  private cerrarSiBackdrop(ev: MouseEvent | KeyboardEvent, cerrar: () => void): void {
    if (ev.target === ev.currentTarget) {
      cerrar();
    }
  }

  private cerrarModalesMantenimiento(): void {
    this.admin.modalMantenimiento = false;
    this.cv.modalMantenimiento = false;
    this.auth.modalMantenimiento = false;
  }

  @HostListener('document:keydown.escape')
  onEscapeCerrarModalMantenimiento(): void {
    if (this.admin.modalMantenimiento) {
      this.cerrarModalMantenimientoAdmin();
    } else if (this.cv.modalMantenimiento) {
      this.cerrarModalMantenimientoCv();
    } else if (this.auth.modalMantenimiento) {
      this.cerrarModalMantenimientoAuth();
    }
  }

  cargarAdmin(): void {
    this.cargarGenerico(
      this.admin,
      this.adminService.getAuditoria(this.admin.page, this.admin.pageSize, this.admin.filtroAccion, this.admin.busqueda),
      'No se pudo cargar la auditoría de administración. Verifica la tabla AuditoriaAdmin (script 14) y que la API esté actualizada.'
    );
  }

  cargarCv(): void {
    this.cargarGenerico(
      this.cv,
      this.adminService.getAuditoriaCvGlobal(this.cv.page, this.cv.pageSize, this.cv.filtroAccion, this.cv.busqueda),
      'No se pudo cargar la auditoría de CV. Verifica la tabla AuditoriaCv (script 15) y que la API esté actualizada.'
    );
  }

  cargarAuth(): void {
    this.cargarGenerico(
      this.auth,
      this.adminService.getAuditoriaAuth(this.auth.page, this.auth.pageSize, this.auth.filtroAccion, this.auth.busqueda),
      'No se pudo cargar la auditoría de autenticación. Verifica la tabla AuditoriaAuth (script 06) y que la API esté actualizada.'
    );
  }

  /** Único punto que sabe cómo cargar una página de auditoría: fija loading/error y
   * vuelca la respuesta en el estado de la pestaña. Las 3 llamadas de arriba solo
   * difieren en qué observable del servicio consultan y en el mensaje de error. */
  private cargarGenerico<TItem>(
    state: AuditoriaTabState<TItem>,
    obs: Observable<PaginaAuditoria<TItem>>,
    mensajeError: string
  ): void {
    state.loading = true;
    state.error = null;
    obs.subscribe({
      next: res => {
        state.items = res.items ?? [];
        state.total = res.total;
        state.page = res.page;
        state.pageSize = res.pageSize;
        state.totalPages = Math.max(1, res.totalPages);
        state.loading = false;
      },
      error: () => {
        state.loading = false;
        state.error = mensajeError;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      },
    });
  }

  irPaginaAdmin(p: number): void {
    this.admin.page = Math.max(1, Math.min(p, this.admin.totalPages));
    this.cargarAdmin();
  }

  irPaginaCv(p: number): void {
    this.cv.page = Math.max(1, Math.min(p, this.cv.totalPages));
    this.cargarCv();
  }

  irPaginaAuth(p: number): void {
    this.auth.page = Math.max(1, Math.min(p, this.auth.totalPages));
    this.cargarAuth();
  }

  purgeAdmin(modo: AuditoriaPurgeModo): void {
    this.purgeGenerico('admin', this.admin, modo, () => this.cerrarModalMantenimientoAdmin(), () => this.cargarAdmin());
  }

  purgeCv(modo: AuditoriaPurgeModo): void {
    this.purgeGenerico('cv', this.cv, modo, () => this.cerrarModalMantenimientoCv(), () => this.cargarCv());
  }

  purgeAuth(modo: AuditoriaPurgeModo): void {
    this.purgeGenerico('auth', this.auth, modo, () => this.cerrarModalMantenimientoAuth(), () => this.cargarAuth());
  }

  /** Único punto que sabe cómo purgar: confirma, valida la frase si modo "todo",
   * llama al backend y recarga. Las 3 llamadas de arriba solo difieren en la tabla,
   * el estado a mutar y cómo cerrar/recargar su propia pestaña. */
  private purgeGenerico<TItem>(
    tabla: AuditoriaPurgeTabla,
    state: AuditoriaTabState<TItem>,
    modo: AuditoriaPurgeModo,
    cerrarModal: () => void,
    recargar: () => void
  ): void {
    const warning = this.getPurgeWarningMessage(tabla, modo);
    if (!globalThis.confirm(warning)) return;

    if (modo === 'todo' && !state.canVaciarCompleto) {
      state.showConfirmError = true;
      this.notificationService.error('Escribe la frase de confirmación exacta para vaciar la tabla.');
      return;
    }
    state.purging = true;
    this.adminService
      .purgeAuditoria({
        tabla,
        modo,
        anio: state.anioPurge,
        mes: modo === 'anioMes' ? state.mesPurge : undefined,
        confirmacion: modo === 'todo' ? state.confirmVaciar.trim() : undefined,
      })
      .subscribe({
        next: res => {
          state.purging = false;
          this.notificationService.success(`Eliminados ${res.eliminados} registro(s).`);
          state.confirmVaciar = '';
          cerrarModal();
          recargar();
        },
        error: (err: { error?: { message?: string } }) => {
          state.purging = false;
          this.notificationService.error(err?.error?.message ?? 'No se pudo completar la purga.');
        },
      });
  }

  etiquetaAccionAdmin(accion: string): string {
    return etiquetaAuditoriaAccion(accion, AUDITORIA_ADMIN_ACCION_LABELS);
  }

  etiquetaAccionCv(accion: string): string {
    return etiquetaAuditoriaAccion(accion, AUDITORIA_CV_ACCION_LABELS);
  }

  etiquetaAccionAuth(accion: string): string {
    return etiquetaAuditoriaAccion(accion, AUDITORIA_AUTH_ACCION_LABELS);
  }

  detalleLegible(json: string | null): string {
    if (!json?.trim()) return '—';
    try {
      const o = JSON.parse(json) as Record<string, string>;
      return Object.entries(o)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ');
    } catch {
      return json.length > 120 ? json.slice(0, 117) + '…' : json;
    }
  }

  private anioMesDe(tabla: AuditoriaPurgeTabla): { anio: number; mes: number } {
    if (tabla === 'admin') return { anio: this.admin.anioPurge, mes: this.admin.mesPurge };
    if (tabla === 'cv') return { anio: this.cv.anioPurge, mes: this.cv.mesPurge };
    return { anio: this.auth.anioPurge, mes: this.auth.mesPurge };
  }

  private getPurgeWarningMessage(tabla: AuditoriaPurgeTabla, modo: AuditoriaPurgeModo): string {
    const nombreTabla = tabla === 'admin' ? 'Auditoría administración' : tabla === 'cv' ? 'Auditoría CV' : 'Auditoría autenticación';
    if (modo === 'todo') {
      return `Advertencia: vas a vaciar COMPLETAMENTE la tabla ${nombreTabla}. Esta acción no se puede deshacer. ¿Continuar?`;
    }
    const { anio, mes } = this.anioMesDe(tabla);
    if (modo === 'anio') {
      return `Advertencia: vas a eliminar registros del año ${anio} en ${nombreTabla}. ¿Continuar?`;
    }
    const mesNombre = this.mesesPurge.find(m => m.v === mes)?.n ?? `mes ${mes}`;
    return `Advertencia: vas a eliminar registros de ${mesNombre} ${anio} en ${nombreTabla}. ¿Continuar?`;
  }
}
