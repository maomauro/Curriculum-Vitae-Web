import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserInfo } from '../../core/services/auth/auth.service';
import { DashboardService, NotificacionItemDto } from '../../core/services/private/dashboard.service';
import { CvEditorService } from '../../core/services/private/cv-editor.service';

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
      <span class="d-none d-md-flex align-items-center gap-2 text-truncate cv-topbar-user-hint">
        <i class="bi bi-person-circle"></i>
        <span class="text-truncate">
          {{ (currentUser?.nombre || 'Usuario') + ' - ' + cargoActual }}
        </span>
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

      <!-- Usuario + logout directo -->
      <div class="user-menu">
        <button type="button" class="btn btn-sm btn-danger" (click)="logout()">
          <i class="bi bi-box-arrow-right me-1"></i>Cerrar sesión
        </button>
      </div>
    </header>
  `
})
export class TopbarComponent implements OnInit {
  currentUser: UserInfo | null = null;
  cargoActual = 'Perfil profesional';
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
    private dashboardService: DashboardService,
    private cvEditorService: CvEditorService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.cargarConteo();
        this.cargarCargoActual();
      } else {
        this.cargoActual = 'Perfil profesional';
      }
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
