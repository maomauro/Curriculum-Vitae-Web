import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * El JWT ya no viaja en un header Authorization armado por el cliente: vive en
 * una cookie HttpOnly que el navegador adjunta solo si la request va con
 * withCredentials. Sin esto, el navegador no envía la cookie (y, en producción,
 * tampoco la recibiría entre el SPA y la API, que están en dominios distintos).
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req.clone({ withCredentials: true }));
  }
}
