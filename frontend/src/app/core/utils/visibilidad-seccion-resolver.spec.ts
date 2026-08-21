import { VisibilidadSeccionResolver } from './visibilidad-seccion-resolver';

describe('VisibilidadSeccionResolver', () => {
  it('las secciones "siempre visibles" lo son aunque esten desactivadas', () => {
    const vis = new VisibilidadSeccionResolver([{ seccion: 'perfil', visible: false }]);

    expect(vis.visibleSeccion('perfil')).toBeTrue();
    expect(vis.visibleSeccion('datos-personales')).toBeTrue();
    expect(vis.visibleSeccion('experiencia')).toBeTrue();
    expect(vis.visibleSeccion('formacion-academica')).toBeTrue();
  });

  it('una seccion sin entrada se considera visible (retrocompatibilidad)', () => {
    const vis = new VisibilidadSeccionResolver([]);
    expect(vis.visibleSeccion('proyectos')).toBeTrue();
  });

  it('respeta el mapa de visibilidad para secciones normales', () => {
    const vis = new VisibilidadSeccionResolver([
      { seccion: 'proyectos', visible: false },
      { seccion: 'referencias', visible: true },
    ]);

    expect(vis.visibleSeccion('proyectos')).toBeFalse();
    expect(vis.visibleSeccion('referencias')).toBeTrue();
  });

  it('visibleAtributo exige que la seccion y el atributo esten visibles', () => {
    const vis = new VisibilidadSeccionResolver([
      { seccion: 'experiencia', visible: true },
      { seccion: 'experiencia.funciones', visible: false },
    ]);

    expect(vis.visibleAtributo('experiencia', 'funciones')).toBeFalse();
  });

  it('visibleAtributoSafe devuelve true si el atributo no esta en el mapa', () => {
    const vis = new VisibilidadSeccionResolver([{ seccion: 'experiencia', visible: true }]);
    expect(vis.visibleAtributoSafe('experiencia', 'funciones')).toBeTrue();
  });

  it('visibleAtributoSafe devuelve false si la seccion no es visible', () => {
    const vis = new VisibilidadSeccionResolver([{ seccion: 'proyectos', visible: false }]);
    expect(vis.visibleAtributoSafe('proyectos', 'aporte')).toBeFalse();
  });

  it('visibleBloqueFormacion usa el bloque especifico si existe, si no cae a "educacion"', () => {
    const vis = new VisibilidadSeccionResolver([
      { seccion: 'diplomados', visible: false },
      { seccion: 'educacion', visible: true },
    ]);

    expect(vis.visibleBloqueFormacion('diplomados')).toBeFalse();
    expect(vis.visibleBloqueFormacion('cursos')).toBeTrue();
  });

  it('visibleDescargarSoporte depende del bloque de formacion y del atributo puntual', () => {
    const vis = new VisibilidadSeccionResolver([{ seccion: 'diplomados', visible: false }]);
    expect(vis.visibleDescargarSoporte('diplomados', 'adjuntoSoporte')).toBeFalse();
  });

  it('con datos null/undefined todo se considera visible salvo las nunca-visibles-por-defecto', () => {
    const vis = new VisibilidadSeccionResolver(null);
    expect(vis.visibleSeccion('proyectos')).toBeTrue();
  });
});
