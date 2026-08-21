import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CvEditorService, PersonalesDto } from './cv-editor.service';

function personalesFixture(fotoUrl: string | null): PersonalesDto {
  return {
    personalesId: 1, curriculumId: 1, tipoIdentificacion: null, numeroDocumento: null,
    fechaExpedicion: null, lugarExpedicion: null, libretaMilitarNumero: null, libretaMilitarClase: null,
    pasaporteNumero: null, pasaporteVigencia: null, visaNumero: null, visaVigencia: null, visaClase: null,
    primerNombre: 'Ana', segundoNombre: null, primerApellido: 'Gómez', segundoApellido: null,
    fechaNacimiento: null, lugarNacimiento: null, genero: null, nacionalidad: null, tipoSangre: null,
    eps: null, pencion: null, cesantias: null, email: null, celular: null, telefonoFijo: null,
    pais: null, departamento: null, ciudad: null, barrio: null, codigoPostal: null, direccion: null,
    tipoResidencia: null, fotoUrl,
  };
}

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

  describe('fotoUrl de Personales', () => {
    it('getPersonales antepone API_BASE_URL cuando fotoUrl es una ruta relativa (foto subida como binario)', () => {
      let resultado: PersonalesDto | undefined;
      service.getPersonales().subscribe(dto => (resultado = dto));

      const req = httpMock.expectOne(r => r.url.endsWith('/api/cv/personales'));
      req.flush(personalesFixture('/api/cv/personales/foto'));

      expect(resultado?.fotoUrl).toBe('/api/cv/personales/foto');
    });

    it('getPersonales deja intacta una URL legacy absoluta pegada por el usuario', () => {
      let resultado: PersonalesDto | undefined;
      service.getPersonales().subscribe(dto => (resultado = dto));

      const req = httpMock.expectOne(r => r.url.endsWith('/api/cv/personales'));
      req.flush(personalesFixture('https://example.com/mi-foto.jpg'));

      expect(resultado?.fotoUrl).toBe('https://example.com/mi-foto.jpg');
    });

    it('getPersonales deja fotoUrl en null si no hay foto', () => {
      let resultado: PersonalesDto | undefined;
      service.getPersonales().subscribe(dto => (resultado = dto));

      const req = httpMock.expectOne(r => r.url.endsWith('/api/cv/personales'));
      req.flush(personalesFixture(null));

      expect(resultado?.fotoUrl).toBeNull();
    });

    it('uploadFotoPersonales envia PUT multipart con el archivo bajo la clave "archivo"', () => {
      const archivo = new File(['contenido'], 'foto.jpg', { type: 'image/jpeg' });
      let resultado: PersonalesDto | undefined;
      service.uploadFotoPersonales(archivo).subscribe(dto => (resultado = dto));

      const req = httpMock.expectOne(r => r.url.endsWith('/api/cv/personales/foto'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body instanceof FormData).toBeTrue();
      expect((req.request.body as FormData).get('archivo')).toBe(archivo);
      req.flush(personalesFixture('/api/cv/personales/foto'));

      expect(resultado?.fotoUrl).toBe('/api/cv/personales/foto');
    });

    it('eliminarFotoPersonales envia DELETE y refleja fotoUrl en null', () => {
      let resultado: PersonalesDto | undefined;
      service.eliminarFotoPersonales().subscribe(dto => (resultado = dto));

      const req = httpMock.expectOne(r => r.url.endsWith('/api/cv/personales/foto'));
      expect(req.request.method).toBe('DELETE');
      req.flush(personalesFixture(null));

      expect(resultado?.fotoUrl).toBeNull();
    });
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
