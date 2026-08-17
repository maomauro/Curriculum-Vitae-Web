import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AlertasComponent } from './alertas.component';
import { AlertasService, AlertaVisitaDto, AlertasPageDto } from '../../../core/services/private/alertas.service';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { AlertasConteoRefreshService } from '../../../core/services/private/alertas-conteo-refresh.service';

describe('AlertasComponent', () => {
  let component: AlertasComponent;
  let alertasService: jasmine.SpyObj<AlertasService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let alertasConteoRefresh: jasmine.SpyObj<AlertasConteoRefreshService>;
  let router: jasmine.SpyObj<Router>;

  const noLeida: AlertaVisitaDto = {
    alertaVisitaId: 1, curriculumId: 1, fechaVisita: '2026-01-01T10:00:00Z',
    origen: 'LinkedIn', tipoVisita: 'Contacto', esLeida: false,
    titulo: 'Nuevo mensaje', descripcion: 'Ana te contactó', ciudad: 'Bogotá', pais: 'Colombia',
  };
  const leida: AlertaVisitaDto = { ...noLeida, alertaVisitaId: 2, esLeida: true, tipoVisita: 'Vista' };

  function paginaResult(items = [{ ...noLeida }, { ...leida }], total = 2, totalPages = 1): AlertasPageDto {
    return { items, total, page: 1, pageSize: 10, totalPages };
  }

  function setup(getAlertasResult = of(paginaResult())): void {
    alertasService = jasmine.createSpyObj('AlertasService', [
      'getAlertas', 'marcarLeida', 'marcarTodasLeidas', 'limpiarLeidas',
    ]);
    alertasService.getAlertas.and.returnValue(getAlertasResult);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);
    alertasConteoRefresh = jasmine.createSpyObj('AlertasConteoRefreshService', ['requestRefresh']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AlertasComponent,
        { provide: AlertasService, useValue: alertasService },
        { provide: NotificationService, useValue: notificationService },
        { provide: AlertasConteoRefreshService, useValue: alertasConteoRefresh },
        { provide: Router, useValue: router },
      ],
    });
    component = TestBed.inject(AlertasComponent);
  }

  it('carga alertas al inicializar y separa leidas/no leidas', () => {
    setup();
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.alertas.length).toBe(2);
    expect(component.noLeidas).toEqual([noLeida]);
    expect(component.leidas).toEqual([leida]);
  });

  it('notifica error si falla la carga', () => {
    setup(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('calcula los contadores de resumen (no leidas, contactos, vistas, descargas)', () => {
    setup(of(paginaResult([
      { ...noLeida, tipoVisita: 'Contacto', esLeida: false },
      { ...leida, tipoVisita: 'Vista', esLeida: true },
      { ...leida, alertaVisitaId: 3, tipoVisita: 'Descarga', esLeida: true },
    ])));
    component.ngOnInit();

    expect(component.noLeidasCount).toBe(1);
    expect(component.leidasCount).toBe(2);
    expect(component.conteoContactos).toBe(1);
    expect(component.conteoVistas).toBe(1);
    expect(component.conteoDescargas).toBe(1);
  });

  it('pages calcula una ventana de hasta 5 paginas centrada en la actual', () => {
    setup();
    component.totalPages = 10;
    component.page = 5;

    expect(component.pages).toEqual([3, 4, 5, 6, 7]);
  });

  it('pages se ajusta al inicio cuando la pagina actual esta cerca del comienzo', () => {
    setup();
    component.totalPages = 10;
    component.page = 1;

    expect(component.pages).toEqual([1, 2, 3, 4, 5]);
  });

  it('setFiltro cambia el filtro, resetea a pagina 1 y recarga', () => {
    setup();
    component.page = 3;

    component.setFiltro('noleidas');

    expect(component.filtro).toBe('noleidas');
    expect(component.page).toBe(1);
    expect(alertasService.getAlertas).toHaveBeenCalledWith(true, '', 'mes', 1, 10);
  });

  it('aplicarFiltros resetea a pagina 1 y recarga con tipo/periodo actuales', () => {
    setup();
    component.page = 2;
    component.tipo = 'Vista';
    component.periodo = 'semana';

    component.aplicarFiltros();

    expect(component.page).toBe(1);
    expect(alertasService.getAlertas).toHaveBeenCalledWith(false, 'Vista', 'semana', 1, 10);
  });

  describe('marcarLeida', () => {
    it('no hace nada si la alerta ya esta leida', () => {
      setup();
      component.marcarLeida({ ...leida });

      expect(alertasService.marcarLeida).not.toHaveBeenCalled();
    });

    it('marca como leida, refresca la lista y dispara el refresco del contador', () => {
      setup();
      alertasService.marcarLeida.and.returnValue(of(undefined));
      component.ngOnInit();
      const alerta = component.alertas[0];

      component.marcarLeida(alerta);

      expect(alertasService.marcarLeida).toHaveBeenCalledWith(1);
      expect(alerta.esLeida).toBeTrue();
      expect(alertasConteoRefresh.requestRefresh).toHaveBeenCalled();
    });

    it('notifica error si falla el backend', () => {
      setup();
      alertasService.marcarLeida.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      component.ngOnInit();

      component.marcarLeida(component.alertas[0]);

      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('marcarTodasLeidas', () => {
    it('marca todas, recarga, refresca contador y notifica exito', () => {
      setup();
      alertasService.marcarTodasLeidas.and.returnValue(of(undefined));
      component.ngOnInit();

      component.marcarTodasLeidas();

      expect(component.alertas.every(a => a.esLeida)).toBeTrue();
      expect(alertasConteoRefresh.requestRefresh).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('notifica error si falla el backend', () => {
      setup();
      alertasService.marcarTodasLeidas.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      component.ngOnInit();

      component.marcarTodasLeidas();

      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('limpiarLeidas', () => {
    it('no llama al backend si se cancela la confirmacion', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(false);

      component.limpiarLeidas();

      expect(alertasService.limpiarLeidas).not.toHaveBeenCalled();
    });

    it('si se confirma y hay eliminadas, recarga y notifica el conteo', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      alertasService.limpiarLeidas.and.returnValue(of({ eliminadas: 3 }));
      component.ngOnInit();

      component.limpiarLeidas();

      expect(alertasConteoRefresh.requestRefresh).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalledWith('Alertas leídas eliminadas.');
    });

    it('si se confirma y no habia leidas, notifica que no habia nada que borrar', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      alertasService.limpiarLeidas.and.returnValue(of({ eliminadas: 0 }));

      component.limpiarLeidas();

      expect(notificationService.success).toHaveBeenCalledWith('No había alertas leídas.');
    });

    it('notifica error si falla el backend', () => {
      setup();
      spyOn(window, 'confirm').and.returnValue(true);
      alertasService.limpiarLeidas.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      component.limpiarLeidas();

      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('irPagina', () => {
    it('ignora paginas fuera de rango o iguales a la actual', () => {
      setup();
      component.totalPages = 3;
      component.page = 2;

      component.irPagina(0);
      component.irPagina(4);
      component.irPagina(2);

      expect(component.page).toBe(2);
      expect(alertasService.getAlertas).not.toHaveBeenCalled();
    });

    it('cambia de pagina y recarga si esta dentro de rango', () => {
      setup();
      component.totalPages = 3;
      component.page = 1;

      component.irPagina(2);

      expect(component.page).toBe(2);
      expect(alertasService.getAlertas).toHaveBeenCalled();
    });
  });

  it('irAContactos detiene la propagacion y navega a /contactos', () => {
    setup();
    const ev = new Event('click');
    spyOn(ev, 'stopPropagation');

    component.irAContactos(ev);

    expect(ev.stopPropagation).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/contactos']);
  });

  describe('tipoClass / tipoIcono', () => {
    it('mapea los tipos conocidos', () => {
      setup();
      expect(component.tipoClass('Contacto')).toBe('contact');
      expect(component.tipoClass('Vista')).toBe('view');
      expect(component.tipoClass('Descarga')).toBe('download');
      expect(component.tipoClass('Sistema')).toBe('system');
      expect(component.tipoIcono('Contacto')).toBe('bi-envelope-fill');
    });

    it('usa el valor por defecto para tipos desconocidos o nulos', () => {
      setup();
      expect(component.tipoClass('Inventado')).toBe('system');
      expect(component.tipoClass(null)).toBe('system');
      expect(component.tipoIcono('Inventado')).toBe('bi-bell-fill');
      expect(component.tipoIcono(null)).toBe('bi-bell-fill');
    });
  });
});
