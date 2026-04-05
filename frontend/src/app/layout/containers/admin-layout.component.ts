import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserInfo } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  template: `
    <div class="wrapper">

      <!-- Navbar -->
      <nav class="app-header navbar navbar-expand bg-body">
        <div class="container-fluid">
          <ul class="navbar-nav">
            <li class="nav-item">
              <a class="nav-link" data-lte-toggle="sidebar" role="button">
                <i class="bi bi-list"></i>
              </a>
            </li>
          </ul>
          <ul class="navbar-nav ms-auto">
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                <i class="bi bi-person-circle me-1"></i>
                {{ currentUser?.nombre || 'Usuario' }}
              </a>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item" href="#"><i class="bi bi-person me-2"></i>Perfil</a></li>
                <li><hr class="dropdown-divider"></li>
                <li>
                  <a class="dropdown-item" (click)="logout()" role="button">
                    <i class="bi bi-box-arrow-right me-2"></i>Cerrar sesión
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Sidebar -->
      <aside class="app-sidebar bg-dark shadow" data-bs-theme="dark">
        <div class="sidebar-brand">
          <a routerLink="/dashboard" class="brand-link">
            <span class="brand-text fw-bold">PortalCV</span>
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
              <li class="nav-item">
                <a routerLink="/editor" routerLinkActive="active" class="nav-link">
                  <i class="nav-icon bi bi-file-earmark-person"></i>
                  <p>Editor de CV</p>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="app-main">
        <div class="app-content-header">
          <div class="container-fluid">
          </div>
        </div>
        <div class="app-content">
          <div class="container-fluid">
            <router-outlet></router-outlet>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="app-footer">
        <div class="float-end d-none d-sm-inline">PortalCV</div>
        <strong>&copy; 2026</strong>
      </footer>

    </div>
  `
})
export class AdminLayoutComponent implements OnInit {
  currentUser: UserInfo | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
