import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ErrorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth/auth.service';

describe('ErrorInterceptor', () => {
  let interceptor: ErrorInterceptor;
  let authMock: { clearLocalSession: jasmine.Spy };
  let navigateSpy: jasmine.Spy;

  function setup(): void {
    authMock = { clearLocalSession: jasmine.createSpy('clearLocalSession') };
    navigateSpy = jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true));

    TestBed.configureTestingModule({
      providers: [
        ErrorInterceptor,
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: { navigate: navigateSpy } },
      ],
    });

    interceptor = TestBed.inject(ErrorInterceptor);
  }

  it('en un 401 limpia la sesion local (sin llamar al backend) y redirige a la home con el modal de login', () => {
    setup();
    const req = new HttpRequest('GET', '/api/cv/personales');
    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    const next: HttpHandler = { handle: () => throwError(() => error) };

    interceptor.intercept(req, next).subscribe({
      error: () => {
        expect(authMock.clearLocalSession).toHaveBeenCalledTimes(1);
        expect(navigateSpy).toHaveBeenCalledWith(['/'], { queryParams: { authModal: 'login' } });
      },
    });
  });

  it('en otros codigos de error no toca la sesion ni navega', () => {
    setup();
    const req = new HttpRequest('GET', '/api/cv/personales');
    const error = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
    const next: HttpHandler = { handle: () => throwError(() => error) };

    interceptor.intercept(req, next).subscribe({
      error: () => {
        expect(authMock.clearLocalSession).not.toHaveBeenCalled();
        expect(navigateSpy).not.toHaveBeenCalled();
      },
    });
  });

  it('en una respuesta exitosa no hace nada especial', () => {
    setup();
    const req = new HttpRequest('GET', '/api/cv/personales');
    const next: HttpHandler = { handle: () => of(new HttpResponse({ status: 200 })) };

    interceptor.intercept(req, next).subscribe(event => {
      expect(event).toBeTruthy();
    });

    expect(authMock.clearLocalSession).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
