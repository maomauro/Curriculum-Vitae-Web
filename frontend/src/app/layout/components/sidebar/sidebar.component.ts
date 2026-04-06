import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  template: `
    <aside class="app-sidebar bg-body-secondary shadow" data-bs-theme="dark">
      <div class="sidebar-brand">
        <a routerLink="/dashboard" class="brand-link text-decoration-none">
          <span class="brand-text fw-light">PortalCV</span>
        </a>
      </div>
      <div class="sidebar-wrapper">
        <nav class="mt-2">
          <ul class="nav sidebar-menu flex-column"
              data-lte-toggle="treeview"
              role="navigation"
              aria-label="Main navigation"
              data-accordion="false">

            <!-- Mis CVs -->
            <li class="nav-item">
              <a routerLink="/cvs" routerLinkActive="active" class="nav-link">
                <i class="nav-icon bi bi-people"></i>
                <p>Mis CVs</p>
              </a>
            </li>

            <!-- Crear CV -->
            <li class="nav-item">
              <a routerLink="/editor" routerLinkActive="active" class="nav-link">
                <i class="nav-icon bi bi-plus-circle"></i>
                <p>Crear CV</p>
              </a>
            </li>

            <!-- Dashboard con submenu treeview -->
            <li class="nav-item">
              <a href="#" class="nav-link">
                <i class="nav-icon bi bi-speedometer2"></i>
                <p>
                  Dashboard
                  <i class="nav-arrow bi bi-chevron-right"></i>
                </p>
              </a>
              <ul class="nav nav-treeview">
                <li class="nav-item">
                  <a routerLink="/dashboard" routerLinkActive="active"
                     [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
                    <i class="nav-icon bi bi-bar-chart"></i>
                    <p>Estadísticas</p>
                  </a>
                </li>
                <li class="nav-item">
                  <a routerLink="/dashboard/alertas" routerLinkActive="active" class="nav-link">
                    <i class="nav-icon bi bi-bell"></i>
                    <p>Alertas</p>
                  </a>
                </li>
              </ul>
            </li>

          </ul>
        </nav>
      </div>
    </aside>
  `
})
export class SidebarComponent { }
