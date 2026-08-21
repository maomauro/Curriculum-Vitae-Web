import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfiguracionComponent } from './configuracion.component';
import { CvEditorService, PresentacionCvDto, VisibilidadSeccionDto } from '../../../core/services/private/cv-editor.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ProveedorIaService, ProveedorIaConfigDto } from '../../../core/services/private/proveedor-ia.service';
import { NotificationService } from '../../../core/services/shared/notification.service';

describe('ConfiguracionComponent', () => {
  let component: ConfiguracionComponent;
  let cvEditorService: jasmine.SpyObj<CvEditorService>;
  let authService: jasmine.SpyObj<AuthService>;
  let proveedorIaService: jasmine.SpyObj<ProveedorIaService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const presentacion: PresentacionCvDto = {
    plantillaCodigo: 'clasico', experienciaLaboralMesesAcumulados: 0, urlPublica: 'ana-cv', publicado: true,
  };

  function proveedorIaItem(over: Partial<ProveedorIaConfigDto> = {}): ProveedorIaConfigDto {
    return {
      proveedorIaConfigId: 1,
      proveedor: 'claude',
      nombre: null,
      modelo: 'claude-opus-4-20250514',
      endpoint: null,
      esActivo: true,
      fechaActualizacion: '2026-08-19T00:00:00Z',
      ...over,
    };
  }

  function setup(
    presentacionResult = of(presentacion),
    visibilidadResult = of<VisibilidadSeccionDto[]>([]),
    proveedorIaResult = of<ProveedorIaConfigDto[]>([]),
  ): void {
    cvEditorService = jasmine.createSpyObj('CvEditorService', [
      'getPresentacion', 'getVisibilidad', 'updateVisibilidad', 'updateCurriculumPublicacion',
    ]);
    cvEditorService.getPresentacion.and.returnValue(presentacionResult);
    cvEditorService.getVisibilidad.and.returnValue(visibilidadResult);
    authService = jasmine.createSpyObj('AuthService', ['changePassword']);
    proveedorIaService = jasmine.createSpyObj('ProveedorIaService', [
      'getConfigs', 'crearConfig', 'actualizarConfig', 'eliminarConfig', 'activarConfig', 'probarConexion',
      'probarConexionGuardada',
    ]);
    proveedorIaService.getConfigs.and.returnValue(proveedorIaResult);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      providers: [
        ConfiguracionComponent,
        { provide: CvEditorService, useValue: cvEditorService },
        { provide: AuthService, useValue: authService },
        { provide: ProveedorIaService, useValue: proveedorIaService },
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
      expect(component.interruptorVisibilidadDeshabilitado(itemByKey('diplomados'))).toBeFalse();
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
        { seccion: 'diplomados', visible: false },
        { seccion: 'diplomados.descargar-soporte-certificado', visible: false },
      ]));
      component.ngOnInit();

      const diplomados = itemByKey('diplomados');
      expect(diplomados.visible).toBeFalse();
      expect(diplomados.atributos.find(a => a.key === 'diplomados.descargar-soporte-certificado')?.visible).toBeFalse();
    });

    it('las secciones sinSwitchSeccion siempre quedan visibles', () => {
      setup(of(presentacion), of([{ seccion: 'perfil', visible: false }]));
      component.ngOnInit();

      expect(itemByKey('perfil').visible).toBeTrue();
    });

    it('aplica el valor legado "educacion" a las 4 sub-secciones si no tienen valor propio', () => {
      setup(of(presentacion), of([{ seccion: 'educacion', visible: false }]));
      component.ngOnInit();

      expect(itemByKey('diplomados').visible).toBeFalse();
      expect(itemByKey('certificaciones').visible).toBeFalse();
      expect(itemByKey('cursos').visible).toBeFalse();
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
      const diplomados = itemByKey('diplomados');
      diplomados.visible = false;

      component.onToggleSeccion(diplomados);

      expect(diplomados.atributos.every(a => !a.visible)).toBeTrue();
      expect(cvEditorService.updateVisibilidad).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('notifica error si falla el guardado', () => {
      setup();
      cvEditorService.updateVisibilidad.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      const diplomados = itemByKey('diplomados');

      component.onToggleSeccion(diplomados);

      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('onToggleAtributo', () => {
    it('activar un atributo enciende la seccion si estaba apagada', () => {
      setup();
      cvEditorService.updateVisibilidad.and.returnValue(of([]));
      const diplomados = itemByKey('diplomados');
      diplomados.visible = false;
      const attr = diplomados.atributos[0];
      attr.visible = true;

      component.onToggleAtributo(diplomados, attr);

      expect(diplomados.visible).toBeTrue();
    });

    it('si ningun atributo queda visible, apaga la seccion', () => {
      setup();
      cvEditorService.updateVisibilidad.and.returnValue(of([]));
      const diplomados = itemByKey('diplomados');
      diplomados.visible = true;
      diplomados.atributos.forEach(a => (a.visible = false));

      component.onToggleAtributo(diplomados, diplomados.atributos[0]);

      expect(diplomados.visible).toBeFalse();
    });

    it('para secciones sinSwitchSeccion, siempre queda visible=true', () => {
      setup();
      cvEditorService.updateVisibilidad.and.returnValue(of([]));
      const perfil = itemByKey('perfil');

      component.onToggleAtributo(perfil, perfil.atributos[0]);

      expect(perfil.visible).toBeTrue();
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
        setup(of(presentacion), of([]), of([proveedorIaItem(), proveedorIaItem({ proveedorIaConfigId: 2, proveedor: 'openai', esActivo: false })]));
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

      expect(component.editandoProveedorIaId).toBe(item.proveedorIaConfigId);
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

        component.activarConexionIa(proveedorIaItem({ proveedorIaConfigId: 2, esActivo: false }));

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

        component.probarConexionGuardada(proveedorIaItem({ proveedorIaConfigId: 2 }));

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
});
