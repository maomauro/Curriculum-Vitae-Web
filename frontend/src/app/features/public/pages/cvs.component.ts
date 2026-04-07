import { Component } from '@angular/core';

interface CvCard {
  id: number;
  nombre: string;
  titulo: string;
  tecnologias: string[];
  iniciales: string;
}

@Component({
  selector: 'app-cvs',
  standalone: false,
  template: `
    <!-- Cabecera de búsqueda -->
    <section class="py-4 bg-light border-bottom">
      <div class="container">
        <div class="row align-items-center g-3">
          <div class="col-12 col-md-8">
            <div class="input-group shadow-sm">
              <input type="text" class="form-control" placeholder="Buscar por nombre, cargo o tecnología..."
                [(ngModel)]="busqueda" (keyup.enter)="filtrar()">
              <button class="btn btn-primary px-4" type="button" (click)="filtrar()">
                <i class="bi bi-search me-1"></i>Buscar
              </button>
            </div>
          </div>
          <div class="col-12 col-md-4">
            <select class="form-select shadow-sm" [(ngModel)]="ordenar" (change)="filtrar()">
              <option value="reciente">Más recientes</option>
              <option value="nombre">Nombre A-Z</option>
            </select>
          </div>
        </div>
      </div>
    </section>

    <!-- Grid de tarjetas -->
    <section class="py-5">
      <div class="container">
        <div class="row g-4">
          <div class="col-12 col-sm-6 col-lg-4" *ngFor="let cv of cvsFiltrados">
            <div class="card h-100 shadow-sm border-0 cv-card">
              <div class="card-body">
                <!-- Avatar con iniciales -->
                <div class="d-flex align-items-center gap-3 mb-3">
                  <div class="avatar-circle bg-primary text-white fw-bold fs-5 rounded-circle
                              d-flex align-items-center justify-content-center flex-shrink-0"
                       style="width:52px;height:52px;">
                    {{ cv.iniciales }}
                  </div>
                  <div>
                    <h5 class="mb-0 fw-semibold">{{ cv.nombre }}</h5>
                    <p class="text-muted small mb-0">{{ cv.titulo }}</p>
                  </div>
                </div>
                <!-- Tecnologías -->
                <div class="d-flex flex-wrap gap-1">
                  <span class="badge bg-primary bg-opacity-10 text-primary"
                        *ngFor="let tech of cv.tecnologias">
                    {{ tech }}
                  </span>
                </div>
              </div>
              <div class="card-footer bg-transparent border-0 pt-0">
                <a [routerLink]="['/cv', cv.id]" class="btn btn-outline-primary btn-sm w-100">
                  <i class="bi bi-eye me-1"></i>Ver CV completo
                </a>
              </div>
            </div>
          </div>

          <!-- Sin resultados -->
          <div class="col-12 text-center py-5" *ngIf="cvsFiltrados.length === 0">
            <i class="bi bi-search display-4 text-muted"></i>
            <p class="text-muted mt-3">No se encontraron CVs con ese criterio.</p>
            <button class="btn btn-outline-secondary" (click)="limpiarFiltro()">
              Ver todos los CVs
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .cv-card {
      transition: transform .15s, box-shadow .15s;
    }
    .cv-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 .5rem 1rem rgba(0,0,0,.1) !important;
    }
  `]
})
export class CvsComponent {
  busqueda = '';
  ordenar = 'reciente';

  // Datos de ejemplo hasta integrar con la API
  cvs: CvCard[] = [
    { id: 1, nombre: 'Ana García',    titulo: 'Desarrolladora Full Stack',  tecnologias: ['Angular', 'TypeScript', 'Node.js'], iniciales: 'AG' },
    { id: 2, nombre: 'Luis Martínez', titulo: 'Backend Developer',          tecnologias: ['C#', '.NET', 'SQL Server'],         iniciales: 'LM' },
    { id: 3, nombre: 'María López',   titulo: 'UX/UI Designer',             tecnologias: ['Figma', 'Sketch', 'Bootstrap'],     iniciales: 'ML' },
    { id: 4, nombre: 'Carlos Ruiz',   titulo: 'DevOps Engineer',            tecnologias: ['Docker', 'Kubernetes', 'CI/CD'],    iniciales: 'CR' },
    { id: 5, nombre: 'Sara Pérez',    titulo: 'Data Scientist',             tecnologias: ['Python', 'ML', 'TensorFlow'],       iniciales: 'SP' },
    { id: 6, nombre: 'Diego Torres',  titulo: 'Mobile Developer',           tecnologias: ['Flutter', 'Dart', 'Firebase'],     iniciales: 'DT' },
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
