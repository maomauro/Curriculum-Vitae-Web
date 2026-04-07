import { Component } from '@angular/core';

@Component({
  selector: 'app-habilidades',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-stars me-2 text-primary"></i>Habilidades e Idiomas</h4>
        <span class="text-muted small">Competencias técnicas, blandas y conocimiento de idiomas</span>
      </div>
      <button class="btn btn-primary btn-sm" (click)="agregarHabilidad()">
        <i class="bi bi-plus-circle me-1"></i>Agregar habilidad
      </button>
    </div>

    <!-- Habilidades técnicas -->
    <div class="seccion-card">
      <div class="seccion-titulo">Habilidades técnicas</div>
      <div class="row g-3">
        <div class="col-md-6 col-lg-4" *ngFor="let skill of habilidadesTecnicas">
          <div class="d-flex flex-column gap-1 p-3 rounded-3"
               style="background:#f8faff;border:1px solid #e4effd;">
            <div class="d-flex align-items-center justify-content-between">
              <span class="fw-semibold" style="font-size:.9rem;">{{ skill.nombre }}</span>
              <span class="nivel-pill" [ngClass]="nivelClass(skill.nivel)">
                {{ skill.nivel }}
              </span>
            </div>
            <select class="form-select form-select-sm mt-1" [(ngModel)]="skill.nivel">
              <option *ngFor="let n of niveles">{{ n }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Habilidades blandas -->
    <div class="seccion-card">
      <div class="seccion-titulo">Habilidades blandas</div>
      <div class="d-flex flex-wrap gap-2">
        <span *ngFor="let skill of habilidadesBlandas"
              class="badge rounded-pill px-3 py-2"
              style="background:#ebf3fb;color:#2c7be5;font-size:.8rem;font-weight:500;">
          {{ skill }}
          <i class="bi bi-x ms-1" style="cursor:pointer;"></i>
        </span>
        <button class="btn btn-outline-primary btn-sm rounded-pill px-3">
          <i class="bi bi-plus"></i> Agregar
        </button>
      </div>
    </div>

    <!-- Idiomas -->
    <div class="seccion-card">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div class="seccion-titulo mb-0">Idiomas</div>
        <button class="btn btn-outline-primary btn-sm" (click)="agregarIdioma()">
          <i class="bi bi-plus-circle me-1"></i>Agregar idioma
        </button>
      </div>
      <div class="row g-3">
        <div class="col-md-4" *ngFor="let idioma of idiomas">
          <div class="p-3 rounded-3" style="background:#f8faff;border:1px solid #e4effd;">
            <div class="d-flex align-items-center gap-2 mb-2">
              <span style="font-size:1.4rem;">{{ idioma.bandera }}</span>
              <span class="fw-bold">{{ idioma.nombre }}</span>
            </div>
            <select class="form-select form-select-sm" [(ngModel)]="idioma.nivel">
              <option>Básico (A1-A2)</option>
              <option>Intermedio (B1-B2)</option>
              <option>Avanzado (C1-C2)</option>
              <option>Nativo</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="d-flex justify-content-end mt-2">
      <button class="btn btn-primary">
        <i class="bi bi-floppy-fill me-1"></i>Guardar todo
      </button>
    </div>
  `,
  styles: [`
    .nivel-pill {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: .72rem;
      font-weight: 600;
    }
    .nivel-pill.basico   { background:#fef9c3;color:#92400e; }
    .nivel-pill.intermedio { background:#dbeafe;color:#1e40af; }
    .nivel-pill.avanzado { background:#d1fae5;color:#065f46; }
    .nivel-pill.experto  { background:#ede9fe;color:#5b21b6; }
  `]
})
export class HabilidadesComponent {
  niveles = ['Básico', 'Intermedio', 'Avanzado', 'Experto'];

  habilidadesTecnicas = [
    { nombre: 'Angular', nivel: 'Experto' },
    { nombre: 'TypeScript', nivel: 'Avanzado' },
    { nombre: 'React', nivel: 'Intermedio' },
    { nombre: 'Node.js', nivel: 'Avanzado' },
    { nombre: 'Docker', nivel: 'Intermedio' },
    { nombre: 'SQL / PostgreSQL', nivel: 'Avanzado' },
  ];

  habilidadesBlandas = ['Trabajo en equipo', 'Comunicación', 'Liderazgo', 'Resolución de problemas', 'Adaptabilidad'];

  idiomas = [
    { nombre: 'Español', bandera: '🇪🇸', nivel: 'Nativo' },
    { nombre: 'Inglés', bandera: '🇬🇧', nivel: 'Avanzado (C1-C2)' },
    { nombre: 'Francés', bandera: '🇫🇷', nivel: 'Básico (A1-A2)' },
  ];

  nivelClass(nivel: string): string {
    const map: Record<string, string> = {
      'Básico': 'basico', 'Intermedio': 'intermedio',
      'Avanzado': 'avanzado', 'Experto': 'experto'
    };
    return map[nivel] ?? 'basico';
  }

  agregarHabilidad(): void {
    this.habilidadesTecnicas.push({ nombre: '', nivel: 'Básico' });
  }

  agregarIdioma(): void {
    this.idiomas.push({ nombre: '', bandera: '🌐', nivel: 'Básico (A1-A2)' });
  }
}
