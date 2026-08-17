import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfiguracionComponent } from './configuracion.component';
import { CvEditorService, PresentacionCvDto, VisibilidadSeccionDto } from '../../../core/services/private/cv-editor.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { NotificationService } from '../../../core/services/shared/notification.service';

describe('ConfiguracionComponent', () => {
  let component: ConfiguracionComponent;
  let cvEditorService: jasmine.SpyObj<CvEditorService>;
  let authService: jasmine.SpyObj<AuthService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const presentacion: PresentacionCvDto = {
    plantillaCodigo: 'clasico', experienciaLaboralMesesAcumulados: 0, urlPublica: 'ana-cv', publicado: true,
  };

  function setup(
    presentacionResult = of(presentacion),
    visibilidadResult = of<VisibilidadSeccionDto[]>([]),
  ): void {
    cvEditorService = jasmine.createSpyObj('CvEditorService', [
      'getPresentacion', 'getVisibilidad', 'updateVisibilidad', 'updateCurriculumPublicacion',
    ]);
    cvEditorService.getPresentacion.and.returnValue(presentacionResult);
    cvEditorService.getVisibilidad.and.returnValue(visibilidadResult);
    authService = jasmine.createSpyObj('AuthService', ['changePassword']);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      providers: [
        ConfiguracionComponent,
        { provide: CvEditorService, useValue: cvEditorService },
        { provide: AuthService, useValue: authService },
        { provide: NotificationService, useValue: notificationService },
      ],
    });
    component = TestBed.inject(ConfiguracionComponent);
  }

  function itemByKey(key: string) {
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
      expect(component.interruptorVisibilidadDeshabilitado(itemByKey('proyectos'))).toBeFalse();
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
        { seccion: 'proyectos', visible: false },
        { seccion: 'proyectos.nombre', visible: false },
      ]));
      component.ngOnInit();

      const proyectos = itemByKey('proyectos');
      expect(proyectos.visible).toBeFalse();
      expect(proyectos.atributos.find(a => a.key === 'proyectos.nombre')?.visible).toBeFalse();
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
      const proyectos = itemByKey('proyectos');
      proyectos.visible = false;

      component.onToggleSeccion(proyectos);

      expect(proyectos.atributos.every(a => !a.visible)).toBeTrue();
      expect(cvEditorService.updateVisibilidad).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('notifica error si falla el guardado', () => {
      setup();
      cvEditorService.updateVisibilidad.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      const proyectos = itemByKey('proyectos');

      component.onToggleSeccion(proyectos);

      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('onToggleAtributo', () => {
    it('activar un atributo enciende la seccion si estaba apagada', () => {
      setup();
      cvEditorService.updateVisibilidad.and.returnValue(of([]));
      const proyectos = itemByKey('proyectos');
      proyectos.visible = false;
      const attr = proyectos.atributos[0];
      attr.visible = true;

      component.onToggleAtributo(proyectos, attr);

      expect(proyectos.visible).toBeTrue();
    });

    it('si ningun atributo queda visible, apaga la seccion', () => {
      setup();
      cvEditorService.updateVisibilidad.and.returnValue(of([]));
      const proyectos = itemByKey('proyectos');
      proyectos.visible = true;
      proyectos.atributos.forEach(a => (a.visible = false));

      component.onToggleAtributo(proyectos, proyectos.atributos[0]);

      expect(proyectos.visible).toBeFalse();
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
});
