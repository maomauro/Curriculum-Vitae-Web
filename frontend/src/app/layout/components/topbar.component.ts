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
  templateUrl: './topbar.component.html',
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
