import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserInfo } from '../../core/services/auth.service';
import { DashboardService, NotificacionItemDto } from '../../core/services/dashboard.service';

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

      <!-- Campanita con dropdown de notificaciones -->
      <div class="position-relative me-1 dropdown" id="notifDropdown">
        <button class="btn-icon" data-bs-toggle="dropdown" aria-expanded="false"
                data-bs-auto-close="outside" title="Notificaciones"
                (click)="abrirNotificaciones()">
          <i class="bi bi-bell-fill text-warning"></i>
        </button>
        <span class="notif-badge" *ngIf="conteoNoLeidas > 0">{{ conteoNoLeidas }}</span>

        <!-- Dropdown panel -->
        <div class="dropdown-menu dropdown-menu-end p-0"
             style="width:340px;max-height:420px;overflow-y:auto;border-radius:12px;">
          <!-- Cabecera -->
          <div class="d-flex justify-content-between align-items-center px-3 py-2"
               style="border-bottom:1px solid #f0f0f0;">
            <span class="fw-semibold" style="font-size:.9rem;">Notificaciones</span>
            <span *ngIf="conteoNoLeidas > 0"
                  class="badge rounded-pill bg-primary" style="font-size:.7rem;">
              {{ conteoNoLeidas }} nuevas
            </span>
          </div>

          <!-- Loading -->
          <div *ngIf="loadingNotif" class="text-center py-3">
            <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
          </div>

          <!-- Sin notificaciones -->
          <div *ngIf="!loadingNotif && notificaciones.length === 0"
               class="text-center text-muted py-4" style="font-size:.85rem;">
            <i class="bi bi-bell-slash d-block fs-3 mb-2"></i>
            No hay notificaciones
          </div>

          <!-- Lista -->
          <div *ngFor="let n of notificaciones"
               class="d-flex align-items-start gap-2 px-3 py-2"
               style="border-bottom:1px solid #f9f9f9;"
               [style.background]="n.esLeida ? '#fff' : '#f0f7ff'">
            <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                 style="width:32px;height:32px;font-size:.85rem;"
                 [style.background]="tipoIconBg(n.tipoVisita)"
                 [style.color]="tipoIconColor(n.tipoVisita)">
              <i class="bi" [ngClass]="tipoIcono(n.tipoVisita)"></i>
            </div>
            <div class="flex-grow-1" style="min-width:0;">
              <div style="font-size:.82rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                {{ n.titulo }}
              </div>
              <div style="font-size:.75rem;color:#6c757d;">
                {{ n.fechaVisita | date:'dd/MM/yyyy HH:mm' }}
              </div>
            </div>
            <div *ngIf="!n.esLeida"
                 class="rounded-circle bg-primary flex-shrink-0"
                 style="width:8px;height:8px;margin-top:6px;"></div>
          </div>

          <!-- Pie -->
          <div class="text-center py-2" style="border-top:1px solid #f0f0f0;">
            <a routerLink="/privado/alertas" class="text-primary"
               style="font-size:.8rem;text-decoration:none;">
              Ver todas las alertas →
            </a>
          </div>
        </div>
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
            <a class="dropdown-item" routerLink="/privado/configuracion">
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
  conteoNoLeidas = 0;
  notificaciones: NotificacionItemDto[] = [];
  loadingNotif = false;
  private notifCargadas = false;

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
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) this.cargarConteo();
    });
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
      error: () => {}
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
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
