import { formatearDuracion, mesesEntreFechas } from './duracion';

describe('mesesEntreFechas', () => {
  it('cuenta meses exactos ajustando por dia del mes', () => {
    expect(mesesEntreFechas(new Date(2020, 0, 15), new Date(2021, 2, 15))).toBe(14);
    expect(mesesEntreFechas(new Date(2022, 0, 1), new Date(2022, 3, 1))).toBe(3);
  });

  it('resta un mes si el dia de fin es anterior al dia de inicio', () => {
    expect(mesesEntreFechas(new Date(2022, 0, 15), new Date(2022, 3, 10))).toBe(2);
  });

  it('nunca es negativo', () => {
    expect(mesesEntreFechas(new Date(2022, 5, 1), new Date(2022, 0, 1))).toBe(0);
  });

  it('mismo mes da 0 meses exactos', () => {
    expect(mesesEntreFechas(new Date(2022, 0, 1), new Date(2022, 0, 20))).toBe(0);
  });
});

describe('formatearDuracion', () => {
  it('nunca muestra menos de "1 mes" para una duracion valida', () => {
    expect(formatearDuracion(0)).toBe('1 mes');
  });

  it('meses en singular y plural bajo un año', () => {
    expect(formatearDuracion(1)).toBe('1 mes');
    expect(formatearDuracion(3)).toBe('3 meses');
  });

  it('años exactos sin resto de meses', () => {
    expect(formatearDuracion(24)).toBe('2 años');
    expect(formatearDuracion(12)).toBe('1 año');
  });

  it('años y meses combinados, singular/plural correcto', () => {
    expect(formatearDuracion(13)).toBe('1 año y 1 mes');
    expect(formatearDuracion(29)).toBe('2 años y 5 meses');
  });
});
