import { Renderer2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PublicLayoutComponent } from './public-layout.component';

describe('PublicLayoutComponent', () => {
  let component: PublicLayoutComponent;

  const rendererStub = {
    addClass: (el: HTMLElement, cls: string) => el.classList.add(cls),
    removeClass: (el: HTMLElement, cls: string) => el.classList.remove(cls),
  };

  beforeEach(() => {
    document.body.className =
      'login-page bg-body-secondary layout-fixed sidebar-expand-lg sidebar-mini sidebar-collapse sidebar-open bg-body-tertiary';
    TestBed.configureTestingModule({
      providers: [PublicLayoutComponent, { provide: Renderer2, useValue: rendererStub }],
    });
    component = TestBed.inject(PublicLayoutComponent);
  });

  afterEach(() => {
    document.body.className = '';
  });

  it('ngOnInit limpia todas las clases de layout privado/auth del body', () => {
    component.ngOnInit();

    expect(document.body.className.trim()).toBe('');
  });
});
