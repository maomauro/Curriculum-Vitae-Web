import { etiquetaOrigenSnapshot, mostrarFechaGeneracionSnapshot } from './public-snapshot-source-label';

describe('etiquetaOrigenSnapshot', () => {
  it('identifica copia estática seed-local', () => {
    expect(etiquetaOrigenSnapshot('seed-local')).toContain('estática');
  });

  it('describe estado bootstrap-empty del API', () => {
    expect(etiquetaOrigenSnapshot('bootstrap-empty')).toContain('inicial');
  });

  it('muestra referencia del servidor cuando hay sourceVersion', () => {
    expect(etiquetaOrigenSnapshot('api-background-v1')).toContain('api-background-v1');
  });

  it('usa texto genérico cuando no hay versión', () => {
    expect(etiquetaOrigenSnapshot(null)).toContain('servidor');
    expect(etiquetaOrigenSnapshot('   ')).toContain('servidor');
  });
});

describe('mostrarFechaGeneracionSnapshot', () => {
  it('oculta fecha para placeholder o época', () => {
    expect(mostrarFechaGeneracionSnapshot('1970-01-01T00:00:00Z', 'bootstrap-empty')).toBeFalse();
    expect(mostrarFechaGeneracionSnapshot('1970-01-01T00:00:00Z', 'seed-local')).toBeFalse();
  });

  it('muestra fecha para snapshot real del API', () => {
    expect(mostrarFechaGeneracionSnapshot('2026-04-24T12:00:00Z', 'api-background-v1')).toBeTrue();
  });
});
