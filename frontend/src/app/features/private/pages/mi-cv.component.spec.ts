import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { MiCvComponent } from './mi-cv.component';
import { CvGeneradoService, CvGeneradoDto } from '../../../core/services/private/cv-generado.service';
import {
  CvEditorService,
  PerfilDto,
  PersonalesDto,
  PresentacionCvDto,
  RedSocialDto,
  VisibilidadSeccionDto,
} from '../../../core/services/private/cv-editor.service';
import { NotificationService } from '../../../core/services/shared/notification.service';

describe('MiCvComponent', () => {
  let component: MiCvComponent;
  let cvGeneradoService: jasmine.SpyObj<CvGeneradoService>;
  let cvEditorService: jasmine.SpyObj<CvEditorService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  function cvGeneradoDto(over: Partial<CvGeneradoDto> = {}): CvGeneradoDto {
    return {
      cvGeneradoId: 1,
      perfilId: 5,
      perfilNombre: 'Arquitecto de Datos',
      contenido: {
        experiencia: [
          { cabecera: 'Arquitecta de Datos -- Acme, 2020-2024', funciones: ['Diseñó el pipeline de analítica.', 'Lideró la migración a Azure.'] },
        ],
        educacion: ['Ingeniería de Sistemas -- Universidad X (2015)'],
        proyectos: ['Data Lake corporativo -- Azure, Spark.'],
        habilidades: [
          { nombre: 'SQL', tipo: 'Tecnica' },
          { nombre: 'Azure Data Factory', tipo: null },
          { nombre: 'Liderazgo', tipo: 'Blanda' },
          { nombre: 'Ingles', tipo: 'Idioma' },
        ],
      },
      fechaGeneracion: '2026-08-20T00:00:00Z',
      promptPorDefecto: false,
      ...over,
    };
  }

  function perfilDto(over: Partial<PerfilDto> = {}): PerfilDto {
    return {
      perfilId: 5, nombrePerfil: 'Arquitecto de Datos', descripcionPerfil: 'Descripción guardada.',
      experienciaPerfilAnios: 5, aspiracionSalarialPesos: 10000000, aspiracionSalarialDolares: 2500, esActivo: true,
      mostrarExperienciaPerfil: true, mostrarAspiracionSalarial: true,
      ...over,
    };
  }

  function personalesDto(): PersonalesDto {
    return {
      personalesId: 1, curriculumId: 2, tipoIdentificacion: null, numeroDocumento: null,
      fechaExpedicion: null, lugarExpedicion: null, libretaMilitarNumero: null, libretaMilitarClase: null,
      pasaporteNumero: null, pasaporteVigencia: null, visaNumero: null, visaVigencia: null, visaClase: null,
      primerNombre: 'Ana', segundoNombre: null, primerApellido: 'Ríos', segundoApellido: null,
      fechaNacimiento: null, lugarNacimiento: null, genero: null, nacionalidad: null, tipoSangre: null,
      eps: null, pencion: null, cesantias: null, email: 'ana@example.com', celular: '3001234567', telefonoFijo: null,
      pais: 'Colombia', departamento: null, ciudad: 'Bogotá', barrio: null, codigoPostal: null, direccion: null,
      tipoResidencia: null, fotoUrl: null,
    } as PersonalesDto;
  }

  function presentacionDto(over: Partial<PresentacionCvDto> = {}): PresentacionCvDto {
    return { plantillaCodigo: 'clasico', experienciaLaboralMesesAcumulados: 0, urlPublica: 'ana-rios', publicado: false, ...over };
  }

  function setup(
    listarPerfilResult = of([cvGeneradoDto()]),
    getPerfilesResult = of([perfilDto()]),
    visibilidadResult = of([] as VisibilidadSeccionDto[])
  ): void {
    cvGeneradoService = jasmine.createSpyObj('CvGeneradoService', ['listar', 'generar']);
    cvGeneradoService.listar.and.returnValue(listarPerfilResult);

    cvEditorService = jasmine.createSpyObj('CvEditorService', [
      'getPerfiles', 'getPersonales', 'getRedesSociales', 'getVisibilidad', 'getPresentacion', 'updatePresentacion',
    ]);
    cvEditorService.getPerfiles.and.returnValue(getPerfilesResult);
    cvEditorService.getPersonales.and.returnValue(of(personalesDto()));
    cvEditorService.getRedesSociales.and.returnValue(of([] as RedSocialDto[]));
    cvEditorService.getVisibilidad.and.returnValue(visibilidadResult);
    cvEditorService.getPresentacion.and.returnValue(of(presentacionDto()));

    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      providers: [
        MiCvComponent,
        { provide: CvGeneradoService, useValue: cvGeneradoService },
        { provide: CvEditorService, useValue: cvEditorService },
        { provide: NotificationService, useValue: notificationService },
      ],
    });
    component = TestBed.inject(MiCvComponent);
  }

  it('ngOnInit carga los perfiles y los CVs por perfil ya generados', () => {
    setup();
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.cvsGenerados.length).toBe(1);
    expect(component.perfiles.length).toBe(1);
  });

  it('ngOnInit notifica error si falla la carga', () => {
    setup(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('trackByCvGenerado devuelve el id', () => {
    setup();
    expect(component.trackByCvGenerado(0, cvGeneradoDto())).toBe(1);
  });

  describe('generarCvDesdePerfil', () => {
    it('no hace nada si no hay perfil seleccionado', () => {
      setup();
      component.perfilSeleccionadoId = null;

      component.generarCvDesdePerfil();

      expect(cvGeneradoService.generar).not.toHaveBeenCalled();
    });

    it('genera el CV, recarga el listado y lo abre (cargando los datos del encabezado)', () => {
      setup();
      component.ngOnInit();
      cvGeneradoService.generar.and.returnValue(of(cvGeneradoDto()));
      component.perfilSeleccionadoId = 5;

      component.generarCvDesdePerfil();

      expect(cvGeneradoService.generar).toHaveBeenCalledWith(5);
      expect(component.generandoCvPerfil).toBeFalse();
      expect(cvGeneradoService.listar).toHaveBeenCalledTimes(2);
      expect(component.cvPerfilAbierto).toEqual(cvGeneradoDto());
      expect(cvEditorService.getPersonales).toHaveBeenCalled();
    });

    it('notifica error si falla la generacion', () => {
      setup();
      cvGeneradoService.generar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      component.perfilSeleccionadoId = 5;

      component.generarCvDesdePerfil();

      expect(component.generandoCvPerfil).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  it('cvExistenteParaPerfilSeleccionado encuentra el CV ya generado para ese perfil', () => {
    setup();
    component.ngOnInit();

    expect(component.cvExistenteParaPerfilSeleccionado).toBeNull();

    component.perfilSeleccionadoId = 5;
    expect(component.cvExistenteParaPerfilSeleccionado?.perfilId).toBe(5);

    component.perfilSeleccionadoId = 999;
    expect(component.cvExistenteParaPerfilSeleccionado).toBeNull();
  });

  it('abrirCvPerfil carga los datos del encabezado solo la primera vez', () => {
    setup();

    component.abrirCvPerfil(cvGeneradoDto());
    expect(component.cvPerfilAbierto).toEqual(cvGeneradoDto());
    expect(cvEditorService.getPersonales).toHaveBeenCalledTimes(1);
    expect(component.plantillaCodigo).toBe('clasico');

    component.abrirCvPerfil(cvGeneradoDto({ cvGeneradoId: 2, perfilId: 9, perfilNombre: 'Backend' }));
    expect(component.cvPerfilAbierto?.perfilId).toBe(9);
    expect(cvEditorService.getPersonales).toHaveBeenCalledTimes(1);
  });

  it('cerrarCv cierra el CV por perfil abierto', () => {
    setup();
    component.abrirCvPerfil(cvGeneradoDto());

    component.cerrarCv();

    expect(component.cvPerfilAbierto).toBeNull();
  });

  describe('encabezado del CV por perfil (datos reales de Personales, no de la IA)', () => {
    it('perfilBaseAbierto es null si no hay ningun CV por perfil abierto', () => {
      setup();
      expect(component.perfilBaseAbierto).toBeNull();
    });

    it('arma nombre, foto, contacto y aspiracion a partir de Personales y del Perfil guardado', () => {
      setup();
      component.ngOnInit();
      component.abrirCvPerfil(cvGeneradoDto());

      expect(component.nombreCompleto).toBe('Ana Ríos');
      expect(component.mostrarEmail).toBeTrue();
      expect(component.telefonoContacto).toBe('3001234567');
      expect(component.ciudadPais).toBe('Bogotá, Colombia');
      expect(component.perfilBaseAbierto?.perfilId).toBe(5);
      expect(component.aspiracionTexto).toContain('COP');
      expect(component.plantillaCodigo).toBe('clasico');
    });

    it('perfilBaseAbierto y aspiracionTexto son null si el perfil ya no esta en la lista cargada', () => {
      setup();
      component.abrirCvPerfil(cvGeneradoDto({ perfilId: 999, perfilNombre: 'Perfil eliminado' }));

      expect(component.perfilBaseAbierto).toBeNull();
      expect(component.aspiracionTexto).toBeNull();
    });

    it('respeta los interruptores de visibilidad de Configuración para foto/email/telefono/ciudad', () => {
      setup(undefined, undefined, of([
        { seccion: 'datos-personales.foto', visible: false },
        { seccion: 'datos-personales.email', visible: false },
      ] as VisibilidadSeccionDto[]));
      component.abrirCvPerfil(cvGeneradoDto());

      expect(component.fotoHeaderUrl).toBeNull();
      expect(component.mostrarEmail).toBeFalse();
      expect(component.mostrarTelefono).toBeTrue();
    });
  });

  it('imprimirCv llama a window.print', () => {
    setup();
    spyOn(window, 'print');

    component.imprimirCv();

    expect(window.print).toHaveBeenCalled();
  });

  describe('habilidadesPorTipo (agrupación para la barra lateral de Corporativo)', () => {
    it('es una lista vacia si no hay ningun CV por perfil abierto', () => {
      setup();
      expect(component.habilidadesPorTipo('tecnica')).toEqual([]);
    });

    it('agrupa por Tecnica/Blanda/Idioma, y sin tipo reconocido cae en tecnica', () => {
      setup();
      component.abrirCvPerfil(cvGeneradoDto());

      expect(component.habilidadesPorTipo('tecnica')).toEqual(['SQL', 'Azure Data Factory']);
      expect(component.habilidadesPorTipo('blanda')).toEqual(['Liderazgo']);
      expect(component.habilidadesPorTipo('idioma')).toEqual(['Ingles']);
    });
  });

  describe('selector de plantilla (mismo control que Información Profesional)', () => {
    it('onPlantillaSelect cambia la plantilla en memoria sin guardar', () => {
      setup();
      component.abrirCvPerfil(cvGeneradoDto());

      component.onPlantillaSelect('profesional');

      expect(component.plantillaCodigo).toBe('profesional');
      expect(component.hayCambiosPlantilla).toBeTrue();
      expect(cvEditorService.updatePresentacion).not.toHaveBeenCalled();
    });

    it('guardarPlantilla persiste el cambio y limpia hayCambiosPlantilla', () => {
      setup();
      component.abrirCvPerfil(cvGeneradoDto());
      component.onPlantillaSelect('ejecutivo');
      cvEditorService.updatePresentacion.and.returnValue(of(presentacionDto({ plantillaCodigo: 'ejecutivo' })));

      component.guardarPlantilla();

      expect(cvEditorService.updatePresentacion).toHaveBeenCalledWith({ plantillaCodigo: 'ejecutivo' });
      expect(component.plantillaCodigo).toBe('ejecutivo');
      expect(component.hayCambiosPlantilla).toBeFalse();
      expect(component.savingPlantilla).toBeFalse();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('guardarPlantilla revierte al valor persistido y notifica error si falla', () => {
      setup();
      component.abrirCvPerfil(cvGeneradoDto());
      component.onPlantillaSelect('ejecutivo');
      cvEditorService.updatePresentacion.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      component.guardarPlantilla();

      expect(component.plantillaCodigo).toBe('clasico');
      expect(component.hayCambiosPlantilla).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
    });

    it('revertirPlantilla descarta el cambio en memoria', () => {
      setup();
      component.abrirCvPerfil(cvGeneradoDto());
      component.onPlantillaSelect('ats');

      component.revertirPlantilla();

      expect(component.plantillaCodigo).toBe('clasico');
      expect(component.hayCambiosPlantilla).toBeFalse();
    });
  });
});
