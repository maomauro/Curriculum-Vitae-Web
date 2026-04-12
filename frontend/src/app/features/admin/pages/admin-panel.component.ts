import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminService, UsuarioAdminDto, RolDto } from '../../../core/services/admin/admin.service';
import { CV_ROL } from '../../../core/constants/cv-roles';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';

@Component({
  selector: 'app-admin-panel',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4>
          <i class="bi bi-people-fill me-2 admin-icon-danger"></i>
          Usuarios
        </h4>
        <span class="text-muted small">Estado de cuenta, publicación del CV en el portal y roles por cuenta</span>
      </div>
    </div>

    <!-- Spinner -->
    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary admin-spinner-lg"></div>
    </div>

    <ng-container *ngIf="!loading">
      <!-- Métricas rápidas -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="bg-white rounded-3 shadow-sm p-4 d-flex align-items-center gap-3">
            <div class="rounded-3 admin-stat-icon admin-stat-icon--blue">
              <i class="bi bi-people-fill"></i>
            </div>
            <div>
              <div class="admin-stat-value">{{ totalUsuarios }}</div>
              <div class="text-muted admin-stat-label">Usuarios registrados</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="bg-white rounded-3 shadow-sm p-4 d-flex align-items-center gap-3">
            <div class="rounded-3 admin-stat-icon admin-stat-icon--green">
              <i class="bi bi-person-check-fill"></i>
            </div>
            <div>
              <div class="admin-stat-value">{{ totalActivos }}</div>
              <div class="text-muted admin-stat-label">Usuarios activos</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="bg-white rounded-3 shadow-sm p-4 d-flex align-items-center gap-3">
            <div class="rounded-3 admin-stat-icon admin-stat-icon--red">
              <i class="bi bi-person-x-fill"></i>
            </div>
            <div>
              <div class="admin-stat-value">{{ totalInactivos }}</div>
              <div class="text-muted admin-stat-label">Usuarios inactivos</div>
            </div>
          </div>
        </div>
      </div>

      <div class="seccion-card">
        <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div class="seccion-titulo mb-0">Usuarios del sistema</div>
          <div class="d-flex gap-2">
            <select
              class="form-select form-select-sm admin-filter-select"
              [(ngModel)]="filtroEstado"
              (ngModelChange)="onFiltrosChanged()">
              <option value="">Todos</option>
              <option value="Activo">Activos</option>
              <option value="Inactivo">Inactivos</option>
            </select>
            <input
              type="text"
              class="form-control form-control-sm admin-search-input"
              placeholder="Buscar por email..."
              [(ngModel)]="busqueda"
              (ngModelChange)="onFiltrosChanged()" />
          </div>
        </div>

        <div *ngIf="usuariosFiltrados.length === 0" class="text-center text-muted py-4">
          <i class="bi bi-search admin-search-icon"></i>
          <p class="mt-2 mb-0">No se encontraron usuarios con los filtros aplicados.</p>
        </div>

        <div *ngIf="usuariosFiltrados.length > 0" class="table-responsive admin-usuarios-table-wrap">
          <table class="table table-hover align-middle w-100 mb-0">
            <thead class="table-light">
              <tr>
                <th scope="col">USUARIO</th>
                <th scope="col">REGISTRO</th>
                <th scope="col">ESTADO</th>
                <th scope="col">CV PORTAL</th>
                <th scope="col">ROLES</th>
                <th scope="col" class="text-end">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of usuariosPagina">
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <div class="avatar-circle avatar-circle-sm blue">{{ inicial(u.email) }}</div>
                    <span class="fw-semibold admin-email">{{ u.email }}</span>
                  </div>
                </td>
                <td>{{ fmtFecha(u.fechaRegistro) }}</td>
                <td>
                  <span
                    class="badge rounded-pill"
                    [class.badge-user-activo]="u.estado === 'Activo'"
                    [class.badge-user-inactivo]="u.estado !== 'Activo'">
                    {{ u.estado }}
                  </span>
                </td>
                <td>
                  <span
                    class="badge rounded-pill"
                    [class.badge-cv-publicado]="u.cvPublicado"
                    [class.badge-cv-borrador]="!u.cvPublicado">
                    {{ u.cvPublicado ? 'Publicado' : 'Borrador' }}
                  </span>
                </td>
                <td>
                  <ng-container *ngIf="u.roles?.length; else sinRoles">
                    <span
                      *ngFor="let r of u.roles"
                      class="badge rounded-pill me-1"
                      [class.badge-role-admin]="r.nombreRol === 'Admin'"
                      [class.badge-role-user]="r.nombreRol !== 'Admin'">
                      {{ r.nombreRol }}
                    </span>
                  </ng-container>
                  <ng-template #sinRoles>
                    <span class="text-muted sin-roles">Sin roles</span>
                  </ng-template>
                </td>
                <td class="text-end text-nowrap admin-acciones-cell">
                  <div class="d-flex gap-1 justify-content-end align-items-center flex-wrap admin-acciones-inner">
                    <button
                      type="button"
                      class="btn btn-sm"
                      [class.btn-outline-danger]="u.estado === 'Activo'"
                      [class.btn-outline-success]="u.estado !== 'Activo'"
                      [title]="u.estado === 'Activo' ? 'Desactivar' : 'Activar'"
                      (click)="toggleEstado(u)">
                      <i class="bi" [class.bi-person-x]="u.estado === 'Activo'" [class.bi-person-check]="u.estado !== 'Activo'"></i>
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm"
                      [class.btn-outline-warning]="u.cvPublicado"
                      [class.btn-outline-primary]="!u.cvPublicado"
                      [title]="u.cvPublicado ? 'Despublicar CV' : 'Publicar CV'"
                      [attr.aria-label]="u.cvPublicado ? 'Despublicar CV' : 'Publicar CV'"
                      (click)="toggleCvPublicacion(u)">
                      <i class="bi" [class.bi-eye-slash]="u.cvPublicado" [class.bi-eye]="!u.cvPublicado"></i>
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary"
                      title="Gestionar roles"
                      (click)="abrirRoles(u)">
                      <i class="bi bi-shield-lock"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div
            *ngIf="totalPaginas > 1"
            class="d-flex flex-wrap align-items-center justify-content-between gap-2 px-2 py-3 border-top bg-white rounded-bottom">
            <span class="text-muted small">
              Mostrando {{ rangoDesde }}–{{ rangoHasta }} de {{ usuariosFiltrados.length }}
            </span>
            <div class="btn-group btn-group-sm">
              <button
                type="button"
                class="btn btn-outline-secondary"
                [disabled]="paginaActual <= 1"
                (click)="irPagina(paginaActual - 1)">
                Anterior
              </button>
              <button type="button" class="btn btn-outline-secondary" disabled>
                {{ paginaActual }} / {{ totalPaginas }}
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary"
                [disabled]="paginaActual >= totalPaginas"
                (click)="irPagina(paginaActual + 1)">
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal gestión de roles -->
      <div *ngIf="usuarioSeleccionado" class="modal-overlay" (click)="cerrarRoles()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h6 class="mb-0 fw-bold">
              <i class="bi bi-shield-lock me-2 text-primary"></i>
              Roles de {{ usuarioSeleccionado.email }}
            </h6>
            <button class="btn btn-sm btn-outline-secondary" (click)="cerrarRoles()">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div *ngIf="rolesError" class="alert alert-danger py-2 small mb-3">{{ rolesError }}</div>

          <div class="d-flex flex-column gap-2">
            <div
              *ngFor="let rol of rolesParaAsignar"
              class="d-flex align-items-center justify-content-between p-3 rounded-3 admin-roles-row">
              <div>
                <span class="fw-semibold admin-rol-name">{{ rol.nombreRol }}</span>
                <div class="text-muted admin-rol-desc">{{ rol.descripcion || 'Sin descripción' }}</div>
              </div>
              <div>
                <span
                  *ngIf="tieneRol(usuarioSeleccionado, rol.rolId)"
                  class="badge rounded-pill me-2 badge-asignado"
                  >Asignado</span
                >
                <button
                  class="btn btn-sm"
                  [class.btn-outline-danger]="tieneRol(usuarioSeleccionado, rol.rolId)"
                  [class.btn-outline-primary]="!tieneRol(usuarioSeleccionado, rol.rolId)"
                  [disabled]="rolesGuardando"
                  (click)="toggleRol(usuarioSeleccionado, rol)">
                  <i
                    class="bi"
                    [class.bi-dash]="tieneRol(usuarioSeleccionado, rol.rolId)"
                    [class.bi-plus]="!tieneRol(usuarioSeleccionado, rol.rolId)"></i>
                  {{ tieneRol(usuarioSeleccionado, rol.rolId) ? 'Quitar' : 'Asignar' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ng-container>
  `,
})
export class AdminPanelComponent implements OnInit {
  readonly pageSize = 10;

  loading = true;
  usuarios: UsuarioAdminDto[] = [];
  todoRoles: RolDto[] = [];
  busqueda = '';
  filtroEstado = '';
  paginaActual = 1;

  usuarioSeleccionado: UsuarioAdminDto | null = null;
  rolesGuardando = false;
  rolesError: string | null = null;

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.adminService.getUsuarios().subscribe({
      next: data => {
        this.usuarios = data.map(u => this.normalizeUsuarioAdmin(u));
        this.loading = false;
        this.ajustarPaginaTrasFiltro();
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      },
    });
    this.adminService.getRoles().subscribe({
      next: roles => {
        this.todoRoles = roles;
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.loadError),
    });
  }

  onFiltrosChanged(): void {
    this.paginaActual = 1;
    this.ajustarPaginaTrasFiltro();
  }

  get totalUsuarios(): number {
    return this.usuarios.length;
  }
  get totalActivos(): number {
    return this.usuarios.filter(u => u.estado === 'Activo').length;
  }
  get totalInactivos(): number {
    return this.usuarios.filter(u => u.estado !== 'Activo').length;
  }

  get usuariosFiltrados(): UsuarioAdminDto[] {
    return this.usuarios.filter(u => {
      const matchEmail = u.email.toLowerCase().includes(this.busqueda.toLowerCase());
      const matchEstado = !this.filtroEstado || u.estado === this.filtroEstado;
      return matchEmail && matchEstado;
    });
  }

  get totalPaginas(): number {
    const n = this.usuariosFiltrados.length;
    return n === 0 ? 1 : Math.ceil(n / this.pageSize);
  }

  get usuariosPagina(): UsuarioAdminDto[] {
    const start = (this.paginaActual - 1) * this.pageSize;
    return this.usuariosFiltrados.slice(start, start + this.pageSize);
  }

  get rangoDesde(): number {
    if (this.usuariosFiltrados.length === 0) {
      return 0;
    }
    return (this.paginaActual - 1) * this.pageSize + 1;
  }

  get rangoHasta(): number {
    return Math.min(this.paginaActual * this.pageSize, this.usuariosFiltrados.length);
  }

  irPagina(p: number): void {
    const max = this.totalPaginas;
    this.paginaActual = Math.max(1, Math.min(p, max));
  }

  private ajustarPaginaTrasFiltro(): void {
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = this.totalPaginas;
    }
  }

  get rolesParaAsignar(): RolDto[] {
    return this.todoRoles.filter(r => r.nombreRol !== CV_ROL.visitante);
  }

  inicial(email: string): string {
    return email.charAt(0).toUpperCase();
  }

  tieneRol(u: UsuarioAdminDto, rolId: number): boolean {
    return u.roles.some(r => r.rolId === rolId);
  }

  toggleEstado(u: UsuarioAdminDto): void {
    const nuevoActivo = u.estado !== 'Activo';
    this.adminService.setEstado(u.usuarioId, nuevoActivo).subscribe({
      next: res => {
        u.estado = res.estado;
        this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
      },
      error: (error: HttpErrorResponse) =>
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError),
    });
  }

  toggleCvPublicacion(u: UsuarioAdminDto): void {
    const nuevo = !u.cvPublicado;
    this.adminService.setCvPublicacion(u.usuarioId, nuevo).subscribe({
      next: res => {
        u.cvPublicado = res.cvPublicado;
        this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
      },
      error: (error: HttpErrorResponse) =>
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError),
    });
  }

  abrirRoles(u: UsuarioAdminDto): void {
    this.usuarioSeleccionado = u;
    this.rolesError = null;
  }

  cerrarRoles(): void {
    this.usuarioSeleccionado = null;
    this.rolesError = null;
  }

  toggleRol(u: UsuarioAdminDto, rol: RolDto): void {
    this.rolesError = null;
    this.rolesGuardando = true;
    if (this.tieneRol(u, rol.rolId)) {
      this.adminService.quitarRol(u.usuarioId, rol.rolId).subscribe({
        next: () => {
          u.roles = u.roles.filter(r => r.rolId !== rol.rolId);
          this.rolesGuardando = false;
          this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
        },
        error: (error: HttpErrorResponse) => {
          this.rolesError = extractApiErrorMessage(error) ?? 'No se pudo quitar el rol.';
          this.rolesGuardando = false;
        },
      });
    } else {
      this.adminService.asignarRol(u.usuarioId, rol.rolId).subscribe({
        next: () => {
          u.roles = [...u.roles, rol];
          this.rolesGuardando = false;
          this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
        },
        error: (error: HttpErrorResponse) => {
          this.rolesError = extractApiErrorMessage(error) ?? 'No se pudo asignar el rol.';
          this.rolesGuardando = false;
        },
      });
    }
  }

  fmtFecha(iso: string): string {
    if (!iso?.trim()) {
      return '—';
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return iso;
    }
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  private normalizeUsuarioAdmin(
    u: UsuarioAdminDto & { CvPublicado?: boolean }
  ): UsuarioAdminDto {
    const raw =
      typeof u.cvPublicado === 'boolean'
        ? u.cvPublicado
        : typeof u.CvPublicado === 'boolean'
          ? u.CvPublicado
          : false;
    return {
      ...u,
      cvPublicado: raw,
    };
  }
}
