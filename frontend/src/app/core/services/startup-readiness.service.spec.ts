import { TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import type { DbReadinessState } from './startup-readiness.service';
import { StartupReadinessService } from './startup-readiness.service';

describe('StartupReadinessService', () => {
  let service: StartupReadinessService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(StartupReadinessService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    service.stop();
    httpMock.verify();
  });

  it('marca listo cuando el cuerpo es healthy (insensible a mayusculas y espacios)', fakeAsync(() => {
    let last: DbReadinessState = 'checking';
    const sub = service.state$.subscribe(s => {
      last = s;
    });

    service.startPolling(5000);
    tick(0);
    httpMock.expectOne(r => r.url.endsWith('/health/ready')).flush('  HEALTHY  ');
    expect(last).toBe('ready');

    tick(5000);
    httpMock.expectNone(r => r.url.endsWith('/health/ready'));

    sub.unsubscribe();
    discardPeriodicTasks();
  }));

  it('marca degradado cuando el cuerpo no es healthy', fakeAsync(() => {
    let last: DbReadinessState = 'checking';
    const sub = service.state$.subscribe(s => {
      last = s;
    });

    service.startPolling(5000);
    tick(0);
    httpMock.expectOne(r => r.url.endsWith('/health/ready')).flush('Unhealthy');
    expect(last).toBe('degraded');

    sub.unsubscribe();
    service.stop();
    discardPeriodicTasks();
  }));

  it('marca degradado ante error HTTP', fakeAsync(() => {
    let last: DbReadinessState = 'checking';
    const sub = service.state$.subscribe(s => {
      last = s;
    });

    service.startPolling(5000);
    tick(0);
    httpMock.expectOne(r => r.url.endsWith('/health/ready')).flush('', {
      status: 503,
      statusText: 'Service Unavailable',
    });
    expect(last).toBe('degraded');

    sub.unsubscribe();
    service.stop();
    discardPeriodicTasks();
  }));

  it('dismiss marca descartado y detiene el polling', fakeAsync(() => {
    const dismissed: boolean[] = [];
    const dSub = service.dismissed$.subscribe(v => dismissed.push(v));

    service.startPolling(5000);
    tick(0);
    httpMock.expectOne(r => r.url.endsWith('/health/ready')).flush('Unhealthy');
    service.dismiss();
    expect(dismissed.at(-1)).toBeTrue();

    tick(5000);
    httpMock.expectNone(r => r.url.endsWith('/health/ready'));

    dSub.unsubscribe();
    discardPeriodicTasks();
  }));

  it('resetDismiss vuelve a false', () => {
    service.dismiss();
    let v = true;
    const s = service.dismissed$.subscribe(x => (v = x));
    s.unsubscribe();
    expect(v).toBeTrue();

    service.resetDismiss();
    service.dismissed$.subscribe(x => (v = x)).unsubscribe();
    expect(v).toBeFalse();
  });

  it('stop evita nuevas peticiones tras completar la primera respuesta', fakeAsync(() => {
    service.startPolling(5000);
    tick(0);
    httpMock.expectOne(r => r.url.endsWith('/health/ready')).flush('Healthy');
    service.stop();

    tick(5000);
    expect(httpMock.match(r => r.url.endsWith('/health/ready')).length).toBe(0);
    discardPeriodicTasks();
  }));

  it('startPolling reinicia el estado a checking', fakeAsync(() => {
    let last: DbReadinessState = 'checking';
    const sub = service.state$.subscribe(s => {
      last = s;
    });

    service.startPolling(5000);
    tick(0);
    httpMock.expectOne(r => r.url.endsWith('/health/ready')).flush('Healthy');
    expect(last).toBe('ready');

    service.startPolling(5000);
    expect(last).toBe('checking');
    tick(0);
    httpMock.expectOne(r => r.url.endsWith('/health/ready')).flush('Healthy');

    sub.unsubscribe();
    service.stop();
    discardPeriodicTasks();
  }));
});
