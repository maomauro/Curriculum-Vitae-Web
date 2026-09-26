import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of, throwError, TimeoutError } from 'rxjs';
import { CvAnaliticasDetalleService } from '../../../core/services/cv/cv-analiticas-detalle.service';
import { PublicService, type CvDetalleDto } from '../../../core/services/public/public.service';
import { CvPublicoShellComponent } from './cv-publico-shell.component';

describe('CvPublicoShellComponent', () => {
  let fixture: ComponentFixture<CvPublicoShellComponent>;
  let component: CvPublicoShellComponent;

  const paramMap$ = new BehaviorSubject(convertToParamMap({ urlPublica: 'ana-dev' }));
  /** Mutable: cada test ajusta el path de ruta hija "activa" antes de detectChanges. */
  const activatedRouteMock: {
    paramMap: ReturnType<typeof paramMap$.asObservable>;
    firstChild: { snapshot: { routeConfig: { path: string } } } | undefined;
  } = {
    paramMap: paramMap$.asObservable(),
    firstChild: undefined,
  };

  const apiDetail: CvDetalleDto = {
    curriculumId: 1,
    urlPublica: 'ana-dev',
    plantillaCodigo: 'moderno',
    experienciaLaboralMesesAcumulados: 24,
    personales: { nombreCompleto: 'Ana', fotoUrl: null, ciudad: null, pais: null, celular: null, email: null },
    perfiles: [],
    experiencias: [],
    formaciones: [],
    habilidades: [],
    proyectos: [],
    referencias: [],
    redesSociales: [],
  };

  const publicServiceMock = {
    registrarImpresionPdf: jasmine.createSpy('registrarImpresionPdf').and.returnValue(of(void 0)),
    contactar: jasmine.createSpy('contactar').and.returnValue(of(void 0)),
  };

  const cvAnaliticasMock = {
    detallePublicoParaAnaliticas$: jasmine.createSpy('detallePublicoParaAnaliticas$'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, RouterTestingModule],
      declarations: [CvPublicoShellComponent],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: PublicService, useValue: publicServiceMock },
        { provide: CvAnaliticasDetalleService, useValue: cvAnaliticasMock },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    cvAnaliticasMock.detallePublicoParaAnaliticas$.calls.reset();
    activatedRouteMock.firstChild = undefined;
    fixture = TestBed.createComponent(CvPublicoShellComponent);
    component = fixture.componentInstance;
  });

  it('carga el detalle desde la API y queda en estado listo', () => {
    cvAnaliticasMock.detallePublicoParaAnaliticas$.and.returnValue(of(apiDetail));

    fixture.detectChanges();

    expect(component.estado).toBe('listo');
    expect(component.ctx.cv?.plantillaCodigo).toBe('moderno');
  });

  it('marca no_encontrado cuando la API responde 404', () => {
    cvAnaliticasMock.detallePublicoParaAnaliticas$.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }))
    );

    fixture.detectChanges();

    expect(component.estado).toBe('no_encontrado');
    expect(component.ctx.cv).toBeNull();
  });

  it('marca error cuando la API falla con otro status', () => {
    cvAnaliticasMock.detallePublicoParaAnaliticas$.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 503, statusText: 'Service Unavailable' }))
    );

    fixture.detectChanges();

    expect(component.estado).toBe('error');
    expect(component.ctx.cv).toBeNull();
  });

  it('marca error cuando la API excede el timeout', () => {
    cvAnaliticasMock.detallePublicoParaAnaliticas$.and.returnValue(throwError(() => new TimeoutError()));

    fixture.detectChanges();

    expect(component.estado).toBe('error');
  });

  describe('redirigirSiPestanaOculta', () => {
    it('no navega si la pestaña activa esta habilitada', () => {
      activatedRouteMock.firstChild = { snapshot: { routeConfig: { path: 'profesional' } } };
      cvAnaliticasMock.detallePublicoParaAnaliticas$.and.returnValue(of(apiDetail));
      const router = TestBed.inject(Router);
      const navigateSpy = spyOn(router, 'navigate');

      fixture.detectChanges();

      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('redirige a la primera pestaña habilitada si la activa esta apagada', () => {
      activatedRouteMock.firstChild = { snapshot: { routeConfig: { path: 'profesional' } } };
      cvAnaliticasMock.detallePublicoParaAnaliticas$.and.returnValue(
        of({ ...apiDetail, informacionProfesionalPublicaActiva: false })
      );
      const router = TestBed.inject(Router);
      const navigateSpy = spyOn(router, 'navigate');

      fixture.detectChanges();

      expect(navigateSpy).toHaveBeenCalledWith(['/cv', 'ana-dev', 'dashboard']);
    });

    it('redirige al listado si las tres pestañas estan apagadas', () => {
      activatedRouteMock.firstChild = { snapshot: { routeConfig: { path: 'dashboard' } } };
      cvAnaliticasMock.detallePublicoParaAnaliticas$.and.returnValue(
        of({
          ...apiDetail,
          dashboardMostrarMetricas: false,
          dashboardMostrarGraficas: false,
          informacionProfesionalPublicaActiva: false,
          hojaDeVidaPublicaActiva: false,
        })
      );
      const router = TestBed.inject(Router);
      const navigateSpy = spyOn(router, 'navigate');

      fixture.detectChanges();

      expect(navigateSpy).toHaveBeenCalledWith(['/cvs']);
    });
  });
});
