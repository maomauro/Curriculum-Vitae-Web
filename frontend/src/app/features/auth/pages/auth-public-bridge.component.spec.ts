import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthPublicBridgeComponent } from './auth-public-bridge.component';
import { AuthModalService } from '../../../core/services/auth/auth-modal.service';

describe('AuthPublicBridgeComponent', () => {
  let component: AuthPublicBridgeComponent;
  let router: jasmine.SpyObj<Router>;
  let authModal: jasmine.SpyObj<AuthModalService>;

  function setup(path: string): void {
    router = jasmine.createSpyObj('Router', ['navigate']);
    authModal = jasmine.createSpyObj('AuthModalService', ['openLogin', 'openRegister', 'openRecuperar']);

    TestBed.configureTestingModule({
      providers: [
        AuthPublicBridgeComponent,
        { provide: Router, useValue: router },
        { provide: AuthModalService, useValue: authModal },
        { provide: ActivatedRoute, useValue: { snapshot: { routeConfig: { path } } } },
      ],
    });
    component = TestBed.inject(AuthPublicBridgeComponent);
  }

  it('abre el modal de registro y navega a "/" en la ruta legada /auth/register', () => {
    setup('register');
    component.ngOnInit();

    expect(authModal.openRegister).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/'], { replaceUrl: true });
  });

  it('abre el modal de recuperar contraseña en la ruta legada /auth/recuperar-contrasena', () => {
    setup('recuperar-contrasena');
    component.ngOnInit();

    expect(authModal.openRecuperar).toHaveBeenCalled();
  });

  it('abre el modal de login por defecto para cualquier otra ruta', () => {
    setup('login');
    component.ngOnInit();

    expect(authModal.openLogin).toHaveBeenCalled();
  });
});
