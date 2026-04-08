import { Component, OnInit } from '@angular/core';
import { CvEditorService, PersonalesDto, UpsertPersonalesRequest } from '../../../core/services/cv-editor.service';

@Component({
  selector: 'app-datos-personales',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-person-lines-fill me-2 text-primary"></i>Datos Personales</h4>
        <span class="text-muted small">Información de identificación, datos básicos y de contacto</span>
      </div>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <ng-container *ngIf="!loading">

    <!-- 1. Documento de identidad -->
    <div class="seccion-card">
      <div class="seccion-titulo"><i class="bi bi-card-text"></i>Documento de identidad</div>
      <div class="seccion-subtitulo">Tipo, número y datos del documento oficial de identificación</div>
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label">Tipo de documento</label>
          <select class="form-select" [(ngModel)]="p.tipoIdentificacion">
            <option value="CC">Cédula de Ciudadanía</option>
            <option value="CE">Cédula de Extranjería</option>
            <option value="PA">Pasaporte</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">Número de documento</label>
          <input type="text" class="form-control" placeholder="1.234.567.890"
                 [(ngModel)]="p.numeroDocumento">
        </div>
        <div class="col-md-4">
          <label class="form-label">Fecha de expedición</label>
          <input type="date" class="form-control" [(ngModel)]="p.fechaExpedicion">
        </div>
        <div class="col-md-4">
          <label class="form-label">Lugar de expedición</label>
          <input type="text" class="form-control" placeholder="Bogotá D.C."
                 [(ngModel)]="p.lugarExpedicion">
        </div>
        <div class="col-12 text-end">
          <span *ngIf="guardando" class="text-muted small me-3">Guardando…</span>
          <span *ngIf="guardadoOk" class="text-success small me-3">
            <i class="bi bi-check-circle-fill me-1"></i>Guardado
          </span>
          <button class="btn btn-primary px-4" (click)="guardar()" [disabled]="guardando">
            <i class="bi bi-floppy-fill me-2"></i>Guardar
          </button>
        </div>
      </div>
    </div>

    <!-- 2. Datos básicos -->
    <div class="seccion-card">
      <div class="seccion-titulo"><i class="bi bi-person-fill"></i>Datos Básicos</div>
      <div class="seccion-subtitulo">Nombre completo, fecha de nacimiento y datos demográficos</div>
      <div class="row g-3">
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
          <input type="date" class="form-control" [(ngModel)]="p.fechaNacimiento">
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
        <div class="col-12 text-end">
          <span *ngIf="guardando" class="text-muted small me-3">Guardando…</span>
          <span *ngIf="guardadoOk" class="text-success small me-3">
            <i class="bi bi-check-circle-fill me-1"></i>Guardado
          </span>
          <button class="btn btn-primary px-4" (click)="guardar()" [disabled]="guardando">
            <i class="bi bi-floppy-fill me-2"></i>Guardar
          </button>
        </div>
      </div>
    </div>

    <!-- 3. Datos de contacto -->
    <div class="seccion-card">
      <div class="seccion-titulo"><i class="bi bi-telephone-fill"></i>Datos de contacto</div>
      <div class="seccion-subtitulo">Teléfonos, correo y dirección de residencia</div>
      <div class="row g-3">
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
        <div class="col-md-6">
          <label class="form-label">Dirección</label>
          <input type="text" class="form-control" placeholder="Calle 123 # 45-67"
                 [(ngModel)]="p.direccion">
        </div>
        <div class="col-md-3">
          <label class="form-label">Privacidad email</label>
          <select class="form-select" [(ngModel)]="p.privacidadEmail">
            <option value="Publico">Público</option>
            <option value="Privado">Privado</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Privacidad teléfono</label>
          <select class="form-select" [(ngModel)]="p.privacidadTelefono">
            <option value="Publico">Público</option>
            <option value="Privado">Privado</option>
          </select>
        </div>
        <div class="col-12 text-end">
          <span *ngIf="guardando" class="text-muted small me-3">Guardando…</span>
          <span *ngIf="guardadoOk" class="text-success small me-3">
            <i class="bi bi-check-circle-fill me-1"></i>Guardado
          </span>
          <button class="btn btn-primary px-4" (click)="guardar()" [disabled]="guardando">
            <i class="bi bi-floppy-fill me-2"></i>Guardar
          </button>
        </div>
      </div>
    </div>

    </ng-container>
  `
})
export class DatosPersonalesComponent implements OnInit {
  loading = false;
  guardando = false;
  guardadoOk = false;

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
    direccion: null, tipoResidencia: null, fotoUrl: null,
    privacidadEmail: 'Privado', privacidadTelefono: 'Privado'
  };

  constructor(private cvEditorService: CvEditorService) {}

  ngOnInit(): void {
    this.loading = true;
    this.cvEditorService.getPersonales().subscribe({
      next: (data: PersonalesDto) => {
        const { personalesId, curriculumId, ...rest } = data;
        this.p = rest;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  guardar(): void {
    this.guardando = true;
    this.guardadoOk = false;
    this.cvEditorService.upsertPersonales(this.p).subscribe({
      next: (data: PersonalesDto) => {
        const { personalesId, curriculumId, ...rest } = data;
        this.p = rest;
        this.guardando = false;
        this.guardadoOk = true;
        setTimeout(() => (this.guardadoOk = false), 3000);
      },
      error: () => { this.guardando = false; }
    });
  }
}
