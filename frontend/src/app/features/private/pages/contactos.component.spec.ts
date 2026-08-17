import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ContactosComponent } from './contactos.component';
import { DashboardService, ContactoDto } from '../../../core/services/private/dashboard.service';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { AlertasConteoRefreshService } from '../../../core/services/private/alertas-conteo-refresh.service';

describe('ContactosComponent', () => {
  let component: ContactosComponent;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let alertasConteoRefresh: jasmine.SpyObj<AlertasConteoRefreshService>;

  const leido: ContactoDto = {
    visitanteContactoId: 1,
    nombre: 'Ana Gómez',
    correo: 'ana@example.com',
    empresa: 'Acme',
    motivoContacto: 'oferta_laboral',
    asunto: 'Vacante Backend',
    mensaje: 'Hola, te contacto por una vacante.',
    fechaContacto: '2026-01-01T10:00:00Z',
    esLeido: true,
  };
  const noLeido: ContactoDto = { ...leido, visitanteContactoId: 2, esLeido: false };

  // Clonar en cada llamada: ContactoDto es mutable (marcarLeido hace c.esLeido = true
  // sobre el objeto real) y los tests no deben contaminarse entre si reutilizando la misma referencia.
  function setup(getContactosResult = of([{ ...leido }, { ...noLeido }])): void {
    dashboardService = jasmine.createSpyObj('DashboardService', ['getContactos', 'marcarContactoLeido']);
    dashboardService.getContactos.and.returnValue(getContactosResult);
    notificationService = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);
    alertasConteoRefresh = jasmine.createSpyObj('AlertasConteoRefreshService', ['requestRefresh']);

    TestBed.configureTestingModule({
      providers: [
        ContactosComponent,
        { provide: DashboardService, useValue: dashboardService },
        { provide: NotificationService, useValue: notificationService },
        { provide: AlertasConteoRefreshService, useValue: alertasConteoRefresh },
      ],
    });
    component = TestBed.inject(ContactosComponent);
  }

  it('carga contactos al inicializar', () => {
    setup();
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(component.contactos).toEqual([leido, noLeido]);
  });

  it('notifica error si falla la carga', () => {
    setup(throwError(() => new Error('boom')));
    component.ngOnInit();

    expect(component.loading).toBeFalse();
    expect(notificationService.error).toHaveBeenCalled();
  });

  it('noLeidosCount cuenta solo los contactos sin leer', () => {
    setup();
    component.ngOnInit();

    expect(component.noLeidosCount).toBe(1);
  });

  it('contactosFiltrados devuelve todos por defecto y solo los no leidos con el filtro activo', () => {
    setup();
    component.ngOnInit();

    expect(component.contactosFiltrados).toEqual([leido, noLeido]);

    component.filtro = 'noLeidos';
    expect(component.contactosFiltrados).toEqual([noLeido]);
  });

  it('marcarLeido actualiza esLeido y dispara refresco del contador de alertas', () => {
    setup();
    dashboardService.marcarContactoLeido.and.returnValue(of(undefined));
    component.ngOnInit();
    const contacto = component.contactos[1];

    component.marcarLeido(contacto);

    expect(dashboardService.marcarContactoLeido).toHaveBeenCalledWith(2);
    expect(contacto.esLeido).toBeTrue();
    expect(alertasConteoRefresh.requestRefresh).toHaveBeenCalled();
  });

  it('marcarLeido notifica error si falla el backend', () => {
    setup();
    dashboardService.marcarContactoLeido.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    component.ngOnInit();
    const contacto = component.contactos[1];

    component.marcarLeido(contacto);

    expect(notificationService.error).toHaveBeenCalled();
    expect(contacto.esLeido).toBeFalse();
  });

  it('inicial devuelve la primera letra en mayuscula o "?" si no hay nombre', () => {
    setup();
    expect(component.inicial('ana gómez')).toBe('A');
    expect(component.inicial(null)).toBe('?');
  });

  it('motivoLabel traduce los motivos conocidos y devuelve el valor crudo si no lo reconoce', () => {
    setup();
    expect(component.motivoLabel('oferta_laboral')).toBe('Oferta laboral');
    expect(component.motivoLabel('freelance')).toBe('Proyecto freelance');
    expect(component.motivoLabel('consulta')).toBe('Consulta');
    expect(component.motivoLabel('otro')).toBe('Otro');
    expect(component.motivoLabel('inventado')).toBe('inventado');
    expect(component.motivoLabel(null)).toBe('');
  });
});
