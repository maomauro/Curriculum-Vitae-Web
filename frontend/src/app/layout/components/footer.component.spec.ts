import { TestBed } from '@angular/core/testing';
import { FooterPublicComponent } from './footer.component';

describe('FooterPublicComponent', () => {
  it('se crea sin dependencias', () => {
    TestBed.configureTestingModule({ providers: [FooterPublicComponent] });
    const component = TestBed.inject(FooterPublicComponent);
    expect(component).toBeTruthy();
  });
});
