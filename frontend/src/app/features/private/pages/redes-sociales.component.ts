import { Component, Input, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CvEditorService, RedSocialDto, UpsertRedSocialRequest } from '../../../core/services/private/cv-editor.service';
import { FORM_MESSAGES } from '../../../core/constants/form-messages';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';

interface RedSocialUI extends RedSocialDto {
  editando: boolean;
  form: UpsertRedSocialRequest;
}

const REDES_OPCIONES = [
  { nombre: 'LinkedIn',   icono: 'bi-linkedin',  color: '#0a66c2' },
  { nombre: 'GitHub',     icono: 'bi-github',    color: '#24292e' },
  { nombre: 'X',          icono: 'bi-twitter-x', color: '#000' },
  { nombre: 'Instagram',  icono: 'bi-instagram', color: '#e1306c' },
  { nombre: 'Facebook',   icono: 'bi-facebook',  color: '#1877f2' },
  { nombre: 'YouTube',    icono: 'bi-youtube',   color: '#ff0000' },
  { nombre: 'Portafolio', icono: 'bi-globe',     color: '#2c7be5' },
  { nombre: 'Otra',       icono: 'bi-link-45deg',color: '#6c757d' },
];

@Component({
  selector: 'app-redes-sociales',
  standalone: false,
  templateUrl: './redes-sociales.component.html',
})
export class RedesSocialesComponent implements OnInit {
  @Input() embedded = false;

  redes: RedSocialUI[] = [];
  redesOpciones = REDES_OPCIONES;
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
    this.cvEditorService.getRedesSociales().subscribe({
      next: data => {
        this.redes = data.map(r => ({ ...r, editando: false, form: this.toForm(r) }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      }
    });
  }

  toForm(r: RedSocialDto): UpsertRedSocialRequest {
    return { nombreRed: r.nombreRed, linkPublico: r.linkPublico, usuarioContacto: r.usuarioContacto };
  }

  agregar(): void {
    this.redes.push({
      redSocialId: 0,
      nombreRed: 'LinkedIn',
      linkPublico: null,
      usuarioContacto: null,
      editando: true,
      form: { nombreRed: 'LinkedIn', linkPublico: null, usuarioContacto: null },
    });
  }

  guardar(red: RedSocialUI): void {
    const nombreRed = (red.form.nombreRed ?? '').trim();
    if (!nombreRed) {
      this.notificationService.warning(FORM_MESSAGES.redes.requiredNombreRed);
      return;
    }
    red.form = {
      nombreRed,
      linkPublico: red.form.linkPublico?.trim() || null,
      usuarioContacto: red.form.usuarioContacto?.trim() || null,
    };

    this.guardando = true;
    const obs = red.redSocialId === 0
      ? this.cvEditorService.createRedSocial(red.form)
      : this.cvEditorService.updateRedSocial(red.redSocialId, red.form);

    obs.subscribe({
      next: data => {
        Object.assign(red, data, { editando: false, form: this.toForm(data) });
        this.guardando = false;
        this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      }
    });
  }

  cancelar(red: RedSocialUI): void {
    if (red.redSocialId === 0) {
      this.redes = this.redes.filter(r => r !== red);
    } else {
      red.editando = false;
    }
  }

  eliminar(red: RedSocialUI): void {
    if (red.redSocialId === 0) {
      this.redes = this.redes.filter(r => r !== red);
      return;
    }
    if (!confirm('¿Eliminar esta red social?')) return;
    this.cvEditorService.deleteRedSocial(red.redSocialId).subscribe({
      next: () => {
        this.redes = this.redes.filter(r => r !== red);
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.deleteError)
    });
  }

  iconoClase(nombreRed: string): string {
    return REDES_OPCIONES.find(o => o.nombre === nombreRed)?.icono ?? 'bi-link-45deg';
  }

  iconoColor(nombreRed: string): string {
    return REDES_OPCIONES.find(o => o.nombre === nombreRed)?.color ?? '#6c757d';
  }
}
