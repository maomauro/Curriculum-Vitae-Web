import { TestBed } from '@angular/core/testing';
import { AuthModalsHostComponent } from './auth-modals-host.component';
import { AuthModalService } from '../../core/services/auth/auth-modal.service';

describe('AuthModalsHostComponent', () => {
  let component: AuthModalsHostComponent;
  let authModal: AuthModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AuthModalsHostComponent] });
    component = TestBed.inject(AuthModalsHostComponent);
    authModal = TestBed.inject(AuthModalService);
  });

  it('kind arranca en "none"', () => {
    expect(component.kind()).toBe('none');
  });

  it('refleja el tipo de modal abierto por el servicio', () => {
    authModal.openLogin();
    expect(component.kind()).toBe('login');

    authModal.openRegister();
    expect(component.kind()).toBe('register');

    authModal.openRecuperar();
    expect(component.kind()).toBe('recuperar');
  });

  it('cerrar delega en el servicio', () => {
    authModal.openLogin();
    component.cerrar();
    expect(component.kind()).toBe('none');
  });

  it('cerrarSiBackdrop cierra solo si el click fue directamente en el backdrop', () => {
    authModal.openLogin();
    const target = {} as EventTarget;

    component.cerrarSiBackdrop({ target, currentTarget: target } as unknown as MouseEvent);
    expect(component.kind()).toBe('none');
  });

  it('cerrarSiBackdrop no cierra si el click fue dentro del panel', () => {
    authModal.openLogin();

    component.cerrarSiBackdrop({ target: {}, currentTarget: {} } as unknown as MouseEvent);
    expect(component.kind()).toBe('login');
  });

  it('onEscape cierra el modal si hay uno abierto', () => {
    authModal.openLogin();
    component.onEscape();
    expect(component.kind()).toBe('none');
  });

  it('onEscape no hace nada si no hay modal abierto', () => {
    spyOn(authModal, 'close');
    component.onEscape();
    expect(authModal.close).not.toHaveBeenCalled();
  });
});
