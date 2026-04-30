import { mapEditorToCvDetalleDto } from './map-editor-to-cv-detalle-dto';
import type {
  ExperienciaDto,
  PresentacionCvDto,
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
});
