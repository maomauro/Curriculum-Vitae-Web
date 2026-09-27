import {
  agruparFormacionesPorTema,
  diferenciadorTitulo,
  prefijoComunPalabras,
  prefijoVisiblePorTema,
} from './agrupar-formaciones';

interface F {
  titulo: string | null;
  institucion: string | null;
}

function f(titulo: string, institucion: string): F {
  return { titulo, institucion };
}

describe('agruparFormacionesPorTema', () => {
  it('agrupa varias certificaciones del mismo proveedor que comparten tema', () => {
    const items = [
      f('Certificación Scrum Master (Spanish) CM-SMC', 'Certmind'),
      f('Certificación Scrum Product Owner (Spanish) CM-SPOC', 'Certmind'),
      f('Certificación Scrum Practitioner (Spanish) CM-SPC', 'Certmind'),
      f('Certificación Scrum Developer (Spanish) CM-SDC', 'Certmind'),
      f('Certificación Scrum Fundamentals (Spanish) CM-SFC', 'CertMind'),
    ];
    const grupos = agruparFormacionesPorTema(items);

    expect(grupos.length).toBe(1);
    expect(grupos[0].items.length).toBe(5);
    expect(grupos[0].prefijoComun).toBe('Certificación Scrum');
  });

  it('no agrupa diplomados del mismo proveedor con temas distintos', () => {
    const items = [
      f('Diplomado en Arquitectura Empresarial', 'Corporación Universitaria Minuto de Dios'),
      f('Diplomado en Seguridad Informática', 'Corporación Universitaria Minuto de Dios - Uniminuto'),
    ];
    const grupos = agruparFormacionesPorTema(items);

    expect(grupos.length).toBe(2);
    expect(grupos.every(g => g.prefijoComun === null)).toBeTrue();
  });

  it('no agrupa credenciales del mismo tema si el proveedor es distinto', () => {
    const items = [
      f('Certificación Scrum Master', 'Certmind'),
      f('Certificación Scrum Fundamentals', 'Scrum.org'),
    ];
    const grupos = agruparFormacionesPorTema(items);

    expect(grupos.length).toBe(2);
  });

  it('un solo ítem con tema y proveedor no forma grupo', () => {
    const items = [f('Google Cloud Computing Foundations', 'Coursera')];
    const grupos = agruparFormacionesPorTema(items);

    expect(grupos.length).toBe(1);
    expect(grupos[0].prefijoComun).toBeNull();
    expect(grupos[0].items).toEqual(items);
  });

  it('preserva el orden original, agrupando en la posición del primer ítem del tema', () => {
    const items = [
      f('Google Cloud Computing Foundations', 'Coursera'),
      f('Certificación Scrum Master', 'Certmind'),
      f('Certificación Scrum Fundamentals', 'Certmind'),
    ];
    const grupos = agruparFormacionesPorTema(items);

    expect(grupos.length).toBe(2);
    expect(grupos[0].items[0].titulo).toBe('Google Cloud Computing Foundations');
    expect(grupos[1].items.length).toBe(2);
  });
});

describe('prefijoComunPalabras', () => {
  it('devuelve el prefijo de palabras compartido, sin distinguir mayúsculas', () => {
    expect(prefijoComunPalabras(['Certificación Scrum Master', 'certificación scrum Developer'])).toBe(
      'Certificación Scrum'
    );
  });

  it('devuelve cadena vacía si no hay lista', () => {
    expect(prefijoComunPalabras([])).toBe('');
  });
});

describe('diferenciadorTitulo', () => {
  it('quita el prefijo común y deja el resto', () => {
    expect(diferenciadorTitulo('Certificación Scrum Master (Spanish) CM-SMC', 'Certificación Scrum')).toBe(
      'Master (Spanish) CM-SMC'
    );
  });

  it('devuelve el título completo si queda vacío tras quitar el prefijo', () => {
    expect(diferenciadorTitulo('Certificación Scrum', 'Certificación Scrum')).toBe('Certificación Scrum');
  });

  it('devuelve el título completo si no empieza con el prefijo', () => {
    expect(diferenciadorTitulo('Otro título', 'Certificación Scrum')).toBe('Otro título');
  });
});

describe('prefijoVisiblePorTema', () => {
  it('quita la palabra genérica del tipo, redundante con el título de la sección', () => {
    expect(prefijoVisiblePorTema('Certificación Scrum')).toBe('Scrum');
  });

  it('quita varias palabras genéricas si hay más de una al inicio', () => {
    expect(prefijoVisiblePorTema('Diplomado en Arquitectura')).toBe('Arquitectura');
  });

  it('no deja el resultado vacío -- devuelve el prefijo original si todo es genérico', () => {
    expect(prefijoVisiblePorTema('Certificación')).toBe('Certificación');
  });

  it('no toca un prefijo que ya empieza en la palabra del tema', () => {
    expect(prefijoVisiblePorTema('Scrum Master')).toBe('Scrum Master');
  });
});
