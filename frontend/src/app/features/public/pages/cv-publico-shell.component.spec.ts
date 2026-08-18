import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of, throwError, TimeoutError } from 'rxjs';
import { CvAnaliticasDetalleService } from '../../../core/services/cv/cv-analiticas-detalle.service';
import { PublicService, type CvDetalleDto } from '../../../core/services/public/public.service';
import { CvPublicoShellComponent } from './cv-publico-shell.component';

describe('CvPublicoShellComponent', () => {
  let fixture: ComponentFixture<CvPublicoShellComponent>;
  let component: CvPublicoShellComponent;

  const paramMap$ = new BehaviorSubject(convertToParamMap({ urlPublica: 'ana-dev' }));

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
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        { provide: PublicService, useValue: publicServiceMock },
        { provide: CvAnaliticasDetalleService, useValue: cvAnaliticasMock },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    cvAnaliticasMock.detallePublicoParaAnaliticas$.calls.reset();
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
});
