import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminRolesComponent } from './admin-roles.component';
import { AdminService, RolDto } from '../../../core/services/admin/admin.service';
import { NotificationService } from '../../../core/services/shared/notification.service';

describe('AdminRolesComponent', () => {
  let component: AdminRolesComponent;
  let adminService: jasmine.SpyObj<AdminService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const roles: RolDto[] = [
    { rolId: 3, nombreRol: 'Admin', descripcion: 'Acceso total' },
    { rolId: 1, nombreRol: 'Visitante', descripcion: null },
    { rolId: 2, nombreRol: 'Publicador', descripcion: 'Dueño del CV' },
  ];

  function setup(getRolesResult = of(roles)): void {
    adminService = jasmine.createSpyObj('AdminService', ['getRoles']);
    adminService.getRoles.and.returnValue(getRolesResult);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error']);

    TestBed.configureTestingModule({
      providers: [
        AdminRolesComponent,
        { provide: AdminService, useValue: adminService },
        { provide: NotificationService, useValue: notificationService },
      ],
    });
    component = TestBed.inject(AdminRolesComponent);
  }

  it('arranca en loading', () => {
    setup();
    expect(component.loading).toBeTrue();
  });

  it('ngOnInit carga los roles y detiene el loading', () => {
    setup();
    component.ngOnInit();

    expect(component.roles).toEqual(roles);
    expect(component.loading).toBeFalse();
  });

  it('ngOnInit notifica error y detiene el loading si el servicio falla', () => {
    setup(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('rolesOrdenados ordena por rolId ascendente', () => {
    setup();
    component.ngOnInit();

    expect(component.rolesOrdenados.map(r => r.rolId)).toEqual([1, 2, 3]);
  });

  it('limpiarBusquedaRoles vacía la búsqueda', () => {
    setup();
    component.busquedaRoles = 'admin';
    component.limpiarBusquedaRoles();
    expect(component.busquedaRoles).toBe('');
  });

  it('rolesFiltrados filtra por rol seleccionado', () => {
    setup();
    component.ngOnInit();
    component.filtroRol = 'Admin';

    expect(component.rolesFiltrados.map(r => r.nombreRol)).toEqual(['Admin']);
  });

  it('rolesFiltrados filtra por búsqueda en nombre, descripción o notas', () => {
    setup();
    component.ngOnInit();

    component.busquedaRoles = 'dueño';
    expect(component.rolesFiltrados.map(r => r.nombreRol)).toEqual(['Publicador']);

    component.busquedaRoles = 'sin sesión';
    expect(component.rolesFiltrados.map(r => r.nombreRol)).toEqual(['Visitante']);
  });

  it('textoNotasRol retorna la nota correspondiente a cada rol y vacío por defecto', () => {
    setup();
    expect(component.textoNotasRol({ rolId: 1, nombreRol: 'Visitante', descripcion: null }))
      .toContain('acceso público');
    expect(component.textoNotasRol({ rolId: 2, nombreRol: 'Publicador', descripcion: null }))
      .toContain('Dueño de CV');
    expect(component.textoNotasRol({ rolId: 3, nombreRol: 'Admin', descripcion: null }))
      .toContain('Usuarios, roles');
    expect(component.textoNotasRol({ rolId: 4, nombreRol: 'Otro', descripcion: null })).toBe('');
  });
});
