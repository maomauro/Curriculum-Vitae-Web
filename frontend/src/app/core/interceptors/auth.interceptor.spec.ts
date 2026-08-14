import { HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { AuthInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  it('clona la request con withCredentials:true para que el navegador mande la cookie de sesion', () => {
    const interceptor = new AuthInterceptor();
    const req = new HttpRequest('GET', '/api/cv/personales');
    const handleSpy = jasmine.createSpy('handle').and.returnValue(of(new HttpResponse({ status: 200 })));
    const next: HttpHandler = { handle: handleSpy };

    interceptor.intercept(req, next).subscribe();

    expect(handleSpy).toHaveBeenCalledTimes(1);
    const clonedReq = handleSpy.calls.mostRecent().args[0] as HttpRequest<unknown>;
    expect(clonedReq.withCredentials).toBeTrue();
    expect(clonedReq.url).toBe('/api/cv/personales');
  });
});
