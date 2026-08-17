import { TestBed } from '@angular/core/testing';
import { DetalleCvComponent } from './detalle-cv.component';
import { CvDetalleVistaContext } from '../../../shared/contexts/cv-detalle-vista.context';
import type { CvDetalleDto } from '../../../core/services/public/public.service';

describe('DetalleCvComponent', () => {
  let component: DetalleCvComponent;
  let ctx: CvDetalleVistaContext;

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

  function setup(): void {
    TestBed.configureTestingModule({
      providers: [DetalleCvComponent, CvDetalleVistaContext],
    });
    component = TestBed.inject(DetalleCvComponent);
    ctx = TestBed.inject(CvDetalleVistaContext);
  }

  it('retorna null cuando el contexto compartido no tiene CV', () => {
    setup();
    expect(component.vistaPlantilla).toBeNull();
  });

  it('mapea el CV del contexto compartido a un vm de plantilla', () => {
    setup();
    ctx.cv = cvDetalle;

    expect(component.vistaPlantilla).not.toBeNull();
    expect(component.vistaPlantilla?.plantillaCodigo).toBe('clasico');
  });
});
