import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CvEditorService, PersonalesDto, UpsertPersonalesRequest } from '../../../core/services/private/cv-editor.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { FORM_MESSAGES } from '../../../core/constants/form-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { PersonalesFotoRefreshService } from '../../../core/services/private/personales-foto-refresh.service';
import {
  extractApiErrorMessage,
  getTodayDateString,
  isValidEmail,
  normalizeDateOrNull,
} from '../../../core/utils/form-validation.util';

type SeccionDatosPersonales =
  | 'identificacion'
  | 'basicos'
  | 'contacto'
  | 'residencia'
  | 'seguridad'
  | 'familiar'
  | 'redes'
  | 'referencias';

@Component({
  selector: 'app-datos-personales',
  standalone: false,
  templateUrl: './datos-personales.component.html',
})
export class DatosPersonalesComponent implements OnInit {
  /** `null` = ningún panel abierto (todo plegado). */
  activeSection: SeccionDatosPersonales | null = null;
  loading = false;
  guardando = false;
  guardadoOk = false;
  todayDate = getTodayDateString();

  tiposSangre = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  p: UpsertPersonalesRequest = {
    tipoIdentificacion: null, numeroDocumento: null, fechaExpedicion: null,
    lugarExpedicion: null, libretaMilitarNumero: null, libretaMilitarClase: null,
    pasaporteNumero: null, pasaporteVigencia: null, visaNumero: null,
    visaVigencia: null, visaClase: null,
    primerNombre: '', segundoNombre: null, primerApellido: '', segundoApellido: null,
    fechaNacimiento: null, lugarNacimiento: null, genero: null, nacionalidad: null,
    tipoSangre: null, eps: null, pencion: null, cesantias: null,
    email: null, celular: null, telefonoFijo: null,
    pais: null, departamento: null, ciudad: null, barrio: null, codigoPostal: null,
    direccion: null, tipoResidencia: null
  };

  /** Foto actual (o `null`): separada de `p` porque ya no se edita como texto -- se
   * sube/elimina con endpoints propios, ver onFotoSeleccionada/eliminarFoto. */
  fotoUrlActual: string | null = null;
  subiendoFoto = false;
  private static readonly FOTO_TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
  private static readonly FOTO_MAX_BYTES = 1024 * 1024;

  constructor(
    private cvEditorService: CvEditorService,
    private notificationService: NotificationService,
    private personalesFotoRefresh: PersonalesFotoRefreshService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.cvEditorService.getPersonales().subscribe({
      next: (data: PersonalesDto) => {
        const { personalesId: _personalesId, curriculumId: _curriculumId, fotoUrl, ...rest } = data;
        this.p = rest;
        this.fotoUrlActual = fotoUrl;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        // Si backend aún no tiene registro, mantenemos el formulario en blanco.
      }
    });
  }

  isSectionOpen(section: SeccionDatosPersonales): boolean {
    return this.activeSection === section;
  }

  toggleSection(section: SeccionDatosPersonales): void {
    this.activeSection = this.activeSection === section ? null : section;
  }

  guardar(): void {
    const primerNombre = (this.p.primerNombre ?? '').trim();
    const primerApellido = (this.p.primerApellido ?? '').trim();
    if (!primerNombre || !primerApellido) {
      this.notificationService.warning(FORM_MESSAGES.personales.requiredNames);
      return;
    }

    const email = (this.p.email ?? '').trim();
    if (!email) {
      this.notificationService.warning(FORM_MESSAGES.personales.requiredEmail);
      return;
    }
    if (!isValidEmail(email)) {
      this.notificationService.warning(FORM_MESSAGES.personales.invalidEmail);
      return;
    }

    this.p.primerNombre = primerNombre;
    this.p.primerApellido = primerApellido;
    this.p.email = email;

    // Evita 400 por model binding: campos opcionales vacíos deben viajar como null, no como ''.
    const payload = Object.fromEntries(
      Object.entries(this.p).map(([key, value]) => {
        if (
          key !== 'primerNombre' &&
          key !== 'primerApellido' &&
          value === ''
        ) {
          return [key, null];
        }
        return [key, value];
      })
    ) as UpsertPersonalesRequest;

    // Valida y normaliza fechas para evitar 400 por formato invalido.
    payload.fechaExpedicion = normalizeDateOrNull(payload.fechaExpedicion);
    payload.fechaNacimiento = normalizeDateOrNull(payload.fechaNacimiento);
    payload.pasaporteVigencia = normalizeDateOrNull(payload.pasaporteVigencia);
    payload.visaVigencia = normalizeDateOrNull(payload.visaVigencia);

    if (this.p.fechaExpedicion && !payload.fechaExpedicion) {
      this.notificationService.warning(FORM_MESSAGES.personales.invalidDate);
      return;
    }

    this.guardando = true;
    this.guardadoOk = false;
    this.cvEditorService.upsertPersonales(payload).subscribe({
      next: (data: PersonalesDto) => {
        const { personalesId: _personalesId, curriculumId: _curriculumId, fotoUrl, ...rest } = data;
        this.p = rest;
        this.fotoUrlActual = fotoUrl;
        this.guardando = false;
        this.guardadoOk = true;
        this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
        setTimeout(() => (this.guardadoOk = false), 3000);
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        const message = extractApiErrorMessage(error);
        this.notificationService.error(message || NOTIFICATION_MESSAGES.saveError);
        // No registrar el payload en consola (datos personales); el usuario ya ve el error en pantalla.
        console.error('Error guardando datos personales', error);
      }
    });
  }

  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    input.value = ''; // permite volver a elegir el mismo archivo despues (ej. tras un error)
    if (!archivo) return;

    if (!DatosPersonalesComponent.FOTO_TIPOS_PERMITIDOS.includes(archivo.type)) {
      this.notificationService.warning('Formato no soportado. Usa JPG, PNG o WEBP.');
      return;
    }
    if (archivo.size > DatosPersonalesComponent.FOTO_MAX_BYTES) {
      this.notificationService.warning('La foto no puede superar 1 MB.');
      return;
    }

    this.subiendoFoto = true;
    this.cvEditorService.uploadFotoPersonales(archivo).subscribe({
      next: data => {
        this.fotoUrlActual = data.fotoUrl;
        this.subiendoFoto = false;
        this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
        this.personalesFotoRefresh.requestRefresh();
      },
      error: (error: HttpErrorResponse) => {
        this.subiendoFoto = false;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
    });
  }

  eliminarFoto(): void {
    if (this.subiendoFoto) return;
    this.subiendoFoto = true;
    this.cvEditorService.eliminarFotoPersonales().subscribe({
      next: data => {
        this.fotoUrlActual = data.fotoUrl;
        this.subiendoFoto = false;
        this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
        this.personalesFotoRefresh.requestRefresh();
      },
      error: (error: HttpErrorResponse) => {
        this.subiendoFoto = false;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
    });
  }
}
