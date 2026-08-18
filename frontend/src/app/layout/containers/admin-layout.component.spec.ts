import { Renderer2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AdminLayoutComponent } from './admin-layout.component';
import { PrivateLayoutSidebarService } from '../services/private-layout-sidebar.service';

describe('AdminLayoutComponent', () => {
  let component: AdminLayoutComponent;
  let sidebarNav: jasmine.SpyObj<PrivateLayoutSidebarService>;

  const rendererStub = {
    addClass: (el: HTMLElement, cls: string) => el.classList.add(cls),
    removeClass: (el: HTMLElement, cls: string) => el.classList.remove(cls),
  };

  function setup(): void {
    document.body.className = '';
    sidebarNav = jasmine.createSpyObj('PrivateLayoutSidebarService', ['syncWithViewport', 'closeMobileDrawer']);

    TestBed.configureTestingModule({
      providers: [
        AdminLayoutComponent,
        { provide: Renderer2, useValue: rendererStub },
        { provide: PrivateLayoutSidebarService, useValue: sidebarNav },
      ],
    });
    component = TestBed.inject(AdminLayoutComponent);
  }

  afterEach(() => {
    document.body.className = '';
  });

  it('ngOnInit agrega las clases de layout privado al body', () => {
    setup();
    component.ngOnInit();

    expect(document.body.classList.contains('layout-fixed')).toBeTrue();
    expect(document.body.classList.contains('sidebar-expand-lg')).toBeTrue();
    expect(document.body.classList.contains('sidebar-mini')).toBeTrue();
    expect(document.body.classList.contains('bg-body-tertiary')).toBeTrue();
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
});
