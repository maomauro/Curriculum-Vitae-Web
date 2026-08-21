import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PromptsIaComponent } from './prompts-ia.component';
import {
  PromptIaService,
  PromptIaListItemDto,
  PromptIaVersionDto,
} from '../../../core/services/private/prompt-ia.service';
import { NotificationService } from '../../../core/services/shared/notification.service';

describe('PromptsIaComponent', () => {
  let component: PromptsIaComponent;
  let promptIaService: jasmine.SpyObj<PromptIaService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  function promptItem(over: Partial<PromptIaListItemDto> = {}): PromptIaListItemDto {
    return {
      promptIaId: 1,
      codigo: 'EXTRACTOR_OFERTA',
      nombre: 'Extractor de oferta',
      descripcion: 'Extrae datos de una oferta laboral',
      versionActiva: 2,
      fechaActualizacion: '2026-08-10T12:00:00Z',
      ...over,
    };
  }

  function version(over: Partial<PromptIaVersionDto> = {}): PromptIaVersionDto {
    return {
      promptIaId: 1,
      codigo: 'EXTRACTOR_OFERTA',
      nombre: 'Extractor de oferta',
      descripcion: 'Extrae datos de una oferta laboral',
      rolContexto: 'Eres un asistente que analiza ofertas.',
      tarea: 'Extrae cargo y empresa de {{OFERTA_TEXTO}}.',
      reglas: null,
      formatoSalida: '{}',
      ejemplos: null,
      contenido: '[ROL Y CONTEXTO]\nEres un asistente...',
      version: 2,
      esActivo: true,
      fechaCreacion: '2026-08-10T12:00:00Z',
      ...over,
    };
  }

  function setup(getPromptsResult = of([promptItem()])): void {
    promptIaService = jasmine.createSpyObj('PromptIaService', [
      'getPrompts', 'getVersiones', 'crearPrompt', 'crearVersion', 'activarVersion',
    ]);
    promptIaService.getPrompts.and.returnValue(getPromptsResult);
    promptIaService.getVersiones.and.returnValue(of([version()]));
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      providers: [
        PromptsIaComponent,
        { provide: PromptIaService, useValue: promptIaService },
        { provide: NotificationService, useValue: notificationService },
      ],
    });
    component = TestBed.inject(PromptsIaComponent);
  }

  it('arranca en loading', () => {
    setup();
    expect(component.loading).toBeTrue();
  });

  it('ngOnInit carga los prompts y cierra el acordeon', () => {
    setup();
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.prompts.length).toBe(1);
    expect(component.prompts[0].codigo).toBe('EXTRACTOR_OFERTA');
    expect(component.isPromptAccordionOpen('EXTRACTOR_OFERTA')).toBeFalse();
  });

  it('ngOnInit notifica error si falla la carga', () => {
    setup(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('trackByPrompt devuelve el codigo', () => {
    setup();
    component.ngOnInit();
    expect(component.trackByPrompt(0, component.prompts[0])).toBe('EXTRACTOR_OFERTA');
  });

  describe('abrirNuevo / cancelarNuevo', () => {
    it('abrirNuevo resetea el formulario y lo muestra', () => {
      setup();
      component.formNuevo.nombre = 'algo viejo';

      component.abrirNuevo();

      expect(component.mostrarFormNuevo).toBeTrue();
      expect(component.formNuevo.nombre).toBe('');
      expect(component.errorNuevo).toBeNull();
    });

    it('cancelarNuevo oculta el formulario', () => {
      setup();
      component.abrirNuevo();

      component.cancelarNuevo();

      expect(component.mostrarFormNuevo).toBeFalse();
    });
  });

  describe('cargar', () => {
    it('si se le pasa un codigo, reabre esa tarjeta con su historial en vez de dejar todo colapsado', () => {
      setup();

      component.cargar('EXTRACTOR_OFERTA');

      expect(component.isPromptAccordionOpen('EXTRACTOR_OFERTA')).toBeTrue();
      expect(promptIaService.getVersiones).toHaveBeenCalledWith('EXTRACTOR_OFERTA');
    });

    it('sin codigo, deja todo colapsado (comportamiento por defecto)', () => {
      setup();

      component.cargar();

      expect(component.isPromptAccordionOpen('EXTRACTOR_OFERTA')).toBeFalse();
    });
  });

  describe('togglePromptAccordion', () => {
    it('abre el acordeon y trae el historial la primera vez', () => {
      setup();
      promptIaService.getVersiones.and.returnValue(of([
        version({ version: 2, esActivo: true, rolContexto: 'Rol activo' }),
        version({ version: 1, esActivo: false, rolContexto: 'Rol viejo' }),
      ]));
      component.ngOnInit();
      const p = component.prompts[0];

      component.togglePromptAccordion(p);

      expect(component.isPromptAccordionOpen('EXTRACTOR_OFERTA')).toBeTrue();
      expect(p.historial.length).toBe(2);
      expect(p.form.rolContexto).toBe('Rol activo');
      expect(promptIaService.getVersiones).toHaveBeenCalledWith('EXTRACTOR_OFERTA');
    });

    it('no vuelve a pedir el historial si ya se cargo', () => {
      setup();
      promptIaService.getVersiones.and.returnValue(of([version()]));
      component.ngOnInit();
      const p = component.prompts[0];

      component.togglePromptAccordion(p);
      component.togglePromptAccordion(p);
      component.togglePromptAccordion(p);

      expect(promptIaService.getVersiones).toHaveBeenCalledTimes(1);
    });

    it('cierra el acordeon en el segundo click', () => {
      setup();
      promptIaService.getVersiones.and.returnValue(of([version()]));
      component.ngOnInit();
      const p = component.prompts[0];

      component.togglePromptAccordion(p);
      component.togglePromptAccordion(p);

      expect(component.isPromptAccordionOpen('EXTRACTOR_OFERTA')).toBeFalse();
    });
  });

  describe('crear', () => {
    it('avisa si el codigo esta vacio', () => {
      setup();
      component.abrirNuevo();
      component.formNuevo.nombre = 'Nombre';
      component.formNuevo.rolContexto = 'Rol';
      component.formNuevo.tarea = 'Tarea';
      component.formNuevo.formatoSalida = '{}';

      component.crear();

      expect(notificationService.warning).toHaveBeenCalled();
      expect(promptIaService.crearPrompt).not.toHaveBeenCalled();
    });

    it('avisa si el codigo tiene caracteres invalidos', () => {
      setup();
      component.abrirNuevo();
      component.formNuevo.codigo = 'código con espacios!';
      component.formNuevo.nombre = 'Nombre';
      component.formNuevo.rolContexto = 'Rol';
      component.formNuevo.tarea = 'Tarea';
      component.formNuevo.formatoSalida = '{}';

      component.crear();

      expect(notificationService.warning).toHaveBeenCalled();
      expect(promptIaService.crearPrompt).not.toHaveBeenCalled();
    });

    it('avisa si falta el rol/contexto', () => {
      setup();
      component.abrirNuevo();
      component.formNuevo.codigo = 'CODIGO';
      component.formNuevo.nombre = 'Nombre';
      component.formNuevo.tarea = 'Tarea';
      component.formNuevo.formatoSalida = '{}';

      component.crear();

      expect(notificationService.warning).toHaveBeenCalled();
      expect(promptIaService.crearPrompt).not.toHaveBeenCalled();
    });

    it('crea el prompt, oculta el formulario y recarga la lista', () => {
      setup();
      promptIaService.crearPrompt.and.returnValue(of(version({ version: 1 })));
      component.abrirNuevo();
      component.formNuevo = {
        codigo: 'nuevo_codigo', nombre: 'Nombre', descripcion: '',
        rolContexto: 'Rol', tarea: 'Tarea', reglas: '', formatoSalida: '{}', ejemplos: '',
      };

      component.crear();

      expect(promptIaService.crearPrompt).toHaveBeenCalledWith({
        codigo: 'NUEVO_CODIGO', nombre: 'Nombre', descripcion: null,
        rolContexto: 'Rol', tarea: 'Tarea', reglas: null, formatoSalida: '{}', ejemplos: null,
      });
      expect(component.mostrarFormNuevo).toBeFalse();
      expect(notificationService.success).toHaveBeenCalled();
      expect(promptIaService.getPrompts).toHaveBeenCalled();
    });

    it('notifica error y deja el formulario abierto si falla el backend', () => {
      setup();
      promptIaService.crearPrompt.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
      component.abrirNuevo();
      component.formNuevo = {
        codigo: 'NUEVO', nombre: 'Nombre', descripcion: '',
        rolContexto: 'Rol', tarea: 'Tarea', reglas: '', formatoSalida: '{}', ejemplos: '',
      };

      component.crear();

      expect(component.guardandoNuevo).toBeFalse();
      expect(component.mostrarFormNuevo).toBeTrue();
      expect(component.errorNuevo).toBeTruthy();
    });
  });

  describe('guardarVersion', () => {
    it('avisa si falta la tarea', () => {
      setup();
      component.ngOnInit();
      const p = component.prompts[0];
      p.form.nombre = 'Nombre';
      p.form.rolContexto = 'Rol';
      p.form.formatoSalida = '{}';

      component.guardarVersion(p);

      expect(notificationService.warning).toHaveBeenCalled();
      expect(promptIaService.crearVersion).not.toHaveBeenCalled();
    });

    it('crea una nueva version sobre el codigo existente', () => {
      setup();
      promptIaService.crearVersion.and.returnValue(of(version({ version: 3 })));
      component.ngOnInit();
      const p = component.prompts[0];
      p.form.nombre = 'Nombre editado';
      p.form.rolContexto = 'Rol';
      p.form.tarea = 'Tarea editada';
      p.form.formatoSalida = '{}';

      component.guardarVersion(p);

      expect(promptIaService.crearVersion).toHaveBeenCalledWith('EXTRACTOR_OFERTA', jasmine.objectContaining({
        nombre: 'Nombre editado', tarea: 'Tarea editada',
      }));
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('notifica el error en la tarjeta si falla el backend', () => {
      setup();
      promptIaService.crearVersion.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
      component.ngOnInit();
      const p = component.prompts[0];
      p.form.nombre = 'Nombre';
      p.form.rolContexto = 'Rol';
      p.form.tarea = 'Tarea';
      p.form.formatoSalida = '{}';

      component.guardarVersion(p);

      expect(p.guardando).toBeFalse();
      expect(p.error).toBeTruthy();
    });
  });

  describe('activarVersion', () => {
    it('no hace nada si la versión ya está activa', () => {
      setup();
      component.ngOnInit();

      component.activarVersion(component.prompts[0], version({ esActivo: true }));

      expect(promptIaService.activarVersion).not.toHaveBeenCalled();
    });

    it('pide confirmación y no llama al backend si se cancela', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(false);
      component.ngOnInit();

      component.activarVersion(component.prompts[0], version({ esActivo: false }));

      expect(promptIaService.activarVersion).not.toHaveBeenCalled();
    });

    it('si se confirma, activa la versión y recarga', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      promptIaService.activarVersion.and.returnValue(of(version({ esActivo: true, version: 1 })));
      component.ngOnInit();

      component.activarVersion(component.prompts[0], version({ promptIaId: 5, version: 1, esActivo: false }));

      expect(promptIaService.activarVersion).toHaveBeenCalledWith(5);
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('notifica error si falla la activación', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      promptIaService.activarVersion.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
      component.ngOnInit();

      component.activarVersion(component.prompts[0], version({ esActivo: false }));

      expect(notificationService.error).toHaveBeenCalled();
      expect(component.activandoVersionId).toBeNull();
    });
  });

  describe('toggleVersionExpandida', () => {
    it('alterna la version expandida', () => {
      setup();
      const v = version({ promptIaId: 7 });

      component.toggleVersionExpandida(v);
      expect(component.versionExpandidaId).toBe(7);

      component.toggleVersionExpandida(v);
      expect(component.versionExpandidaId).toBeNull();
    });
  });
});
