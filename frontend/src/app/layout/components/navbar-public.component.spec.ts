import { TestBed } from '@angular/core/testing';
import { NavbarPublicComponent } from './navbar-public.component';
import { AuthModalService } from '../../core/services/auth/auth-modal.service';

describe('NavbarPublicComponent', () => {
  let component: NavbarPublicComponent;
  let authModal: jasmine.SpyObj<AuthModalService>;

  beforeEach(() => {
    authModal = jasmine.createSpyObj('AuthModalService', ['openLogin', 'openRegister']);
    TestBed.configureTestingModule({
      providers: [NavbarPublicComponent, { provide: AuthModalService, useValue: authModal }],
    });
    component = TestBed.inject(NavbarPublicComponent);
  });

  it('arranca con el menú móvil cerrado', () => {
    expect(component.menuMovilAbierto).toBeFalse();
  });

  it('toggleMenuMovil alterna el estado', () => {
    component.toggleMenuMovil();
    expect(component.menuMovilAbierto).toBeTrue();
    component.toggleMenuMovil();
    expect(component.menuMovilAbierto).toBeFalse();
  });

  it('cerrarMenuMovil siempre lo deja cerrado', () => {
    component.menuMovilAbierto = true;
    component.cerrarMenuMovil();
    expect(component.menuMovilAbierto).toBeFalse();
  });

  it('abrirLogin cierra el menú móvil y abre el modal de login', () => {
    component.menuMovilAbierto = true;
    component.abrirLogin();

    expect(component.menuMovilAbierto).toBeFalse();
    expect(authModal.openLogin).toHaveBeenCalled();
  });

  it('abrirRegistro cierra el menú móvil y abre el modal de registro', () => {
    component.menuMovilAbierto = true;
    component.abrirRegistro();

    expect(component.menuMovilAbierto).toBeFalse();
    expect(authModal.openRegister).toHaveBeenCalled();
  });
});
