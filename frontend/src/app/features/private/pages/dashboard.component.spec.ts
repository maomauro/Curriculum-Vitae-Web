import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { CvAnaliticasDetalleService } from '../../../core/services/cv/cv-analiticas-detalle.service';
import { CvDetalleVistaContext } from '../../../shared/contexts/cv-detalle-vista.context';
import { DashboardService, DashboardStatsDto } from '../../../core/services/private/dashboard.service';
import type { CvDetalleDto } from '../../../core/services/public/public.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let cvAnaliticasDetalle: jasmine.SpyObj<CvAnaliticasDetalleService>;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let cvDetalleCtx: CvDetalleVistaContext;

  const cvDetalle: CvDetalleDto = {
    curriculumId: 1,
    urlPublica: 'cv-test',
    plantillaCodigo: 'clasico',
    experienciaLaboralMesesAcumulados: 24,
    personales: null,
    perfiles: [],
    experiencias: [],
    formaciones: [],
    habilidades: [],
    proyectos: [],
    referencias: [],
    redesSociales: [],
  };

  const statsDto: DashboardStatsDto = {
    totalVisitas: 42,
    totalContactos: 3,
    alertasNoLeidas: 2,
    porcentajeCompletitud: 80,
    ultimaVisita: '2026-08-20T10:00:00Z',
    fechaActualizacion: '2026-08-20T10:00:00Z',
  };

  function setup(detalleResult = of(cvDetalle), statsResult = of(statsDto)): void {
    cvAnaliticasDetalle = jasmine.createSpyObj('CvAnaliticasDetalleService', ['detallePrivadoParaAnaliticas$']);
    cvAnaliticasDetalle.detallePrivadoParaAnaliticas$.and.returnValue(detalleResult);
    dashboardService = jasmine.createSpyObj('DashboardService', ['getStats']);
    dashboardService.getStats.and.returnValue(statsResult);

    TestBed.configureTestingModule({
      providers: [
        DashboardComponent,
        CvDetalleVistaContext,
        { provide: CvAnaliticasDetalleService, useValue: cvAnaliticasDetalle },
        { provide: DashboardService, useValue: dashboardService },
      ],
    });
    component = TestBed.inject(DashboardComponent);
    cvDetalleCtx = TestBed.inject(CvDetalleVistaContext);
  }

  it('arranca en estado de carga, sin error y sin listo', () => {
    setup();
    expect(component.loadingCvAnaliticas).toBeTrue();
    expect(component.cvAnaliticasError).toBeFalse();
    expect(component.cvAnaliticasListo).toBeFalse();
  });

  it('ngOnInit carga el detalle y lo publica en el contexto compartido', () => {
    setup();
    component.ngOnInit();

    expect(cvAnaliticasDetalle.detallePrivadoParaAnaliticas$).toHaveBeenCalled();
    expect(component.loadingCvAnaliticas).toBeFalse();
    expect(component.cvAnaliticasError).toBeFalse();
    expect(component.cvAnaliticasListo).toBeTrue();
    expect(cvDetalleCtx.cv).toEqual(cvDetalle);
  });

  it('ngOnInit marca error y detiene la carga si el servicio falla', () => {
    setup(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.loadingCvAnaliticas).toBeFalse();
    expect(component.cvAnaliticasError).toBeTrue();
    expect(component.cvAnaliticasListo).toBeFalse();
  });

  it('ngOnInit carga las estadisticas de actividad (visitas/contactos/alertas)', () => {
    setup();
    component.ngOnInit();

    expect(dashboardService.getStats).toHaveBeenCalled();
    expect(component.loadingStats).toBeFalse();
    expect(component.statsError).toBeFalse();
    expect(component.stats).toEqual(statsDto);
  });

  it('ngOnInit marca statsError y detiene la carga si /dashboard/stats falla', () => {
    setup(of(cvDetalle), throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.loadingStats).toBeFalse();
    expect(component.statsError).toBeTrue();
    expect(component.stats).toBeNull();
  });
});
