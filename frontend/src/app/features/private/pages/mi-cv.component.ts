import { Component } from '@angular/core';

@Component({
  selector: 'app-mi-cv',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-file-earmark-person-fill me-2 text-primary"></i>Mi CV</h4>
        <span class="text-muted small">Previsualiza y gestiona tu hoja de vida publicada</span>
      </div>
      <div class="d-flex gap-2">
        <a routerLink="/editor" class="btn btn-outline-primary btn-sm">
          <i class="bi bi-pencil-fill me-1"></i>Editar CV
        </a>
        <button class="btn btn-primary btn-sm">
          <i class="bi bi-file-earmark-pdf-fill me-1"></i>Descargar PDF
        </button>
      </div>
    </div>

    <!-- CV Card preview -->
    <div class="bg-white rounded-3 shadow-sm overflow-hidden">
      <!-- Cabecera gradiente -->
      <div class="p-4 text-white d-flex align-items-center gap-4 cv-preview-header">
        <div class="avatar-circle blue cv-preview-avatar">AG</div>
        <div>
          <div class="fw-bold cv-preview-name">Ana García</div>
          <div class="cv-preview-sub">Frontend Developer</div>
          <div class="d-flex flex-wrap gap-3 mt-2 cv-preview-meta">
            <span><i class="bi bi-envelope-fill me-1"></i>ana.garcia@email.com</span>
            <span><i class="bi bi-geo-alt-fill me-1"></i>Madrid, España</span>
            <span><i class="bi bi-linkedin me-1"></i>linkedin.com/in/anagarcia</span>
          </div>
        </div>
      </div>

      <!-- Cuerpo 2 columnas -->
      <div class="row g-0">
        <!-- Sidebar izquierdo -->
        <div class="col-md-4 p-4 cv-preview-sidebar">
          <!-- Habilidades -->
          <div class="mb-4">
            <div class="section-title section-title-accent">Habilidades</div>
            <div *ngFor="let h of habilidades" class="mb-2">
              <div class="d-flex justify-content-between cv-skill-line">
                <span>{{ h.nombre }}</span><small class="text-muted">{{ h.nivel }}%</small>
              </div>
              <div class="progress cv-progress-preview">
                <div class="progress-bar cv-progress-bar-fill" [style.width.%]="h.nivel"></div>
              </div>
            </div>
          </div>
          <!-- Idiomas -->
          <div>
            <div class="section-title section-title-accent">Idiomas</div>
            <div class="d-flex flex-wrap gap-2">
              <span class="badge-idioma" *ngFor="let id of idiomas">{{ id }}</span>
            </div>
          </div>
        </div>

        <!-- Contenido principal -->
        <div class="col-md-8 p-4">
          <div class="mb-4">
            <div class="section-title">Resumen profesional</div>
            <p class="cv-summary-text">
              Desarrolladora Frontend con más de 6 años de experiencia construyendo aplicaciones web modernas con Angular y React.
            </p>
          </div>
          <div>
            <div class="section-title">Experiencia</div>
            <div class="timeline">
              <div class="timeline-item">
                <div class="timeline-period">Ene 2022 — Actualidad</div>
                <div class="timeline-company">Accenture España</div>
                <div class="timeline-role">Senior Frontend Developer</div>
              </div>
              <div class="timeline-item">
                <div class="timeline-period">Mar 2019 — Dic 2021</div>
                <div class="timeline-company">Indra Sistemas</div>
                <div class="timeline-role">Frontend Developer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MiCvComponent {
  habilidades = [
    { nombre: 'Angular', nivel: 90 }, { nombre: 'TypeScript', nivel: 85 },
    { nombre: 'CSS/SCSS', nivel: 95 }, { nombre: 'Node.js', nivel: 70 }
  ];
  idiomas = ['Español — Nativo', 'Inglés — B2'];
}
