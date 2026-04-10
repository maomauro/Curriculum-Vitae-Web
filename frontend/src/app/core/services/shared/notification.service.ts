import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface AppNotification {
  id: number;
  type: NotificationType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  readonly notifications$ = this.notificationsSubject.asObservable();
  private nextId = 1;

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  warning(message: string): void {
    this.show('warning', message);
  }

  remove(id: number): void {
    this.notificationsSubject.next(this.notificationsSubject.value.filter(n => n.id !== id));
  }

  private show(type: NotificationType, message: string): void {
    const notification: AppNotification = { id: this.nextId++, type, message };
    this.notificationsSubject.next([...this.notificationsSubject.value, notification]);
    setTimeout(() => this.remove(notification.id), 3500);
  }
}
