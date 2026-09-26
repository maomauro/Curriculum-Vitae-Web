import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminProveedoresIaComponent } from './admin-proveedores-ia.component';
import { ProveedorIaService, ProveedorIaDto } from '../../../core/services/admin/proveedor-ia.service';
import { NotificationService } from '../../../core/services/shared/notification.service';

describe('AdminProveedoresIaComponent', () => {
  let component: AdminProveedoresIaComponent;
  let proveedorIaService: jasmine.SpyObj<ProveedorIaService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  function proveedorIaItem(over: Partial<ProveedorIaDto> = {}): ProveedorIaDto {
    return {
      proveedorIaId: 1,
      proveedor: 'claude',
      nombre: null,
      modelo: 'claude-opus-4-20250514',
      endpoint: null,
      esActivo: true,
      fechaActualizacion: '2026-08-19T00:00:00Z',
      ...over,
    };
  }

  function setup(getConfigsResult = of<ProveedorIaDto[]>([])): void {
    proveedorIaService = jasmine.createSpyObj('ProveedorIaService', [
      'getConfigs', 'crearConfig', 'actualizarConfig', 'eliminarConfig', 'activarConfig', 'probarConexion',
      'probarConexionGuardada',
    ]);
    proveedorIaService.getConfigs.and.returnValue(getConfigsResult);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      providers: [
        AdminProveedoresIaComponent,
        { provide: ProveedorIaService, useValue: proveedorIaService },
        { provide: NotificationService, useValue: notificationService },
      ],
    });
    component = TestBed.inject(AdminProveedoresIaComponent);
  }

  it('arranca en loading', () => {
    setup();
    expect(component.loading).toBeTrue();
  });

  describe('ngOnInit', () => {
    it('sin conexiones guardadas, deja la lista vacia', () => {
      setup(of([]));
      component.ngOnInit();

      expect(component.loading).toBeFalse();
      expect(component.proveedoresIa).toEqual([]);
    });

    it('con conexiones guardadas, las carga', () => {
      setup(of([proveedorIaItem(), proveedorIaItem({ proveedorIaId: 2, proveedor: 'openai', esActivo: false })]));
      component.ngOnInit();

      expect(component.proveedoresIa.length).toBe(2);
    });

    it('notifica error si falla la carga', () => {
      setup(throwError(() => new Error('boom')));
      component.ngOnInit();

      expect(component.loading).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  it('onProveedorChange sugiere el modelo por defecto si el campo esta vacio', () => {
    setup();
    component.form.proveedor = 'openai';
    component.form.modelo = '';

    component.onProveedorChange();

    expect(component.form.modelo).toBe('gpt-4.1');
  });

  it('onProveedorChange no pisa un modelo ya escrito por el usuario', () => {
    setup();
    component.form.proveedor = 'claude';
    component.form.modelo = 'modelo-custom';

    component.onProveedorChange();

    expect(component.form.modelo).toBe('modelo-custom');
  });

  it('requiereEndpoint es true solo para ollama', () => {
    setup();
    component.form.proveedor = 'ollama';
    expect(component.requiereEndpoint).toBeTrue();
    component.form.proveedor = 'claude';
    expect(component.requiereEndpoint).toBeFalse();
  });

  it('requiereApiKey es false para ollama y otro, true para el resto', () => {
    setup();
    component.form.proveedor = 'ollama';
    expect(component.requiereApiKey).toBeFalse();
    component.form.proveedor = 'otro';
    expect(component.requiereApiKey).toBeFalse();
    component.form.proveedor = 'gemini';
    expect(component.requiereApiKey).toBeTrue();
  });

  it('abrirNuevaConexion limpia el formulario y lo muestra', () => {
    setup();
    component.editandoId = 5;
    component.form.nombre = 'algo viejo';

    component.abrirNuevaConexion();

    expect(component.editandoId).toBeNull();
    expect(component.form.nombre).toBe('');
    expect(component.mostrarForm).toBeTrue();
  });

  it('editarConexion precarga el formulario sin la clave', () => {
    setup();
    const item = proveedorIaItem({ nombre: 'Cuenta de la plataforma', endpoint: null });

    component.editarConexion(item);

    expect(component.editandoId).toBe(item.proveedorIaId);
    expect(component.form).toEqual({
      proveedor: 'claude', nombre: 'Cuenta de la plataforma', modelo: 'claude-opus-4-20250514', endpoint: '', apiKey: '',
    });
    expect(component.mostrarForm).toBeTrue();
  });

  it('cancelarForm oculta el formulario', () => {
    setup();
    component.mostrarForm = true;

    component.cancelarForm();

    expect(component.mostrarForm).toBeFalse();
  });

  describe('probarConexion', () => {
    it('avisa si el proveedor requiere endpoint y falta', () => {
      setup();
      component.form.proveedor = 'ollama';
      component.form.endpoint = '';

      component.probarConexion();

      expect(notificationService.warning).toHaveBeenCalled();
      expect(proveedorIaService.probarConexion).not.toHaveBeenCalled();
    });

    it('exitosa muestra el mensaje del backend', () => {
      setup();
      component.form.apiKey = 'sk-ant-test';
      proveedorIaService.probarConexion.and.returnValue(of({ ok: true, mensaje: 'Conexión exitosa.' }));

      component.probarConexion();

      expect(component.probandoConexion).toBeFalse();
      expect(component.resultadoPrueba).toBe('ok');
      expect(component.mensajePrueba).toBe('Conexión exitosa.');
    });

    it('con Ok=false muestra el error del backend', () => {
      setup();
      component.form.apiKey = 'sk-ant-test';
      proveedorIaService.probarConexion.and.returnValue(of({ ok: false, mensaje: 'La clave de API no es válida.' }));

      component.probarConexion();

      expect(component.resultadoPrueba).toBe('error');
      expect(component.mensajePrueba).toBe('La clave de API no es válida.');
    });

    it('notifica error si la peticion falla', () => {
      setup();
      component.form.apiKey = 'sk-ant-test';
      proveedorIaService.probarConexion.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      component.probarConexion();

      expect(component.probandoConexion).toBeFalse();
      expect(component.resultadoPrueba).toBe('error');
      expect(component.mensajePrueba).toBeTruthy();
    });
  });

  describe('guardarConexion', () => {
    it('avisa si el proveedor requiere endpoint y falta', () => {
      setup();
      component.form.proveedor = 'ollama';
      component.form.endpoint = '';

      component.guardarConexion();

      expect(notificationService.warning).toHaveBeenCalled();
      expect(proveedorIaService.crearConfig).not.toHaveBeenCalled();
    });

    it('al crear, avisa si falta la clave de API para un proveedor que la requiere', () => {
      setup();
      component.form = { proveedor: 'claude', nombre: '', modelo: '', endpoint: '', apiKey: '' };

      component.guardarConexion();

      expect(notificationService.warning).toHaveBeenCalled();
      expect(proveedorIaService.crearConfig).not.toHaveBeenCalled();
    });

    it('crea una conexion nueva y recarga la lista', () => {
      setup();
      component.form = { proveedor: 'claude', nombre: 'Cuenta A', modelo: 'claude-opus-4', endpoint: '', apiKey: 'sk-ant-test' };
      proveedorIaService.crearConfig.and.returnValue(of(proveedorIaItem()));
      proveedorIaService.getConfigs.and.returnValue(of([proveedorIaItem()]));

      component.guardarConexion();

      expect(proveedorIaService.crearConfig).toHaveBeenCalledWith({
        proveedor: 'claude', nombre: 'Cuenta A', modelo: 'claude-opus-4', endpoint: null, apiKey: 'sk-ant-test',
      });
      expect(component.guardando).toBeFalse();
      expect(component.mostrarForm).toBeFalse();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('al editar, no exige la clave de API (se mantiene la anterior si se deja en blanco)', () => {
      setup();
      component.editandoId = 7;
      component.form = { proveedor: 'claude', nombre: '', modelo: '', endpoint: '', apiKey: '' };
      proveedorIaService.actualizarConfig.and.returnValue(of(proveedorIaItem()));

      component.guardarConexion();

      expect(proveedorIaService.actualizarConfig).toHaveBeenCalledWith(7, jasmine.objectContaining({ apiKey: null }));
      expect(notificationService.warning).not.toHaveBeenCalled();
    });

    it('notifica error si el backend rechaza la solicitud', () => {
      setup();
      component.form = { proveedor: 'claude', nombre: '', modelo: '', endpoint: '', apiKey: 'sk-ant-test' };
      proveedorIaService.crearConfig.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400 })));

      component.guardarConexion();

      expect(component.guardando).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('activarConexion', () => {
    it('no hace nada si ya esta activa', () => {
      setup();
      component.activarConexion(proveedorIaItem({ esActivo: true }));
      expect(proveedorIaService.activarConfig).not.toHaveBeenCalled();
    });

    it('activa y recarga la lista', () => {
      setup();
      proveedorIaService.activarConfig.and.returnValue(of(proveedorIaItem({ esActivo: true })));

      component.activarConexion(proveedorIaItem({ proveedorIaId: 2, esActivo: false }));

      expect(proveedorIaService.activarConfig).toHaveBeenCalledWith(2);
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('notifica error si falla', () => {
      setup();
      proveedorIaService.activarConfig.and.returnValue(throwError(() => new Error('boom')));

      component.activarConexion(proveedorIaItem({ esActivo: false }));

      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('probarConexionGuardada', () => {
    it('prueba una conexion guardada y notifica exito si responde ok', () => {
      setup();
      proveedorIaService.probarConexionGuardada.and.returnValue(of({ ok: true, mensaje: 'Conexión exitosa.' }));

      component.probarConexionGuardada(proveedorIaItem({ proveedorIaId: 2 }));

      expect(proveedorIaService.probarConexionGuardada).toHaveBeenCalledWith(2);
      expect(notificationService.success).toHaveBeenCalledWith('Conexión exitosa.');
      expect(component.probandoGuardadaId).toBeNull();
    });

    it('notifica warning si el backend responde ok:false', () => {
      setup();
      proveedorIaService.probarConexionGuardada.and.returnValue(of({ ok: false, mensaje: 'La clave de API no es válida.' }));

      component.probarConexionGuardada(proveedorIaItem());

      expect(notificationService.warning).toHaveBeenCalledWith('La clave de API no es válida.');
    });

    it('notifica error si la solicitud falla', () => {
      setup();
      proveedorIaService.probarConexionGuardada.and.returnValue(throwError(() => new Error('boom')));

      component.probarConexionGuardada(proveedorIaItem());

      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('eliminarConexion', () => {
    it('no hace nada si se cancela la confirmacion', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(false);

      component.eliminarConexion(proveedorIaItem());

      expect(proveedorIaService.eliminarConfig).not.toHaveBeenCalled();
    });

    it('elimina y recarga la lista si se confirma y el backend responde bien', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      proveedorIaService.eliminarConfig.and.returnValue(of(undefined));

      component.eliminarConexion(proveedorIaItem());

      expect(notificationService.success).toHaveBeenCalled();
    });

    it('notifica error si el backend falla', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      proveedorIaService.eliminarConfig.and.returnValue(throwError(() => new Error('boom')));

      component.eliminarConexion(proveedorIaItem());

      expect(notificationService.error).toHaveBeenCalled();
    });
  });
});
