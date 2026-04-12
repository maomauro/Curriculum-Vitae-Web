import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CvEditorService, PersonalesDto, UpsertPersonalesRequest } from '../../../core/services/private/cv-editor.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { FORM_MESSAGES } from '../../../core/constants/form-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
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
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-person-lines-fill me-2 text-primary"></i>Datos Personales</h4>
        <span class="text-muted small">Identificación, contacto, residencia, seguridad social, familiares, redes y referencias</span>
      </div>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <ng-container *ngIf="!loading">

    <!-- Grupo: identificación, básicos, contacto, residencia, seguridad + guardar -->
    <section class="seccion-card datos-personales-nucleo mb-4"
             aria-label="Identificación, datos básicos, contacto, residencia y seguridad social">

    <!-- 1. Información de Identificación -->
    <div class="datos-personales-acordeon-bloque">
      <button type="button" class="btn w-100 text-start p-0 border-0 bg-transparent"
              (click)="toggleSection('identificacion')"
              [attr.aria-expanded]="isSectionOpen('identificacion')">
        <div class="d-flex justify-content-between align-items-center">
          <div class="seccion-titulo mb-0"><i class="bi bi-card-text"></i>Información de Identificación</div>
          <i class="bi" [class.bi-chevron-down]="isSectionOpen('identificacion')"
             [class.bi-chevron-right]="!isSectionOpen('identificacion')" aria-hidden="true"></i>
        </div>
      </button>
      <div class="seccion-subtitulo" *ngIf="isSectionOpen('identificacion')">Documentos de identidad, pasaporte y libreta militar</div>
      <div class="row g-3 mt-1" *ngIf="isSectionOpen('identificacion')">
        <div class="col-md-4">
          <label class="form-label">Tipo de identificación</label>
          <select class="form-select" [(ngModel)]="p.tipoIdentificacion">
            <option value="CC">Cédula de Ciudadanía</option>
            <option value="CE">Cédula de Extranjería</option>
            <option value="PA">Pasaporte</option>
            <option value="TI">Tarjeta de Identidad</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">Número de documento</label>
          <input type="text" class="form-control" placeholder="1.234.567.890"
                 [(ngModel)]="p.numeroDocumento">
        </div>
        <div class="col-md-4">
          <label class="form-label">Fecha de expedición</label>
          <input type="date" class="form-control" [max]="todayDate" [(ngModel)]="p.fechaExpedicion">
        </div>
        <div class="col-md-4">
          <label class="form-label">Lugar de expedición</label>
          <input type="text" class="form-control" placeholder="Bogotá D.C."
                 [(ngModel)]="p.lugarExpedicion">
        </div>
        <div class="col-md-4">
          <label class="form-label">Libreta militar número</label>
          <input type="text" class="form-control" placeholder="Número"
                 [(ngModel)]="p.libretaMilitarNumero">
        </div>
        <div class="col-md-4">
          <label class="form-label">Clase libreta militar</label>
          <select class="form-select" [(ngModel)]="p.libretaMilitarClase">
            <option [ngValue]="null">— No aplica —</option>
            <option value="1ª Clase">1ª Clase</option>
            <option value="2ª Clase">2ª Clase</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">Pasaporte número</label>
          <input type="text" class="form-control" placeholder="Número de pasaporte"
                 [(ngModel)]="p.pasaporteNumero">
        </div>
        <div class="col-md-4">
          <label class="form-label">Pasaporte vigencia</label>
          <input type="date" class="form-control" [(ngModel)]="p.pasaporteVigencia">
        </div>
        <div class="col-md-4">
          <label class="form-label">Visa número</label>
          <input type="text" class="form-control" placeholder="Número de visa"
                 [(ngModel)]="p.visaNumero">
        </div>
        <div class="col-md-4">
          <label class="form-label">Visa vigencia</label>
          <input type="date" class="form-control" [(ngModel)]="p.visaVigencia">
        </div>
        <div class="col-md-4">
          <label class="form-label">Visa clase</label>
          <input type="text" class="form-control" placeholder="Tipo de visa"
                 [(ngModel)]="p.visaClase">
        </div>
      </div>
    </div>

    <!-- 2. Datos Básicos -->
    <div class="datos-personales-acordeon-bloque">
      <button type="button" class="btn w-100 text-start p-0 border-0 bg-transparent"
              (click)="toggleSection('basicos')"
              [attr.aria-expanded]="isSectionOpen('basicos')">
        <div class="d-flex justify-content-between align-items-center">
          <div class="seccion-titulo mb-0"><i class="bi bi-person-fill"></i>Datos Básicos</div>
          <i class="bi" [class.bi-chevron-down]="isSectionOpen('basicos')"
             [class.bi-chevron-right]="!isSectionOpen('basicos')" aria-hidden="true"></i>
        </div>
      </button>
      <div class="seccion-subtitulo" *ngIf="isSectionOpen('basicos')">Nombre completo, fecha de nacimiento, datos demográficos y foto de perfil</div>
      <div class="row g-3 mt-1" *ngIf="isSectionOpen('basicos')">
        <div class="col-md-3">
          <label class="form-label">Primer nombre <span class="text-danger">*</span></label>
          <input type="text" class="form-control" placeholder="Ana"
                 [(ngModel)]="p.primerNombre">
        </div>
        <div class="col-md-3">
          <label class="form-label">Segundo nombre</label>
          <input type="text" class="form-control" placeholder="María"
                 [(ngModel)]="p.segundoNombre">
        </div>
        <div class="col-md-3">
          <label class="form-label">Primer apellido <span class="text-danger">*</span></label>
          <input type="text" class="form-control" placeholder="García"
                 [(ngModel)]="p.primerApellido">
        </div>
        <div class="col-md-3">
          <label class="form-label">Segundo apellido</label>
          <input type="text" class="form-control" placeholder="López"
                 [(ngModel)]="p.segundoApellido">
        </div>
        <div class="col-md-4">
          <label class="form-label">Fecha de nacimiento</label>
          <input type="date" class="form-control" [max]="todayDate" [(ngModel)]="p.fechaNacimiento">
        </div>
        <div class="col-md-4">
          <label class="form-label">Lugar de nacimiento</label>
          <input type="text" class="form-control" placeholder="Bogotá D.C."
                 [(ngModel)]="p.lugarNacimiento">
        </div>
        <div class="col-md-4">
          <label class="form-label">Género</label>
          <select class="form-select" [(ngModel)]="p.genero">
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
            <option value="NB">No binario</option>
            <option value="ND">Prefiero no indicar</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">Nacionalidad</label>
          <input type="text" class="form-control" placeholder="Colombiana"
                 [(ngModel)]="p.nacionalidad">
        </div>
        <div class="col-md-4">
          <label class="form-label">Tipo de sangre</label>
          <select class="form-select" [(ngModel)]="p.tipoSangre">
            <option value="">— Seleccionar —</option>
            <option *ngFor="let ts of tiposSangre">{{ ts }}</option>
          </select>
        </div>
        <div class="col-12">
          <label class="form-label">URL de foto de perfil</label>
          <input type="url" class="form-control" placeholder="https://..."
                 [(ngModel)]="p.fotoUrl">
        </div>
      </div>
    </div>

    <!-- 3. Información de Contacto -->
    <div class="datos-personales-acordeon-bloque">
      <button type="button" class="btn w-100 text-start p-0 border-0 bg-transparent"
              (click)="toggleSection('contacto')"
              [attr.aria-expanded]="isSectionOpen('contacto')">
        <div class="d-flex justify-content-between align-items-center">
          <div class="seccion-titulo mb-0"><i class="bi bi-telephone-fill"></i>Información de Contacto</div>
          <i class="bi" [class.bi-chevron-down]="isSectionOpen('contacto')"
             [class.bi-chevron-right]="!isSectionOpen('contacto')" aria-hidden="true"></i>
        </div>
      </button>
      <div class="seccion-subtitulo" *ngIf="isSectionOpen('contacto')">Correo electrónico y teléfonos de contacto</div>
      <div class="row g-3 mt-1" *ngIf="isSectionOpen('contacto')">
        <div class="col-md-4">
          <label class="form-label">Correo electrónico <span class="text-danger">*</span></label>
          <input type="email" class="form-control" placeholder="tu@email.com"
                 [(ngModel)]="p.email">
        </div>
        <div class="col-md-4">
          <label class="form-label">Teléfono celular</label>
          <input type="tel" class="form-control" placeholder="+57 300 000 0000"
                 [(ngModel)]="p.celular">
        </div>
        <div class="col-md-4">
          <label class="form-label">Teléfono fijo</label>
          <input type="tel" class="form-control" placeholder="601 000 0000"
                 [(ngModel)]="p.telefonoFijo">
        </div>
      </div>
    </div>

    <!-- 4. Información de Residencia -->
    <div class="datos-personales-acordeon-bloque">
      <button type="button" class="btn w-100 text-start p-0 border-0 bg-transparent"
              (click)="toggleSection('residencia')">
        <div class="d-flex justify-content-between align-items-center">
          <div class="seccion-titulo mb-0"><i class="bi bi-house-fill"></i>Información de Residencia</div>
          <i class="bi" [class.bi-chevron-down]="isSectionOpen('residencia')"
             [class.bi-chevron-right]="!isSectionOpen('residencia')"></i>
        </div>
      </button>
      <div class="seccion-subtitulo" *ngIf="isSectionOpen('residencia')">Dirección actual y datos de ubicación</div>
      <div class="row g-3 mt-1" *ngIf="isSectionOpen('residencia')">
        <div class="col-md-3">
          <label class="form-label">País</label>
          <input type="text" class="form-control" placeholder="Colombia"
                 [(ngModel)]="p.pais">
        </div>
        <div class="col-md-3">
          <label class="form-label">Departamento</label>
          <input type="text" class="form-control" placeholder="Cundinamarca"
                 [(ngModel)]="p.departamento">
        </div>
        <div class="col-md-3">
          <label class="form-label">Ciudad de residencia</label>
          <input type="text" class="form-control" placeholder="Bogotá D.C."
                 [(ngModel)]="p.ciudad">
        </div>
        <div class="col-md-3">
          <label class="form-label">Código postal</label>
          <input type="text" class="form-control" placeholder="110111"
                 [(ngModel)]="p.codigoPostal">
        </div>
        <div class="col-md-3">
          <label class="form-label">Barrio</label>
          <input type="text" class="form-control" placeholder="Nombre del barrio"
                 [(ngModel)]="p.barrio">
        </div>
        <div class="col-md-6">
          <label class="form-label">Dirección</label>
          <input type="text" class="form-control" placeholder="Calle 123 # 45-67"
                 [(ngModel)]="p.direccion">
        </div>
        <div class="col-md-3">
          <label class="form-label">Tipo de residencia</label>
          <input type="text" class="form-control" placeholder="Casa, apartamento..."
                 [(ngModel)]="p.tipoResidencia">
        </div>
      </div>
    </div>

    <!-- 5. Seguridad Social -->
    <div class="datos-personales-acordeon-bloque">
      <button type="button" class="btn w-100 text-start p-0 border-0 bg-transparent"
              (click)="toggleSection('seguridad')"
              [attr.aria-expanded]="isSectionOpen('seguridad')">
        <div class="d-flex justify-content-between align-items-center">
          <div class="seccion-titulo mb-0"><i class="bi bi-shield-fill-check"></i>Seguridad Social</div>
          <i class="bi" [class.bi-chevron-down]="isSectionOpen('seguridad')"
             [class.bi-chevron-right]="!isSectionOpen('seguridad')" aria-hidden="true"></i>
        </div>
      </button>
      <div class="seccion-subtitulo" *ngIf="isSectionOpen('seguridad')">EPS, fondo de pensiones y cesantías</div>
      <div class="row g-3 mt-1" *ngIf="isSectionOpen('seguridad')">
        <div class="col-md-4">
          <label class="form-label">EPS</label>
          <input type="text" class="form-control" placeholder="Nombre de EPS"
                 [(ngModel)]="p.eps">
        </div>
        <div class="col-md-4">
          <label class="form-label">Fondo de pensiones</label>
          <input type="text" class="form-control" placeholder="Fondo de pensión"
                 [(ngModel)]="p.pencion">
        </div>
        <div class="col-md-4">
          <label class="form-label">Fondo de cesantías</label>
          <input type="text" class="form-control" placeholder="Fondo de cesantías"
                 [(ngModel)]="p.cesantias">
        </div>
      </div>
    </div>

    <div class="datos-personales-guardar-footer">
      <div class="d-flex flex-column flex-md-row flex-md-wrap align-items-md-center justify-content-md-between gap-3">
        <div class="seccion-subtitulo border-0 pt-0 mb-0 text-muted small">
          Resumen de identificación, datos básicos, contacto, residencia y seguridad social
        </div>
        <div class="text-md-end flex-shrink-0">
          <span *ngIf="guardando" class="text-muted small me-3">Guardando…</span>
          <span *ngIf="guardadoOk" class="text-success small me-3">
            <i class="bi bi-check-circle-fill me-1"></i>Guardado
          </span>
          <button type="button" class="btn btn-primary px-4" (click)="guardar()" [disabled]="guardando">
            <i class="bi bi-floppy-fill me-2"></i>Guardar datos personales
          </button>
        </div>
      </div>
    </div>

    </section>

    <!-- Bloque semántico: familiares, redes y referencias (entidades aparte de Personales) -->
    <section id="bloque-familiares-redes-referencias" class="datos-personales-relaciones" aria-labelledby="titulo-relaciones-fyr">
      <h2 id="titulo-relaciones-fyr" class="h6 fw-bold text-secondary mb-3 mt-2 d-flex flex-wrap align-items-center gap-2">
        <i class="bi bi-diagram-3 text-primary" aria-hidden="true"></i>
        <span>Información familiar, redes sociales y referencias personales</span>
      </h2>

      <!-- 6. Información familiar -->
      <section class="seccion-card" aria-label="Información familiar">
      <button type="button" class="btn w-100 text-start p-0 border-0 bg-transparent"
              (click)="toggleSection('familiar')" [attr.aria-expanded]="isSectionOpen('familiar')">
        <div class="d-flex justify-content-between align-items-center">
          <div class="seccion-titulo mb-0"><i class="bi bi-house-heart-fill"></i>Información familiar</div>
          <i class="bi" [class.bi-chevron-down]="isSectionOpen('familiar')"
             [class.bi-chevron-right]="!isSectionOpen('familiar')" aria-hidden="true"></i>
        </div>
      </button>
      <div class="seccion-subtitulo" *ngIf="isSectionOpen('familiar')">
        Contactos de emergencia y familiares. No se muestran en el CV público. Usa <strong>Guardar</strong> en cada tarjeta al editar.
      </div>
      <div [hidden]="!isSectionOpen('familiar')">
        <app-familiares [embedded]="true"></app-familiares>
      </div>
      </section>

      <!-- 7. Redes sociales -->
      <section class="seccion-card" aria-label="Redes sociales">
      <button type="button" class="btn w-100 text-start p-0 border-0 bg-transparent"
              (click)="toggleSection('redes')" [attr.aria-expanded]="isSectionOpen('redes')">
        <div class="d-flex justify-content-between align-items-center">
          <div class="seccion-titulo mb-0"><i class="bi bi-share-fill"></i>Redes sociales</div>
          <i class="bi" [class.bi-chevron-down]="isSectionOpen('redes')"
             [class.bi-chevron-right]="!isSectionOpen('redes')" aria-hidden="true"></i>
        </div>
      </button>
      <div class="seccion-subtitulo" *ngIf="isSectionOpen('redes')">
        Perfiles visibles en tu CV público. Guarda cada red desde su tarjeta.
      </div>
      <div [hidden]="!isSectionOpen('redes')">
        <app-redes-sociales [embedded]="true"></app-redes-sociales>
      </div>
      </section>

      <!-- 8. Referencias personales -->
      <section class="seccion-card" aria-label="Referencias personales">
      <button type="button" class="btn w-100 text-start p-0 border-0 bg-transparent"
              (click)="toggleSection('referencias')" [attr.aria-expanded]="isSectionOpen('referencias')">
        <div class="d-flex justify-content-between align-items-center">
          <div class="seccion-titulo mb-0"><i class="bi bi-person-check-fill"></i>Referencias personales</div>
          <i class="bi" [class.bi-chevron-down]="isSectionOpen('referencias')"
             [class.bi-chevron-right]="!isSectionOpen('referencias')" aria-hidden="true"></i>
        </div>
      </button>
      <div class="seccion-subtitulo" *ngIf="isSectionOpen('referencias')">
        Personas que pueden dar fe de tu trayectoria. Guarda cada referencia al editarla.
      </div>
      <div [hidden]="!isSectionOpen('referencias')">
        <app-referencias [embedded]="true"></app-referencias>
      </div>
      </section>
    </section>

    </ng-container>
  `
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
    direccion: null, tipoResidencia: null, fotoUrl: null
  };

  constructor(
    private cvEditorService: CvEditorService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.cvEditorService.getPersonales().subscribe({
      next: (data: PersonalesDto) => {
        const { personalesId, curriculumId, ...rest } = data;
        this.p = rest;
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
        const { personalesId, curriculumId, ...rest } = data;
        this.p = rest;
        this.guardando = false;
        this.guardadoOk = true;
        this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
        setTimeout(() => (this.guardadoOk = false), 3000);
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        const message = extractApiErrorMessage(error);
        this.notificationService.error(message || NOTIFICATION_MESSAGES.saveError);
        console.error('Error guardando datos personales', { payload, error });
      }
    });
  }
}
