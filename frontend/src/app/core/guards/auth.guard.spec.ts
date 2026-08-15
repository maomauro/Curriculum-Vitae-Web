import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth/auth.service';

describe('authGuard', () => {
  let authMock: { isLoggedIn: jasmine.Spy };
  let createUrlTreeSpy: jasmine.Spy;

  function setup(isLoggedIn: boolean): void {
    authMock = { isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(isLoggedIn) };
    createUrlTreeSpy = jasmine.createSpy('createUrlTree').and.returnValue('URL_TREE_STUB');

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: { createUrlTree: createUrlTreeSpy } },
      ],
    });
  }

  it('permite el acceso si hay sesion activa', () => {
    setup(true);

    const result: unknown = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBeTrue();
    expect(createUrlTreeSpy).not.toHaveBeenCalled();
  });

  it('redirige a la home con el modal de login si no hay sesion', () => {
    setup(false);

    const result: unknown = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBe('URL_TREE_STUB');
    expect(createUrlTreeSpy).toHaveBeenCalledWith(['/'], { queryParams: { authModal: 'login' } });
  });
});
