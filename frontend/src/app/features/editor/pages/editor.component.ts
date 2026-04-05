import { Component } from '@angular/core';

type Tab = 'personal' | 'experiencia' | 'educacion' | 'habilidades';

@Component({
  selector: 'app-editor',
  standalone: false,
  template: `
    <div class="app-content-header">
      <div class="container-fluid">
        <div class="row">
          <div class="col-sm-6"><h3 class="mb-0">Editor de CV</h3></div>
        </div>
      </div>
    </div>

    <div class="app-content">
      <div class="container-fluid">
        <div class="card shadow-sm">
          <div class="card-header p-0">
            <ul class="nav nav-tabs card-header-tabs ms-0">
              <li class="nav-item" *ngFor="let tab of tabs">
                <button class="nav-link px-4"
                  [class.active]="activeTab === tab.key"
                  (click)="activeTab = tab.key">
                  <i class="bi me-1" [class]="tab.icon"></i>
                  {{ tab.label }}
                </button>
              </li>
            </ul>
          </div>

          <div class="card-body">

            <!-- Datos personales -->
            <div *ngIf="activeTab === 'personal'">
              <h5 class="mb-3">Datos personales</h5>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Nombre completo</label>
                  <input type="text" class="form-control" [(ngModel)]="cv.nombre" placeholder="Tu nombre">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Título profesional</label>
                  <input type="text" class="form-control" [(ngModel)]="cv.titulo" placeholder="Ej: Desarrollador Full Stack">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Correo electrónico</label>
                  <input type="email" class="form-control" [(ngModel)]="cv.email" placeholder="correo@ejemplo.com">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Teléfono</label>
                  <input type="tel" class="form-control" [(ngModel)]="cv.telefono" placeholder="+34 600 000 000">
                </div>
                <div class="col-12">
                  <label class="form-label">Resumen profesional</label>
                  <textarea class="form-control" rows="4" [(ngModel)]="cv.resumen"
                    placeholder="Breve descripción de tu perfil profesional..."></textarea>
                </div>
              </div>
            </div>

            <!-- Experiencia -->
            <div *ngIf="activeTab === 'experiencia'">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">Experiencia laboral</h5>
                <button class="btn btn-sm btn-outline-primary">
                  <i class="bi bi-plus-lg me-1"></i>Añadir
                </button>
              </div>
              <div class="alert alert-info py-2">
                <i class="bi bi-info-circle me-1"></i>
                Añade tu experiencia laboral. Los más recientes primero.
              </div>
            </div>

            <!-- Educación -->
            <div *ngIf="activeTab === 'educacion'">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">Educación</h5>
                <button class="btn btn-sm btn-outline-primary">
                  <i class="bi bi-plus-lg me-1"></i>Añadir
                </button>
              </div>
              <div class="alert alert-info py-2">
                <i class="bi bi-info-circle me-1"></i>
                Añade tu formación académica.
              </div>
            </div>

            <!-- Habilidades -->
            <div *ngIf="activeTab === 'habilidades'">
              <h5 class="mb-3">Habilidades</h5>
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Habilidades técnicas</label>
                  <input type="text" class="form-control" [(ngModel)]="cv.habilidades"
                    placeholder="Ej: Angular, TypeScript, Docker (separadas por coma)">
                </div>
                <div class="col-12">
                  <label class="form-label">Idiomas</label>
                  <input type="text" class="form-control" [(ngModel)]="cv.idiomas"
                    placeholder="Ej: Español (nativo), Inglés (B2)">
                </div>
              </div>
            </div>

          </div>

          <div class="card-footer d-flex justify-content-end gap-2">
            <button class="btn btn-outline-secondary">Cancelar</button>
            <button class="btn btn-primary">
              <i class="bi bi-floppy me-1"></i>Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EditorComponent {
  activeTab: Tab = 'personal';

  tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'personal',     label: 'Datos personales', icon: 'bi-person' },
    { key: 'experiencia',  label: 'Experiencia',       icon: 'bi-briefcase' },
    { key: 'educacion',    label: 'Educación',         icon: 'bi-mortarboard' },
    { key: 'habilidades',  label: 'Habilidades',       icon: 'bi-stars' }
  ];

  cv = {
    nombre: '', titulo: '', email: '', telefono: '',
    resumen: '', habilidades: '', idiomas: ''
  };
}

