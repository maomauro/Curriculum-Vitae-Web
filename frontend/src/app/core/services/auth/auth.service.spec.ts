import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, type MeApiResponse } from './auth.service';
import { API_BASE_URL } from '../../constants/api-base-url';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const loginUrl = `${API_BASE_URL}/api/auth/login`;
  const logoutUrl = `${API_BASE_URL}/api/auth/logout`;

  const meResponse: MeApiResponse = {
    usuarioId: 7,
    email: 'demo@test.local',
    nombreCompleto: 'Demo User',
    roles: ['Publicador'],
    curriculumId: 3,
  };

  afterEach(() => {
    delete window.__PORTALCV_SESSION__;
    httpMock.verify();
  });

  function setup(): void {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  }

  it('no restaura usuario si no hay semilla de sesion en window.__PORTALCV_SESSION__', () => {
    window.__PORTALCV_SESSION__ = null;
    setup();

    expect(service.currentUser).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('restaura el usuario desde window.__PORTALCV_SESSION__ al construirse (seteado por main.ts vía /me)', () => {
    window.__PORTALCV_SESSION__ = meResponse;
    setup();

    expect(service.isLoggedIn()).toBeTrue();
    expect(service.currentUser).toEqual({
      id: 7,
      nombre: 'Demo User',
      email: 'demo@test.local',
      rol: 'Publicador',
      roles: ['Publicador'],
      curriculumId: 3,
    });
  });

  it('login() actualiza currentUser con la respuesta del backend (sin token en el body)', () => {
    setup();
    expect(service.currentUser).toBeNull();

    service.login('demo@test.local', 'secret').subscribe();

    const req = httpMock.expectOne(loginUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'demo@test.local', password: 'secret' });
    req.flush({
      usuarioId: 7,
      email: 'demo@test.local',
      nombreCompleto: 'Demo User',
      roles: ['Publicador'],
      curriculumId: 3,
      expiracion: '2026-01-01T00:00:00Z',
    });

    expect(service.isLoggedIn()).toBeTrue();
    expect(service.currentUser?.email).toBe('demo@test.local');
  });

  it('logout() limpia el estado local de inmediato y dispara POST /logout en segundo plano', () => {
    window.__PORTALCV_SESSION__ = meResponse;
    setup();
    expect(service.isLoggedIn()).toBeTrue();

    service.logout();

    // El estado local se limpia sincronicamente, sin esperar la respuesta del backend.
    expect(service.isLoggedIn()).toBeFalse();

    const req = httpMock.expectOne(logoutUrl);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'ok' });
  });

  it('logout() no rompe si la llamada a /logout falla (la sesion local ya quedo limpia)', () => {
    window.__PORTALCV_SESSION__ = meResponse;
    setup();

    service.logout();

    const req = httpMock.expectOne(logoutUrl);
    req.flush('boom', { status: 500, statusText: 'Server Error' });

    expect(service.isLoggedIn()).toBeFalse();
  });

  it('clearLocalSession() limpia el estado sin llamar al backend', () => {
    window.__PORTALCV_SESSION__ = meResponse;
    setup();
    expect(service.isLoggedIn()).toBeTrue();

    service.clearLocalSession();

    expect(service.isLoggedIn()).toBeFalse();
    httpMock.expectNone(logoutUrl);
  });

  it('hasRol() refleja los roles del usuario actual', () => {
    window.__PORTALCV_SESSION__ = { ...meResponse, roles: ['Publicador', 'Admin'] };
    setup();

    expect(service.hasRol('Publicador')).toBeTrue();
    expect(service.hasRol('Admin')).toBeTrue();
    expect(service.hasRol('Visitante')).toBeFalse();
  });

  it('postLoginPath() manda a /dashboard para Publicador', () => {
    window.__PORTALCV_SESSION__ = { ...meResponse, roles: ['Publicador'] };
    setup();

    expect(service.postLoginPath()).toBe('/dashboard');
  });

  it('postLoginPath() manda a /admin/usuarios para Admin sin rol Publicador', () => {
    window.__PORTALCV_SESSION__ = { ...meResponse, roles: ['Admin'] };
    setup();

    expect(service.postLoginPath()).toBe('/admin/usuarios');
  });

  it('buildUserFromResponse usa el email como nombre si nombreCompleto viene vacio', () => {
    window.__PORTALCV_SESSION__ = { ...meResponse, nombreCompleto: '' };
    setup();

    expect(service.currentUser?.nombre).toBe('demo@test.local');
  });
});
