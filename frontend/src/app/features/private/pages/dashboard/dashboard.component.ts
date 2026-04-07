import { Component, OnInit } from '@angular/core';
import { AuthService, UserInfo } from '../../../../core/services/auth.service';

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

    <!-- Métricas -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-md-3">
        <div class="bg-white rounded-3 p-3 shadow-sm text-center">
          <div class="fw-bold fs-3 text-primary">3</div>
          <div class="text-muted small">Total CVs</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="bg-white rounded-3 p-3 shadow-sm text-center">
          <div class="fw-bold fs-3" style="color:#28a745;">124</div>
          <div class="text-muted small">Vistas este mes</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="bg-white rounded-3 p-3 shadow-sm text-center">
          <div class="fw-bold fs-3" style="color:#fd7e14;">5</div>
          <div class="text-muted small">Contactos recibidos</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="bg-white rounded-3 p-3 shadow-sm text-center">
          <div class="fw-bold fs-3" style="color:#20c997;">75%</div>
          <div class="text-muted small">Completitud CV</div>
        </div>
      </div>
    </div>

    <!-- Alertas recientes -->
    <div class="seccion-card">
      <div class="seccion-titulo"><i class="bi bi-bell-fill"></i>Alertas recientes</div>
      <div class="seccion-subtitulo">Últimas notificaciones de actividad en tu CV</div>

      <div class="alert-item type-contact unread">
        <div class="alert-icon contact"><i class="bi bi-envelope-fill"></i></div>
        <div class="alert-body">
          <div class="alert-title">Nuevo mensaje de contacto</div>
          <div class="alert-desc"><strong>Juan Pérez</strong> de <strong>Consulting Partners</strong> te envió un mensaje hace 15 minutos.</div>
          <div class="alert-meta"><span><i class="bi bi-clock me-1"></i>Hace 15 minutos</span></div>
        </div>
        <div class="unread-dot"></div>
      </div>

      <div class="alert-item type-view">
        <div class="alert-icon view"><i class="bi bi-eye-fill"></i></div>
        <div class="alert-body">
          <div class="alert-title">Tu CV fue visto 15+ veces hoy</div>
          <div class="alert-desc">Tu perfil "Frontend Developer — 2026" está teniendo mucha visibilidad.</div>
          <div class="alert-meta"><span><i class="bi bi-clock me-1"></i>Hace 4 horas</span></div>
        </div>
        <div style="width:8px;"></div>
      </div>

      <div class="mt-3 text-end">
        <a routerLink="/alertas" class="btn btn-sm btn-outline-primary">
          Ver todas las alertas →
        </a>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  currentUser: UserInfo | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => { this.currentUser = user; });
  }
}
