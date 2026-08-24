import { mapEditorToCvDetalleDto } from './map-editor-to-cv-detalle-dto';
import type {
  ExperienciaDto,
  FormacionDto,
  HabilidadDto,
  PerfilDto,
  PresentacionCvDto,
  ProyectoDto,
  ReferenciaDto,
} from '../services/private/cv-editor.service';

function basePresentacion(over: Partial<PresentacionCvDto> = {}): PresentacionCvDto {
  return {
    plantillaCodigo: 'clasico',
    experienciaLaboralMesesAcumulados: 12,
    urlPublica: 'slug-test',
    publicado: true,
    ...over,
  };
}

function exp(
  id: number,
  empresa: string,
  mostrarEnCv: boolean
): ExperienciaDto {
  return {
    experienciaId: id,
    empresa,
    cargo: 'Dev',
    sector: null,
    fechaInicio: '2020-01-01',
    fechaFin: null,
    tipoContrato: null,
    motivoRetiro: null,
    funciones: null,
    esActual: false,
    mostrarEnCv,
    adjuntoSoporte: null,
    fechaRegistro: '2026-01-01T00:00:00Z',
  };
}

describe('mapEditorToCvDetalleDto', () => {
  it('excluye experiencias con mostrarEnCv false del detalle', () => {
    const dto = mapEditorToCvDetalleDto(
      null,
      basePresentacion(),
      [],
      [exp(1, 'Visible SA', true), exp(2, 'Oculta Ltd', false)],
      [],
      [],
      [],
      [],
      []
    );
    expect(dto.experiencias.length).toBe(1);
    expect(dto.experiencias[0].experienciaId).toBe(1);
    expect(dto.experiencias[0].empresa).toBe('Visible SA');
  });

  it('oculta experiencia/aspiracion salarial del perfil segun sus propios interruptores', () => {
    const perfiles: PerfilDto[] = [{
      perfilId: 1, nombrePerfil: 'Backend', descripcionPerfil: null, esActivo: true,
      experienciaPerfilAnios: 7, aspiracionSalarialPesos: 8000000, aspiracionSalarialDolares: 2000,
      mostrarExperienciaPerfil: false, mostrarAspiracionSalarial: true,
    }];
    const dto = mapEditorToCvDetalleDto(null, basePresentacion(), perfiles, [], [], [], [], [], []);

    expect(dto.perfiles[0].experienciaPerfilAnios).toBeNull();
    expect(dto.perfiles[0].aspiracionSalarialPesos).toBe(8000000);
  });

  it('referencia Laboral ligada a empleo oculto no aparece; Laboral con empleo visible sí', () => {
    const referencias: ReferenciaDto[] = [
      {
        referenciaId: 10,
        tipoReferencia: 'Laboral',
        experienciaId: 2,
        nombre: 'Ref',
        apellido: null,
        email: null,
        telefono: null,
        parentesco: null,
        cargo: null,
        empresa: null,
        relacion: null,
        observaciones: null,
        adjuntoSoporte: null,
        mostrarEnCv: true,
        fechaRegistro: '2026-01-01T00:00:00Z',
      },
      {
        referenciaId: 11,
        tipoReferencia: 'Laboral',
        experienciaId: 1,
        nombre: 'Ref2',
        apellido: null,
        email: null,
        telefono: null,
        parentesco: null,
        cargo: null,
        empresa: null,
        relacion: null,
        observaciones: null,
        adjuntoSoporte: null,
        mostrarEnCv: true,
        fechaRegistro: '2026-01-01T00:00:00Z',
      },
    ];
    const dto = mapEditorToCvDetalleDto(
      null,
      basePresentacion(),
      [],
      [exp(1, 'A', true), exp(2, 'B', false)],
      [],
      [],
      [],
      referencias,
      []
    );
    const ids = dto.referencias.map(r => r.referenciaId);
    expect(ids).toContain(11);
    expect(ids).not.toContain(10);
  });

  it('referencia Laboral sin experienciaId se mantiene', () => {
    const referencias: ReferenciaDto[] = [
      {
        referenciaId: 20,
        tipoReferencia: 'Laboral',
        experienciaId: null,
        nombre: 'Libre',
        apellido: null,
        email: null,
        telefono: null,
        parentesco: null,
        cargo: null,
        empresa: null,
        relacion: null,
        observaciones: null,
        adjuntoSoporte: null,
        mostrarEnCv: true,
        fechaRegistro: '2026-01-01T00:00:00Z',
      },
    ];
    const dto = mapEditorToCvDetalleDto(
      null,
      basePresentacion(),
      [],
      [exp(1, 'Solo', false)],
      [],
      [],
      [],
      referencias,
      []
    );
    expect(dto.referencias.some(r => r.referenciaId === 20)).toBeTrue();
  });

  it('referencia no Laboral no se filtra por experiencia', () => {
    const referencias: ReferenciaDto[] = [
      {
        referenciaId: 30,
        tipoReferencia: 'Personal',
        experienciaId: 99,
        nombre: 'P',
        apellido: null,
        email: null,
        telefono: null,
        parentesco: null,
        cargo: null,
        empresa: null,
        relacion: null,
        observaciones: null,
        adjuntoSoporte: null,
        mostrarEnCv: true,
        fechaRegistro: '2026-01-01T00:00:00Z',
      },
    ];
    const dto = mapEditorToCvDetalleDto(
      null,
      basePresentacion(),
      [],
      [],
      [],
      [],
      [],
      referencias,
      []
    );
    expect(dto.referencias.length).toBe(1);
    expect(dto.referencias[0].tipoReferencia).toBe('Personal');
  });

  it('excluye referencias con mostrarEnCv false del detalle', () => {
    const referencias: ReferenciaDto[] = [
      {
        referenciaId: 40,
        tipoReferencia: 'Laboral',
        experienciaId: null,
        nombre: 'Visible',
        apellido: null,
        email: null,
        telefono: null,
        parentesco: null,
        cargo: null,
        empresa: null,
        relacion: null,
        observaciones: null,
        adjuntoSoporte: null,
        mostrarEnCv: true,
        fechaRegistro: '2026-01-01T00:00:00Z',
      },
      {
        referenciaId: 41,
        tipoReferencia: 'Laboral',
        experienciaId: null,
        nombre: 'Oculta',
        apellido: null,
        email: null,
        telefono: null,
        parentesco: null,
        cargo: null,
        empresa: null,
        relacion: null,
        observaciones: null,
        adjuntoSoporte: null,
        mostrarEnCv: false,
        fechaRegistro: '2026-01-01T00:00:00Z',
      },
    ];
    const dto = mapEditorToCvDetalleDto(null, basePresentacion(), [], [], [], [], [], referencias, []);
    const ids = dto.referencias.map(r => r.referenciaId);
    expect(ids).toContain(40);
    expect(ids).not.toContain(41);
  });

  it('excluye formaciones con mostrarEnCv false', () => {
    const formaciones = [
      {
        formacionId: 1,
        titulo: 'Visible',
        institucion: 'A',
        area: null,
        fechaInicio: null,
        fechaFin: null,
        tipoFormacion: null,
        descripcion: null,
        adjuntoSoporte: null,
        fechaVigencia: null,
        duracionHoras: null,
        mostrarEnCv: true,
      },
      {
        formacionId: 2,
        titulo: 'Oculta',
        institucion: 'B',
        area: null,
        fechaInicio: null,
        fechaFin: null,
        tipoFormacion: null,
        descripcion: null,
        adjuntoSoporte: null,
        fechaVigencia: null,
        duracionHoras: null,
        mostrarEnCv: false,
      },
    ] as FormacionDto[];

    const dto = mapEditorToCvDetalleDto(null, basePresentacion(), [], [], formaciones, [], [], [], []);
    expect(dto.formaciones.length).toBe(1);
    expect(dto.formaciones[0].formacionId).toBe(1);
  });

  it('excluye habilidades con mostrarEnCv false', () => {
    const habilidades = [
      {
        habilidadId: 20,
        nombre: 'Visible',
        tipo: 'Tecnica',
        nivel: 'Avanzado',
        descripcion: null,
        nivelLectura: null,
        nivelEscritura: null,
        nivelEscucha: null,
        nivelHabla: null,
        mostrarEnCv: true,
      },
      {
        habilidadId: 21,
        nombre: 'Oculta',
        tipo: 'Tecnica',
        nivel: 'Avanzado',
        descripcion: null,
        nivelLectura: null,
        nivelEscritura: null,
        nivelEscucha: null,
        nivelHabla: null,
        mostrarEnCv: false,
      },
    ] as HabilidadDto[];

    const dto = mapEditorToCvDetalleDto(null, basePresentacion(), [], [], [], habilidades, [], [], []);
    expect(dto.habilidades.length).toBe(1);
    expect(dto.habilidades[0].habilidadId).toBe(20);
  });

  it('excluye proyectos con mostrarEnCv false', () => {
    const proyectos = [
      {
        proyectoId: 10,
        nombreProyecto: 'Visible',
        rol: 'Dev',
        equipoTamano: null,
        duracionMeses: null,
        stackTecnologico: null,
        aporte: null,
        logro: null,
        desafio: null,
        mostrarEnCv: true,
      },
      {
        proyectoId: 11,
        nombreProyecto: 'Oculto',
        rol: 'Dev',
        equipoTamano: null,
        duracionMeses: null,
        stackTecnologico: null,
        aporte: null,
        logro: null,
        desafio: null,
        mostrarEnCv: false,
      },
    ] as ProyectoDto[];

    const dto = mapEditorToCvDetalleDto(null, basePresentacion(), [], [], [], [], proyectos, [], []);
    expect(dto.proyectos.length).toBe(1);
    expect(dto.proyectos[0].proyectoId).toBe(10);
  });
});
