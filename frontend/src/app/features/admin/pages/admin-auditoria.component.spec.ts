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
    expect(component.loadingAdmin).toBeFalse();
    expect(component.aniosPurge.length).toBe(21);
  });

  it('ngOnInit notifica error y fija mensaje si falla la carga admin', () => {
    setup(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.loadingAdmin).toBeFalse();
    expect(component.errorAdmin).toBeTruthy();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('cambiarPestana a cv carga auditoría de CV solo la primera vez', () => {
    setup();
    component.ngOnInit();

    component.cambiarPestana('cv');

    expect(component.pestana).toBe('cv');
    expect(adminService.getAuditoriaCvGlobal).toHaveBeenCalled();
    expect(component.loadingCv).toBeFalse();
  });

  it('cambiarPestana notifica error si falla la carga de auditoría CV', () => {
    setup(of(pageAdminVacia), throwError(() => new Error('boom')));
    component.ngOnInit();

    component.cambiarPestana('cv');

    expect(component.errorCv).toBeTruthy();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('cambiarPestana a auth carga auditoría de autenticación', () => {
    setup();
    component.ngOnInit();

    component.cambiarPestana('auth');

    expect(component.pestana).toBe('auth');
    expect(adminService.getAuditoriaAuth).toHaveBeenCalled();
    expect(component.loadingAuth).toBeFalse();
  });

  it('cambiarPestana notifica error si falla la carga de auditoría de autenticación', () => {
    setup(of(pageAdminVacia), of(pageCvVacia), throwError(() => new Error('boom')));
    component.ngOnInit();

    component.cambiarPestana('auth');

    expect(component.errorAuth).toBeTruthy();
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
    component.pageAdmin = 3;

    component.onCambioFiltrosAdmin();

    expect(component.pageAdmin).toBe(1);
    expect(adminService.getAuditoria).toHaveBeenCalledTimes(2);
  });

  it('limpiarBusquedaAdmin vacía la búsqueda y recarga', () => {
    setup();
    component.ngOnInit();
    component.busquedaAdmin = 'algo';

    component.limpiarBusquedaAdmin();

    expect(component.busquedaAdmin).toBe('');
  });

  it('limpiarBusquedaCv vacía la búsqueda y recarga', () => {
    setup();
    component.ngOnInit();
    component.cambiarPestana('cv');
    component.busquedaCv = 'algo';

    component.limpiarBusquedaCv();

    expect(component.busquedaCv).toBe('');
  });

  it('hayFiltrosAdmin y hayFiltrosCv detectan filtro o búsqueda activos', () => {
    setup();
    component.ngOnInit();

    expect(component.hayFiltrosAdmin).toBeFalse();
    component.filtroAccionAdmin = 'crear';
    expect(component.hayFiltrosAdmin).toBeTrue();

    expect(component.hayFiltrosCv).toBeFalse();
    component.busquedaCv = 'algo';
    expect(component.hayFiltrosCv).toBeTrue();
  });

  it('rangoTextoAdmin y rangoTextoCv describen el rango mostrado', () => {
    setup(
      of({ items: [], total: 25, page: 2, pageSize: 10, totalPages: 3 }),
      of({ items: [], total: 5, page: 1, pageSize: 10, totalPages: 1 })
    );
    component.ngOnInit();
    component.cambiarPestana('cv');

    expect(component.rangoTextoAdmin).toBe('Mostrando 11–20 de 25');
    expect(component.rangoTextoCv).toBe('Mostrando 1–5 de 5');
  });

  it('rangoTextoAdmin es vacío cuando no hay resultados', () => {
    setup();
    component.ngOnInit();
    expect(component.rangoTextoAdmin).toBe('');
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
    component.modalMantenimientoCv = true;

    component.abrirModalMantenimientoAdmin();

    expect(component.modalMantenimientoAdmin).toBeTrue();
    expect(component.modalMantenimientoCv).toBeFalse();
  });

  it('abrirModalMantenimientoCv cierra el modal de admin y muestra el de cv', () => {
    setup();
    component.ngOnInit();
    component.modalMantenimientoAdmin = true;

    component.abrirModalMantenimientoCv();

    expect(component.modalMantenimientoCv).toBeTrue();
    expect(component.modalMantenimientoAdmin).toBeFalse();
  });

  it('cerrarModalMantenimientoAdminSiBackdrop cierra solo si el click fue en el backdrop', () => {
    setup();
    component.ngOnInit();
    component.abrirModalMantenimientoAdmin();

    const target = {} as EventTarget;
    component.cerrarModalMantenimientoAdminSiBackdrop({ target, currentTarget: target } as unknown as MouseEvent);
    expect(component.modalMantenimientoAdmin).toBeFalse();
  });

  it('cerrarModalMantenimientoAdminSiBackdrop no cierra si el click fue dentro del panel', () => {
    setup();
    component.ngOnInit();
    component.abrirModalMantenimientoAdmin();

    component.cerrarModalMantenimientoAdminSiBackdrop({ target: {}, currentTarget: {} } as unknown as MouseEvent);
    expect(component.modalMantenimientoAdmin).toBeTrue();
  });

  it('onEscapeCerrarModalMantenimiento cierra el modal abierto', () => {
    setup();
    component.ngOnInit();
    component.abrirModalMantenimientoAdmin();

    component.onEscapeCerrarModalMantenimiento();

    expect(component.modalMantenimientoAdmin).toBeFalse();
  });

  it('canVaciarAdminCompleto y canVaciarCvCompleto exigen la frase exacta', () => {
    setup();
    component.confirmVaciarAdmin = 'algo mal';
    expect(component.canVaciarAdminCompleto).toBeFalse();

    component.confirmVaciarAdmin = AUDITORIA_PURGE_CONFIRMACION_VACIAR;
    expect(component.canVaciarAdminCompleto).toBeTrue();
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
    component.confirmVaciarAdmin = 'incorrecta';

    component.purgeAdmin('todo');

    expect(component.showConfirmErrorAdmin).toBeTrue();
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
    expect(component.purgingAdmin).toBeFalse();
    expect(component.modalMantenimientoAdmin).toBeFalse();
    expect(notificationService.success).toHaveBeenCalled();
  });

  it('purgeAdmin notifica el mensaje de error del backend al fallar', () => {
    setup();
    component.ngOnInit();
    spyOn(globalThis, 'confirm').and.returnValue(true);
    adminService.purgeAuditoria.and.returnValue(throwError(() => ({ error: { message: 'no autorizado' } })));

    component.purgeAdmin('anio');

    expect(component.purgingAdmin).toBeFalse();
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
    expect(component.purgingCv).toBeFalse();
    expect(notificationService.success).toHaveBeenCalled();
  });

  it('purgeAuth ejecuta la purga y recarga en éxito', () => {
    setup();
    component.ngOnInit();
    component.cambiarPestana('auth');
    spyOn(globalThis, 'confirm').and.returnValue(true);
    adminService.purgeAuditoria.and.returnValue(of({ eliminados: 7 }));
    component.confirmVaciarAuth = AUDITORIA_PURGE_CONFIRMACION_VACIAR;

    component.purgeAuth('todo');

    expect(component.showConfirmErrorAuth).toBeFalse();
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
    component.confirmVaciarAuth = 'incorrecta';

    component.purgeAuth('todo');

    expect(component.showConfirmErrorAuth).toBeTrue();
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
    expect(component.purgingAuth).toBeFalse();
    expect(notificationService.success).toHaveBeenCalled();
  });

  it('abrirModalMantenimientoAuth cierra los otros modales y muestra el de auth', () => {
    setup();
    component.ngOnInit();
    component.modalMantenimientoAdmin = true;

    component.abrirModalMantenimientoAuth();

    expect(component.modalMantenimientoAuth).toBeTrue();
    expect(component.modalMantenimientoAdmin).toBeFalse();
  });

  it('cerrarModalMantenimientoAuthSiBackdrop cierra solo si el click fue en el backdrop', () => {
    setup();
    component.ngOnInit();
    component.abrirModalMantenimientoAuth();

    const target = {} as EventTarget;
    component.cerrarModalMantenimientoAuthSiBackdrop({ target, currentTarget: target } as unknown as MouseEvent);
    expect(component.modalMantenimientoAuth).toBeFalse();
  });

  it('hayFiltrosAuth detecta filtro o búsqueda activos', () => {
    setup();
    component.ngOnInit();

    expect(component.hayFiltrosAuth).toBeFalse();
    component.busquedaAuth = 'algo';
    expect(component.hayFiltrosAuth).toBeTrue();
  });

  it('onCambioFiltrosAuth reinicia la página y recarga', () => {
    setup();
    component.ngOnInit();
    component.cambiarPestana('auth');
    component.pageAuth = 3;

    component.onCambioFiltrosAuth();

    expect(component.pageAuth).toBe(1);
    expect(adminService.getAuditoriaAuth).toHaveBeenCalledTimes(2);
  });

  it('limpiarBusquedaAuth vacía la búsqueda y recarga', () => {
    setup();
    component.ngOnInit();
    component.cambiarPestana('auth');
    component.busquedaAuth = 'algo';

    component.limpiarBusquedaAuth();

    expect(component.busquedaAuth).toBe('');
  });

  it('rangoTextoAuth describe el rango mostrado', () => {
    setup(of(pageAdminVacia), of(pageCvVacia), of({ items: [], total: 15, page: 1, pageSize: 10, totalPages: 2 }));
    component.ngOnInit();
    component.cambiarPestana('auth');

    expect(component.rangoTextoAuth).toBe('Mostrando 1–10 de 15');
  });

  it('irPaginaAuth acota la página solicitada a [1, totalPages] antes de recargar', () => {
    setup(of(pageAdminVacia), of(pageCvVacia), of({ items: [], total: 30, page: 1, pageSize: 10, totalPages: 3 }));
    component.ngOnInit();
    component.cambiarPestana('auth');
    adminService.getAuditoriaAuth.calls.reset();

    component.irPaginaAuth(99);

    expect(adminService.getAuditoriaAuth).toHaveBeenCalledWith(3, jasmine.anything(), jasmine.anything(), jasmine.anything());
  });

  it('canVaciarAuthCompleto exige la frase exacta', () => {
    setup();
    component.confirmVaciarAuth = 'algo mal';
    expect(component.canVaciarAuthCompleto).toBeFalse();

    component.confirmVaciarAuth = AUDITORIA_PURGE_CONFIRMACION_VACIAR;
    expect(component.canVaciarAuthCompleto).toBeTrue();
  });

  it('limpiarConfirmVaciarAuth y onConfirmVaciarAuthChange limpian el error de confirmación', () => {
    setup();
    component.confirmVaciarAuth = 'algo';
    component.showConfirmErrorAuth = true;

    component.onConfirmVaciarAuthChange();
    expect(component.showConfirmErrorAuth).toBeFalse();

    component.showConfirmErrorAuth = true;
    component.limpiarConfirmVaciarAuth();
    expect(component.confirmVaciarAuth).toBe('');
    expect(component.showConfirmErrorAuth).toBeFalse();
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

    expect(component.purgingAuth).toBeFalse();
    expect(notificationService.error).toHaveBeenCalledWith('no autorizado');
  });

  it('onEscapeCerrarModalMantenimiento cierra el modal de auth abierto', () => {
    setup();
    component.ngOnInit();
    component.abrirModalMantenimientoAuth();

    component.onEscapeCerrarModalMantenimiento();

    expect(component.modalMantenimientoAuth).toBeFalse();
  });

  it('etiquetaAccionAdmin, etiquetaAccionCv y etiquetaAccionAuth resuelven etiquetas legibles', () => {
    setup();
    expect(component.etiquetaAccionAdmin('desconocida')).toBe('desconocida');
    expect(component.etiquetaAccionCv('desconocida')).toBe('desconocida');
    expect(component.etiquetaAccionAuth('auth.login_exitoso')).toBe('Login exitoso');
  });

  it('fmtFecha formatea a "yyyy-mm-dd hh:mm:ss" y maneja vacíos/inválidos', () => {
    setup();
    expect(component.fmtFecha('2026-03-05T10:30:00Z')).toBe('2026-03-05 10:30:00');
    expect(component.fmtFecha('')).toBe('—');
    expect(component.fmtFecha('no-es-fecha')).toBe('no-es-fecha');
  });

  it('detalleLegible parsea JSON como pares clave: valor y trunca texto plano largo', () => {
    setup();
    expect(component.detalleLegible(null)).toBe('—');
    expect(component.detalleLegible('{"campo":"valor"}')).toBe('campo: valor');
    const largo = 'x'.repeat(150);
    expect(component.detalleLegible(largo)).toBe(largo.slice(0, 117) + '…');
  });
});
