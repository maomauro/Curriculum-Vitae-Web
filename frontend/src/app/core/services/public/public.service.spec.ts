import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {
  PublicService,
  type PublicCvsSnapshotDto,
  type SnapshotListadoResponse,
} from './public.service';
import {
  PUBLIC_CVS_SNAPSHOT_API_URL,
  PUBLIC_CVS_SNAPSHOT_STATIC_URL,
} from '../../constants/public-snapshot-url';

describe('PublicService (snapshot)', () => {
  let service: PublicService;
  let httpMock: HttpTestingController;

  const snapshot: PublicCvsSnapshotDto = {
    generatedAtUtc: '2026-04-24T10:00:00Z',
    sourceVersion: 'test',
    items: [
      {
        listado: {
          curriculumId: 1,
          urlPublica: 'ana-dev',
          nombreCompleto: 'Ana Dev',
          fotoUrl: null,
          ciudad: 'Bogota',
          pais: 'Colombia',
          nombrePerfil: 'Frontend',
          contadorVisitas: 1,
          contadorContactos: 0,
          habilidades: ['Angular', 'TypeScript'],
        },
        detalle: {
          curriculumId: 1,
          urlPublica: 'ana-dev',
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
          dashboardPublicoActivo: true,
          dashboardMostrarMetricas: true,
          dashboardMostrarGraficas: true,
        },
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(PublicService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('usa snapshot dinámico y filtra búsqueda', () => {
    const holder: { value?: SnapshotListadoResponse | null } = {};
    service.buscarCvsSnapshot({ q: 'angular', page: 1, pageSize: 12 }).subscribe(r => (holder.value = r));

    httpMock.expectOne(PUBLIC_CVS_SNAPSHOT_API_URL).flush(snapshot);

    const result = holder.value;
    expect(result).not.toBeNull();
    if (!result) {
      fail('Se esperaba respuesta de snapshot');
      return;
    }
    expect(result.total).toBe(1);
    expect(result.items[0].urlPublica).toBe('ana-dev');
  });

  it('si falla snapshot dinámico cae al estático', () => {
    const holder: { value?: SnapshotListadoResponse | null } = {};
    service.buscarCvsSnapshot({ page: 1, pageSize: 12 }).subscribe(r => (holder.value = r));

    httpMock.expectOne(PUBLIC_CVS_SNAPSHOT_API_URL).flush('x', { status: 503, statusText: 'down' });
    httpMock.expectOne(PUBLIC_CVS_SNAPSHOT_STATIC_URL).flush(snapshot);

    const result = holder.value;
    expect(result).not.toBeNull();
    if (!result) {
      fail('Se esperaba fallback estático');
      return;
    }
    expect(result.items.length).toBe(1);
  });

  it('devuelve detalle snapshot por slug (case-insensitive)', () => {
    const holder: { value?: string | null } = {};
    service.getDetalleSnapshot('ANA-DEV').subscribe(v => (holder.value = v?.detalle.urlPublica ?? null));
    httpMock.expectOne(PUBLIC_CVS_SNAPSHOT_API_URL).flush(snapshot);
    expect(holder.value).toBe('ana-dev');
  });

  it('retorna null cuando slug no existe', () => {
    let out: unknown = 'init';
    service.getDetalleSnapshot('slug-no-existe').subscribe(v => (out = v));
    httpMock.expectOne(PUBLIC_CVS_SNAPSHOT_API_URL).flush(snapshot);
    expect(out).toBeNull();
  });
});

