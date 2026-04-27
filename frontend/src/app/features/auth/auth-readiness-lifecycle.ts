import { Directive, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { StartupReadinessService, type DbReadinessState } from '../../core/services/startup-readiness.service';

/** Suscripción a readiness para formularios de auth (login / registro / recuperar). */
@Directive()
export abstract class AuthReadinessLifecycle implements OnInit, OnDestroy {
  readinessState: DbReadinessState = 'checking';
  private readinessSub: Subscription | null = null;

  protected constructor(protected readonly startupReadiness: StartupReadinessService) {}

  ngOnInit(): void {
    this.startupReadiness.resetDismiss();
    this.startupReadiness.startPolling();
    this.readinessSub = this.startupReadiness.state$.subscribe(state => {
      this.readinessState = state;
    });
  }

  ngOnDestroy(): void {
    this.readinessSub?.unsubscribe();
    this.readinessSub = null;
    this.startupReadiness.stop();
  }
}
