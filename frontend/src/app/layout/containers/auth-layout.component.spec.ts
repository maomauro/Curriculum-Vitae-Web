import { Renderer2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthLayoutComponent } from './auth-layout.component';

describe('AuthLayoutComponent', () => {
  let component: AuthLayoutComponent;

  const rendererStub = {
    addClass: (el: HTMLElement, cls: string) => el.classList.add(cls),
    removeClass: (el: HTMLElement, cls: string) => el.classList.remove(cls),
  };

  beforeEach(() => {
    document.body.className = '';
    TestBed.configureTestingModule({
      providers: [AuthLayoutComponent, { provide: Renderer2, useValue: rendererStub }],
    });
    component = TestBed.inject(AuthLayoutComponent);
  });

  afterEach(() => {
    document.body.className = '';
  });

  it('ngOnInit agrega las clases de layout de autenticación al body', () => {
    component.ngOnInit();
    expect(document.body.classList.contains('login-page')).toBeTrue();
    expect(document.body.classList.contains('bg-body-secondary')).toBeTrue();
  });

  it('ngOnDestroy quita las clases agregadas', () => {
    component.ngOnInit();
    component.ngOnDestroy();
    expect(document.body.classList.contains('login-page')).toBeFalse();
    expect(document.body.classList.contains('bg-body-secondary')).toBeFalse();
  });
});
