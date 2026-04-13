import { Component, OnInit } from '@angular/core';
import { AdminService, RolDto } from '../../../core/services/admin/admin.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { CV_ROL } from '../../../core/constants/cv-roles';

@Component({
  selector: 'app-admin-roles',
  standalone: false,
  template: `
    <div class="page-header">
      <div>
        <h4>
          <i class="bi bi-person-badge-fill me-2 text-primary"></i>
          Roles del sistema
        </h4>
        <span class="text-muted small">
          Catálogo de roles (los cambios de asignación por usuario se hacen en
          <a routerLink="/admin/usuarios" class="text-decoration-none">Usuarios</a>).
        </span>
      </div>
    </div>

    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando roles…</span>
      </div>
    </div>

    <div *ngIf="!loading" class="seccion-card">
      <p class="text-muted small mb-2 px-2 pt-3">
        <strong>Visitante</strong> describe al usuario no autenticado en el sitio público; no se asigna por JWT.
        <strong>Publicador</strong> y <strong>Admin</strong> son los roles operativos del portal privado.
      </p>
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 px-2 pt-2 pb-2">
        <div class="seccion-titulo mb-0">Catálogo de roles</div>
        <div class="d-flex gap-2 flex-nowrap align-items-center admin-usuarios-filtros">
          <select
            class="form-select form-select-sm admin-filter-select"
            [(ngModel)]="filtroRol"
            [ngModelOptions]="{ standalone: true }">
            <option [ngValue]="''">Todos los roles</option>
            <option *ngFor="let r of rolesOrdenados" [ngValue]="r.nombreRol">{{ r.nombreRol }}</option>
          </select>
          <div class="admin-search-with-clear">
            <input
              type="text"
              class="form-control form-control-sm admin-search-input"
              placeholder="Buscar rol, descripción…"
              [(ngModel)]="busquedaRoles"
              [ngModelOptions]="{ standalone: true }" />
            <button
              *ngIf="busquedaRoles?.trim()"
              type="button"
              class="admin-search-clear"
              (click)="limpiarBusquedaRoles()"
              aria-label="Limpiar búsqueda">
              <i class="bi bi-x-lg" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="roles.length === 0" class="text-center text-muted py-4 px-2">
        <p class="mb-0">No hay roles en el catálogo.</p>
      </div>

      <div *ngIf="roles.length > 0 && rolesFiltrados.length === 0" class="text-center text-muted py-4 px-2">
        <i class="bi bi-search admin-search-icon"></i>
        <p class="mt-2 mb-0">No hay roles que coincidan con el filtro o la búsqueda.</p>
      </div>

      <div *ngIf="rolesFiltrados.length > 0" class="table-responsive admin-table-wrap">
        <table class="table table-hover align-middle w-100 mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col" class="text-end text-muted small text-nowrap" style="width: 3rem">#</th>
              <th scope="col">ROL</th>
              <th scope="col">DESCRIPCIÓN</th>
              <th scope="col">NOTAS</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of rolesFiltrados; let i = index">
              <td class="text-end text-muted small">{{ i + 1 }}</td>
              <td>
                <span class="fw-semibold">{{ r.nombreRol }}</span>
              </td>
              <td class="admin-td-muted">{{ r.descripcion || '—' }}</td>
              <td class="small text-muted">
                <ng-container [ngSwitch]="r.nombreRol">
                  <span *ngSwitchCase="visitante">Solo referencia; acceso público sin sesión.</span>
                  <span *ngSwitchCase="publicador">Dueño de CV y módulos del candidato.</span>
                  <span *ngSwitchCase="admin">Usuarios, roles y (próximamente) auditoría.</span>
                  <span *ngSwitchDefault>—</span>
                </ng-container>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminRolesComponent implements OnInit {
  readonly visitante = CV_ROL.visitante;
  readonly publicador = CV_ROL.publicador;
  readonly admin = CV_ROL.admin;

  loading = true;
  roles: RolDto[] = [];
  filtroRol = '';
  busquedaRoles = '';

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.adminService.getRoles().subscribe({
      next: data => {
        this.roles = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      },
    });
  }

  get rolesOrdenados(): RolDto[] {
    return [...this.roles].sort((a, b) => a.rolId - b.rolId);
  }

  limpiarBusquedaRoles(): void {
    this.busquedaRoles = '';
  }

  get rolesFiltrados(): RolDto[] {
    let list = this.rolesOrdenados;
    if (this.filtroRol?.trim()) {
      list = list.filter(r => r.nombreRol === this.filtroRol);
    }
    const q = this.busquedaRoles.trim().toLowerCase();
    if (q) {
      list = list.filter(r => {
        const desc = (r.descripcion ?? '').toLowerCase();
        const nom = r.nombreRol.toLowerCase();
        const notas = this.textoNotasRol(r).toLowerCase();
        return nom.includes(q) || desc.includes(q) || notas.includes(q);
      });
    }
    return list;
  }

  textoNotasRol(r: RolDto): string {
    switch (r.nombreRol) {
      case this.visitante:
        return 'Solo referencia; acceso público sin sesión.';
      case this.publicador:
        return 'Dueño de CV y módulos del candidato.';
      case this.admin:
        return 'Usuarios, roles y (próximamente) auditoría.';
      default:
        return '';
    }
  }
}
