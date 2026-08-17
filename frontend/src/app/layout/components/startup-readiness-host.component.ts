import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { StartupReadinessService, type DbReadinessState } from '../../core/services/startup-readiness.service';

@Component({
  selector: 'app-startup-readiness-host',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './startup-readiness-host.component.html',
  styleUrls: ['./startup-readiness-host.component.scss'],
})
export class StartupReadinessHostComponent implements OnInit, OnDestroy {
  private readonly readiness = inject(StartupReadinessService);

  readonly tituloId = 'startupReadinessTitulo';

  readonly state = toSignal(this.readiness.state$, { initialValue: 'checking' as DbReadinessState });
  readonly dismissed = toSignal(this.readiness.dismissed$, { initialValue: false });

  ngOnInit(): void {
    this.readiness.resetDismiss();
    this.readiness.startPolling();
  }

  ngOnDestroy(): void {
    this.readiness.stop();
  }

  visible(): boolean {
    return !this.dismissed() && this.state() !== 'ready';
  }

  pillText(): string {
    switch (this.state()) {
      case 'ready':
        return 'Lista';
      case 'degraded':
        return 'Revisar';
      default:
        return 'En espera';
    }
  }

  pillClass(): string {
    switch (this.state()) {
      case 'ready':
        return 'startup-readiness__pill--ok';
      case 'degraded':
        return 'startup-readiness__pill--warn';
      default:
        return 'startup-readiness__pill--pending';
    }
  }

  entrar(): void {
    this.readiness.stop();
    this.readiness.dismiss();
  }

  continuarDeTodasFormas(): void {
    this.readiness.dismiss();
  }

  reintentar(): void {
    this.readiness.startPolling();
  }
}
