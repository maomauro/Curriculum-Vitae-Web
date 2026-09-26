import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { RedesSocialesComponent } from './redes-sociales.component';
import { CvEditorService, RedSocialDto } from '../../../core/services/private/cv-editor.service';
import { NotificationService } from '../../../core/services/shared/notification.service';

describe('RedesSocialesComponent', () => {
  let component: RedesSocialesComponent;
  let cvEditorService: jasmine.SpyObj<CvEditorService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const linkedin: RedSocialDto = {
    redSocialId: 1,
    nombreRed: 'LinkedIn',
    linkPublico: 'https://linkedin.com/in/test',
    usuarioContacto: null,
    mostrarEnCv: true,
  };

  function setup(getResult = of([{ ...linkedin }])): void {
    cvEditorService = jasmine.createSpyObj('CvEditorService', [
      'getRedesSociales', 'createRedSocial', 'updateRedSocial', 'updateRedSocialVisibilidad', 'deleteRedSocial',
    ]);
    cvEditorService.getRedesSociales.and.returnValue(getResult);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      providers: [
        RedesSocialesComponent,
        { provide: CvEditorService, useValue: cvEditorService },
        { provide: NotificationService, useValue: notificationService },
      ],
    });
    component = TestBed.inject(RedesSocialesComponent);
  }

  it('carga redes sociales al inicializar y las mapea a UI con form propio', () => {
    setup();
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.redes.length).toBe(1);
    expect(component.redes[0].nombreRed).toBe('LinkedIn');
    expect(component.redes[0].editando).toBeFalse();
    expect(component.redes[0].form).toEqual({
      nombreRed: 'LinkedIn', linkPublico: 'https://linkedin.com/in/test', usuarioContacto: null, mostrarEnCv: true,
    });
  });

  it('notifica error si falla la carga', () => {
    setup(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('agregar agrega un borrador editable con redSocialId 0', () => {
    setup();
    component.ngOnInit();

    component.agregar();

    expect(component.redes.length).toBe(2);
    const draft = component.redes[1];
    expect(draft.redSocialId).toBe(0);
    expect(draft.editando).toBeTrue();
    expect(draft.form.nombreRed).toBe('LinkedIn');
  });

  describe('guardar', () => {
    it('avisa y no llama al backend si el nombre de red esta vacio', () => {
      setup();
      component.ngOnInit();
      component.agregar();
      const draft = component.redes[1];
      draft.form.nombreRed = '   ';

      component.guardar(draft);

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.createRedSocial).not.toHaveBeenCalled();
    });

    it('crea una red nueva (redSocialId 0), recorta campos y sale de modo edicion', () => {
      const creada: RedSocialDto = { redSocialId: 99, nombreRed: 'GitHub', linkPublico: 'https://github.com/test', usuarioContacto: null, mostrarEnCv: true };
      setup();
      cvEditorService.createRedSocial.and.returnValue(of(creada));
      component.ngOnInit();
      component.agregar();
      const draft = component.redes[1];
      draft.form = { nombreRed: '  GitHub  ', linkPublico: '  https://github.com/test  ', usuarioContacto: '  ', mostrarEnCv: true };

      component.guardar(draft);

      expect(cvEditorService.createRedSocial).toHaveBeenCalledWith({
        nombreRed: 'GitHub', linkPublico: 'https://github.com/test', usuarioContacto: null, mostrarEnCv: true,
      });
      expect(draft.redSocialId).toBe(99);
      expect(draft.editando).toBeFalse();
      expect(component.guardando).toBeFalse();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('actualiza una red existente en vez de crearla', () => {
      setup();
      cvEditorService.updateRedSocial.and.returnValue(of({ ...linkedin, nombreRed: 'LinkedIn actualizado' }));
      component.ngOnInit();
      const red = component.redes[0];
      red.editando = true;
      red.form = { ...red.form, nombreRed: 'LinkedIn actualizado' };

      component.guardar(red);

      expect(cvEditorService.updateRedSocial).toHaveBeenCalledWith(1, jasmine.any(Object));
      expect(cvEditorService.createRedSocial).not.toHaveBeenCalled();
    });

    it('notifica error y limpia el estado de guardando si falla el backend', () => {
      setup();
      cvEditorService.updateRedSocial.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      component.ngOnInit();
      const red = component.redes[0];

      component.guardar(red);

      expect(component.guardando).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('cancelar', () => {
    it('quita el borrador (redSocialId 0) de la lista', () => {
      setup();
      component.ngOnInit();
      component.agregar();
      const draft = component.redes[1];

      component.cancelar(draft);

      expect(component.redes.length).toBe(1);
    });

    it('solo sale de modo edicion para una red ya persistida', () => {
      setup();
      component.ngOnInit();
      const red = component.redes[0];
      red.editando = true;

      component.cancelar(red);

      expect(component.redes.length).toBe(1);
      expect(red.editando).toBeFalse();
    });
  });

  describe('eliminar', () => {
    it('quita un borrador sin confirmar ni llamar al backend', () => {
      setup();
      component.ngOnInit();
      component.agregar();
      const draft = component.redes[1];

      component.eliminar(draft);

      expect(component.redes.length).toBe(1);
      expect(cvEditorService.deleteRedSocial).not.toHaveBeenCalled();
    });

    it('si se cancela la confirmacion, no llama al backend', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(false);
      component.ngOnInit();

      component.eliminar(component.redes[0]);

      expect(cvEditorService.deleteRedSocial).not.toHaveBeenCalled();
    });

    it('si se confirma, llama deleteRedSocial y notifica exito', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      cvEditorService.deleteRedSocial.and.returnValue(of(undefined));
      component.ngOnInit();

      component.eliminar(component.redes[0]);

      expect(cvEditorService.deleteRedSocial).toHaveBeenCalledWith(1);
      expect(component.redes.length).toBe(0);
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('notifica error si falla el borrado', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      cvEditorService.deleteRedSocial.and.returnValue(throwError(() => new Error('boom')));
      component.ngOnInit();

      component.eliminar(component.redes[0]);

      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('onMostrarEnCvChange', () => {
    it('no hace nada para una red nueva (id 0)', () => {
      setup();
      component.ngOnInit();
      component.agregar();
      const draft = component.redes[1];

      component.onMostrarEnCvChange(draft, false);

      expect(cvEditorService.updateRedSocialVisibilidad).not.toHaveBeenCalled();
    });

    it('actualiza y notifica exito', () => {
      setup();
      cvEditorService.updateRedSocialVisibilidad.and.returnValue(of({ ...linkedin, mostrarEnCv: false }));
      component.ngOnInit();

      component.onMostrarEnCvChange(component.redes[0], false);

      expect(cvEditorService.updateRedSocialVisibilidad).toHaveBeenCalledWith(1, { mostrarEnCv: false });
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('revierte y notifica error si falla el backend', () => {
      setup();
      cvEditorService.updateRedSocialVisibilidad.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      component.ngOnInit();
      const red = component.redes[0];

      component.onMostrarEnCvChange(red, false);

      expect(red.form.mostrarEnCv).toBeTrue();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('activarTodas / inactivarTodas', () => {
    const githubOculto: RedSocialDto = { ...linkedin, redSocialId: 2, nombreRed: 'GitHub', mostrarEnCv: false };

    it('hayRedesOcultas/hayRedesVisibles reflejan el estado cargado', () => {
      setup(of([{ ...linkedin }, { ...githubOculto }]));
      component.ngOnInit();

      expect(component.hayRedesOcultas).toBeTrue();
      expect(component.hayRedesVisibles).toBeTrue();
    });

    it('activarTodas solo llama al backend para las ocultas', () => {
      setup(of([{ ...linkedin }, { ...githubOculto }]));
      cvEditorService.updateRedSocialVisibilidad.and.returnValue(of({ ...githubOculto, mostrarEnCv: true }));
      component.ngOnInit();

      component.activarTodas();

      expect(cvEditorService.updateRedSocialVisibilidad).toHaveBeenCalledTimes(1);
      expect(cvEditorService.updateRedSocialVisibilidad).toHaveBeenCalledWith(2, { mostrarEnCv: true });
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('inactivarTodas solo llama al backend para las visibles', () => {
      setup(of([{ ...linkedin }, { ...githubOculto }]));
      cvEditorService.updateRedSocialVisibilidad.and.returnValue(of({ ...linkedin, mostrarEnCv: false }));
      component.ngOnInit();

      component.inactivarTodas();

      expect(cvEditorService.updateRedSocialVisibilidad).toHaveBeenCalledTimes(1);
      expect(cvEditorService.updateRedSocialVisibilidad).toHaveBeenCalledWith(1, { mostrarEnCv: false });
    });

    it('no llama al backend si no hay nada que cambiar', () => {
      setup();
      component.ngOnInit();

      component.activarTodas();

      expect(cvEditorService.updateRedSocialVisibilidad).not.toHaveBeenCalled();
    });

    it('notifica error si falla el guardado en bloque', () => {
      setup(of([{ ...githubOculto }]));
      cvEditorService.updateRedSocialVisibilidad.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      component.ngOnInit();

      component.activarTodas();

      expect(component.guardandoVisibilidadBloque).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('iconoClase / iconoColor', () => {
    it('devuelve el icono y color configurados para una red conocida', () => {
      setup();
      expect(component.iconoClase('GitHub')).toBe('bi-github');
      expect(component.iconoColor('GitHub')).toBe('#24292e');
    });

    it('devuelve un icono y color por defecto para una red no reconocida', () => {
      setup();
      expect(component.iconoClase('Inventada')).toBe('bi-link-45deg');
      expect(component.iconoColor('Inventada')).toBe('#6c757d');
    });
  });
});
