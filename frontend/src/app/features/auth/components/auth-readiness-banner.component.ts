import { Component, Input } from '@angular/core';
import type { DbReadinessState } from '../../../core/services/startup-readiness.service';

@Component({
  selector: 'app-auth-readiness-banner',
  standalone: false,
  templateUrl: './auth-readiness-banner.component.html',
})
export class AuthReadinessBannerComponent {
  @Input() state: DbReadinessState = 'checking';
}
