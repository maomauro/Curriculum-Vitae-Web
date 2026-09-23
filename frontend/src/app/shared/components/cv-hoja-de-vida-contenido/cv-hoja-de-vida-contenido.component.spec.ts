import { TestBed } from '@angular/core/testing';
import { CvHojaDeVidaContenidoComponent } from './cv-hoja-de-vida-contenido.component';
import { VisibilidadSeccionResolver } from '../../../core/utils/visibilidad-seccion-resolver';
import type {
  HojaDeVidaContenidoDto,
  PersonalesPublicoDto,
  PerfilPublicoDto,
  RedSocialPublicoDto,
} from '../../../core/services/public/public.service';

describe('CvHojaDeVidaContenidoComponent', () => {
  let component: CvHojaDeVidaContenidoComponent;

  const contenido: HojaDeVidaContenidoDto = {
    experiencia: [{ cabecera: 'Backend en Acme', funciones: ['Diseño de APIs'] }],
    educacion: ['Ingeniería de Sistemas'],
    proyectos: ['Portal de CV'],
    habilidades: [
      { nombre: 'C#', tipo: 'Tecnica' },
      { nombre: 'Liderazgo', tipo: 'Blanda' },
      { nombre: 'Inglés', tipo: 'Idioma' },
    ],
  };

  const personales: PersonalesPublicoDto = {
    nombreCompleto: 'Edgar Cifuentes',
    fotoUrl: 'https://cdn.test/foto.jpg',
    ciudad: 'Bogotá',
    pais: 'Colombia',
    celular: '3001234567',
    email: 'edgar@test.com',
  };

  const perfilActivo: PerfilPublicoDto = {
    perfilId: 1,
    nombrePerfil: 'Scrum Master',
    descripcionPerfil: 'Resumen del perfil',
    experienciaPerfilAnios: 5,
    aspiracionSalarialPesos: 8000000,
    aspiracionSalarialDolares: null,
    esActivo: true,
  };

  const redes: RedSocialPublicoDto[] = [
    { redSocialId: 1, nombreRed: 'LinkedIn', linkPublico: 'https://linkedin.com/in/edgar', usuarioContacto: null },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CvHojaDeVidaContenidoComponent] });
    component = TestBed.inject(CvHojaDeVidaContenidoComponent);
  });

  it('se crea correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('sin datos, valores por defecto seguros', () => {
    expect(component.contenido).toBeNull();
    expect(component.nombreCompleto).toBe('Tu nombre');
    expect(component.fotoHeaderUrl).toBeNull();
    expect(component.mostrarEmail).toBeFalse();
  });

  it('plantillaCodigo normaliza valores desconocidos a "clasico"', () => {
    component.plantillaCodigo = 'no-existe';
    expect(component.plantillaCodigo).toBe('clasico');
    expect(component.previewRootClass).toContain('cv-tpl--clasico');

    component.plantillaCodigo = 'corporativo';
    expect(component.plantillaCodigo).toBe('corporativo');
  });

  it('expone nombre, foto, contacto y redes a partir de los @Input()', () => {
    component.contenido = contenido;
    component.personales = personales;
    component.redesSociales = redes;
    component.perfilActivo = perfilActivo;

    expect(component.nombreCompleto).toBe('Edgar Cifuentes');
    expect(component.fotoHeaderUrl).toBe(personales.fotoUrl);
    expect(component.mostrarEmail).toBeTrue();
    expect(component.telefonoContacto).toBe('3001234567');
    expect(component.mostrarTelefono).toBeTrue();
    expect(component.ciudadPais).toBe('Bogotá, Colombia');
    expect(component.mostrarCiudadPais).toBeTrue();
    expect(component.redesConTexto).toEqual([{ icono: 'bi-linkedin', texto: 'https://linkedin.com/in/edgar' }]);
    expect(component.aspiracionTexto).toContain('COP');
  });

  it('respeta la visibilidad (vis) para ocultar atributos del encabezado', () => {
    component.personales = personales;
    component.vis = new VisibilidadSeccionResolver([{ seccion: 'datos-personales.foto', visible: false }]);

    expect(component.fotoHeaderUrl).toBeNull();
    expect(component.mostrarEmail).toBeTrue();
  });

  it('habilidadesPorTipo agrupa por Tecnica/Blanda/Idioma', () => {
    component.contenido = contenido;

    expect(component.habilidadesPorTipo('tecnica')).toEqual(['C#']);
    expect(component.habilidadesPorTipo('blanda')).toEqual(['Liderazgo']);
    expect(component.habilidadesPorTipo('idioma')).toEqual(['Inglés']);
  });
});
