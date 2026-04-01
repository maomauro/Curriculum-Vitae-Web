import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router, private authService: AuthService) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized - redirect to login
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/auth']);
          console.error('Unauthorized: redirecting to login');
        }

        // Handle 403 Forbidden
        if (error.status === 403) {
          console.error('Forbidden: access denied');
        }

        // Handle 404 Not Found
        if (error.status === 404) {
          console.error('Not found:', error.message);
        }

        // Handle 500+ Server errors
        if (error.status >= 500) {
          console.error('Server error:', error.statusText);
        }

        return throwError(() => error);
      })
    );
  }
}
