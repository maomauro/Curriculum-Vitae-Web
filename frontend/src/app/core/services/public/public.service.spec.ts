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

  const bootstrapEmpty: PublicCvsSnapshotDto = {
    generatedAtUtc: '1970-01-01T00:00:00Z',
    sourceVersion: 'bootstrap-empty',
    items: [],
  };

  /** forkJoin pide API y estático en paralelo; completar ambas para destrabar getSnapshot. */
  function flushSnapshotPair(apiBody: object | string | null, staticBody: object | string | null): void {
    httpMock.expectOne(PUBLIC_CVS_SNAPSHOT_API_URL).flush(apiBody);
    httpMock.expectOne(PUBLIC_CVS_SNAPSHOT_STATIC_URL).flush(staticBody);
  }

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

    flushSnapshotPair(snapshot, bootstrapEmpty);

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

    flushSnapshotPair({ status: 503, statusText: 'down' }, snapshot);

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
    flushSnapshotPair(snapshot, bootstrapEmpty);
    expect(holder.value).toBe('ana-dev');
  });

  it('retorna null cuando slug no existe', () => {
    let out: unknown = 'init';
    service.getDetalleSnapshot('slug-no-existe').subscribe(v => (out = v));
    flushSnapshotPair(snapshot, bootstrapEmpty);
    expect(out).toBeNull();
  });

  it('retorna null en estadisticas snapshot cuando slug vacío', () => {
    let out: unknown = 'init';
    service.getEstadisticasSnapshot('   ').subscribe(v => (out = v));
    expect(out).toBeNull();
    httpMock.expectNone(PUBLIC_CVS_SNAPSHOT_API_URL);
    httpMock.expectNone(PUBLIC_CVS_SNAPSHOT_STATIC_URL);
  });

  it('retorna estadisticas snapshot cuando existen para slug', () => {
    const withStats: PublicCvsSnapshotDto = {
      ...snapshot,
      items: [
        {
          ...snapshot.items[0],
          estadisticas: {
            curriculumId: 1,
            urlPublica: 'ana-dev',
            totalVisitas: 10,
            totalContactos: 2,
            ultimaVisita: null,
            fechaActualizacion: '2026-04-24T10:00:00Z',
          },
        },
      ],
    };
    let visitas = 0;
    service.getEstadisticasSnapshot('ana-dev').subscribe(v => (visitas = v?.stats.totalVisitas ?? 0));
    flushSnapshotPair(withStats, bootstrapEmpty);
    expect(visitas).toBe(10);
  });

  it('buscarCvsSnapshot aplica filtros de ciudad, habilidad y pagina segura', () => {
    const more: PublicCvsSnapshotDto = {
      ...snapshot,
      items: [
        ...snapshot.items,
        {
          listado: {
            curriculumId: 2,
            urlPublica: 'juan-back',
            nombreCompleto: 'Juan Back',
            fotoUrl: null,
            ciudad: 'Medellin',
            pais: 'Colombia',
            nombrePerfil: 'Backend',
            contadorVisitas: 0,
            contadorContactos: 0,
            habilidades: ['C#', 'SQL'],
          },
          detalle: {
            ...snapshot.items[0].detalle,
            curriculumId: 2,
            urlPublica: 'juan-back',
          },
        },
      ],
    };
    const holder: { value?: SnapshotListadoResponse | null } = {};
    service.buscarCvsSnapshot({ ciudad: 'medellin', habilidad: 'c#', page: 99, pageSize: 1 }).subscribe(r => (holder.value = r));
    flushSnapshotPair(more, bootstrapEmpty);
    expect(holder.value?.page).toBe(1);
    expect(holder.value?.total).toBe(1);
    expect(holder.value?.items[0].urlPublica).toBe('juan-back');
  });

  it('si API devuelve bootstrap vacío pero el estático tiene CVs, usa el estático', () => {
    const holder: { value?: SnapshotListadoResponse | null } = {};
    service.buscarCvsSnapshot({ page: 1, pageSize: 12 }).subscribe(r => (holder.value = r));
    flushSnapshotPair(bootstrapEmpty, snapshot);
    expect(holder.value?.total).toBe(1);
    expect(holder.value?.items[0].urlPublica).toBe('ana-dev');
  });
});

