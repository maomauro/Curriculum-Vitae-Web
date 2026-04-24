import { etiquetaOrigenSnapshot } from './public-snapshot-source-label';

describe('etiquetaOrigenSnapshot', () => {
  it('identifica copia estática seed-local', () => {
    expect(etiquetaOrigenSnapshot('seed-local')).toContain('estática');
  });

  it('muestra referencia del servidor cuando hay sourceVersion', () => {
    expect(etiquetaOrigenSnapshot('api-background-v1')).toContain('api-background-v1');
  });

  it('usa texto genérico cuando no hay versión', () => {
    expect(etiquetaOrigenSnapshot(null)).toContain('servidor');
    expect(etiquetaOrigenSnapshot('   ')).toContain('servidor');
  });
});
