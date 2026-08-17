import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ExperienciaComponent } from './experiencia.component';
import { CvEditorService, ExperienciaDto, ReferenciaDto } from '../../../core/services/private/cv-editor.service';
import { NotificationService } from '../../../core/services/shared/notification.service';

describe('ExperienciaComponent', () => {
  let component: ExperienciaComponent;
  let cvEditorService: jasmine.SpyObj<CvEditorService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const empleo: ExperienciaDto = {
    experienciaId: 1, empresa: 'Acme', cargo: 'Backend Developer', sector: null,
    fechaInicio: '2020-01-01', fechaFin: '2022-01-01', tipoContrato: null, motivoRetiro: null,
    funciones: null, esActual: false, mostrarEnCv: true, adjuntoSoporte: null,
    fechaRegistro: '2020-01-01T00:00:00Z',
  };
  const refLaboral: ReferenciaDto = {
    referenciaId: 10, tipoReferencia: 'Laboral', experienciaId: 1, nombre: 'Jefe',
    apellido: 'Directo', email: null, telefono: null, parentesco: null, cargo: 'Gerente', empresa: 'Acme',
    relacion: null, observaciones: null, adjuntoSoporte: null, fechaRegistro: '2020-01-01T00:00:00Z',
  };

  function setup(
    experienciasResult = of([{ ...empleo }]),
    referenciasResult = of([{ ...refLaboral }]),
  ): void {
    cvEditorService = jasmine.createSpyObj('CvEditorService', [
      'getExperiencias', 'getReferencias', 'createExperiencia', 'updateExperiencia', 'deleteExperiencia',
      'updateExperienciaVisibilidad', 'createReferencia', 'updateReferencia', 'deleteReferencia',
    ]);
    cvEditorService.getExperiencias.and.returnValue(experienciasResult);
    cvEditorService.getReferencias.and.returnValue(referenciasResult);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      providers: [
        ExperienciaComponent,
        { provide: CvEditorService, useValue: cvEditorService },
        { provide: NotificationService, useValue: notificationService },
      ],
    });
    component = TestBed.inject(ExperienciaComponent);
  }

  it('carga experiencias y referencias, y resetea borradores/estado de UI de referencias', () => {
    setup();
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.experiencias.length).toBe(1);
    expect(component.referencias.length).toBe(1);
    expect(component.borradoresLaborales).toEqual([]);
  });

  it('notifica error si falla la carga', () => {
    setup(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('trackByExp/trackByRefId devuelven el id correspondiente', () => {
    setup();
    component.ngOnInit();
    expect(component.trackByExp(0, component.experiencias[0])).toBe(1);
    expect(component.trackByRefId(0, component.referencias[0])).toBe(10);
  });

  it('toggleExpAccordion no hace nada para un empleo nuevo (id 0)', () => {
    setup();
    component.agregar();
    const draft = component.experiencias[0];

    component.toggleExpAccordion(draft);

    expect(draft.expanded).toBeTrue();
  });

  it('toggleExpAccordion alterna expanded para empleos persistidos', () => {
    setup();
    component.ngOnInit();
    const exp = component.experiencias[0];
    expect(exp.expanded).toBeFalse();

    component.toggleExpAccordion(exp);
    expect(exp.expanded).toBeTrue();
  });

  it('onEsActualChange limpia fechaFin al marcar "actual"', () => {
    setup();
    component.ngOnInit();
    const exp = component.experiencias[0];
    exp.form.fechaFin = '2022-01-01';

    component.onEsActualChange(exp, true);

    expect(exp.form.fechaFin).toBeNull();
  });

  describe('referencias laborales: borradores', () => {
    it('agregarBorradorLaboral crea un borrador expandido vinculado al empleo', () => {
      setup();
      component.ngOnInit();
      const exp = component.experiencias[0];

      component.agregarBorradorLaboral(exp);

      expect(component.borradoresDeExp(exp).length).toBe(1);
      const b = component.borradoresDeExp(exp)[0];
      expect(b.expanded).toBeTrue();
      expect(b.form.empresa).toBe('Acme');
    });

    it('cancelarBorradorLaboral quita el borrador por clientKey', () => {
      setup();
      component.ngOnInit();
      const exp = component.experiencias[0];
      component.agregarBorradorLaboral(exp);
      const b = component.borradoresDeExp(exp)[0];

      component.cancelarBorradorLaboral(b);

      expect(component.borradoresDeExp(exp).length).toBe(0);
    });

    it('tituloBorradorLaboral/subtituloBorradorLaboral usan valores por defecto si estan vacios', () => {
      setup();
      component.ngOnInit();
      const exp = component.experiencias[0];
      component.agregarBorradorLaboral(exp);
      const b = component.borradoresDeExp(exp)[0];
      b.form.empresa = null;

      expect(component.tituloBorradorLaboral(b)).toBe('Nueva referencia');
      expect(component.subtituloBorradorLaboral(b)).toBe('—');
    });

    it('toggleBorradorHeader ignora el click si viene de un boton', () => {
      setup();
      component.ngOnInit();
      const exp = component.experiencias[0];
      component.agregarBorradorLaboral(exp);
      const b = component.borradoresDeExp(exp)[0];
      b.expanded = true;

      const btnEv = { target: document.createElement('button') } as unknown as MouseEvent;
      component.toggleBorradorHeader(b, btnEv);
      expect(b.expanded).toBeTrue();

      const divEv = { target: document.createElement('div') } as unknown as MouseEvent;
      component.toggleBorradorHeader(b, divEv);
      expect(b.expanded).toBeFalse();
    });

    describe('guardarBorradorLaboral con empleo nuevo (experienciaId 0)', () => {
      it('avisa si falta el nombre, sin tocar el backend', () => {
        setup();
        component.agregar();
        const exp = component.experiencias[0];
        component.agregarBorradorLaboral(exp);
        const b = component.borradoresDeExp(exp)[0];

        component.guardarBorradorLaboral(b, exp);

        expect(notificationService.warning).toHaveBeenCalled();
        expect(cvEditorService.createReferencia).not.toHaveBeenCalled();
        expect(b.committed).toBeFalse();
      });

      it('avisa si el email es invalido', () => {
        setup();
        component.agregar();
        const exp = component.experiencias[0];
        component.agregarBorradorLaboral(exp);
        const b = component.borradoresDeExp(exp)[0];
        b.form.nombre = 'Ana';
        b.form.email = 'invalido';

        component.guardarBorradorLaboral(b, exp);

        expect(notificationService.warning).toHaveBeenCalled();
      });

      it('marca el borrador como comprometido (committed) localmente, sin llamar al backend', () => {
        setup();
        component.agregar();
        const exp = component.experiencias[0];
        component.agregarBorradorLaboral(exp);
        const b = component.borradoresDeExp(exp)[0];
        b.form.nombre = 'Ana';

        component.guardarBorradorLaboral(b, exp);

        expect(b.committed).toBeTrue();
        expect(b.expanded).toBeFalse();
        expect(cvEditorService.createReferencia).not.toHaveBeenCalled();
      });
    });

    describe('guardarBorradorLaboral con empleo existente', () => {
      it('crea la referencia en el backend y la agrega a la lista', () => {
        const creada: ReferenciaDto = { ...refLaboral, referenciaId: 55, nombre: 'Nueva Ref' };
        setup();
        cvEditorService.createReferencia.and.returnValue(of(creada));
        component.ngOnInit();
        const exp = component.experiencias[0];
        component.agregarBorradorLaboral(exp);
        const b = component.borradoresDeExp(exp)[0];
        b.form.nombre = 'Nueva Ref';

        component.guardarBorradorLaboral(b, exp);

        expect(cvEditorService.createReferencia).toHaveBeenCalled();
        expect(component.referencias.some(r => r.referenciaId === 55)).toBeTrue();
        expect(component.borradoresDeExp(exp).length).toBe(0);
        expect(notificationService.success).toHaveBeenCalled();
      });

      it('notifica error si falla el backend', () => {
        setup();
        cvEditorService.createReferencia.and.returnValue(
          throwError(() => new HttpErrorResponse({ status: 500 }))
        );
        component.ngOnInit();
        const exp = component.experiencias[0];
        component.agregarBorradorLaboral(exp);
        const b = component.borradoresDeExp(exp)[0];
        b.form.nombre = 'Nueva Ref';

        component.guardarBorradorLaboral(b, exp);

        expect(component.guardandoRef).toBeFalse();
        expect(notificationService.error).toHaveBeenCalled();
      });
    });
  });

  describe('referencias laborales ya persistidas', () => {
    it('referenciasLaboralesDe devuelve [] para empleos nuevos y filtra por tipo+experienciaId', () => {
      setup();
      component.ngOnInit();

      expect(component.referenciasLaboralesDe(0)).toEqual([]);
      expect(component.referenciasLaboralesDe(1).length).toBe(1);
      expect(component.referenciasLaboralesDe(999)).toEqual([]);
    });

    it('getLaborRefUi crea y reutiliza el mismo estado de UI para la misma referencia', () => {
      setup();
      component.ngOnInit();
      const ref = component.referencias[0];

      const ui1 = component.getLaborRefUi(ref);
      ui1.expanded = true;
      const ui2 = component.getLaborRefUi(ref);

      expect(ui2).toBe(ui1);
      expect(ui2.expanded).toBeTrue();
    });

    it('tituloLaboralCabecera/subtituloLaboralCabecera usan los datos guardados cuando esta colapsada', () => {
      setup();
      component.ngOnInit();
      const ref = component.referencias[0];

      expect(component.tituloLaboralCabecera(ref)).toBe('Jefe Directo');
      expect(component.subtituloLaboralCabecera(ref)).toBe('Gerente — Acme');
    });

    it('guardarReferenciaLaboral avisa si falta el nombre', () => {
      setup();
      component.ngOnInit();
      const ref = component.referencias[0];
      const exp = component.experiencias[0];
      component.getLaborRefUi(ref).form.nombre = '';

      component.guardarReferenciaLaboral(ref, exp);

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.updateReferencia).not.toHaveBeenCalled();
    });

    it('guardarReferenciaLaboral actualiza la referencia y colapsa la tarjeta', () => {
      setup();
      cvEditorService.updateReferencia.and.returnValue(of({ ...refLaboral, nombre: 'Actualizado' }));
      component.ngOnInit();
      const ref = component.referencias[0];
      const exp = component.experiencias[0];

      component.guardarReferenciaLaboral(ref, exp);

      expect(cvEditorService.updateReferencia).toHaveBeenCalledWith(10, jasmine.any(Object));
      expect(component.getLaborRefUi(ref).expanded).toBeFalse();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('guardarReferenciaLaboral notifica error si falla el backend', () => {
      setup();
      cvEditorService.updateReferencia.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      component.ngOnInit();
      const ref = component.referencias[0];
      const exp = component.experiencias[0];

      component.guardarReferenciaLaboral(ref, exp);

      expect(component.guardandoRef).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
    });

    describe('eliminarReferencia', () => {
      it('no llama al backend si se cancela la confirmacion', () => {
        setup();
        spyOn(window, 'confirm').and.returnValue(false);
        component.ngOnInit();

        component.eliminarReferencia(component.referencias[0]);

        expect(cvEditorService.deleteReferencia).not.toHaveBeenCalled();
      });

      it('si se confirma, elimina y notifica exito', () => {
        setup();
        spyOn(window, 'confirm').and.returnValue(true);
        cvEditorService.deleteReferencia.and.returnValue(of(undefined));
        component.ngOnInit();

        component.eliminarReferencia(component.referencias[0]);

        expect(cvEditorService.deleteReferencia).toHaveBeenCalledWith(10);
        expect(component.referencias.length).toBe(0);
        expect(notificationService.success).toHaveBeenCalled();
      });

      it('notifica error si falla el borrado', () => {
        setup();
        spyOn(window, 'confirm').and.returnValue(true);
        cvEditorService.deleteReferencia.and.returnValue(throwError(() => new Error('boom')));
        component.ngOnInit();

        component.eliminarReferencia(component.referencias[0]);

        expect(notificationService.error).toHaveBeenCalled();
      });
    });
  });

  describe('duracionLabel', () => {
    it('vacio si no hay fechaInicio o el empleo es actual', () => {
      setup();
      expect(component.duracionLabel({ ...empleo, fechaInicio: null })).toBe('');
      expect(component.duracionLabel({ ...empleo, esActual: true })).toBe('');
    });

    it('guion si las fechas son invalidas', () => {
      setup();
      expect(component.duracionLabel({ ...empleo, fechaInicio: 'no-es-fecha' })).toBe('—');
    });

    it('muestra meses en singular y plural cuando dura menos de un año', () => {
      setup();
      expect(component.duracionLabel({ ...empleo, fechaInicio: '2022-01-01', fechaFin: '2022-01-15' })).toBe('1 mes');
      expect(component.duracionLabel({ ...empleo, fechaInicio: '2022-01-01', fechaFin: '2022-04-01' })).toBe('3 meses');
    });

    it('muestra años exactos sin resto de meses', () => {
      setup();
      expect(component.duracionLabel({ ...empleo, fechaInicio: '2020-01-01', fechaFin: '2022-01-01' })).toBe('2 años');
    });

    it('muestra años y meses combinados, con singular/plural correcto', () => {
      setup();
      expect(component.duracionLabel({ ...empleo, fechaInicio: '2020-01-01', fechaFin: '2021-02-01' })).toBe('1 año y 1 mes');
      expect(component.duracionLabel({ ...empleo, fechaInicio: '2020-01-01', fechaFin: '2022-06-01' })).toBe('2 años y 5 meses');
    });

    it('sin fechaFin y no actual, usa la fecha de inicio como fin (0 meses)', () => {
      setup();
      expect(component.duracionLabel({ ...empleo, fechaInicio: '2022-01-01', fechaFin: null, esActual: false })).toBe('1 mes');
    });
  });

  describe('onMostrarEnCvChange', () => {
    it('no hace nada para un empleo nuevo (id 0)', () => {
      setup();
      component.agregar();

      component.onMostrarEnCvChange(component.experiencias[0], false);

      expect(cvEditorService.updateExperienciaVisibilidad).not.toHaveBeenCalled();
    });

    it('no hace nada si ya hay un guardado de visibilidad en curso', () => {
      setup();
      component.ngOnInit();
      const exp = component.experiencias[0];
      component.guardandoVisibilidadExpId = exp.experienciaId;

      component.onMostrarEnCvChange(exp, false);

      expect(cvEditorService.updateExperienciaVisibilidad).not.toHaveBeenCalled();
    });

    it('actualiza y notifica exito', () => {
      setup();
      cvEditorService.updateExperienciaVisibilidad.and.returnValue(of({ ...empleo, mostrarEnCv: false }));
      component.ngOnInit();

      component.onMostrarEnCvChange(component.experiencias[0], false);

      expect(cvEditorService.updateExperienciaVisibilidad).toHaveBeenCalledWith(1, { mostrarEnCv: false });
      expect(component.guardandoVisibilidadExpId).toBeNull();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('revierte y notifica error si falla el backend', () => {
      setup();
      cvEditorService.updateExperienciaVisibilidad.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      component.ngOnInit();
      const exp = component.experiencias[0];

      component.onMostrarEnCvChange(exp, false);

      expect(exp.form.mostrarEnCv).toBeTrue();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('agregar / cancelarNuevo', () => {
    it('agrega un borrador con esActual=true por defecto', () => {
      setup();
      component.agregar();

      expect(component.experiencias.length).toBe(1);
      const draft = component.experiencias[0];
      expect(draft.experienciaId).toBe(0);
      expect(draft.form.esActual).toBeTrue();
      expect(draft.expanded).toBeTrue();
    });

    it('avisa si ya hay un borrador pendiente', () => {
      setup();
      component.agregar();

      component.agregar();

      expect(component.experiencias.length).toBe(1);
      expect(notificationService.warning).toHaveBeenCalled();
    });

    it('cancelarNuevo quita el borrador y sus referencias en borrador asociadas', () => {
      setup();
      component.agregar();
      const draft = component.experiencias[0];
      component.agregarBorradorLaboral(draft);

      component.cancelarNuevo(draft);

      expect(component.experiencias.length).toBe(0);
      expect(component.borradoresLaborales.length).toBe(0);
    });

    it('cancelarNuevo no hace nada para un empleo persistido', () => {
      setup();
      component.ngOnInit();

      component.cancelarNuevo(component.experiencias[0]);

      expect(component.experiencias.length).toBe(1);
    });
  });

  describe('guardar', () => {
    it('avisa si falta la empresa', () => {
      setup();
      component.ngOnInit();
      const exp = component.experiencias[0];
      exp.form.empresa = '';

      component.guardar(exp);

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.updateExperiencia).not.toHaveBeenCalled();
    });

    it('avisa si falta el cargo', () => {
      setup();
      component.ngOnInit();
      const exp = component.experiencias[0];
      exp.form.cargo = '';

      component.guardar(exp);

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.updateExperiencia).not.toHaveBeenCalled();
    });

    it('avisa con fecha invalida si fechaInicio no tiene formato valido', () => {
      setup();
      component.ngOnInit();
      const exp = component.experiencias[0];
      exp.form.fechaInicio = 'no-es-fecha';

      component.guardar(exp);

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.updateExperiencia).not.toHaveBeenCalled();
    });

    it('avisa si la fecha esta fuera del rango permitido', () => {
      setup();
      component.ngOnInit();
      const exp = component.experiencias[0];
      exp.form.fechaInicio = '1900-01-01';

      component.guardar(exp);

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.updateExperiencia).not.toHaveBeenCalled();
    });

    it('avisa si fechaFin es anterior a fechaInicio', () => {
      setup();
      component.ngOnInit();
      const exp = component.experiencias[0];
      exp.form.esActual = false;
      exp.form.fechaInicio = '2022-01-01';
      exp.form.fechaFin = '2021-01-01';

      component.guardar(exp);

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.updateExperiencia).not.toHaveBeenCalled();
    });

    it('actualiza un empleo existente', () => {
      setup();
      cvEditorService.updateExperiencia.and.returnValue(of({ ...empleo, cargo: 'Actualizado' }));
      component.ngOnInit();

      component.guardar(component.experiencias[0]);

      expect(cvEditorService.updateExperiencia).toHaveBeenCalledWith(1, jasmine.any(Object));
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('notifica error si falla la actualizacion', () => {
      setup();
      cvEditorService.updateExperiencia.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      component.ngOnInit();

      component.guardar(component.experiencias[0]);

      expect(component.guardando).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
    });

    describe('creacion de un empleo nuevo (experienciaId 0)', () => {
      it('avisa si hay un borrador de referencia sin guardar (no comprometido)', () => {
        setup();
        component.agregar();
        const draft = component.experiencias[0];
        draft.form.empresa = 'Nueva empresa';
        draft.form.cargo = 'Nuevo cargo';
        component.agregarBorradorLaboral(draft);
        component.borradoresDeExp(draft)[0].form.nombre = 'Sin guardar';

        component.guardar(draft);

        expect(notificationService.warning).toHaveBeenCalled();
        expect(cvEditorService.createExperiencia).not.toHaveBeenCalled();
      });

      it('crea el empleo y, si hay referencias comprometidas, las crea en lote', () => {
        const creada: ExperienciaDto = { ...empleo, experienciaId: 77 };
        const refCreada: ReferenciaDto = { ...refLaboral, referenciaId: 88, experienciaId: 77 };
        setup();
        cvEditorService.createExperiencia.and.returnValue(of(creada));
        cvEditorService.createReferencia.and.returnValue(of(refCreada));
        component.agregar();
        const draft = component.experiencias[0];
        draft.form.empresa = 'Nueva empresa';
        draft.form.cargo = 'Nuevo cargo';
        component.agregarBorradorLaboral(draft);
        const b = component.borradoresDeExp(draft)[0];
        b.form.nombre = 'Referencia lista';
        component.guardarBorradorLaboral(b, draft);

        component.guardar(draft);

        expect(cvEditorService.createExperiencia).toHaveBeenCalled();
        expect(draft.experienciaId).toBe(77);
        expect(component.guardando).toBeFalse();
        expect(cvEditorService.createReferencia).toHaveBeenCalledWith(
          jasmine.objectContaining({ experienciaId: 77, nombre: 'Referencia lista' })
        );
        expect(component.referencias.some(r => r.referenciaId === 88)).toBeTrue();
      });

      it('notifica error si falla la creacion del empleo', () => {
        setup();
        cvEditorService.createExperiencia.and.returnValue(
          throwError(() => new HttpErrorResponse({ status: 500 }))
        );
        component.agregar();
        const draft = component.experiencias[0];
        draft.form.empresa = 'Nueva empresa';
        draft.form.cargo = 'Nuevo cargo';

        component.guardar(draft);

        expect(component.guardando).toBeFalse();
        expect(notificationService.error).toHaveBeenCalled();
      });
    });
  });

  describe('eliminar', () => {
    it('para un empleo nuevo (id 0), delega en cancelarNuevo sin pedir confirmacion', () => {
      setup();
      component.agregar();

      component.eliminar(component.experiencias[0]);

      expect(component.experiencias.length).toBe(0);
    });

    it('no llama al backend si se cancela la confirmacion', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(false);
      component.ngOnInit();

      component.eliminar(component.experiencias[0]);

      expect(cvEditorService.deleteExperiencia).not.toHaveBeenCalled();
    });

    it('si se confirma, elimina el empleo y limpia sus referencias asociadas', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      cvEditorService.deleteExperiencia.and.returnValue(of(undefined));
      component.ngOnInit();

      component.eliminar(component.experiencias[0]);

      expect(cvEditorService.deleteExperiencia).toHaveBeenCalledWith(1);
      expect(component.experiencias.length).toBe(0);
      expect(component.referencias.length).toBe(0);
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('notifica error si falla el borrado', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      cvEditorService.deleteExperiencia.and.returnValue(throwError(() => new Error('boom')));
      component.ngOnInit();

      component.eliminar(component.experiencias[0]);

      expect(notificationService.error).toHaveBeenCalled();
    });
  });
});
