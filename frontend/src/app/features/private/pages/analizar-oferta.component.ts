import { Component, HostListener, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../../../core/services/shared/notification.service';
import {
  OfertaService,
  OfertaDto,
  OfertaEstado,
  OfertaOrigenEntrada,
  UpsertOfertaRequest,
} from '../../../core/services/private/oferta.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';

type ModoEntrada = 'texto' | 'imagen';
type Paso = 'historial' | 'entrada' | 'resultado' | 'generado' | 'yaAplicado';

interface OfertaAnalizadaForm {
  cargo: string;
  empresa: string;
  descripcion: string;
  correoReclutador: string;
  nombreReclutador: string;
}

interface FuenteOferta {
  origenEntrada: OfertaOrigenEntrada;
  textoOriginal: string;
}

interface PerfilEjemplo {
  id: number;
  nombre: string;
  palabrasClave: string[];
}

interface ContenidoCvEjemplo {
  resumen: string;
  experiencia: string[];
  educacion: string[];
  habilidades: string[];
}

const PERFILES_EJEMPLO: PerfilEjemplo[] = [
  { id: 1, nombre: 'Desarrollador Backend .NET', palabrasClave: ['backend', '.net', 'c#', 'api'] },
  { id: 2, nombre: 'Desarrollador Frontend Angular', palabrasClave: ['frontend', 'angular', 'typescript'] },
  { id: 3, nombre: 'Líder Técnico / Full Stack', palabrasClave: ['líder', 'lider', 'full stack', 'tech lead'] },
];

const CONTENIDO_POR_PERFIL: Record<number, ContenidoCvEjemplo> = {
  1: {
    resumen: 'Desarrollador Backend con experiencia en .NET, arquitectura de APIs REST y bases de datos relacionales.',
    experiencia: [
      'Desarrollador Backend .NET — Empresa Ejemplo S.A. (2022 - actualidad)',
      'Diseño y mantenimiento de microservicios, integración con Azure y control de calidad de código.',
    ],
    educacion: ['Ingeniería de Sistemas — Universidad Ejemplo (2018 - 2022)'],
    habilidades: ['C#', '.NET', 'SQL Server', 'Azure', 'Clean Architecture'],
  },
  2: {
    resumen: 'Desarrollador Frontend con experiencia en Angular, TypeScript y consumo de APIs REST.',
    experiencia: [
      'Desarrollador Frontend Angular — Empresa Ejemplo S.A. (2021 - actualidad)',
      'Construcción de interfaces responsivas y mantenimiento de componentes reutilizables.',
    ],
    educacion: ['Ingeniería de Sistemas — Universidad Ejemplo (2017 - 2021)'],
    habilidades: ['Angular', 'TypeScript', 'RxJS', 'Bootstrap', 'HTML/CSS'],
  },
  3: {
    resumen: 'Líder Técnico Full Stack con experiencia liderando equipos y definiendo arquitectura de soluciones.',
    experiencia: [
      'Líder Técnico — Empresa Ejemplo S.A. (2020 - actualidad)',
      'Definición de arquitectura, mentoría técnica y coordinación con equipos de producto.',
    ],
    educacion: ['Ingeniería de Sistemas — Universidad Ejemplo (2015 - 2020)'],
    habilidades: ['Angular', '.NET', 'Liderazgo técnico', 'Arquitectura de software'],
  },
};

const CONTENIDO_PERFIL_NUEVO: ContenidoCvEjemplo = {
  resumen: 'Perfil nuevo: se creará a partir de la información de esta oferta.',
  experiencia: ['Sin experiencia registrada aún — complétala en la sección Experiencia.'],
  educacion: ['Sin educación registrada aún — complétala en la sección Educación.'],
  habilidades: ['Por definir'],
};

@Component({
  selector: 'app-analizar-oferta',
  standalone: false,
  templateUrl: './analizar-oferta.component.html',
})
export class AnalizarOfertaComponent implements OnInit {
  modoEntrada: ModoEntrada = 'texto';
  textoOferta = '';
  archivoOferta: File | null = null;
  arrastrando = false;

  simularYaAplicado = false;
  paso: Paso = 'historial';
  analizando = false;
  guardando = false;

  oferta: OfertaAnalizadaForm = {
    cargo: '', empresa: '', descripcion: '', correoReclutador: '', nombreReclutador: '',
  };

  perfilesEjemplo = PERFILES_EJEMPLO;
  perfilSugeridoId: number | 'nuevo' = 'nuevo';

  fechaAplicacionSimulada = '';

  loading = true;
  ofertasGuardadas: OfertaDto[] = [];
  editandoOfertaId: number | null = null;
  private fuenteOferta: FuenteOferta | null = null;

  constructor(
    private notificationService: NotificationService,
    private ofertaService: OfertaService
  ) {}

  ngOnInit(): void {
    this.cargarHistorial();
  }

  private cargarHistorial(): void {
    this.loading = true;
    this.ofertaService.getOfertas().subscribe({
      next: data => {
        this.ofertasGuardadas = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      },
    });
  }

  trackByOferta(_index: number, o: OfertaDto): number {
    return o.ofertaId;
  }

  get puedeAnalizar(): boolean {
    return this.modoEntrada === 'texto'
      ? this.textoOferta.trim().length > 0
      : this.archivoOferta !== null;
  }

  get perfilSugeridoNombre(): string | null {
    if (this.perfilSugeridoId === 'nuevo') return null;
    return this.perfilesEjemplo.find(p => p.id === this.perfilSugeridoId)?.nombre ?? null;
  }

  get cvAtsTexto(): string {
    const contenido = this.perfilSugeridoId === 'nuevo'
      ? CONTENIDO_PERFIL_NUEVO
      : CONTENIDO_POR_PERFIL[this.perfilSugeridoId];
    const perfil = this.perfilSugeridoNombre ?? 'Perfil nuevo';

    return [
      'DATOS DE CONTACTO',
      '[Nombre del candidato] — [correo@ejemplo.com] — [Ciudad, País]',
      '',
      'OFERTA APLICADA',
      `${this.oferta.cargo || '—'} · ${this.oferta.empresa || '—'}`,
      `Perfil utilizado: ${perfil}`,
      '',
      'RESUMEN PROFESIONAL',
      contenido.resumen,
      '',
      'EXPERIENCIA LABORAL',
      ...contenido.experiencia,
      '',
      'EDUCACIÓN',
      ...contenido.educacion,
      '',
      'HABILIDADES',
      contenido.habilidades.join(', '),
    ].join('\n');
  }

  esCampoFaltante(valor: string | null | undefined): boolean {
    return !valor || !valor.trim();
  }

  /**
   * Pegar con Ctrl+V una captura copiada de otro lado (p. ej. un grupo de WhatsApp) es
   * el flujo real de entrada por imagen, más común que subir un archivo. Escucha a
   * nivel de documento (no hace falta hacer foco en la zona de arrastre primero) y solo
   * actúa mientras se está en el paso de entrada, en modo imagen.
   */
  @HostListener('document:paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    if (this.paso !== 'entrada' || this.modoEntrada !== 'imagen') return;

    const item = Array.from(event.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'));
    const archivo = item?.getAsFile();
    if (!archivo) return;

    event.preventDefault();
    this.archivoOferta = archivo;
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoOferta = input.files?.[0] ?? null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.arrastrando = true;
  }

  onDragLeave(): void {
    this.arrastrando = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.arrastrando = false;
    const archivo = event.dataTransfer?.files?.[0];
    if (archivo) this.archivoOferta = archivo;
  }

  quitarArchivo(): void {
    this.archivoOferta = null;
  }

  nuevaOferta(): void {
    this.resetFormularioEntrada();
    this.paso = 'entrada';
  }

  editarOferta(item: OfertaDto): void {
    this.editandoOfertaId = item.ofertaId;
    this.modoEntrada = item.origenEntrada;
    this.oferta = {
      cargo: item.cargo,
      empresa: item.empresa,
      descripcion: item.descripcion ?? '',
      correoReclutador: item.correoReclutador ?? '',
      nombreReclutador: item.nombreReclutador ?? '',
    };
    this.perfilSugeridoId = item.perfilId ?? 'nuevo';
    this.fuenteOferta = { origenEntrada: item.origenEntrada, textoOriginal: item.textoOriginal };
    this.paso = 'resultado';
  }

  eliminarOferta(item: OfertaDto): void {
    if (!confirm(`¿Eliminar la oferta guardada de "${item.cargo}" en "${item.empresa}"?`)) return;

    this.ofertaService.eliminarOferta(item.ofertaId).subscribe({
      next: () => {
        this.ofertasGuardadas = this.ofertasGuardadas.filter(o => o.ofertaId !== item.ofertaId);
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.deleteError),
    });
  }

  volverAlHistorial(): void {
    this.resetFormularioEntrada();
    this.paso = 'historial';
  }

  estadoLabel(estado: OfertaEstado): string {
    switch (estado) {
      case 'Analizada': return 'Analizada';
      case 'PerfilAsignado': return 'Perfil asignado';
      case 'CvGenerado': return 'CV generado';
    }
  }

  perfilNombreDe(item: OfertaDto): string {
    if (item.perfilId !== null) {
      return this.perfilesEjemplo.find(p => p.id === item.perfilId)?.nombre ?? '—';
    }
    return item.estado === 'Analizada' ? '—' : 'Perfil nuevo';
  }

  // TODO: reemplazar por llamada real a /ofertas/analizar (extracción con IA, Fase 2)
  analizarOferta(): void {
    if (!this.puedeAnalizar || this.analizando) return;
    this.analizando = true;

    setTimeout(() => {
      this.analizando = false;

      if (this.simularYaAplicado) {
        this.fechaAplicacionSimulada = this.formatearFechaHoy();
        this.paso = 'yaAplicado';
        return;
      }

      this.oferta = this.construirOfertaMock();
      this.perfilSugeridoId = this.sugerirPerfil(this.oferta.cargo);
      this.fuenteOferta = { origenEntrada: this.modoEntrada, textoOriginal: this.construirTextoOriginal() };
      this.paso = 'resultado';
    }, 1200);
  }

  continuarConPerfil(): void {
    if (this.guardando) return;

    const fuente = this.fuenteOferta ?? {
      origenEntrada: this.modoEntrada,
      textoOriginal: this.construirTextoOriginal(),
    };
    const request: UpsertOfertaRequest = {
      cargo: this.oferta.cargo.trim(),
      empresa: this.oferta.empresa.trim(),
      descripcion: this.oferta.descripcion.trim() || null,
      correoReclutador: this.oferta.correoReclutador.trim() || null,
      nombreReclutador: this.oferta.nombreReclutador.trim() || null,
      textoOriginal: fuente.textoOriginal,
      origenEntrada: fuente.origenEntrada,
      estado: 'CvGenerado',
      perfilId: this.perfilSugeridoId === 'nuevo' ? null : this.perfilSugeridoId,
    };

    this.guardando = true;
    const guardado$ = this.editandoOfertaId !== null
      ? this.ofertaService.actualizarOferta(this.editandoOfertaId, request)
      : this.ofertaService.crearOferta(request);

    guardado$.subscribe({
      next: ofertaGuardada => {
        this.guardando = false;
        this.upsertEnHistorial(ofertaGuardada);
        this.paso = 'generado';
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.notificationService.warning(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
    });
  }

  volverAEditar(): void {
    this.paso = 'resultado';
  }

  reiniciar(): void {
    this.resetFormularioEntrada();
    this.paso = 'historial';
  }

  // TODO: reemplazar por llamada real a /ofertas/analizar cuando el backend esté listo
  descargarPdf(): void {
    this.notificationService.info('Función simulada: la descarga del PDF estará disponible cuando se integre con el backend.');
  }

  // TODO: reemplazar por llamada real a /ofertas/analizar cuando el backend esté listo
  enviarPorCorreo(): void {
    this.notificationService.info('Función simulada: el envío por correo estará disponible cuando se integre con el backend.');
  }

  private upsertEnHistorial(item: OfertaDto): void {
    const idx = this.ofertasGuardadas.findIndex(o => o.ofertaId === item.ofertaId);
    this.ofertasGuardadas = idx >= 0
      ? [...this.ofertasGuardadas.slice(0, idx), item, ...this.ofertasGuardadas.slice(idx + 1)]
      : [item, ...this.ofertasGuardadas];
  }

  private construirOfertaMock(): OfertaAnalizadaForm {
    if (this.modoEntrada === 'imagen') {
      return {
        cargo: 'Desarrollador Backend .NET',
        empresa: 'Grupo Bancario Andino',
        descripcion: 'Desarrollo y mantenimiento de microservicios en .NET 10, integración con Azure y participación en ceremonias ágiles.',
        correoReclutador: 'seleccion@grupobancarioandino.com',
        nombreReclutador: '',
      };
    }
    return {
      cargo: 'Desarrollador Frontend Angular Senior',
      empresa: 'Tecnalia Software',
      descripcion: 'Buscamos un desarrollador Frontend con experiencia en Angular, TypeScript y consumo de APIs REST para fortalecer nuestro equipo de producto.',
      correoReclutador: '',
      nombreReclutador: 'Marcela Duarte',
    };
  }

  /** Sin OCR/IA real todavía (Fase 2): en modo imagen, se guarda una referencia al
   * archivo en vez del texto extraído. */
  private construirTextoOriginal(): string {
    if (this.modoEntrada === 'texto') return this.textoOferta.trim();
    return this.archivoOferta ? `(analizado desde imagen: ${this.archivoOferta.name})` : '(analizado desde imagen)';
  }

  private sugerirPerfil(cargo: string): number | 'nuevo' {
    const texto = cargo.toLowerCase();
    const coincidencia = this.perfilesEjemplo.find(p => p.palabrasClave.some(k => texto.includes(k)));
    return coincidencia ? coincidencia.id : 'nuevo';
  }

  private formatearFechaHoy(): string {
    return new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  private resetFormularioEntrada(): void {
    this.modoEntrada = 'texto';
    this.textoOferta = '';
    this.archivoOferta = null;
    this.simularYaAplicado = false;
    this.perfilSugeridoId = 'nuevo';
    this.editandoOfertaId = null;
    this.fuenteOferta = null;
    this.guardando = false;
    this.oferta = { cargo: '', empresa: '', descripcion: '', correoReclutador: '', nombreReclutador: '' };
  }
}
