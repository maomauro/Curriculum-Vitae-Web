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
import { CvEditorService, PerfilDto, PersonalesDto } from '../../../core/services/private/cv-editor.service';
import { CvGeneradoService, CvGeneradoDto } from '../../../core/services/private/cv-generado.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';

type Paso = 'historial' | 'entrada' | 'resultado' | 'sinCv' | 'correo' | 'enviado' | 'yaAplicado';

interface OfertaAnalizadaForm {
  cargo: string;
  empresa: string;
  descripcion: string;
  correoReclutador: string;
  nombreReclutador: string;
  modalidad: string;
  tipoContrato: string;
  moneda: string;
  duracion: string;
  horario: string;
  experienciaRequerida: string;
  stackTecnologico: string;
  nivelIdioma: string;
}

interface FuenteOferta {
  origenEntrada: OfertaOrigenEntrada;
  textoOriginal: string;
}

interface CorreoForm {
  destinatario: string;
  asunto: string;
  cuerpo: string;
}

function ofertaFormVacia(): OfertaAnalizadaForm {
  return {
    cargo: '', empresa: '', descripcion: '', correoReclutador: '', nombreReclutador: '',
    modalidad: '', tipoContrato: '', moneda: '', duracion: '', horario: '',
    experienciaRequerida: '', stackTecnologico: '', nivelIdioma: '',
  };
}

@Component({
  selector: 'app-analizar-oferta',
  standalone: false,
  templateUrl: './analizar-oferta.component.html',
})
export class AnalizarOfertaComponent implements OnInit {
  textoOferta = '';
  archivoOferta: File | null = null;
  arrastrando = false;
  private static readonly IMAGEN_TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
  private static readonly IMAGEN_MAX_BYTES = 5 * 1024 * 1024;

  paso: Paso = 'historial';
  analizando = false;
  guardando = false;

  oferta: OfertaAnalizadaForm = ofertaFormVacia();

  perfiles: PerfilDto[] = [];
  /** null: todavía sin sugerencia (o sin perfiles guardados) -- este flujo ya no
   * ofrece "crear perfil nuevo", solo elegir entre perfiles existentes. */
  perfilSugeridoId: number | null = null;
  perfilSeleccionRazon: string | null = null;
  seleccionandoPerfil = false;

  /** CVs ya construidos en Mi CV (uno por Perfil, como máximo) -- se usan tal cual,
   * este flujo ya no genera un CV nuevo con IA. */
  private cvsGenerados: CvGeneradoDto[] = [];
  /** Nombre del perfil elegido cuando todavía no tiene un CV generado (paso 'sinCv'). */
  perfilSinCvNombre: string | null = null;

  private personales: PersonalesDto | null = null;
  private ofertaEnProgresoId: number | null = null;
  redactandoCorreo = false;
  enviandoCorreo = false;
  promptRedactorPorDefecto = false;
  correoForm: CorreoForm = { destinatario: '', asunto: '', cuerpo: '' };

  /** Fecha mostrada en el paso 'yaAplicado' -- se llena con la FechaEnvioCorreo real de
   * la oferta al reabrirla desde el historial (ver editarOferta). */
  fechaEnvioMostrada = '';

  loading = true;
  ofertasGuardadas: OfertaDto[] = [];
  editandoOfertaId: number | null = null;

  /** Cada paso del flujo (extraer / seleccionar perfil / redactar correo) llama a la IA
   * por separado y puede usar el prompt por defecto del sistema de forma independiente
   * -- ver docs/arquitectura/Roadmap-Ofertas-IA.md. Se desconocen (false) al editar una
   * oferta ya guardada: ese dato no viaja con ella. */
  promptExtractorPorDefecto = false;
  promptSelectorPorDefecto = false;

  private fuenteOferta: FuenteOferta | null = null;

  get remitenteEmail(): string | null {
    return this.personales?.email?.trim() || null;
  }

  constructor(
    private notificationService: NotificationService,
    private ofertaService: OfertaService,
    private cvEditorService: CvEditorService,
    private cvGeneradoService: CvGeneradoService
  ) {}

  ngOnInit(): void {
    this.cargarHistorial();
    this.cvEditorService.getPerfiles().subscribe({
      next: data => (this.perfiles = data),
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.loadError),
    });
    this.cvEditorService.getPersonales().subscribe({
      next: data => (this.personales = data),
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.loadError),
    });
    this.cargarCvsGenerados();
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

  private cargarCvsGenerados(): void {
    this.cvGeneradoService.listar().subscribe({
      next: data => (this.cvsGenerados = data),
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.loadError),
    });
  }

  trackByOferta(_index: number, o: OfertaDto): number {
    return o.ofertaId;
  }

  get puedeAnalizar(): boolean {
    return this.textoOferta.trim().length > 0 || this.archivoOferta !== null;
  }

  /** Texto e imagen son complementarios, no excluyentes: registra con cual(es) se
   * analizó esta oferta (se manda todo lo presente en una sola solicitud a la IA). */
  get origenEntradaActual(): OfertaOrigenEntrada {
    const hayTexto = this.textoOferta.trim().length > 0;
    const hayImagen = this.archivoOferta !== null;
    if (hayTexto && hayImagen) return 'ambos';
    return hayImagen ? 'imagen' : 'texto';
  }

  get perfilSugeridoNombre(): string | null {
    if (this.perfilSugeridoId === null) return null;
    return this.perfiles.find(p => p.perfilId === this.perfilSugeridoId)?.nombrePerfil ?? null;
  }

  esCampoFaltante(valor: string | null | undefined): boolean {
    return !valor || !valor.trim();
  }

  /**
   * Pegar con Ctrl+V una captura copiada de otro lado (p. ej. un grupo de WhatsApp) es
   * el flujo real de entrada por imagen, más común que subir un archivo. Escucha a
   * nivel de documento (no hace falta hacer foco en la zona de arrastre primero) y solo
   * actúa mientras se está en el paso de entrada.
   */
  @HostListener('document:paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    if (this.paso !== 'entrada') return;

    const item = Array.from(event.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'));
    const archivo = item?.getAsFile();
    if (!archivo) return;

    event.preventDefault();
    this.asignarArchivoSiValido(archivo);
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    input.value = ''; // permite volver a elegir el mismo archivo despues (ej. tras un error)
    if (archivo) this.asignarArchivoSiValido(archivo);
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
    if (archivo) this.asignarArchivoSiValido(archivo);
  }

  private asignarArchivoSiValido(archivo: File): void {
    if (!AnalizarOfertaComponent.IMAGEN_TIPOS_PERMITIDOS.includes(archivo.type)) {
      this.notificationService.warning('Formato no soportado. Usa JPG, PNG o WEBP.');
      return;
    }
    if (archivo.size > AnalizarOfertaComponent.IMAGEN_MAX_BYTES) {
      this.notificationService.warning('La imagen no puede superar 5 MB.');
      return;
    }
    this.archivoOferta = archivo;
  }

  quitarArchivo(): void {
    this.archivoOferta = null;
  }

  nuevaOferta(): void {
    this.resetFormularioEntrada();
    this.paso = 'entrada';
  }

  editarOferta(item: OfertaDto): void {
    if (item.estado === 'EnviadaPorCorreo') {
      this.oferta = {
        cargo: item.cargo,
        empresa: item.empresa,
        descripcion: item.descripcion ?? '',
        correoReclutador: item.correoReclutador ?? '',
        nombreReclutador: item.nombreReclutador ?? '',
        modalidad: item.modalidad ?? '',
        tipoContrato: item.tipoContrato ?? '',
        moneda: item.moneda ?? '',
        duracion: item.duracion ?? '',
        horario: item.horario ?? '',
        experienciaRequerida: item.experienciaRequerida ?? '',
        stackTecnologico: item.stackTecnologico ?? '',
        nivelIdioma: item.nivelIdioma ?? '',
      };
      this.fechaEnvioMostrada = item.fechaEnvioCorreo
        ? this.formatearFecha(new Date(item.fechaEnvioCorreo))
        : '';
      this.paso = 'yaAplicado';
      return;
    }

    this.editandoOfertaId = item.ofertaId;
    this.ofertaEnProgresoId = item.ofertaId;
    this.oferta = {
      cargo: item.cargo,
      empresa: item.empresa,
      descripcion: item.descripcion ?? '',
      correoReclutador: item.correoReclutador ?? '',
      nombreReclutador: item.nombreReclutador ?? '',
      modalidad: item.modalidad ?? '',
      tipoContrato: item.tipoContrato ?? '',
      moneda: item.moneda ?? '',
      duracion: item.duracion ?? '',
      horario: item.horario ?? '',
      experienciaRequerida: item.experienciaRequerida ?? '',
      stackTecnologico: item.stackTecnologico ?? '',
      nivelIdioma: item.nivelIdioma ?? '',
    };
    this.perfilSeleccionRazon = null;
    this.fuenteOferta = { origenEntrada: item.origenEntrada, textoOriginal: item.textoOriginal };
    // Ninguno de los dos viaja con la oferta guardada; se desconocen al editar.
    this.promptExtractorPorDefecto = false;
    this.promptSelectorPorDefecto = false;

    if (item.perfilId !== null) {
      // El perfil ya estaba asignado (el flujo quedó interrumpido antes de enviar) --
      // retoma directo en el borrador de correo en vez de hacer pasar de nuevo por la
      // confirmación de perfil.
      this.perfilSugeridoId = item.perfilId;
      this.paso = 'resultado';
      this.continuarSegunCvDelPerfil(item.perfilId);
    } else {
      this.paso = 'resultado';
      // La oferta se guardó antes de elegir perfil (estado 'Analizada'): pide una
      // sugerencia fresca, igual que tras analizar una oferta nueva.
      this.sugerirPerfilConIa();
    }
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
      case 'EnviadaPorCorreo': return 'Enviada por correo';
    }
  }

  perfilNombreDe(item: OfertaDto): string {
    if (item.perfilId !== null) {
      return this.perfiles.find(p => p.perfilId === item.perfilId)?.nombrePerfil ?? '—';
    }
    return item.estado === 'Analizada' ? '—' : 'Sin perfil asignado';
  }

  tieneAtributosDetallados(item: OfertaDto): boolean {
    return !!(item.modalidad || item.tipoContrato || item.duracion || item.horario
      || item.experienciaRequerida || item.nivelIdioma || item.stackTecnologico);
  }

  analizarOferta(): void {
    if (!this.puedeAnalizar || this.analizando) return;
    this.analizando = true;

    this.ofertaService.analizarOferta(this.textoOferta.trim() || null, this.archivoOferta).subscribe({
      next: resultado => {
        this.analizando = false;
        this.oferta = {
          cargo: resultado.cargo,
          empresa: resultado.empresa,
          descripcion: resultado.descripcion ?? '',
          correoReclutador: resultado.correoReclutador ?? '',
          nombreReclutador: resultado.nombreReclutador ?? '',
          modalidad: resultado.modalidad ?? '',
          tipoContrato: resultado.tipoContrato ?? '',
          moneda: resultado.moneda ?? '',
          duracion: resultado.duracion ?? '',
          horario: resultado.horario ?? '',
          experienciaRequerida: resultado.experienciaRequerida ?? '',
          stackTecnologico: resultado.stackTecnologico ?? '',
          nivelIdioma: resultado.nivelIdioma ?? '',
        };
        this.fuenteOferta = { origenEntrada: resultado.origenEntrada, textoOriginal: resultado.textoOriginal };
        this.promptExtractorPorDefecto = resultado.promptPorDefecto;
        this.paso = 'resultado';
        this.sugerirPerfilConIa();
      },
      error: (error: HttpErrorResponse) => {
        this.analizando = false;
        this.notificationService.error(extractApiErrorMessage(error) || 'No se pudo analizar la oferta.');
      },
    });
  }

  /** Fase 3: sugiere con IA cuál de los perfiles existentes del candidato se ajusta
   * mejor a la oferta. El usuario puede cambiar la sugerencia en el <select> antes de
   * continuar. Si no tiene ningún perfil guardado, la API devuelve 400 y el flujo se
   * detiene: hay que crear uno en Perfil Profesional primero. */
  private sugerirPerfilConIa(): void {
    this.seleccionandoPerfil = true;
    this.ofertaService
      .seleccionarPerfil({
        cargo: this.oferta.cargo,
        empresa: this.oferta.empresa,
        descripcion: this.oferta.descripcion || null,
      })
      .subscribe({
        next: sugerido => {
          this.seleccionandoPerfil = false;
          this.perfilSugeridoId = sugerido.perfilId;
          this.perfilSeleccionRazon = sugerido.razon;
          this.promptSelectorPorDefecto = sugerido.promptPorDefecto;
        },
        error: (error: HttpErrorResponse) => {
          this.seleccionandoPerfil = false;
          this.perfilSugeridoId = null;
          this.perfilSeleccionRazon = null;
          const mensaje = this.perfiles.length === 0
            ? 'Todavía no tienes perfiles guardados. Crea uno en Perfil Profesional antes de continuar.'
            : extractApiErrorMessage(error) || 'No se pudo sugerir un perfil. Elige uno manualmente para continuar.';
          this.notificationService.warning(mensaje);
        },
      });
  }

  /** Guarda la oferta con el perfil elegido y, según si ese perfil ya tiene un CV
   * construido en Mi CV, sigue directo a redactar el correo o muestra el aviso de que
   * falta generarlo primero -- este flujo ya no genera un CV nuevo con IA. */
  continuarConPerfil(): void {
    if (this.guardando || this.perfilSugeridoId === null) return;
    const perfilElegidoId = this.perfilSugeridoId;

    const fuente = this.fuenteOferta ?? {
      origenEntrada: this.origenEntradaActual,
      textoOriginal: this.construirTextoOriginal(),
    };
    const request: UpsertOfertaRequest = {
      cargo: this.oferta.cargo.trim(),
      empresa: this.oferta.empresa.trim(),
      descripcion: this.oferta.descripcion.trim() || null,
      correoReclutador: this.oferta.correoReclutador.trim() || null,
      nombreReclutador: this.oferta.nombreReclutador.trim() || null,
      modalidad: this.oferta.modalidad.trim() || null,
      tipoContrato: this.oferta.tipoContrato.trim() || null,
      moneda: this.oferta.moneda.trim() || null,
      duracion: this.oferta.duracion.trim() || null,
      horario: this.oferta.horario.trim() || null,
      experienciaRequerida: this.oferta.experienciaRequerida.trim() || null,
      stackTecnologico: this.oferta.stackTecnologico.trim() || null,
      nivelIdioma: this.oferta.nivelIdioma.trim() || null,
      textoOriginal: fuente.textoOriginal,
      origenEntrada: fuente.origenEntrada,
      estado: 'PerfilAsignado',
      perfilId: perfilElegidoId,
    };

    this.guardando = true;
    const guardado$ = this.editandoOfertaId !== null
      ? this.ofertaService.actualizarOferta(this.editandoOfertaId, request)
      : this.ofertaService.crearOferta(request);

    guardado$.subscribe({
      next: ofertaGuardada => {
        this.guardando = false;
        this.ofertaEnProgresoId = ofertaGuardada.ofertaId;
        this.cargarHistorial();
        this.continuarSegunCvDelPerfil(perfilElegidoId);
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.notificationService.warning(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
    });
  }

  private continuarSegunCvDelPerfil(perfilElegidoId: number): void {
    const cvDelPerfil = this.cvsGenerados.find(c => c.perfilId === perfilElegidoId);
    if (!cvDelPerfil) {
      this.perfilSinCvNombre = this.perfilSugeridoNombre;
      this.paso = 'sinCv';
      return;
    }
    this.redactarCorreo();
  }

  /** Pide a la IA un borrador de asunto/cuerpo para el correo al reclutador -- no
   * persiste ni envía nada, el usuario lo revisa/edita antes de "Enviar correo". */
  redactarCorreo(): void {
    if (this.ofertaEnProgresoId === null || this.redactandoCorreo) return;

    this.redactandoCorreo = true;
    this.ofertaService.redactarCorreo(this.ofertaEnProgresoId).subscribe({
      next: borrador => {
        this.redactandoCorreo = false;
        this.promptRedactorPorDefecto = borrador.promptPorDefecto;
        this.correoForm = {
          destinatario: this.oferta.correoReclutador.trim(),
          asunto: borrador.asunto,
          cuerpo: borrador.cuerpo,
        };
        this.paso = 'correo';
      },
      error: (error: HttpErrorResponse) => {
        this.redactandoCorreo = false;
        this.notificationService.error(extractApiErrorMessage(error) || 'No se pudo redactar el correo.');
      },
    });
  }

  enviarCorreo(): void {
    if (this.ofertaEnProgresoId === null || this.enviandoCorreo) return;
    if (this.esCampoFaltante(this.correoForm.destinatario)) {
      this.notificationService.warning('El correo del destinatario es requerido.');
      return;
    }

    this.enviandoCorreo = true;
    this.ofertaService
      .enviarCorreo(this.ofertaEnProgresoId, {
        destinatario: this.correoForm.destinatario.trim(),
        asunto: this.correoForm.asunto.trim(),
        cuerpo: this.correoForm.cuerpo.trim(),
      })
      .subscribe({
        next: () => {
          this.enviandoCorreo = false;
          this.cargarHistorial();
          this.paso = 'enviado';
        },
        error: (error: HttpErrorResponse) => {
          this.enviandoCorreo = false;
          this.notificationService.error(extractApiErrorMessage(error) || 'No se pudo enviar el correo.');
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

  /** Fallback defensivo si por algún motivo se llega a continuarConPerfil() sin
   * fuenteOferta ya establecido (no debería ocurrir en el flujo normal, ver
   * analizarOferta/editarOferta). Refleja el mismo criterio que aplica el backend. */
  private construirTextoOriginal(): string {
    const texto = this.textoOferta.trim();
    const archivo = this.archivoOferta ? `(+ imagen adjunta: ${this.archivoOferta.name})` : '';
    if (texto && archivo) return `${texto}\n\n${archivo}`;
    if (archivo) return `(analizado desde imagen: ${this.archivoOferta!.name})`;
    return texto;
  }

  private formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  private resetFormularioEntrada(): void {
    this.textoOferta = '';
    this.archivoOferta = null;
    this.perfilSugeridoId = null;
    this.perfilSeleccionRazon = null;
    this.seleccionandoPerfil = false;
    this.editandoOfertaId = null;
    this.fuenteOferta = null;
    this.guardando = false;
    this.perfilSinCvNombre = null;
    this.ofertaEnProgresoId = null;
    this.redactandoCorreo = false;
    this.enviandoCorreo = false;
    this.promptRedactorPorDefecto = false;
    this.correoForm = { destinatario: '', asunto: '', cuerpo: '' };
    this.promptExtractorPorDefecto = false;
    this.promptSelectorPorDefecto = false;
    this.oferta = ofertaFormVacia();
  }
}
