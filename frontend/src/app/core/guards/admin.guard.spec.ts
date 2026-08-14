import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth/auth.service';
import { CV_ROL } from '../constants/cv-roles';

describe('adminGuard', () => {
  let authMock: { isLoggedIn: jasmine.Spy; hasRol: jasmine.Spy };
  let createUrlTreeSpy: jasmine.Spy;

  function setup(isLoggedIn: boolean, roles: string[]): void {
    authMock = {
      isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(isLoggedIn),
      hasRol: jasmine.createSpy('hasRol').and.callFake((rol: string) => roles.includes(rol)),
    };
    createUrlTreeSpy = jasmine.createSpy('createUrlTree').and.callFake((commands: unknown[]) => `URL_TREE:${JSON.stringify(commands)}`);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: { createUrlTree: createUrlTreeSpy } },
      ],
    });
  }

  function run(): unknown {
    return TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));
  }

  it('redirige a la home con modal de login si no hay sesion', () => {
    setup(false, []);

    const result = run();

    expect(result).toBe('URL_TREE:["/"]');
    expect(createUrlTreeSpy).toHaveBeenCalledWith(['/'], { queryParams: { authModal: 'login' } });
  });

  it('permite el acceso si el usuario tiene rol Admin', () => {
    setup(true, [CV_ROL.admin]);

    const result = run();

    expect(result).toBeTrue();
  });

  it('redirige a /dashboard si es Publicador sin rol Admin', () => {
    setup(true, [CV_ROL.publicador]);

    const result = run();

    expect(result).toBe('URL_TREE:["/dashboard"]');
  });

  it('redirige a la home si esta logueado pero sin rol Admin ni Publicador', () => {
    setup(true, [CV_ROL.visitante]);

    const result = run();

    expect(result).toBe('URL_TREE:["/"]');
  });
});
