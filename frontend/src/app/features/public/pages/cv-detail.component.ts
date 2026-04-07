import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

interface Habilidad {
  nombre: string;
  nivel: number;
}

interface Experiencia {
  empresa: string;
  cargo: string;
  periodo: string;
  descripcion: string;
}

interface Educacion {
  institucion: string;
  titulo: string;
  periodo: string;
  descripcion: string;
}

interface CvDetalle {
  id: number;
  nombre: string;
  titulo: string;
  iniciales: string;
  colorClass: string;
  email: string;
  ciudad: string;
  linkedin: string;
  github: string;
  resumen: string;
  habilidades: Habilidad[];
  idiomas: string[];
  experiencia: Experiencia[];
  educacion: Educacion[];
}

@Component({
  selector: 'app-cv-detail',
  standalone: false,
  template: `
    <div class="container py-4" *ngIf="cv; else notFound">

      <!-- Botón volver -->
      <a routerLink="/cvs" class="btn btn-sm btn-outline-secondary mb-3">
        <i class="bi bi-arrow-left me-1"></i>Volver al listado
      </a>

      <!-- Tabs -->
      <ul class="nav gap-1 mb-4" style="border-bottom:2px solid #dee2e6; padding-bottom:0;">
        <li class="nav-item">
          <a class="nav-link fw-semibold"
             style="color:#2c7be5; border-bottom:2px solid #2c7be5; border-radius:0; margin-bottom:-2px;">
            <i class="bi bi-file-earmark-person me-1"></i>Hoja de vida
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link fw-semibold text-muted" style="border-radius:0;">
            <i class="bi bi-bar-chart-fill me-1"></i>Dashboard analítico
          </a>
        </li>
      </ul>

      <div class="row g-4">

        <!-- ── Columna izquierda ─────────────────────────────── -->
        <div class="col-md-4">
          <div class="sidebar-cv text-center">

            <!-- Avatar 120px -->
            <div class="d-flex justify-content-center mb-3">
              <div class="avatar-circle {{ cv.colorClass }}" style="width:120px;height:120px;font-size:2.5rem;
                           border:4px solid #fff; box-shadow:0 2px 12px rgba(44,123,229,.25);">
                {{ cv.iniciales }}
              </div>
            </div>
            <h4 class="fw-bold mb-1">{{ cv.nombre }}</h4>
            <p class="text-muted mb-3">{{ cv.titulo }}</p>

            <!-- Contacto -->
            <div class="text-start mb-4">
              <div class="section-title">Contacto</div>
              <div class="contact-item"><i class="bi bi-envelope-fill me-2 text-primary"></i>{{ cv.email }}</div>
              <div class="contact-item"><i class="bi bi-geo-alt-fill me-2 text-primary"></i>{{ cv.ciudad }}</div>
              <div class="contact-item" *ngIf="cv.linkedin">
                <i class="bi bi-linkedin me-2 text-primary"></i>{{ cv.linkedin }}
              </div>
              <div class="contact-item" *ngIf="cv.github">
                <i class="bi bi-github me-2 text-primary"></i>{{ cv.github }}
              </div>
            </div>

            <!-- Habilidades con barras -->
            <div class="text-start mb-4">
              <div class="section-title">Habilidades</div>
              <div *ngFor="let h of cv.habilidades">
                <div class="d-flex justify-content-between mb-1">
                  <span style="font-size:.85rem; color:#343a40;">{{ h.nombre }}</span>
                  <small class="text-muted">{{ h.nivel }}%</small>
                </div>
                <div class="progress mb-2" style="height:7px; border-radius:4px;">
                  <div class="progress-bar" role="progressbar"
                       [style.width.%]="h.nivel" style="background:#2c7be5;"></div>
                </div>
              </div>
            </div>

            <!-- Idiomas -->
            <div class="text-start mb-4">
              <div class="section-title">Idiomas</div>
              <div class="d-flex flex-wrap gap-2">
                <span class="badge-idioma" *ngFor="let idioma of cv.idiomas">{{ idioma }}</span>
              </div>
            </div>

            <!-- Botón contactar -->
            <button class="btn btn-primary w-100"
                    data-bs-toggle="modal" data-bs-target="#modalContacto">
              <i class="bi bi-envelope-fill me-2"></i>Contactar a {{ cv.nombre.split(' ')[0] }}
            </button>

          </div>
        </div>

        <!-- ── Columna derecha ──────────────────────────────── -->
        <div class="col-md-8">
          <div class="content-cv">

            <!-- Resumen -->
            <div class="mb-4">
              <div class="section-title">Resumen profesional</div>
              <p class="text-secondary" style="line-height:1.75;">{{ cv.resumen }}</p>
            </div>

            <!-- Experiencia -->
            <div class="mb-4">
              <div class="section-title">Experiencia laboral</div>
              <div class="timeline">
                <div class="timeline-item" *ngFor="let exp of cv.experiencia">
                  <div class="timeline-period">{{ exp.periodo }}</div>
                  <div class="timeline-company">{{ exp.empresa }}</div>
                  <div class="timeline-role">{{ exp.cargo }}</div>
                  <div class="timeline-desc">{{ exp.descripcion }}</div>
                </div>
              </div>
            </div>

            <!-- Educación -->
            <div>
              <div class="section-title">Educación</div>
              <div class="timeline">
                <div class="timeline-item" *ngFor="let edu of cv.educacion">
                  <div class="timeline-period">{{ edu.periodo }}</div>
                  <div class="timeline-company">{{ edu.institucion }}</div>
                  <div class="timeline-role">{{ edu.titulo }}</div>
                  <div class="timeline-desc">{{ edu.descripcion }}</div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- CV no encontrado -->
    <ng-template #notFound>
      <div class="container py-5 text-center">
        <i class="bi bi-file-earmark-x display-4 text-muted"></i>
        <p class="text-muted mt-3">CV no encontrado.</p>
        <a routerLink="/cvs" class="btn btn-outline-primary">Ver todos los CVs</a>
      </div>
    </ng-template>

    <!-- Modal: Formulario de contacto -->
    <div class="modal fade" id="modalContacto" tabindex="-1"
         aria-labelledby="modalContactoLabel" aria-hidden="true" *ngIf="cv">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content" style="border-radius:12px; border:none; box-shadow:0 8px 40px rgba(0,0,0,.15);">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold" id="modalContactoLabel">
              <i class="bi bi-envelope-fill me-2 text-primary"></i>
              Contactar a {{ cv.nombre }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body pt-2">
            <p class="text-muted small mb-4">
              Completa el formulario y {{ cv.nombre.split(' ')[0] }} recibirá tu mensaje directamente.
            </p>
            <div *ngIf="contactoEnviado" class="alert alert-success d-flex align-items-center gap-2 mb-3">
              <i class="bi bi-check-circle-fill"></i>
              <div>¡Mensaje enviado correctamente!</div>
            </div>
            <form *ngIf="!contactoEnviado">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label fw-semibold small">Tu nombre</label>
                  <input type="text" class="form-control" [(ngModel)]="contacto.nombre"
                         name="ctcNombre" placeholder="Juan Pérez">
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold small">Tu empresa</label>
                  <input type="text" class="form-control" [(ngModel)]="contacto.empresa"
                         name="ctcEmpresa" placeholder="Empresa SA">
                </div>
                <div class="col-12">
                  <label class="form-label fw-semibold small">Tu correo electrónico</label>
                  <input type="email" class="form-control" [(ngModel)]="contacto.email"
                         name="ctcEmail" placeholder="tu@empresa.com">
                </div>
                <div class="col-12">
                  <label class="form-label fw-semibold small">Motivo de contacto</label>
                  <select class="form-select" [(ngModel)]="contacto.motivo" name="ctcMotivo">
                    <option value="">— Selecciona un motivo —</option>
                    <option value="oferta_laboral">Oferta laboral</option>
                    <option value="freelance">Proyecto freelance</option>
                    <option value="consulta">Consulta</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div class="col-12">
                  <label class="form-label fw-semibold small">Asunto</label>
                  <input type="text" class="form-control" [(ngModel)]="contacto.asunto"
                         name="ctcAsunto" placeholder="Motivo del contacto">
                </div>
                <div class="col-12">
                  <label class="form-label fw-semibold small">Mensaje</label>
                  <textarea class="form-control" rows="4" [(ngModel)]="contacto.mensaje"
                            name="ctcMensaje" placeholder="Escribe tu mensaje aquí..."></textarea>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-outline-secondary"
                    data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary px-4"
                    (click)="enviarContacto()" [disabled]="contactoEnviado">
              <i class="bi bi-send-fill me-2"></i>Enviar mensaje
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CvDetailComponent implements OnInit {
  cv: CvDetalle | null = null;
  contactoEnviado = false;
  contacto = { nombre: '', empresa: '', email: '', motivo: '', asunto: '', mensaje: '' };

  private readonly mockCvs: CvDetalle[] = [
    {
      id: 1,
      nombre: 'Ana García', titulo: 'Frontend Developer',
      iniciales: 'AG', colorClass: 'blue',
      email: 'ana.garcia@email.com', ciudad: 'Madrid, España',
      linkedin: 'linkedin.com/in/anagarcia', github: 'github.com/anagarcia',
      resumen: 'Desarrolladora Frontend con más de 6 años de experiencia construyendo aplicaciones web modernas con Angular, React y Vue.js. Apasionada por el diseño de interfaces accesibles y el rendimiento front-end.',
      habilidades: [
        { nombre: 'Angular',    nivel: 90 },
        { nombre: 'TypeScript', nivel: 85 },
        { nombre: 'Node.js',    nivel: 70 },
        { nombre: 'Docker',     nivel: 60 },
        { nombre: 'CSS / SCSS', nivel: 95 }
      ],
      idiomas: ['Español — Nativo', 'Inglés — B2', 'Francés — A2'],
      experiencia: [
        { empresa: 'Accenture España', cargo: 'Senior Frontend Developer',
          periodo: 'Enero 2022 — Actualidad',
          descripcion: 'Desarrollo de aplicaciones SPA con Angular 16+ para clientes del sector bancario. Implementación de design systems con Storybook.' },
        { empresa: 'Indra Sistemas', cargo: 'Frontend Developer',
          periodo: 'Marzo 2019 — Diciembre 2021',
          descripcion: 'Migración de aplicaciones legacy a Angular. Integración con APIs REST y GraphQL.' },
        { empresa: 'StartupHub Madrid', cargo: 'Frontend Developer Junior',
          periodo: 'Junio 2017 — Febrero 2019',
          descripcion: 'Desarrollo de landing pages y dashboards con React y Bootstrap.' }
      ],
      educacion: [
        { institucion: 'Universidad Complutense de Madrid', titulo: 'Ingeniería Informática',
          periodo: '2013 — 2017',
          descripcion: 'Especialización en Ingeniería del Software.' },
        { institucion: 'Google — Coursera', titulo: 'Certificación UX Design Professional',
          periodo: '2022',
          descripcion: 'Programa de 6 meses en diseño de experiencia de usuario con Figma.' }
      ]
    }
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cv = this.mockCvs.find(c => c.id === id) ?? null;
  }

  enviarContacto(): void {
    this.contactoEnviado = true;
  }
}
