import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminPanelComponent } from './admin-panel.component';
import { AdminService, RolDto, UsuarioAdminDto } from '../../../core/services/admin/admin.service';
import { NotificationService } from '../../../core/services/shared/notification.service';

describe('AdminPanelComponent', () => {
  let component: AdminPanelComponent;
  let adminService: jasmine.SpyObj<AdminService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const roles: RolDto[] = [
    { rolId: 1, nombreRol: 'Visitante', descripcion: null },
    { rolId: 2, nombreRol: 'Publicador', descripcion: 'Dueño del CV' },
    { rolId: 3, nombreRol: 'Admin', descripcion: 'Acceso total' },
  ];

  function usuario(over: Partial<UsuarioAdminDto> = {}): UsuarioAdminDto {
    return {
      usuarioId: 1,
      email: 'ana@test.com',
      estado: 'Activo',
      fechaRegistro: '2026-01-15T00:00:00Z',
      cvPublicado: false,
      roles: [],
      ...over,
    };
  }

  function setup(
    getUsuariosResult = of([usuario()]),
    getRolesResult = of(roles)
  ): void {
    adminService = jasmine.createSpyObj('AdminService', [
      'getUsuarios',
      'getRoles',
      'setEstado',
      'setCvPublicacion',
      'asignarRol',
      'quitarRol',
    ]);
    adminService.getUsuarios.and.returnValue(getUsuariosResult);
    adminService.getRoles.and.returnValue(getRolesResult);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error']);

    TestBed.configureTestingModule({
      providers: [
        AdminPanelComponent,
        { provide: AdminService, useValue: adminService },
        { provide: NotificationService, useValue: notificationService },
      ],
    });
    component = TestBed.inject(AdminPanelComponent);
  }

  it('arranca en loading', () => {
    setup();
    expect(component.loading).toBeTrue();
  });

  it('ngOnInit carga usuarios y roles', () => {
    setup();
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.usuarios.length).toBe(1);
    expect(component.todoRoles).toEqual(roles);
  });

  it('ngOnInit notifica error si falla la carga de usuarios', () => {
    setup(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('ngOnInit notifica error si falla la carga de roles', () => {
    setup(of([usuario()]), throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(notificationService.error).toHaveBeenCalled();
  });

  it('normaliza cvPublicado desde el alias PascalCase del backend', () => {
    const raw = usuario({ cvPublicado: undefined as unknown as boolean }) as UsuarioAdminDto & { CvPublicado?: boolean };
    raw.CvPublicado = true;
    setup(of([raw]));
    component.ngOnInit();

    expect(component.usuarios[0].cvPublicado).toBeTrue();
  });

  it('calcula métricas rápidas', () => {
    setup(
      of([
        usuario({ usuarioId: 1, estado: 'Activo', cvPublicado: true, roles: [roles[0]] }),
        usuario({ usuarioId: 2, estado: 'Inactivo', cvPublicado: false, roles: [] }),
      ])
    );
    component.ngOnInit();

    expect(component.totalUsuarios).toBe(2);
    expect(component.totalActivos).toBe(1);
    expect(component.totalCvPublicados).toBe(1);
    expect(component.totalUsuariosConRoles).toBe(1);
  });

  it('usuariosFiltrados filtra por email y estado', () => {
    setup(
      of([
        usuario({ usuarioId: 1, email: 'ana@test.com', estado: 'Activo' }),
        usuario({ usuarioId: 2, email: 'beto@test.com', estado: 'Inactivo' }),
      ])
    );
    component.ngOnInit();

    component.busqueda = 'ana';
    expect(component.usuariosFiltrados.map(u => u.usuarioId)).toEqual([1]);

    component.busqueda = '';
    component.filtroEstado = 'Inactivo';
    expect(component.usuariosFiltrados.map(u => u.usuarioId)).toEqual([2]);
  });

  it('onFiltrosChanged reinicia a la página 1', () => {
    setup();
    component.ngOnInit();
    component.paginaActual = 3;

    component.onFiltrosChanged();

    expect(component.paginaActual).toBe(1);
  });

  it('limpiarBusquedaUsuarios vacía la búsqueda y reaplica filtros', () => {
    setup();
    component.ngOnInit();
    component.busqueda = 'ana';
    component.paginaActual = 2;

    component.limpiarBusquedaUsuarios();

    expect(component.busqueda).toBe('');
    expect(component.paginaActual).toBe(1);
  });

  it('irPagina respeta los límites [1, totalPaginas]', () => {
    const usuarios = Array.from({ length: 25 }, (_, i) => usuario({ usuarioId: i + 1, email: `u${i}@test.com` }));
    setup(of(usuarios));
    component.ngOnInit();

    expect(component.totalPaginas).toBe(3);

    component.irPagina(99);
    expect(component.paginaActual).toBe(3);

    component.irPagina(-5);
    expect(component.paginaActual).toBe(1);
  });

  it('rolesParaAsignar excluye el rol Visitante', () => {
    setup();
    component.ngOnInit();

    expect(component.rolesParaAsignar.map(r => r.nombreRol)).toEqual(['Publicador', 'Admin']);
  });

  it('tieneRol detecta si el usuario tiene un rolId asignado', () => {
    setup();
    const u = usuario({ roles: [roles[1]] });

    expect(component.tieneRol(u, 2)).toBeTrue();
    expect(component.tieneRol(u, 3)).toBeFalse();
  });

  it('toggleEstado activa/desactiva y notifica éxito', () => {
    setup();
    component.ngOnInit();
    const u = component.usuarios[0];
    adminService.setEstado.and.returnValue(of({ usuarioId: u.usuarioId, estado: 'Inactivo' }));

    component.toggleEstado(u);

    expect(adminService.setEstado).toHaveBeenCalledWith(u.usuarioId, false);
    expect(u.estado).toBe('Inactivo');
    expect(notificationService.success).toHaveBeenCalled();
  });

  it('toggleEstado notifica error si el servicio falla', () => {
    setup();
    component.ngOnInit();
    const u = component.usuarios[0];
    adminService.setEstado.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' }))
    );

    component.toggleEstado(u);

    expect(notificationService.error).toHaveBeenCalled();
  });

  it('toggleCvPublicacion pide confirmación al despublicar y respeta cancelación', () => {
    setup(of([usuario({ cvPublicado: true })]));
    component.ngOnInit();
    const u = component.usuarios[0];
    spyOn(globalThis, 'confirm').and.returnValue(false);

    component.toggleCvPublicacion(u);

    expect(adminService.setCvPublicacion).not.toHaveBeenCalled();
  });

  it('toggleCvPublicacion publica sin pedir confirmación', () => {
    setup(of([usuario({ cvPublicado: false })]));
    component.ngOnInit();
    const u = component.usuarios[0];
    adminService.setCvPublicacion.and.returnValue(of({ usuarioId: u.usuarioId, cvPublicado: true }));

    component.toggleCvPublicacion(u);

    expect(adminService.setCvPublicacion).toHaveBeenCalledWith(u.usuarioId, true);
    expect(u.cvPublicado).toBeTrue();
    expect(notificationService.success).toHaveBeenCalled();
  });

  it('abrirRoles y cerrarRoles gestionan el usuario seleccionado y el error', () => {
    setup();
    component.ngOnInit();
    const u = component.usuarios[0];
    component.rolesError = 'previo';

    component.abrirRoles(u);
    expect(component.usuarioSeleccionado).toBe(u);
    expect(component.rolesError).toBeNull();

    component.cerrarRoles();
    expect(component.usuarioSeleccionado).toBeNull();
  });

  it('toggleRol asigna un rol nuevo', () => {
    setup();
    component.ngOnInit();
    const u = component.usuarios[0];
    adminService.asignarRol.and.returnValue(of(undefined));

    component.toggleRol(u, roles[2]);

    expect(adminService.asignarRol).toHaveBeenCalledWith(u.usuarioId, 3);
    expect(u.roles).toContain(roles[2]);
    expect(component.rolesGuardando).toBeFalse();
  });

  it('toggleRol quita un rol existente', () => {
    setup(of([usuario({ roles: [roles[2]] })]));
    component.ngOnInit();
    const u = component.usuarios[0];
    adminService.quitarRol.and.returnValue(of(undefined));

    component.toggleRol(u, roles[2]);

    expect(adminService.quitarRol).toHaveBeenCalledWith(u.usuarioId, 3);
    expect(u.roles).toEqual([]);
  });

  it('toggleRol registra el error al fallar la asignación', () => {
    setup();
    component.ngOnInit();
    const u = component.usuarios[0];
    adminService.asignarRol.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 400, statusText: 'Bad Request' }))
    );

    component.toggleRol(u, roles[2]);

    expect(component.rolesError).toBeTruthy();
    expect(component.rolesGuardando).toBeFalse();
  });

  it('fmtFecha formatea a dd/mm/yyyy y maneja valores vacíos o inválidos', () => {
    setup();
    expect(component.fmtFecha('2026-03-05T12:00:00Z')).toBe('05/03/2026');
    expect(component.fmtFecha('')).toBe('—');
    expect(component.fmtFecha('no-es-fecha')).toBe('no-es-fecha');
  });
});
