import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { PerfilComponent } from './perfil.component';
import { CvEditorService, PerfilDto } from '../../../core/services/private/cv-editor.service';
import { NotificationService } from '../../../core/services/shared/notification.service';

describe('PerfilComponent', () => {
  let component: PerfilComponent;
  let cvEditorService: jasmine.SpyObj<CvEditorService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const activo: PerfilDto = {
    perfilId: 1, nombrePerfil: 'Backend Developer', descripcionPerfil: null,
    experienciaPerfilAnios: 5, aspiracionSalarialPesos: null, aspiracionSalarialDolares: null, esActivo: true,
  };
  const inactivo: PerfilDto = { ...activo, perfilId: 2, nombrePerfil: 'Data Analyst', esActivo: false };

  function setup(getResult = of([{ ...activo }, { ...inactivo }])): void {
    cvEditorService = jasmine.createSpyObj('CvEditorService', [
      'getPerfiles', 'createPerfil', 'updatePerfil', 'deletePerfil',
    ]);
    cvEditorService.getPerfiles.and.returnValue(getResult);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      providers: [
        PerfilComponent,
        { provide: CvEditorService, useValue: cvEditorService },
        { provide: NotificationService, useValue: notificationService },
      ],
    });
    component = TestBed.inject(PerfilComponent);
  }

  it('carga perfiles, cierra el acordeon y limpia el estado de guardando', () => {
    setup();
    component.guardando = true;
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.guardando).toBeFalse();
    expect(component.perfiles.length).toBe(2);
    expect(component.isPerfilAccordionOpen(1)).toBeFalse();
  });

  it('notifica error si falla la carga', () => {
    setup(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('trackByPerfil devuelve el perfilId', () => {
    setup();
    component.ngOnInit();
    expect(component.trackByPerfil(0, component.perfiles[0])).toBe(1);
  });

  it('togglePerfilAccordion abre y cierra el acordeon por perfilId', () => {
    setup();
    expect(component.isPerfilAccordionOpen(1)).toBeFalse();

    component.togglePerfilAccordion(1);
    expect(component.isPerfilAccordionOpen(1)).toBeTrue();

    component.togglePerfilAccordion(1);
    expect(component.isPerfilAccordionOpen(1)).toBeFalse();
  });

  describe('abrirNuevo / cancelarNuevo', () => {
    it('abrirNuevo resetea el formulario y lo muestra', () => {
      setup();
      component.formNuevo.nombrePerfil = 'algo viejo';

      component.abrirNuevo();

      expect(component.mostrarFormNuevo).toBeTrue();
      expect(component.formNuevo.nombrePerfil).toBeNull();
      expect(component.formNuevo.esActivo).toBeTrue();
    });

    it('cancelarNuevo oculta el formulario', () => {
      setup();
      component.abrirNuevo();

      component.cancelarNuevo();

      expect(component.mostrarFormNuevo).toBeFalse();
    });
  });

  describe('onActivoChange', () => {
    it('al desactivar, solo cambia el estado local sin llamar al backend', () => {
      setup();
      component.ngOnInit();
      const p = component.perfiles[0];

      component.onActivoChange(p, false);

      expect(p.form.esActivo).toBeFalse();
      expect(cvEditorService.updatePerfil).not.toHaveBeenCalled();
    });

    it('al activar, desactiva los demas en servidor, activa el elegido y recarga', () => {
      setup();
      cvEditorService.updatePerfil.and.returnValue(of({ ...activo }));
      component.ngOnInit();
      const p = component.perfiles[1];
      // Se capturan las referencias antes de llamar: el mock de getPerfiles() es un
      // observable sincronico y onActivoChange dispara un cargar() al final que
      // reemplaza component.perfiles con objetos nuevos (no refleja persistencia real
      // en este mock), asi que la unica forma fiable de comprobar la mutacion local
      // inmediata es sobre las referencias que ya tenia el componente.
      const otro = component.perfiles[0];

      component.onActivoChange(p, true);

      expect(otro.form.esActivo).toBeFalse();
      expect(p.form.esActivo).toBeTrue();
      expect(cvEditorService.updatePerfil).toHaveBeenCalledWith(1, jasmine.objectContaining({ esActivo: false }));
      expect(cvEditorService.updatePerfil).toHaveBeenCalledWith(2, jasmine.objectContaining({ esActivo: true }));
      expect(notificationService.success).toHaveBeenCalled();
      expect(cvEditorService.getPerfiles).toHaveBeenCalledTimes(2);
    });

    it('activa directo (sin desactivar a nadie) si es el unico perfil', () => {
      setup(of([{ ...activo, esActivo: false }]));
      cvEditorService.updatePerfil.and.returnValue(of({ ...activo }));
      component.ngOnInit();

      component.onActivoChange(component.perfiles[0], true);

      expect(cvEditorService.updatePerfil).toHaveBeenCalledTimes(1);
      expect(cvEditorService.updatePerfil).toHaveBeenCalledWith(1, jasmine.objectContaining({ esActivo: true }));
    });

    it('notifica error y recarga si falla el backend al activar', () => {
      setup();
      cvEditorService.updatePerfil.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      component.ngOnInit();

      component.onActivoChange(component.perfiles[1], true);

      expect(component.guardando).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
      expect(cvEditorService.getPerfiles).toHaveBeenCalledTimes(2);
    });
  });

  describe('crear', () => {
    it('avisa y no llama al backend si el nombre esta vacio', () => {
      setup();
      component.abrirNuevo();

      component.crear();

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.createPerfil).not.toHaveBeenCalled();
    });

    it('crea el perfil directo si no hay perfiles previos que desactivar', () => {
      setup(of([]));
      cvEditorService.createPerfil.and.returnValue(of({ ...activo }));
      component.ngOnInit();
      component.abrirNuevo();
      component.formNuevo.nombrePerfil = 'Nuevo perfil';

      component.crear();

      expect(cvEditorService.updatePerfil).not.toHaveBeenCalled();
      expect(cvEditorService.createPerfil).toHaveBeenCalled();
      expect(component.mostrarFormNuevo).toBeFalse();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('desactiva los perfiles existentes antes de crear uno activo', () => {
      setup();
      cvEditorService.updatePerfil.and.returnValue(of({ ...activo }));
      cvEditorService.createPerfil.and.returnValue(of({ ...activo, perfilId: 99 }));
      component.ngOnInit();
      component.abrirNuevo();
      component.formNuevo.nombrePerfil = 'Nuevo perfil';
      component.formNuevo.esActivo = true;

      component.crear();

      expect(cvEditorService.updatePerfil).toHaveBeenCalledTimes(2);
      expect(cvEditorService.createPerfil).toHaveBeenCalled();
    });

    it('no desactiva a nadie si el nuevo perfil no se marca como activo', () => {
      setup();
      cvEditorService.createPerfil.and.returnValue(of({ ...activo }));
      component.ngOnInit();
      component.abrirNuevo();
      component.formNuevo.nombrePerfil = 'Nuevo perfil';
      component.formNuevo.esActivo = false;

      component.crear();

      expect(cvEditorService.updatePerfil).not.toHaveBeenCalled();
    });

    it('notifica error si falla el backend (sin recargar)', () => {
      setup(of([]));
      cvEditorService.createPerfil.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      component.ngOnInit();
      cvEditorService.getPerfiles.calls.reset();
      component.abrirNuevo();
      component.formNuevo.nombrePerfil = 'Nuevo perfil';

      component.crear();

      expect(component.guardando).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
      expect(cvEditorService.getPerfiles).not.toHaveBeenCalled();
    });
  });

  describe('guardar', () => {
    it('avisa y no llama al backend si el nombre esta vacio', () => {
      setup();
      component.ngOnInit();
      const p = component.perfiles[0];
      p.form.nombrePerfil = '   ';

      component.guardar(p);

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.updatePerfil).not.toHaveBeenCalled();
    });

    it('si esActivo, desactiva los demas y luego actualiza el elegido', () => {
      setup();
      cvEditorService.updatePerfil.and.returnValue(of({ ...activo }));
      component.ngOnInit();
      const p = component.perfiles[1];
      p.form.esActivo = true;
      p.form.nombrePerfil = 'Data Analyst Senior';

      component.guardar(p);

      expect(cvEditorService.updatePerfil).toHaveBeenCalledWith(1, jasmine.objectContaining({ esActivo: false }));
      expect(cvEditorService.updatePerfil).toHaveBeenCalledWith(2, jasmine.objectContaining({ esActivo: true, nombrePerfil: 'Data Analyst Senior' }));
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('si no esta activo, actualiza directo sin tocar a los demas', () => {
      setup();
      cvEditorService.updatePerfil.and.returnValue(of({ ...inactivo }));
      component.ngOnInit();
      const p = component.perfiles[1];

      component.guardar(p);

      expect(cvEditorService.updatePerfil).toHaveBeenCalledTimes(1);
      expect(cvEditorService.updatePerfil).toHaveBeenCalledWith(2, jasmine.any(Object));
    });

    it('notifica error y recarga si falla el guardado activo', () => {
      setup();
      cvEditorService.updatePerfil.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      component.ngOnInit();
      const p = component.perfiles[1];
      p.form.esActivo = true;

      component.guardar(p);

      expect(component.guardando).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
      expect(cvEditorService.getPerfiles).toHaveBeenCalledTimes(2);
    });

    it('notifica error y recarga si falla el guardado inactivo', () => {
      setup();
      cvEditorService.updatePerfil.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      component.ngOnInit();

      component.guardar(component.perfiles[1]);

      expect(component.guardando).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
      expect(cvEditorService.getPerfiles).toHaveBeenCalledTimes(2);
    });
  });

  describe('eliminar', () => {
    it('no llama al backend si se cancela la confirmacion', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(false);
      component.ngOnInit();

      component.eliminar(component.perfiles[0]);

      expect(cvEditorService.deletePerfil).not.toHaveBeenCalled();
    });

    it('si se confirma, elimina y recarga la lista', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      cvEditorService.deletePerfil.and.returnValue(of(undefined));
      component.ngOnInit();

      component.eliminar(component.perfiles[0]);

      expect(cvEditorService.deletePerfil).toHaveBeenCalledWith(1);
      expect(notificationService.success).toHaveBeenCalled();
      expect(cvEditorService.getPerfiles).toHaveBeenCalledTimes(2);
    });

    it('notifica error si falla el borrado', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      cvEditorService.deletePerfil.and.returnValue(throwError(() => new Error('boom')));
      component.ngOnInit();

      component.eliminar(component.perfiles[0]);

      expect(component.guardando).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });
});
