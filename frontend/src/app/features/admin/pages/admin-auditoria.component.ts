import { Component, HostListener, OnInit } from '@angular/core';
import {
  AdminService,
  AUDITORIA_PURGE_CONFIRMACION_VACIAR,
  AuditoriaAdminListItemDto,
  AuditoriaAdminPageDto,
  AuditoriaCvListItemDto,
  AuditoriaCvPageDto,
} from '../../../core/services/admin/admin.service';
import {
  AUDITORIA_ADMIN_ACCION_LABELS,
  AUDITORIA_CV_ACCION_LABELS,
  etiquetaAuditoriaAccion,
} from '../../../core/constants/auditoria-accion-labels';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';

type AuditoriaPurgeModo = 'anioMes' | 'anio' | 'todo';
type AuditoriaPurgeTabla = 'admin' | 'cv';

@Component({
  selector: 'app-admin-auditoria',
  standalone: false,
  template: `
    <div class="page-header">
      <div>
        <h4>
          <i class="bi bi-journal-text me-2 text-primary"></i>
          Auditoría
        </h4>
        <span class="text-muted small">
          Historial del panel de administración y de las ediciones que los usuarios hacen en sus CV.
        </span>
      </div>
    </div>

    <ul class="nav nav-tabs px-2 pt-2 mb-0 border-bottom-0">
      <li class="nav-item">
        <button
          type="button"
          class="nav-link"
          [class.active]="pestana === 'admin'"
          (click)="cambiarPestana('admin')">
          Auditoría administración
        </button>
      </li>
      <li class="nav-item">
        <button
          type="button"
          class="nav-link"
          [class.active]="pestana === 'cv'"
          (click)="cambiarPestana('cv')">
          Auditoría CV
        </button>
      </li>
    </ul>

    <div *ngIf="pestana === 'admin'" class="seccion-card border-top-0 rounded-top-0">
      <div *ngIf="loadingAdmin" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando auditoría…</span>
        </div>
      </div>

      <div *ngIf="!loadingAdmin">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 px-2 pt-3 pb-2">
          <div class="seccion-titulo mb-0">Eventos de administración</div>
          <div class="d-flex flex-wrap align-items-center gap-2">
            <div class="d-flex gap-2 flex-nowrap align-items-center admin-usuarios-filtros">
              <select
                class="form-select form-select-sm admin-filter-select"
                [(ngModel)]="filtroAccionAdmin"
                [ngModelOptions]="{ standalone: true }"
                (ngModelChange)="onCambioFiltrosAdmin()">
                <option [ngValue]="''">Todas las acciones</option>
                <option *ngFor="let o of opcionesAccionAdmin" [ngValue]="o.codigo">{{ o.etiqueta }}</option>
              </select>
              <div class="admin-search-with-clear">
                <input
                  type="text"
                  class="form-control form-control-sm admin-search-input"
                  placeholder="Buscar actor, entidad, detalle…"
                  [(ngModel)]="busquedaAdmin"
                  [ngModelOptions]="{ standalone: true }"
                  (ngModelChange)="onCambioFiltrosAdmin()" />
                <button
                  *ngIf="busquedaAdmin?.trim()"
                  type="button"
                  class="admin-search-clear"
                  (click)="limpiarBusquedaAdmin()"
                  aria-label="Limpiar búsqueda">
                  <i class="bi bi-x-lg" aria-hidden="true"></i>
                </button>
              </div>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
              (click)="abrirModalMantenimientoAdmin()">
              <i class="bi bi-trash3 me-1"></i>
              Mantenimiento de registros
            </button>
          </div>
        </div>
        <div *ngIf="errorAdmin" class="alert alert-danger py-2 small mb-3 mx-2">{{ errorAdmin }}</div>

        <div *ngIf="!errorAdmin && !loadingAdmin && totalAdmin === 0">
          <div *ngIf="!hayFiltrosAdmin" class="text-center text-muted py-5 px-2">
            <i class="bi bi-inbox display-6 d-block mb-2"></i>
            <p class="mb-0">Aún no hay eventos de administración registrados.</p>
          </div>
          <div *ngIf="hayFiltrosAdmin" class="text-center text-muted py-5 px-2">
            <i class="bi bi-search admin-search-icon"></i>
            <p class="mt-2 mb-0">No hay eventos que coincidan con el filtro o la búsqueda.</p>
          </div>
        </div>

        <div *ngIf="!errorAdmin && !loadingAdmin && totalAdmin > 0" class="table-responsive admin-table-wrap">
          <table class="table table-hover align-middle w-100 mb-0">
            <thead class="table-light">
              <tr>
                <th scope="col" class="text-end text-muted small text-nowrap" style="width: 3rem">#</th>
                <th scope="col">FECHA (UTC)</th>
                <th scope="col">ACTOR</th>
                <th scope="col">ACCIÓN</th>
                <th scope="col">ENTIDAD</th>
                <th scope="col">DETALLE</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of itemsAdmin; let i = index">
                <td class="text-end text-muted small">{{ (pageAdmin - 1) * pageSizeAdmin + i + 1 }}</td>
                <td class="text-nowrap small">{{ fmtFecha(row.fechaUtc) }}</td>
                <td class="small">
                  <span *ngIf="row.actorEmail">{{ row.actorEmail }}</span>
                  <span *ngIf="!row.actorEmail" class="text-muted">—</span>
                </td>
                <td>
                  <span class="badge rounded-pill bg-light text-dark border">{{ etiquetaAccionAdmin(row.accion) }}</span>
                </td>
                <td class="small text-muted">
                  {{ row.entidadTipo }}<span *ngIf="row.entidadId != null"> #{{ row.entidadId }}</span>
                </td>
                <td class="small font-monospace text-break" style="max-width: 28rem">{{ detalleLegible(row.detalleJson) }}</td>
              </tr>
            </tbody>
          </table>

          <div
            class="d-flex flex-wrap align-items-center justify-content-between gap-2 px-2 py-3 border-top bg-white rounded-bottom">
            <span class="text-muted small"> {{ rangoTextoAdmin }} </span>
            <div class="btn-group btn-group-sm">
              <button
                type="button"
                class="btn btn-outline-secondary"
                [disabled]="pageAdmin <= 1"
                (click)="irPaginaAdmin(pageAdmin - 1)">
                Anterior
              </button>
              <button type="button" class="btn btn-outline-secondary" disabled>{{ pageAdmin }} / {{ totalPagesAdmin }}</button>
              <button
                type="button"
                class="btn btn-outline-secondary"
                [disabled]="pageAdmin >= totalPagesAdmin"
                (click)="irPaginaAdmin(pageAdmin + 1)">
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="pestana === 'cv'" class="seccion-card border-top-0 rounded-top-0">
      <div *ngIf="loadingCv" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando auditoría de CV…</span>
        </div>
      </div>

      <div *ngIf="!loadingCv">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 px-2 pt-3 pb-2">
          <div class="seccion-titulo mb-0">Eventos de edición de CV</div>
          <div class="d-flex flex-wrap align-items-center gap-2">
            <div class="d-flex gap-2 flex-nowrap align-items-center admin-usuarios-filtros">
              <select
                class="form-select form-select-sm admin-filter-select"
                [(ngModel)]="filtroAccionCv"
                [ngModelOptions]="{ standalone: true }"
                (ngModelChange)="onCambioFiltrosCv()">
                <option [ngValue]="''">Todas las acciones</option>
                <option *ngFor="let o of opcionesAccionCv" [ngValue]="o.codigo">{{ o.etiqueta }}</option>
              </select>
              <div class="admin-search-with-clear">
                <input
                  type="text"
                  class="form-control form-control-sm admin-search-input"
                  placeholder="Buscar actor, propietario, URL, detalle…"
                  [(ngModel)]="busquedaCv"
                  [ngModelOptions]="{ standalone: true }"
                  (ngModelChange)="onCambioFiltrosCv()" />
                <button
                  *ngIf="busquedaCv?.trim()"
                  type="button"
                  class="admin-search-clear"
                  (click)="limpiarBusquedaCv()"
                  aria-label="Limpiar búsqueda">
                  <i class="bi bi-x-lg" aria-hidden="true"></i>
                </button>
              </div>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
              (click)="abrirModalMantenimientoCv()">
              <i class="bi bi-trash3 me-1"></i>
              Mantenimiento de registros
            </button>
          </div>
        </div>
        <div *ngIf="errorCv" class="alert alert-danger py-2 small mb-3 mx-2">{{ errorCv }}</div>

        <div *ngIf="!errorCv && !loadingCv && totalCv === 0">
          <div *ngIf="!hayFiltrosCv" class="text-center text-muted py-5 px-2">
            <i class="bi bi-inbox display-6 d-block mb-2"></i>
            <p class="mb-0">Aún no hay eventos de edición de CV registrados.</p>
          </div>
          <div *ngIf="hayFiltrosCv" class="text-center text-muted py-5 px-2">
            <i class="bi bi-search admin-search-icon"></i>
            <p class="mt-2 mb-0">No hay eventos que coincidan con el filtro o la búsqueda.</p>
          </div>
        </div>

        <div *ngIf="!errorCv && !loadingCv && totalCv > 0" class="table-responsive admin-table-wrap">
          <table class="table table-hover align-middle w-100 mb-0">
            <thead class="table-light">
              <tr>
                <th scope="col" class="text-end text-muted small text-nowrap" style="width: 3rem">#</th>
                <th scope="col">FECHA (UTC)</th>
                <th scope="col">ACTOR</th>
                <th scope="col">CV (PROPIETARIO)</th>
                <th scope="col">ACCIÓN</th>
                <th scope="col">ENTIDAD</th>
                <th scope="col">DETALLE</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of itemsCv; let i = index">
                <td class="text-end text-muted small">{{ (pageCv - 1) * pageSizeCv + i + 1 }}</td>
                <td class="text-nowrap small">{{ fmtFecha(row.fechaUtc) }}</td>
                <td class="small">
                  <span *ngIf="row.actorEmail">{{ row.actorEmail }}</span>
                  <span *ngIf="!row.actorEmail" class="text-muted">—</span>
                </td>
                <td class="small">
                  <div *ngIf="row.propietarioEmail">{{ row.propietarioEmail }}</div>
                  <div *ngIf="row.urlPublica" class="text-muted font-monospace">/{{ row.urlPublica }}</div>
                  <span *ngIf="!row.propietarioEmail && !row.urlPublica" class="text-muted">#{{ row.curriculumId }}</span>
                </td>
                <td>
                  <span class="badge rounded-pill bg-light text-dark border">{{ etiquetaAccionCv(row.accion) }}</span>
                </td>
                <td class="small text-muted">
                  {{ row.entidadTipo }}<span *ngIf="row.entidadId != null"> #{{ row.entidadId }}</span>
                </td>
                <td class="small font-monospace text-break" style="max-width: 22rem">{{ detalleLegible(row.detalleJson) }}</td>
              </tr>
            </tbody>
          </table>

          <div
            class="d-flex flex-wrap align-items-center justify-content-between gap-2 px-2 py-3 border-top bg-white rounded-bottom">
            <span class="text-muted small"> {{ rangoTextoCv }} </span>
            <div class="btn-group btn-group-sm">
              <button
                type="button"
                class="btn btn-outline-secondary"
                [disabled]="pageCv <= 1"
                (click)="irPaginaCv(pageCv - 1)">
                Anterior
              </button>
              <button type="button" class="btn btn-outline-secondary" disabled>{{ pageCv }} / {{ totalPagesCv }}</button>
              <button
                type="button"
                class="btn btn-outline-secondary"
                [disabled]="pageCv >= totalPagesCv"
                (click)="irPaginaCv(pageCv + 1)">
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ng-container *ngIf="modalMantenimientoAdmin">
      <div class="portal-modal__backdrop" (click)="cerrarModalMantenimientoAdmin()" aria-hidden="true"></div>
      <div
        id="modalMantenimientoAuditoriaAdmin"
        class="modal show d-block portal-modal__root"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalMantenimientoAuditoriaAdminLabel"
        (click)="cerrarModalMantenimientoAdminSiBackdrop($event)">
        <div
          class="modal-dialog modal-dialog-centered modal-dialog-scrollable portal-modal__dialog portal-modal__dialog--500"
          (click)="$event.stopPropagation()">
          <div class="modal-content portal-modal__panel">
            <div class="modal-header portal-modal__header">
              <div class="portal-modal__title-row">
                <span class="portal-modal__icon" aria-hidden="true">
                  <i class="bi bi-journal-text"></i>
                </span>
                <div>
                  <h2 class="portal-modal__title" id="modalMantenimientoAuditoriaAdminLabel">
                    Mantenimiento — Auditoría administración
                  </h2>
                  <span class="portal-modal__subtitle">
                    Los filtros usan <strong>FechaUtc</strong>. «Vaciar tabla» exige escribir
                    <code>{{ fraseVaciar }}</code> tal cual.
                  </span>
                </div>
              </div>
              <button
                type="button"
                class="btn-close portal-modal__close"
                (click)="cerrarModalMantenimientoAdmin()"
                aria-label="Cerrar"></button>
            </div>
            <div class="modal-body portal-modal__body">
              <div class="row g-3 mb-3">
                <div class="col-6">
                  <label class="form-label small mb-0">Año</label>
                  <select
                    class="form-select form-select-sm mb-2"
                    [(ngModel)]="anioPurgeAdmin"
                    [ngModelOptions]="{ standalone: true }">
                    <option *ngFor="let y of aniosPurge" [ngValue]="y">{{ y }}</option>
                  </select>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger w-100"
                    [disabled]="purgingAdmin"
                    (click)="purgeAdmin('anio')">
                    Borrar año
                  </button>
                </div>
                <div class="col-6">
                  <label class="form-label small mb-0">Mes</label>
                  <select
                    class="form-select form-select-sm mb-2"
                    [(ngModel)]="mesPurgeAdmin"
                    [ngModelOptions]="{ standalone: true }">
                    <option *ngFor="let m of mesesPurge" [ngValue]="m.v">{{ m.n }}</option>
                  </select>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger w-100"
                    [disabled]="purgingAdmin"
                    (click)="purgeAdmin('anioMes')">
                    Borrar mes
                  </button>
                </div>
              </div>
              <hr class="my-2" />
              <label class="form-label small mb-1">Confirmación para vaciar tabla</label>
              <div class="admin-search-with-clear mb-2">
                <input
                  type="text"
                  class="form-control form-control-sm admin-search-input"
                  [(ngModel)]="confirmVaciarAdmin"
                  (ngModelChange)="onConfirmVaciarAdminChange()"
                  [ngModelOptions]="{ standalone: true }"
                  [placeholder]="fraseVaciar"
                  autocomplete="off" />
                <button
                  *ngIf="(confirmVaciarAdmin?.length ?? 0) > 0"
                  type="button"
                  class="admin-search-clear"
                  (click)="limpiarConfirmVaciarAdmin()"
                  aria-label="Limpiar confirmación">
                  <i class="bi bi-x-lg" aria-hidden="true"></i>
                </button>
              </div>
              <div *ngIf="showConfirmErrorAdmin" class="alert alert-danger py-2 small mb-2">
                Debes escribir exactamente <code>{{ fraseVaciar }}</code> para habilitar el vaciado completo.
              </div>
              <button
                type="button"
                class="btn btn-sm btn-danger"
                [disabled]="purgingAdmin || !canVaciarAdminCompleto"
                (click)="purgeAdmin('todo')">
                Vaciar tabla completa
              </button>
            </div>
          </div>
        </div>
      </div>
    </ng-container>

    <ng-container *ngIf="modalMantenimientoCv">
      <div class="portal-modal__backdrop" (click)="cerrarModalMantenimientoCv()" aria-hidden="true"></div>
      <div
        id="modalMantenimientoAuditoriaCv"
        class="modal show d-block portal-modal__root"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalMantenimientoAuditoriaCvLabel"
        (click)="cerrarModalMantenimientoCvSiBackdrop($event)">
        <div
          class="modal-dialog modal-dialog-centered modal-dialog-scrollable portal-modal__dialog portal-modal__dialog--500"
          (click)="$event.stopPropagation()">
          <div class="modal-content portal-modal__panel">
            <div class="modal-header portal-modal__header">
              <div class="portal-modal__title-row">
                <span class="portal-modal__icon" aria-hidden="true">
                  <i class="bi bi-file-earmark-person"></i>
                </span>
                <div>
                  <h2 class="portal-modal__title" id="modalMantenimientoAuditoriaCvLabel">
                    Mantenimiento — Auditoría CV
                  </h2>
                  <span class="portal-modal__subtitle">
                    Los filtros usan <strong>FechaUtc</strong>. «Vaciar tabla» exige escribir
                    <code>{{ fraseVaciar }}</code> tal cual.
                  </span>
                </div>
              </div>
              <button
                type="button"
                class="btn-close portal-modal__close"
                (click)="cerrarModalMantenimientoCv()"
                aria-label="Cerrar"></button>
            </div>
            <div class="modal-body portal-modal__body">
              <div class="row g-3 mb-3">
                <div class="col-6">
                  <label class="form-label small mb-0">Año</label>
                  <select
                    class="form-select form-select-sm mb-2"
                    [(ngModel)]="anioPurgeCv"
                    [ngModelOptions]="{ standalone: true }">
                    <option *ngFor="let y of aniosPurge" [ngValue]="y">{{ y }}</option>
                  </select>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger w-100"
                    [disabled]="purgingCv"
                    (click)="purgeCv('anio')">
                    Borrar año
                  </button>
                </div>
                <div class="col-6">
                  <label class="form-label small mb-0">Mes</label>
                  <select
                    class="form-select form-select-sm mb-2"
                    [(ngModel)]="mesPurgeCv"
                    [ngModelOptions]="{ standalone: true }">
                    <option *ngFor="let m of mesesPurge" [ngValue]="m.v">{{ m.n }}</option>
                  </select>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger w-100"
                    [disabled]="purgingCv"
                    (click)="purgeCv('anioMes')">
                    Borrar mes
                  </button>
                </div>
              </div>
              <hr class="my-2" />
              <label class="form-label small mb-1">Confirmación para vaciar tabla</label>
              <div class="admin-search-with-clear mb-2">
                <input
                  type="text"
                  class="form-control form-control-sm admin-search-input"
                  [(ngModel)]="confirmVaciarCv"
                  (ngModelChange)="onConfirmVaciarCvChange()"
                  [ngModelOptions]="{ standalone: true }"
                  [placeholder]="fraseVaciar"
                  autocomplete="off" />
                <button
                  *ngIf="(confirmVaciarCv?.length ?? 0) > 0"
                  type="button"
                  class="admin-search-clear"
                  (click)="limpiarConfirmVaciarCv()"
                  aria-label="Limpiar confirmación">
                  <i class="bi bi-x-lg" aria-hidden="true"></i>
                </button>
              </div>
              <div *ngIf="showConfirmErrorCv" class="alert alert-danger py-2 small mb-2">
                Debes escribir exactamente <code>{{ fraseVaciar }}</code> para habilitar el vaciado completo.
              </div>
              <button
                type="button"
                class="btn btn-sm btn-danger"
                [disabled]="purgingCv || !canVaciarCvCompleto"
                (click)="purgeCv('todo')">
                Vaciar tabla completa
              </button>
            </div>
          </div>
        </div>
      </div>
    </ng-container>
  `,
})
export class AdminAuditoriaComponent implements OnInit {
  pestana: 'admin' | 'cv' = 'admin';

  modalMantenimientoAdmin = false;
  modalMantenimientoCv = false;

  readonly opcionesAccionAdmin = Object.entries(AUDITORIA_ADMIN_ACCION_LABELS).map(([codigo, etiqueta]) => ({
    codigo,
    etiqueta,
  }));
  readonly opcionesAccionCv = Object.entries(AUDITORIA_CV_ACCION_LABELS).map(([codigo, etiqueta]) => ({
    codigo,
    etiqueta,
  }));

  filtroAccionAdmin = '';
  busquedaAdmin = '';
  filtroAccionCv = '';
  busquedaCv = '';

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

  cambiarPestana(t: 'admin' | 'cv'): void {
    if (this.pestana === t) return;
    this.cerrarModalesMantenimiento();
    this.pestana = t;
    if (t === 'admin') this.cargarAdmin();
    else this.cargarCv();
  }

  onCambioFiltrosAdmin(): void {
    this.pageAdmin = 1;
    this.cargarAdmin();
  }

  onCambioFiltrosCv(): void {
    this.pageCv = 1;
    this.cargarCv();
  }

  limpiarBusquedaAdmin(): void {
    this.busquedaAdmin = '';
    this.onCambioFiltrosAdmin();
  }

  limpiarBusquedaCv(): void {
    this.busquedaCv = '';
    this.onCambioFiltrosCv();
  }

  limpiarConfirmVaciarAdmin(): void {
    this.confirmVaciarAdmin = '';
    this.showConfirmErrorAdmin = false;
  }

  limpiarConfirmVaciarCv(): void {
    this.confirmVaciarCv = '';
    this.showConfirmErrorCv = false;
  }

  onConfirmVaciarAdminChange(): void {
    this.showConfirmErrorAdmin = false;
  }

  onConfirmVaciarCvChange(): void {
    this.showConfirmErrorCv = false;
  }

  get canVaciarAdminCompleto(): boolean {
    return this.confirmVaciarAdmin.trim() === this.fraseVaciar;
  }

  get canVaciarCvCompleto(): boolean {
    return this.confirmVaciarCv.trim() === this.fraseVaciar;
  }

  abrirModalMantenimientoAdmin(): void {
    this.modalMantenimientoCv = false;
    this.showConfirmErrorAdmin = false;
    this.modalMantenimientoAdmin = true;
  }

  cerrarModalMantenimientoAdmin(): void {
    this.modalMantenimientoAdmin = false;
  }

  cerrarModalMantenimientoAdminSiBackdrop(ev: MouseEvent): void {
    if (ev.target === ev.currentTarget) {
      this.cerrarModalMantenimientoAdmin();
    }
  }

  abrirModalMantenimientoCv(): void {
    this.modalMantenimientoAdmin = false;
    this.showConfirmErrorCv = false;
    this.modalMantenimientoCv = true;
  }

  cerrarModalMantenimientoCv(): void {
    this.modalMantenimientoCv = false;
  }

  cerrarModalMantenimientoCvSiBackdrop(ev: MouseEvent): void {
    if (ev.target === ev.currentTarget) {
      this.cerrarModalMantenimientoCv();
    }
  }

  private cerrarModalesMantenimiento(): void {
    this.modalMantenimientoAdmin = false;
    this.modalMantenimientoCv = false;
  }

  @HostListener('document:keydown.escape')
  onEscapeCerrarModalMantenimiento(): void {
    if (this.modalMantenimientoAdmin) {
      this.cerrarModalMantenimientoAdmin();
    } else if (this.modalMantenimientoCv) {
      this.cerrarModalMantenimientoCv();
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

  irPaginaAdmin(p: number): void {
    this.pageAdmin = Math.max(1, Math.min(p, this.totalPagesAdmin));
    this.cargarAdmin();
  }

  irPaginaCv(p: number): void {
    this.pageCv = Math.max(1, Math.min(p, this.totalPagesCv));
    this.cargarCv();
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

  etiquetaAccionAdmin(accion: string): string {
    return etiquetaAuditoriaAccion(accion, AUDITORIA_ADMIN_ACCION_LABELS);
  }

  etiquetaAccionCv(accion: string): string {
    return etiquetaAuditoriaAccion(accion, AUDITORIA_CV_ACCION_LABELS);
  }

  fmtFecha(iso: string): string {
    if (!iso?.trim()) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toISOString().replace('T', ' ').slice(0, 19);
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
    const nombreTabla = tabla === 'admin' ? 'Auditoría administración' : 'Auditoría CV';
    if (modo === 'todo') {
      return `Advertencia: vas a vaciar COMPLETAMENTE la tabla ${nombreTabla}. Esta acción no se puede deshacer. ¿Continuar?`;
    }
    if (modo === 'anio') {
      const anio = tabla === 'admin' ? this.anioPurgeAdmin : this.anioPurgeCv;
      return `Advertencia: vas a eliminar registros del año ${anio} en ${nombreTabla}. ¿Continuar?`;
    }

    const anio = tabla === 'admin' ? this.anioPurgeAdmin : this.anioPurgeCv;
    const mes = tabla === 'admin' ? this.mesPurgeAdmin : this.mesPurgeCv;
    const mesNombre = this.mesesPurge.find(m => m.v === mes)?.n ?? `mes ${mes}`;
    return `Advertencia: vas a eliminar registros de ${mesNombre} ${anio} en ${nombreTabla}. ¿Continuar?`;
  }
}
