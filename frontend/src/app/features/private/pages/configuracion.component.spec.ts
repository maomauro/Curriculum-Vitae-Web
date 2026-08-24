import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfiguracionComponent } from './configuracion.component';
import {
  CvEditorService,
  ExperienciaDto,
  FormacionDto,
  HabilidadDto,
  PresentacionCvDto,
  ProyectoDto,
  VisibilidadSeccionDto,
} from '../../../core/services/private/cv-editor.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ProveedorIaService, ProveedorIaDto } from '../../../core/services/private/proveedor-ia.service';
import { ConfiguracionCorreoService, ConfiguracionCorreoDto } from '../../../core/services/private/configuracion-correo.service';
import { NotificationService } from '../../../core/services/shared/notification.service';

describe('ConfiguracionComponent', () => {
  let component: ConfiguracionComponent;
  let cvEditorService: jasmine.SpyObj<CvEditorService>;
  let authService: jasmine.SpyObj<AuthService>;
  let proveedorIaService: jasmine.SpyObj<ProveedorIaService>;
  let configuracionCorreoService: jasmine.SpyObj<ConfiguracionCorreoService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const presentacion: PresentacionCvDto = {
    plantillaCodigo: 'clasico', experienciaLaboralMesesAcumulados: 0, urlPublica: 'ana-cv', publicado: true,
  };

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

  function configuracionCorreoDto(over: Partial<ConfiguracionCorreoDto> = {}): ConfiguracionCorreoDto {
    return {
      configuracionCorreoId: 0,
      host: 'smtp.gmail.com',
      puerto: 587,
      usarTls: true,
      tieneConfiguracion: false,
      fechaActualizacion: null,
      ...over,
    };
  }

  function setup(
    presentacionResult = of(presentacion),
    visibilidadResult = of<VisibilidadSeccionDto[]>([]),
    proveedorIaResult = of<ProveedorIaDto[]>([]),
    configuracionCorreoResult = of(configuracionCorreoDto()),
  ): void {
    cvEditorService = jasmine.createSpyObj('CvEditorService', [
      'getPresentacion', 'getVisibilidad', 'updateVisibilidad', 'updateCurriculumPublicacion',
      'getExperiencias', 'getFormaciones', 'getProyectos', 'getHabilidades',
      'updateExperienciaVisibilidad', 'updateFormacionVisibilidad', 'updateProyectoVisibilidad',
      'updateHabilidadVisibilidad',
    ]);
    cvEditorService.getPresentacion.and.returnValue(presentacionResult);
    cvEditorService.getVisibilidad.and.returnValue(visibilidadResult);
    cvEditorService.getExperiencias.and.returnValue(of([]));
    cvEditorService.getFormaciones.and.returnValue(of([]));
    cvEditorService.getProyectos.and.returnValue(of([]));
    cvEditorService.getHabilidades.and.returnValue(of([]));
    authService = jasmine.createSpyObj('AuthService', ['changePassword']);
    proveedorIaService = jasmine.createSpyObj('ProveedorIaService', [
      'getConfigs', 'crearConfig', 'actualizarConfig', 'eliminarConfig', 'activarConfig', 'probarConexion',
      'probarConexionGuardada',
    ]);
    proveedorIaService.getConfigs.and.returnValue(proveedorIaResult);
    configuracionCorreoService = jasmine.createSpyObj('ConfiguracionCorreoService', ['getConfig', 'guardarConfig']);
    configuracionCorreoService.getConfig.and.returnValue(configuracionCorreoResult);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      providers: [
        ConfiguracionComponent,
        { provide: CvEditorService, useValue: cvEditorService },
        { provide: AuthService, useValue: authService },
        { provide: ProveedorIaService, useValue: proveedorIaService },
        { provide: ConfiguracionCorreoService, useValue: configuracionCorreoService },
        { provide: NotificationService, useValue: notificationService },
      ],
    });
    component = TestBed.inject(ConfiguracionComponent);
  }

  function itemByKey(key: string) {
    const pestana = component.pestanasPublicasCv.find(i => i.key === key);
    if (pestana) return pestana;
    for (const g of component.visibilidadGrupos) {
      const item = g.items.find(i => i.key === key);
      if (item) return item;
    }
    throw new Error(`No se encontro el item ${key}`);
  }

  describe('getters de validacion de contraseña', () => {
    it('repetirContrasenaMismatchEnVivo es false mientras el campo repetir esta vacio', () => {
      setup();
      component.passwordNueva = 'abc';
      component.passwordNueva2 = '';
      expect(component.repetirContrasenaMismatchEnVivo).toBeFalse();
    });

    it('repetirContrasenaMismatchEnVivo es true si no coinciden', () => {
      setup();
      component.passwordNueva = 'abcdefgh';
      component.passwordNueva2 = 'distinta1';
      expect(component.repetirContrasenaMismatchEnVivo).toBeTrue();
    });

    it('contrasenasNuevasCoincidenOk exige >=8 caracteres e igualdad', () => {
      setup();
      component.passwordNueva = 'short';
      component.passwordNueva2 = 'short';
      expect(component.contrasenasNuevasCoincidenOk).toBeFalse();

      component.passwordNueva = 'password1';
      component.passwordNueva2 = 'password1';
      expect(component.contrasenasNuevasCoincidenOk).toBeTrue();
    });

    it('nuevaContrasenaMuyCorta es true solo si hay contenido y es menor a 8', () => {
      setup();
      component.passwordNueva = '';
      expect(component.nuevaContrasenaMuyCorta).toBeFalse();

      component.passwordNueva = 'abc';
      expect(component.nuevaContrasenaMuyCorta).toBeTrue();

      component.passwordNueva = 'abcdefgh';
      expect(component.nuevaContrasenaMuyCorta).toBeFalse();
    });
  });

  describe('interruptorVisibilidadDeshabilitado', () => {
    it('los interruptores de metricas/graficas dependen del maestro dashboard.publico', () => {
      setup();
      const maestro = itemByKey('dashboard.publico');
      const metricas = itemByKey('dashboard.metricas');
      maestro.visible = false;

      expect(component.interruptorVisibilidadDeshabilitado(metricas)).toBeTrue();

      maestro.visible = true;
      expect(component.interruptorVisibilidadDeshabilitado(metricas)).toBeFalse();
    });

    it('los demas interruptores nunca se deshabilitan por esta regla', () => {
      setup();
      expect(component.interruptorVisibilidadDeshabilitado(itemByKey('datos-personales'))).toBeFalse();
    });
  });

  it('toggleVisGrupo alterna el acordeon', () => {
    setup();
    const grupo = component.visibilidadGrupos[0];
    expect(grupo.accordionOpen).toBeFalse();

    component.toggleVisGrupo(grupo);
    expect(grupo.accordionOpen).toBeTrue();
  });

  describe('ngOnInit', () => {
    it('carga la presentacion y arma la url publica del CV', () => {
      setup();
      component.ngOnInit();

      expect(component.urlCvCargando).toBeFalse();
      expect(component.cvPublicado).toBeTrue();
      expect(component.presentacionLista).toBeTrue();
      expect(component.urlCv).toContain('/cv/ana-cv');
    });

    it('si falla la presentacion, deja el estado en no listo sin url', () => {
      setup(throwError(() => new Error('boom')));
      component.ngOnInit();

      expect(component.urlCvCargando).toBeFalse();
      expect(component.presentacionLista).toBeFalse();
      expect(component.urlCv).toBe('');
    });

    it('aplica la visibilidad guardada a los items correspondientes', () => {
      setup(of(presentacion), of([
        { seccion: 'datos-personales.email', visible: false },
      ]));
      component.ngOnInit();

      const datosPersonales = itemByKey('datos-personales');
      expect(datosPersonales.atributos.find(a => a.key === 'datos-personales.email')?.visible).toBeFalse();
    });

    it('las secciones sinSwitchSeccion siempre quedan visibles', () => {
      setup(of(presentacion), of([{ seccion: 'datos-personales', visible: false }]));
      component.ngOnInit();

      expect(itemByKey('datos-personales').visible).toBeTrue();
    });

    it('notifica error si falla la carga de visibilidad', () => {
      setup(of(presentacion), throwError(() => new Error('boom')));
      component.ngOnInit();

      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('onToggleSeccion', () => {
    it('al desactivar una seccion, apaga tambien todos sus atributos y guarda', () => {
      setup();
      cvEditorService.updateVisibilidad.and.returnValue(of([]));
      const metricas = itemByKey('dashboard.metricas');
      metricas.visible = false;

      component.onToggleSeccion(metricas);

      expect(metricas.atributos.every(a => !a.visible)).toBeTrue();
      expect(cvEditorService.updateVisibilidad).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('notifica error si falla el guardado', () => {
      setup();
      cvEditorService.updateVisibilidad.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      const metricas = itemByKey('dashboard.metricas');

      component.onToggleSeccion(metricas);

      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('onToggleAtributo', () => {
    it('activar un atributo enciende la seccion si estaba apagada', () => {
      setup();
      cvEditorService.updateVisibilidad.and.returnValue(of([]));
      const item = {
        key: 'test-item', label: 'Test', icon: '', iconStyle: '', visible: false,
        atributos: [{ key: 'test-item.attr', label: 'Attr', visible: true }],
      };

      component.onToggleAtributo(item, item.atributos[0]);

      expect(item.visible).toBeTrue();
    });

    it('si ningun atributo queda visible, apaga la seccion', () => {
      setup();
      cvEditorService.updateVisibilidad.and.returnValue(of([]));
      const item = {
        key: 'test-item', label: 'Test', icon: '', iconStyle: '', visible: true,
        atributos: [{ key: 'test-item.attr', label: 'Attr', visible: false }],
      };

      component.onToggleAtributo(item, item.atributos[0]);

      expect(item.visible).toBeFalse();
    });

    it('para secciones sinSwitchSeccion, siempre queda visible=true', () => {
      setup();
      cvEditorService.updateVisibilidad.and.returnValue(of([]));
      const datosPersonales = itemByKey('datos-personales');

      component.onToggleAtributo(datosPersonales, datosPersonales.atributos[0]);

      expect(datosPersonales.visible).toBeTrue();
    });
  });

  describe('copiarUrl', () => {
    it('no hace nada si no hay url', () => {
      setup();
      component.urlCv = '';
      spyOn(navigator.clipboard, 'writeText');

      component.copiarUrl();

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });

    it('copia la url, marca "copiado" y lo apaga a los 2s', fakeAsync(() => {
      setup();
      component.urlCv = 'https://example.com/cv/ana';
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());

      component.copiarUrl();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/cv/ana');
      expect(component.copiado).toBeTrue();

      tick(2000);
      expect(component.copiado).toBeFalse();
    }));
  });

  describe('onCvPublicacionClick', () => {
    function clickEvent(): MouseEvent {
      return { preventDefault: jasmine.createSpy('preventDefault') } as unknown as MouseEvent;
    }

    it('si la presentacion no esta lista, solo previene el default sin hacer nada mas', () => {
      setup();
      const ev = clickEvent();

      component.onCvPublicacionClick(ev);

      expect(ev.preventDefault).toHaveBeenCalled();
      expect(cvEditorService.updateCurriculumPublicacion).not.toHaveBeenCalled();
    });

    it('si se cancela la confirmacion, no cambia nada', () => {
      setup();
      component.ngOnInit();
      spyOn(window, 'confirm').and.returnValue(false);

      component.onCvPublicacionClick(clickEvent());

      expect(cvEditorService.updateCurriculumPublicacion).not.toHaveBeenCalled();
    });

    it('si se confirma, actualiza de forma optimista y notifica exito', () => {
      setup();
      component.ngOnInit();
      spyOn(window, 'confirm').and.returnValue(true);
      cvEditorService.updateCurriculumPublicacion.and.returnValue(of({ ...presentacion, publicado: false }));

      component.onCvPublicacionClick(clickEvent());

      expect(cvEditorService.updateCurriculumPublicacion).toHaveBeenCalledWith(false);
      expect(component.cvPublicado).toBeFalse();
      expect(component.guardandoPublicacion).toBeFalse();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('si falla el backend, revierte el estado optimista y notifica error', () => {
      setup();
      component.ngOnInit();
      spyOn(window, 'confirm').and.returnValue(true);
      cvEditorService.updateCurriculumPublicacion.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );

      component.onCvPublicacionClick(clickEvent());

      expect(component.cvPublicado).toBeTrue();
      expect(component.guardandoPublicacion).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('actualizarContrasena', () => {
    it('avisa si falta la contraseña actual', () => {
      setup();
      component.passwordActual = '';

      component.actualizarContrasena();

      expect(notificationService.warning).toHaveBeenCalled();
      expect(authService.changePassword).not.toHaveBeenCalled();
    });

    it('avisa si falta la nueva contraseña', () => {
      setup();
      component.passwordActual = 'actual123';
      component.passwordNueva = '';

      component.actualizarContrasena();

      expect(notificationService.warning).toHaveBeenCalled();
      expect(authService.changePassword).not.toHaveBeenCalled();
    });

    it('avisa si la nueva contraseña es muy corta', () => {
      setup();
      component.passwordActual = 'actual123';
      component.passwordNueva = 'abc';
      component.passwordNueva2 = 'abc';

      component.actualizarContrasena();

      expect(notificationService.warning).toHaveBeenCalled();
      expect(authService.changePassword).not.toHaveBeenCalled();
    });

    it('avisa si las nuevas no coinciden', () => {
      setup();
      component.passwordActual = 'actual123';
      component.passwordNueva = 'password1';
      component.passwordNueva2 = 'password2';

      component.actualizarContrasena();

      expect(notificationService.warning).toHaveBeenCalled();
      expect(authService.changePassword).not.toHaveBeenCalled();
    });

    it('actualiza la contraseña, limpia los campos y notifica exito', () => {
      setup();
      authService.changePassword.and.returnValue(of({ message: '' }));
      component.passwordActual = 'actual123';
      component.passwordNueva = 'password1';
      component.passwordNueva2 = 'password1';

      component.actualizarContrasena();

      expect(authService.changePassword).toHaveBeenCalledWith('actual123', 'password1');
      expect(component.passwordActual).toBe('');
      expect(component.passwordNueva).toBe('');
      expect(component.passwordNueva2).toBe('');
      expect(component.guardandoContrasena).toBeFalse();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('notifica error si falla el backend', () => {
      setup();
      authService.changePassword.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 400 }))
      );
      component.passwordActual = 'actual123';
      component.passwordNueva = 'password1';
      component.passwordNueva2 = 'password1';

      component.actualizarContrasena();

      expect(component.guardandoContrasena).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('proveedor de IA', () => {
    it('onProveedorIaChange sugiere el modelo por defecto si el campo esta vacio', () => {
      setup();
      component.proveedorIaForm.proveedor = 'openai';
      component.proveedorIaForm.modelo = '';

      component.onProveedorIaChange();

      expect(component.proveedorIaForm.modelo).toBe('gpt-4.1');
    });

    it('onProveedorIaChange no pisa un modelo ya escrito por el usuario', () => {
      setup();
      component.proveedorIaForm.proveedor = 'claude';
      component.proveedorIaForm.modelo = 'modelo-custom';

      component.onProveedorIaChange();

      expect(component.proveedorIaForm.modelo).toBe('modelo-custom');
    });

    it('requiereEndpointIa es true solo para ollama', () => {
      setup();
      component.proveedorIaForm.proveedor = 'ollama';
      expect(component.requiereEndpointIa).toBeTrue();
      component.proveedorIaForm.proveedor = 'claude';
      expect(component.requiereEndpointIa).toBeFalse();
    });

    it('requiereApiKeyIa es false para ollama y otro, true para el resto', () => {
      setup();
      component.proveedorIaForm.proveedor = 'ollama';
      expect(component.requiereApiKeyIa).toBeFalse();
      component.proveedorIaForm.proveedor = 'otro';
      expect(component.requiereApiKeyIa).toBeFalse();
      component.proveedorIaForm.proveedor = 'gemini';
      expect(component.requiereApiKeyIa).toBeTrue();
    });

    describe('cargarProveedoresIa (via ngOnInit)', () => {
      it('sin conexiones guardadas, deja la lista vacia', () => {
        setup(of(presentacion), of([]), of([]));
        component.ngOnInit();

        expect(component.loadingProveedoresIa).toBeFalse();
        expect(component.proveedoresIa).toEqual([]);
      });

      it('con conexiones guardadas, las carga', () => {
        setup(of(presentacion), of([]), of([proveedorIaItem(), proveedorIaItem({ proveedorIaId: 2, proveedor: 'openai', esActivo: false })]));
        component.ngOnInit();

        expect(component.proveedoresIa.length).toBe(2);
      });

      it('notifica error si falla la carga', () => {
        setup(of(presentacion), of([]), throwError(() => new Error('boom')));
        component.ngOnInit();

        expect(component.loadingProveedoresIa).toBeFalse();
        expect(notificationService.error).toHaveBeenCalled();
      });
    });

    it('abrirNuevaConexionIa limpia el formulario y lo muestra', () => {
      setup();
      component.editandoProveedorIaId = 5;
      component.proveedorIaForm.nombre = 'algo viejo';

      component.abrirNuevaConexionIa();

      expect(component.editandoProveedorIaId).toBeNull();
      expect(component.proveedorIaForm.nombre).toBe('');
      expect(component.mostrarFormProveedorIa).toBeTrue();
    });

    it('editarConexionIa precarga el formulario sin la clave', () => {
      setup();
      const item = proveedorIaItem({ nombre: 'Cuenta trabajo', endpoint: null });

      component.editarConexionIa(item);

      expect(component.editandoProveedorIaId).toBe(item.proveedorIaId);
      expect(component.proveedorIaForm).toEqual({
        proveedor: 'claude', nombre: 'Cuenta trabajo', modelo: 'claude-opus-4-20250514', endpoint: '', apiKey: '',
      });
      expect(component.mostrarFormProveedorIa).toBeTrue();
    });

    it('cancelarFormProveedorIa oculta el formulario', () => {
      setup();
      component.mostrarFormProveedorIa = true;

      component.cancelarFormProveedorIa();

      expect(component.mostrarFormProveedorIa).toBeFalse();
    });

    describe('probarConexionIa', () => {
      it('avisa si el proveedor requiere endpoint y falta', () => {
        setup();
        component.proveedorIaForm.proveedor = 'ollama';
        component.proveedorIaForm.endpoint = '';

        component.probarConexionIa();

        expect(notificationService.warning).toHaveBeenCalled();
        expect(proveedorIaService.probarConexion).not.toHaveBeenCalled();
      });

      it('exitosa muestra el mensaje del backend', () => {
        setup();
        component.proveedorIaForm.apiKey = 'sk-ant-test';
        proveedorIaService.probarConexion.and.returnValue(of({ ok: true, mensaje: 'Conexión exitosa.' }));

        component.probarConexionIa();

        expect(component.probandoConexionIa).toBeFalse();
        expect(component.resultadoPruebaIa).toBe('ok');
        expect(component.mensajePruebaIa).toBe('Conexión exitosa.');
      });

      it('con Ok=false muestra el error del backend', () => {
        setup();
        component.proveedorIaForm.apiKey = 'sk-ant-test';
        proveedorIaService.probarConexion.and.returnValue(of({ ok: false, mensaje: 'La clave de API no es válida.' }));

        component.probarConexionIa();

        expect(component.resultadoPruebaIa).toBe('error');
        expect(component.mensajePruebaIa).toBe('La clave de API no es válida.');
      });

      it('notifica error si la peticion falla', () => {
        setup();
        component.proveedorIaForm.apiKey = 'sk-ant-test';
        proveedorIaService.probarConexion.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

        component.probarConexionIa();

        expect(component.probandoConexionIa).toBeFalse();
        expect(component.resultadoPruebaIa).toBe('error');
        expect(component.mensajePruebaIa).toBeTruthy();
      });
    });

    describe('guardarConexionIa', () => {
      it('avisa si el proveedor requiere endpoint y falta', () => {
        setup();
        component.proveedorIaForm.proveedor = 'ollama';
        component.proveedorIaForm.endpoint = '';

        component.guardarConexionIa();

        expect(notificationService.warning).toHaveBeenCalled();
        expect(proveedorIaService.crearConfig).not.toHaveBeenCalled();
      });

      it('al crear, avisa si falta la clave de API para un proveedor que la requiere', () => {
        setup();
        component.proveedorIaForm = { proveedor: 'claude', nombre: '', modelo: '', endpoint: '', apiKey: '' };

        component.guardarConexionIa();

        expect(notificationService.warning).toHaveBeenCalled();
        expect(proveedorIaService.crearConfig).not.toHaveBeenCalled();
      });

      it('crea una conexion nueva y recarga la lista', () => {
        setup();
        component.proveedorIaForm = { proveedor: 'claude', nombre: 'Cuenta A', modelo: 'claude-opus-4', endpoint: '', apiKey: 'sk-ant-test' };
        proveedorIaService.crearConfig.and.returnValue(of(proveedorIaItem()));
        proveedorIaService.getConfigs.and.returnValue(of([proveedorIaItem()]));

        component.guardarConexionIa();

        expect(proveedorIaService.crearConfig).toHaveBeenCalledWith({
          proveedor: 'claude', nombre: 'Cuenta A', modelo: 'claude-opus-4', endpoint: null, apiKey: 'sk-ant-test',
        });
        expect(component.guardandoProveedorIa).toBeFalse();
        expect(component.mostrarFormProveedorIa).toBeFalse();
        expect(notificationService.success).toHaveBeenCalled();
      });

      it('al editar, no exige la clave de API (se mantiene la anterior si se deja en blanco)', () => {
        setup();
        component.editandoProveedorIaId = 7;
        component.proveedorIaForm = { proveedor: 'claude', nombre: '', modelo: '', endpoint: '', apiKey: '' };
        proveedorIaService.actualizarConfig.and.returnValue(of(proveedorIaItem()));

        component.guardarConexionIa();

        expect(proveedorIaService.actualizarConfig).toHaveBeenCalledWith(7, jasmine.objectContaining({ apiKey: null }));
        expect(notificationService.warning).not.toHaveBeenCalled();
      });

      it('notifica error si el backend rechaza la solicitud', () => {
        setup();
        component.proveedorIaForm = { proveedor: 'claude', nombre: '', modelo: '', endpoint: '', apiKey: 'sk-ant-test' };
        proveedorIaService.crearConfig.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400 })));

        component.guardarConexionIa();

        expect(component.guardandoProveedorIa).toBeFalse();
        expect(notificationService.error).toHaveBeenCalled();
      });
    });

    describe('activarConexionIa', () => {
      it('no hace nada si ya esta activa', () => {
        setup();
        component.activarConexionIa(proveedorIaItem({ esActivo: true }));
        expect(proveedorIaService.activarConfig).not.toHaveBeenCalled();
      });

      it('activa y recarga la lista', () => {
        setup();
        proveedorIaService.activarConfig.and.returnValue(of(proveedorIaItem({ esActivo: true })));

        component.activarConexionIa(proveedorIaItem({ proveedorIaId: 2, esActivo: false }));

        expect(proveedorIaService.activarConfig).toHaveBeenCalledWith(2);
        expect(notificationService.success).toHaveBeenCalled();
      });

      it('notifica error si falla', () => {
        setup();
        proveedorIaService.activarConfig.and.returnValue(throwError(() => new Error('boom')));

        component.activarConexionIa(proveedorIaItem({ esActivo: false }));

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
        expect(component.probandoGuardadaProveedorIaId).toBeNull();
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

    describe('eliminarConexionIa', () => {
      it('no hace nada si se cancela la confirmacion', () => {
        setup();
        spyOn(window, 'confirm').and.returnValue(false);

        component.eliminarConexionIa(proveedorIaItem());

        expect(proveedorIaService.eliminarConfig).not.toHaveBeenCalled();
      });

      it('elimina y recarga la lista si se confirma y el backend responde bien', () => {
        setup();
        spyOn(window, 'confirm').and.returnValue(true);
        proveedorIaService.eliminarConfig.and.returnValue(of(undefined));

        component.eliminarConexionIa(proveedorIaItem());

        expect(notificationService.success).toHaveBeenCalled();
      });

      it('notifica error si el backend falla', () => {
        setup();
        spyOn(window, 'confirm').and.returnValue(true);
        proveedorIaService.eliminarConfig.and.returnValue(throwError(() => new Error('boom')));

        component.eliminarConexionIa(proveedorIaItem());

        expect(notificationService.error).toHaveBeenCalled();
      });
    });
  });

  describe('configuración de correo (SMTP para Analizar Oferta -> Enviar correo)', () => {
    it('ngOnInit carga la configuración y precarga el formulario sin la contraseña', () => {
      setup(undefined, undefined, undefined, of(configuracionCorreoDto({
        configuracionCorreoId: 3, host: 'smtp.gmail.com', puerto: 587, usarTls: true, tieneConfiguracion: true,
      })));

      component.ngOnInit();

      expect(component.loadingCorreo).toBeFalse();
      expect(component.correoConfig?.tieneConfiguracion).toBeTrue();
      expect(component.correoForm.host).toBe('smtp.gmail.com');
      expect(component.correoForm.password).toBe('');
    });

    describe('guardarConfiguracionCorreo', () => {
      it('avisa si el host esta vacio', () => {
        setup();
        component.ngOnInit();
        component.correoForm.host = '  ';

        component.guardarConfiguracionCorreo();

        expect(notificationService.warning).toHaveBeenCalled();
        expect(configuracionCorreoService.guardarConfig).not.toHaveBeenCalled();
      });

      it('avisa si es la primera vez y falta la contraseña', () => {
        setup();
        component.ngOnInit();
        component.correoForm.password = '';

        component.guardarConfiguracionCorreo();

        expect(notificationService.warning).toHaveBeenCalled();
        expect(configuracionCorreoService.guardarConfig).not.toHaveBeenCalled();
      });

      it('guarda y limpia la contraseña del formulario', () => {
        setup();
        component.ngOnInit();
        component.correoForm.password = 'clave-de-aplicacion';
        configuracionCorreoService.guardarConfig.and.returnValue(of(configuracionCorreoDto({ tieneConfiguracion: true })));

        component.guardarConfiguracionCorreo();

        expect(configuracionCorreoService.guardarConfig).toHaveBeenCalledWith({
          host: 'smtp.gmail.com', puerto: 587, usarTls: true, password: 'clave-de-aplicacion',
        });
        expect(component.correoForm.password).toBe('');
        expect(component.guardandoCorreo).toBeFalse();
        expect(notificationService.success).toHaveBeenCalled();
      });

      it('al editar una ya configurada, no exige contraseña (se mantiene la anterior si se deja en blanco)', () => {
        setup(undefined, undefined, undefined, of(configuracionCorreoDto({ tieneConfiguracion: true })));
        component.ngOnInit();
        configuracionCorreoService.guardarConfig.and.returnValue(of(configuracionCorreoDto({ tieneConfiguracion: true })));

        component.guardarConfiguracionCorreo();

        expect(configuracionCorreoService.guardarConfig).toHaveBeenCalledWith(
          jasmine.objectContaining({ password: null })
        );
        expect(notificationService.warning).not.toHaveBeenCalled();
      });

      it('notifica error si el backend rechaza la solicitud', () => {
        setup();
        component.ngOnInit();
        component.correoForm.password = 'clave-de-aplicacion';
        configuracionCorreoService.guardarConfig.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400 })));

        component.guardarConfiguracionCorreo();

        expect(component.guardandoCorreo).toBeFalse();
        expect(notificationService.error).toHaveBeenCalled();
      });
    });
  });

  describe('acciones en bloque de Información Profesional', () => {
    const expOculta: ExperienciaDto = {
      experienciaId: 1, empresa: 'Acme', cargo: 'Dev', sector: null, fechaInicio: null, fechaFin: null,
      tipoContrato: null, motivoRetiro: null, funciones: null, esActual: false, mostrarEnCv: false,
      adjuntoSoporte: null, fechaRegistro: '2026-01-01T00:00:00Z',
    };
    const formVisible: FormacionDto = {
      formacionId: 1, titulo: 'Ing.', institucion: 'U', area: null, fechaInicio: null, fechaFin: null,
      tipoFormacion: 'Pregrado', descripcion: null, adjuntoSoporte: null, fechaVigencia: null,
      duracionHoras: null, mostrarEnCv: true,
    };
    const proyOculto: ProyectoDto = {
      proyectoId: 1, nombreProyecto: 'X', rol: null, equipoTamano: null, duracionMeses: null,
      stackTecnologico: null, aporte: null, logro: null, desafio: null, mostrarEnCv: false,
    };
    const habVisible: HabilidadDto = {
      habilidadId: 1, nombre: 'Angular', tipo: 'Tecnica', nivel: null, descripcion: null,
      nivelLectura: null, nivelEscritura: null, nivelEscucha: null, nivelHabla: null, mostrarEnCv: true,
    };

    it('carga las 4 listas y refleja ocultas/visibles', () => {
      setup();
      cvEditorService.getExperiencias.and.returnValue(of([{ ...expOculta }]));
      cvEditorService.getFormaciones.and.returnValue(of([{ ...formVisible }]));
      cvEditorService.getProyectos.and.returnValue(of([{ ...proyOculto }]));
      cvEditorService.getHabilidades.and.returnValue(of([{ ...habVisible }]));

      component.ngOnInit();

      expect(component.hayExperienciasOcultas).toBeTrue();
      expect(component.hayExperienciasVisibles).toBeFalse();
      expect(component.hayFormacionesVisibles).toBeTrue();
      expect(component.hayProyectosOcultos).toBeTrue();
      expect(component.hayHabilidadesVisibles).toBeTrue();
    });

    it('activarTodasExperiencias solo llama al backend para las ocultas', () => {
      setup();
      cvEditorService.getExperiencias.and.returnValue(of([{ ...expOculta }]));
      cvEditorService.updateExperienciaVisibilidad.and.returnValue(of({ ...expOculta, mostrarEnCv: true }));
      component.ngOnInit();

      component.activarTodasExperiencias();

      expect(cvEditorService.updateExperienciaVisibilidad).toHaveBeenCalledWith(1, { mostrarEnCv: true });
      expect(component.experiencias[0].mostrarEnCv).toBeTrue();
      expect(component.guardandoVisibilidadBloqueExperiencia).toBeFalse();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('onToggleBloqueExperiencias(true) activa todas; onToggleBloqueExperiencias(false) inactiva todas', () => {
      setup();
      cvEditorService.getExperiencias.and.returnValue(of([{ ...expOculta }]));
      cvEditorService.updateExperienciaVisibilidad.and.returnValue(of({ ...expOculta, mostrarEnCv: true }));
      component.ngOnInit();

      component.onToggleBloqueExperiencias(true);
      expect(cvEditorService.updateExperienciaVisibilidad).toHaveBeenCalledWith(1, { mostrarEnCv: true });

      cvEditorService.updateExperienciaVisibilidad.calls.reset();
      cvEditorService.updateExperienciaVisibilidad.and.returnValue(of({ ...expOculta, mostrarEnCv: false }));
      component.onToggleBloqueExperiencias(false);
      expect(cvEditorService.updateExperienciaVisibilidad).toHaveBeenCalledWith(1, { mostrarEnCv: false });
    });

    it('inactivarTodasHabilidades agrupa Tecnica/Blanda/Idioma en un solo control', () => {
      const habBlanda: HabilidadDto = { ...habVisible, habilidadId: 2, tipo: 'Blanda' };
      const habIdioma: HabilidadDto = { ...habVisible, habilidadId: 3, tipo: 'Idioma' };
      setup();
      cvEditorService.getHabilidades.and.returnValue(of([{ ...habVisible }, habBlanda, habIdioma]));
      cvEditorService.updateHabilidadVisibilidad.and.callFake((id: number) =>
        of({ ...habVisible, habilidadId: id, mostrarEnCv: false })
      );
      component.ngOnInit();

      component.inactivarTodasHabilidades();

      expect(cvEditorService.updateHabilidadVisibilidad).toHaveBeenCalledTimes(3);
      expect(component.hayHabilidadesVisibles).toBeFalse();
    });

    it('no llama al backend si no hay nada que cambiar', () => {
      setup();
      cvEditorService.getProyectos.and.returnValue(of([{ ...proyOculto, mostrarEnCv: true }]));
      component.ngOnInit();

      component.activarTodosProyectos();

      expect(cvEditorService.updateProyectoVisibilidad).not.toHaveBeenCalled();
    });

    it('onToggleBloqueFormaciones/Proyectos/Habilidades delegan en activar/inactivar segun el checked', () => {
      setup();
      cvEditorService.getFormaciones.and.returnValue(of([{ ...formVisible, mostrarEnCv: false }]));
      cvEditorService.getProyectos.and.returnValue(of([{ ...proyOculto }]));
      cvEditorService.getHabilidades.and.returnValue(of([{ ...habVisible }]));
      cvEditorService.updateFormacionVisibilidad.and.returnValue(of({ ...formVisible, mostrarEnCv: true }));
      cvEditorService.updateProyectoVisibilidad.and.returnValue(of({ ...proyOculto, mostrarEnCv: true }));
      cvEditorService.updateHabilidadVisibilidad.and.returnValue(of({ ...habVisible, mostrarEnCv: false }));
      component.ngOnInit();

      component.onToggleBloqueFormaciones(true);
      component.onToggleBloqueProyectos(true);
      component.onToggleBloqueHabilidades(false);

      expect(cvEditorService.updateFormacionVisibilidad).toHaveBeenCalledWith(1, { mostrarEnCv: true });
      expect(cvEditorService.updateProyectoVisibilidad).toHaveBeenCalledWith(1, { mostrarEnCv: true });
      expect(cvEditorService.updateHabilidadVisibilidad).toHaveBeenCalledWith(1, { mostrarEnCv: false });
    });

    it('notifica error si falla el guardado en bloque', () => {
      setup();
      cvEditorService.getFormaciones.and.returnValue(of([{ ...formVisible, mostrarEnCv: false }]));
      cvEditorService.updateFormacionVisibilidad.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      component.ngOnInit();

      component.activarTodasFormaciones();

      expect(component.guardandoVisibilidadBloqueFormacion).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });
});
