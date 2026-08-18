import { Component, HostListener, OnInit } from '@angular/core';
import {
  AdminService,
  AUDITORIA_PURGE_CONFIRMACION_VACIAR,
  AuditoriaAdminListItemDto,
  AuditoriaAdminPageDto,
  AuditoriaAuthListItemDto,
  AuditoriaAuthPageDto,
  AuditoriaCvListItemDto,
  AuditoriaCvPageDto,
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

@Component({
  selector: 'app-admin-auditoria',
  standalone: false,
  templateUrl: './admin-auditoria.component.html',
})
export class AdminAuditoriaComponent implements OnInit {
  pestana: 'admin' | 'cv' | 'auth' = 'admin';

  modalMantenimientoAdmin = false;
  modalMantenimientoCv = false;
  modalMantenimientoAuth = false;

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

  filtroAccionAdmin = '';
  busquedaAdmin = '';
  filtroAccionCv = '';
  busquedaCv = '';
  filtroAccionAuth = '';
  busquedaAuth = '';

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

  anioPurgeAdmin = new Date().getUTCFullYear();
  mesPurgeAdmin = 1;
  confirmVaciarAdmin = '';
  showConfirmErrorAdmin = false;
  purgingAdmin = false;

  anioPurgeCv = new Date().getUTCFullYear();
  mesPurgeCv = 1;
  confirmVaciarCv = '';
  showConfirmErrorCv = false;
  purgingCv = false;

  anioPurgeAuth = new Date().getUTCFullYear();
  mesPurgeAuth = 1;
  confirmVaciarAuth = '';
  showConfirmErrorAuth = false;
  purgingAuth = false;

  loadingAdmin = true;
  errorAdmin: string | null = null;
  itemsAdmin: AuditoriaAdminListItemDto[] = [];
  totalAdmin = 0;
  pageAdmin = 1;
  pageSizeAdmin = 10;
  totalPagesAdmin = 1;

  loadingCv = false;
  errorCv: string | null = null;
  itemsCv: AuditoriaCvListItemDto[] = [];
  totalCv = 0;
  pageCv = 1;
  pageSizeCv = 10;
  totalPagesCv = 1;

  loadingAuth = false;
  errorAuth: string | null = null;
  itemsAuth: AuditoriaAuthListItemDto[] = [];
  totalAuth = 0;
  pageAuth = 1;
  pageSizeAuth = 10;
  totalPagesAuth = 1;

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

  get hayFiltrosAdmin(): boolean {
    return !!(this.filtroAccionAdmin?.trim() || this.busquedaAdmin?.trim());
  }

  get hayFiltrosCv(): boolean {
    return !!(this.filtroAccionCv?.trim() || this.busquedaCv?.trim());
  }

  get hayFiltrosAuth(): boolean {
    return !!(this.filtroAccionAuth?.trim() || this.busquedaAuth?.trim());
  }

  get rangoTextoAdmin(): string {
    if (this.totalAdmin === 0) return '';
    const desde = (this.pageAdmin - 1) * this.pageSizeAdmin + 1;
    const hasta = Math.min(this.pageAdmin * this.pageSizeAdmin, this.totalAdmin);
    return `Mostrando ${desde}–${hasta} de ${this.totalAdmin}`;
  }

  get rangoTextoCv(): string {
    if (this.totalCv === 0) return '';
    const desde = (this.pageCv - 1) * this.pageSizeCv + 1;
    const hasta = Math.min(this.pageCv * this.pageSizeCv, this.totalCv);
    return `Mostrando ${desde}–${hasta} de ${this.totalCv}`;
  }

  get rangoTextoAuth(): string {
    if (this.totalAuth === 0) return '';
    const desde = (this.pageAuth - 1) * this.pageSizeAuth + 1;
    const hasta = Math.min(this.pageAuth * this.pageSizeAuth, this.totalAuth);
    return `Mostrando ${desde}–${hasta} de ${this.totalAuth}`;
  }

  cambiarPestana(t: 'admin' | 'cv' | 'auth'): void {
    if (this.pestana === t) return;
    this.cerrarModalesMantenimiento();
    this.pestana = t;
    if (t === 'admin') this.cargarAdmin();
    else if (t === 'cv') this.cargarCv();
    else this.cargarAuth();
  }

  onCambioFiltrosAdmin(): void {
    this.pageAdmin = 1;
    this.cargarAdmin();
  }

  onCambioFiltrosCv(): void {
    this.pageCv = 1;
    this.cargarCv();
  }

  onCambioFiltrosAuth(): void {
    this.pageAuth = 1;
    this.cargarAuth();
  }

  limpiarBusquedaAdmin(): void {
    this.busquedaAdmin = '';
    this.onCambioFiltrosAdmin();
  }

  limpiarBusquedaCv(): void {
    this.busquedaCv = '';
    this.onCambioFiltrosCv();
  }

  limpiarBusquedaAuth(): void {
    this.busquedaAuth = '';
    this.onCambioFiltrosAuth();
  }

  limpiarConfirmVaciarAdmin(): void {
    this.confirmVaciarAdmin = '';
    this.showConfirmErrorAdmin = false;
  }

  limpiarConfirmVaciarCv(): void {
    this.confirmVaciarCv = '';
    this.showConfirmErrorCv = false;
  }

  limpiarConfirmVaciarAuth(): void {
    this.confirmVaciarAuth = '';
    this.showConfirmErrorAuth = false;
  }

  onConfirmVaciarAdminChange(): void {
    this.showConfirmErrorAdmin = false;
  }

  onConfirmVaciarCvChange(): void {
    this.showConfirmErrorCv = false;
  }

  onConfirmVaciarAuthChange(): void {
    this.showConfirmErrorAuth = false;
  }

  get canVaciarAdminCompleto(): boolean {
    return this.confirmVaciarAdmin.trim() === this.fraseVaciar;
  }

  get canVaciarCvCompleto(): boolean {
    return this.confirmVaciarCv.trim() === this.fraseVaciar;
  }

  get canVaciarAuthCompleto(): boolean {
    return this.confirmVaciarAuth.trim() === this.fraseVaciar;
  }

  abrirModalMantenimientoAdmin(): void {
    this.modalMantenimientoCv = false;
    this.modalMantenimientoAuth = false;
    this.showConfirmErrorAdmin = false;
    this.modalMantenimientoAdmin = true;
  }

  cerrarModalMantenimientoAdmin(): void {
    this.modalMantenimientoAdmin = false;
  }

  cerrarModalMantenimientoAdminSiBackdrop(ev: MouseEvent | KeyboardEvent): void {
    if (ev.target === ev.currentTarget) {
      this.cerrarModalMantenimientoAdmin();
    }
  }

  abrirModalMantenimientoCv(): void {
    this.modalMantenimientoAdmin = false;
    this.modalMantenimientoAuth = false;
    this.showConfirmErrorCv = false;
    this.modalMantenimientoCv = true;
  }

  cerrarModalMantenimientoCv(): void {
    this.modalMantenimientoCv = false;
  }

  cerrarModalMantenimientoCvSiBackdrop(ev: MouseEvent | KeyboardEvent): void {
    if (ev.target === ev.currentTarget) {
      this.cerrarModalMantenimientoCv();
    }
  }

  abrirModalMantenimientoAuth(): void {
    this.modalMantenimientoAdmin = false;
    this.modalMantenimientoCv = false;
    this.showConfirmErrorAuth = false;
    this.modalMantenimientoAuth = true;
  }

  cerrarModalMantenimientoAuth(): void {
    this.modalMantenimientoAuth = false;
  }

  cerrarModalMantenimientoAuthSiBackdrop(ev: MouseEvent | KeyboardEvent): void {
    if (ev.target === ev.currentTarget) {
      this.cerrarModalMantenimientoAuth();
    }
  }

  private cerrarModalesMantenimiento(): void {
    this.modalMantenimientoAdmin = false;
    this.modalMantenimientoCv = false;
    this.modalMantenimientoAuth = false;
  }

  @HostListener('document:keydown.escape')
  onEscapeCerrarModalMantenimiento(): void {
    if (this.modalMantenimientoAdmin) {
      this.cerrarModalMantenimientoAdmin();
    } else if (this.modalMantenimientoCv) {
      this.cerrarModalMantenimientoCv();
    } else if (this.modalMantenimientoAuth) {
      this.cerrarModalMantenimientoAuth();
    }
  }

  cargarAdmin(): void {
    this.loadingAdmin = true;
    this.errorAdmin = null;
    this.adminService
      .getAuditoria(this.pageAdmin, this.pageSizeAdmin, this.filtroAccionAdmin, this.busquedaAdmin)
      .subscribe({
      next: (res: AuditoriaAdminPageDto) => {
        this.itemsAdmin = res.items ?? [];
        this.totalAdmin = res.total;
        this.pageAdmin = res.page;
        this.pageSizeAdmin = res.pageSize;
        this.totalPagesAdmin = Math.max(1, res.totalPages);
        this.loadingAdmin = false;
      },
      error: () => {
        this.loadingAdmin = false;
        this.errorAdmin =
          'No se pudo cargar la auditoría de administración. Verifica la tabla AuditoriaAdmin (script 14) y que la API esté actualizada.';
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      },
    });
  }

  cargarCv(): void {
    this.loadingCv = true;
    this.errorCv = null;
    this.adminService
      .getAuditoriaCvGlobal(this.pageCv, this.pageSizeCv, this.filtroAccionCv, this.busquedaCv)
      .subscribe({
      next: (res: AuditoriaCvPageDto) => {
        this.itemsCv = res.items ?? [];
        this.totalCv = res.total;
        this.pageCv = res.page;
        this.pageSizeCv = res.pageSize;
        this.totalPagesCv = Math.max(1, res.totalPages);
        this.loadingCv = false;
      },
      error: () => {
        this.loadingCv = false;
        this.errorCv =
          'No se pudo cargar la auditoría de CV. Verifica la tabla AuditoriaCv (script 15) y que la API esté actualizada.';
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      },
    });
  }

  cargarAuth(): void {
    this.loadingAuth = true;
    this.errorAuth = null;
    this.adminService
      .getAuditoriaAuth(this.pageAuth, this.pageSizeAuth, this.filtroAccionAuth, this.busquedaAuth)
      .subscribe({
      next: (res: AuditoriaAuthPageDto) => {
        this.itemsAuth = res.items ?? [];
        this.totalAuth = res.total;
        this.pageAuth = res.page;
        this.pageSizeAuth = res.pageSize;
        this.totalPagesAuth = Math.max(1, res.totalPages);
        this.loadingAuth = false;
      },
      error: () => {
        this.loadingAuth = false;
        this.errorAuth =
          'No se pudo cargar la auditoría de autenticación. Verifica la tabla AuditoriaAuth (script 06) y que la API esté actualizada.';
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      },
    });
  }

  irPaginaAdmin(p: number): void {
    this.pageAdmin = Math.max(1, Math.min(p, this.totalPagesAdmin));
    this.cargarAdmin();
  }

  irPaginaCv(p: number): void {
    this.pageCv = Math.max(1, Math.min(p, this.totalPagesCv));
    this.cargarCv();
  }

  irPaginaAuth(p: number): void {
    this.pageAuth = Math.max(1, Math.min(p, this.totalPagesAuth));
    this.cargarAuth();
  }

  purgeAdmin(modo: AuditoriaPurgeModo): void {
    const warningAdmin = this.getPurgeWarningMessage('admin', modo);
    if (!globalThis.confirm(warningAdmin)) return;

    if (modo === 'todo') {
      if (!this.canVaciarAdminCompleto) {
        this.showConfirmErrorAdmin = true;
        this.notificationService.error('Escribe la frase de confirmación exacta para vaciar la tabla.');
        return;
      }
    }
    this.purgingAdmin = true;
    this.adminService
      .purgeAuditoria({
        tabla: 'admin',
        modo,
        anio: this.anioPurgeAdmin,
        mes: modo === 'anioMes' ? this.mesPurgeAdmin : undefined,
        confirmacion: modo === 'todo' ? this.confirmVaciarAdmin.trim() : undefined,
      })
      .subscribe({
        next: res => {
          this.purgingAdmin = false;
          this.notificationService.success(`Eliminados ${res.eliminados} registro(s).`);
          this.confirmVaciarAdmin = '';
          this.cerrarModalMantenimientoAdmin();
          this.cargarAdmin();
        },
        error: (err: { error?: { message?: string } }) => {
          this.purgingAdmin = false;
          this.notificationService.error(err?.error?.message ?? 'No se pudo completar la purga.');
        },
      });
  }

  purgeCv(modo: AuditoriaPurgeModo): void {
    const warningCv = this.getPurgeWarningMessage('cv', modo);
    if (!globalThis.confirm(warningCv)) return;

    if (modo === 'todo') {
      if (!this.canVaciarCvCompleto) {
        this.showConfirmErrorCv = true;
        this.notificationService.error('Escribe la frase de confirmación exacta para vaciar la tabla.');
        return;
      }
    }
    this.purgingCv = true;
    this.adminService
      .purgeAuditoria({
        tabla: 'cv',
        modo,
        anio: this.anioPurgeCv,
        mes: modo === 'anioMes' ? this.mesPurgeCv : undefined,
        confirmacion: modo === 'todo' ? this.confirmVaciarCv.trim() : undefined,
      })
      .subscribe({
        next: res => {
          this.purgingCv = false;
          this.notificationService.success(`Eliminados ${res.eliminados} registro(s).`);
          this.confirmVaciarCv = '';
          this.cerrarModalMantenimientoCv();
          this.cargarCv();
        },
        error: (err: { error?: { message?: string } }) => {
          this.purgingCv = false;
          this.notificationService.error(err?.error?.message ?? 'No se pudo completar la purga.');
        },
      });
  }

  purgeAuth(modo: AuditoriaPurgeModo): void {
    const warningAuth = this.getPurgeWarningMessage('auth', modo);
    if (!globalThis.confirm(warningAuth)) return;

    if (modo === 'todo') {
      if (!this.canVaciarAuthCompleto) {
        this.showConfirmErrorAuth = true;
        this.notificationService.error('Escribe la frase de confirmación exacta para vaciar la tabla.');
        return;
      }
    }
    this.purgingAuth = true;
    this.adminService
      .purgeAuditoria({
        tabla: 'auth',
        modo,
        anio: this.anioPurgeAuth,
        mes: modo === 'anioMes' ? this.mesPurgeAuth : undefined,
        confirmacion: modo === 'todo' ? this.confirmVaciarAuth.trim() : undefined,
      })
      .subscribe({
        next: res => {
          this.purgingAuth = false;
          this.notificationService.success(`Eliminados ${res.eliminados} registro(s).`);
          this.confirmVaciarAuth = '';
          this.cerrarModalMantenimientoAuth();
          this.cargarAuth();
        },
        error: (err: { error?: { message?: string } }) => {
          this.purgingAuth = false;
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

  private getPurgeWarningMessage(tabla: AuditoriaPurgeTabla, modo: AuditoriaPurgeModo): string {
    const nombreTabla = tabla === 'admin' ? 'Auditoría administración' : tabla === 'cv' ? 'Auditoría CV' : 'Auditoría autenticación';
    if (modo === 'todo') {
      return `Advertencia: vas a vaciar COMPLETAMENTE la tabla ${nombreTabla}. Esta acción no se puede deshacer. ¿Continuar?`;
    }
    if (modo === 'anio') {
      const anio = tabla === 'admin' ? this.anioPurgeAdmin : tabla === 'cv' ? this.anioPurgeCv : this.anioPurgeAuth;
      return `Advertencia: vas a eliminar registros del año ${anio} en ${nombreTabla}. ¿Continuar?`;
    }

    const anio = tabla === 'admin' ? this.anioPurgeAdmin : tabla === 'cv' ? this.anioPurgeCv : this.anioPurgeAuth;
    const mes = tabla === 'admin' ? this.mesPurgeAdmin : tabla === 'cv' ? this.mesPurgeCv : this.mesPurgeAuth;
    const mesNombre = this.mesesPurge.find(m => m.v === mes)?.n ?? `mes ${mes}`;
    return `Advertencia: vas a eliminar registros de ${mesNombre} ${anio} en ${nombreTabla}. ¿Continuar?`;
  }
}
