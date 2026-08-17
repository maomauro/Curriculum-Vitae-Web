import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  CvEditorService,
  FormacionDto,
  UpdateFormacionVisibilidadRequest,
  UpsertFormacionRequest,
} from '../../../core/services/private/cv-editor.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { FORM_MESSAGES } from '../../../core/constants/form-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage, getTodayDateString, normalizeDateOrNull } from '../../../core/utils/form-validation.util';

interface FormacionUI extends FormacionDto {
  expanded: boolean;
  form: UpsertFormacionRequest;
}

@Component({
  selector: 'app-educacion',
  standalone: false,
  templateUrl: './educacion.component.html',
})
export class EducacionComponent implements OnInit {
  formaciones: FormacionUI[] = [];
  loading = false;
  guardando = false;
  todayDate = getTodayDateString();
  guardandoVisibilidadFormacionId: number | null = null;

  /** Valores enviados al API (string libre en backend, máx. 50 caracteres). */
  readonly tipoFormacionOptions = [
    { value: 'Posgrado', label: 'Posgrado' },
    { value: 'Pregrado', label: 'Pregrado' },
    { value: 'Tecnologo', label: 'Tecnólogo' },
    { value: 'Tecnico', label: 'Técnico' },
    { value: 'Diplomado', label: 'Diplomado' },
    { value: 'Certificacion', label: 'Certificación' },
    { value: 'Curso', label: 'Curso' },
  ] as const;

  readonly hintAdjuntoSoporte =
    'Próximamente podrás adjuntar el diploma o certificado; el campo está deshabilitado por ahora.';
  readonly notaAdjuntoSoporte =
    'La carga de archivos se habilitará próximamente; por ahora el CV no almacena el adjunto desde el navegador.';

  constructor(
    private cvEditorService: CvEditorService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  esCertificacion(tipo: string | null | undefined): boolean {
    return (tipo ?? '').trim() === 'Certificacion';
  }

  /** Evita NaN u otros valores que rompen la deserialización a int? en el API. */
  private normalizeDuracionHoras(value: number | null | undefined): number | null {
    if (value == null) {
      return null;
    }
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n) || n < 0) {
      return null;
    }
    return Math.floor(n);
  }

  etiquetaTitulo(edu: FormacionUI): string {
    return this.esCertificacion(edu.form.tipoFormacion) ? 'Nombre del certificado' : 'Título obtenido';
  }

  etiquetaInstitucion(edu: FormacionUI): string {
    return this.esCertificacion(edu.form.tipoFormacion) ? 'Entidad certificadora' : 'Institución';
  }

  etiquetaFechaInicio(edu: FormacionUI): string {
    return this.esCertificacion(edu.form.tipoFormacion) ? 'Fecha de obtención' : 'Fecha inicio';
  }

  placeholderTitulo(edu: FormacionUI): string {
    return this.esCertificacion(edu.form.tipoFormacion)
      ? 'Ej: AWS Certified Developer – Associate'
      : 'Ej: Especialización en Ingeniería de Software';
  }

  placeholderInstitucion(edu: FormacionUI): string {
    return this.esCertificacion(edu.form.tipoFormacion)
      ? 'Ej: Amazon Web Services'
      : 'Ej: Universidad de los Andes';
  }

  trackByFormacion(_index: number, edu: FormacionUI): number {
    return edu.formacionId;
  }

  onHeaderClick(edu: FormacionUI, ev: MouseEvent): void {
    const el = ev.target as HTMLElement;
    if (el.closest('button')) {
      return;
    }
    edu.expanded = !edu.expanded;
  }

  private datosCabecera(edu: FormacionUI): UpsertFormacionRequest {
    return edu.formacionId === 0 || edu.expanded ? edu.form : this.toForm(edu);
  }

  tituloCabecera(edu: FormacionUI): string {
    const d = this.datosCabecera(edu);
    return (d.titulo ?? '').trim() || 'Nueva formación';
  }

  subtituloCabecera(edu: FormacionUI): string {
    const d = this.datosCabecera(edu);
    return (d.institucion ?? '').trim() || '—';
  }

  tipoParaCabecera(edu: FormacionUI): string | null {
    return this.datosCabecera(edu).tipoFormacion;
  }

  /** Año o rango tipo prototipo (ej. 2020 — 2021 o 2023). */
  rangoFechasCabecera(edu: FormacionUI): string | null {
    const d = this.datosCabecera(edu);
    const y = (s: string | null | undefined): string | null => {
      if (!s) {
        return null;
      }
      const yy = s.slice(0, 4);
      return /^\d{4}$/.test(yy) ? yy : null;
    };

    if (this.esCertificacion(d.tipoFormacion)) {
      const a = y(d.fechaInicio);
      return a;
    }

    const ini = y(d.fechaInicio);
    const fin = y(d.fechaFin);
    if (ini && fin && ini !== fin) {
      return `${ini} — ${fin}`;
    }
    return fin ?? ini ?? null;
  }

  cargar(): void {
    this.loading = true;
    this.cvEditorService.getFormaciones().subscribe({
      next: data => {
        this.formaciones = data.map(f => ({ ...f, expanded: false, form: this.toForm(f) }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      },
    });
  }

  private toForm(f: FormacionDto): UpsertFormacionRequest {
    const { formacionId: _id, ...rest } = f;
    return { ...rest, mostrarEnCv: rest.mostrarEnCv !== false };
  }

  onMostrarEnCvChange(edu: FormacionUI, visible: boolean): void {
    if (edu.formacionId === 0) {
      return;
    }
    const prev = !visible;
    if (this.guardandoVisibilidadFormacionId === edu.formacionId) {
      return;
    }
    this.guardandoVisibilidadFormacionId = edu.formacionId;
    const payload: UpdateFormacionVisibilidadRequest = { mostrarEnCv: visible };
    this.cvEditorService.updateFormacionVisibilidad(edu.formacionId, payload).subscribe({
      next: actualizada => {
        Object.assign(edu, actualizada, { expanded: edu.expanded, form: this.toForm(actualizada) });
        this.guardandoVisibilidadFormacionId = null;
        this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
      },
      error: (error: HttpErrorResponse) => {
        edu.form.mostrarEnCv = prev;
        this.guardandoVisibilidadFormacionId = null;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
    });
  }

  agregar(): void {
    if (this.formaciones.some(f => f.formacionId === 0)) {
      this.notificationService.warning(FORM_MESSAGES.educacion.completeNuevaAntesDeOtra);
      return;
    }
    const nueva: FormacionUI = {
      formacionId: 0,
      titulo: null,
      institucion: null,
      area: null,
      fechaInicio: null,
      fechaFin: null,
      tipoFormacion: 'Posgrado',
      descripcion: null,
      adjuntoSoporte: null,
      fechaVigencia: null,
      duracionHoras: null,
      mostrarEnCv: true,
      expanded: true,
      form: {
        titulo: null,
        institucion: null,
        area: null,
        fechaInicio: null,
        fechaFin: null,
        tipoFormacion: 'Posgrado',
        descripcion: null,
        adjuntoSoporte: null,
        fechaVigencia: null,
        duracionHoras: null,
        mostrarEnCv: true,
      },
    };
    this.formaciones.unshift(nueva);
  }

  cancelar(edu: FormacionUI): void {
    if (edu.formacionId !== 0) {
      return;
    }
    this.formaciones = this.formaciones.filter(f => f !== edu);
  }

  guardar(edu: FormacionUI): void {
    const titulo = (edu.form.titulo ?? '').trim();
    const institucion = (edu.form.institucion ?? '').trim();
    const esCert = this.esCertificacion(edu.form.tipoFormacion);

    if (!titulo) {
      this.notificationService.warning(
        esCert ? FORM_MESSAGES.educacion.requiredNombreCertificado : FORM_MESSAGES.educacion.requiredTituloObtenido
      );
      return;
    }
    if (!institucion) {
      this.notificationService.warning(
        esCert
          ? FORM_MESSAGES.educacion.requiredEntidadCertificadora
          : FORM_MESSAGES.educacion.requiredInstitucion
      );
      return;
    }
    edu.form.titulo = titulo;
    edu.form.institucion = institucion;

    const fechaFinNorm = esCert ? null : normalizeDateOrNull(edu.form.fechaFin);
    const fechaVigenciaNorm = esCert ? normalizeDateOrNull(edu.form.fechaVigencia) : null;

    const payload: UpsertFormacionRequest = {
      ...edu.form,
      fechaInicio: normalizeDateOrNull(edu.form.fechaInicio),
      fechaFin: fechaFinNorm,
      fechaVigencia: fechaVigenciaNorm,
      duracionHoras: this.normalizeDuracionHoras(edu.form.duracionHoras),
    };

    if (edu.form.fechaInicio && !payload.fechaInicio) {
      this.notificationService.warning(FORM_MESSAGES.educacion.invalidDate);
      return;
    }

    if (!esCert && edu.form.fechaFin && !payload.fechaFin) {
      this.notificationService.warning(FORM_MESSAGES.educacion.invalidDate);
      return;
    }

    if (esCert && edu.form.fechaVigencia && !payload.fechaVigencia) {
      this.notificationService.warning(FORM_MESSAGES.educacion.invalidDate);
      return;
    }

    this.guardando = true;
    if (edu.formacionId === 0) {
      this.cvEditorService.createFormacion(payload).subscribe({
        next: creada => {
          Object.assign(edu, creada, { expanded: false, form: this.toForm(creada) });
          this.guardando = false;
          this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
        },
        error: (error: HttpErrorResponse) => {
          this.guardando = false;
          this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
        },
      });
    } else {
      this.cvEditorService.updateFormacion(edu.formacionId, payload).subscribe({
        next: actualizada => {
          Object.assign(edu, actualizada, { expanded: false, form: this.toForm(actualizada) });
          this.guardando = false;
          this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
        },
        error: (error: HttpErrorResponse) => {
          this.guardando = false;
          this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
        },
      });
    }
  }

  eliminar(edu: FormacionUI): void {
    if (edu.formacionId === 0) {
      return;
    }
    if (!confirm(FORM_MESSAGES.educacion.confirmDelete)) {
      return;
    }
    this.cvEditorService.deleteFormacion(edu.formacionId).subscribe({
      next: () => {
        this.formaciones = this.formaciones.filter(f => f !== edu);
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.deleteError),
    });
  }

  icono(tipo: string | null): string {
    const map: Record<string, string> = {
      Posgrado: 'bi-award-fill',
      Pregrado: 'bi-mortarboard-fill',
      Tecnologo: 'bi-mortarboard-fill',
      Tecnico: 'bi-tools',
      Diplomado: 'bi-journal-richtext',
      Certificacion: 'bi-patch-check-fill',
      Curso: 'bi-play-circle-fill',
    };
    return tipo ? (map[tipo] ?? 'bi-mortarboard-fill') : 'bi-mortarboard-fill';
  }

  iconoBg(tipo: string | null): string {
    const map: Record<string, string> = {
      Posgrado: '#f3e8ff',
      Pregrado: '#ebf2ff',
      Tecnologo: '#d1fae5',
      Tecnico: '#d1fae5',
      Diplomado: '#e0e7ff',
      Certificacion: '#fef9c3',
      Curso: '#fff3e0',
    };
    return tipo ? (map[tipo] ?? '#f1f5f9') : '#f1f5f9';
  }

  iconoColor(tipo: string | null): string {
    const map: Record<string, string> = {
      Posgrado: '#7c3aed',
      Pregrado: '#2c7be5',
      Tecnologo: '#065f46',
      Tecnico: '#065f46',
      Diplomado: '#4338ca',
      Certificacion: '#92400e',
      Curso: '#e65100',
    };
    return tipo ? (map[tipo] ?? '#6c757d') : '#6c757d';
  }

  /** Etiqueta para badge; si el API devuelve un valor legacy no listado, se muestra tal cual. */
  labelTipo(tipo: string | null): string {
    if (!tipo) {
      return '—';
    }
    const opt = this.tipoFormacionOptions.find(o => o.value === tipo);
    return opt?.label ?? tipo;
  }
}
