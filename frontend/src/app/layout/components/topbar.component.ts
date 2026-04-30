import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { CV_ROL } from '../../core/constants/cv-roles';
import { AuthService, UserInfo } from '../../core/services/auth/auth.service';
import { AlertasConteoRefreshService } from '../../core/services/private/alertas-conteo-refresh.service';
import { DashboardService, NotificacionItemDto } from '../../core/services/private/dashboard.service';
import { CvEditorService } from '../../core/services/private/cv-editor.service';
import { PrivateLayoutSidebarService } from '../services/private-layout-sidebar.service';

@Component({
  selector: 'app-topbar',
  standalone: false,
  host: {
    class: 'app-header navbar navbar-expand-md navbar-dark cv-topbar border-0',
  },
  template: `
    <div class="container-fluid d-flex flex-wrap align-items-center gap-2 py-1">
      <!-- Misma lógica que AdminLTE PushMenu; el JS global suele correr antes del render de Angular. -->
      <ul class="navbar-nav d-flex flex-row align-items-center mb-0">
        <li class="nav-item">
          <a
            href="#"
            class="nav-link d-flex align-items-center py-1 px-2 cv-topbar-push"
            role="button"
            aria-label="Alternar menú lateral"
            title="Menú"
            (click)="alternarSidebar($event)">
            <i class="bi bi-list fs-4 lh-1"></i>
          </a>
        </li>
      </ul>

      <!-- Marca solo en sidebar (.brand-link); evita duplicar "PortalCV" aquí. -->

      <span
        class="d-none d-md-flex align-items-center gap-2 cv-topbar-user-hint ms-2 min-w-0"
        [attr.aria-label]="lineaUsuarioTopbar"
        [title]="lineaUsuarioTopbar">
        <i class="bi bi-person-circle flex-shrink-0" aria-hidden="true"></i>
        <span class="text-truncate min-w-0">{{ lineaUsuarioTopbar }}</span>
      </span>

      <div class="d-flex align-items-center gap-2 ms-auto">
      <!-- Campanita: solo publicadores (alertas de CV) -->
      <div class="position-relative dropdown" id="notifDropdown" *ngIf="mostrarCampanaNotificaciones">
        <button class="btn-icon" data-bs-toggle="dropdown" aria-expanded="false"
                data-bs-auto-close="outside" title="Notificaciones"
                (click)="abrirNotificaciones()">
          <i class="bi bi-bell-fill text-warning"></i>
        </button>
        <span class="notif-badge" *ngIf="conteoNoLeidas > 0">{{ conteoNoLeidas }}</span>

        <!-- Dropdown panel -->
        <div class="dropdown-menu dropdown-menu-end p-0 cv-notif-dropdown">
          <!-- Cabecera -->
          <div class="d-flex justify-content-between align-items-center px-3 py-2 cv-notif-header">
            <span class="fw-semibold cv-notif-title">Notificaciones</span>
            <span *ngIf="conteoNoLeidas > 0"
                  class="badge rounded-pill bg-primary cv-notif-badge-sm">
              {{ conteoNoLeidas }} nuevas
            </span>
          </div>

          <!-- Loading -->
          <div *ngIf="loadingNotif" class="text-center py-3">
            <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
          </div>

          <!-- Sin notificaciones -->
          <div *ngIf="!loadingNotif && notificaciones.length === 0"
               class="text-center text-muted py-4 cv-notif-empty">
            <i class="bi bi-bell-slash d-block fs-3 mb-2"></i>
            No hay notificaciones
          </div>

          <!-- Lista -->
          <div *ngFor="let n of notificaciones"
               class="d-flex align-items-start gap-2 px-3 py-2 cv-notif-row"
               [style.background]="n.esLeida ? '#fff' : '#f0f7ff'">
            <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 cv-notif-icon-sm"
                 [style.background]="tipoIconBg(n.tipoVisita)"
                 [style.color]="tipoIconColor(n.tipoVisita)">
              <i class="bi" [ngClass]="tipoIcono(n.tipoVisita)"></i>
            </div>
            <div class="flex-grow-1 cv-notif-body">
              <div class="cv-notif-line1">
                {{ n.titulo }}
              </div>
              <div class="cv-notif-line2">
                {{ n.fechaVisita | date:'dd/MM/yyyy HH:mm' }}
              </div>
            </div>
            <div *ngIf="!n.esLeida"
                 class="rounded-circle bg-primary flex-shrink-0 cv-notif-dot"></div>
          </div>

          <!-- Pie -->
          <div class="text-center py-2 cv-notif-footer">
            <a routerLink="/alertas" class="text-primary cv-notif-link">
              Ver todas las alertas →
            </a>
          </div>
        </div>
      </div>

      <div class="user-menu">
        <button type="button" class="btn btn-sm btn-danger" (click)="logout()">
          <i class="bi bi-box-arrow-right me-1"></i>Cerrar sesión
        </button>
      </div>
      </div>
    </div>
  `
})
export class TopbarComponent implements OnInit, OnDestroy {
  currentUser: UserInfo | null = null;
  cargoActual = 'Perfil profesional';
  conteoNoLeidas = 0;
  notificaciones: NotificacionItemDto[] = [];
  loadingNotif = false;
  private notifCargadas = false;
  /** Ruta bajo `/admin` (contexto administración en topbar). */
  enRutaAdmin = false;
  private routeSub?: Subscription;
  private alertasRefreshSub?: Subscription;

  get mostrarCampanaNotificaciones(): boolean {
    return this.authService.hasRol(CV_ROL.publicador);
  }

  /** Nombre y contexto: administración en `/admin` o perfil CV para publicadores. */
  get lineaUsuarioTopbar(): string {
    const nombre = (this.currentUser?.nombre?.trim() || 'Usuario');
    if (this.enRutaAdmin) {
      return `${nombre} - Administración`;
    }
    return `${nombre} - ${this.cargoActual}`;
  }

  get initials(): string {
    if (!this.currentUser?.nombre) return 'U';
    return this.currentUser.nombre
      .split(' ')
      .slice(0, 2)
      .map(p => p[0])
      .join('')
      .toUpperCase();
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private dashboardService: DashboardService,
    private cvEditorService: CvEditorService,
    private sidebarNav: PrivateLayoutSidebarService,
    private alertasConteoRefresh: AlertasConteoRefreshService
  ) {}

  alternarSidebar(ev: Event): void {
    ev.preventDefault();
    this.sidebarNav.toggle();
  }

  ngOnInit(): void {
    this.routeSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.syncRutaAdmin());
    this.syncRutaAdmin();

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        if (this.authService.hasRol(CV_ROL.publicador)) {
          this.cargarConteo();
          this.cargarCargoActual();
        } else {
          this.conteoNoLeidas = 0;
          this.notifCargadas = false;
          this.cargoActual = this.authService.hasRol(CV_ROL.admin) ? 'Administración' : 'Perfil profesional';
        }
      } else {
        this.cargoActual = 'Perfil profesional';
      }
    });

    this.alertasRefreshSub = this.alertasConteoRefresh.refreshRequested$.subscribe(() => {
      if (!this.authService.hasRol(CV_ROL.publicador)) return;
      this.cargarConteo();
      this.notifCargadas = false;
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.alertasRefreshSub?.unsubscribe();
  }

  private syncRutaAdmin(): void {
    const path = this.router.url.split('?')[0];
    this.enRutaAdmin = path.startsWith('/admin');
  }

  abrirNotificaciones(): void {
    if (!this.notifCargadas) {
      this.loadingNotif = true;
      this.dashboardService.getNotificaciones(8).subscribe({
        next: data => {
          this.notificaciones = data.recientes;
          this.conteoNoLeidas = data.conteoNoLeidas;
          this.loadingNotif = false;
          this.notifCargadas = true;
        },
        error: () => { this.loadingNotif = false; }
      });
    }
  }

  private cargarConteo(): void {
    this.dashboardService.getNotificaciones(1).subscribe({
      next: data => { this.conteoNoLeidas = data.conteoNoLeidas; },
      error: () => { this.conteoNoLeidas = 0; }
    });
  }

  logout(): void {
    const mensaje =
      '¿Seguro que deseas cerrar sesión? Tendrás que volver a iniciar sesión para acceder a tu panel.';
    if (!window.confirm(mensaje)) {
      return;
    }
    this.authService.logout();
    void this.router.navigate(['/']);
  }

  private cargarCargoActual(): void {
    this.cvEditorService.getPerfiles().subscribe({
      next: perfiles => {
        const activo = perfiles.find(p => p.esActivo && !!p.nombrePerfil?.trim());
        const primero = perfiles.find(p => !!p.nombrePerfil?.trim());
        this.cargoActual = activo?.nombrePerfil?.trim()
          ?? primero?.nombrePerfil?.trim()
          ?? 'Perfil profesional';
      },
      error: () => {
        this.cargoActual = 'Perfil profesional';
      }
    });
  }

  tipoIcono(tipo: string | null): string {
    const map: Record<string, string> = {
      'Contacto': 'bi-envelope-fill',
      'Vista':    'bi-eye-fill',
      'Descarga': 'bi-download',
      'Sistema':  'bi-info-circle-fill',
    };
    return map[tipo ?? ''] ?? 'bi-bell-fill';
  }

  tipoIconBg(tipo: string | null): string {
    const map: Record<string, string> = {
      'Contacto': '#dbeafe',
      'Vista':    '#d1fae5',
      'Descarga': '#fef9c3',
      'Sistema':  '#f3f4f6',
    };
    return map[tipo ?? ''] ?? '#f3f4f6';
  }

  tipoIconColor(tipo: string | null): string {
    const map: Record<string, string> = {
      'Contacto': '#1e40af',
      'Vista':    '#065f46',
      'Descarga': '#854d0e',
      'Sistema':  '#374151',
    };
    return map[tipo ?? ''] ?? '#374151';
  }
}
