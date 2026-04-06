import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

interface Experiencia {
  empresa: string;
  cargo: string;
  periodo: string;
  descripcion: string;
}

interface Educacion {
  institucion: string;
  titulo: string;
  anio: string;
}

interface CvDetalle {
  id: number;
  nombre: string;
  titulo: string;
  email: string;
  telefono: string;
  resumen: string;
  tecnologias: string[];
  idiomas: string[];
  experiencia: Experiencia[];
  educacion: Educacion[];
  iniciales: string;
}

@Component({
  selector: 'app-cv-detail',
  standalone: false,
  template: `
    <div *ngIf="cv" class="container py-5">

      <div class="row g-4">

        <!-- Columna izquierda: datos básicos -->
        <div class="col-12 col-md-4">
          <div class="card shadow-sm border-0">
            <div class="card-body text-center py-4">
              <div class="avatar-circle bg-primary text-white fw-bold fs-2 rounded-circle
                          d-flex align-items-center justify-content-center mx-auto mb-3"
                   style="width:80px;height:80px;">
                {{ cv.iniciales }}
              </div>
              <h4 class="fw-bold mb-1">{{ cv.nombre }}</h4>
              <p class="text-muted">{{ cv.titulo }}</p>
              <hr>
              <ul class="list-unstyled text-start small">
                <li class="mb-2">
                  <i class="bi bi-envelope me-2 text-primary"></i>{{ cv.email }}
                </li>
                <li class="mb-2">
                  <i class="bi bi-telephone me-2 text-primary"></i>{{ cv.telefono }}
                </li>
              </ul>
            </div>

            <!-- Tecnologías -->
            <div class="card-footer bg-transparent">
              <p class="fw-semibold small mb-2">Tecnologías</p>
              <div class="d-flex flex-wrap gap-1">
                <span class="badge bg-primary bg-opacity-10 text-primary"
                      *ngFor="let tech of cv.tecnologias">{{ tech }}</span>
              </div>
            </div>
            <!-- Idiomas -->
            <div class="card-footer bg-transparent">
              <p class="fw-semibold small mb-2">Idiomas</p>
              <div class="d-flex flex-wrap gap-1">
                <span class="badge bg-secondary bg-opacity-10 text-secondary"
                      *ngFor="let idioma of cv.idiomas">{{ idioma }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Columna derecha: detalle -->
        <div class="col-12 col-md-8">

          <!-- Resumen -->
          <div class="card shadow-sm border-0 mb-4">
            <div class="card-body">
              <h5 class="fw-semibold mb-2">
                <i class="bi bi-person-lines-fill me-2 text-primary"></i>Resumen
              </h5>
              <p class="mb-0 text-muted">{{ cv.resumen }}</p>
            </div>
          </div>

          <!-- Experiencia -->
          <div class="card shadow-sm border-0 mb-4">
            <div class="card-body">
              <h5 class="fw-semibold mb-3">
                <i class="bi bi-briefcase me-2 text-primary"></i>Experiencia laboral
              </h5>
              <div class="border-start border-primary ps-3 mb-3"
                   *ngFor="let exp of cv.experiencia">
                <div class="d-flex justify-content-between">
                  <strong>{{ exp.cargo }}</strong>
                  <small class="text-muted">{{ exp.periodo }}</small>
                </div>
                <p class="text-muted small mb-1">{{ exp.empresa }}</p>
                <p class="small mb-0">{{ exp.descripcion }}</p>
              </div>
            </div>
          </div>

          <!-- Educación -->
          <div class="card shadow-sm border-0">
            <div class="card-body">
              <h5 class="fw-semibold mb-3">
                <i class="bi bi-mortarboard me-2 text-primary"></i>Educación
              </h5>
              <div class="d-flex gap-3 mb-3" *ngFor="let edu of cv.educacion">
                <i class="bi bi-building text-muted mt-1"></i>
                <div>
                  <strong>{{ edu.titulo }}</strong>
                  <p class="text-muted small mb-0">{{ edu.institucion }} · {{ edu.anio }}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Botón volver -->
      <div class="mt-4">
        <a routerLink="/cvs" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left me-1"></i>Volver al listado
        </a>
      </div>
    </div>

    <!-- CV no encontrado -->
    <div *ngIf="!cv" class="container py-5 text-center">
      <i class="bi bi-file-earmark-x display-4 text-muted"></i>
      <p class="text-muted mt-3">CV no encontrado.</p>
      <a routerLink="/cvs" class="btn btn-outline-primary">Ver todos los CVs</a>
    </div>
  `
})
export class CvDetailComponent implements OnInit {
  cv: CvDetalle | null = null;

  // Datos de ejemplo hasta integrar con la API
  private mockCvs: CvDetalle[] = [
    {
      id: 1,
      nombre: 'Ana García', titulo: 'Desarrolladora Full Stack',
      email: 'ana@ejemplo.com', telefono: '+34 600 111 222',
      iniciales: 'AG',
      resumen: 'Desarrolladora con 5 años de experiencia en Angular y Node.js. Apasionada por el código limpio y las buenas prácticas.',
      tecnologias: ['Angular', 'TypeScript', 'Node.js', 'MongoDB'],
      idiomas: ['Español (nativo)', 'Inglés (B2)'],
      experiencia: [
        { empresa: 'TechCorp SL', cargo: 'Full Stack Developer', periodo: '2022 - Actual', descripcion: 'Desarrollo de aplicaciones web con Angular y .NET.' },
        { empresa: 'StartupXYZ', cargo: 'Frontend Developer', periodo: '2020 - 2022', descripcion: 'Maquetación y componentes en Angular.' }
      ],
      educacion: [
        { institucion: 'Universidad Politécnica de Madrid', titulo: 'Ingeniería Informática', anio: '2018' }
      ]
    }
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cv = this.mockCvs.find(c => c.id === id) ?? null;
  }
}
