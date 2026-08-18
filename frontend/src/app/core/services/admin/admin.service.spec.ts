import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getPublicCvSnapshotPending solicita pending', () => {
    let stale = false;
    service.getPublicCvSnapshotPending().subscribe(r => (stale = r.stale));
    const req = httpMock.expectOne(req => req.url.endsWith('/api/admin/public-cv-snapshot/pending'));
    expect(req.request.method).toBe('GET');
    req.flush({ stale: true });
    expect(stale).toBe(true);
  });

  it('downloadPublicCvSnapshot descarga blob', () => {
    let received: Blob | undefined;
    service.downloadPublicCvSnapshot().subscribe(b => {
      received = b;
    });
    const req = httpMock.expectOne(req => req.url.endsWith('/api/admin/public-cv-snapshot/download'));
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['{}'], { type: 'application/json' }));
    expect(received).toBeInstanceOf(Blob);
    expect((received as Blob).size).toBeGreaterThan(0);
  });

  it('previewPublicCvSnapshot devuelve texto', () => {
    let body = '';
    service.previewPublicCvSnapshot().subscribe(t => (body = t));
    const req = httpMock.expectOne(req => req.url.endsWith('/api/admin/public-cv-snapshot/preview'));
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('text');
    req.flush('{"ok":true}');
    expect(body).toBe('{"ok":true}');
  });

  it('acknowledgePublicCvSnapshot hace POST', () => {
    let done = false;
    service.acknowledgePublicCvSnapshot().subscribe(() => (done = true));
    const req = httpMock.expectOne(req => req.url.endsWith('/api/admin/public-cv-snapshot/ack'));
    expect(req.request.method).toBe('POST');
    req.flush('');
    expect(done).toBe(true);
  });

  it('getAuditoriaAuth solicita el listado paginado con filtros', () => {
    let result: { total: number } | undefined;
    service.getAuditoriaAuth(2, 20, 'auth.login_exitoso', 'demo@test.local').subscribe(r => (result = r));

    const req = httpMock.expectOne(
      req => req.url.endsWith('/api/admin/auditoria-auth') && req.method === 'GET'
    );
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('pageSize')).toBe('20');
    expect(req.request.params.get('accion')).toBe('auth.login_exitoso');
    expect(req.request.params.get('q')).toBe('demo@test.local');
    req.flush({ items: [], total: 3, page: 2, pageSize: 20, totalPages: 1 });

    expect(result?.total).toBe(3);
  });

  it('getAuditoriaAuth omite accion/q cuando vienen vacios', () => {
    service.getAuditoriaAuth().subscribe();

    const req = httpMock.expectOne(req => req.url.endsWith('/api/admin/auditoria-auth'));
    expect(req.request.params.has('accion')).toBeFalse();
    expect(req.request.params.has('q')).toBeFalse();
    req.flush({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 1 });
  });
});
