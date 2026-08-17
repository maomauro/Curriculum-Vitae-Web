import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ProyectosComponent } from './proyectos.component';
import { CvEditorService, ProyectoDto } from '../../../core/services/private/cv-editor.service';
import { NotificationService } from '../../../core/services/shared/notification.service';

describe('ProyectosComponent', () => {
  let component: ProyectosComponent;
  let cvEditorService: jasmine.SpyObj<CvEditorService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const proyecto: ProyectoDto = {
    proyectoId: 1,
    nombreProyecto: 'Portal CV',
    rol: 'Backend',
    equipoTamano: 3,
    duracionMeses: 6,
    stackTecnologico: '.NET, Angular',
    aporte: null,
    logro: null,
    desafio: null,
    mostrarEnCv: true,
  };

  function setup(getResult = of([{ ...proyecto }])): void {
    cvEditorService = jasmine.createSpyObj('CvEditorService', [
      'getProyectos', 'createProyecto', 'updateProyecto', 'deleteProyecto', 'updateProyectoVisibilidad',
    ]);
    cvEditorService.getProyectos.and.returnValue(getResult);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      providers: [
        ProyectosComponent,
        { provide: CvEditorService, useValue: cvEditorService },
        { provide: NotificationService, useValue: notificationService },
      ],
    });
    component = TestBed.inject(ProyectosComponent);
  }

  it('carga proyectos, los mapea a UI y parsea el stack tecnologico en tags', () => {
    setup();
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.proyectos.length).toBe(1);
    expect(component.proyectos[0].stackTags).toEqual(['.NET', 'Angular']);
    expect(component.proyectos[0].form.nombreProyecto).toBe('Portal CV');
  });

  it('notifica error si falla la carga', () => {
    setup(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('trackByProyectoId devuelve el proyectoId', () => {
    setup();
    component.ngOnInit();

    expect(component.trackByProyectoId(0, component.proyectos[0])).toBe(1);
  });

  it('iconClass rota entre los iconos disponibles', () => {
    setup();
    expect(component.iconClass(0)).toBe('bi-kanban-fill');
    expect(component.iconClass(5)).toBe('bi-kanban-fill');
    expect(component.iconClass(1)).toBe('bi-cart4');
  });

  describe('tituloCard / subtituloRol / pillMeses / pillEquipo', () => {
    it('usa el form si tiene valor, si no cae al dato guardado, y "Sin nombre/rol" si ambos estan vacios', () => {
      setup();
      component.ngOnInit();
      const p = component.proyectos[0];

      expect(component.tituloCard(p)).toBe('Portal CV');
      expect(component.subtituloRol(p)).toBe('Backend · Equipo de 3 personas');

      p.form.nombreProyecto = '';
      p.nombreProyecto = null;
      p.form.rol = '';
      p.rol = null;
      p.form.equipoTamano = null;
      expect(component.tituloCard(p)).toBe('Sin nombre');
      expect(component.subtituloRol(p)).toBe('Sin rol');
    });

    it('usa singular cuando el equipo es de 1 persona', () => {
      setup();
      component.ngOnInit();
      const p = component.proyectos[0];
      p.form.equipoTamano = 1;

      expect(component.subtituloRol(p)).toContain('1 persona');
      expect(component.subtituloRol(p)).not.toContain('personas');
    });

    it('pillMeses/pillEquipo devuelven null si no hay valor o es menor a 1', () => {
      setup();
      component.ngOnInit();
      const p = component.proyectos[0];
      p.form.duracionMeses = 0;
      p.form.equipoTamano = null;

      expect(component.pillMeses(p)).toBeNull();
      expect(component.pillEquipo(p)).toBeNull();
    });

    it('pillMeses/pillEquipo pluralizan segun corresponda', () => {
      setup();
      component.ngOnInit();
      const p = component.proyectos[0];
      p.form.duracionMeses = 1;
      p.form.equipoTamano = 3;

      expect(component.pillMeses(p)).toBe('1 mes');
      expect(component.pillEquipo(p)).toBe('3 personas');
    });
  });

  it('toggleExpanded alterna el estado expandido', () => {
    setup();
    component.ngOnInit();
    const p = component.proyectos[0];
    expect(p.expanded).toBeFalse();

    component.toggleExpanded(p);
    expect(p.expanded).toBeTrue();
  });

  describe('onMostrarEnCvChange', () => {
    it('no hace nada para un borrador (proyectoId 0)', () => {
      setup();
      component.agregar();
      const draft = component.borrador!;

      component.onMostrarEnCvChange(draft, false);

      expect(cvEditorService.updateProyectoVisibilidad).not.toHaveBeenCalled();
    });

    it('no hace nada si ya hay un guardado de visibilidad en curso para ese proyecto', () => {
      setup();
      component.ngOnInit();
      const p = component.proyectos[0];
      component.guardandoVisibilidadProyectoId = p.proyectoId;

      component.onMostrarEnCvChange(p, false);

      expect(cvEditorService.updateProyectoVisibilidad).not.toHaveBeenCalled();
    });

    it('actualiza el proyecto y notifica exito', () => {
      setup();
      cvEditorService.updateProyectoVisibilidad.and.returnValue(of({ ...proyecto, mostrarEnCv: false }));
      component.ngOnInit();
      const p = component.proyectos[0];

      component.onMostrarEnCvChange(p, false);

      expect(cvEditorService.updateProyectoVisibilidad).toHaveBeenCalledWith(1, { mostrarEnCv: false });
      expect(component.guardandoVisibilidadProyectoId).toBeNull();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('revierte el switch y notifica error si falla el backend', () => {
      setup();
      cvEditorService.updateProyectoVisibilidad.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      component.ngOnInit();
      const p = component.proyectos[0];

      component.onMostrarEnCvChange(p, false);

      expect(p.form.mostrarEnCv).toBeTrue();
      expect(component.guardandoVisibilidadProyectoId).toBeNull();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('agregar / cancelarBorrador', () => {
    it('crea un borrador vacio con equipo y duracion en 1', () => {
      setup();
      component.agregar();

      expect(component.borrador).not.toBeNull();
      expect(component.borrador!.proyectoId).toBe(0);
      expect(component.borrador!.form.equipoTamano).toBe(1);
      expect(component.borrador!.form.duracionMeses).toBe(1);
    });

    it('avisa si ya hay un borrador pendiente y no lo reemplaza', () => {
      setup();
      component.agregar();
      const primero = component.borrador;

      component.agregar();

      expect(component.borrador).toBe(primero);
      expect(notificationService.warning).toHaveBeenCalled();
    });

    it('cancelarBorrador limpia el borrador', () => {
      setup();
      component.agregar();

      component.cancelarBorrador();

      expect(component.borrador).toBeNull();
    });
  });

  describe('agregarStack / quitarStack', () => {
    it('agrega un tag recortado y limpia el borrador de texto, sin duplicados', () => {
      setup();
      component.ngOnInit();
      const p = component.proyectos[0];
      p.stackDraft = '  Docker  ';

      component.agregarStack(p);
      p.stackDraft = 'Docker';
      component.agregarStack(p);

      expect(p.stackTags.filter(t => t === 'Docker').length).toBe(1);
      expect(p.stackDraft).toBe('');
    });

    it('ignora un stack vacio', () => {
      setup();
      component.ngOnInit();
      const p = component.proyectos[0];
      const before = [...p.stackTags];
      p.stackDraft = '   ';

      component.agregarStack(p);

      expect(p.stackTags).toEqual(before);
    });

    it('quitarStack elimina el tag en el indice dado', () => {
      setup();
      component.ngOnInit();
      const p = component.proyectos[0];

      component.quitarStack(p, 0);

      expect(p.stackTags).toEqual(['Angular']);
    });
  });

  describe('guardar', () => {
    it('avisa y no llama al backend si falta nombre o rol', () => {
      setup();
      component.agregar();
      const draft = component.borrador!;
      draft.form.nombreProyecto = '';

      component.guardar(draft, true);

      expect(notificationService.warning).toHaveBeenCalled();
      expect(cvEditorService.createProyecto).not.toHaveBeenCalled();
    });

    it('crea un proyecto nuevo, lo agrega al inicio de la lista y limpia el borrador', () => {
      const creado: ProyectoDto = { ...proyecto, proyectoId: 99, nombreProyecto: 'Nuevo' };
      setup();
      cvEditorService.createProyecto.and.returnValue(of(creado));
      component.ngOnInit();
      component.agregar();
      const draft = component.borrador!;
      draft.form.nombreProyecto = 'Nuevo';
      draft.form.rol = 'Dev';

      component.guardar(draft, true);

      expect(cvEditorService.createProyecto).toHaveBeenCalled();
      expect(component.proyectos[0].proyectoId).toBe(99);
      expect(component.borrador).toBeNull();
      expect(component.guardando).toBeFalse();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('actualiza un proyecto existente en vez de crearlo', () => {
      setup();
      cvEditorService.updateProyecto.and.returnValue(of({ ...proyecto, nombreProyecto: 'Actualizado' }));
      component.ngOnInit();
      const p = component.proyectos[0];

      component.guardar(p, false);

      expect(cvEditorService.updateProyecto).toHaveBeenCalledWith(1, jasmine.any(Object));
      expect(cvEditorService.createProyecto).not.toHaveBeenCalled();
    });

    it('sincroniza los stackTags al form antes de guardar', () => {
      setup();
      cvEditorService.updateProyecto.and.returnValue(of(proyecto));
      component.ngOnInit();
      const p = component.proyectos[0];
      p.stackTags = ['React', 'Node'];

      component.guardar(p, false);

      expect(cvEditorService.updateProyecto).toHaveBeenCalledWith(1, jasmine.objectContaining({
        stackTecnologico: 'React, Node',
      }));
    });

    it('notifica error si falla el backend al crear', () => {
      setup();
      cvEditorService.createProyecto.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      component.agregar();
      const draft = component.borrador!;
      draft.form.nombreProyecto = 'X';
      draft.form.rol = 'Y';

      component.guardar(draft, true);

      expect(component.guardando).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
    });

    it('notifica error si falla el backend al actualizar', () => {
      setup();
      cvEditorService.updateProyecto.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      component.ngOnInit();

      component.guardar(component.proyectos[0], false);

      expect(component.guardando).toBeFalse();
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('eliminar', () => {
    it('quita un borrador sin confirmar ni llamar al backend', () => {
      setup();
      component.agregar();
      const draft = component.borrador!;
      component.proyectos.push(draft);

      component.eliminar(draft);

      expect(cvEditorService.deleteProyecto).not.toHaveBeenCalled();
    });

    it('si se cancela la confirmacion, no llama al backend', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(false);
      component.ngOnInit();

      component.eliminar(component.proyectos[0]);

      expect(cvEditorService.deleteProyecto).not.toHaveBeenCalled();
    });

    it('si se confirma, llama deleteProyecto y notifica exito', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      cvEditorService.deleteProyecto.and.returnValue(of(undefined));
      component.ngOnInit();

      component.eliminar(component.proyectos[0]);

      expect(cvEditorService.deleteProyecto).toHaveBeenCalledWith(1);
      expect(component.proyectos.length).toBe(0);
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('notifica error si falla el borrado', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      cvEditorService.deleteProyecto.and.returnValue(throwError(() => new Error('boom')));
      component.ngOnInit();

      component.eliminar(component.proyectos[0]);

      expect(notificationService.error).toHaveBeenCalled();
    });
  });
});
