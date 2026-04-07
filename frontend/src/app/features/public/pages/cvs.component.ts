import { Component } from '@angular/core';

interface CvCard {
  id: number;
  nombre: string;
  titulo: string;
  tecnologias: string[];
  iniciales: string;
  colorClass: string;
}

@Component({
  selector: 'app-cvs',
  standalone: false,
  template: `
    <!-- Barra de búsqueda y filtros -->
    <section class="py-4" style="background:#f4f6f9; border-bottom:1px solid #e9ecef;">
      <div class="container">
        <div class="bg-white p-4 rounded-3 shadow-sm">
          <div class="row align-items-center g-3">
            <div class="col-12 col-md-6">
              <div class="input-group">
                <span class="input-group-text bg-white border-end-0">
                  <i class="bi bi-search text-muted"></i>
                </span>
                <input type="text" class="form-control border-start-0 ps-0"
                  placeholder="Buscar por nombre, cargo o tecnología..."
                  [(ngModel)]="busqueda" (keyup.enter)="filtrar()">
              </div>
            </div>
            <div class="col-12 col-md-3">
              <select class="form-select" [(ngModel)]="ordenar" (change)="filtrar()">
                <option value="reciente">Más recientes</option>
                <option value="nombre">Nombre A-Z</option>
              </select>
            </div>
            <div class="col-12 col-md-3">
              <button class="btn btn-primary w-100" (click)="filtrar()">
                <i class="bi bi-search me-2"></i>Buscar
              </button>
            </div>
          </div>
          <div class="mt-3 text-muted small">
            {{ cvsFiltrados.length }} resultado(s) encontrado(s)
          </div>
        </div>
      </div>
    </section>

    <!-- Grid de CVs -->
    <section class="py-5" style="background:#f4f6f9;">
      <div class="container">
        <div class="row row-cols-1 row-cols-md-3 g-4">

          <div class="col" *ngFor="let cv of cvsFiltrados">
            <div class="card card-cv h-100">
              <div class="card-body p-4">
                <!-- Avatar + nombre + título -->
                <div class="d-flex align-items-center gap-3 mb-3">
                  <div class="avatar-circle {{ cv.colorClass }}">
                    {{ cv.iniciales }}
                  </div>
                  <div>
                    <div class="cv-name fw-bold" style="color:#212529;">{{ cv.nombre }}</div>
                    <div class="cv-title text-muted small">{{ cv.titulo }}</div>
                  </div>
                </div>
                <!-- Tecnologías -->
                <div class="d-flex flex-wrap gap-2">
                  <span class="badge-tech" *ngFor="let tech of cv.tecnologias">{{ tech }}</span>
                </div>
              </div>
              <div class="card-footer bg-transparent border-0 px-4 pb-4 pt-0">
                <a [routerLink]="['/cv', cv.id]"
                   class="btn btn-outline-primary btn-sm w-100">
                  Ver perfil →
                </a>
              </div>
            </div>
          </div>

          <!-- Sin resultados -->
          <div class="col-12 text-center py-5" *ngIf="cvsFiltrados.length === 0">
            <i class="bi bi-search display-4 text-muted"></i>
            <p class="text-muted mt-3 mb-3">No se encontraron CVs con ese criterio.</p>
            <button class="btn btn-outline-secondary btn-sm" (click)="limpiarFiltro()">
              Ver todos los CVs
            </button>
          </div>

        </div>
      </div>
    </section>
  `
})
export class CvsComponent {
  busqueda = '';
  ordenar = 'reciente';

  private readonly colorClasses = ['blue', 'green', 'purple', 'orange', 'teal', 'red'];

  cvs: CvCard[] = [
    { id: 1, nombre: 'Ana García',    titulo: 'Frontend Developer',          tecnologias: ['React', 'Angular', 'TypeScript'], iniciales: 'AG', colorClass: 'blue' },
    { id: 2, nombre: 'Carlos Ruiz',   titulo: 'Backend Developer',           tecnologias: ['Node.js', '.NET', 'Docker'],      iniciales: 'CR', colorClass: 'green' },
    { id: 3, nombre: 'María López',   titulo: 'UX/UI Designer',              tecnologias: ['Figma', 'Sketch', 'Bootstrap'],   iniciales: 'ML', colorClass: 'purple' },
    { id: 4, nombre: 'Luis Martínez', titulo: 'DevOps Engineer',             tecnologias: ['Docker', 'Kubernetes', 'CI/CD'],  iniciales: 'LM', colorClass: 'orange' },
    { id: 5, nombre: 'Sara Pérez',    titulo: 'Data Scientist',              tecnologias: ['Python', 'ML', 'TensorFlow'],     iniciales: 'SP', colorClass: 'teal' },
    { id: 6, nombre: 'Diego Torres',  titulo: 'Mobile Developer',            tecnologias: ['Flutter', 'Dart', 'Firebase'],    iniciales: 'DT', colorClass: 'red' },
  ];

  cvsFiltrados: CvCard[] = [...this.cvs];

  filtrar(): void {
    const termino = this.busqueda.toLowerCase().trim();
    this.cvsFiltrados = this.cvs.filter(cv =>
      !termino ||
      cv.nombre.toLowerCase().includes(termino) ||
      cv.titulo.toLowerCase().includes(termino) ||
      cv.tecnologias.some(t => t.toLowerCase().includes(termino))
    );
    if (this.ordenar === 'nombre') {
      this.cvsFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
  }

  limpiarFiltro(): void {
    this.busqueda = '';
    this.cvsFiltrados = [...this.cvs];
  }
}
