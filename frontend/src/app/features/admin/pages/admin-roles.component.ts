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
      <div class="spinner-border text-primary" role="status"></div>
    </div>

    <div *ngIf="!loading" class="seccion-card">
      <p class="text-muted small mb-3">
        <strong>Visitante</strong> describe al usuario no autenticado en el sitio público; no se asigna por JWT.
        <strong>Publicador</strong> y <strong>Admin</strong> son los roles operativos del portal privado.
      </p>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="admin-table-head">
            <tr>
              <th class="admin-th">ROL</th>
              <th class="admin-th">DESCRIPCIÓN</th>
              <th class="admin-th">NOTAS</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of rolesOrdenados">
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
}
