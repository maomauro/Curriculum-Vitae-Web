import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CvEditorService } from './cv-editor.service';

describe('CvEditorService', () => {
  let service: CvEditorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(CvEditorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('updateExperienciaVisibilidad usa PUT /experiencias/{id}/visibilidad', () => {
    service.updateExperienciaVisibilidad(7, { mostrarEnCv: false }).subscribe();
    const req = httpMock.expectOne(r => r.url.endsWith('/api/cv/experiencias/7/visibilidad'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ mostrarEnCv: false });
    req.flush({});
  });

  it('updateFormacionVisibilidad usa PUT /formaciones/{id}/visibilidad', () => {
    service.updateFormacionVisibilidad(11, { mostrarEnCv: true }).subscribe();
    const req = httpMock.expectOne(r => r.url.endsWith('/api/cv/formaciones/11/visibilidad'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ mostrarEnCv: true });
    req.flush({});
  });

  it('updateProyectoVisibilidad usa PUT /proyectos/{id}/visibilidad', () => {
    service.updateProyectoVisibilidad(3, { mostrarEnCv: false }).subscribe();
    const req = httpMock.expectOne(r => r.url.endsWith('/api/cv/proyectos/3/visibilidad'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ mostrarEnCv: false });
    req.flush({});
  });
});
