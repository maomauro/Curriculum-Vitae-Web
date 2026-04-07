import { Component, OnInit } from '@angular/core';
import { AuthService, UserInfo } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  template: `
    <!-- Page header -->
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h4 class="mb-1 fw-semibold">Dashboard de tu Hoja de Vida</h4>
        <p class="text-muted mb-0 small">Visualiza y analiza tu información</p>
      </div>
    </div>

    <!-- Tarjetas métricas -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="metric-icon rounded-3 d-flex align-items-center justify-content-center"
                 style="background:#28A745;width:48px;height:48px;">
              <i class="bi bi-file-earmark-text text-white fs-5"></i>
            </div>
            <div>
              <p class="text-muted small mb-0">Total CVs</p>
              <h5 class="mb-0 fw-bold">3</h5>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="metric-icon rounded-3 d-flex align-items-center justify-content-center"
                 style="background:#007BFF;width:48px;height:48px;">
              <i class="bi bi-eye text-white fs-5"></i>
            </div>
            <div>
              <p class="text-muted small mb-0">Vistas</p>
              <h5 class="mb-0 fw-bold">124</h5>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="metric-icon rounded-3 d-flex align-items-center justify-content-center"
                 style="background:#6F42C1;width:48px;height:48px;">
              <i class="bi bi-people text-white fs-5"></i>
            </div>
            <div>
              <p class="text-muted small mb-0">Visitantes</p>
              <h5 class="mb-0 fw-bold">89</h5>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-sm-6 col-xl-3">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="metric-icon rounded-3 d-flex align-items-center justify-content-center"
                 style="background:#20C997;width:48px;height:48px;">
              <i class="bi bi-check-circle text-white fs-5"></i>
            </div>
            <div>
              <p class="text-muted small mb-0">Completitud</p>
              <h5 class="mb-0 fw-bold">75%</h5>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Alertas recientes -->
    <div class="card shadow-sm border-0">
      <div class="card-header bg-transparent border-bottom-0 pb-0">
        <h6 class="mb-0 fw-semibold">Alertas recientes</h6>
      </div>
      <div class="card-body p-0">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th class="ps-3">Fecha</th>
              <th>Evento</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="ps-3 text-muted small">05/04</td>
              <td>Nuevo visitante en tu CV</td>
              <td><span class="badge bg-info">Info</span></td>
            </tr>
            <tr>
              <td class="ps-3 text-muted small">04/04</td>
              <td>CV actualizado correctamente</td>
              <td><span class="badge bg-success">OK</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  currentUser: UserInfo | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }
}
