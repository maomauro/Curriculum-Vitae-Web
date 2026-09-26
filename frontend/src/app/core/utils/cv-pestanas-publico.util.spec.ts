import { pestanaPublicaDeRespaldo, pestanaPublicaHabilitada } from './cv-pestanas-publico.util';
import type { CvDetalleDto } from '../services/public/public.service';

function cvConFlags(over: Partial<CvDetalleDto> = {}): CvDetalleDto {
  return {
    curriculumId: 1,
    urlPublica: 'cv-test',
    plantillaCodigo: 'clasico',
    experienciaLaboralMesesAcumulados: 0,
    personales: null,
    perfiles: [],
    experiencias: [],
    formaciones: [],
    habilidades: [],
    proyectos: [],
    referencias: [],
    redesSociales: [],
    ...over,
  };
}

describe('pestanaPublicaHabilitada', () => {
  it('todas habilitadas por defecto cuando la API no envia los flags', () => {
    const cv = cvConFlags();
    expect(pestanaPublicaHabilitada('dashboard', cv)).toBeTrue();
    expect(pestanaPublicaHabilitada('profesional', cv)).toBeTrue();
    expect(pestanaPublicaHabilitada('', cv)).toBeTrue();
  });

  it('respeta cada flag individualmente', () => {
    const cv = cvConFlags({
      dashboardMostrarMetricas: false,
      dashboardMostrarGraficas: false,
      informacionProfesionalPublicaActiva: false,
      hojaDeVidaPublicaActiva: false,
    });
    expect(pestanaPublicaHabilitada('dashboard', cv)).toBeFalse();
    expect(pestanaPublicaHabilitada('profesional', cv)).toBeFalse();
    expect(pestanaPublicaHabilitada('', cv)).toBeFalse();
  });
});

describe('pestanaPublicaDeRespaldo', () => {
  it('devuelve el mismo path si ya esta habilitado', () => {
    const cv = cvConFlags();
    expect(pestanaPublicaDeRespaldo('profesional', cv)).toBe('profesional');
  });

  it('redirige a la primera pestaña habilitada en el orden Dashboard -> Profesional -> Hoja de vida', () => {
    const cv = cvConFlags({ informacionProfesionalPublicaActiva: false });
    expect(pestanaPublicaDeRespaldo('profesional', cv)).toBe('dashboard');
  });

  it('salta a Hoja de vida si Dashboard y Profesional estan apagadas', () => {
    const cv = cvConFlags({
      dashboardMostrarMetricas: false,
      dashboardMostrarGraficas: false,
      informacionProfesionalPublicaActiva: false,
    });
    expect(pestanaPublicaDeRespaldo('dashboard', cv)).toBe('');
  });

  it('devuelve null si las tres pestañas estan apagadas', () => {
    const cv = cvConFlags({
      dashboardMostrarMetricas: false,
      dashboardMostrarGraficas: false,
      informacionProfesionalPublicaActiva: false,
      hojaDeVidaPublicaActiva: false,
    });
    expect(pestanaPublicaDeRespaldo('dashboard', cv)).toBeNull();
  });

  it('devuelve null (no false) cuando cv es null', () => {
    expect(pestanaPublicaDeRespaldo('dashboard', null)).toBeNull();
  });
});
