import { Component, OnInit } from '@angular/core';
import { AuthService, UserInfo } from '../../core/services/auth/auth.service';

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
          routerLink="/dashboard"
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
                <span class="nav-badge">5</span>
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

          <li class="nav-item cv-sidebar-divider-li px-3">
            <hr class="cv-sidebar-hr my-2" />
          </li>

          <li class="nav-item">
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

  get initials(): string {
    if (!this.currentUser?.nombre) return 'U';
    return this.currentUser.nombre
      .split(' ')
      .slice(0, 2)
      .map(p => p[0])
      .join('')
      .toUpperCase();
  }

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }
}
