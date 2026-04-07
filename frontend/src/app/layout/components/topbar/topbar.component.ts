import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserInfo } from '../../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: false,
  template: `
    <header class="cv-topbar">
      <!-- Hamburger -->
      <button class="btn-icon" aria-label="Menú" title="Menú">
        <i class="bi bi-list"></i>
      </button>

      <!-- Brand -->
      <a routerLink="/dashboard" class="brand"><span>Portal</span>CV</a>

      <!-- Info usuario (centro) -->
      <span class="d-none d-md-flex align-items-center gap-2"
            style="color:#ced4da; font-size:.85rem; margin-right:auto;">
        <i class="bi bi-person-circle"></i>
        <span>{{ currentUser?.nombre }}</span>
      </span>

      <!-- Bell con badge -->
      <div class="position-relative me-1">
        <button class="btn-icon" routerLink="/alertas" title="Alertas">
          <i class="bi bi-bell-fill text-warning"></i>
        </button>
        <span class="notif-badge">5</span>
      </div>

      <!-- Menú usuario -->
      <div class="user-menu dropdown">
        <div class="d-flex align-items-center gap-2" data-bs-toggle="dropdown"
             style="cursor:pointer;">
          <div class="user-avatar">{{ initials }}</div>
          <span class="d-none d-md-inline">{{ currentUser?.nombre }}</span>
          <i class="bi bi-chevron-down" style="font-size:.75rem;"></i>
        </div>
        <ul class="dropdown-menu dropdown-menu-end mt-1">
          <li>
            <a class="dropdown-item" routerLink="/perfil">
              <i class="bi bi-person me-2"></i>Mi perfil
            </a>
          </li>
          <li>
            <a class="dropdown-item" routerLink="/configuracion">
              <i class="bi bi-gear me-2"></i>Configuración
            </a>
          </li>
          <li><hr class="dropdown-divider"></li>
          <li>
            <a class="dropdown-item text-danger" role="button" (click)="logout()">
              <i class="bi bi-box-arrow-right me-2"></i>Cerrar sesión
            </a>
          </li>
        </ul>
      </div>
    </header>
  `
})
export class TopbarComponent implements OnInit {
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
