import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminAuditoriaComponent } from './admin-auditoria.component';
import {
  AdminService,
  AUDITORIA_PURGE_CONFIRMACION_VACIAR,
  AuditoriaAdminPageDto,
  AuditoriaAuthPageDto,
  AuditoriaCvPageDto,
} from '../../../core/services/admin/admin.service';
import { NotificationService } from '../../../core/services/shared/notification.service';

describe('AdminAuditoriaComponent', () => {
  let component: AdminAuditoriaComponent;
  let adminService: jasmine.SpyObj<AdminService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const pageAdminVacia: AuditoriaAdminPageDto = { items: [], total: 0, page: 1, pageSize: 10, totalPages: 1 };
  const pageCvVacia: AuditoriaCvPageDto = { items: [], total: 0, page: 1, pageSize: 10, totalPages: 1 };
  const pageAuthVacia: AuditoriaAuthPageDto = { items: [], total: 0, page: 1, pageSize: 10, totalPages: 1 };

  function setup(
    getAuditoriaResult = of(pageAdminVacia),
    getAuditoriaCvGlobalResult = of(pageCvVacia),
    getAuditoriaAuthResult = of(pageAuthVacia)
  ): void {
    adminService = jasmine.createSpyObj('AdminService', [
      'getAuditoria',
      'getAuditoriaCvGlobal',
      'getAuditoriaAuth',
      'purgeAuditoria',
    ]);
    adminService.getAuditoria.and.returnValue(getAuditoriaResult);
    adminService.getAuditoriaCvGlobal.and.returnValue(getAuditoriaCvGlobalResult);
    adminService.getAuditoriaAuth.and.returnValue(getAuditoriaAuthResult);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error']);

    TestBed.configureTestingModule({
      providers: [
        AdminAuditoriaComponent,
        { provide: AdminService, useValue: adminService },
        { provide: NotificationService, useValue: notificationService },
      ],
    });
    component = TestBed.inject(AdminAuditoriaComponent);
  }

  it('ngOnInit carga la pestaña admin y llena los años de purga', () => {
    setup();
    component.ngOnInit();

    expect(adminService.getAuditoria).toHaveBeenCalled();
    expect(component.admin.loading).toBeFalse();
    expect(component.aniosPurge.length).toBe(21);
  });

  it('ngOnInit notifica error y fija mensaje si falla la carga admin', () => {
    setup(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.admin.loading).toBeFalse();
    expect(component.admin.error).toBeTruthy();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('cambiarPestana a cv carga auditoría de CV solo la primera vez', () => {
    setup();
    component.ngOnInit();

    component.cambiarPestana('cv');

    expect(component.pestana).toBe('cv');
    expect(adminService.getAuditoriaCvGlobal).toHaveBeenCalled();
    expect(component.cv.loading).toBeFalse();
  });

  it('cambiarPestana notifica error si falla la carga de auditoría CV', () => {
    setup(of(pageAdminVacia), throwError(() => new Error('boom')));
    component.ngOnInit();

    component.cambiarPestana('cv');

    expect(component.cv.error).toBeTruthy();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('cambiarPestana a auth carga auditoría de autenticación', () => {
    setup();
    component.ngOnInit();

    component.cambiarPestana('auth');

    expect(component.pestana).toBe('auth');
    expect(adminService.getAuditoriaAuth).toHaveBeenCalled();
    expect(component.auth.loading).toBeFalse();
  });

  it('cambiarPestana notifica error si falla la carga de auditoría de autenticación', () => {
    setup(of(pageAdminVacia), of(pageCvVacia), throwError(() => new Error('boom')));
    component.ngOnInit();

    component.cambiarPestana('auth');

    expect(component.auth.error).toBeTruthy();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('cambiarPestana no hace nada si ya está en esa pestaña', () => {
    setup();
    component.ngOnInit();
    adminService.getAuditoria.calls.reset();

    component.cambiarPestana('admin');

    expect(adminService.getAuditoria).not.toHaveBeenCalled();
  });

  it('onCambioFiltrosAdmin reinicia la página y recarga', () => {
    setup();
    component.ngOnInit();
    component.admin.page = 3;

    component.onCambioFiltrosAdmin();

    expect(component.admin.page).toBe(1);
    expect(adminService.getAuditoria).toHaveBeenCalledTimes(2);
  });

  it('limpiarBusquedaAdmin vacía la búsqueda y recarga', () => {
    setup();
    component.ngOnInit();
    component.admin.busqueda = 'algo';

    component.limpiarBusquedaAdmin();

    expect(component.admin.busqueda).toBe('');
  });

  it('limpiarBusquedaCv vacía la búsqueda y recarga', () => {
    setup();
    component.ngOnInit();
    component.cambiarPestana('cv');
    component.cv.busqueda = 'algo';

    component.limpiarBusquedaCv();

    expect(component.cv.busqueda).toBe('');
  });

  it('admin.hayFiltros y cv.hayFiltros detectan filtro o búsqueda activos', () => {
    setup();
    component.ngOnInit();

    expect(component.admin.hayFiltros).toBeFalse();
    component.admin.filtroAccion = 'crear';
    expect(component.admin.hayFiltros).toBeTrue();

    expect(component.cv.hayFiltros).toBeFalse();
    component.cv.busqueda = 'algo';
    expect(component.cv.hayFiltros).toBeTrue();
  });

  it('admin.rangoTexto y cv.rangoTexto describen el rango mostrado', () => {
    setup(
      of({ items: [], total: 25, page: 2, pageSize: 10, totalPages: 3 }),
      of({ items: [], total: 5, page: 1, pageSize: 10, totalPages: 1 })
    );
    component.ngOnInit();
    component.cambiarPestana('cv');

    expect(component.admin.rangoTexto).toBe('Mostrando 11–20 de 25');
    expect(component.cv.rangoTexto).toBe('Mostrando 1–5 de 5');
  });

  it('admin.rangoTexto es vacío cuando no hay resultados', () => {
    setup();
    component.ngOnInit();
    expect(component.admin.rangoTexto).toBe('');
  });

  it('irPaginaAdmin e irPaginaCv acotan la página solicitada a [1, totalPages] antes de recargar', () => {
    setup(
      of({ items: [], total: 30, page: 1, pageSize: 10, totalPages: 3 }),
      of({ items: [], total: 30, page: 1, pageSize: 10, totalPages: 3 })
    );
    component.ngOnInit();
    component.cambiarPestana('cv');
    adminService.getAuditoria.calls.reset();
    adminService.getAuditoriaCvGlobal.calls.reset();

    component.irPaginaAdmin(99);
    expect(adminService.getAuditoria).toHaveBeenCalledWith(3, jasmine.anything(), jasmine.anything(), jasmine.anything());

    component.irPaginaCv(-1);
    expect(adminService.getAuditoriaCvGlobal).toHaveBeenCalledWith(1, jasmine.anything(), jasmine.anything(), jasmine.anything());
  });

  it('abrirModalMantenimientoAdmin cierra el modal de cv y muestra el de admin', () => {
    setup();
    component.ngOnInit();
    component.cv.modalMantenimiento = true;

    component.abrirModalMantenimientoAdmin();

    expect(component.admin.modalMantenimiento).toBeTrue();
    expect(component.cv.modalMantenimiento).toBeFalse();
  });

  it('abrirModalMantenimientoCv cierra el modal de admin y muestra el de cv', () => {
    setup();
    component.ngOnInit();
    component.admin.modalMantenimiento = true;

    component.abrirModalMantenimientoCv();

    expect(component.cv.modalMantenimiento).toBeTrue();
    expect(component.admin.modalMantenimiento).toBeFalse();
  });

  it('cerrarModalMantenimientoAdminSiBackdrop cierra solo si el click fue en el backdrop', () => {
    setup();
    component.ngOnInit();
    component.abrirModalMantenimientoAdmin();

    const target = {} as EventTarget;
    component.cerrarModalMantenimientoAdminSiBackdrop({ target, currentTarget: target } as unknown as MouseEvent);
    expect(component.admin.modalMantenimiento).toBeFalse();
  });

  it('cerrarModalMantenimientoAdminSiBackdrop no cierra si el click fue dentro del panel', () => {
    setup();
    component.ngOnInit();
    component.abrirModalMantenimientoAdmin();

    component.cerrarModalMantenimientoAdminSiBackdrop({ target: {}, currentTarget: {} } as unknown as MouseEvent);
    expect(component.admin.modalMantenimiento).toBeTrue();
  });

  it('onEscapeCerrarModalMantenimiento cierra el modal abierto', () => {
    setup();
    component.ngOnInit();
    component.abrirModalMantenimientoAdmin();

    component.onEscapeCerrarModalMantenimiento();

    expect(component.admin.modalMantenimiento).toBeFalse();
  });

  it('admin.canVaciarCompleto y cv.canVaciarCompleto exigen la frase exacta', () => {
    setup();
    component.admin.confirmVaciar = 'algo mal';
    expect(component.admin.canVaciarCompleto).toBeFalse();

    component.admin.confirmVaciar = AUDITORIA_PURGE_CONFIRMACION_VACIAR;
    expect(component.admin.canVaciarCompleto).toBeTrue();
  });

  it('purgeAdmin cancela si el usuario no confirma el diálogo nativo', () => {
    setup();
    component.ngOnInit();
    spyOn(globalThis, 'confirm').and.returnValue(false);

    component.purgeAdmin('anio');

    expect(adminService.purgeAuditoria).not.toHaveBeenCalled();
  });

  it('purgeAdmin modo "todo" exige la frase de confirmación exacta', () => {
    setup();
    component.ngOnInit();
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.admin.confirmVaciar = 'incorrecta';

    component.purgeAdmin('todo');

    expect(component.admin.showConfirmError).toBeTrue();
    expect(adminService.purgeAuditoria).not.toHaveBeenCalled();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('purgeAdmin ejecuta la purga y recarga en éxito', () => {
    setup();
    component.ngOnInit();
    spyOn(globalThis, 'confirm').and.returnValue(true);
    adminService.purgeAuditoria.and.returnValue(of({ eliminados: 4 }));
    component.abrirModalMantenimientoAdmin();

    component.purgeAdmin('anio');

    expect(adminService.purgeAuditoria).toHaveBeenCalledWith(
      jasmine.objectContaining({ tabla: 'admin', modo: 'anio' })
    );
    expect(component.admin.purging).toBeFalse();
    expect(component.admin.modalMantenimiento).toBeFalse();
    expect(notificationService.success).toHaveBeenCalled();
  });

  it('purgeAdmin notifica el mensaje de error del backend al fallar', () => {
    setup();
    component.ngOnInit();
    spyOn(globalThis, 'confirm').and.returnValue(true);
    adminService.purgeAuditoria.and.returnValue(throwError(() => ({ error: { message: 'no autorizado' } })));

    component.purgeAdmin('anio');

    expect(component.admin.purging).toBeFalse();
    expect(notificationService.error).toHaveBeenCalledWith('no autorizado');
  });

  it('purgeCv ejecuta la purga y recarga en éxito', () => {
    setup();
    component.ngOnInit();
    component.cambiarPestana('cv');
    spyOn(globalThis, 'confirm').and.returnValue(true);
    adminService.purgeAuditoria.and.returnValue(of({ eliminados: 2 }));

    component.purgeCv('anioMes');

    expect(adminService.purgeAuditoria).toHaveBeenCalledWith(
      jasmine.objectContaining({ tabla: 'cv', modo: 'anioMes' })
    );
    expect(component.cv.purging).toBeFalse();
    expect(notificationService.success).toHaveBeenCalled();
  });

  it('purgeAuth ejecuta la purga y recarga en éxito', () => {
    setup();
    component.ngOnInit();
    component.cambiarPestana('auth');
    spyOn(globalThis, 'confirm').and.returnValue(true);
    adminService.purgeAuditoria.and.returnValue(of({ eliminados: 7 }));
    component.auth.confirmVaciar = AUDITORIA_PURGE_CONFIRMACION_VACIAR;

    component.purgeAuth('todo');

    expect(component.auth.showConfirmError).toBeFalse();
    expect(adminService.purgeAuditoria).toHaveBeenCalledWith(
      jasmine.objectContaining({ tabla: 'auth', modo: 'todo' })
    );
    expect(notificationService.success).toHaveBeenCalled();
  });

  it('purgeAuth modo "todo" exige la frase de confirmación exacta', () => {
    setup();
    component.ngOnInit();
    component.cambiarPestana('auth');
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.auth.confirmVaciar = 'incorrecta';

    component.purgeAuth('todo');

    expect(component.auth.showConfirmError).toBeTrue();
    expect(adminService.purgeAuditoria).not.toHaveBeenCalled();
  });

  it('purgeAuth modo "anio" ejecuta la purga con la tabla "auth"', () => {
    setup();
    component.ngOnInit();
    component.cambiarPestana('auth');
    spyOn(globalThis, 'confirm').and.returnValue(true);
    adminService.purgeAuditoria.and.returnValue(of({ eliminados: 3 }));

    component.purgeAuth('anio');

    expect(adminService.purgeAuditoria).toHaveBeenCalledWith(
      jasmine.objectContaining({ tabla: 'auth', modo: 'anio' })
    );
    expect(component.auth.purging).toBeFalse();
    expect(notificationService.success).toHaveBeenCalled();
  });

  it('abrirModalMantenimientoAuth cierra los otros modales y muestra el de auth', () => {
    setup();
    component.ngOnInit();
    component.admin.modalMantenimiento = true;

    component.abrirModalMantenimientoAuth();

    expect(component.auth.modalMantenimiento).toBeTrue();
    expect(component.admin.modalMantenimiento).toBeFalse();
  });

  it('cerrarModalMantenimientoAuthSiBackdrop cierra solo si el click fue en el backdrop', () => {
    setup();
    component.ngOnInit();
    component.abrirModalMantenimientoAuth();

    const target = {} as EventTarget;
    component.cerrarModalMantenimientoAuthSiBackdrop({ target, currentTarget: target } as unknown as MouseEvent);
    expect(component.auth.modalMantenimiento).toBeFalse();
  });

  it('auth.hayFiltros detecta filtro o búsqueda activos', () => {
    setup();
    component.ngOnInit();

    expect(component.auth.hayFiltros).toBeFalse();
    component.auth.busqueda = 'algo';
    expect(component.auth.hayFiltros).toBeTrue();
  });

  it('onCambioFiltrosAuth reinicia la página y recarga', () => {
    setup();
    component.ngOnInit();
    component.cambiarPestana('auth');
    component.auth.page = 3;

    component.onCambioFiltrosAuth();

    expect(component.auth.page).toBe(1);
    expect(adminService.getAuditoriaAuth).toHaveBeenCalledTimes(2);
  });

  it('limpiarBusquedaAuth vacía la búsqueda y recarga', () => {
    setup();
    component.ngOnInit();
    component.cambiarPestana('auth');
    component.auth.busqueda = 'algo';

    component.limpiarBusquedaAuth();

    expect(component.auth.busqueda).toBe('');
  });

  it('auth.rangoTexto describe el rango mostrado', () => {
    setup(of(pageAdminVacia), of(pageCvVacia), of({ items: [], total: 15, page: 1, pageSize: 10, totalPages: 2 }));
    component.ngOnInit();
    component.cambiarPestana('auth');

    expect(component.auth.rangoTexto).toBe('Mostrando 1–10 de 15');
  });

  it('irPaginaAuth acota la página solicitada a [1, totalPages] antes de recargar', () => {
    setup(of(pageAdminVacia), of(pageCvVacia), of({ items: [], total: 30, page: 1, pageSize: 10, totalPages: 3 }));
    component.ngOnInit();
    component.cambiarPestana('auth');
    adminService.getAuditoriaAuth.calls.reset();

    component.irPaginaAuth(99);

    expect(adminService.getAuditoriaAuth).toHaveBeenCalledWith(3, jasmine.anything(), jasmine.anything(), jasmine.anything());
  });

  it('auth.canVaciarCompleto exige la frase exacta', () => {
    setup();
    component.auth.confirmVaciar = 'algo mal';
    expect(component.auth.canVaciarCompleto).toBeFalse();

    component.auth.confirmVaciar = AUDITORIA_PURGE_CONFIRMACION_VACIAR;
    expect(component.auth.canVaciarCompleto).toBeTrue();
  });

  it('limpiarConfirmVaciarAuth y onConfirmVaciarAuthChange limpian el error de confirmación', () => {
    setup();
    component.auth.confirmVaciar = 'algo';
    component.auth.showConfirmError = true;

    component.onConfirmVaciarAuthChange();
    expect(component.auth.showConfirmError).toBeFalse();

    component.auth.showConfirmError = true;
    component.limpiarConfirmVaciarAuth();
    expect(component.auth.confirmVaciar).toBe('');
    expect(component.auth.showConfirmError).toBeFalse();
  });

  it('purgeAuth cancela si el usuario no confirma el diálogo nativo', () => {
    setup();
    component.ngOnInit();
    spyOn(globalThis, 'confirm').and.returnValue(false);

    component.purgeAuth('anio');

    expect(adminService.purgeAuditoria).not.toHaveBeenCalled();
  });

  it('purgeAuth notifica el mensaje de error del backend al fallar', () => {
    setup();
    component.ngOnInit();
    spyOn(globalThis, 'confirm').and.returnValue(true);
    adminService.purgeAuditoria.and.returnValue(throwError(() => ({ error: { message: 'no autorizado' } })));

    component.purgeAuth('anio');

    expect(component.auth.purging).toBeFalse();
    expect(notificationService.error).toHaveBeenCalledWith('no autorizado');
  });

  it('onEscapeCerrarModalMantenimiento cierra el modal de auth abierto', () => {
    setup();
    component.ngOnInit();
    component.abrirModalMantenimientoAuth();

    component.onEscapeCerrarModalMantenimiento();

    expect(component.auth.modalMantenimiento).toBeFalse();
  });

  it('etiquetaAccionAdmin, etiquetaAccionCv y etiquetaAccionAuth resuelven etiquetas legibles', () => {
    setup();
    expect(component.etiquetaAccionAdmin('desconocida')).toBe('desconocida');
    expect(component.etiquetaAccionCv('desconocida')).toBe('desconocida');
    expect(component.etiquetaAccionAuth('auth.login_exitoso')).toBe('Login exitoso');
  });

  it('detalleLegible parsea JSON como pares clave: valor y trunca texto plano largo', () => {
    setup();
    expect(component.detalleLegible(null)).toBe('—');
    expect(component.detalleLegible('{"campo":"valor"}')).toBe('campo: valor');
    const largo = 'x'.repeat(150);
    expect(component.detalleLegible(largo)).toBe(largo.slice(0, 117) + '…');
  });
});
