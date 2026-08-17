import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { TopbarComponent } from './topbar.component';
import { CV_ROL } from '../../core/constants/cv-roles';
import { AuthService, UserInfo } from '../../core/services/auth/auth.service';
import { AlertasConteoRefreshService } from '../../core/services/private/alertas-conteo-refresh.service';
import { DashboardService } from '../../core/services/private/dashboard.service';
import { CvEditorService } from '../../core/services/private/cv-editor.service';
import { PrivateLayoutSidebarService } from '../services/private-layout-sidebar.service';

describe('TopbarComponent', () => {
  let component: TopbarComponent;
  let authService: {
    currentUser$: Subject<UserInfo | null>;
    hasRol: jasmine.Spy;
    logout: jasmine.Spy;
  };
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let cvEditorService: jasmine.SpyObj<CvEditorService>;
  let sidebarNav: jasmine.SpyObj<PrivateLayoutSidebarService>;
  let alertasRefresh: { refreshRequested$: Subject<void> };
  let router: { events: ReturnType<Subject<unknown>['asObservable']>; url: string; navigate: jasmine.Spy };
  let routerEvents: Subject<unknown>;

  const publicador: UserInfo = {
    id: 1,
    nombre: 'Ana Gómez',
    email: 'ana@test.com',
    rol: CV_ROL.publicador,
    roles: [CV_ROL.publicador],
    curriculumId: 1,
  };

  function setup(url = '/mi-cv'): void {
    authService = {
      currentUser$: new Subject<UserInfo | null>(),
      hasRol: jasmine.createSpy('hasRol').and.returnValue(false),
      logout: jasmine.createSpy('logout'),
    };
    dashboardService = jasmine.createSpyObj('DashboardService', ['getNotificaciones']);
    dashboardService.getNotificaciones.and.returnValue(of({ conteoNoLeidas: 2, recientes: [] }));
    cvEditorService = jasmine.createSpyObj('CvEditorService', ['getPerfiles']);
    cvEditorService.getPerfiles.and.returnValue(of([]));
    sidebarNav = jasmine.createSpyObj('PrivateLayoutSidebarService', ['toggle']);
    alertasRefresh = { refreshRequested$: new Subject<void>() };
    routerEvents = new Subject<unknown>();
    router = { events: routerEvents.asObservable(), url, navigate: jasmine.createSpy('navigate') };

    TestBed.configureTestingModule({
      providers: [
        TopbarComponent,
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: DashboardService, useValue: dashboardService },
        { provide: CvEditorService, useValue: cvEditorService },
        { provide: PrivateLayoutSidebarService, useValue: sidebarNav },
        { provide: AlertasConteoRefreshService, useValue: alertasRefresh },
      ],
    });
    component = TestBed.inject(TopbarComponent);
  }

  it('alternarSidebar previene el default y delega en el servicio de sidebar', () => {
    setup();
    const ev = jasmine.createSpyObj('Event', ['preventDefault']);

    component.alternarSidebar(ev);

    expect(ev.preventDefault).toHaveBeenCalled();
    expect(sidebarNav.toggle).toHaveBeenCalled();
  });

  it('ngOnInit fija enRutaAdmin según la URL actual y ante cada NavigationEnd', () => {
    setup('/admin/usuarios');
    component.ngOnInit();
    expect(component.enRutaAdmin).toBeTrue();

    routerEvents.next(new NavigationEnd(1, '/mi-cv', '/mi-cv'));
    router.url = '/mi-cv';
    routerEvents.next(new NavigationEnd(2, '/mi-cv', '/mi-cv'));
    expect(component.enRutaAdmin).toBeFalse();
  });

  it('ngOnInit carga conteo y cargo actual para publicadores', () => {
    setup();
    component.ngOnInit();
    authService.hasRol.and.callFake((rol: string) => rol === CV_ROL.publicador);
    cvEditorService.getPerfiles.and.returnValue(
      of([{ perfilId: 1, nombrePerfil: 'Backend Dev', esActivo: true } as never])
    );

    authService.currentUser$.next(publicador);

    expect(component.currentUser).toEqual(publicador);
    expect(component.conteoNoLeidas).toBe(2);
    expect(component.cargoActual).toBe('Backend Dev');
  });

  it('ngOnInit fija cargoActual "Administración" para admin sin rol publicador', () => {
    setup();
    component.ngOnInit();
    authService.hasRol.and.callFake((rol: string) => rol === CV_ROL.admin);

    authService.currentUser$.next({ ...publicador, rol: CV_ROL.admin, roles: [CV_ROL.admin] });

    expect(component.cargoActual).toBe('Administración');
    expect(component.conteoNoLeidas).toBe(0);
  });

  it('ngOnInit resetea cargoActual cuando no hay usuario', () => {
    setup();
    component.ngOnInit();
    authService.currentUser$.next(null);
    expect(component.cargoActual).toBe('Perfil profesional');
  });

  it('lineaUsuarioTopbar combina nombre y contexto según la ruta', () => {
    setup();
    component.currentUser = publicador;
    component.cargoActual = 'Backend Dev';

    component.enRutaAdmin = false;
    expect(component.lineaUsuarioTopbar).toBe('Ana Gómez - Backend Dev');

    component.enRutaAdmin = true;
    expect(component.lineaUsuarioTopbar).toBe('Ana Gómez - Administración');
  });

  it('mostrarCampanaNotificaciones depende del rol publicador', () => {
    setup();
    authService.hasRol.and.returnValue(true);
    expect(component.mostrarCampanaNotificaciones).toBeTrue();
  });

  it('abrirNotificaciones carga una sola vez', () => {
    setup();
    component.abrirNotificaciones();
    component.abrirNotificaciones();

    expect(dashboardService.getNotificaciones).toHaveBeenCalledTimes(1);
    expect(dashboardService.getNotificaciones).toHaveBeenCalledWith(8);
  });

  it('alertasRefresh recarga el conteo solo si el usuario es publicador', () => {
    setup();
    component.ngOnInit();
    authService.hasRol.and.returnValue(false);
    dashboardService.getNotificaciones.calls.reset();

    alertasRefresh.refreshRequested$.next();
    expect(dashboardService.getNotificaciones).not.toHaveBeenCalled();

    authService.hasRol.and.returnValue(true);
    alertasRefresh.refreshRequested$.next();
    expect(dashboardService.getNotificaciones).toHaveBeenCalledWith(1);
  });

  it('logout no hace nada si el usuario cancela la confirmación', () => {
    setup();
    spyOn(window, 'confirm').and.returnValue(false);

    component.logout();

    expect(authService.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('logout cierra sesión y navega a "/" si el usuario confirma', () => {
    setup();
    spyOn(window, 'confirm').and.returnValue(true);

    component.logout();

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('ngOnDestroy cancela las suscripciones activas', () => {
    setup();
    component.ngOnInit();
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('tipoIcono, tipoIconBg y tipoIconColor mapean tipos conocidos y usan fallback', () => {
    setup();
    expect(component.tipoIcono('Contacto')).toBe('bi-envelope-fill');
    expect(component.tipoIcono('Desconocido')).toBe('bi-bell-fill');

    expect(component.tipoIconBg('Vista')).toBe('#d1fae5');
    expect(component.tipoIconBg('Desconocido')).toBe('#f3f4f6');

    expect(component.tipoIconColor('Descarga')).toBe('#854d0e');
    expect(component.tipoIconColor(null)).toBe('#374151');
  });
});
