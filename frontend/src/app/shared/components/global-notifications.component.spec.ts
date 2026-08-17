import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { GlobalNotificationsComponent } from './global-notifications.component';
import { NotificationService } from '../../core/services/shared/notification.service';

describe('GlobalNotificationsComponent', () => {
  let component: GlobalNotificationsComponent;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    notificationService = jasmine.createSpyObj('NotificationService', ['remove'], {
      notifications$: of([{ id: 1, type: 'success', message: 'Guardado' }]),
    });

    TestBed.configureTestingModule({
      providers: [
        GlobalNotificationsComponent,
        { provide: NotificationService, useValue: notificationService },
      ],
    });
    component = TestBed.inject(GlobalNotificationsComponent);
  });

  it('expone el observable de notificaciones del servicio', done => {
    component.notifications$.subscribe(list => {
      expect(list).toEqual([{ id: 1, type: 'success', message: 'Guardado' }]);
      done();
    });
  });

  it('dismiss delega en el servicio con el id recibido', () => {
    component.dismiss(1);
    expect(notificationService.remove).toHaveBeenCalledWith(1);
  });
});
