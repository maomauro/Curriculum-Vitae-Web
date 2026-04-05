import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  template: `
    <aside class="app-sidebar bg-dark shadow" data-bs-theme="dark">
      <div class="sidebar-brand">
        <a routerLink="/dashboard" class="brand-link text-decoration-none">
          <span class="brand-text fw-bold fs-5 text-white ms-2">PortalCV</span>
        </a>
      </div>
      <div class="sidebar-wrapper">
        <nav class="mt-2">
          <ul class="nav sidebar-menu flex-column" data-lte-toggle="treeview" role="menu">
            <li class="nav-item">
              <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
                <i class="nav-icon bi bi-speedometer2"></i>
                <p>Dashboard</p>
              </a>
            </li>
            <li class="nav-header">MIS CURRÍCULUMS</li>
            <li class="nav-item">
              <a routerLink="/editor" routerLinkActive="active" class="nav-link">
                <i class="nav-icon bi bi-file-earmark-person"></i>
                <p>Editor de CV</p>
              </a>
            </li>
            <li class="nav-item">
              <a routerLink="/editor/new" routerLinkActive="active" class="nav-link">
                <i class="nav-icon bi bi-plus-circle"></i>
                <p>Crear CV</p>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  `
})
export class SidebarComponent { }
