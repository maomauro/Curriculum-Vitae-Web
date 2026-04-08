import { Component, OnInit } from '@angular/core';
import { AuthService, UserInfo } from '../../../core/services/auth/auth.service';
import { DashboardService, DashboardStatsDto, NotificacionItemDto } from '../../../core/services/private/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-speedometer2 me-2 text-primary"></i>Dashboard</h4>
        <span class="text-muted small">Bienvenido, {{ currentUser?.nombre }}. Aquí tienes un resumen de tu actividad.</span>
      </div>
    </div>

    <!-- Loading stats -->
    <div *ngIf="loadingStats" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Métricas -->
    <div *ngIf="!loadingStats" class="row g-3 mb-4">
      <div class="col-6 col-md-3">
        <div class="bg-white rounded-3 p-3 shadow-sm text-center">
          <div class="fw-bold fs-3 text-primary">{{ stats?.totalVisitas ?? 0 }}</div>
          <div class="text-muted small">Visitas totales</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="bg-white rounded-3 p-3 shadow-sm text-center">
          <div class="fw-bold fs-3" style="color:#fd7e14;">{{ stats?.totalContactos ?? 0 }}</div>
          <div class="text-muted small">Contactos recibidos</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="bg-white rounded-3 p-3 shadow-sm text-center">
          <div class="fw-bold fs-3" style="color:#dc3545;">{{ stats?.alertasNoLeidas ?? 0 }}</div>
          <div class="text-muted small">Alertas sin leer</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="bg-white rounded-3 p-3 shadow-sm text-center">
          <div class="fw-bold fs-3" style="color:#20c997;">{{ stats?.porcentajeCompletitud ?? 0 }}%</div>
          <div class="text-muted small">Completitud CV</div>
        </div>
      </div>
    </div>

    <!-- Barra de progreso de completitud -->
    <div *ngIf="!loadingStats && stats" class="bg-white rounded-3 p-4 shadow-sm mb-4">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="fw-semibold">Completitud del CV</span>
        <span class="fw-bold" style="color:#20c997;">{{ stats.porcentajeCompletitud }}%</span>
      </div>
      <div class="progress" style="height:10px;border-radius:6px;">
        <div class="progress-bar bg-success" role="progressbar"
             [style.width]="stats.porcentajeCompletitud + '%'"
             [attr.aria-valuenow]="stats.porcentajeCompletitud"
             aria-valuemin="0" aria-valuemax="100">
        </div>
      </div>
      <div class="text-muted small mt-2" *ngIf="stats.ultimaVisita">
        <i class="bi bi-eye me-1"></i>Última visita: {{ stats.ultimaVisita | date:'dd/MM/yyyy HH:mm' }}
      </div>
    </div>

    <!-- Notificaciones recientes -->
    <div class="seccion-card">
      <div class="seccion-titulo"><i class="bi bi-bell-fill"></i>Alertas recientes</div>
      <div class="seccion-subtitulo">Últimas notificaciones de actividad en tu CV</div>

      <!-- Loading notificaciones -->
      <div *ngIf="loadingNotif" class="text-center py-3">
        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
      </div>

      <!-- Sin notificaciones -->
      <div *ngIf="!loadingNotif && notificaciones.length === 0" class="text-center py-4 text-muted">
        <i class="bi bi-bell display-5"></i>
        <p class="mt-2">No hay alertas todavía.</p>
      </div>

      <!-- Lista de notificaciones -->
      <div *ngFor="let n of notificaciones"
           class="alert-item"
           [class.unread]="!n.esLeida"
           [ngClass]="tipoClass(n.tipoVisita)">
        <div class="alert-icon" [ngClass]="tipoIconClass(n.tipoVisita)">
          <i class="bi" [ngClass]="tipoIcono(n.tipoVisita)"></i>
        </div>
        <div class="alert-body">
          <div class="alert-title">{{ n.titulo }}</div>
          <div class="alert-desc">{{ n.descripcion }}</div>
          <div class="alert-meta">
            <span><i class="bi bi-clock me-1"></i>{{ n.fechaVisita | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
        </div>
        <div *ngIf="!n.esLeida" class="unread-dot"></div>
      </div>

      <div class="mt-3 text-end">
        <a routerLink="/privado/alertas" class="btn btn-sm btn-outline-primary">
          Ver todas las alertas →
        </a>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  currentUser: UserInfo | null = null;
  stats: DashboardStatsDto | null = null;
  notificaciones: NotificacionItemDto[] = [];
  loadingStats = false;
  loadingNotif = false;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => { this.currentUser = user; });
    this.cargarStats();
    this.cargarNotificaciones();
  }

  private cargarStats(): void {
    this.loadingStats = true;
    this.dashboardService.getStats().subscribe({
      next: data => { this.stats = data; this.loadingStats = false; },
      error: () => { this.loadingStats = false; }
    });
  }

  private cargarNotificaciones(): void {
    this.loadingNotif = true;
    this.dashboardService.getNotificaciones(5).subscribe({
      next: data => { this.notificaciones = data.recientes; this.loadingNotif = false; },
      error: () => { this.loadingNotif = false; }
    });
  }

  tipoClass(tipo: string | null): string {
    const map: Record<string, string> = {
      'Contacto': 'type-contact',
      'Vista':    'type-view',
      'Descarga': 'type-download',
      'Sistema':  'type-system',
    };
    return map[tipo ?? ''] ?? '';
  }

  tipoIconClass(tipo: string | null): string {
    const map: Record<string, string> = {
      'Contacto': 'contact',
      'Vista':    'view',
      'Descarga': 'download',
      'Sistema':  'system',
    };
    return map[tipo ?? ''] ?? '';
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
}
