import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ReferenciasComponent } from './referencias.component';
import { CvEditorService, ReferenciaDto } from '../../../core/services/private/cv-editor.service';
import { NotificationService } from '../../../core/services/shared/notification.service';

describe('ReferenciasComponent', () => {
  let component: ReferenciasComponent;
  let cvEditorService: jasmine.SpyObj<CvEditorService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const personal: ReferenciaDto = {
    referenciaId: 1,
    tipoReferencia: 'Personal',
    experienciaId: null,
    nombre: 'Ana',
    apellido: 'Gómez',
    email: 'ana@example.com',
    telefono: '3001234567',
    parentesco: null,
    cargo: 'Gerente',
    empresa: 'Acme',
    relacion: 'Colega',
    observaciones: null,
    adjuntoSoporte: null,
    fechaRegistro: '2026-01-01T00:00:00Z',
  };
  const laboral: ReferenciaDto = { ...personal, referenciaId: 2, tipoReferencia: 'Laboral', nombre: 'Carlos' };

  function setup(getResult = of([{ ...personal }, { ...laboral }])): void {
    cvEditorService = jasmine.createSpyObj('CvEditorService', [
      'getReferencias', 'createReferencia', 'updateReferencia', 'deleteReferencia',
    ]);
    cvEditorService.getReferencias.and.returnValue(getResult);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      providers: [
        ReferenciasComponent,
        { provide: CvEditorService, useValue: cvEditorService },
        { provide: NotificationService, useValue: notificationService },
      ],
    });
    component = TestBed.inject(ReferenciasComponent);
  }

  it('carga solo las referencias de tipo Personal (filtra las laborales)', () => {
    setup();
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.referencias.length).toBe(1);
    expect(component.referencias[0].nombre).toBe('Ana');
  });

  it('notifica error si falla la carga', () => {
    setup(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('agregar inserta un borrador expandido al inicio, con tipo Personal fijo', () => {
    setup();
    component.ngOnInit();

    component.agregar();

    expect(component.referencias.length).toBe(2);
    const draft = component.referencias[0];
    expect(draft.referenciaId).toBe(0);
    expect(draft.expanded).toBeTrue();
    expect(draft.form.tipoReferencia).toBe('Personal');
  });

  describe('cabecera (titulo / subtitulo)', () => {
    it('para una referencia persistida y colapsada, usa los datos guardados', () => {
      setup();
      component.ngOnInit();
      const ref = component.referencias[0];

      expect(component.tituloCabecera(ref)).toBe('Ana Gómez');
      expect(component.subtituloCabecera(ref)).toBe('Gerente — Acme');
    });

    it('para una referencia expandida, usa los datos del form aunque no esten guardados', () => {
      setup();
      component.ngOnInit();
      const ref = component.referencias[0];
      ref.expanded = true;
      ref.form = { ...ref.form, nombre: 'Editado', apellido: '', cargo: 'Director', empresa: '' };

      expect(component.tituloCabecera(ref)).toBe('Editado');
      expect(component.subtituloCabecera(ref)).toBe('Director');
    });

    it('un borrador sin nombre muestra "Nueva referencia" y "—" de subtitulo', () => {
      setup();
      component.ngOnInit();
      component.agregar();
      const draft = component.referencias[0];

      expect(component.tituloCabecera(draft)).toBe('Nueva referencia');
      expect(component.subtituloCabecera(draft)).toBe('—');
    });
  });

  describe('guardar', () => {
    it('avisa y no llama al backend si el nombre esta vacio', () => {
      setup();
      component.ngOnInit();
      component.agregar();

      component.guardar(component.referencias[0]);

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.createReferencia).not.toHaveBeenCalled();
    });

    it('avisa y no llama al backend si el email es invalido', () => {
      setup();
      component.ngOnInit();
      component.agregar();
      const draft = component.referencias[0];
      draft.form.nombre = 'Juan';
      draft.form.email = 'invalido';

      component.guardar(draft);

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.createReferencia).not.toHaveBeenCalled();
    });

    it('crea una referencia nueva forzando tipo Personal y experienciaId null', () => {
      const creada: ReferenciaDto = { ...personal, referenciaId: 99, nombre: 'Juan' };
      setup();
      cvEditorService.createReferencia.and.returnValue(of(creada));
      component.ngOnInit();
      component.agregar();
      const draft = component.referencias[0];
      draft.form.nombre = '  Juan  ';

      component.guardar(draft);

      expect(cvEditorService.createReferencia).toHaveBeenCalledWith(
        jasmine.objectContaining({ nombre: 'Juan', tipoReferencia: 'Personal', experienciaId: null })
      );
      expect(draft.referenciaId).toBe(99);
      expect(draft.expanded).toBeFalse();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('actualiza una referencia existente en vez de crearla', () => {
      setup();
      cvEditorService.updateReferencia.and.returnValue(of({ ...personal, nombre: 'Ana actualizada' }));
      component.ngOnInit();
      const ref = component.referencias[0];

      component.guardar(ref);

      expect(cvEditorService.updateReferencia).toHaveBeenCalledWith(1, jasmine.any(Object));
      expect(cvEditorService.createReferencia).not.toHaveBeenCalled();
    });

    it('notifica error si falla el backend', () => {
      setup();
      cvEditorService.updateReferencia.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      component.ngOnInit();

      component.guardar(component.referencias[0]);

      expect(component.guardando).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('cancelar', () => {
    it('quita un borrador sin guardar', () => {
      setup();
      component.ngOnInit();
      component.agregar();

      component.cancelar(component.referencias[0]);

      expect(component.referencias.length).toBe(1);
    });

    it('no hace nada con una referencia ya persistida', () => {
      setup();
      component.ngOnInit();

      component.cancelar(component.referencias[0]);

      expect(component.referencias.length).toBe(1);
    });
  });

  describe('eliminar', () => {
    it('no hace nada con un borrador (referenciaId 0)', () => {
      setup();
      component.ngOnInit();
      component.agregar();

      component.eliminar(component.referencias[0]);

      expect(component.referencias.length).toBe(2);
      expect(cvEditorService.deleteReferencia).not.toHaveBeenCalled();
    });

    it('si se cancela la confirmacion, no llama al backend', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(false);
      component.ngOnInit();

      component.eliminar(component.referencias[0]);

      expect(cvEditorService.deleteReferencia).not.toHaveBeenCalled();
    });

    it('si se confirma, llama deleteReferencia y notifica exito', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      cvEditorService.deleteReferencia.and.returnValue(of(undefined));
      component.ngOnInit();

      component.eliminar(component.referencias[0]);

      expect(cvEditorService.deleteReferencia).toHaveBeenCalledWith(1);
      expect(component.referencias.length).toBe(0);
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('notifica error si falla el borrado', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      cvEditorService.deleteReferencia.and.returnValue(throwError(() => new Error('boom')));
      component.ngOnInit();

      component.eliminar(component.referencias[0]);

      expect(notificationService.error).toHaveBeenCalled();
    });
  });
});
