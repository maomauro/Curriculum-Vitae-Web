import { Component, inject, OnInit } from '@angular/core';
import { CvAnaliticasDetalleService } from '../../../core/services/cv/cv-analiticas-detalle.service';
import { CvDetalleVistaContext } from '../../../shared/contexts/cv-detalle-vista.context';

/**
 * Misma vista analítica que en ficha pública (/cv/:slug/dashboard): solo
 * app-dashboard-candidato completo (cabecera + métricas + gráficas).
 * Visitas, alertas y resumen de actividad están en /alertas u otras rutas.
 */
@Component({
  selector: 'app-dashboard',
  standalone: false,
  providers: [CvDetalleVistaContext],
  template: `
    <div *ngIf="loadingCvAnaliticas" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando dashboard…</span>
      </div>
      <p class="text-muted small mt-3 mb-0">Cargando analíticas de tu hoja de vida…</p>
    </div>

    <div *ngIf="!loadingCvAnaliticas && cvAnaliticasError" class="container py-5 text-center">
      <i class="bi bi-wifi-off display-4 text-muted"></i>
      <p class="text-muted mt-3">No pudimos cargar el dashboard. Intenta actualizar la página.</p>
    </div>

    <div class="cv-dash-analytics-host" *ngIf="!loadingCvAnaliticas && !cvAnaliticasError && cvAnaliticasListo">
      <app-dashboard-candidato></app-dashboard-candidato>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly cvAnaliticasDetalle = inject(CvAnaliticasDetalleService);
  private readonly cvDetalleCtx = inject(CvDetalleVistaContext);

  loadingCvAnaliticas = true;
  cvAnaliticasError = false;
  cvAnaliticasListo = false;

  ngOnInit(): void {
    this.cargarCvParaAnaliticas();
  }

  private cargarCvParaAnaliticas(): void {
    this.loadingCvAnaliticas = true;
    this.cvAnaliticasError = false;
    this.cvAnaliticasListo = false;
    this.cvDetalleCtx.cv = null;
    this.cvAnaliticasDetalle.detallePrivadoParaAnaliticas$().subscribe({
      next: cv => {
        this.cvDetalleCtx.cv = cv;
        this.cvAnaliticasListo = true;
        this.loadingCvAnaliticas = false;
      },
      error: () => {
        this.cvAnaliticasError = true;
        this.loadingCvAnaliticas = false;
      },
    });
  }
}
