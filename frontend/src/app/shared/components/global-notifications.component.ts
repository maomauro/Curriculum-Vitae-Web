import { Component } from '@angular/core';
import { NotificationService } from '../../core/services/shared/notification.service';

@Component({
  selector: 'app-global-notifications',
  standalone: false,
  templateUrl: './global-notifications.component.html',
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
