import { perteneceCategoriaHabilidad } from './habilidades';

describe('perteneceCategoriaHabilidad', () => {
  it('clasifica Blanda e Idioma de forma exacta', () => {
    expect(perteneceCategoriaHabilidad('Blanda', 'blanda')).toBeTrue();
    expect(perteneceCategoriaHabilidad('Idioma', 'idioma')).toBeTrue();
    expect(perteneceCategoriaHabilidad('Blanda', 'idioma')).toBeFalse();
    expect(perteneceCategoriaHabilidad('Idioma', 'blanda')).toBeFalse();
  });

  it('Tecnica y Otra caen en tecnica', () => {
    expect(perteneceCategoriaHabilidad('Tecnica', 'tecnica')).toBeTrue();
    expect(perteneceCategoriaHabilidad('Otra', 'tecnica')).toBeTrue();
  });

  it('sin tipo (null/vacio) cae en tecnica -- no debe desaparecer de ningun lado', () => {
    expect(perteneceCategoriaHabilidad(null, 'tecnica')).toBeTrue();
    expect(perteneceCategoriaHabilidad(undefined, 'tecnica')).toBeTrue();
    expect(perteneceCategoriaHabilidad('  ', 'tecnica')).toBeTrue();
    expect(perteneceCategoriaHabilidad(null, 'blanda')).toBeFalse();
    expect(perteneceCategoriaHabilidad(null, 'idioma')).toBeFalse();
  });
});
