import { Component, OnInit } from '@angular/core';
import { AuthService, UserInfo } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  template: `
    <aside class="cv-sidebar" id="cvSidebar">

      <!-- Usuario autenticado -->
      <div class="sidebar-user" *ngIf="currentUser">
        <div class="sidebar-avatar">{{ initials }}</div>
        <div class="sidebar-username">{{ currentUser.nombre }}</div>
        <div class="sidebar-role">{{ currentUser.rol }}</div>
      </div>

      <nav>
        <!-- Dashboard -->
        <a class="nav-item-sidebar" routerLink="/dashboard"
           routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          <i class="bi bi-speedometer2"></i><span>Dashboard</span>
        </a>

        <!-- Alertas -->
        <a class="nav-item-sidebar" routerLink="/alertas" routerLinkActive="active">
          <i class="bi bi-bell-fill"></i><span>Alertas</span>
          <span class="nav-badge">5</span>
        </a>

        <!-- Mi CV -->
        <a class="nav-item-sidebar" routerLink="/mi-cv" routerLinkActive="active">
          <i class="bi bi-file-earmark-person-fill"></i><span>Mi CV</span>
        </a>

        <hr class="my-1" style="border-color: rgba(255,255,255,.15);">

        <!-- Datos Personales -->
        <a class="nav-item-sidebar" routerLink="/datos-personales" routerLinkActive="active">
          <i class="bi bi-person-lines-fill"></i><span>Datos Personales</span>
        </a>

        <!-- Perfil -->
        <a class="nav-item-sidebar" routerLink="/perfil" routerLinkActive="active">
          <i class="bi bi-person-badge-fill"></i><span>Perfil</span>
        </a>

        <!-- Experiencia -->
        <a class="nav-item-sidebar" routerLink="/experiencia" routerLinkActive="active">
          <i class="bi bi-briefcase-fill"></i><span>Experiencia</span>
        </a>

        <!-- Educación -->
        <a class="nav-item-sidebar" routerLink="/educacion" routerLinkActive="active">
          <i class="bi bi-mortarboard-fill"></i><span>Educación</span>
        </a>

        <!-- Habilidades -->
        <a class="nav-item-sidebar" routerLink="/habilidades" routerLinkActive="active">
          <i class="bi bi-stars"></i><span>Habilidades</span>
        </a>

        <!-- Proyectos -->
        <a class="nav-item-sidebar" routerLink="/proyectos" routerLinkActive="active">
          <i class="bi bi-kanban-fill"></i><span>Proyectos</span>
        </a>

        <hr class="my-1" style="border-color: rgba(255,255,255,.15);">

        <!-- Configuración -->
        <a class="nav-item-sidebar" routerLink="/configuracion" routerLinkActive="active">
          <i class="bi bi-gear-fill"></i><span>Configuración</span>
        </a>
      </nav>

    </aside>
  `
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
