import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { EducacionComponent } from './educacion.component';
import { CvEditorService, FormacionDto } from '../../../core/services/private/cv-editor.service';
import { NotificationService } from '../../../core/services/shared/notification.service';

describe('EducacionComponent', () => {
  let component: EducacionComponent;
  let cvEditorService: jasmine.SpyObj<CvEditorService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const pregrado: FormacionDto = {
    formacionId: 1,
    titulo: 'Ingeniería de Sistemas',
    institucion: 'Universidad de los Andes',
    area: 'Ingeniería de Software',
    fechaInicio: '2015-01-01',
    fechaFin: '2019-12-01',
    tipoFormacion: 'Pregrado',
    descripcion: null,
    adjuntoSoporte: null,
    fechaVigencia: null,
    duracionHoras: null,
    mostrarEnCv: true,
  };

  function setup(getResult = of([{ ...pregrado }])): void {
    cvEditorService = jasmine.createSpyObj('CvEditorService', [
      'getFormaciones', 'createFormacion', 'updateFormacion', 'deleteFormacion', 'updateFormacionVisibilidad',
    ]);
    cvEditorService.getFormaciones.and.returnValue(getResult);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      providers: [
        EducacionComponent,
        { provide: CvEditorService, useValue: cvEditorService },
        { provide: NotificationService, useValue: notificationService },
      ],
    });
    component = TestBed.inject(EducacionComponent);
  }

  it('carga formaciones al inicializar, colapsadas', () => {
    setup();
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.formaciones.length).toBe(1);
    expect(component.formaciones[0].expanded).toBeFalse();
  });

  it('notifica error si falla la carga', () => {
    setup(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('esCertificacion reconoce solo el tipo Certificacion', () => {
    setup();
    expect(component.esCertificacion('Certificacion')).toBeTrue();
    expect(component.esCertificacion('Pregrado')).toBeFalse();
    expect(component.esCertificacion(null)).toBeFalse();
  });

  it('trackByFormacion devuelve el formacionId', () => {
    setup();
    component.ngOnInit();
    expect(component.trackByFormacion(0, component.formaciones[0])).toBe(1);
  });

  describe('etiquetas y placeholders segun el tipo', () => {
    it('usa el vocabulario de certificacion cuando el tipo es Certificacion', () => {
      setup();
      component.ngOnInit();
      const edu = component.formaciones[0];
      edu.form.tipoFormacion = 'Certificacion';

      expect(component.etiquetaTitulo(edu)).toBe('Nombre del certificado');
      expect(component.etiquetaInstitucion(edu)).toBe('Entidad certificadora');
      expect(component.etiquetaFechaInicio(edu)).toBe('Fecha de obtención');
      expect(component.placeholderTitulo(edu)).toContain('AWS');
      expect(component.placeholderInstitucion(edu)).toContain('Amazon');
    });

    it('usa el vocabulario academico para los demas tipos', () => {
      setup();
      component.ngOnInit();
      const edu = component.formaciones[0];

      expect(component.etiquetaTitulo(edu)).toBe('Título obtenido');
      expect(component.etiquetaInstitucion(edu)).toBe('Institución');
      expect(component.etiquetaFechaInicio(edu)).toBe('Fecha inicio');
    });
  });

  it('onHeaderClick alterna expanded salvo que el click venga de un boton', () => {
    setup();
    component.ngOnInit();
    const edu = component.formaciones[0];

    const divEv = { target: document.createElement('div') } as unknown as MouseEvent;
    component.onHeaderClick(edu, divEv);
    expect(edu.expanded).toBeTrue();

    const btn = document.createElement('button');
    const btnEv = { target: btn } as unknown as MouseEvent;
    component.onHeaderClick(edu, btnEv);
    expect(edu.expanded).toBeTrue();
  });

  describe('cabecera (titulo / subtitulo / tipo / rango de fechas)', () => {
    it('colapsada usa los datos guardados', () => {
      setup();
      component.ngOnInit();
      const edu = component.formaciones[0];

      expect(component.tituloCabecera(edu)).toBe('Ingeniería de Sistemas');
      expect(component.subtituloCabecera(edu)).toBe('Universidad de los Andes');
      expect(component.tipoParaCabecera(edu)).toBe('Pregrado');
    });

    it('expandida usa los datos del form aunque no esten guardados', () => {
      setup();
      component.ngOnInit();
      const edu = component.formaciones[0];
      edu.expanded = true;
      edu.form.titulo = 'Editado';

      expect(component.tituloCabecera(edu)).toBe('Editado');
    });

    it('un borrador sin titulo muestra "Nueva formación"', () => {
      setup();
      component.agregar();
      const draft = component.formaciones[0];

      expect(component.tituloCabecera(draft)).toBe('Nueva formación');
      expect(component.subtituloCabecera(draft)).toBe('—');
    });

    it('rangoFechasCabecera muestra el año de obtencion para certificaciones', () => {
      setup(of([{ ...pregrado, tipoFormacion: 'Certificacion', fechaInicio: '2022-03-01', fechaFin: null }]));
      component.ngOnInit();

      expect(component.rangoFechasCabecera(component.formaciones[0])).toBe('2022');
    });

    it('rangoFechasCabecera muestra un rango si inicio y fin difieren', () => {
      setup();
      component.ngOnInit();

      expect(component.rangoFechasCabecera(component.formaciones[0])).toBe('2015 — 2019');
    });

    it('rangoFechasCabecera muestra un solo año si inicio y fin coinciden', () => {
      setup(of([{ ...pregrado, fechaInicio: '2020-01-01', fechaFin: '2020-06-01' }]));
      component.ngOnInit();
      expect(component.rangoFechasCabecera(component.formaciones[0])).toBe('2020');
    });

    it('rangoFechasCabecera es null si no hay ninguna fecha', () => {
      setup(of([{ ...pregrado, fechaInicio: null, fechaFin: null }]));
      component.ngOnInit();
      expect(component.rangoFechasCabecera(component.formaciones[0])).toBeNull();
    });
  });

  describe('onMostrarEnCvChange', () => {
    it('no hace nada para un borrador (formacionId 0)', () => {
      setup();
      component.agregar();

      component.onMostrarEnCvChange(component.formaciones[0], false);

      expect(cvEditorService.updateFormacionVisibilidad).not.toHaveBeenCalled();
    });

    it('no hace nada si ya hay un guardado en curso para esa formacion', () => {
      setup();
      component.ngOnInit();
      const edu = component.formaciones[0];
      component.guardandoVisibilidadFormacionId = edu.formacionId;

      component.onMostrarEnCvChange(edu, false);

      expect(cvEditorService.updateFormacionVisibilidad).not.toHaveBeenCalled();
    });

    it('actualiza y notifica exito', () => {
      setup();
      cvEditorService.updateFormacionVisibilidad.and.returnValue(of({ ...pregrado, mostrarEnCv: false }));
      component.ngOnInit();
      const edu = component.formaciones[0];

      component.onMostrarEnCvChange(edu, false);

      expect(cvEditorService.updateFormacionVisibilidad).toHaveBeenCalledWith(1, { mostrarEnCv: false });
      expect(component.guardandoVisibilidadFormacionId).toBeNull();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('revierte y notifica error si falla el backend', () => {
      setup();
      cvEditorService.updateFormacionVisibilidad.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      component.ngOnInit();
      const edu = component.formaciones[0];

      component.onMostrarEnCvChange(edu, false);

      expect(edu.form.mostrarEnCv).toBeTrue();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('agregar / cancelar', () => {
    it('agrega un borrador expandido con tipo Posgrado por defecto', () => {
      setup();
      component.agregar();

      expect(component.formaciones.length).toBe(1);
      const draft = component.formaciones[0];
      expect(draft.formacionId).toBe(0);
      expect(draft.expanded).toBeTrue();
      expect(draft.form.tipoFormacion).toBe('Posgrado');
    });

    it('avisa si ya hay un borrador pendiente', () => {
      setup();
      component.agregar();

      component.agregar();

      expect(component.formaciones.length).toBe(1);
      expect(notificationService.warning).toHaveBeenCalled();
    });

    it('cancelar quita el borrador pero no toca formaciones persistidas', () => {
      setup();
      component.ngOnInit();
      component.agregar();

      component.cancelar(component.formaciones[0]);
      expect(component.formaciones.length).toBe(1);

      component.cancelar(component.formaciones[0]);
      expect(component.formaciones.length).toBe(1);
    });
  });

  describe('guardar', () => {
    it('avisa y no llama al backend si falta el titulo', () => {
      setup();
      component.agregar();
      const draft = component.formaciones[0];
      draft.form.titulo = '';
      draft.form.institucion = 'Alguna';

      component.guardar(draft);

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.createFormacion).not.toHaveBeenCalled();
    });

    it('avisa y no llama al backend si falta la institucion', () => {
      setup();
      component.agregar();
      const draft = component.formaciones[0];
      draft.form.titulo = 'Algo';
      draft.form.institucion = '';

      component.guardar(draft);

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.createFormacion).not.toHaveBeenCalled();
    });

    it('avisa con fecha invalida si fechaInicio no tiene formato valido', () => {
      setup();
      component.agregar();
      const draft = component.formaciones[0];
      draft.form.titulo = 'Algo';
      draft.form.institucion = 'Alguna';
      draft.form.fechaInicio = 'no-es-una-fecha';

      component.guardar(draft);

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.createFormacion).not.toHaveBeenCalled();
    });

    it('crea una formacion nueva con las fechas normalizadas', () => {
      const creada: FormacionDto = { ...pregrado, formacionId: 99 };
      setup();
      cvEditorService.createFormacion.and.returnValue(of(creada));
      component.agregar();
      const draft = component.formaciones[0];
      draft.form.titulo = 'Maestría en IA';
      draft.form.institucion = 'MIT';
      draft.form.fechaInicio = '2023-01-01';
      draft.form.fechaFin = '2024-12-01';

      component.guardar(draft);

      expect(cvEditorService.createFormacion).toHaveBeenCalledWith(jasmine.objectContaining({
        titulo: 'Maestría en IA', institucion: 'MIT', fechaInicio: '2023-01-01', fechaFin: '2024-12-01',
      }));
      expect(draft.formacionId).toBe(99);
      expect(draft.expanded).toBeFalse();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('para certificaciones, ignora fechaFin y usa fechaVigencia', () => {
      setup();
      cvEditorService.createFormacion.and.returnValue(of({ ...pregrado, tipoFormacion: 'Certificacion' }));
      component.agregar();
      const draft = component.formaciones[0];
      draft.form.tipoFormacion = 'Certificacion';
      draft.form.titulo = 'AWS Certified';
      draft.form.institucion = 'AWS';
      draft.form.fechaFin = '2025-01-01';
      draft.form.fechaVigencia = '2027-01-01';

      component.guardar(draft);

      expect(cvEditorService.createFormacion).toHaveBeenCalledWith(jasmine.objectContaining({
        fechaFin: null, fechaVigencia: '2027-01-01',
      }));
    });

    it('actualiza una formacion existente en vez de crearla', () => {
      setup();
      cvEditorService.updateFormacion.and.returnValue(of({ ...pregrado, titulo: 'Actualizado' }));
      component.ngOnInit();

      component.guardar(component.formaciones[0]);

      expect(cvEditorService.updateFormacion).toHaveBeenCalledWith(1, jasmine.any(Object));
      expect(cvEditorService.createFormacion).not.toHaveBeenCalled();
    });

    it('normaliza duracionHoras a entero no negativo', () => {
      setup();
      cvEditorService.updateFormacion.and.returnValue(of(pregrado));
      component.ngOnInit();
      const edu = component.formaciones[0];
      edu.form.duracionHoras = 40.9;

      component.guardar(edu);

      expect(cvEditorService.updateFormacion).toHaveBeenCalledWith(1, jasmine.objectContaining({ duracionHoras: 40 }));
    });

    it('notifica error si falla el backend', () => {
      setup();
      cvEditorService.updateFormacion.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      component.ngOnInit();

      component.guardar(component.formaciones[0]);

      expect(component.guardando).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('eliminar', () => {
    it('no hace nada con un borrador (formacionId 0)', () => {
      setup();
      component.agregar();

      component.eliminar(component.formaciones[0]);

      expect(component.formaciones.length).toBe(1);
      expect(cvEditorService.deleteFormacion).not.toHaveBeenCalled();
    });

    it('si se cancela la confirmacion, no llama al backend', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(false);
      component.ngOnInit();

      component.eliminar(component.formaciones[0]);

      expect(cvEditorService.deleteFormacion).not.toHaveBeenCalled();
    });

    it('si se confirma, llama deleteFormacion y notifica exito', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      cvEditorService.deleteFormacion.and.returnValue(of(undefined));
      component.ngOnInit();

      component.eliminar(component.formaciones[0]);

      expect(cvEditorService.deleteFormacion).toHaveBeenCalledWith(1);
      expect(component.formaciones.length).toBe(0);
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('notifica error si falla el borrado', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      cvEditorService.deleteFormacion.and.returnValue(throwError(() => new Error('boom')));
      component.ngOnInit();

      component.eliminar(component.formaciones[0]);

      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('icono / iconoBg / iconoColor / labelTipo', () => {
    it('devuelven valores conocidos para tipos mapeados', () => {
      setup();
      expect(component.icono('Certificacion')).toBe('bi-patch-check-fill');
      expect(component.iconoBg('Certificacion')).toBe('#fef9c3');
      expect(component.iconoColor('Certificacion')).toBe('#92400e');
      expect(component.labelTipo('Tecnologo')).toBe('Tecnólogo');
    });

    it('caen a los valores por defecto para tipos desconocidos o nulos', () => {
      setup();
      expect(component.icono('Inventado')).toBe('bi-mortarboard-fill');
      expect(component.icono(null)).toBe('bi-mortarboard-fill');
      expect(component.iconoBg(null)).toBe('#f1f5f9');
      expect(component.iconoColor(null)).toBe('#6c757d');
      expect(component.labelTipo(null)).toBe('—');
      expect(component.labelTipo('LegacyValueSinMapear')).toBe('LegacyValueSinMapear');
    });
  });
});
