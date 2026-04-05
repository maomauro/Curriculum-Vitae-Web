import { Component, OnInit } from '@angular/core';

interface Alert {
  type: string;
  message: string;
  date: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: false,
  template: `
    <div class="app-content-header">
      <div class="container-fluid">
        <div class="row">
          <div class="col-sm-6"><h3 class="mb-0">Dashboard</h3></div>
        </div>
      </div>
    </div>

    <div class="app-content">
      <div class="container-fluid">

        <!-- Tarjetas de métricas -->
        <div class="row g-3 mb-4">
          <div class="col-12 col-sm-4">
            <div class="card border-0 shadow-sm">
              <div class="card-body d-flex align-items-center gap-3">
                <div class="rounded-circle bg-primary bg-opacity-10 p-3">
                  <i class="bi bi-file-earmark-person fs-4 text-primary"></i>
                </div>
                <div>
                  <div class="fs-4 fw-bold">{{ totalCvs }}</div>
                  <div class="text-muted small">CVs publicados</div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="card border-0 shadow-sm">
              <div class="card-body d-flex align-items-center gap-3">
                <div class="rounded-circle bg-success bg-opacity-10 p-3">
                  <i class="bi bi-eye fs-4 text-success"></i>
                </div>
                <div>
                  <div class="fs-4 fw-bold">{{ viewsMonth }}</div>
                  <div class="text-muted small">Vistas este mes</div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="card border-0 shadow-sm">
              <div class="card-body d-flex align-items-center gap-3">
                <div class="rounded-circle bg-info bg-opacity-10 p-3">
                  <i class="bi bi-people fs-4 text-info"></i>
                </div>
                <div>
                  <div class="fs-4 fw-bold">{{ uniqueVisitors }}</div>
                  <div class="text-muted small">Visitas únicas</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabla de alertas recientes -->
        <div class="card shadow-sm">
          <div class="card-header">
            <h5 class="card-title mb-0">Alertas recientes</h5>
          </div>
          <div class="card-body p-0">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Tipo</th>
                  <th>Mensaje</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let alert of alerts">
                  <td>
                    <span class="badge"
                      [class.bg-warning]="alert.type === 'info'"
                      [class.bg-success]="alert.type === 'success'"
                      [class.bg-danger]="alert.type === 'error'">
                      {{ alert.type }}
                    </span>
                  </td>
                  <td>{{ alert.message }}</td>
                  <td class="text-muted small">{{ alert.date }}</td>
                </tr>
                <tr *ngIf="alerts.length === 0">
                  <td colspan="3" class="text-center text-muted py-4">Sin alertas recientes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  totalCvs = 0;
  viewsMonth = 0;
  uniqueVisitors = 0;
  alerts: Alert[] = [];

  ngOnInit(): void {
    // Datos de ejemplo hasta integrar con el servicio
    this.totalCvs = 1;
    this.viewsMonth = 24;
    this.uniqueVisitors = 18;
    this.alerts = [
      { type: 'info', message: 'Tu CV fue visto por un reclutador', date: 'Hoy, 10:30' },
      { type: 'success', message: 'CV publicado correctamente', date: 'Ayer, 09:15' }
    ];
  }
}

