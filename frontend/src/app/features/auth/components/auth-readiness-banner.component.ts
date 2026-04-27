import { Component, Input } from '@angular/core';
import type { DbReadinessState } from '../../../core/services/startup-readiness.service';

@Component({
  selector: 'app-auth-readiness-banner',
  standalone: false,
  template: `
    <div
      *ngIf="state !== 'ready'"
      class="alert alert-warning d-flex align-items-center gap-2 mb-3 py-2"
      role="status"
      aria-live="polite">
      <i class="bi bi-clock-history"></i>
      <div>Estamos iniciando servicios. Si una acción falla, espera unos segundos y reintenta.</div>
    </div>
  `,
})
export class AuthReadinessBannerComponent {
  @Input() state: DbReadinessState = 'checking';
}
