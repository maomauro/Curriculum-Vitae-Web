import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subscription, of, timer } from 'rxjs';
import { catchError, switchMap, takeWhile, tap } from 'rxjs/operators';
import { API_BASE_URL } from '../constants/api-base-url';

export type DbReadinessState = 'checking' | 'ready' | 'degraded';

/**
 * Comprueba periódicamente si la API y la base de datos están listas
 * (`GET /health/ready`). Pensado para cold start de Azure SQL en producción.
 */
@Injectable({ providedIn: 'root' })
export class StartupReadinessService {
  private readonly http = inject(HttpClient);

  private readonly healthUrl = `${API_BASE_URL}/health/ready`;

  /** Si el usuario cierra el modal antes de que la DB esté lista. */
  private readonly dismissedSubject = new BehaviorSubject(false);
  readonly dismissed$ = this.dismissedSubject.asObservable();

  private readonly stateSubject = new BehaviorSubject<DbReadinessState>('checking');
  readonly state$ = this.stateSubject.asObservable();

  private pollSub: Subscription | null = null;

  /** Inicia polling hasta ready o hasta que se llame stop(). */
  startPolling(intervalMs = 2500): void {
    this.stop();
    this.stateSubject.next('checking');

    this.pollSub = timer(0, intervalMs)
      .pipe(
        takeWhile(() => !this.dismissedSubject.value && this.stateSubject.value !== 'ready'),
        switchMap(() =>
          this.http.get(this.healthUrl, { responseType: 'text' }).pipe(
            tap({
              next: body => {
                const ok = (body ?? '').trim().toLowerCase() === 'healthy';
                if (ok) {
                  this.stateSubject.next('ready');
                } else {
                  this.stateSubject.next('degraded');
                }
              },
            }),
            catchError(() => {
              this.stateSubject.next('degraded');
              return of('');
            })
          )
        )
      )
      .subscribe();
  }

  stop(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
  }

  dismiss(): void {
    this.dismissedSubject.next(true);
    this.stop();
  }

  resetDismiss(): void {
    this.dismissedSubject.next(false);
  }
}
