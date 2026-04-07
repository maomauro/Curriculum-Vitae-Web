import { Component } from '@angular/core';

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

    <!-- 1. Documento de identidad -->
    <div class="seccion-card">
      <div class="seccion-titulo"><i class="bi bi-card-text"></i>Documento de identidad</div>
      <div class="seccion-subtitulo">Tipo, número y datos del documento oficial de identificación</div>
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label">Tipo de documento</label>
          <select class="form-select">
            <option>Cédula de Ciudadanía</option>
            <option>Cédula de Extranjería</option>
            <option>Pasaporte</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">Número de documento</label>
          <input type="text" class="form-control" placeholder="1.234.567.890">
        </div>
        <div class="col-md-4">
          <label class="form-label">Fecha de expedición</label>
          <input type="date" class="form-control">
        </div>
        <div class="col-md-4">
          <label class="form-label">Lugar de expedición</label>
          <input type="text" class="form-control" placeholder="Bogotá D.C.">
        </div>
        <div class="col-12 text-end">
          <button class="btn btn-primary px-4">
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
          <input type="text" class="form-control" placeholder="Ana">
        </div>
        <div class="col-md-3">
          <label class="form-label">Segundo nombre</label>
          <input type="text" class="form-control" placeholder="María">
        </div>
        <div class="col-md-3">
          <label class="form-label">Primer apellido <span class="text-danger">*</span></label>
          <input type="text" class="form-control" placeholder="García">
        </div>
        <div class="col-md-3">
          <label class="form-label">Segundo apellido</label>
          <input type="text" class="form-control" placeholder="López">
        </div>
        <div class="col-md-4">
          <label class="form-label">Fecha de nacimiento</label>
          <input type="date" class="form-control">
        </div>
        <div class="col-md-4">
          <label class="form-label">Lugar de nacimiento</label>
          <input type="text" class="form-control" placeholder="Bogotá D.C.">
        </div>
        <div class="col-md-4">
          <label class="form-label">Género</label>
          <select class="form-select">
            <option>Femenino</option>
            <option>Masculino</option>
            <option>No binario</option>
            <option>Prefiero no indicar</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">Nacionalidad</label>
          <input type="text" class="form-control" placeholder="Colombiana">
        </div>
        <div class="col-md-4">
          <label class="form-label">Estado civil</label>
          <select class="form-select">
            <option>Soltero/a</option>
            <option>Casado/a</option>
            <option>Unión libre</option>
            <option>Divorciado/a</option>
          </select>
        </div>
        <div class="col-12 text-end">
          <button class="btn btn-primary px-4">
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
          <input type="email" class="form-control" placeholder="tu@email.com">
        </div>
        <div class="col-md-4">
          <label class="form-label">Teléfono celular</label>
          <input type="tel" class="form-control" placeholder="+57 300 000 0000">
        </div>
        <div class="col-md-4">
          <label class="form-label">Teléfono fijo</label>
          <input type="tel" class="form-control" placeholder="601 000 0000">
        </div>
        <div class="col-md-4">
          <label class="form-label">Ciudad de residencia</label>
          <input type="text" class="form-control" placeholder="Bogotá D.C.">
        </div>
        <div class="col-md-4">
          <label class="form-label">Dirección</label>
          <input type="text" class="form-control" placeholder="Calle 123 # 45-67">
        </div>
        <div class="col-12 text-end">
          <button class="btn btn-primary px-4">
            <i class="bi bi-floppy-fill me-2"></i>Guardar
          </button>
        </div>
      </div>
    </div>
  `
})
export class DatosPersonalesComponent { }
