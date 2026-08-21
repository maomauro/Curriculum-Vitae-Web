import { TestBed } from '@angular/core/testing';
import { MiCvComponent } from './mi-cv.component';

describe('MiCvComponent', () => {
  it('se crea correctamente', () => {
    TestBed.configureTestingModule({ providers: [MiCvComponent] });
    const component = TestBed.inject(MiCvComponent);
    expect(component).toBeTruthy();
  });
});
