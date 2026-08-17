import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { FamiliaresComponent } from './familiares.component';
import { CvEditorService, FamiliarContactoDto } from '../../../core/services/private/cv-editor.service';
import { NotificationService } from '../../../core/services/shared/notification.service';

describe('FamiliaresComponent', () => {
  let component: FamiliaresComponent;
  let cvEditorService: jasmine.SpyObj<CvEditorService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const madre: FamiliarContactoDto = {
    familiarId: 1,
    parentesco: 'Madre',
    nombres: 'María',
    apellidos: 'Pérez',
    email: 'maria@example.com',
    telefono: '3001234567',
    esContactoPrincipal: true,
  };

  function setup(getResult = of([{ ...madre }])): void {
    cvEditorService = jasmine.createSpyObj('CvEditorService', [
      'getFamiliares', 'createFamiliar', 'updateFamiliar', 'deleteFamiliar',
    ]);
    cvEditorService.getFamiliares.and.returnValue(getResult);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      providers: [
        FamiliaresComponent,
        { provide: CvEditorService, useValue: cvEditorService },
        { provide: NotificationService, useValue: notificationService },
      ],
    });
    component = TestBed.inject(FamiliaresComponent);
  }

  it('carga familiares al inicializar y los mapea a UI con form propio', () => {
    setup();
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.familiares.length).toBe(1);
    expect(component.familiares[0].editando).toBeFalse();
    expect(component.familiares[0].form.nombres).toBe('María');
  });

  it('notifica error si falla la carga', () => {
    setup(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('trackByFamiliar usa el id real cuando existe y una key sintetica para borradores', () => {
    setup();
    component.ngOnInit();
    const persistido = component.familiares[0];

    expect(component.trackByFamiliar(0, persistido)).toBe(1);
    component.agregar();
    expect(component.trackByFamiliar(1, component.familiares[1])).toBe('nuevo-1');
  });

  describe('cabecera (titulo / subtitulo / principal)', () => {
    it('para un contacto persistido y no en edicion, usa los datos guardados', () => {
      setup();
      component.ngOnInit();
      const fam = component.familiares[0];

      expect(component.tituloCabecera(fam)).toBe('María Pérez');
      expect(component.subtituloCabecera(fam)).toBe('Madre');
      expect(component.esPrincipalCabecera(fam)).toBeTrue();
    });

    it('para un contacto en edicion, usa los datos del form (aun no guardados)', () => {
      setup();
      component.ngOnInit();
      const fam = component.familiares[0];
      fam.editando = true;
      fam.form = { ...fam.form, nombres: 'Nombre editado', apellidos: '', parentesco: 'Padre', esContactoPrincipal: false };

      expect(component.tituloCabecera(fam)).toBe('Nombre editado');
      expect(component.subtituloCabecera(fam)).toBe('Padre');
      expect(component.esPrincipalCabecera(fam)).toBeFalse();
    });

    it('un borrador sin nombre muestra "Nuevo contacto" y "—" de parentesco', () => {
      setup();
      component.ngOnInit();
      component.agregar();
      const draft = component.familiares[1];

      expect(component.tituloCabecera(draft)).toBe('Nuevo contacto');
      expect(component.subtituloCabecera(draft)).toBe('—');
    });
  });

  it('toggleEditarFamiliar alterna el modo edicion y recarga el form desde los datos guardados', () => {
    setup();
    component.ngOnInit();
    const fam = component.familiares[0];
    fam.form.nombres = 'Modificado sin guardar';

    component.toggleEditarFamiliar(fam);

    expect(fam.editando).toBeTrue();
    expect(fam.form.nombres).toBe('María');
  });

  it('agregar agrega un borrador vacio en modo edicion', () => {
    setup();
    component.ngOnInit();

    component.agregar();

    expect(component.familiares.length).toBe(2);
    const draft = component.familiares[1];
    expect(draft.familiarId).toBe(0);
    expect(draft.editando).toBeTrue();
  });

  describe('guardar', () => {
    it('avisa y no llama al backend si el nombre esta vacio', () => {
      setup();
      component.ngOnInit();
      component.agregar();
      const draft = component.familiares[1];

      component.guardar(draft);

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.createFamiliar).not.toHaveBeenCalled();
    });

    it('avisa y no llama al backend si el email es invalido', () => {
      setup();
      component.ngOnInit();
      component.agregar();
      const draft = component.familiares[1];
      draft.form.nombres = 'Juan';
      draft.form.email = 'no-es-un-email';

      component.guardar(draft);

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.createFamiliar).not.toHaveBeenCalled();
    });

    it('crea un contacto nuevo, recorta campos y sale de modo edicion', () => {
      const creado: FamiliarContactoDto = { ...madre, familiarId: 99, nombres: 'Juan' };
      setup();
      cvEditorService.createFamiliar.and.returnValue(of(creado));
      component.ngOnInit();
      component.agregar();
      const draft = component.familiares[1];
      draft.form = { parentesco: '  Padre  ', nombres: '  Juan  ', apellidos: '  ', email: '  ', telefono: '  ', esContactoPrincipal: false };

      component.guardar(draft);

      expect(cvEditorService.createFamiliar).toHaveBeenCalledWith({
        parentesco: 'Padre', nombres: 'Juan', apellidos: null, email: null, telefono: null, esContactoPrincipal: false,
      });
      expect(draft.familiarId).toBe(99);
      expect(draft.editando).toBeFalse();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('actualiza un contacto existente en vez de crearlo', () => {
      setup();
      cvEditorService.updateFamiliar.and.returnValue(of({ ...madre, nombres: 'María actualizada' }));
      component.ngOnInit();
      const fam = component.familiares[0];
      fam.editando = true;

      component.guardar(fam);

      expect(cvEditorService.updateFamiliar).toHaveBeenCalledWith(1, jasmine.any(Object));
      expect(cvEditorService.createFamiliar).not.toHaveBeenCalled();
    });

    it('notifica error si falla el backend', () => {
      setup();
      cvEditorService.updateFamiliar.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      component.ngOnInit();

      component.guardar(component.familiares[0]);

      expect(component.guardando).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('cancelar', () => {
    it('quita un borrador sin guardar', () => {
      setup();
      component.ngOnInit();
      component.agregar();

      component.cancelar(component.familiares[1]);

      expect(component.familiares.length).toBe(1);
    });

    it('no hace nada con un contacto ya persistido', () => {
      setup();
      component.ngOnInit();

      component.cancelar(component.familiares[0]);

      expect(component.familiares.length).toBe(1);
    });
  });

  describe('eliminar', () => {
    it('no hace nada con un borrador (familiarId 0)', () => {
      setup();
      component.ngOnInit();
      component.agregar();

      component.eliminar(component.familiares[1]);

      expect(component.familiares.length).toBe(2);
      expect(cvEditorService.deleteFamiliar).not.toHaveBeenCalled();
    });

    it('si se cancela la confirmacion, no llama al backend', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(false);
      component.ngOnInit();

      component.eliminar(component.familiares[0]);

      expect(cvEditorService.deleteFamiliar).not.toHaveBeenCalled();
    });

    it('si se confirma, llama deleteFamiliar y notifica exito', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      cvEditorService.deleteFamiliar.and.returnValue(of(undefined));
      component.ngOnInit();

      component.eliminar(component.familiares[0]);

      expect(cvEditorService.deleteFamiliar).toHaveBeenCalledWith(1);
      expect(component.familiares.length).toBe(0);
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('notifica error si falla el borrado', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      cvEditorService.deleteFamiliar.and.returnValue(throwError(() => new Error('boom')));
      component.ngOnInit();

      component.eliminar(component.familiares[0]);

      expect(notificationService.error).toHaveBeenCalled();
    });
  });
});
