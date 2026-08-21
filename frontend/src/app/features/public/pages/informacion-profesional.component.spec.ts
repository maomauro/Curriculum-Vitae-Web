import { TestBed } from '@angular/core/testing';
import { InformacionProfesionalComponent } from './informacion-profesional.component';
import { CvDetalleVistaContext } from '../../../shared/contexts/cv-detalle-vista.context';
import type { CvDetalleDto } from '../../../core/services/public/public.service';

describe('InformacionProfesionalComponent', () => {
  let component: InformacionProfesionalComponent;
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
      providers: [InformacionProfesionalComponent, CvDetalleVistaContext],
    });
    component = TestBed.inject(InformacionProfesionalComponent);
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

  it('visibilidad filtra segun las filas de VisibilidadSeccion del CV', () => {
    setup();
    ctx.cv = { ...cvDetalle, visibilidadSeccion: [{ seccion: 'proyectos', visible: false }] };

    expect(component.visibilidad.visibleSeccion('proyectos')).toBeFalse();
    expect(component.visibilidad.visibleSeccion('habilidades')).toBeTrue();
  });

  it('visibilidad no falla si el CV no trae visibilidadSeccion', () => {
    setup();
    ctx.cv = cvDetalle;

    expect(component.visibilidad.visibleSeccion('proyectos')).toBeTrue();
  });
});
