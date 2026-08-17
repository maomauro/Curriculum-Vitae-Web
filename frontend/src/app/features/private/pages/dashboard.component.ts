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
  templateUrl: './dashboard.component.html',
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
