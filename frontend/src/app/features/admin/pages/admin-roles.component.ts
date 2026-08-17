import { Component, OnInit } from '@angular/core';
import { AdminService, RolDto } from '../../../core/services/admin/admin.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { CV_ROL } from '../../../core/constants/cv-roles';

@Component({
  selector: 'app-admin-roles',
  standalone: false,
  templateUrl: './admin-roles.component.html',
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
