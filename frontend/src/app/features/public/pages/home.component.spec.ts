import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HomeComponent } from './home.component';
import { AuthModalService } from '../../../core/services/auth/auth-modal.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let router: jasmine.SpyObj<Router>;
  let authModal: jasmine.SpyObj<AuthModalService>;

  function setup(): void {
    router = jasmine.createSpyObj('Router', ['navigate']);
    authModal = jasmine.createSpyObj('AuthModalService', ['openLogin', 'openRegister']);

    TestBed.configureTestingModule({
      providers: [
        HomeComponent,
        { provide: Router, useValue: router },
        { provide: AuthModalService, useValue: authModal },
      ],
    });
    component = TestBed.inject(HomeComponent);
  }

  it('abrirLogin delega en AuthModalService', () => {
    setup();
    component.abrirLogin();
    expect(authModal.openLogin).toHaveBeenCalled();
  });

  it('abrirRegistro delega en AuthModalService', () => {
    setup();
    component.abrirRegistro();
    expect(authModal.openRegister).toHaveBeenCalled();
  });

  it('buscar navega a /cvs con el término recortado como query param', () => {
    setup();
    component.busqueda = '  angular  ';
    component.buscar();
    expect(router.navigate).toHaveBeenCalledWith(['/cvs'], { queryParams: { q: 'angular' } });
  });

  it('buscar navega a /cvs sin query params cuando la búsqueda está vacía', () => {
    setup();
    component.busqueda = '   ';
    component.buscar();
    expect(router.navigate).toHaveBeenCalledWith(['/cvs'], { queryParams: {} });
  });
});
