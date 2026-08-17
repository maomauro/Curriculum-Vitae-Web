import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { CvAnaliticasDetalleService } from '../../../core/services/cv/cv-analiticas-detalle.service';
import { CvDetalleVistaContext } from '../../../shared/contexts/cv-detalle-vista.context';
import type { CvDetalleDto } from '../../../core/services/public/public.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let cvAnaliticasDetalle: jasmine.SpyObj<CvAnaliticasDetalleService>;
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

  function setup(detalleResult = of(cvDetalle)): void {
    cvAnaliticasDetalle = jasmine.createSpyObj('CvAnaliticasDetalleService', ['detallePrivadoParaAnaliticas$']);
    cvAnaliticasDetalle.detallePrivadoParaAnaliticas$.and.returnValue(detalleResult);

    TestBed.configureTestingModule({
      providers: [
        DashboardComponent,
        CvDetalleVistaContext,
        { provide: CvAnaliticasDetalleService, useValue: cvAnaliticasDetalle },
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
});
