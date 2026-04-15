import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { CV_ROL } from '../../core/constants/cv-roles';
import { AuthService, UserInfo } from '../../core/services/auth/auth.service';
import { AlertasConteoRefreshService } from '../../core/services/private/alertas-conteo-refresh.service';
import { DashboardService } from '../../core/services/private/dashboard.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  host: {
    class: 'app-sidebar cv-sidebar shadow-sm',
    'data-bs-theme': 'dark',
    id: 'cvSidebar',
  },
  template: `
    <div class="sidebar-wrapper">
      <!-- Marca: AdminLTE oculta .brand-text y muestra .logo-xs con body.sidebar-mini.sidebar-collapse -->
      <div class="sidebar-brand">
        <a
          [routerLink]="marcaInicio"
          class="brand-link logo-switch text-decoration-none d-flex align-items-center justify-content-center px-3 py-3">
          <span class="brand-text fw-semibold text-white lh-sm text-center">
            Portal<span class="text-primary">CV</span>
          </span>
          <span class="logo-xs fw-bold text-primary lh-1">PCV</span>
        </a>
      </div>

      <div class="sidebar-user" *ngIf="currentUser">
        <div class="sidebar-avatar">{{ initials }}</div>
        <div class="cv-sidebar-user-text text-center">
          <div class="sidebar-user-email" [title]="currentUser.email">{{ currentUser.email }}</div>
          <div class="sidebar-role">{{ currentUser.rol }}</div>
        </div>
      </div>

      <nav class="mt-2">
        <ul class="nav sidebar-menu flex-column" role="menu">
          <ng-container *ngIf="mostrarMenuPublicador">
            <li class="nav-item">
              <a
                class="nav-link"
                routerLink="/dashboard"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: true }">
                <i class="nav-icon bi bi-speedometer2"></i>
                <p class="mb-0">Dashboard</p>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/alertas" routerLinkActive="active">
                <i class="nav-icon bi bi-bell-fill"></i>
                <p class="mb-0">
                  Alertas
                  <span class="nav-badge" *ngIf="conteoAlertasNoLeidas > 0">{{ conteoAlertasNoLeidas }}</span>
                </p>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/mi-cv" routerLinkActive="active">
                <i class="nav-icon bi bi-file-earmark-person-fill"></i>
                <p class="mb-0">Mi CV</p>
              </a>
            </li>

            <li class="nav-item cv-sidebar-divider-li px-3">
              <hr class="cv-sidebar-hr my-2" />
            </li>

            <li class="nav-item">
              <a class="nav-link" routerLink="/datos-personales" routerLinkActive="active">
                <i class="nav-icon bi bi-person-lines-fill"></i>
                <p class="mb-0">Datos Personales</p>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/perfil" routerLinkActive="active">
                <i class="nav-icon bi bi-person-badge-fill"></i>
                <p class="mb-0">Perfil</p>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/experiencia" routerLinkActive="active">
                <i class="nav-icon bi bi-briefcase-fill"></i>
                <p class="mb-0">Experiencia</p>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/educacion" routerLinkActive="active">
                <i class="nav-icon bi bi-mortarboard-fill"></i>
                <p class="mb-0">Educación</p>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/proyectos" routerLinkActive="active">
                <i class="nav-icon bi bi-kanban-fill"></i>
                <p class="mb-0">Proyectos</p>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/habilidades" routerLinkActive="active">
                <i class="nav-icon bi bi-stars"></i>
                <p class="mb-0">Habilidades</p>
              </a>
            </li>
          </ng-container>

          <ng-container *ngIf="mostrarMenuAdmin">
            <li class="nav-item">
              <a class="nav-link" routerLink="/admin/usuarios" routerLinkActive="active">
                <i class="nav-icon bi bi-people-fill"></i>
                <p class="mb-0">Usuarios</p>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/admin/roles" routerLinkActive="active">
                <i class="nav-icon bi bi-person-badge-fill"></i>
                <p class="mb-0">Roles</p>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/admin/auditoria" routerLinkActive="active">
                <i class="nav-icon bi bi-journal-text"></i>
                <p class="mb-0">Auditoría</p>
              </a>
            </li>
          </ng-container>

          <li class="nav-item cv-sidebar-divider-li px-3" *ngIf="mostrarMenuPublicador || mostrarMenuAdmin">
            <hr class="cv-sidebar-hr my-2" />
          </li>

          <li class="nav-item" *ngIf="mostrarMenuPublicador">
            <a class="nav-link" routerLink="/configuracion" routerLinkActive="active">
              <i class="nav-icon bi bi-gear-fill"></i>
              <p class="mb-0">Configuración</p>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  `,
})
export class SidebarComponent implements OnInit {
  currentUser: UserInfo | null = null;
  /** Misma métrica que la campana del topbar: alertas de CV sin leer. */
  conteoAlertasNoLeidas = 0;

  private readonly destroyRef = inject(DestroyRef);

  get mostrarMenuPublicador(): boolean {
    return this.authService.hasRol(CV_ROL.publicador);
  }

  get mostrarMenuAdmin(): boolean {
    return this.authService.hasRol(CV_ROL.admin);
  }

  /** Inicio del logo: CV si es publicador; panel admin si solo administrador. */
  get marcaInicio(): string {
    return this.mostrarMenuPublicador ? '/dashboard' : '/admin/usuarios';
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
    private dashboardService: DashboardService,
    private router: Router,
    private alertasConteoRefresh: AlertasConteoRefreshService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user && this.authService.hasRol(CV_ROL.publicador)) {
        this.refrescarConteoAlertas();
      } else {
        this.conteoAlertasNoLeidas = 0;
      }
    });

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        if (this.currentUser && this.authService.hasRol(CV_ROL.publicador)) {
          this.refrescarConteoAlertas();
        }
      });

    this.alertasConteoRefresh.refreshRequested$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.currentUser && this.authService.hasRol(CV_ROL.publicador)) {
          this.refrescarConteoAlertas();
        }
      });
  }

  private refrescarConteoAlertas(): void {
    this.dashboardService.getNotificaciones(1).subscribe({
      next: d => {
        this.conteoAlertasNoLeidas = d.conteoNoLeidas;
      },
      error: () => {},
    });
  }
}
