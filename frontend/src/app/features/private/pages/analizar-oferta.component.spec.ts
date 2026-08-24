import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AnalizarOfertaComponent } from './analizar-oferta.component';
import { NotificationService } from '../../../core/services/shared/notification.service';
import {
  OfertaService,
  OfertaDto,
  OfertaAnalizadaDto,
  PerfilSugeridoDto,
  CorreoBorradorDto,
} from '../../../core/services/private/oferta.service';
import { CvEditorService, PerfilDto, PersonalesDto } from '../../../core/services/private/cv-editor.service';
import { CvGeneradoService, CvGeneradoDto } from '../../../core/services/private/cv-generado.service';

describe('AnalizarOfertaComponent', () => {
  let component: AnalizarOfertaComponent;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let ofertaService: jasmine.SpyObj<OfertaService>;
  let cvEditorService: jasmine.SpyObj<CvEditorService>;
  let cvGeneradoService: jasmine.SpyObj<CvGeneradoService>;

  function ofertaDto(over: Partial<OfertaDto> = {}): OfertaDto {
    return {
      ofertaId: 1,
      cargo: 'Analista de Datos',
      empresa: 'Compañía de Seguros del Sur',
      descripcion: null,
      correoReclutador: null,
      nombreReclutador: null,
      textoOriginal: 'Texto original de la oferta.',
      origenEntrada: 'texto',
      estado: 'Analizada',
      perfilId: null,
      fechaAnalisis: '2026-08-12T00:00:00Z',
      fechaEnvioCorreo: null,
      ...over,
    };
  }

  function ofertaAnalizadaDto(over: Partial<OfertaAnalizadaDto> = {}): OfertaAnalizadaDto {
    return {
      cargo: 'Desarrollador Backend .NET',
      empresa: 'Grupo Bancario Andino',
      descripcion: 'Desarrollo y mantenimiento de microservicios.',
      correoReclutador: null,
      nombreReclutador: null,
      textoOriginal: 'Texto analizado',
      origenEntrada: 'texto',
      promptPorDefecto: false,
      ...over,
    };
  }

  function perfilSugeridoDto(over: Partial<PerfilSugeridoDto> = {}): PerfilSugeridoDto {
    return {
      perfilId: 3,
      perfilNombre: 'Backend .NET',
      razon: 'Coincide en tecnología.',
      promptPorDefecto: false,
      ...over,
    };
  }

  function correoBorradorDto(over: Partial<CorreoBorradorDto> = {}): CorreoBorradorDto {
    return {
      asunto: 'Postulación -- Backend .NET',
      cuerpo: 'Estimado reclutador, escribo para postularme...',
      promptPorDefecto: false,
      ...over,
    };
  }

  function cvGeneradoDto(over: Partial<CvGeneradoDto> = {}): CvGeneradoDto {
    return {
      cvGeneradoId: 1,
      perfilId: 3,
      perfilNombre: 'Backend .NET',
      contenido: { experiencia: [], educacion: [], proyectos: [], habilidades: [] },
      fechaGeneracion: '2026-08-20T00:00:00Z',
      promptPorDefecto: false,
      ...over,
    };
  }

  function perfilDto(over: Partial<PerfilDto> = {}): PerfilDto {
    return {
      perfilId: 1,
      nombrePerfil: 'Backend .NET',
      descripcionPerfil: null,
      experienciaPerfilAnios: null,
      aspiracionSalarialPesos: null,
      aspiracionSalarialDolares: null,
      esActivo: true,
      mostrarExperienciaPerfil: true,
      mostrarAspiracionSalarial: true,
      ...over,
    };
  }

  function personalesDto(over: Partial<PersonalesDto> = {}): PersonalesDto {
    return {
      personalesId: 1, curriculumId: 2, tipoIdentificacion: null, numeroDocumento: null,
      fechaExpedicion: null, lugarExpedicion: null, libretaMilitarNumero: null, libretaMilitarClase: null,
      pasaporteNumero: null, pasaporteVigencia: null, visaNumero: null, visaVigencia: null, visaClase: null,
      primerNombre: 'Ana', segundoNombre: null, primerApellido: 'Ríos', segundoApellido: null,
      fechaNacimiento: null, lugarNacimiento: null, genero: null, nacionalidad: null, tipoSangre: null,
      eps: null, pencion: null, cesantias: null, email: 'ana@example.com', celular: '3001234567', telefonoFijo: null,
      pais: 'Colombia', departamento: null, ciudad: 'Bogotá', barrio: null, codigoPostal: null, direccion: null,
      tipoResidencia: null, fotoUrl: null,
      ...over,
    } as PersonalesDto;
  }

  function setup(
    getOfertasResult = of([ofertaDto()]),
    getPerfilesResult = of<PerfilDto[]>([]),
    cvsGeneradosResult = of<CvGeneradoDto[]>([cvGeneradoDto()]),
  ): void {
    ofertaService = jasmine.createSpyObj('OfertaService', [
      'getOfertas', 'crearOferta', 'actualizarOferta', 'eliminarOferta',
      'analizarOferta', 'seleccionarPerfil', 'redactarCorreo', 'enviarCorreo',
    ]);
    ofertaService.getOfertas.and.returnValue(getOfertasResult);
    ofertaService.analizarOferta.and.returnValue(of(ofertaAnalizadaDto()));
    ofertaService.seleccionarPerfil.and.returnValue(of(perfilSugeridoDto()));
    ofertaService.redactarCorreo.and.returnValue(of(correoBorradorDto()));

    cvEditorService = jasmine.createSpyObj('CvEditorService', ['getPerfiles', 'getPersonales']);
    cvEditorService.getPerfiles.and.returnValue(getPerfilesResult);
    cvEditorService.getPersonales.and.returnValue(of(personalesDto()));

    cvGeneradoService = jasmine.createSpyObj('CvGeneradoService', ['listar', 'generar']);
    cvGeneradoService.listar.and.returnValue(cvsGeneradosResult);

    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      providers: [
        AnalizarOfertaComponent,
        { provide: OfertaService, useValue: ofertaService },
        { provide: CvEditorService, useValue: cvEditorService },
        { provide: CvGeneradoService, useValue: cvGeneradoService },
        { provide: NotificationService, useValue: notificationService },
      ],
    });
    component = TestBed.inject(AnalizarOfertaComponent);
  }

  it('arranca en el paso historial, cargando, sin poder analizar sin texto ni archivo', () => {
    setup();
    expect(component.paso).toBe('historial');
    expect(component.loading).toBeTrue();
    expect(component.puedeAnalizar).toBeFalse();
  });

  it('ngOnInit carga el historial de ofertas y los perfiles reales', () => {
    setup(of([ofertaDto()]), of([perfilDto()]));
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.ofertasGuardadas.length).toBe(1);
    expect(component.ofertasGuardadas[0].cargo).toBe('Analista de Datos');
    expect(component.perfiles.length).toBe(1);
  });

  it('ngOnInit notifica error si falla la carga del historial', () => {
    setup(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('permite analizar cuando hay texto pegado', () => {
    setup();
    component.textoOferta = 'Se busca desarrollador...';
    expect(component.puedeAnalizar).toBeTrue();
  });

  it('permite analizar cuando hay un archivo adjunto, sin texto', () => {
    setup();
    component.archivoOferta = new File(['contenido'], 'oferta.png', { type: 'image/png' });
    expect(component.puedeAnalizar).toBeTrue();
  });

  describe('origenEntradaActual', () => {
    it('es "texto" cuando solo hay texto pegado', () => {
      setup();
      component.textoOferta = 'Se busca desarrollador...';
      expect(component.origenEntradaActual).toBe('texto');
    });

    it('es "imagen" cuando solo hay archivo adjunto', () => {
      setup();
      component.archivoOferta = new File(['x'], 'oferta.png', { type: 'image/png' });
      expect(component.origenEntradaActual).toBe('imagen');
    });

    it('es "ambos" cuando hay texto e imagen a la vez', () => {
      setup();
      component.textoOferta = 'Nota complementaria';
      component.archivoOferta = new File(['x'], 'oferta.png', { type: 'image/png' });
      expect(component.origenEntradaActual).toBe('ambos');
    });
  });

  it('onDrop asigna el primer archivo soltado y apaga el estado de arrastre', () => {
    setup();
    const archivo = new File(['x'], 'oferta.jpg', { type: 'image/jpeg' });
    const dataTransfer = { files: [archivo] } as unknown as DataTransfer;
    const preventDefault = jasmine.createSpy('preventDefault');
    const event = { preventDefault, dataTransfer } as unknown as DragEvent;

    component.arrastrando = true;
    component.onDrop(event);

    expect(component.archivoOferta).toBe(archivo);
    expect(component.arrastrando).toBeFalse();
  });

  it('onDrop avisa y no asigna el archivo si el formato no esta soportado', () => {
    setup();
    const archivo = new File(['x'], 'oferta.pdf', { type: 'application/pdf' });
    const dataTransfer = { files: [archivo] } as unknown as DataTransfer;
    const event = { preventDefault: jasmine.createSpy(), dataTransfer } as unknown as DragEvent;

    component.onDrop(event);

    expect(component.archivoOferta).toBeNull();
    expect(notificationService.warning).toHaveBeenCalled();
  });

  it('onArchivoSeleccionado avisa y no asigna el archivo si supera 5 MB', () => {
    setup();
    const contenidoGrande = new Uint8Array(5 * 1024 * 1024 + 1);
    const archivo = new File([contenidoGrande], 'oferta.png', { type: 'image/png' });
    const input = document.createElement('input');
    input.type = 'file';
    const dt = new DataTransfer();
    dt.items.add(archivo);
    input.files = dt.files;

    component.onArchivoSeleccionado({ target: input } as unknown as Event);

    expect(component.archivoOferta).toBeNull();
    expect(notificationService.warning).toHaveBeenCalled();
  });

  describe('onPaste', () => {
    function pasteEventCon(items: { type: string; file: File | null }[]): ClipboardEvent {
      const clipboardItems = items.map(i => ({
        type: i.type,
        getAsFile: () => i.file,
      })) as unknown as DataTransferItemList;
      return { clipboardData: { items: clipboardItems }, preventDefault: jasmine.createSpy('preventDefault') } as unknown as ClipboardEvent;
    }

    it('asigna la imagen pegada cuando esta en el paso entrada, sin importar el texto ya escrito', () => {
      setup();
      component.paso = 'entrada';
      component.textoOferta = 'Nota complementaria pegada antes que la imagen';
      const archivo = new File(['x'], 'captura.png', { type: 'image/png' });
      const event = pasteEventCon([{ type: 'image/png', file: archivo }]);

      component.onPaste(event);

      expect(component.archivoOferta).toBe(archivo);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('ignora el paste si ya no esta en el paso de entrada', () => {
      setup();
      component.paso = 'resultado';
      const archivo = new File(['x'], 'captura.png', { type: 'image/png' });
      const event = pasteEventCon([{ type: 'image/png', file: archivo }]);

      component.onPaste(event);

      expect(component.archivoOferta).toBeNull();
    });

    it('ignora el paste si el portapapeles no trae una imagen', () => {
      setup();
      component.paso = 'entrada';
      const event = pasteEventCon([{ type: 'text/plain', file: null }]);

      component.onPaste(event);

      expect(component.archivoOferta).toBeNull();
    });
  });

  describe('historial de ofertas (CRUD real)', () => {
    it('nuevaOferta limpia el formulario y va al paso entrada', () => {
      setup();
      component.textoOferta = 'algo viejo';
      component.editandoOfertaId = 99;

      component.nuevaOferta();

      expect(component.paso).toBe('entrada');
      expect(component.textoOferta).toBe('');
      expect(component.editandoOfertaId).toBeNull();
    });

    it('editarOferta precarga el formulario, marca el id en edicion y pide sugerencia de perfil si la oferta no tenia uno', () => {
      setup();
      component.ngOnInit();
      const item = component.ofertasGuardadas[0];
      expect(item.perfilId).toBeNull();

      component.editarOferta(item);

      expect(component.paso).toBe('resultado');
      expect(component.oferta.cargo).toBe(item.cargo);
      expect(component.oferta.empresa).toBe(item.empresa);
      expect(component.perfilSugeridoId).toBe(3);
      expect(component.editandoOfertaId).toBe(item.ofertaId);
    });

    it('editarOferta usa directamente el perfil de la oferta si ya tenia uno asignado, sin llamar a la IA', () => {
      setup(undefined, undefined, of([cvGeneradoDto({ perfilId: 7 })]));
      component.ngOnInit();
      const item = component.ofertasGuardadas[0];
      const itemConPerfil = { ...item, estado: 'PerfilAsignado' as const, perfilId: 7 };

      component.editarOferta(itemConPerfil);

      expect(component.perfilSugeridoId).toBe(7);
      expect(ofertaService.seleccionarPerfil).not.toHaveBeenCalled();
    });

    it('editarOferta con perfil ya asignado retoma directo en el borrador de correo (el flujo quedo interrumpido antes de enviar)', () => {
      setup(undefined, undefined, of([cvGeneradoDto({ perfilId: 7 })]));
      ofertaService.redactarCorreo.and.returnValue(of(correoBorradorDto({ asunto: 'Retomado' })));
      component.ngOnInit();
      const item = { ...ofertaDto({ ofertaId: 5 }), estado: 'PerfilAsignado' as const, perfilId: 7 };

      component.editarOferta(item);

      expect(ofertaService.redactarCorreo).toHaveBeenCalledWith(5);
      expect(component.paso).toBe('correo');
      expect(component.correoForm.asunto).toBe('Retomado');
    });

    it('editarOferta con perfil asignado pero sin CV generado todavia va al paso sinCv', () => {
      setup(undefined, undefined, of([]));
      component.ngOnInit();
      const item = { ...ofertaDto({ ofertaId: 5 }), estado: 'PerfilAsignado' as const, perfilId: 7 };

      component.editarOferta(item);

      expect(component.paso).toBe('sinCv');
      expect(ofertaService.redactarCorreo).not.toHaveBeenCalled();
    });

    it('editarOferta con una oferta ya enviada por correo va al paso yaAplicado con la fecha real, sin permitir reenviar', () => {
      setup();
      const item = {
        ...ofertaDto({ ofertaId: 5 }), estado: 'EnviadaPorCorreo' as const, perfilId: 7, fechaEnvioCorreo: '2026-08-20T00:00:00Z',
        modalidad: '100% remoto', stackTecnologico: 'C#, .NET',
      };

      component.editarOferta(item);

      expect(component.paso).toBe('yaAplicado');
      expect(component.fechaEnvioMostrada).not.toBe('');
      expect(ofertaService.redactarCorreo).not.toHaveBeenCalled();
      expect(component.oferta.cargo).toBe(item.cargo);
      expect(component.oferta.modalidad).toBe('100% remoto');
      expect(component.oferta.stackTecnologico).toBe('C#, .NET');
    });

    it('editarOferta limpia los avisos de prompt por defecto (ese dato no viaja con la oferta guardada)', () => {
      setup();
      component.ngOnInit();
      component.promptExtractorPorDefecto = true;
      component.promptSelectorPorDefecto = true;

      component.editarOferta(component.ofertasGuardadas[0]);

      expect(component.promptExtractorPorDefecto).toBeFalse();
      expect(component.promptSelectorPorDefecto).toBeFalse();
    });

    it('eliminarOferta quita la oferta cuando el usuario confirma y el servicio responde bien', () => {
      setup();
      component.ngOnInit();
      spyOn(window, 'confirm').and.returnValue(true);
      ofertaService.eliminarOferta.and.returnValue(of(undefined));
      const item = component.ofertasGuardadas[0];

      component.eliminarOferta(item);

      expect(component.ofertasGuardadas.length).toBe(0);
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('eliminarOferta no hace nada si el usuario cancela la confirmacion', () => {
      setup();
      component.ngOnInit();
      spyOn(window, 'confirm').and.returnValue(false);

      component.eliminarOferta(component.ofertasGuardadas[0]);

      expect(ofertaService.eliminarOferta).not.toHaveBeenCalled();
    });

    it('eliminarOferta notifica error si el servicio falla', () => {
      setup();
      component.ngOnInit();
      spyOn(window, 'confirm').and.returnValue(true);
      ofertaService.eliminarOferta.and.returnValue(throwError(() => new Error('boom')));

      component.eliminarOferta(component.ofertasGuardadas[0]);

      expect(notificationService.error).toHaveBeenCalled();
    });

    it('volverAlHistorial limpia el formulario y regresa al listado', () => {
      setup();
      component.paso = 'resultado';
      component.textoOferta = 'algo';

      component.volverAlHistorial();

      expect(component.paso).toBe('historial');
      expect(component.textoOferta).toBe('');
    });

    it('perfilNombreDe usa la lista real de perfiles', () => {
      setup(of([ofertaDto({ perfilId: 7 })]), of([perfilDto({ perfilId: 7, nombrePerfil: 'Líder Técnico' })]));
      component.ngOnInit();

      expect(component.perfilNombreDe(component.ofertasGuardadas[0])).toBe('Líder Técnico');
    });

    it('perfilNombreDe devuelve "Sin perfil asignado" para ofertas sin perfilId ya avanzadas', () => {
      setup();
      const item = ofertaDto({ perfilId: null, estado: 'PerfilAsignado' });
      expect(component.perfilNombreDe(item)).toBe('Sin perfil asignado');
    });
  });

  describe('tieneAtributosDetallados', () => {
    it('es false si ninguno de los atributos detallados esta presente', () => {
      setup();
      expect(component.tieneAtributosDetallados(ofertaDto())).toBeFalse();
    });

    it('es true si al menos un atributo detallado esta presente', () => {
      setup();
      expect(component.tieneAtributosDetallados(ofertaDto({ modalidad: '100% remoto' }))).toBeTrue();
      expect(component.tieneAtributosDetallados(ofertaDto({ stackTecnologico: 'C#, .NET' }))).toBeTrue();
    });
  });

  describe('analizarOferta', () => {
    it('con la respuesta del backend, llena el formulario', () => {
      setup();
      ofertaService.analizarOferta.and.returnValue(of(ofertaAnalizadaDto({ cargo: 'Desarrollador Backend .NET' })));
      component.textoOferta = 'Oferta de ejemplo';

      component.analizarOferta();

      expect(component.analizando).toBeFalse();
      expect(component.paso).toBe('resultado');
      expect(component.oferta.cargo).toBe('Desarrollador Backend .NET');
    });

    it('llena tambien los atributos detallados cuando el backend los devuelve', () => {
      setup();
      ofertaService.analizarOferta.and.returnValue(of(ofertaAnalizadaDto({
        modalidad: '100% remoto', tipoContrato: 'Contractor', moneda: 'USD', duracion: '6 meses',
        horario: 'CST', experienciaRequerida: '3 a 5 años', stackTecnologico: 'C#, .NET', nivelIdioma: 'Inglés B2+',
      })));
      component.textoOferta = 'Oferta de ejemplo';

      component.analizarOferta();

      expect(component.oferta.modalidad).toBe('100% remoto');
      expect(component.oferta.tipoContrato).toBe('Contractor');
      expect(component.oferta.stackTecnologico).toBe('C#, .NET');
      expect(component.oferta.nivelIdioma).toBe('Inglés B2+');
    });

    it('deja los atributos detallados vacios cuando el backend todavia no los devuelve', () => {
      setup();
      ofertaService.analizarOferta.and.returnValue(of(ofertaAnalizadaDto()));
      component.textoOferta = 'Oferta de ejemplo';

      component.analizarOferta();

      expect(component.oferta.modalidad).toBe('');
      expect(component.oferta.stackTecnologico).toBe('');
    });

    it('tras extraer los datos, pide una sugerencia real de perfil con esos mismos datos', () => {
      setup();
      ofertaService.analizarOferta.and.returnValue(
        of(ofertaAnalizadaDto({ cargo: 'Dev', empresa: 'Acme', descripcion: 'Una oferta' }))
      );
      ofertaService.seleccionarPerfil.and.returnValue(
        of(perfilSugeridoDto({ perfilId: 3, perfilNombre: 'Backend .NET', razon: 'Coincide.' }))
      );
      component.textoOferta = 'Oferta de ejemplo';

      component.analizarOferta();

      expect(ofertaService.seleccionarPerfil).toHaveBeenCalledWith({ cargo: 'Dev', empresa: 'Acme', descripcion: 'Una oferta' });
      expect(component.perfilSugeridoId).toBe(3);
      expect(component.perfilSeleccionRazon).toBe('Coincide.');
      expect(component.seleccionandoPerfil).toBeFalse();
    });

    it('si falla la sugerencia de perfil, no bloquea el flujo y deja perfilSugeridoId en null', () => {
      setup();
      ofertaService.seleccionarPerfil.and.returnValue(throwError(() => new Error('boom')));
      component.textoOferta = 'Oferta de ejemplo';

      component.analizarOferta();

      expect(component.paso).toBe('resultado');
      expect(component.perfilSugeridoId).toBeNull();
      expect(component.seleccionandoPerfil).toBeFalse();
      expect(notificationService.warning).toHaveBeenCalled();
    });

    it('llama al servicio con el texto recortado y el archivo actuales', () => {
      setup();
      component.textoOferta = '  Oferta de ejemplo  ';
      const archivo = new File(['x'], 'oferta.png', { type: 'image/png' });
      component.archivoOferta = archivo;

      component.analizarOferta();

      expect(ofertaService.analizarOferta).toHaveBeenCalledWith('Oferta de ejemplo', archivo);
    });

    it('guarda el origenEntrada y textoOriginal devueltos por el backend, sin recalcularlos', () => {
      setup();
      ofertaService.analizarOferta.and.returnValue(
        of(ofertaAnalizadaDto({ origenEntrada: 'ambos', textoOriginal: 'combinado por el backend' }))
      );
      component.textoOferta = 'algo';
      component.archivoOferta = new File(['x'], 'oferta.png', { type: 'image/png' });
      component.analizarOferta();
      ofertaService.crearOferta.and.returnValue(of(ofertaDto({ ofertaId: 9 })));

      component.continuarConPerfil();

      const payload = ofertaService.crearOferta.calls.mostRecent().args[0];
      expect(payload.origenEntrada).toBe('ambos');
      expect(payload.textoOriginal).toBe('combinado por el backend');
    });

    it('marca los campos vacios de la respuesta como dato faltante', () => {
      setup();
      ofertaService.analizarOferta.and.returnValue(of(ofertaAnalizadaDto({ correoReclutador: null })));
      component.textoOferta = 'Oferta de ejemplo';

      component.analizarOferta();

      expect(component.esCampoFaltante(component.oferta.correoReclutador)).toBeTrue();
      expect(component.esCampoFaltante(component.oferta.cargo)).toBeFalse();
    });

    it('guarda promptExtractorPorDefecto segun lo que devuelva el backend', () => {
      setup();
      ofertaService.analizarOferta.and.returnValue(of(ofertaAnalizadaDto({ promptPorDefecto: true })));
      component.textoOferta = 'Oferta de ejemplo';

      component.analizarOferta();

      expect(component.promptExtractorPorDefecto).toBeTrue();
    });

    it('notifica error y reactiva el boton si falla el analisis', () => {
      setup();
      ofertaService.analizarOferta.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'La clave de API no es válida.' } }))
      );
      component.textoOferta = 'Oferta de ejemplo';

      component.analizarOferta();

      expect(component.analizando).toBeFalse();
      expect(notificationService.error).toHaveBeenCalledWith('La clave de API no es válida.');
      expect(ofertaService.seleccionarPerfil).not.toHaveBeenCalled();
    });

    it('no hace nada si aun no se puede analizar', () => {
      setup();
      component.paso = 'entrada';
      component.analizarOferta();
      expect(component.paso).toBe('entrada');
      expect(ofertaService.analizarOferta).not.toHaveBeenCalled();
    });
  });

  describe('continuarConPerfil (guarda la oferta y sigue segun si el perfil ya tiene CV)', () => {
    it('crea la oferta con estado PerfilAsignado y, si el perfil ya tiene CV en Mi CV, redacta el correo', () => {
      setup(undefined, undefined, of([cvGeneradoDto({ perfilId: 3 })]));
      component.ngOnInit();
      component.textoOferta = 'Oferta de ejemplo';
      component.analizarOferta();
      component.perfilSugeridoId = 3;
      component.oferta.correoReclutador = 'reclutador@acme.com';
      component.oferta.modalidad = '100% remoto';
      component.oferta.stackTecnologico = 'C#, .NET';

      const respuesta = ofertaDto({ ofertaId: 5, cargo: component.oferta.cargo, empresa: component.oferta.empresa, estado: 'PerfilAsignado', perfilId: 3 });
      ofertaService.crearOferta.and.returnValue(of(respuesta));
      ofertaService.redactarCorreo.and.returnValue(of(correoBorradorDto({ asunto: 'Postulación', cuerpo: 'Cuerpo del correo.' })));

      component.continuarConPerfil();

      expect(ofertaService.crearOferta).toHaveBeenCalled();
      const payload = ofertaService.crearOferta.calls.mostRecent().args[0];
      expect(payload.cargo).toBe(component.oferta.cargo);
      expect(payload.estado).toBe('PerfilAsignado');
      expect(payload.perfilId).toBe(3);
      expect(payload.modalidad).toBe('100% remoto');
      expect(payload.stackTecnologico).toBe('C#, .NET');
      expect(ofertaService.redactarCorreo).toHaveBeenCalledWith(5);
      expect(component.paso).toBe('correo');
      expect(component.correoForm.destinatario).toBe('reclutador@acme.com');
      expect(component.correoForm.asunto).toBe('Postulación');
      expect(component.guardando).toBeFalse();
    });

    it('si el perfil elegido todavia no tiene CV generado en Mi CV, va al paso sinCv sin llamar a la IA de correo', () => {
      setup(undefined, undefined, of([]));
      component.textoOferta = 'Oferta de ejemplo';
      component.perfilSugeridoId = 3;
      ofertaService.crearOferta.and.returnValue(of(ofertaDto({ ofertaId: 5, estado: 'PerfilAsignado', perfilId: 3 })));

      component.continuarConPerfil();

      expect(component.paso).toBe('sinCv');
      expect(ofertaService.redactarCorreo).not.toHaveBeenCalled();
    });

    it('si todavía no hay un perfil elegido (sin perfiles guardados), no hace nada', () => {
      setup();
      component.textoOferta = 'Oferta de ejemplo';
      component.perfilSugeridoId = null;

      component.continuarConPerfil();

      expect(ofertaService.crearOferta).not.toHaveBeenCalled();
      expect(ofertaService.redactarCorreo).not.toHaveBeenCalled();
    });

    it('actualiza la oferta existente cuando se esta editando', () => {
      setup(undefined, undefined, of([cvGeneradoDto({ perfilId: 3 })]));
      component.ngOnInit();
      const item = component.ofertasGuardadas[0];
      component.editarOferta(item);
      component.perfilSugeridoId = 3;
      component.oferta.cargo = 'Cargo editado';
      const respuesta = ofertaDto({ ...item, cargo: 'Cargo editado', estado: 'PerfilAsignado', perfilId: 3 });
      ofertaService.actualizarOferta.and.returnValue(of(respuesta));

      component.continuarConPerfil();

      expect(ofertaService.actualizarOferta).toHaveBeenCalledWith(item.ofertaId, jasmine.objectContaining({ cargo: 'Cargo editado' }));
      expect(component.paso).toBe('correo');
    });

    it('notifica warning y se queda en resultado si el backend rechaza por duplicado al guardar', () => {
      setup();
      component.paso = 'resultado';
      component.perfilSugeridoId = 3;
      component.oferta = {
        cargo: 'Duplicado', empresa: 'Empresa X', descripcion: '', correoReclutador: '', nombreReclutador: '',
        modalidad: '', tipoContrato: '', moneda: '', duracion: '', horario: '',
        experienciaRequerida: '', stackTecnologico: '', nivelIdioma: '',
      };
      const error = new HttpErrorResponse({
        status: 400, error: { message: 'Ya existe una oferta guardada con el mismo cargo y empresa.' },
      });
      ofertaService.crearOferta.and.returnValue(throwError(() => error));

      component.continuarConPerfil();

      expect(component.paso).toBe('resultado');
      expect(notificationService.warning).toHaveBeenCalledWith('Ya existe una oferta guardada con el mismo cargo y empresa.');
      expect(ofertaService.redactarCorreo).not.toHaveBeenCalled();
    });
  });

  describe('redactarCorreo / enviarCorreo', () => {
    it('redactarCorreo notifica error y no cambia de paso si falla', () => {
      setup(undefined, undefined, of([cvGeneradoDto({ perfilId: 3 })]));
      component.ngOnInit();
      component.textoOferta = 'Oferta de ejemplo';
      component.perfilSugeridoId = 3;
      ofertaService.crearOferta.and.returnValue(of(ofertaDto({ ofertaId: 5, estado: 'PerfilAsignado', perfilId: 3 })));
      ofertaService.redactarCorreo.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'No se pudo redactar el correo.' } }))
      );

      component.continuarConPerfil();

      expect(component.paso).not.toBe('correo');
      expect(notificationService.error).toHaveBeenCalledWith('No se pudo redactar el correo.');
    });

    it('enviarCorreo avisa si falta el destinatario', () => {
      setup();
      (component as any).ofertaEnProgresoId = 5;
      component.correoForm = { destinatario: '', asunto: 'Postulación', cuerpo: 'Cuerpo' };

      component.enviarCorreo();

      expect(notificationService.warning).toHaveBeenCalled();
      expect(ofertaService.enviarCorreo).not.toHaveBeenCalled();
    });

    it('enviarCorreo envía el correo, recarga el historial y pasa al paso enviado', () => {
      setup();
      (component as any).ofertaEnProgresoId = 5;
      component.correoForm = { destinatario: 'reclutador@acme.com', asunto: 'Postulación', cuerpo: 'Cuerpo' };
      ofertaService.enviarCorreo.and.returnValue(of(ofertaDto({ ofertaId: 5, estado: 'EnviadaPorCorreo' })));

      component.enviarCorreo();

      expect(ofertaService.enviarCorreo).toHaveBeenCalledWith(5, {
        destinatario: 'reclutador@acme.com', asunto: 'Postulación', cuerpo: 'Cuerpo',
      });
      expect(component.enviandoCorreo).toBeFalse();
      expect(component.paso).toBe('enviado');
      expect(ofertaService.getOfertas).toHaveBeenCalled();
    });

    it('enviarCorreo notifica error y se queda en el paso correo si falla (permite reintentar)', () => {
      setup();
      (component as any).ofertaEnProgresoId = 5;
      component.paso = 'correo';
      component.correoForm = { destinatario: 'reclutador@acme.com', asunto: 'Postulación', cuerpo: 'Cuerpo' };
      ofertaService.enviarCorreo.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'No se pudo enviar el correo.' } }))
      );

      component.enviarCorreo();

      expect(component.enviandoCorreo).toBeFalse();
      expect(component.paso).toBe('correo');
      expect(notificationService.error).toHaveBeenCalledWith('No se pudo enviar el correo.');
    });
  });

  it('remitenteEmail toma el correo de Informacion Personal', () => {
    setup();
    component.ngOnInit();
    expect(component.remitenteEmail).toBe('ana@example.com');
  });

  it('volverAEditar regresa al paso resultado', () => {
    setup();
    component.paso = 'correo';
    component.volverAEditar();
    expect(component.paso).toBe('resultado');
  });

  it('reiniciar vuelve al historial y limpia el formulario y el correo', () => {
    setup();
    component.paso = 'correo';
    component.textoOferta = 'algo';
    component.perfilSugeridoId = 3;
    component.correoForm = { destinatario: 'x@example.com', asunto: 'a', cuerpo: 'b' };

    component.reiniciar();

    expect(component.paso).toBe('historial');
    expect(component.textoOferta).toBe('');
    expect(component.perfilSugeridoId).toBeNull();
    expect(component.correoForm).toEqual({ destinatario: '', asunto: '', cuerpo: '' });
  });
});
