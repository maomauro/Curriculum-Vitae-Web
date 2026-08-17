import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DatosPersonalesComponent } from './datos-personales.component';
import { CvEditorService, PersonalesDto } from '../../../core/services/private/cv-editor.service';
import { NotificationService } from '../../../core/services/shared/notification.service';

describe('DatosPersonalesComponent', () => {
  let component: DatosPersonalesComponent;
  let cvEditorService: jasmine.SpyObj<CvEditorService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const personales: PersonalesDto = {
    personalesId: 5, curriculumId: 1, tipoIdentificacion: 'CC', numeroDocumento: '123',
    fechaExpedicion: '2010-01-01', lugarExpedicion: 'Bogotá', libretaMilitarNumero: null, libretaMilitarClase: null,
    pasaporteNumero: null, pasaporteVigencia: null, visaNumero: null, visaVigencia: null, visaClase: null,
    primerNombre: 'Ana', segundoNombre: null, primerApellido: 'Gómez', segundoApellido: null,
    fechaNacimiento: '1990-05-05', lugarNacimiento: null, genero: null, nacionalidad: null, tipoSangre: null,
    eps: null, pencion: null, cesantias: null, email: 'ana@example.com', celular: null, telefonoFijo: null,
    pais: null, departamento: null, ciudad: null, barrio: null, codigoPostal: null, direccion: null,
    tipoResidencia: null, fotoUrl: null,
  };

  function setup(getResult = of({ ...personales })): void {
    cvEditorService = jasmine.createSpyObj('CvEditorService', ['getPersonales', 'upsertPersonales']);
    cvEditorService.getPersonales.and.returnValue(getResult);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      providers: [
        DatosPersonalesComponent,
        { provide: CvEditorService, useValue: cvEditorService },
        { provide: NotificationService, useValue: notificationService },
      ],
    });
    component = TestBed.inject(DatosPersonalesComponent);
  }

  it('carga los datos personales y descarta personalesId/curriculumId', () => {
    setup();
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.p.primerNombre).toBe('Ana');
    expect((component.p as unknown as PersonalesDto).personalesId).toBeUndefined();
  });

  it('si falla la carga, no notifica (formulario en blanco por diseño)', () => {
    setup(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(notificationService.error).not.toHaveBeenCalled();
    expect(notificationService.warning).not.toHaveBeenCalled();
  });

  it('isSectionOpen/toggleSection: como maximo una seccion abierta a la vez', () => {
    setup();
    expect(component.isSectionOpen('basicos')).toBeFalse();

    component.toggleSection('basicos');
    expect(component.isSectionOpen('basicos')).toBeTrue();
    expect(component.isSectionOpen('contacto')).toBeFalse();

    component.toggleSection('contacto');
    expect(component.isSectionOpen('basicos')).toBeFalse();
    expect(component.isSectionOpen('contacto')).toBeTrue();

    component.toggleSection('contacto');
    expect(component.isSectionOpen('contacto')).toBeFalse();
  });

  describe('guardar', () => {
    it('avisa si falta primer nombre o primer apellido', () => {
      setup();
      component.ngOnInit();
      component.p.primerNombre = '  ';

      component.guardar();

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.upsertPersonales).not.toHaveBeenCalled();
    });

    it('avisa si el email esta vacio', () => {
      setup();
      component.ngOnInit();
      component.p.email = '';

      component.guardar();

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.upsertPersonales).not.toHaveBeenCalled();
    });

    it('avisa si el email tiene formato invalido', () => {
      setup();
      component.ngOnInit();
      component.p.email = 'no-es-un-email';

      component.guardar();

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.upsertPersonales).not.toHaveBeenCalled();
    });

    it('avisa con fecha invalida si fechaExpedicion no tiene formato valido', () => {
      setup();
      cvEditorService.upsertPersonales.and.returnValue(of({ ...personales }));
      component.ngOnInit();
      component.p.fechaExpedicion = 'no-es-una-fecha';

      component.guardar();

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.upsertPersonales).not.toHaveBeenCalled();
    });

    it('convierte campos opcionales vacios a null pero conserva nombre/apellido', () => {
      setup();
      cvEditorService.upsertPersonales.and.returnValue(of({ ...personales }));
      component.ngOnInit();
      component.p.lugarExpedicion = '';
      component.p.nacionalidad = '';

      component.guardar();

      expect(cvEditorService.upsertPersonales).toHaveBeenCalledWith(jasmine.objectContaining({
        primerNombre: 'Ana', primerApellido: 'Gómez', lugarExpedicion: null, nacionalidad: null,
      }));
    });

    it('normaliza las fechas antes de enviarlas', () => {
      setup();
      cvEditorService.upsertPersonales.and.returnValue(of({ ...personales }));
      component.ngOnInit();
      component.p.fechaExpedicion = '2010-01-01';
      component.p.fechaNacimiento = '1990-05-05';

      component.guardar();

      expect(cvEditorService.upsertPersonales).toHaveBeenCalledWith(jasmine.objectContaining({
        fechaExpedicion: '2010-01-01', fechaNacimiento: '1990-05-05',
      }));
    });

    it('al guardar con exito, actualiza p, marca guardadoOk y lo apaga a los 3s', fakeAsync(() => {
      setup();
      cvEditorService.upsertPersonales.and.returnValue(of({ ...personales, primerNombre: 'Ana actualizada' }));
      component.ngOnInit();

      component.guardar();

      expect(component.guardando).toBeFalse();
      expect(component.guardadoOk).toBeTrue();
      expect(component.p.primerNombre).toBe('Ana actualizada');
      expect(notificationService.success).toHaveBeenCalled();

      tick(3000);
      expect(component.guardadoOk).toBeFalse();
    }));

    it('notifica error y no rompe si falla el backend', () => {
      setup();
      spyOn(console, 'error');
      cvEditorService.upsertPersonales.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      component.ngOnInit();

      component.guardar();

      expect(component.guardando).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });
});
