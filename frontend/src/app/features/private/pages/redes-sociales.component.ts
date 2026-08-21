import { Component, Input, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
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
  guardandoVisibilidadRedSocialId: number | null = null;
  guardandoVisibilidadBloque = false;

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
    return {
      nombreRed: r.nombreRed,
      linkPublico: r.linkPublico,
      usuarioContacto: r.usuarioContacto,
      mostrarEnCv: r.mostrarEnCv !== false,
    };
  }

  agregar(): void {
    this.redes.push({
      redSocialId: 0,
      nombreRed: 'LinkedIn',
      linkPublico: null,
      usuarioContacto: null,
      mostrarEnCv: true,
      editando: true,
      form: { nombreRed: 'LinkedIn', linkPublico: null, usuarioContacto: null, mostrarEnCv: true },
    });
  }

  onMostrarEnCvChange(red: RedSocialUI, visible: boolean): void {
    if (red.redSocialId === 0) {
      return;
    }
    const prev = !visible;
    if (this.guardandoVisibilidadRedSocialId === red.redSocialId) {
      return;
    }
    this.guardandoVisibilidadRedSocialId = red.redSocialId;
    this.cvEditorService.updateRedSocialVisibilidad(red.redSocialId, { mostrarEnCv: visible }).subscribe({
      next: actualizada => {
        Object.assign(red, actualizada, { editando: red.editando, form: this.toForm(actualizada) });
        this.guardandoVisibilidadRedSocialId = null;
        this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
      },
      error: (error: HttpErrorResponse) => {
        red.form.mostrarEnCv = prev;
        this.guardandoVisibilidadRedSocialId = null;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
    });
  }

  get hayRedesGuardadas(): boolean {
    return this.redes.some(r => r.redSocialId !== 0);
  }

  get hayRedesOcultas(): boolean {
    return this.redes.some(r => r.redSocialId !== 0 && !r.form.mostrarEnCv);
  }

  get hayRedesVisibles(): boolean {
    return this.redes.some(r => r.redSocialId !== 0 && r.form.mostrarEnCv);
  }

  activarTodas(): void {
    this.actualizarVisibilidadEnBloque(true);
  }

  inactivarTodas(): void {
    this.actualizarVisibilidadEnBloque(false);
  }

  private actualizarVisibilidadEnBloque(mostrar: boolean): void {
    if (this.guardandoVisibilidadBloque) {
      return;
    }
    const objetivo = this.redes.filter(r => r.redSocialId !== 0 && r.form.mostrarEnCv !== mostrar);
    if (objetivo.length === 0) {
      return;
    }
    this.guardandoVisibilidadBloque = true;
    forkJoin(
      objetivo.map(r => this.cvEditorService.updateRedSocialVisibilidad(r.redSocialId, { mostrarEnCv: mostrar }))
    ).subscribe({
      next: actualizadas => {
        actualizadas.forEach(actualizada => {
          const red = this.redes.find(r => r.redSocialId === actualizada.redSocialId);
          if (red) {
            Object.assign(red, actualizada, { editando: red.editando, form: this.toForm(actualizada) });
          }
        });
        this.guardandoVisibilidadBloque = false;
        this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
      },
      error: (error: HttpErrorResponse) => {
        this.guardandoVisibilidadBloque = false;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
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
      mostrarEnCv: red.form.mostrarEnCv,
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
