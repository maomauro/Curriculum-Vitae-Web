import { Component, Input, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CvEditorService, ReferenciaDto, UpsertReferenciaRequest } from '../../../core/services/private/cv-editor.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { FORM_MESSAGES } from '../../../core/constants/form-messages';
import { extractApiErrorMessage, isValidEmail } from '../../../core/utils/form-validation.util';

interface ReferenciaUI extends ReferenciaDto {
  expanded: boolean;
  form: UpsertReferenciaRequest;
}

@Component({
  selector: 'app-referencias',
  standalone: false,
  templateUrl: './referencias.component.html',
})
export class ReferenciasComponent implements OnInit {
  @Input() embedded = false;

  private readonly tipoSoloPersonal = 'Personal';

  referencias: ReferenciaUI[] = [];
  loading = false;
  guardando = false;

  constructor(
    private cvEditorService: CvEditorService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.cvEditorService.getReferencias().subscribe({
      next: data => {
        const soloPersonales = data.filter(
          r => (r.tipoReferencia ?? '').trim() === this.tipoSoloPersonal
        );
        this.referencias = soloPersonales.map(r => ({ ...r, expanded: false, form: this.toForm(r) }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      }
    });
  }

  private toForm(r: ReferenciaDto): UpsertReferenciaRequest {
    return {
      tipoReferencia: r.tipoReferencia,
      experienciaId: r.experienciaId,
      nombre: r.nombre,
      apellido: r.apellido,
      email: r.email,
      telefono: r.telefono,
      parentesco: r.parentesco,
      cargo: r.cargo,
      empresa: r.empresa,
      relacion: r.relacion,
      observaciones: r.observaciones,
      adjuntoSoporte: r.adjuntoSoporte,
    };
  }

  agregar(): void {
    const nueva: ReferenciaUI = {
      referenciaId: 0,
      tipoReferencia: this.tipoSoloPersonal,
      experienciaId: null,
      nombre: '',
      apellido: null,
      email: null,
      telefono: null,
      parentesco: null,
      cargo: null,
      empresa: null,
      relacion: null,
      observaciones: null,
      adjuntoSoporte: null,
      fechaRegistro: '',
      expanded: true,
      form: {
        tipoReferencia: this.tipoSoloPersonal,
        experienciaId: null,
        nombre: '',
        apellido: null,
        email: null,
        telefono: null,
        parentesco: null,
        cargo: null,
        empresa: null,
        relacion: null,
        observaciones: null,
        adjuntoSoporte: null,
      },
    };
    this.referencias.unshift(nueva);
  }

  tituloCabecera(ref: ReferenciaUI): string {
    const usarForm = ref.referenciaId === 0 || ref.expanded;
    const nombre = (usarForm ? ref.form.nombre : ref.nombre) ?? '';
    const apellido = (usarForm ? ref.form.apellido : ref.apellido) ?? '';
    const linea = `${nombre} ${apellido}`.trim();
    return linea || 'Nueva referencia';
  }

  subtituloCabecera(ref: ReferenciaUI): string {
    const usarForm = ref.referenciaId === 0 || ref.expanded;
    const cargo = usarForm ? ref.form.cargo : ref.cargo;
    const empresa = usarForm ? ref.form.empresa : ref.empresa;
    const c = (cargo ?? '').trim();
    const e = (empresa ?? '').trim();
    if (c && e) return `${c} — ${e}`;
    return c || e || '—';
  }

  guardar(ref: ReferenciaUI): void {
    const nombre = (ref.form.nombre ?? '').trim();
    if (!nombre) {
      this.notificationService.warning(FORM_MESSAGES.referencias.requiredNombre);
      return;
    }
    const emailRaw = (ref.form.email ?? '').trim();
    if (emailRaw && !isValidEmail(emailRaw)) {
      this.notificationService.warning(FORM_MESSAGES.referencias.invalidEmail);
      return;
    }

    ref.form = {
      ...ref.form,
      tipoReferencia: this.tipoSoloPersonal,
      experienciaId: null,
      nombre,
      apellido: ref.form.apellido?.trim() || null,
      email: emailRaw || null,
      telefono: ref.form.telefono?.trim() || null,
      parentesco: ref.form.parentesco?.trim() || null,
      cargo: ref.form.cargo?.trim() || null,
      empresa: ref.form.empresa?.trim() || null,
      relacion: ref.form.relacion?.trim() || null,
      observaciones: ref.form.observaciones?.trim() || null,
    };

    this.guardando = true;
    const obs = ref.referenciaId === 0
      ? this.cvEditorService.createReferencia(ref.form)
      : this.cvEditorService.updateReferencia(ref.referenciaId, ref.form);

    obs.subscribe({
      next: data => {
        Object.assign(ref, data, { expanded: false, form: this.toForm(data) });
        this.guardando = false;
        this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      }
    });
  }

  cancelar(ref: ReferenciaUI): void {
    if (ref.referenciaId !== 0) return;
    this.referencias = this.referencias.filter(r => r !== ref);
  }

  eliminar(ref: ReferenciaUI): void {
    if (ref.referenciaId === 0) return;
    if (!confirm('¿Eliminar esta referencia?')) return;
    this.cvEditorService.deleteReferencia(ref.referenciaId).subscribe({
      next: () => {
        this.referencias = this.referencias.filter(r => r !== ref);
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.deleteError)
    });
  }
}
