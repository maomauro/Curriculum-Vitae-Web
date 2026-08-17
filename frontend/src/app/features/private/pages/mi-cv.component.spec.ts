import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { MiCvComponent } from './mi-cv.component';
import {
  CvEditorService,
  PersonalesDto,
  PerfilDto,
  ExperienciaDto,
  FormacionDto,
  HabilidadDto,
  ProyectoDto,
  RedSocialDto,
  ReferenciaDto,
  VisibilidadSeccionDto,
  PresentacionCvDto,
} from '../../../core/services/private/cv-editor.service';
import { NotificationService } from '../../../core/services/shared/notification.service';

describe('MiCvComponent', () => {
  let component: MiCvComponent;
  let cvEditorService: jasmine.SpyObj<CvEditorService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let routerEvents: Subject<unknown>;

  const presentacion: PresentacionCvDto = {
    plantillaCodigo: 'clasico', experienciaLaboralMesesAcumulados: 18, urlPublica: 'cv-test', publicado: false,
  };
  const visibilidad: VisibilidadSeccionDto[] = [
    { seccion: 'proyectos', visible: false },
    { seccion: 'referencias', visible: true },
  ];
  // Cuando el CV no tiene Personales guardados, el backend devuelve este DTO "vacio"
  // (nunca null: GetPersonalesAsync siempre retorna un objeto, ver CvEditorService.cs).
  const personalesVacio: PersonalesDto = {
    personalesId: 0, curriculumId: 0, tipoIdentificacion: null, numeroDocumento: null,
    fechaExpedicion: null, lugarExpedicion: null, libretaMilitarNumero: null, libretaMilitarClase: null,
    pasaporteNumero: null, pasaporteVigencia: null, visaNumero: null, visaVigencia: null, visaClase: null,
    primerNombre: '', segundoNombre: null, primerApellido: '', segundoApellido: null,
    fechaNacimiento: null, lugarNacimiento: null, genero: null, nacionalidad: null, tipoSangre: null,
    eps: null, pencion: null, cesantias: null, email: null, celular: null, telefonoFijo: null,
    pais: null, departamento: null, ciudad: null, barrio: null, codigoPostal: null, direccion: null,
    tipoResidencia: null, fotoUrl: null,
  };

  function setupCargaOk(overrides: Partial<{
    personales: PersonalesDto; perfiles: PerfilDto[]; experiencias: ExperienciaDto[];
    formaciones: FormacionDto[]; habilidades: HabilidadDto[]; proyectos: ProyectoDto[];
    redes: RedSocialDto[]; referencias: ReferenciaDto[]; visibilidad: VisibilidadSeccionDto[];
    presentacion: PresentacionCvDto;
  }> = {}): void {
    cvEditorService.getPersonales.and.returnValue(of(overrides.personales ?? personalesVacio));
    cvEditorService.getPerfiles.and.returnValue(of(overrides.perfiles ?? []));
    cvEditorService.getExperiencias.and.returnValue(of(overrides.experiencias ?? []));
    cvEditorService.getFormaciones.and.returnValue(of(overrides.formaciones ?? []));
    cvEditorService.getHabilidades.and.returnValue(of(overrides.habilidades ?? []));
    cvEditorService.getProyectos.and.returnValue(of(overrides.proyectos ?? []));
    cvEditorService.getRedesSociales.and.returnValue(of(overrides.redes ?? []));
    cvEditorService.getReferencias.and.returnValue(of(overrides.referencias ?? []));
    cvEditorService.getVisibilidad.and.returnValue(of(overrides.visibilidad ?? visibilidad));
    cvEditorService.getPresentacion.and.returnValue(of(overrides.presentacion ?? presentacion));
  }

  function setup(): void {
    cvEditorService = jasmine.createSpyObj('CvEditorService', [
      'getPersonales', 'getPerfiles', 'getExperiencias', 'getFormaciones', 'getHabilidades',
      'getProyectos', 'getRedesSociales', 'getReferencias', 'getVisibilidad', 'getPresentacion',
      'updatePresentacion',
    ]);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);
    routerEvents = new Subject<unknown>();
    const routerStub = { events: routerEvents.asObservable(), navigate: jasmine.createSpy('navigate') };
    setupCargaOk();

    TestBed.configureTestingModule({
      providers: [
        MiCvComponent,
        { provide: CvEditorService, useValue: cvEditorService },
        { provide: NotificationService, useValue: notificationService },
        { provide: Router, useValue: routerStub },
      ],
    });
    component = TestBed.inject(MiCvComponent);
  }

  it('carga todos los datos del CV y la plantilla persistida al inicializar', () => {
    setup();
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.plantillaCodigo).toBe('clasico');
    expect(component.experienciaLaboralMesesAcumulados).toBe(18);
  });

  it('notifica error si falla la carga', () => {
    setup();
    cvEditorService.getPersonales.and.returnValue(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('recarga los datos cuando la navegacion vuelve a /mi-cv (ignora la primera emision)', () => {
    setup();
    component.ngOnInit();
    cvEditorService.getPersonales.calls.reset();

    routerEvents.next(new NavigationEnd(1, '/otra-ruta', '/otra-ruta'));
    expect(cvEditorService.getPersonales).not.toHaveBeenCalled();

    routerEvents.next(new NavigationEnd(2, '/mi-cv', '/mi-cv'));
    expect(cvEditorService.getPersonales).toHaveBeenCalled();
  });

  it('ngOnDestroy completa el subject de destruccion (no vuelve a recargar tras destruir)', () => {
    setup();
    component.ngOnInit();
    component.ngOnDestroy();
    cvEditorService.getPersonales.calls.reset();

    routerEvents.next(new NavigationEnd(2, '/mi-cv', '/mi-cv'));

    expect(cvEditorService.getPersonales).not.toHaveBeenCalled();
  });

  it('imprimir llama a window.print', () => {
    setup();
    spyOn(window, 'print');

    component.imprimir();

    expect(window.print).toHaveBeenCalled();
  });

  describe('onPlantillaSelect', () => {
    it('cambia la plantilla seleccionada', () => {
      setup();
      component.onPlantillaSelect('profesional');
      expect(component.plantillaCodigo).toBe('profesional');
    });

    it('no hace nada si ya esta guardando', () => {
      setup();
      component.savingPlantilla = true;
      component.onPlantillaSelect('profesional');
      expect(component.plantillaCodigo).toBe('clasico');
    });
  });

  describe('guardarPlantilla', () => {
    it('no hace nada si no hay cambios pendientes', () => {
      setup();
      component.guardarPlantilla();
      expect(cvEditorService.updatePresentacion).not.toHaveBeenCalled();
    });

    it('guarda la nueva plantilla y notifica exito', () => {
      setup();
      cvEditorService.updatePresentacion.and.returnValue(of({ ...presentacion, plantillaCodigo: 'profesional', experienciaLaboralMesesAcumulados: 20 }));
      component.ngOnInit();
      component.onPlantillaSelect('profesional');

      component.guardarPlantilla();

      expect(component.plantillaCodigo).toBe('profesional');
      expect(component.hayCambiosPlantilla).toBeFalse();
      expect(component.experienciaLaboralMesesAcumulados).toBe(20);
      expect(component.savingPlantilla).toBeFalse();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('revierte a la plantilla anterior y notifica error si falla el backend', () => {
      setup();
      cvEditorService.updatePresentacion.and.returnValue(throwError(() => new Error('boom')));
      component.ngOnInit();
      component.onPlantillaSelect('profesional');

      component.guardarPlantilla();

      expect(component.plantillaCodigo).toBe('clasico');
      expect(component.savingPlantilla).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('revertirPlantilla', () => {
    it('descarta la seleccion sin guardar y vuelve a la persistida', () => {
      setup();
      component.ngOnInit();
      component.onPlantillaSelect('profesional');

      component.revertirPlantilla();

      expect(component.plantillaCodigo).toBe('clasico');
    });
  });

  describe('previewVm', () => {
    it('usa "Tu nombre" cuando Personales viene vacio (sin nombre/apellido guardados)', () => {
      setup();
      component.ngOnInit();

      expect(component.previewVm.personales?.nombreCompleto).toBe('Tu nombre');
    });

    it('arma el nombre completo y contacto desde personales', () => {
      const personales = {
        primerNombre: 'Juan', segundoNombre: null, primerApellido: 'Pérez', segundoApellido: 'Ruiz',
        fotoUrl: ' foto.png ', email: ' juan@example.com ', celular: ' 3001234567 ', telefonoFijo: null,
        ciudad: ' Bogotá ', pais: ' Colombia ',
      } as unknown as PersonalesDto;
      setup();
      setupCargaOk({ personales });
      component.ngOnInit();

      expect(component.previewVm.personales).toEqual({
        nombreCompleto: 'Juan Pérez Ruiz',
        fotoUrl: 'foto.png',
        email: 'juan@example.com',
        telefono: '3001234567',
        ciudad: 'Bogotá',
        pais: 'Colombia',
      });
    });

    it('filtra experiencias, formaciones y proyectos con mostrarEnCv en false', () => {
      const experiencias = [{ experienciaId: 1, mostrarEnCv: false }, { experienciaId: 2, mostrarEnCv: true }] as ExperienciaDto[];
      const formaciones = [{ formacionId: 1, mostrarEnCv: false }, { formacionId: 2, mostrarEnCv: true }] as FormacionDto[];
      const proyectos = [{ proyectoId: 1, mostrarEnCv: false }, { proyectoId: 2, mostrarEnCv: true }] as ProyectoDto[];
      setup();
      setupCargaOk({ experiencias, formaciones, proyectos });
      component.ngOnInit();

      expect(component.previewVm.experiencias.length).toBe(1);
      expect(component.previewVm.experiencias[0].experienciaId).toBe(2);
      expect(component.previewVm.formaciones.length).toBe(1);
      expect(component.previewVm.proyectos.length).toBe(1);
    });

    it('solo incluye referencias de tipo Laboral', () => {
      const referencias = [
        { referenciaId: 1, tipoReferencia: 'Personal' },
        { referenciaId: 2, tipoReferencia: 'Laboral' },
        { referenciaId: 3, tipoReferencia: 'LABORAL' },
      ] as ReferenciaDto[];
      setup();
      setupCargaOk({ referencias });
      component.ngOnInit();

      expect(component.previewVm.referenciasLaborales.map(r => r.referenciaId)).toEqual([2, 3]);
    });
  });

  describe('visibilidad', () => {
    it('las secciones "siempre visibles" lo son aunque esten desactivadas en el mapa', () => {
      setup();
      setupCargaOk({ visibilidad: [{ seccion: 'perfil', visible: false }] });
      component.ngOnInit();

      expect(component.visibleSeccion('perfil')).toBeTrue();
      expect(component.visibleSeccion('datos-personales')).toBeTrue();
      expect(component.visibleSeccion('experiencia')).toBeTrue();
      expect(component.visibleSeccion('formacion-academica')).toBeTrue();
    });

    it('una seccion sin entrada en el mapa se considera visible (retrocompatibilidad)', () => {
      setup();
      setupCargaOk({ visibilidad: [] });
      component.ngOnInit();

      expect(component.visibleSeccion('proyectos')).toBeTrue();
    });

    it('respeta el mapa de visibilidad para secciones normales', () => {
      setup();
      component.ngOnInit();

      expect(component.visibleSeccion('proyectos')).toBeFalse();
      expect(component.visibleSeccion('referencias')).toBeTrue();
    });

    it('visibleAtributo exige que la seccion y el atributo esten visibles', () => {
      setup();
      setupCargaOk({ visibilidad: [{ seccion: 'experiencia', visible: true }, { seccion: 'experiencia.funciones', visible: false }] });
      component.ngOnInit();

      expect(component.visibleAtributo('experiencia', 'funciones')).toBeFalse();
    });

    it('visibleAtributoSafe devuelve true si el atributo no esta en el mapa', () => {
      setup();
      setupCargaOk({ visibilidad: [{ seccion: 'experiencia', visible: true }] });
      component.ngOnInit();

      expect(component.visibleAtributoSafe('experiencia', 'funciones')).toBeTrue();
    });

    it('visibleAtributoSafe devuelve false si la seccion no es visible', () => {
      setup();
      setupCargaOk({ visibilidad: [{ seccion: 'proyectos', visible: false }] });
      component.ngOnInit();

      expect(component.visibleAtributoSafe('proyectos', 'aporte')).toBeFalse();
    });

    it('visibleBloqueFormacion usa el bloque especifico si existe, si no cae a "educacion"', () => {
      setup();
      setupCargaOk({ visibilidad: [{ seccion: 'diplomados', visible: false }, { seccion: 'educacion', visible: true }] });
      component.ngOnInit();

      expect(component.visibleBloqueFormacion('diplomados')).toBeFalse();
      expect(component.visibleBloqueFormacion('cursos')).toBeTrue();
    });

    it('visibleDescargarSoporte depende del bloque de formacion y del atributo puntual', () => {
      setup();
      setupCargaOk({ visibilidad: [{ seccion: 'diplomados', visible: false }] });
      component.ngOnInit();

      expect(component.visibleDescargarSoporte('diplomados', 'adjuntoSoporte')).toBeFalse();
    });
  });
});
