import {
  buildEducacionTipoSeries,
  buildExpPorEmpresa,
  buildHabilidadNivelSerie,
  buildHabilidadStrategicPoints,
  buildTecnologiasProyectos,
  buildTecnologiasProyectosDona,
  clasificarGrupoHabilidad,
  contieneAlguno,
  normalizarNivelHabilidad,
  normalizarTipoFormacion,
} from './dashboard-candidato.component';
import type {
  ExperienciaPublicoDto,
  FormacionPublicoDto,
  HabilidadPublicoDto,
  ProyectoPublicoDto,
} from '../../core/services/public/public.service';

function experiencia(over: Partial<ExperienciaPublicoDto>): ExperienciaPublicoDto {
  return {
    experienciaId: 1,
    empresa: 'Acme',
    cargo: 'Dev',
    sector: null,
    fechaInicio: '2020-01-01',
    fechaFin: '2020-06-01',
    esActual: false,
    funciones: null,
    tipoContrato: null,
    adjuntoSoporte: null,
    ...over,
  };
}

function formacion(over: Partial<FormacionPublicoDto>): FormacionPublicoDto {
  return {
    formacionId: 1,
    titulo: 'Ingeniería',
    institucion: 'Universidad',
    area: null,
    tipoFormacion: 'Pregrado',
    fechaInicio: '2015-01-01',
    fechaFin: '2019-01-01',
    adjuntoSoporte: null,
    ...over,
  };
}

function proyecto(over: Partial<ProyectoPublicoDto>): ProyectoPublicoDto {
  return {
    proyectoId: 1,
    nombreProyecto: 'Portal de CV',
    rol: null,
    stackTecnologico: null,
    aporte: null,
    logro: null,
    equipoTamano: null,
    duracionMeses: null,
    ...over,
  };
}

function habilidad(over: Partial<HabilidadPublicoDto>): HabilidadPublicoDto {
  return {
    habilidadId: 1,
    nombre: 'Java',
    tipo: 'Tecnica',
    nivel: 'Avanzado',
    descripcion: null,
    nivelLectura: null,
    nivelEscritura: null,
    nivelEscucha: null,
    nivelHabla: null,
    ...over,
  };
}

describe('dashboard-candidato chart builders', () => {
  describe('buildExpPorEmpresa', () => {
    it('agrupa por empresa y suma meses', () => {
      const rows = buildExpPorEmpresa([
        experiencia({ empresa: 'Acme', fechaInicio: '2020-01-01', fechaFin: '2020-03-01' }),
        experiencia({ empresa: 'Acme', fechaInicio: '2020-06-01', fechaFin: '2020-07-01' }),
      ]);
      expect(rows.length).toBe(1);
      expect(rows[0].empresa).toBe('Acme');
      expect(rows[0].meses).toBeGreaterThan(0);
      expect(rows[0].porcentaje).toBe(100);
    });

    it('ordena por fecha de inicio mas antigua primero', () => {
      const rows = buildExpPorEmpresa([
        experiencia({ empresa: 'Reciente', fechaInicio: '2022-01-01', fechaFin: '2022-06-01' }),
        experiencia({ empresa: 'Antigua', fechaInicio: '2018-01-01', fechaFin: '2018-06-01' }),
      ]);
      expect(rows.map(r => r.empresa)).toEqual(['Antigua', 'Reciente']);
    });

    it('usa "Sin empresa" cuando el campo viene vacio', () => {
      const rows = buildExpPorEmpresa([experiencia({ empresa: '  ' })]);
      expect(rows[0].empresa).toBe('Sin empresa');
    });

    it('excluye experiencias con 0 meses (sin fecha de inicio)', () => {
      const rows = buildExpPorEmpresa([experiencia({ fechaInicio: null })]);
      expect(rows.length).toBe(0);
    });

    it('devuelve arreglo vacio sin experiencias', () => {
      expect(buildExpPorEmpresa([])).toEqual([]);
    });
  });

  describe('normalizarTipoFormacion', () => {
    it('devuelve "Sin tipo" para null, undefined o vacio', () => {
      expect(normalizarTipoFormacion(null)).toBe('Sin tipo');
      expect(normalizarTipoFormacion(undefined)).toBe('Sin tipo');
      expect(normalizarTipoFormacion('   ')).toBe('Sin tipo');
    });

    it('recorta espacios y devuelve el valor si existe', () => {
      expect(normalizarTipoFormacion('  Pregrado  ')).toBe('Pregrado');
    });
  });

  describe('buildEducacionTipoSeries', () => {
    it('cuenta formaciones por tipo, orden descendente y alfabetico en empate', () => {
      const series = buildEducacionTipoSeries([
        formacion({ tipoFormacion: 'Pregrado' }),
        formacion({ tipoFormacion: 'Pregrado' }),
        formacion({ tipoFormacion: 'Diplomado' }),
        formacion({ tipoFormacion: 'Certificacion' }),
      ]);
      expect(series.labels).toEqual(['Pregrado', 'Certificacion', 'Diplomado']);
      expect(series.values).toEqual([2, 1, 1]);
    });

    it('agrupa formaciones sin tipo bajo "Sin tipo"', () => {
      const series = buildEducacionTipoSeries([formacion({ tipoFormacion: null })]);
      expect(series.labels).toEqual(['Sin tipo']);
      expect(series.values).toEqual([1]);
    });

    it('devuelve series vacias sin formaciones', () => {
      const series = buildEducacionTipoSeries([]);
      expect(series.labels).toEqual([]);
      expect(series.values).toEqual([]);
    });
  });

  describe('normalizarNivelHabilidad', () => {
    it('reconoce los 4 niveles (con y sin tilde)', () => {
      expect(normalizarNivelHabilidad('Básico')).toBe('basico');
      expect(normalizarNivelHabilidad('Basic')).toBe('basico');
      expect(normalizarNivelHabilidad('Intermedio')).toBe('intermedio');
      expect(normalizarNivelHabilidad('Avanzado')).toBe('avanzado');
      expect(normalizarNivelHabilidad('Experto')).toBe('experto');
    });

    it('devuelve null para nivel vacio o no reconocido', () => {
      expect(normalizarNivelHabilidad(null)).toBeNull();
      expect(normalizarNivelHabilidad('  ')).toBeNull();
      expect(normalizarNivelHabilidad('Nativo')).toBeNull();
    });
  });

  describe('contieneAlguno', () => {
    it('true si el texto incluye al menos una keyword', () => {
      expect(contieneAlguno('desarrollador java senior', ['python', 'java'])).toBeTrue();
    });

    it('false si no incluye ninguna', () => {
      expect(contieneAlguno('desarrollador ruby', ['python', 'java'])).toBeFalse();
    });
  });

  describe('clasificarGrupoHabilidad', () => {
    it('clasifica idiomas por tipo', () => {
      expect(clasificarGrupoHabilidad(habilidad({ tipo: 'Idioma', nombre: 'Inglés' }))).toBe('Idiomas');
    });

    it('clasifica idiomas detectados por texto aunque el tipo no sea Idioma', () => {
      expect(clasificarGrupoHabilidad(habilidad({ tipo: 'Tecnica', nombre: 'Inglés técnico' }))).toBe('Idiomas');
    });

    it('clasifica blandas de liderazgo', () => {
      expect(clasificarGrupoHabilidad(habilidad({ tipo: 'Blanda', nombre: 'Liderazgo de equipos' }))).toBe('Liderazgo y Gestión');
    });

    it('blanda generica sin keyword especifica cae en "Habilidades blandas"', () => {
      expect(clasificarGrupoHabilidad(habilidad({ tipo: 'Blanda', nombre: 'Puntualidad' }))).toBe('Habilidades blandas');
    });

    it('clasifica cloud y devops', () => {
      expect(clasificarGrupoHabilidad(habilidad({ tipo: 'Tecnica', nombre: 'Docker y Kubernetes' }))).toBe('Cloud y DevOps');
    });

    it('clasifica desarrollo de software', () => {
      expect(clasificarGrupoHabilidad(habilidad({ tipo: 'Tecnica', nombre: 'TypeScript' }))).toBe('Desarrollo de Software');
    });

    it('tecnica sin keyword conocida cae en "Otras habilidades técnicas"', () => {
      expect(clasificarGrupoHabilidad(habilidad({ tipo: 'Tecnica', nombre: 'Zzz-Skill-Inventada' }))).toBe('Otras habilidades técnicas');
    });

    it('sin tipo reconocido ni keyword cae en "Otros"', () => {
      expect(clasificarGrupoHabilidad(habilidad({ tipo: null, nombre: 'Zzz-Skill-Inventada', descripcion: null }))).toBe('Otros');
    });
  });

  describe('buildHabilidadNivelSerie', () => {
    it('agrupa por categoria clasificada y nivel, ordenado por total descendente', () => {
      const serie = buildHabilidadNivelSerie([
        habilidad({ tipo: 'Tecnica', nombre: 'Java', nivel: 'Avanzado' }),
        habilidad({ tipo: 'Tecnica', nombre: 'TypeScript', nivel: 'Básico' }),
        habilidad({ tipo: 'Idioma', nombre: 'Inglés', nivel: 'Experto' }),
      ]);
      expect(serie.labels).toContain('Desarrollo de Software');
      expect(serie.labels).toContain('Idiomas');
      const idx = serie.labels.indexOf('Desarrollo de Software');
      expect(serie.avanzado[idx]).toBe(1);
      expect(serie.basico[idx]).toBe(1);
    });

    it('ignora habilidades sin nivel reconocido', () => {
      const serie = buildHabilidadNivelSerie([habilidad({ nivel: 'Nativo' })]);
      expect(serie.labels).toEqual([]);
    });

    it('devuelve series vacias sin habilidades', () => {
      const serie = buildHabilidadNivelSerie([]);
      expect(serie.labels).toEqual([]);
    });
  });

  describe('buildHabilidadStrategicPoints', () => {
    it('calcula madurez promedio por grupo', () => {
      const puntos = buildHabilidadStrategicPoints([
        habilidad({ tipo: 'Tecnica', nombre: 'Java', nivel: 'Básico' }),
        habilidad({ tipo: 'Tecnica', nombre: 'TypeScript', nivel: 'Experto' }),
      ]);
      const grupo = puntos.find(p => p.grupo === 'Desarrollo de Software');
      expect(grupo?.total).toBe(2);
      expect(grupo?.madurezPromedio).toBe(2.5);
      expect(grupo?.basico).toBe(1);
      expect(grupo?.experto).toBe(1);
    });

    it('ordena por total descendente y luego por madurez', () => {
      const puntos = buildHabilidadStrategicPoints([
        habilidad({ tipo: 'Idioma', nombre: 'Inglés', nivel: 'Experto' }),
        habilidad({ tipo: 'Tecnica', nombre: 'Java', nivel: 'Básico' }),
        habilidad({ tipo: 'Tecnica', nombre: 'TypeScript', nivel: 'Básico' }),
      ]);
      expect(puntos[0].grupo).toBe('Desarrollo de Software');
      expect(puntos[0].total).toBe(2);
    });

    it('devuelve arreglo vacio sin habilidades con nivel reconocido', () => {
      expect(buildHabilidadStrategicPoints([habilidad({ nivel: null })])).toEqual([]);
    });
  });

  describe('buildTecnologiasProyectos', () => {
    it('cuenta en cuantos proyectos aparece cada tecnologia', () => {
      const rows = buildTecnologiasProyectos([
        proyecto({ proyectoId: 1, nombreProyecto: 'Portal CV', stackTecnologico: 'Angular, .NET, SQL Server' }),
        proyecto({ proyectoId: 2, nombreProyecto: 'App Móvil', stackTecnologico: 'Angular; Firebase' }),
      ]);
      const angular = rows.find(r => r.etiqueta === 'Angular');
      expect(angular?.cantidadProyectos).toBe(2);
      expect(angular?.proyectos).toEqual(['Portal CV', 'App Móvil']);
    });

    it('ordena por cantidad de proyectos descendente', () => {
      const rows = buildTecnologiasProyectos([
        proyecto({ proyectoId: 1, nombreProyecto: 'A', stackTecnologico: 'Angular, Docker' }),
        proyecto({ proyectoId: 2, nombreProyecto: 'B', stackTecnologico: 'Angular' }),
      ]);
      expect(rows[0].etiqueta).toBe('Angular');
      expect(rows[0].cantidadProyectos).toBe(2);
    });

    it('no cuenta un mismo proyecto dos veces si repite la tecnologia', () => {
      const rows = buildTecnologiasProyectos([
        proyecto({ proyectoId: 1, nombreProyecto: 'A', stackTecnologico: 'Angular, angular' }),
      ]);
      expect(rows.length).toBe(1);
      expect(rows[0].cantidadProyectos).toBe(1);
    });

    it('ignora proyectos sin stack tecnologico declarado', () => {
      expect(buildTecnologiasProyectos([proyecto({ stackTecnologico: null })])).toEqual([]);
      expect(buildTecnologiasProyectos([proyecto({ stackTecnologico: '' })])).toEqual([]);
    });

    it('devuelve arreglo vacio sin proyectos', () => {
      expect(buildTecnologiasProyectos([])).toEqual([]);
    });
  });

  describe('buildTecnologiasProyectosDona', () => {
    function fila(etiqueta: string, cantidadProyectos: number): ReturnType<typeof buildTecnologiasProyectos>[number] {
      return { etiqueta, cantidadProyectos, proyectos: [`Proyecto de ${etiqueta}`] };
    }

    it('devuelve las filas tal cual si entran dentro del limite', () => {
      const rows = [fila('Angular', 3), fila('Docker', 2)];
      expect(buildTecnologiasProyectosDona(rows, 8)).toEqual(rows);
    });

    it('agrupa el resto en un pedazo "Otras" cuando supera el limite', () => {
      const rows = [fila('Angular', 5), fila('Docker', 3), fila('Redis', 1), fila('Jest', 1)];
      const dona = buildTecnologiasProyectosDona(rows, 2);

      expect(dona.length).toBe(3);
      expect(dona[0].etiqueta).toBe('Angular');
      expect(dona[1].etiqueta).toBe('Docker');
      expect(dona[2].etiqueta).toBe('Otras (2)');
      expect(dona[2].esOtras).toBeTrue();
      expect(dona[2].cantidadProyectos).toBe(2);
      expect(dona[2].proyectos).toEqual(['Proyecto de Redis', 'Proyecto de Jest']);
    });

    it('no duplica un proyecto en "Otras" si aparece en varias tecnologias agrupadas', () => {
      const rows = [
        fila('Angular', 5),
        { etiqueta: 'Redis', cantidadProyectos: 1, proyectos: ['Portal CV'] },
        { etiqueta: 'Jest', cantidadProyectos: 1, proyectos: ['Portal CV'] },
      ];
      const dona = buildTecnologiasProyectosDona(rows, 1);

      expect(dona[1].proyectos).toEqual(['Portal CV']);
    });
  });
});
