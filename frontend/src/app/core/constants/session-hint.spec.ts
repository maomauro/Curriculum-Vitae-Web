import { clearSessionHint, hasSessionHint, markSessionHint } from './session-hint';

describe('session-hint', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('hasSessionHint() es false cuando nunca se marco', () => {
    expect(hasSessionHint()).toBeFalse();
  });

  it('markSessionHint() hace que hasSessionHint() sea true', () => {
    markSessionHint();
    expect(hasSessionHint()).toBeTrue();
  });

  it('clearSessionHint() hace que hasSessionHint() vuelva a false', () => {
    markSessionHint();
    clearSessionHint();
    expect(hasSessionHint()).toBeFalse();
  });

  it('no lanza si localStorage.getItem falla', () => {
    spyOn(localStorage, 'getItem').and.throwError('denied');
    expect(hasSessionHint()).toBeFalse();
  });

  it('no lanza si localStorage.setItem falla', () => {
    spyOn(localStorage, 'setItem').and.throwError('denied');
    expect(() => markSessionHint()).not.toThrow();
  });

  it('no lanza si localStorage.removeItem falla', () => {
    spyOn(localStorage, 'removeItem').and.throwError('denied');
    expect(() => clearSessionHint()).not.toThrow();
  });
});
