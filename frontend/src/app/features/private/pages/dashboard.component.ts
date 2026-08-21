import { Component, inject, OnInit } from '@angular/core';
import { CvAnaliticasDetalleService } from '../../../core/services/cv/cv-analiticas-detalle.service';
import { CvDetalleVistaContext } from '../../../shared/contexts/cv-detalle-vista.context';
import { DashboardService, DashboardStatsDto } from '../../../core/services/private/dashboard.service';

/**
 * Franja de actividad (visitas/contactos/alertas, solo privado) + la misma
 * vista analítica que en ficha pública (/cv/:slug/dashboard): app-dashboard-candidato
 * (cabecera + métricas + gráficas del contenido del CV).
 */
@Component({
  selector: 'app-dashboard',
  standalone: false,
  providers: [CvDetalleVistaContext],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly cvAnaliticasDetalle = inject(CvAnaliticasDetalleService);
  private readonly cvDetalleCtx = inject(CvDetalleVistaContext);
  private readonly dashboardService = inject(DashboardService);

  loadingCvAnaliticas = true;
  cvAnaliticasError = false;
  cvAnaliticasListo = false;

  loadingStats = true;
  statsError = false;
  stats: DashboardStatsDto | null = null;

  ngOnInit(): void {
    this.cargarCvParaAnaliticas();
    this.cargarStats();
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

  private cargarStats(): void {
    this.loadingStats = true;
    this.statsError = false;
    this.dashboardService.getStats().subscribe({
      next: stats => {
        this.stats = stats;
        this.loadingStats = false;
      },
      error: () => {
        this.statsError = true;
        this.loadingStats = false;
      },
    });
  }
}
