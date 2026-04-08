import { Component } from '@angular/core';
import { NotificationService } from '../../core/services/shared/notification.service';

@Component({
  selector: 'app-global-notifications',
  standalone: false,
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1200;">
      <div *ngFor="let n of notifications$ | async"
           class="alert shadow-sm mb-2 d-flex align-items-center justify-content-between gap-2"
           [ngClass]="{
             'alert-success': n.type === 'success',
             'alert-danger': n.type === 'error',
             'alert-warning': n.type === 'warning',
             'alert-info': n.type === 'info'
           }">
        <span>{{ n.message }}</span>
        <button type="button" class="btn-close" aria-label="Cerrar" (click)="dismiss(n.id)"></button>
      </div>
    </div>
  `
})
export class GlobalNotificationsComponent {
  notifications$;

  constructor(private notificationService: NotificationService) {
    this.notifications$ = this.notificationService.notifications$;
  }

  dismiss(id: number): void {
    this.notificationService.remove(id);
  }
}
