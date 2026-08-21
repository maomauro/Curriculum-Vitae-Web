import { HttpErrorResponse } from '@angular/common/http';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AnalizarOfertaComponent } from './analizar-oferta.component';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { OfertaService, OfertaDto } from '../../../core/services/private/oferta.service';

describe('AnalizarOfertaComponent', () => {
  let component: AnalizarOfertaComponent;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let ofertaService: jasmine.SpyObj<OfertaService>;

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
      ...over,
    };
  }

  function setup(getOfertasResult = of([ofertaDto()])): void {
    ofertaService = jasmine.createSpyObj('OfertaService', [
      'getOfertas', 'crearOferta', 'actualizarOferta', 'eliminarOferta',
    ]);
    ofertaService.getOfertas.and.returnValue(getOfertasResult);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      providers: [
        AnalizarOfertaComponent,
        { provide: OfertaService, useValue: ofertaService },
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

  it('ngOnInit carga el historial de ofertas', () => {
    setup();
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.ofertasGuardadas.length).toBe(1);
    expect(component.ofertasGuardadas[0].cargo).toBe('Analista de Datos');
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

  it('permite analizar cuando hay un archivo seleccionado en modo imagen', () => {
    setup();
    component.modoEntrada = 'imagen';
    component.archivoOferta = new File(['contenido'], 'oferta.png', { type: 'image/png' });
    expect(component.puedeAnalizar).toBeTrue();
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

  describe('onPaste', () => {
    function pasteEventCon(items: { type: string; file: File | null }[]): ClipboardEvent {
      const clipboardItems = items.map(i => ({
        type: i.type,
        getAsFile: () => i.file,
      })) as unknown as DataTransferItemList;
      return { clipboardData: { items: clipboardItems }, preventDefault: jasmine.createSpy('preventDefault') } as unknown as ClipboardEvent;
    }

    it('asigna la imagen pegada cuando esta en modo imagen y paso entrada', () => {
      setup();
      component.paso = 'entrada';
      component.modoEntrada = 'imagen';
      const archivo = new File(['x'], 'captura.png', { type: 'image/png' });
      const event = pasteEventCon([{ type: 'image/png', file: archivo }]);

      component.onPaste(event);

      expect(component.archivoOferta).toBe(archivo);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('ignora el paste si esta en modo texto', () => {
      setup();
      component.modoEntrada = 'texto';
      const archivo = new File(['x'], 'captura.png', { type: 'image/png' });
      const event = pasteEventCon([{ type: 'image/png', file: archivo }]);

      component.onPaste(event);

      expect(component.archivoOferta).toBeNull();
    });

    it('ignora el paste si ya no esta en el paso de entrada', () => {
      setup();
      component.modoEntrada = 'imagen';
      component.paso = 'resultado';
      const archivo = new File(['x'], 'captura.png', { type: 'image/png' });
      const event = pasteEventCon([{ type: 'image/png', file: archivo }]);

      component.onPaste(event);

      expect(component.archivoOferta).toBeNull();
    });

    it('ignora el paste si el portapapeles no trae una imagen', () => {
      setup();
      component.paso = 'entrada';
      component.modoEntrada = 'imagen';
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

    it('editarOferta precarga el formulario, el modo de entrada y marca el id en edicion', () => {
      setup();
      component.ngOnInit();
      const item = component.ofertasGuardadas[0];

      component.editarOferta(item);

      expect(component.paso).toBe('resultado');
      expect(component.oferta.cargo).toBe(item.cargo);
      expect(component.oferta.empresa).toBe(item.empresa);
      expect(component.modoEntrada).toBe(item.origenEntrada);
      expect(component.perfilSugeridoId).toBe('nuevo');
      expect(component.editandoOfertaId).toBe(item.ofertaId);
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
  });

  describe('analizarOferta', () => {
    it('tras el analisis simulado, llena el formulario y sugiere un perfil por palabra clave', fakeAsync(() => {
      setup();
      component.modoEntrada = 'imagen';
      component.archivoOferta = new File(['x'], 'oferta.png', { type: 'image/png' });

      component.analizarOferta();
      expect(component.analizando).toBeTrue();
      tick(1200);

      expect(component.analizando).toBeFalse();
      expect(component.paso).toBe('resultado');
      expect(component.oferta.cargo).toBe('Desarrollador Backend .NET');
      expect(component.perfilSugeridoId).toBe(1);
    }));

    it('marca los campos vacios del mock como dato faltante', fakeAsync(() => {
      setup();
      component.textoOferta = 'Oferta de ejemplo';

      component.analizarOferta();
      tick(1200);

      expect(component.esCampoFaltante(component.oferta.correoReclutador)).toBeTrue();
      expect(component.esCampoFaltante(component.oferta.cargo)).toBeFalse();
    }));

    it('si el toggle de "ya aplicado" esta activo, va directo a ese paso y omite el formulario', fakeAsync(() => {
      setup();
      component.textoOferta = 'Oferta de ejemplo';
      component.simularYaAplicado = true;

      component.analizarOferta();
      tick(1200);

      expect(component.paso).toBe('yaAplicado');
      expect(component.fechaAplicacionSimulada).not.toBe('');
    }));

    it('no hace nada si aun no se puede analizar', () => {
      setup();
      component.paso = 'entrada';
      component.analizarOferta();
      expect(component.paso).toBe('entrada');
    });
  });

  describe('continuarConPerfil (guarda en el backend)', () => {
    it('crea una oferta nueva cuando no se esta editando', fakeAsync(() => {
      setup();
      component.textoOferta = 'Oferta de ejemplo';
      component.analizarOferta();
      tick(1200);

      const respuesta = ofertaDto({
        ofertaId: 5, cargo: component.oferta.cargo, empresa: component.oferta.empresa, estado: 'CvGenerado',
      });
      ofertaService.crearOferta.and.returnValue(of(respuesta));

      component.continuarConPerfil();

      expect(ofertaService.crearOferta).toHaveBeenCalled();
      const payload = ofertaService.crearOferta.calls.mostRecent().args[0];
      expect(payload.cargo).toBe(component.oferta.cargo);
      expect(payload.origenEntrada).toBe('texto');
      expect(payload.estado).toBe('CvGenerado');
      expect(component.paso).toBe('generado');
      expect(component.ofertasGuardadas.some(o => o.ofertaId === 5)).toBeTrue();
    }));

    it('actualiza la oferta existente cuando se esta editando', () => {
      setup();
      component.ngOnInit();
      const item = component.ofertasGuardadas[0];
      component.editarOferta(item);
      component.oferta.cargo = 'Cargo editado';
      const respuesta = ofertaDto({ ...item, cargo: 'Cargo editado', estado: 'CvGenerado' });
      ofertaService.actualizarOferta.and.returnValue(of(respuesta));

      component.continuarConPerfil();

      expect(ofertaService.actualizarOferta).toHaveBeenCalledWith(item.ofertaId, jasmine.objectContaining({ cargo: 'Cargo editado' }));
      expect(component.paso).toBe('generado');
      expect(component.ofertasGuardadas[0].cargo).toBe('Cargo editado');
    });

    it('notifica warning y se queda en resultado si el backend rechaza por duplicado', () => {
      setup();
      component.paso = 'resultado';
      component.oferta = {
        cargo: 'Duplicado', empresa: 'Empresa X', descripcion: '', correoReclutador: '', nombreReclutador: '',
      };
      const error = new HttpErrorResponse({
        status: 400, error: { message: 'Ya existe una oferta guardada con el mismo cargo y empresa.' },
      });
      ofertaService.crearOferta.and.returnValue(throwError(() => error));

      component.continuarConPerfil();

      expect(component.paso).toBe('resultado');
      expect(notificationService.warning).toHaveBeenCalledWith('Ya existe una oferta guardada con el mismo cargo y empresa.');
    });
  });

  describe('flujo de perfil y CV generado', () => {
    it('volverAEditar regresa al paso resultado', () => {
      setup();
      component.paso = 'generado';
      component.volverAEditar();
      expect(component.paso).toBe('resultado');
    });

    it('cvAtsTexto incluye el cargo y el perfil sugerido cuando hay coincidencia', () => {
      setup();
      component.oferta = {
        cargo: 'Desarrollador Frontend Angular Senior', empresa: 'Tecnalia Software',
        descripcion: '', correoReclutador: '', nombreReclutador: '',
      };
      component.perfilSugeridoId = 2;

      expect(component.cvAtsTexto).toContain('Desarrollador Frontend Angular Senior');
      expect(component.cvAtsTexto).toContain('Desarrollador Frontend Angular');
    });

    it('cvAtsTexto usa el contenido de perfil nuevo cuando no hay coincidencia', () => {
      setup();
      component.perfilSugeridoId = 'nuevo';
      expect(component.cvAtsTexto).toContain('Perfil nuevo');
    });

    it('reiniciar vuelve al historial y limpia el formulario', () => {
      setup();
      component.paso = 'generado';
      component.textoOferta = 'algo';
      component.perfilSugeridoId = 3;

      component.reiniciar();

      expect(component.paso).toBe('historial');
      expect(component.textoOferta).toBe('');
      expect(component.perfilSugeridoId as number | 'nuevo').toBe('nuevo');
    });
  });

  describe('acciones simuladas', () => {
    it('descargarPdf notifica que la funcion esta simulada', () => {
      setup();
      component.descargarPdf();
      expect(notificationService.info).toHaveBeenCalled();
    });

    it('enviarPorCorreo notifica que la funcion esta simulada', () => {
      setup();
      component.enviarPorCorreo();
      expect(notificationService.info).toHaveBeenCalled();
    });
  });
});
