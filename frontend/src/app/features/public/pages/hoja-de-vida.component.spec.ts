import { TestBed } from '@angular/core/testing';
import { HojaDeVidaComponent } from './hoja-de-vida.component';

describe('HojaDeVidaComponent', () => {
  it('se crea correctamente', () => {
    TestBed.configureTestingModule({ providers: [HojaDeVidaComponent] });
    const component = TestBed.inject(HojaDeVidaComponent);
    expect(component).toBeTruthy();
  });
});
