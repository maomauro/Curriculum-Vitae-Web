import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PreviewPublicoPanelComponent } from './preview-publico-panel.component';
import { CvEditorService } from '../../../core/services/private/cv-editor.service';
import { CvDetalleVistaContext } from '../../../shared/contexts/cv-detalle-vista.context';
import type { CvDetalleDto } from '../../../core/services/public/public.service';

describe('PreviewPublicoPanelComponent', () => {
  let component: PreviewPublicoPanelComponent;
  let cvEditorService: jasmine.SpyObj<CvEditorService>;

  const cvDetalle: CvDetalleDto = {
    curriculumId: 1,
    urlPublica: 'cv-test',
    plantillaCodigo: 'clasico',
    experienciaLaboralMesesAcumulados: 12,
    personales: null,
    perfiles: [],
    experiencias: [],
    formaciones: [],
    habilidades: [],
    proyectos: [],
    referencias: [],
    redesSociales: [],
    visibilidadSeccion: [{ seccion: 'proyectos', visible: false }],
  };

  function setup(previewResult = of(cvDetalle)): void {
    cvEditorService = jasmine.createSpyObj('CvEditorService', ['getPreviewPublico']);
    cvEditorService.getPreviewPublico.and.returnValue(previewResult);

    TestBed.configureTestingModule({
      providers: [
        PreviewPublicoPanelComponent,
        CvDetalleVistaContext,
        { provide: CvEditorService, useValue: cvEditorService },
      ],
    });
    component = TestBed.inject(PreviewPublicoPanelComponent);
  }

  it('carga la vista previa al inicializar', () => {
    setup();
    component.ngOnInit();

    expect(cvEditorService.getPreviewPublico).toHaveBeenCalled();
    expect(component.cargando).toBeFalse();
    expect(component.error).toBeFalse();
    expect(component.ctx.cv).toEqual(cvDetalle);
  });

  it('marca error y limpia el contexto si falla la carga', () => {
    setup(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.cargando).toBeFalse();
    expect(component.error).toBeTrue();
    expect(component.ctx.cv).toBeNull();
  });

  it('empieza en la pestaña "profesional" y seleccionarPestana cambia la activa', () => {
    setup();
    expect(component.pestanaActiva).toBe('profesional');

    component.seleccionarPestana('dashboard');
    expect(component.pestanaActiva).toBe('dashboard');
  });

  it('recargar vuelve a pedir la vista previa', () => {
    setup();
    component.ngOnInit();
    cvEditorService.getPreviewPublico.calls.reset();

    component.recargar();

    expect(cvEditorService.getPreviewPublico).toHaveBeenCalledTimes(1);
  });

  it('visibilidad filtra segun visibilidadSeccion del CV cargado', () => {
    setup();
    component.ngOnInit();

    expect(component.visibilidad.visibleSeccion('proyectos')).toBeFalse();
  });

  it('vistaPlantilla es null mientras no hay CV cargado', () => {
    setup();
    expect(component.vistaPlantilla).toBeNull();
  });
});
