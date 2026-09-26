import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { SidebarComponent } from './sidebar.component';
import { CV_ROL } from '../../core/constants/cv-roles';
import { AuthService, UserInfo } from '../../core/services/auth/auth.service';
import { AlertasConteoRefreshService } from '../../core/services/private/alertas-conteo-refresh.service';
import { CvEditorService, PersonalesDto } from '../../core/services/private/cv-editor.service';
import { DashboardService } from '../../core/services/private/dashboard.service';
import { PersonalesFotoRefreshService } from '../../core/services/private/personales-foto-refresh.service';

function personalesFixture(fotoUrl: string | null): PersonalesDto {
  return {
    personalesId: 1, curriculumId: 1, tipoIdentificacion: null, numeroDocumento: null,
    fechaExpedicion: null, lugarExpedicion: null, libretaMilitarNumero: null, libretaMilitarClase: null,
    pasaporteNumero: null, pasaporteVigencia: null, visaNumero: null, visaVigencia: null, visaClase: null,
    primerNombre: 'Ana', segundoNombre: null, primerApellido: 'Gómez', segundoApellido: null,
    fechaNacimiento: null, lugarNacimiento: null, genero: null, nacionalidad: null, tipoSangre: null,
    eps: null, pencion: null, cesantias: null, email: null, celular: null, telefonoFijo: null,
    pais: null, departamento: null, ciudad: null, barrio: null, codigoPostal: null, direccion: null,
    tipoResidencia: null, fotoUrl,
  };
}

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let authService: {
    currentUser$: Subject<UserInfo | null>;
    hasRol: jasmine.Spy;
  };
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let cvEditorService: jasmine.SpyObj<CvEditorService>;
  let routerEvents: Subject<unknown>;
  let alertasRefresh: { refreshRequested$: Subject<void> };
  let fotoRefresh: { refreshRequested$: Subject<void> };

  const publicador: UserInfo = {
    id: 1,
    nombre: 'Ana Gómez',
    email: 'ana@test.com',
    rol: CV_ROL.publicador,
    roles: [CV_ROL.publicador],
    curriculumId: 1,
  };

  function setup(): void {
    authService = {
      currentUser$: new Subject<UserInfo | null>(),
      hasRol: jasmine.createSpy('hasRol').and.returnValue(false),
    };
    dashboardService = jasmine.createSpyObj('DashboardService', ['getNotificaciones']);
    dashboardService.getNotificaciones.and.returnValue(of({ conteoNoLeidas: 3, recientes: [] }));
    cvEditorService = jasmine.createSpyObj('CvEditorService', ['getPersonales']);
    cvEditorService.getPersonales.and.returnValue(of(personalesFixture('/api/cv/personales/foto')));
    routerEvents = new Subject<unknown>();
    alertasRefresh = { refreshRequested$: new Subject<void>() };
    fotoRefresh = { refreshRequested$: new Subject<void>() };

    TestBed.configureTestingModule({
      providers: [
        SidebarComponent,
        { provide: AuthService, useValue: authService },
        { provide: DashboardService, useValue: dashboardService },
        { provide: CvEditorService, useValue: cvEditorService },
        { provide: Router, useValue: { events: routerEvents.asObservable() } },
        { provide: AlertasConteoRefreshService, useValue: alertasRefresh },
        { provide: PersonalesFotoRefreshService, useValue: fotoRefresh },
      ],
    });
    component = TestBed.inject(SidebarComponent);
  }

  it('mostrarMenuPublicador y mostrarMenuAdmin reflejan los roles del usuario', () => {
    setup();
    authService.hasRol.and.callFake((rol: string) => rol === CV_ROL.publicador);

    expect(component.mostrarMenuPublicador).toBeTrue();
    expect(component.mostrarMenuAdmin).toBeFalse();
  });

  it('marcaInicio apunta a /dashboard para publicadores y /admin/usuarios para solo-admin', () => {
    setup();
    authService.hasRol.and.callFake((rol: string) => rol === CV_ROL.publicador);
    expect(component.marcaInicio).toBe('/dashboard');

    authService.hasRol.and.callFake((rol: string) => rol === CV_ROL.admin);
    expect(component.marcaInicio).toBe('/admin/usuarios');
  });

  it('initials retorna "U" sin usuario y las iniciales del nombre con usuario', () => {
    setup();
    expect(component.initials).toBe('U');

    component.currentUser = publicador;
    expect(component.initials).toBe('AG');
  });

  it('ngOnInit carga el conteo de alertas y la foto para publicadores al recibir el usuario', () => {
    setup();
    component.ngOnInit();

    authService.hasRol.and.returnValue(true);
    authService.currentUser$.next(publicador);

    expect(component.currentUser).toEqual(publicador);
    expect(dashboardService.getNotificaciones).toHaveBeenCalledWith(1);
    expect(component.conteoAlertasNoLeidas).toBe(3);
    expect(cvEditorService.getPersonales).toHaveBeenCalled();
    expect(component.fotoUrl).toBe('/api/cv/personales/foto');
  });

  it('ngOnInit resetea el conteo y la foto cuando el usuario no es publicador', () => {
    setup();
    component.ngOnInit();
    component.conteoAlertasNoLeidas = 5;
    component.fotoUrl = '/api/cv/personales/foto';

    authService.hasRol.and.returnValue(false);
    authService.currentUser$.next(null);

    expect(component.conteoAlertasNoLeidas).toBe(0);
    expect(component.fotoUrl).toBeNull();
  });

  it('ngOnInit refresca la foto cuando PersonalesFotoRefreshService lo solicita', () => {
    setup();
    component.ngOnInit();
    authService.hasRol.and.returnValue(true);
    authService.currentUser$.next(publicador);
    cvEditorService.getPersonales.calls.reset();
    cvEditorService.getPersonales.and.returnValue(of(personalesFixture(null)));

    fotoRefresh.refreshRequested$.next();

    expect(cvEditorService.getPersonales).toHaveBeenCalled();
    expect(component.fotoUrl).toBeNull();
  });

  it('la foto queda en null si falla la carga de Personales', () => {
    setup();
    cvEditorService.getPersonales.and.returnValue(throwError(() => new Error('boom')));
    component.ngOnInit();

    authService.hasRol.and.returnValue(true);
    authService.currentUser$.next(publicador);

    expect(component.fotoUrl).toBeNull();
  });

  it('ngOnInit refresca el conteo tras un NavigationEnd si el usuario es publicador', () => {
    setup();
    component.ngOnInit();
    authService.hasRol.and.returnValue(true);
    authService.currentUser$.next(publicador);
    dashboardService.getNotificaciones.calls.reset();

    routerEvents.next(new NavigationEnd(1, '/mi-cv', '/mi-cv'));

    expect(dashboardService.getNotificaciones).toHaveBeenCalledWith(1);
  });

  it('ngOnInit refresca el conteo cuando AlertasConteoRefreshService lo solicita', () => {
    setup();
    component.ngOnInit();
    authService.hasRol.and.returnValue(true);
    authService.currentUser$.next(publicador);
    dashboardService.getNotificaciones.calls.reset();

    alertasRefresh.refreshRequested$.next();

    expect(dashboardService.getNotificaciones).toHaveBeenCalledWith(1);
  });
});
