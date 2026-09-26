import { TestBed } from '@angular/core/testing';
import { HojaDeVidaComponent } from './hoja-de-vida.component';
import { CvDetalleVistaContext } from '../../../shared/contexts/cv-detalle-vista.context';
import type { CvDetalleDto, HojaDeVidaContenidoDto } from '../../../core/services/public/public.service';

describe('HojaDeVidaComponent', () => {
  let component: HojaDeVidaComponent;
  let ctx: CvDetalleVistaContext;

  const contenido: HojaDeVidaContenidoDto = {
    experiencia: [{ cabecera: 'Backend en Acme', funciones: ['Diseño de APIs'] }],
    educacion: ['Ingeniería de Sistemas'],
    proyectos: ['Portal de CV'],
    habilidades: [{ nombre: 'C#', tipo: 'Tecnica' }],
  };

  const cvDetalle: CvDetalleDto = {
    curriculumId: 1,
    urlPublica: 'cv-test',
    plantillaCodigo: 'clasico',
    experienciaLaboralMesesAcumulados: 24,
    personales: null,
    perfiles: [],
    experiencias: [],
    formaciones: [],
    habilidades: [],
    proyectos: [],
    referencias: [],
    redesSociales: [],
  };

  function setup(): void {
    TestBed.configureTestingModule({
      providers: [HojaDeVidaComponent, CvDetalleVistaContext],
    });
    component = TestBed.inject(HojaDeVidaComponent);
    ctx = TestBed.inject(CvDetalleVistaContext);
  }

  it('se crea correctamente', () => {
    setup();
    expect(component).toBeTruthy();
  });

  it('sin CV en el contexto compartido, no hay contenido', () => {
    setup();
    expect(component.contenido).toBeNull();
    expect(component.hayContenido).toBeFalse();
  });

  it('con Perfil activo sin CvGenerado (hojaDeVidaContenido null), no hay contenido', () => {
    setup();
    ctx.cv = { ...cvDetalle, hojaDeVidaContenido: null };

    expect(component.hayContenido).toBeFalse();
  });

  it('con contenido, expone el CV del Perfil activo y hayContenido es true', () => {
    setup();
    ctx.cv = { ...cvDetalle, hojaDeVidaContenido: contenido };

    expect(component.contenido).toEqual(contenido);
    expect(component.hayContenido).toBeTrue();
  });

  it('con las 4 listas vacias, hayContenido es false aunque el objeto no sea null', () => {
    setup();
    ctx.cv = { ...cvDetalle, hojaDeVidaContenido: { experiencia: [], educacion: [], proyectos: [], habilidades: [] } };

    expect(component.hayContenido).toBeFalse();
  });

  it('expone personales, redesSociales, plantillaCodigo y el Perfil activo del CV cargado', () => {
    setup();
    ctx.cv = {
      ...cvDetalle,
      plantillaCodigo: 'corporativo',
      personales: {
        nombreCompleto: 'Edgar Cifuentes',
        fotoUrl: null,
        ciudad: null,
        pais: null,
        celular: null,
        email: null,
      },
      redesSociales: [{ redSocialId: 1, nombreRed: 'GitHub', linkPublico: 'https://github.com/edgar', usuarioContacto: null }],
      perfiles: [
        { perfilId: 1, nombrePerfil: 'Backend', descripcionPerfil: null, experienciaPerfilAnios: null, aspiracionSalarialPesos: null, aspiracionSalarialDolares: null, esActivo: false },
        { perfilId: 2, nombrePerfil: 'Scrum Master', descripcionPerfil: null, experienciaPerfilAnios: null, aspiracionSalarialPesos: null, aspiracionSalarialDolares: null, esActivo: true },
      ],
    };

    expect(component.personales?.nombreCompleto).toBe('Edgar Cifuentes');
    expect(component.redesSociales.length).toBe(1);
    expect(component.perfilActivo?.nombrePerfil).toBe('Scrum Master');
    expect(component.plantillaCodigo).toBe('corporativo');
  });

  it('perfilActivo es null cuando ningun Perfil del CV esta marcado como activo', () => {
    setup();
    ctx.cv = {
      ...cvDetalle,
      perfiles: [
        { perfilId: 1, nombrePerfil: 'Backend', descripcionPerfil: null, experienciaPerfilAnios: null, aspiracionSalarialPesos: null, aspiracionSalarialDolares: null, esActivo: false },
      ],
    };

    expect(component.perfilActivo).toBeNull();
  });
});
