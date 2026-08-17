import { HttpErrorResponse } from '@angular/common/http';
import { Renderer2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminLayoutComponent } from './admin-layout.component';
import { PrivateLayoutSidebarService } from '../services/private-layout-sidebar.service';
import { AdminService } from '../../core/services/admin/admin.service';
import { NotificationService } from '../../core/services/shared/notification.service';
import { AuthService } from '../../core/services/auth/auth.service';

describe('AdminLayoutComponent', () => {
  let component: AdminLayoutComponent;
  let adminService: jasmine.SpyObj<AdminService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let authService: jasmine.SpyObj<AuthService>;
  let sidebarNav: jasmine.SpyObj<PrivateLayoutSidebarService>;

  const rendererStub = {
    addClass: (el: HTMLElement, cls: string) => el.classList.add(cls),
    removeClass: (el: HTMLElement, cls: string) => el.classList.remove(cls),
  };

  function setup(hasAdminRol = true): void {
    document.body.className = '';
    adminService = jasmine.createSpyObj('AdminService', [
      'getPublicCvSnapshotPending',
      'downloadPublicCvSnapshot',
      'previewPublicCvSnapshot',
      'acknowledgePublicCvSnapshot',
    ]);
    adminService.getPublicCvSnapshotPending.and.returnValue(of({ stale: true }));
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    authService = jasmine.createSpyObj('AuthService', ['hasRol']);
    authService.hasRol.and.returnValue(hasAdminRol);
    sidebarNav = jasmine.createSpyObj('PrivateLayoutSidebarService', ['syncWithViewport', 'closeMobileDrawer']);

    TestBed.configureTestingModule({
      providers: [
        AdminLayoutComponent,
        { provide: Renderer2, useValue: rendererStub },
        { provide: PrivateLayoutSidebarService, useValue: sidebarNav },
        { provide: AdminService, useValue: adminService },
        { provide: NotificationService, useValue: notificationService },
        { provide: AuthService, useValue: authService },
      ],
    });
    component = TestBed.inject(AdminLayoutComponent);
  }

  afterEach(() => {
    document.body.className = '';
  });

  it('ngOnInit consulta el estado del snapshot solo para administradores', () => {
    setup(true);
    component.ngOnInit();
    expect(adminService.getPublicCvSnapshotPending).toHaveBeenCalled();
  });

  it('ngOnInit no consulta el snapshot si el usuario no es administrador', () => {
    setup(false);
    component.ngOnInit();
    expect(adminService.getPublicCvSnapshotPending).not.toHaveBeenCalled();
  });

  it('ngOnInit agrega las clases de layout privado al body', () => {
    setup();
    component.ngOnInit();

    expect(document.body.classList.contains('layout-fixed')).toBeTrue();
    expect(document.body.classList.contains('sidebar-expand-lg')).toBeTrue();
    expect(document.body.classList.contains('sidebar-mini')).toBeTrue();
    expect(document.body.classList.contains('bg-body-tertiary')).toBeTrue();
  });

  it('ngOnInit fija snapshotStale en null si falla la consulta', () => {
    setup(true);
    adminService.getPublicCvSnapshotPending.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    component.ngOnInit();

    expect(component.snapshotStale).toBeNull();
  });

  it('ngAfterViewInit sincroniza el sidebar con el viewport', done => {
    setup();
    component.ngAfterViewInit();
    queueMicrotask(() => {
      expect(sidebarNav.syncWithViewport).toHaveBeenCalled();
      done();
    });
  });

  it('ngOnDestroy quita todas las clases de layout privado del body', () => {
    setup();
    component.ngOnInit();
    component.ngOnDestroy();

    expect(document.body.className.trim()).toBe('');
  });

  it('onSidebarOverlayClick cierra el drawer móvil', () => {
    setup();
    component.onSidebarOverlayClick();
    expect(sidebarNav.closeMobileDrawer).toHaveBeenCalled();
  });

  it('onWindowResize sincroniza el sidebar', () => {
    setup();
    component.onWindowResize();
    expect(sidebarNav.syncWithViewport).toHaveBeenCalled();
  });

  it('downloadSnapshot descarga el blob y notifica éxito', () => {
    setup();
    const blob = new Blob(['{}'], { type: 'application/json' });
    adminService.downloadPublicCvSnapshot.and.returnValue(of(blob));
    spyOn(URL, 'createObjectURL').and.returnValue('blob:mock');
    spyOn(URL, 'revokeObjectURL');
    const clickSpy = jasmine.createSpy('click');
    spyOn(document, 'createElement').and.returnValue({ click: clickSpy } as unknown as HTMLAnchorElement);

    component.downloadSnapshot();

    expect(component.snapshotDownloading).toBeFalse();
    expect(clickSpy).toHaveBeenCalled();
    expect(notificationService.success).toHaveBeenCalled();
  });

  it('downloadSnapshot notifica error si falla la descarga', () => {
    setup();
    adminService.downloadPublicCvSnapshot.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    component.downloadSnapshot();

    expect(component.snapshotDownloading).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('previewSnapshot abre el preview con el JSON recibido', () => {
    setup();
    adminService.previewPublicCvSnapshot.and.returnValue(of('{"a":1}'));

    component.previewSnapshot();

    expect(component.snapshotPreviewJson).toBe('{"a":1}');
    expect(component.snapshotPreviewOpen).toBeTrue();
    expect(component.snapshotPreviewing).toBeFalse();
  });

  it('previewSnapshot notifica error si falla la carga', () => {
    setup();
    adminService.previewPublicCvSnapshot.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    component.previewSnapshot();

    expect(component.snapshotPreviewing).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('closeSnapshotPreview cierra el preview', () => {
    setup();
    component.snapshotPreviewOpen = true;
    component.closeSnapshotPreview();
    expect(component.snapshotPreviewOpen).toBeFalse();
  });

  it('ackSnapshot marca el snapshot como al día y notifica éxito', () => {
    setup();
    adminService.acknowledgePublicCvSnapshot.and.returnValue(of(undefined));
    component.snapshotStale = true;

    component.ackSnapshot();

    expect(component.snapshotStale).toBeFalse();
    expect(component.snapshotAcking).toBeFalse();
    expect(notificationService.success).toHaveBeenCalled();
  });

  it('ackSnapshot notifica error si falla', () => {
    setup();
    adminService.acknowledgePublicCvSnapshot.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    component.ackSnapshot();

    expect(component.snapshotAcking).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });
});
