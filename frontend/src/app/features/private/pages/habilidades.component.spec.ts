import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { HabilidadesComponent } from './habilidades.component';
import { CvEditorService, HabilidadDto } from '../../../core/services/private/cv-editor.service';
import { NotificationService } from '../../../core/services/shared/notification.service';

describe('HabilidadesComponent', () => {
  let component: HabilidadesComponent;
  let cvEditorService: jasmine.SpyObj<CvEditorService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const tecnica: HabilidadDto = {
    habilidadId: 1,
    nombre: 'Java',
    tipo: 'Tecnica',
    nivel: 'Avanzado',
    descripcion: null,
    nivelLectura: null,
    nivelEscritura: null,
    nivelEscucha: null,
    nivelHabla: null,
    mostrarEnCv: true,
  };
  const blanda: HabilidadDto = { ...tecnica, habilidadId: 2, nombre: 'Liderazgo', tipo: 'Blanda' };
  const idioma: HabilidadDto = { ...tecnica, habilidadId: 3, nombre: 'Inglés', tipo: 'Idioma' };

  function setup(getHabilidadesResult = of([tecnica, blanda, idioma])): void {
    cvEditorService = jasmine.createSpyObj('CvEditorService', [
      'getHabilidades', 'createHabilidad', 'updateHabilidad', 'updateHabilidadVisibilidad', 'deleteHabilidad',
    ]);
    cvEditorService.getHabilidades.and.returnValue(getHabilidadesResult);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      providers: [
        HabilidadesComponent,
        { provide: CvEditorService, useValue: cvEditorService },
        { provide: NotificationService, useValue: notificationService },
      ],
    });
    component = TestBed.inject(HabilidadesComponent);
  }

  it('carga habilidades al inicializar y las separa por tipo', () => {
    setup();
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.guardadasDe('Tecnica')).toEqual([tecnica]);
    expect(component.guardadasDe('Blanda')).toEqual([blanda]);
    expect(component.guardadasDe('Idioma')).toEqual([idioma]);
  });

  it('notifica error si falla la carga', () => {
    setup(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('define exactamente 3 secciones (Tecnica/Blanda/Idioma)', () => {
    setup();
    expect(component.secciones.map(s => s.tipo)).toEqual(['Tecnica', 'Blanda', 'Idioma']);
  });

  it('el acordeon arranca cerrado y toggleAccordion invierte el estado', () => {
    setup();
    expect(component.isAccordionOpen('Tecnica')).toBeFalse();
    component.toggleAccordion('Tecnica');
    expect(component.isAccordionOpen('Tecnica')).toBeTrue();
    component.toggleAccordion('Tecnica');
    expect(component.isAccordionOpen('Tecnica')).toBeFalse();
  });

  it('onAgregarHabilidadClick abre el acordeon de esa seccion y agrega un borrador', () => {
    setup();
    component.ngOnInit();
    const ev = new Event('click');
    spyOn(ev, 'stopPropagation');

    component.onAgregarHabilidadClick(ev, 'Blanda');

    expect(ev.stopPropagation).toHaveBeenCalled();
    expect(component.isAccordionOpen('Blanda')).toBeTrue();
    expect(component.hayBorradorDe('Blanda')).toBeTrue();
    expect(component.isAccordionOpen('Tecnica')).toBeFalse();
  });

  it('agregarHabilidad no agrega un segundo borrador si ya hay uno pendiente', () => {
    setup();
    component.ngOnInit();
    component.agregarHabilidad('Tecnica');
    component.agregarHabilidad('Tecnica');

    expect(component.tecnicas.filter(h => h.habilidadId === 0).length).toBe(1);
  });

  it('cancelarBorrador quita la fila sin llamar al backend', () => {
    setup();
    component.ngOnInit();
    component.agregarHabilidad('Idioma');
    const draft = component.borradorDe('Idioma');

    component.cancelarBorrador(draft);

    expect(component.hayBorradorDe('Idioma')).toBeFalse();
    expect(cvEditorService.deleteHabilidad).not.toHaveBeenCalled();
  });

  describe('onMostrarEnCvChange', () => {
    it('no hace nada para una habilidad nueva (id 0)', () => {
      setup();
      component.agregarHabilidad('Tecnica');
      const draft = component.borradorDe('Tecnica')!;

      component.onMostrarEnCvChange(draft, false);

      expect(cvEditorService.updateHabilidadVisibilidad).not.toHaveBeenCalled();
    });

    it('no hace nada si ya hay un guardado de visibilidad en curso', () => {
      setup();
      component.ngOnInit();
      const skill = component.guardadasDe('Tecnica')[0];
      component.guardandoVisibilidadHabilidadId = skill.habilidadId;

      component.onMostrarEnCvChange(skill, false);

      expect(cvEditorService.updateHabilidadVisibilidad).not.toHaveBeenCalled();
    });

    it('actualiza y notifica exito', () => {
      setup();
      cvEditorService.updateHabilidadVisibilidad.and.returnValue(of({ ...tecnica, mostrarEnCv: false }));
      component.ngOnInit();

      component.onMostrarEnCvChange(component.guardadasDe('Tecnica')[0], false);

      expect(cvEditorService.updateHabilidadVisibilidad).toHaveBeenCalledWith(1, { mostrarEnCv: false });
      expect(component.guardandoVisibilidadHabilidadId).toBeNull();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('revierte y notifica error si falla el backend', () => {
      setup();
      cvEditorService.updateHabilidadVisibilidad.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      component.ngOnInit();
      const skill = component.guardadasDe('Tecnica')[0];

      component.onMostrarEnCvChange(skill, false);

      expect(skill.mostrarEnCv).toBeTrue();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('activarTodasDe / inactivarTodasDe', () => {
    const tecnicaOculta: HabilidadDto = { ...tecnica, habilidadId: 4, nombre: 'C#', mostrarEnCv: false };

    it('hayOcultasDe/hayVisiblesDe reflejan el estado por seccion', () => {
      setup(of([tecnica, tecnicaOculta, blanda, idioma]));
      component.ngOnInit();

      expect(component.hayOcultasDe('Tecnica')).toBeTrue();
      expect(component.hayVisiblesDe('Tecnica')).toBeTrue();
      expect(component.hayOcultasDe('Blanda')).toBeFalse();
    });

    it('activarTodasDe solo llama al backend para las ocultas de esa seccion', () => {
      setup(of([tecnica, tecnicaOculta, blanda, idioma]));
      cvEditorService.updateHabilidadVisibilidad.and.returnValue(of({ ...tecnicaOculta, mostrarEnCv: true }));
      component.ngOnInit();

      component.activarTodasDe('Tecnica');

      expect(cvEditorService.updateHabilidadVisibilidad).toHaveBeenCalledTimes(1);
      expect(cvEditorService.updateHabilidadVisibilidad).toHaveBeenCalledWith(4, { mostrarEnCv: true });
      expect(component.guardadasDe('Tecnica').every(h => h.mostrarEnCv)).toBeTrue();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('inactivarTodasDe solo llama al backend para las visibles de esa seccion', () => {
      setup(of([tecnica, tecnicaOculta, blanda, idioma]));
      cvEditorService.updateHabilidadVisibilidad.and.returnValue(of({ ...tecnica, mostrarEnCv: false }));
      component.ngOnInit();

      component.inactivarTodasDe('Tecnica');

      expect(cvEditorService.updateHabilidadVisibilidad).toHaveBeenCalledTimes(1);
      expect(cvEditorService.updateHabilidadVisibilidad).toHaveBeenCalledWith(1, { mostrarEnCv: false });
      expect(cvEditorService.updateHabilidadVisibilidad).not.toHaveBeenCalledWith(2, jasmine.any(Object));
    });

    it('no llama al backend si no hay nada que cambiar', () => {
      setup();
      component.ngOnInit();

      component.activarTodasDe('Tecnica');

      expect(cvEditorService.updateHabilidadVisibilidad).not.toHaveBeenCalled();
    });

    it('notifica error si falla el guardado en bloque', () => {
      setup(of([tecnicaOculta]));
      cvEditorService.updateHabilidadVisibilidad.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      component.ngOnInit();

      component.activarTodasDe('Tecnica');

      expect(component.guardandoVisibilidadBloque).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('onSkillFieldCommit (autosave)', () => {
    it('no guarda si el nombre esta vacio', () => {
      setup();
      component.ngOnInit();
      component.agregarHabilidad('Tecnica');
      const draft = component.borradorDe('Tecnica')!;
      draft.nombre = '   ';

      component.onSkillFieldCommit(draft);

      expect(cvEditorService.createHabilidad).not.toHaveBeenCalled();
    });

    it('crea una habilidad nueva (habilidadId 0) y notifica éxito', () => {
      const creada: HabilidadDto = { ...tecnica, habilidadId: 99, nombre: 'Python' };
      setup();
      cvEditorService.createHabilidad.and.returnValue(of(creada));
      component.ngOnInit();
      component.agregarHabilidad('Tecnica');
      const draft = component.borradorDe('Tecnica')!;
      draft.nombre = 'Python';

      component.onSkillFieldCommit(draft);

      expect(cvEditorService.createHabilidad).toHaveBeenCalledTimes(1);
      expect(notificationService.success).toHaveBeenCalled();
      expect(draft.habilidadId).toBe(99);
    });

    it('actualiza una habilidad existente en vez de crearla', () => {
      setup();
      cvEditorService.updateHabilidad.and.returnValue(of({ ...tecnica, nombre: 'Java actualizado' }));
      component.ngOnInit();
      const skill = component.guardadasDe('Tecnica')[0];
      skill.nombre = 'Java actualizado';

      component.onSkillFieldCommit(skill);

      expect(cvEditorService.updateHabilidad).toHaveBeenCalledWith(tecnica.habilidadId, jasmine.any(Object));
      expect(cvEditorService.createHabilidad).not.toHaveBeenCalled();
    });

    it('notifica error si el guardado falla', () => {
      setup();
      cvEditorService.createHabilidad.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      component.ngOnInit();
      component.agregarHabilidad('Tecnica');
      const draft = component.borradorDe('Tecnica')!;
      draft.nombre = 'Rust';

      component.onSkillFieldCommit(draft);

      expect(notificationService.error).toHaveBeenCalled();
    });

    it('no dispara un segundo guardado si el campo no cambio desde la ultima vez guardado', () => {
      setup();
      cvEditorService.updateHabilidad.and.returnValue(of(tecnica));
      component.ngOnInit();
      const skill = component.guardadasDe('Tecnica')[0];

      // cargar() ya marca el estado recien cargado como "sincronizado"; hace falta
      // un cambio real antes de que el primer commit dispare el guardado.
      skill.nombre = 'Java actualizado';
      component.onSkillFieldCommit(skill);
      component.onSkillFieldCommit(skill);

      expect(cvEditorService.updateHabilidad).toHaveBeenCalledTimes(1);
    });
  });

  describe('eliminar', () => {
    it('quita un borrador (habilidadId 0) sin pedir confirmacion ni llamar al backend', () => {
      setup();
      component.ngOnInit();
      component.agregarHabilidad('Idioma');
      const draft = component.borradorDe('Idioma')!;

      component.eliminar(draft);

      expect(component.hayBorradorDe('Idioma')).toBeFalse();
      expect(cvEditorService.deleteHabilidad).not.toHaveBeenCalled();
    });

    it('pide confirmacion para borrar una habilidad guardada; si se cancela, no llama al backend', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(false);
      component.ngOnInit();
      const skill = component.guardadasDe('Tecnica')[0];

      component.eliminar(skill);

      expect(cvEditorService.deleteHabilidad).not.toHaveBeenCalled();
    });

    it('si se confirma, llama deleteHabilidad y notifica éxito', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      cvEditorService.deleteHabilidad.and.returnValue(of(undefined));
      component.ngOnInit();
      const skill = component.guardadasDe('Tecnica')[0];

      component.eliminar(skill);

      expect(cvEditorService.deleteHabilidad).toHaveBeenCalledWith(tecnica.habilidadId);
      expect(notificationService.success).toHaveBeenCalled();
      expect(component.guardadasDe('Tecnica')).toEqual([]);
    });

    it('notifica error si falla el borrado', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      cvEditorService.deleteHabilidad.and.returnValue(throwError(() => new Error('boom')));
      component.ngOnInit();
      const skill = component.guardadasDe('Tecnica')[0];

      component.eliminar(skill);

      expect(notificationService.error).toHaveBeenCalled();
    });
  });
});
