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
  templateUrl: './admin-panel.component.html',
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

  limpiarBusquedaUsuarios(): void {
    this.busqueda = '';
    this.onFiltrosChanged();
  }

  get totalUsuarios(): number {
    return this.usuarios.length;
  }
  get totalActivos(): number {
    return this.usuarios.filter(u => u.estado === 'Activo').length;
  }
  get totalCvPublicados(): number {
    return this.usuarios.filter(u => u.cvPublicado).length;
  }
  get totalUsuariosConRoles(): number {
    return this.usuarios.filter(u => (u.roles?.length ?? 0) > 0).length;
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
    if (!nuevo) {
      const confirmar = globalThis.confirm(
        `Vas a cambiar el CV de ${u.email} a estado Borrador. ` +
        'No se mostrará en el portal público hasta volver a publicarlo. ¿Deseas continuar?'
      );
      if (!confirmar) return;
    }
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
