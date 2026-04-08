import { Component } from '@angular/core';

@Component({
  selector: 'app-editor-cv',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-pencil-fill me-2 text-primary"></i>Editor de CV</h4>
        <span class="text-muted small">Previsualiza y personaliza la presentación de tu CV</span>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-primary btn-sm">
          <i class="bi bi-eye me-1"></i>Previsualizar
        </button>
        <button class="btn btn-primary btn-sm">
          <i class="bi bi-download me-1"></i>Descargar PDF
        </button>
      </div>
    </div>

    <!-- Plantillas -->
    <div class="seccion-card">
      <div class="seccion-titulo">Plantilla de presentación</div>
      <div class="row g-3">
        <div class="col-md-3" *ngFor="let t of plantillas">
          <div class="rounded-3 overflow-hidden border-2 p-0 cv-editor-tile"
               [style.border]="t.activa ? '2px solid #2c7be5' : '2px solid #e4effd'"
               [style.box-shadow]="t.activa ? '0 0 0 3px rgba(44,123,229,.15)' : 'none'"
               (click)="seleccionar(t)">
            <div class="d-flex align-items-center justify-content-center cv-editor-tile-preview"
                 [style.background]="t.color">
              <i class="bi bi-file-earmark-person cv-editor-icon-doc"></i>
            </div>
            <div class="p-2 text-center"
                 [style.background]="t.activa ? '#ebf3fb' : '#fafafa'">
              <span class="cv-editor-tile-label"
                    [style.color]="t.activa ? '#2c7be5' : '#495057'">
                {{ t.nombre }}
              </span>
              <span *ngIf="t.activa" class="d-block cv-editor-activa-label">
                <i class="bi bi-check-circle-fill me-1"></i>Activa
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista previa -->
    <div class="seccion-card">
      <div class="seccion-titulo">Vista previa</div>
      <div class="d-flex align-items-center justify-content-center rounded-3 cv-preview-placeholder">
        <div class="text-center text-muted">
          <i class="bi bi-file-earmark-pdf cv-preview-pdf-icon"></i>
          <p class="mt-2 mb-1 cv-preview-hint">Vista previa del CV generado</p>
          <p class="small mb-3">Completa tus datos para ver la previsualización</p>
          <button class="btn btn-outline-primary btn-sm">
            <i class="bi bi-arrow-clockwise me-1"></i>Actualizar vista previa
          </button>
        </div>
      </div>
    </div>
  `
})
export class EditorCvComponent {
  plantillas = [
    { nombre: 'Clásico',    color: '#2c7be5', activa: true  },
    { nombre: 'Moderno',    color: '#198754', activa: false },
    { nombre: 'Minimalista', color: '#495057', activa: false },
    { nombre: 'Creativo',   color: '#7c3aed', activa: false },
  ];

  seleccionar(template: { activa: boolean }): void {
    this.plantillas.forEach(t => (t.activa = false));
    template.activa = true;
  }
}
