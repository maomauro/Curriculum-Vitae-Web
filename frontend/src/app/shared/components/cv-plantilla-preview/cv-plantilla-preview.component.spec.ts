import { TestBed } from '@angular/core/testing';
import { CvPlantillaPreviewComponent } from './cv-plantilla-preview.component';
import type { CvPreviewVisibilidad, CvPreviewVm } from '../../models/cv-preview-vm';

describe('CvPlantillaPreviewComponent', () => {
  let component: CvPlantillaPreviewComponent;

  function vmBase(over: Partial<CvPreviewVm> = {}): CvPreviewVm {
    return {
      plantillaCodigo: 'clasico',
      experienciaLaboralMesesAcumulados: 0,
      personales: null,
      perfiles: [],
      experiencias: [],
      formaciones: [],
      habilidades: [],
      proyectos: [],
      redesSociales: [],
      referenciasLaborales: [],
      ...over,
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CvPlantillaPreviewComponent] });
    component = TestBed.inject(CvPlantillaPreviewComponent);
  });

  it('nombreCompleto usa "Tu nombre" cuando no hay datos personales', () => {
    component.vm = vmBase();
    expect(component.nombreCompleto).toBe('Tu nombre');
  });

  it('nombreCompleto refleja el nombre cuando existe', () => {
    component.vm = vmBase({ personales: { nombreCompleto: 'Ana Gómez', fotoUrl: null, email: null, telefono: null, ciudad: null, pais: null } });
    expect(component.nombreCompleto).toBe('Ana Gómez');
  });

  it('previewRootClass incluye la clase de la plantilla activa', () => {
    component.vm = vmBase({ plantillaCodigo: 'ejecutivo' });
    expect(component.previewRootClass).toContain('cv-tpl--ejecutivo');
  });

  describe('zoom', () => {
    it('arranca en 100% y acercarZoom/alejarZoom lo ajustan de a 10%', () => {
      component.vm = vmBase();
      expect(component.etiquetaZoom).toBe('100%');

      component.acercarZoom();
      expect(component.etiquetaZoom).toBe('110%');

      component.alejarZoom();
      component.alejarZoom();
      expect(component.etiquetaZoom).toBe('90%');
    });

    it('respeta los límites [75%, 175%]', () => {
      component.vm = vmBase();
      for (let i = 0; i < 20; i++) component.alejarZoom();
      expect(component.etiquetaZoom).toBe('75%');

      for (let i = 0; i < 20; i++) component.acercarZoom();
      expect(component.etiquetaZoom).toBe('175%');
    });

    it('restablecerZoom vuelve a 100%', () => {
      component.vm = vmBase();
      component.acercarZoom();
      component.restablecerZoom();
      expect(component.etiquetaZoom).toBe('100%');
    });
  });

  describe('perfilPrincipal', () => {
    it('retorna null sin perfiles', () => {
      component.vm = vmBase({ perfiles: [] });
      expect(component.perfilPrincipal).toBeNull();
    });

    it('retorna el perfil activo si existe', () => {
      component.vm = vmBase({
        perfiles: [
          { perfilId: 1, nombrePerfil: 'A', descripcionPerfil: null, esActivo: false, aspiracionSalarialPesos: null, aspiracionSalarialDolares: null },
          { perfilId: 2, nombrePerfil: 'B', descripcionPerfil: null, esActivo: true, aspiracionSalarialPesos: null, aspiracionSalarialDolares: null },
        ],
      });
      expect(component.perfilPrincipal?.perfilId).toBe(2);
    });

    it('retorna el primero si ninguno está activo', () => {
      component.vm = vmBase({
        perfiles: [
          { perfilId: 1, nombrePerfil: 'A', descripcionPerfil: null, esActivo: false, aspiracionSalarialPesos: null, aspiracionSalarialDolares: null },
        ],
      });
      expect(component.perfilPrincipal?.perfilId).toBe(1);
    });
  });

  describe('trayectoriaCabecera', () => {
    it('null si no hay meses acumulados', () => {
      component.vm = vmBase({ experienciaLaboralMesesAcumulados: 0 });
      expect(component.trayectoriaCabecera).toBeNull();
    });

    it('solo meses cuando hay menos de un año', () => {
      component.vm = vmBase({ experienciaLaboralMesesAcumulados: 7 });
      expect(component.trayectoriaCabecera).toBe('Experiencia laboral acumulada: 7 meses');
    });

    it('solo años cuando los meses son exactos', () => {
      component.vm = vmBase({ experienciaLaboralMesesAcumulados: 24 });
      expect(component.trayectoriaCabecera).toBe('Experiencia laboral acumulada: 2 años');
    });

    it('años y meses combinados', () => {
      component.vm = vmBase({ experienciaLaboralMesesAcumulados: 25 });
      expect(component.trayectoriaCabecera).toBe('Experiencia laboral acumulada: 2 años y 1 mes');
    });
  });

  describe('aspiracionTexto', () => {
    const perfilCon = (cop: number | null, usd: number | null) => ({
      perfiles: [{ perfilId: 1, nombrePerfil: 'A', descripcionPerfil: null, esActivo: true, aspiracionSalarialPesos: cop, aspiracionSalarialDolares: usd }],
    });

    it('null sin perfil principal', () => {
      component.vm = vmBase({ perfiles: [] });
      expect(component.aspiracionTexto).toBeNull();
    });

    it('null si el perfil no tiene aspiración', () => {
      component.vm = vmBase(perfilCon(null, null));
      expect(component.aspiracionTexto).toBeNull();
    });

    it('combina COP y USD cuando ambos existen', () => {
      component.vm = vmBase(perfilCon(5000000, 1200));
      expect(component.aspiracionTexto).toContain('COP');
      expect(component.aspiracionTexto).toContain('USD');
    });
  });

  it('telefonoContacto retorna null si está vacío', () => {
    component.vm = vmBase({ personales: { nombreCompleto: '', fotoUrl: null, email: null, telefono: '  ', ciudad: null, pais: null } });
    expect(component.telefonoContacto).toBeNull();
  });

  describe('fotoHeaderUrl', () => {
    const conFoto = (url: string | null) => vmBase({ personales: { nombreCompleto: '', fotoUrl: url, email: null, telefono: null, ciudad: null, pais: null } });

    it('null sin foto', () => {
      component.vm = conFoto(null);
      expect(component.fotoHeaderUrl).toBeNull();
    });

    it('retorna la url sin gate de visibilidad', () => {
      component.vm = conFoto('https://x/foto.jpg');
      component.vis = null;
      expect(component.fotoHeaderUrl).toBe('https://x/foto.jpg');
    });

    it('respeta visibleAtributoSafe cuando hay vis', () => {
      component.vm = conFoto('https://x/foto.jpg');
      component.vis = mockVis({ attrSafe: false });
      expect(component.fotoHeaderUrl).toBeNull();
    });
  });

  it('inicialesFoto usa las dos primeras iniciales del nombre (o el placeholder "Tu nombre")', () => {
    component.vm = vmBase();
    expect(component.inicialesFoto).toBe('TN');

    component.vm = vmBase({ personales: { nombreCompleto: 'ana maria gomez', fotoUrl: null, email: null, telefono: null, ciudad: null, pais: null } });
    expect(component.inicialesFoto).toBe('AM');
  });

  describe('plantillas y layout', () => {
    it('esPlantillaCuerpoUnico/esPlantillaProfesional true para profesional, ats, ejecutivo', () => {
      for (const codigo of ['profesional', 'ats', 'ejecutivo'] as const) {
        component.vm = vmBase({ plantillaCodigo: codigo });
        expect(component.esPlantillaCuerpoUnico).toBeTrue();
        expect(component.esPlantillaProfesional).toBeTrue();
      }
    });

    it('mostrarCvPreviewSidebar siempre true para corporativo', () => {
      component.vm = vmBase({ plantillaCodigo: 'corporativo' });
      expect(component.mostrarCvPreviewSidebar).toBeTrue();
    });

    it('mostrarCvPreviewSidebar en clasico depende de si hay contenido lateral', () => {
      component.vm = vmBase({ plantillaCodigo: 'clasico', habilidades: [] });
      expect(component.mostrarCvPreviewSidebar).toBeFalse();

      component.vm = vmBase({
        plantillaCodigo: 'clasico',
        habilidades: [{ habilidadId: 1, nombre: 'Java', tipo: 'Tecnica', nivel: 'Avanzado', descripcion: null, nivelLectura: null, nivelEscritura: null, nivelEscucha: null, nivelHabla: null }],
      });
      expect(component.mostrarCvPreviewSidebar).toBeTrue();
    });
  });

  it('habilidadesTecnicas/Blandas/idiomas filtran por tipo', () => {
    component.vm = vmBase({
      habilidades: [
        { habilidadId: 1, nombre: 'Java', tipo: 'Tecnica', nivel: null, descripcion: null, nivelLectura: null, nivelEscritura: null, nivelEscucha: null, nivelHabla: null },
        { habilidadId: 2, nombre: 'Liderazgo', tipo: 'Blanda', nivel: null, descripcion: null, nivelLectura: null, nivelEscritura: null, nivelEscucha: null, nivelHabla: null },
        { habilidadId: 3, nombre: 'Inglés', tipo: 'Idioma', nivel: null, descripcion: null, nivelLectura: null, nivelEscritura: null, nivelEscucha: null, nivelHabla: null },
        { habilidadId: 4, nombre: 'Excel', tipo: 'Otra', nivel: null, descripcion: null, nivelLectura: null, nivelEscritura: null, nivelEscucha: null, nivelHabla: null },
      ],
    });
    expect(component.habilidadesTecnicas.map(h => h.habilidadId)).toEqual([1, 4]);
    expect(component.habilidadesBlandas.map(h => h.habilidadId)).toEqual([2]);
    expect(component.idiomas.map(h => h.habilidadId)).toEqual([3]);
  });

  it('formaciones se filtran por tipoFormacion en las 4 categorías', () => {
    component.vm = vmBase({
      formaciones: [
        { formacionId: 1, titulo: 'Ing', institucion: 'U', tipoFormacion: 'Pregrado', fechaInicio: null, fechaFin: null },
        { formacionId: 2, titulo: 'Diplo', institucion: 'U', tipoFormacion: 'Diplomado', fechaInicio: null, fechaFin: null },
        { formacionId: 3, titulo: 'Cert', institucion: 'U', tipoFormacion: 'Certificacion', fechaInicio: null, fechaFin: null },
        { formacionId: 4, titulo: 'Curso', institucion: 'U', tipoFormacion: 'Curso', fechaInicio: null, fechaFin: null },
      ],
    });
    expect(component.formacionesAcademicas.map(f => f.formacionId)).toEqual([1]);
    expect(component.formacionesDiplomado.map(f => f.formacionId)).toEqual([2]);
    expect(component.formacionesCertificacion.map(f => f.formacionId)).toEqual([3]);
    expect(component.formacionesCurso.map(f => f.formacionId)).toEqual([4]);
  });

  it('linkedin y githubDisplay buscan por nombre de red (case-insensitive)', () => {
    component.vm = vmBase({
      redesSociales: [
        { redSocialId: 1, nombreRed: 'LinkedIn', linkPublico: 'https://li/ana', usuarioContacto: null },
        { redSocialId: 2, nombreRed: 'GitHub', linkPublico: null, usuarioContacto: 'ana-dev' },
      ],
    });
    expect(component.linkedin).toBe('https://li/ana');
    expect(component.githubDisplay).toBe('ana-dev');
  });

  it('ciudadPais combina ambos, uno solo, o null', () => {
    component.vm = vmBase({ personales: { nombreCompleto: '', fotoUrl: null, email: null, telefono: null, ciudad: 'Bogotá', pais: 'Colombia' } });
    expect(component.ciudadPais).toBe('Bogotá, Colombia');

    component.vm = vmBase({ personales: { nombreCompleto: '', fotoUrl: null, email: null, telefono: null, ciudad: null, pais: null } });
    expect(component.ciudadPais).toBeNull();
  });

  it('referenciasPie solo incluye referencias sin experienciaId', () => {
    component.vm = vmBase({
      referenciasLaborales: [
        { referenciaId: 1, experienciaId: null, nombre: 'Juan', apellido: 'Pérez', cargo: null, empresa: null },
        { referenciaId: 2, experienciaId: 5, nombre: 'Ana', apellido: null, cargo: null, empresa: null },
      ],
    });
    expect(component.referenciasPie.map(r => r.referenciaId)).toEqual([1]);
  });

  it('skillPercent mapea niveles conocidos y usa 50 por defecto', () => {
    component.vm = vmBase();
    expect(component.skillPercent('nativo')).toBe(100);
    expect(component.skillPercent('B2')).toBe(65);
    expect(component.skillPercent('avanzado')).toBe(80);
    expect(component.skillPercent('básico')).toBe(40);
    expect(component.skillPercent('algo-raro')).toBe(50);
  });

  it('textoDetalleIdioma prioriza descripcion, luego arma detalle por destreza', () => {
    component.vm = vmBase();
    const h = { habilidadId: 1, nombre: 'Inglés', tipo: 'Idioma', nivel: 'B2', descripcion: 'Nivel B2 certificado', nivelLectura: null, nivelEscritura: null, nivelEscucha: null, nivelHabla: null };
    expect(component.textoDetalleIdioma(h)).toBe('Nivel B2 certificado');

    const h2 = { ...h, descripcion: null, nivelLectura: 'B2', nivelHabla: 'B1' };
    expect(component.textoDetalleIdioma(h2)).toBe('Lectura: B2 · Habla: B1');

    const h3 = { ...h, descripcion: null, nivelLectura: null, nivelEscritura: null, nivelEscucha: null, nivelHabla: null };
    expect(component.textoDetalleIdioma(h3)).toBeNull();
  });

  it('lineasBulletTexto separa por líneas y limpia viñetas', () => {
    component.vm = vmBase();
    expect(component.lineasBulletTexto('• Uno\n- Dos\n  Tres  ')).toEqual(['Uno', 'Dos', 'Tres']);
    expect(component.lineasBulletTexto(null)).toEqual([]);
    expect(component.lineasBulletTexto('   ')).toEqual([]);
  });

  describe('textoBlandaProfesional', () => {
    it('combina nombre y descripción cuando el atributo es visible', () => {
      component.vm = vmBase();
      component.vis = mockVis({ attr: true });
      const h = { habilidadId: 1, nombre: 'Comunicación', tipo: 'Blanda', nivel: null, descripcion: 'Habla en público', nivelLectura: null, nivelEscritura: null, nivelEscucha: null, nivelHabla: null };
      expect(component.textoBlandaProfesional(h)).toBe('Comunicación — Habla en público');
    });

    it('retorna null si no hay nombre ni descripción', () => {
      component.vm = vmBase();
      const h = { habilidadId: 1, nombre: '', tipo: 'Blanda', nivel: null, descripcion: null, nivelLectura: null, nivelEscritura: null, nivelEscucha: null, nivelHabla: null };
      expect(component.textoBlandaProfesional(h)).toBeNull();
    });
  });

  it('lineaEmpresaContrato retorna null si la sección "experiencia" no es visible', () => {
    component.vm = vmBase();
    component.vis = mockVis({ sec: false });
    const exp = { experienciaId: 1, empresa: 'Acme', cargo: 'Dev', fechaInicio: null, fechaFin: null, esActual: false, funciones: null, tipoContrato: 'Indefinido' };
    expect(component.lineaEmpresaContrato(exp)).toBeNull();
  });

  it('lineaEmpresaContrato combina empresa y tipo de contrato', () => {
    component.vm = vmBase();
    const exp = { experienciaId: 1, empresa: 'Acme', cargo: 'Dev', fechaInicio: null, fechaFin: null, esActual: false, funciones: null, tipoContrato: 'Indefinido' };
    expect(component.lineaEmpresaContrato(exp)).toBe('Acme · Indefinido');
  });

  describe('duracionExperiencia', () => {
    it('"—" sin fecha de inicio', () => {
      component.vm = vmBase();
      const exp = { experienciaId: 1, empresa: null, cargo: null, fechaInicio: null, fechaFin: null, esActual: false, funciones: null, tipoContrato: null };
      expect(component.duracionExperiencia(exp)).toBe('—');
    });

    it('calcula años y meses entre fechas', () => {
      component.vm = vmBase();
      const exp = { experienciaId: 1, empresa: null, cargo: null, fechaInicio: '2020-01-15', fechaFin: '2021-03-15', esActual: false, funciones: null, tipoContrato: null };
      expect(component.duracionExperiencia(exp)).toBe('1 año y 2 meses');
    });

    it('usa la fecha actual cuando esActual es true', () => {
      component.vm = vmBase();
      const exp = { experienciaId: 1, empresa: null, cargo: null, fechaInicio: '2020-01-01', fechaFin: null, esActual: true, funciones: null, tipoContrato: null };
      expect(component.duracionExperiencia(exp)).not.toBe('—');
    });
  });

  it('textoGraduacionAcademica respeta attrSafe("educacion","fechas")', () => {
    component.vm = vmBase();
    component.vis = mockVis({ attrSafe: false });
    const f = { formacionId: 1, titulo: 'Ing', institucion: 'U', tipoFormacion: 'Pregrado', fechaInicio: null, fechaFin: '2020-06-01' };
    expect(component.textoGraduacionAcademica(f)).toBeNull();

    component.vis = null;
    expect(component.textoGraduacionAcademica(f)).toBe('Graduado en 2020');
  });

  it('anioEntreParentesis toma el año de inicio o fin', () => {
    component.vm = vmBase();
    const f = { formacionId: 1, titulo: 'Ing', institucion: 'U', tipoFormacion: 'Pregrado', fechaInicio: '2018-01-01', fechaFin: null };
    expect(component.anioEntreParentesis(f)).toBe('(2018)');

    const sinFechas = { ...f, fechaInicio: null, fechaFin: null };
    expect(component.anioEntreParentesis(sinFechas)).toBe('');
  });

  it('lineaProyectoMeta arma rol, equipo y duración cuando son visibles', () => {
    component.vm = vmBase();
    const pr = { proyectoId: 1, nombreProyecto: 'X', rol: 'Líder', equipoTamano: 4, duracionMeses: 6, stackTecnologico: null, aporte: null, logro: null };
    expect(component.lineaProyectoMeta(pr)).toBe('Rol: Líder · Equipo: 4 personas · 6 meses');
  });

  it('textoProyecto prioriza aporte, luego logro, luego desafio, luego stack sin tags', () => {
    component.vm = vmBase();
    const base = { proyectoId: 1, nombreProyecto: 'X', rol: null, equipoTamano: null, duracionMeses: null, stackTecnologico: null, aporte: null, logro: null };
    expect(component.textoProyecto({ ...base, aporte: 'Aporté X' })).toBe('Aporté X');
    expect(component.textoProyecto({ ...base, logro: 'Logré Y' })).toBe('Logré Y');
    expect(component.textoProyecto({ ...base, desafio: 'Reto Z' })).toBe('Reto Z');
  });

  it('stackTags separa por coma/punto y coma y limpia espacios', () => {
    component.vm = vmBase();
    expect(component.stackTags('Angular, TypeScript; RxJS')).toEqual(['Angular', 'TypeScript', 'RxJS']);
    expect(component.stackTags(null)).toEqual([]);
  });

  it('referenciasLaboralesDe filtra por experienciaId y textoReferenciaLaboral arma la línea', () => {
    component.vm = vmBase({
      referenciasLaborales: [
        { referenciaId: 1, experienciaId: 10, nombre: 'Juan', apellido: 'Pérez', cargo: 'CTO', empresa: 'Acme', telefono: '555' },
        { referenciaId: 2, experienciaId: 20, nombre: 'Ana', apellido: null, cargo: null, empresa: null },
      ],
    });
    const refs = component.referenciasLaboralesDe(10);
    expect(refs.length).toBe(1);
    expect(component.textoReferenciaLaboral(refs[0])).toBe('Juan Pérez · CTO · 555');
  });

  describe('gates de visibilidad (sec/attr/attrSafe/bloqueForm/descarga)', () => {
    it('sin vis, todo visible por defecto salvo descarga', () => {
      component.vm = vmBase();
      component.vis = null;
      expect(component.sec('experiencia')).toBeTrue();
      expect(component.attr('experiencia', 'x')).toBeTrue();
      expect(component.attrSafe('experiencia', 'x')).toBeTrue();
      expect(component.bloqueForm('cursos')).toBeTrue();
      expect(component.descarga('cursos', 'x')).toBeFalse();
    });

    it('con vis, delega en los métodos del objeto de visibilidad', () => {
      component.vm = vmBase();
      component.vis = mockVis({ sec: false, attr: false, attrSafe: false, bloqueForm: false, descarga: true });
      expect(component.sec('experiencia')).toBeFalse();
      expect(component.attr('experiencia', 'x')).toBeFalse();
      expect(component.attrSafe('experiencia', 'x')).toBeFalse();
      expect(component.bloqueForm('cursos')).toBeFalse();
      expect(component.descarga('cursos', 'x')).toBeTrue();
    });
  });

  function mockVis(opts: {
    sec?: boolean;
    attr?: boolean;
    attrSafe?: boolean;
    bloqueForm?: boolean;
    descarga?: boolean;
  }): CvPreviewVisibilidad {
    return {
      visibleSeccion: () => opts.sec ?? true,
      visibleAtributo: () => opts.attr ?? true,
      visibleAtributoSafe: () => opts.attrSafe ?? true,
      visibleBloqueFormacion: () => opts.bloqueForm ?? true,
      visibleDescargarSoporte: () => opts.descarga ?? false,
    };
  }
});
