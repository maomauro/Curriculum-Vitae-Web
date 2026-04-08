import { Component, OnInit } from '@angular/core';
import { AdminService, UsuarioAdminDto, RolDto } from '../../../core/services/admin/admin.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';

@Component({
  selector: 'app-admin-panel',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4>
          <i class="bi bi-shield-fill-check me-2" style="color:#dc3545;"></i>
          Panel de AdministraciÃ³n
        </h4>
        <span class="text-muted small">GestiÃ³n de usuarios y roles del sistema</span>
      </div>
    </div>

    <!-- Spinner -->
    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" style="width:2.5rem;height:2.5rem;"></div>
    </div>

    <ng-container *ngIf="!loading">

      <!-- MÃ©tricas rÃ¡pidas -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="bg-white rounded-3 shadow-sm p-4 d-flex align-items-center gap-3">
            <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                 style="width:48px;height:48px;background:#ebf2ff;color:#2c7be5">
              <i class="bi bi-people-fill" style="font-size:1.2rem;"></i>
            </div>
            <div>
              <div style="font-size:1.4rem;font-weight:700;line-height:1;">{{ totalUsuarios }}</div>
              <div class="text-muted" style="font-size:.8rem;">Usuarios registrados</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="bg-white rounded-3 shadow-sm p-4 d-flex align-items-center gap-3">
            <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                 style="width:48px;height:48px;background:#d1fae5;color:#065f46">
              <i class="bi bi-person-check-fill" style="font-size:1.2rem;"></i>
            </div>
            <div>
              <div style="font-size:1.4rem;font-weight:700;line-height:1;">{{ totalActivos }}</div>
              <div class="text-muted" style="font-size:.8rem;">Usuarios activos</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="bg-white rounded-3 shadow-sm p-4 d-flex align-items-center gap-3">
            <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                 style="width:48px;height:48px;background:#fee2e2;color:#991b1b">
              <i class="bi bi-person-x-fill" style="font-size:1.2rem;"></i>
            </div>
            <div>
              <div style="font-size:1.4rem;font-weight:700;line-height:1;">{{ totalInactivos }}</div>
              <div class="text-muted" style="font-size:.8rem;">Usuarios inactivos</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de usuarios -->
      <div class="seccion-card">
        <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div class="seccion-titulo mb-0">Usuarios del sistema</div>
          <div class="d-flex gap-2">
            <!-- Filtro estado -->
            <select class="form-select form-select-sm" [(ngModel)]="filtroEstado" style="width:auto;">
              <option value="">Todos</option>
              <option value="Activo">Activos</option>
              <option value="Inactivo">Inactivos</option>
            </select>
            <!-- BÃºsqueda -->
            <input type="text" class="form-control form-control-sm"
                   placeholder="Buscar por email..." style="min-width:200px;"
                   [(ngModel)]="busqueda">
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="usuariosFiltrados.length === 0" class="text-center text-muted py-4">
          <i class="bi bi-search" style="font-size:2rem;"></i>
          <p class="mt-2 mb-0">No se encontraron usuarios con los filtros aplicados.</p>
        </div>

        <div class="table-responsive" *ngIf="usuariosFiltrados.length > 0">
          <table class="table table-hover align-middle mb-0">
            <thead style="background:#f8faff;">
              <tr>
                <th style="font-size:.8rem;color:#6c757d;font-weight:600;">USUARIO</th>
                <th style="font-size:.8rem;color:#6c757d;font-weight:600;">REGISTRO</th>
                <th style="font-size:.8rem;color:#6c757d;font-weight:600;">ROLES</th>
                <th style="font-size:.8rem;color:#6c757d;font-weight:600;">ESTADO</th>
                <th style="font-size:.8rem;color:#6c757d;font-weight:600;"></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of usuariosFiltrados">
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <div class="avatar-circle avatar-circle-sm blue">{{ inicial(u.email) }}</div>
                    <span class="fw-semibold" style="font-size:.9rem;">{{ u.email }}</span>
                  </div>
                </td>
                <td style="font-size:.85rem;color:#6c757d;">{{ u.fechaRegistro | date:'dd/MM/yyyy' }}</td>
                <td>
                  <span *ngFor="let r of u.roles"
                        class="badge rounded-pill me-1"
                        [style.background]="r.nombreRol === 'Admin' ? '#ede9fe' : '#ebf2ff'"
                        [style.color]="r.nombreRol === 'Admin' ? '#5b21b6' : '#2c7be5'"
                        style="font-size:.72rem;padding:4px 10px;">
                    {{ r.nombreRol }}
                  </span>
                  <span *ngIf="u.roles.length === 0" class="text-muted" style="font-size:.8rem;">Sin roles</span>
                </td>
                <td>
                  <span class="badge rounded-pill"
                        [style.background]="u.estado === 'Activo' ? '#d1fae5' : '#fee2e2'"
                        [style.color]="u.estado === 'Activo' ? '#065f46' : '#991b1b'"
                        style="font-size:.72rem;padding:4px 10px;">
                    {{ u.estado }}
                  </span>
                </td>
                <td>
                  <div class="d-flex gap-1 justify-content-end">
                    <!-- Cambiar estado -->
                    <button class="btn btn-sm"
                            [class.btn-outline-danger]="u.estado === 'Activo'"
                            [class.btn-outline-success]="u.estado !== 'Activo'"
                            [title]="u.estado === 'Activo' ? 'Desactivar' : 'Activar'"
                            (click)="toggleEstado(u)">
                      <i class="bi" [class.bi-person-x]="u.estado === 'Activo'"
                                    [class.bi-person-check]="u.estado !== 'Activo'"></i>
                    </button>
                    <!-- Gestionar roles -->
                    <button class="btn btn-sm btn-outline-secondary"
                            title="Gestionar roles"
                            (click)="abrirRoles(u)">
                      <i class="bi bi-shield-lock"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal gestiÃ³n de roles -->
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

          <!-- Roles disponibles -->
          <div class="d-flex flex-column gap-2">
            <div *ngFor="let rol of todoRoles"
                 class="d-flex align-items-center justify-content-between p-3 rounded-3"
                 style="background:#f8faff;">
              <div>
                <span class="fw-semibold" style="font-size:.9rem;">{{ rol.nombreRol }}</span>
                <div class="text-muted" style="font-size:.75rem;">{{ rol.descripcion || 'Sin descripciÃ³n' }}</div>
              </div>
              <div>
                <span *ngIf="tieneRol(usuarioSeleccionado, rol.rolId)"
                      class="badge rounded-pill me-2"
                      style="background:#d1fae5;color:#065f46;font-size:.72rem;">Asignado</span>
                <button class="btn btn-sm"
                        [class.btn-outline-danger]="tieneRol(usuarioSeleccionado, rol.rolId)"
                        [class.btn-outline-primary]="!tieneRol(usuarioSeleccionado, rol.rolId)"
                        [disabled]="rolesGuardando"
                        (click)="toggleRol(usuarioSeleccionado, rol)">
                  <i class="bi" [class.bi-dash]="tieneRol(usuarioSeleccionado, rol.rolId)"
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
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45);
      z-index: 1050; display: flex; align-items: center; justify-content: center;
    }
    .modal-card {
      background: #fff; border-radius: 12px; padding: 1.5rem;
      width: 100%; max-width: 480px; box-shadow: 0 8px 32px rgba(0,0,0,.2);
    }
  `]
})
export class AdminPanelComponent implements OnInit {
  loading       = true;
  usuarios: UsuarioAdminDto[] = [];
  todoRoles: RolDto[]         = [];
  busqueda      = '';
  filtroEstado  = '';

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
        this.usuarios = data;
        this.loading  = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      }
    });
    this.adminService.getRoles().subscribe({
      next: roles => { this.todoRoles = roles; },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.loadError)
    });
  }

  // â”€â”€ MÃ©tricas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  get totalUsuarios(): number { return this.usuarios.length; }
  get totalActivos():  number { return this.usuarios.filter(u => u.estado === 'Activo').length; }
  get totalInactivos(): number { return this.usuarios.filter(u => u.estado !== 'Activo').length; }

  // â”€â”€ Filtrado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  get usuariosFiltrados(): UsuarioAdminDto[] {
    return this.usuarios.filter(u => {
      const matchEmail  = u.email.toLowerCase().includes(this.busqueda.toLowerCase());
      const matchEstado = !this.filtroEstado || u.estado === this.filtroEstado;
      return matchEmail && matchEstado;
    });
  }

  // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  inicial(email: string): string { return email.charAt(0).toUpperCase(); }

  tieneRol(u: UsuarioAdminDto, rolId: number): boolean {
    return u.roles.some(r => r.rolId === rolId);
  }

  // â”€â”€ Acciones â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  toggleEstado(u: UsuarioAdminDto): void {
    const nuevoActivo = u.estado !== 'Activo';
    this.adminService.setEstado(u.usuarioId, nuevoActivo).subscribe({
      next: res => {
        u.estado = res.estado;
        this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.saveError)
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
    this.rolesError  = null;
    this.rolesGuardando = true;
    if (this.tieneRol(u, rol.rolId)) {
      this.adminService.quitarRol(u.usuarioId, rol.rolId).subscribe({
        next: () => {
          u.roles = u.roles.filter(r => r.rolId !== rol.rolId);
          this.rolesGuardando = false;
          this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
        },
        error: (err) => {
          this.rolesError = err?.error?.message ?? 'No se pudo quitar el rol.';
          this.rolesGuardando = false;
        }
      });
    } else {
      this.adminService.asignarRol(u.usuarioId, rol.rolId).subscribe({
        next: () => {
          u.roles = [...u.roles, rol];
          this.rolesGuardando = false;
          this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
        },
        error: (err) => {
          this.rolesError = err?.error?.message ?? 'No se pudo asignar el rol.';
          this.rolesGuardando = false;
        }
      });
    }
  }
}
