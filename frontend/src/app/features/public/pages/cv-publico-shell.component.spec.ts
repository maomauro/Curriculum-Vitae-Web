import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { CvAnaliticasDetalleService } from '../../../core/services/cv/cv-analiticas-detalle.service';
import { PublicService, type CvDetalleDto } from '../../../core/services/public/public.service';
import { CvPublicoShellComponent } from './cv-publico-shell.component';

describe('CvPublicoShellComponent', () => {
  let fixture: ComponentFixture<CvPublicoShellComponent>;
  let component: CvPublicoShellComponent;

  const paramMap$ = new BehaviorSubject(convertToParamMap({ urlPublica: 'ana-dev' }));

  const snapshotDetail: CvDetalleDto = {
    curriculumId: 1,
    urlPublica: 'ana-dev',
    plantillaCodigo: 'clasico',
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

  const apiDetail: CvDetalleDto = {
    ...snapshotDetail,
    plantillaCodigo: 'moderno',
  };

  const publicServiceMock = {
    getDetalleSnapshot: jasmine.createSpy('getDetalleSnapshot'),
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
    publicServiceMock.getDetalleSnapshot.calls.reset();
    cvAnaliticasMock.detallePublicoParaAnaliticas$.calls.reset();
    fixture = TestBed.createComponent(CvPublicoShellComponent);
    component = fixture.componentInstance;
  });

  it('usa snapshot temporal y luego reemplaza con API cuando responde bien', () => {
    publicServiceMock.getDetalleSnapshot.and.returnValue(
      of({ detalle: snapshotDetail, generatedAtUtc: '2026-04-24T12:00:00Z' })
    );
    cvAnaliticasMock.detallePublicoParaAnaliticas$.and.returnValue(of(apiDetail));

    fixture.detectChanges();

    expect(component.estado).toBe('listo');
    expect(component.usandoSnapshot).toBeFalse();
    expect(component.snapshotActualizadoEn).toBeNull();
    expect(component.ctx.cv?.plantillaCodigo).toBe('moderno');
  });

  it('mantiene snapshot cuando API falla y hay fallback', () => {
    publicServiceMock.getDetalleSnapshot.and.returnValue(
      of({ detalle: snapshotDetail, generatedAtUtc: '2026-04-24T12:00:00Z' })
    );
    cvAnaliticasMock.detallePublicoParaAnaliticas$.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 503, statusText: 'Service Unavailable' }))
    );

    fixture.detectChanges();

    expect(component.estado).toBe('listo');
    expect(component.usandoSnapshot).toBeTrue();
    expect(component.ctx.cv?.urlPublica).toBe('ana-dev');
  });
});

