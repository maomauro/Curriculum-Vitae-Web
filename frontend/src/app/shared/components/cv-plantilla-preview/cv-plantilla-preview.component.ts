import { Component, Input } from '@angular/core';
import type { CvPlantillaCodigo } from '../../../core/constants/cv-plantillas';
import type {
  CvPreviewExperienciaVm,
  CvPreviewFormacionVm,
  CvPreviewHabilidadVm,
  CvPreviewPerfilVm,
  CvPreviewProyectoVm,
  CvPreviewReferenciaVm,
  CvPreviewVisibilidad,
  CvPreviewVm,
} from '../../models/cv-preview-vm';

/**
 * Vista de plantilla de CV (mismas clases CSS que Mi CV: `cv-mi-preview`, `cv-tpl--*`).
 * Alimentar con {@link CvPreviewVm}; opcionalmente {@link CvPreviewVisibilidad} en edición.
 */
@Component({
  selector: 'app-cv-plantilla-preview',
  standalone: false,
  templateUrl: './cv-plantilla-preview.component.html',
})
export class CvPlantillaPreviewComponent {
  @Input({ required: true }) vm!: CvPreviewVm;
  @Input() vis: CvPreviewVisibilidad | null = null;
  /** Controles +/- para ampliar la vista previa en pantallas grandes (no afecta impresión/PDF). */
  @Input() mostrarControlesZoom = true;

  /** Rango de zoom solo pantalla; impresión fuerza 100% en CSS. */
  readonly zoomMin = 0.75;
  readonly zoomMax = 1.75;
  readonly zoomPaso = 0.1;
  nivelZoom = 1;

  private readonly tiposAcademicos = new Set(['Posgrado', 'Pregrado', 'Tecnologo', 'Tecnico']);

  sec(s: string): boolean {
    return this.vis?.visibleSeccion(s) ?? true;
  }

  attr(s: string, a: string): boolean {
    return this.vis?.visibleAtributo(s, a) ?? true;
  }

  attrSafe(s: string, a: string): boolean {
    return this.vis?.visibleAtributoSafe(s, a) ?? true;
  }

  bloqueForm(b: 'formacion-academica' | 'diplomados' | 'certificaciones' | 'cursos'): boolean {
    return this.vis?.visibleBloqueFormacion(b) ?? true;
  }

  descarga(
    b: 'formacion-academica' | 'diplomados' | 'certificaciones' | 'cursos',
    a: string
  ): boolean {
    return this.vis?.visibleDescargarSoporte(b, a) ?? false;
  }

  get plantillaCodigo(): CvPlantillaCodigo {
    return this.vm.plantillaCodigo;
  }

  get etiquetaZoom(): string {
    return `${Math.round(this.nivelZoom * 100)}%`;
  }

  acercarZoom(): void {
    this.ajustarZoom(this.nivelZoom + this.zoomPaso);
  }

  alejarZoom(): void {
    this.ajustarZoom(this.nivelZoom - this.zoomPaso);
  }

  restablecerZoom(): void {
    this.nivelZoom = 1;
  }

  private ajustarZoom(valor: number): void {
    const r = Math.round(valor * 100) / 100;
    this.nivelZoom = Math.min(this.zoomMax, Math.max(this.zoomMin, r));
  }

  get previewRootClass(): string {
    return `cv-mi-preview bg-white rounded-3 overflow-hidden cv-tpl--${this.plantillaCodigo}`;
  }

  get personales() {
    return this.vm.personales;
  }

  get nombreCompleto(): string {
    return (this.vm.personales?.nombreCompleto ?? '').trim() || 'Tu nombre';
  }

  get perfilPrincipal(): CvPreviewPerfilVm | null {
    const list = this.vm.perfiles ?? [];
    if (!list.length) return null;
    return list.find(p => p.esActivo) ?? list[0] ?? null;
  }

  get trayectoriaCabecera(): string | null {
    const totalMeses = this.vm.experienciaLaboralMesesAcumulados ?? 0;
    if (totalMeses <= 0) return null;
    const anios = Math.floor(totalMeses / 12);
    const meses = totalMeses % 12;
    const etiqueta = 'Experiencia laboral acumulada';
    if (anios < 1) return `${etiqueta}: ${meses} mes${meses === 1 ? '' : 'es'}`;
    if (meses === 0) return `${etiqueta}: ${anios} año${anios === 1 ? '' : 's'}`;
    return `${etiqueta}: ${anios} año${anios === 1 ? '' : 's'} y ${meses} mes${meses === 1 ? '' : 'es'}`;
  }

  get aspiracionTexto(): string | null {
    const p = this.perfilPrincipal;
    if (!p) return null;
    const cop = p.aspiracionSalarialPesos;
    const usd = p.aspiracionSalarialDolares;
    if (cop == null && usd == null) return null;
    const parts: string[] = [];
    if (cop != null) {
      parts.push(`$${Math.round(Number(cop)).toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP`);
    }
    if (usd != null) {
      parts.push(`$${Number(usd).toLocaleString('en-US', { maximumFractionDigits: 0 })} USD mensuales`);
    }
    return parts.join(' / ');
  }

  get telefonoContacto(): string | null {
    return (this.vm.personales?.telefono ?? '').trim() || null;
  }

  get fotoHeaderUrl(): string | null {
    const u = this.vm.personales?.fotoUrl?.trim();
    if (!u) return null;
    if (!this.vis) return u;
    return this.attrSafe('datos-personales', 'foto') ? u : null;
  }

  get inicialesFoto(): string {
    const n = this.nombreCompleto;
    const parts = n.split(/\s+/).filter(Boolean);
    const a = (parts[0]?.[0] ?? '').toUpperCase();
    const b = (parts[1]?.[0] ?? parts[0]?.[1] ?? '').toUpperCase();
    return (a + b) || 'CV';
  }

  get mostrarBloquePerfil(): boolean {
    return this.sec('perfil') && this.perfilPrincipal != null;
  }

  get sidebarClasicoTieneContenido(): boolean {
    if (this.plantillaCodigo !== 'clasico') return false;
    if (!this.sec('habilidades')) return false;
    return (
      this.habilidadesTecnicas.length > 0 ||
      this.habilidadesBlandas.length > 0 ||
      this.idiomas.length > 0
    );
  }

  get mostrarCvPreviewSidebar(): boolean {
    if (this.plantillaCodigo === 'corporativo') return true;
    if (this.plantillaCodigo === 'clasico') return this.sidebarClasicoTieneContenido;
    return false;
  }

  get esPlantillaCuerpoUnico(): boolean {
    return (
      this.plantillaCodigo === 'profesional' ||
      this.plantillaCodigo === 'ats' ||
      this.plantillaCodigo === 'ejecutivo'
    );
  }

  get esPlantillaProfesional(): boolean {
    return this.esPlantillaCuerpoUnico;
  }

  get experiencias(): CvPreviewExperienciaVm[] {
    return this.vm.experiencias ?? [];
  }

  get formaciones(): CvPreviewFormacionVm[] {
    return this.vm.formaciones ?? [];
  }

  get proyectos(): CvPreviewProyectoVm[] {
    return this.vm.proyectos ?? [];
  }

  get habilidadesTecnicas(): CvPreviewHabilidadVm[] {
    return (this.vm.habilidades ?? []).filter(h => h.tipo === 'Tecnica' || h.tipo === 'Otra');
  }

  get habilidadesBlandas(): CvPreviewHabilidadVm[] {
    return (this.vm.habilidades ?? []).filter(h => h.tipo === 'Blanda');
  }

  get idiomas(): CvPreviewHabilidadVm[] {
    return (this.vm.habilidades ?? []).filter(h => h.tipo === 'Idioma');
  }

  get formacionesAcademicas(): CvPreviewFormacionVm[] {
    return this.formaciones.filter(f => this.esTipoAcademico(f.tipoFormacion));
  }

  get formacionesDiplomado(): CvPreviewFormacionVm[] {
    return this.formaciones.filter(f => (f.tipoFormacion ?? '').trim() === 'Diplomado');
  }

  get formacionesCertificacion(): CvPreviewFormacionVm[] {
    return this.formaciones.filter(f => (f.tipoFormacion ?? '').trim() === 'Certificacion');
  }

  get formacionesCurso(): CvPreviewFormacionVm[] {
    return this.formaciones.filter(f => (f.tipoFormacion ?? '').trim() === 'Curso');
  }

  get linkedin(): string | null {
    const item = (this.vm.redesSociales ?? []).find(r =>
      (r.nombreRed ?? '').toLowerCase().includes('linkedin')
    );
    return item?.linkPublico?.trim() || item?.usuarioContacto?.trim() || null;
  }

  get githubDisplay(): string | null {
    const item = (this.vm.redesSociales ?? []).find(r =>
      (r.nombreRed ?? '').toLowerCase().includes('github')
    );
    return item?.linkPublico?.trim() || item?.usuarioContacto?.trim() || null;
  }

  get ciudadPais(): string | null {
    const ciudad = this.vm.personales?.ciudad?.trim();
    const pais = this.vm.personales?.pais?.trim();
    if (!ciudad && !pais) return null;
    if (ciudad && pais) return `${ciudad}, ${pais}`;
    return ciudad || pais || null;
  }

  get referenciasPie(): CvPreviewReferenciaVm[] {
    return (this.vm.referenciasLaborales ?? []).filter(r => r.experienciaId == null);
  }

  skillPercent(nivel: string | null): number {
    const n = (nivel ?? '').toLowerCase();
    if (n.includes('nativo')) return 100;
    switch (n) {
      case 'c2':
      case 'c1':
        return 95;
      case 'b2':
        return 65;
      case 'b1':
        return 50;
      case 'a2':
        return 35;
      case 'a1':
        return 25;
      case 'experto':
        return 95;
      case 'avanzado':
        return 80;
      case 'intermedio':
        return 60;
      case 'basico':
      case 'básico':
        return 40;
      default:
        return 50;
    }
  }

  textoDetalleIdioma(h: CvPreviewHabilidadVm): string | null {
    const d = h.descripcion?.trim();
    if (d) return d;
    const bits: string[] = [];
    if (h.nivelLectura?.trim()) bits.push(`Lectura: ${h.nivelLectura}`);
    if (h.nivelEscritura?.trim()) bits.push(`Escritura: ${h.nivelEscritura}`);
    if (h.nivelEscucha?.trim()) bits.push(`Escucha: ${h.nivelEscucha}`);
    if (h.nivelHabla?.trim()) bits.push(`Habla: ${h.nivelHabla}`);
    return bits.length ? bits.join(' · ') : null;
  }

  lineasBulletTexto(raw: string | null | undefined): string[] {
    if (raw == null || !String(raw).trim()) return [];
    return String(raw)
      .split(/\r?\n/)
      .map(l => l.replace(/^\s*[•\u2022\u00B7\-*]\s*/, '').trim())
      .filter(Boolean);
  }

  textoBlandaProfesional(h: CvPreviewHabilidadVm): string | null {
    const n = h.nombre?.trim();
    const d = h.descripcion?.trim();
    const showDesc = this.attr('habilidades', 'descripcion');
    if (!n && !d) return null;
    if (n && d && showDesc) return `${n} — ${d}`;
    if (n) return n;
    return showDesc ? d ?? null : null;
  }

  lineaEmpresaContrato(exp: CvPreviewExperienciaVm): string | null {
    if (!this.sec('experiencia')) return null;
    const emp = (exp.empresa ?? '').trim();
    const tc = (exp.tipoContrato ?? '').trim();
    if (!emp && !tc) return null;
    if (emp && tc) return `${emp} · ${tc}`;
    return emp || tc;
  }

  duracionExperiencia(exp: CvPreviewExperienciaVm): string {
    if (!exp.fechaInicio) return '—';
    const start = new Date(exp.fechaInicio);
    const end = this.resolverFinExperiencia(exp, new Date());
    if (!end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return '—';
    const months = this.diffInMonths(start, end);
    const y = Math.floor(months / 12);
    const m = months % 12;
    if (y === 0) return `${m} mes${m === 1 ? '' : 'es'}`;
    if (m === 0) return `${y} año${y === 1 ? '' : 's'}`;
    return `${y} año${y === 1 ? '' : 's'} y ${m} mes${m === 1 ? '' : 'es'}`;
  }

  private resolverFinExperiencia(exp: CvPreviewExperienciaVm, referencia: Date): Date | null {
    if (exp.esActual) return referencia;
    const fin = exp.fechaFin?.trim();
    if (fin) return new Date(fin);
    return referencia;
  }

  private diffInMonths(start: Date, end: Date): number {
    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();
    let total = years * 12 + months;
    if (end.getDate() < start.getDate()) total -= 1;
    return Math.max(0, total);
  }

  textoGraduacionAcademica(f: CvPreviewFormacionVm): string | null {
    if (!this.attrSafe('educacion', 'fechas')) return null;
    const y = this.anioDesdeFechaIso(f.fechaFin);
    if (y) return `Graduado en ${y}`;
    return null;
  }

  private anioDesdeFechaIso(iso: string | null | undefined): string | null {
    const s = iso?.trim();
    if (!s) return null;
    const y = s.slice(0, 4);
    return /^\d{4}$/.test(y) ? y : null;
  }

  anioEntreParentesis(f: CvPreviewFormacionVm): string {
    const d = f.fechaInicio || f.fechaFin;
    if (!d) return '';
    const y = d.slice(0, 4);
    return /^\d{4}$/.test(y) ? `(${y})` : '';
  }

  lineaProyectoMeta(pr: CvPreviewProyectoVm): string | null {
    const parts: string[] = [];
    if (this.attr('proyectos', 'rol') && pr.rol?.trim()) parts.push(`Rol: ${pr.rol.trim()}`);
    if (this.attr('proyectos', 'equipo') && pr.equipoTamano != null && pr.equipoTamano > 0) {
      parts.push(`Equipo: ${pr.equipoTamano} persona${pr.equipoTamano === 1 ? '' : 's'}`);
    }
    if (this.attr('proyectos', 'duracion') && pr.duracionMeses != null && pr.duracionMeses > 0) {
      parts.push(`${pr.duracionMeses} mes${pr.duracionMeses === 1 ? '' : 'es'}`);
    }
    return parts.length ? parts.join(' · ') : null;
  }

  textoProyecto(pr: CvPreviewProyectoVm): string | null {
    if (this.attr('proyectos', 'aporte') && pr.aporte?.trim()) return pr.aporte.trim();
    if (this.attr('proyectos', 'logro') && pr.logro?.trim()) return pr.logro.trim();
    if (this.attr('proyectos', 'desafio') && pr.desafio?.trim()) return pr.desafio.trim();
    if (this.attr('proyectos', 'stack') && pr.stackTecnologico?.trim()) {
      const s = pr.stackTecnologico.trim();
      if (!this.stackTags(s).length) return s;
    }
    return null;
  }

  stackTags(stack: string | null | undefined): string[] {
    return (stack ?? '')
      .split(/[,;]/)
      .map(t => t.trim())
      .filter(Boolean);
  }

  referenciasLaboralesDe(experienciaId: number): CvPreviewReferenciaVm[] {
    return (this.vm.referenciasLaborales ?? []).filter(r => r.experienciaId === experienciaId);
  }

  textoReferenciaLaboral(r: CvPreviewReferenciaVm): string {
    const name = [r.nombre, r.apellido].filter(Boolean).join(' ').trim();
    const parts = [name, r.cargo, r.telefono].filter(Boolean);
    return parts.join(' · ');
  }

  private esTipoAcademico(tipo: string | null | undefined): boolean {
    return this.tiposAcademicos.has((tipo ?? '').trim());
  }
}
