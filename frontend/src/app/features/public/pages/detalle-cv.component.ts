import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PublicService, CvDetalleDto, ContactarDto } from '../../../core/services/public.service';

@Component({
  selector: 'app-detalle-cv',
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
          <a class="nav-link fw-semibold text-muted" style="border-radius:0;"
             [routerLink]="['/cv', cv.urlPublica, 'dashboard']">
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
              <div class="avatar-circle {{ colorClass(cv.curriculumId) }}" style="width:120px;height:120px;font-size:2.5rem;
                           border:4px solid #fff; box-shadow:0 2px 12px rgba(44,123,229,.25);">
                {{ iniciales(cv.personales?.nombreCompleto) }}
              </div>
            </div>
            <h4 class="fw-bold mb-1">{{ cv.personales?.nombreCompleto }}</h4>
            <p class="text-muted mb-3">{{ cv.perfiles?.[0]?.nombrePerfil }}</p>

            <!-- Contacto -->
            <div class="text-start mb-4">
              <div class="section-title">Contacto</div>
              <div class="contact-item" *ngIf="cv.personales?.email"><i class="bi bi-envelope-fill me-2 text-primary"></i>{{ cv.personales?.email }}</div>
            <div class="contact-item" *ngIf="cv.personales?.ciudad || cv.personales?.pais">
              <i class="bi bi-geo-alt-fill me-2 text-primary"></i>{{ cv.personales?.ciudad }}<ng-container *ngIf="cv.personales?.ciudad && cv.personales?.pais">, </ng-container>{{ cv.personales?.pais }}
            </div>
            <div class="contact-item" *ngIf="redesSocialesMap['LinkedIn']">
              <i class="bi bi-linkedin me-2 text-primary"></i>{{ redesSocialesMap['LinkedIn'] }}
            </div>
            <div class="contact-item" *ngIf="redesSocialesMap['GitHub']">
              <i class="bi bi-github me-2 text-primary"></i>{{ redesSocialesMap['GitHub'] }}
              </div>
            </div>

            <!-- Habilidades -->
            <div class="text-start mb-4" *ngIf="cv.habilidades?.length">
              <div class="section-title">Habilidades</div>
              <div *ngFor="let h of cv.habilidades">
                <div class="d-flex justify-content-between mb-1">
                  <span style="font-size:.85rem; color:#343a40;">{{ h.nombre }}</span>
                  <small class="text-muted">{{ h.nivel }}</small>
                </div>
                <div class="progress mb-2" style="height:7px; border-radius:4px;">
                  <div class="progress-bar" role="progressbar"
                       style="background:#2c7be5;width:60%"></div>
                </div>
              </div>
            </div>

            <!-- Idiomas -->
            <div class="text-start mb-4" *ngIf="idiomasPublicos.length">
              <div class="section-title">Idiomas</div>
              <div class="d-flex flex-wrap gap-2">
                <span class="badge-idioma" *ngFor="let idioma of idiomasPublicos">{{ idioma.nombre }}</span>
              </div>
            </div>

            <!-- Botón contactar -->
            <button class="btn btn-primary w-100"
                    data-bs-toggle="modal" data-bs-target="#modalContacto">
              <i class="bi bi-envelope-fill me-2"></i>Contactar a {{ primerNombre(cv.personales?.nombreCompleto) }}
            </button>

          </div>
        </div>

        <!-- ── Columna derecha ──────────────────────────────── -->
        <div class="col-md-8">
          <div class="content-cv">

            <!-- Resumen -->
            <div class="mb-4" *ngIf="cv.perfiles?.length">
              <div class="section-title">Resumen profesional</div>
              <p class="text-secondary" style="line-height:1.75;">{{ cv.perfiles[0].descripcionPerfil }}</p>
            </div>

            <!-- Experiencia -->
            <div class="mb-4" *ngIf="cv.experiencias?.length">
              <div class="section-title">Experiencia laboral</div>
              <div class="timeline">
                <div class="timeline-item" *ngFor="let exp of cv.experiencias">
                  <div class="timeline-period">
                    {{ exp.fechaInicio | date:'MMM yyyy' }} —
                    {{ exp.esActual ? 'Actualidad' : (exp.fechaFin | date:'MMM yyyy') }}
                  </div>
                  <div class="timeline-company">{{ exp.empresa }}</div>
                  <div class="timeline-role">{{ exp.cargo }}</div>
                  <div class="timeline-desc">{{ exp.funciones }}</div>
                </div>
              </div>
            </div>

            <!-- Educación -->
            <div *ngIf="cv.formaciones?.length">
              <div class="section-title">Educación</div>
              <div class="timeline">
                <div class="timeline-item" *ngFor="let edu of cv.formaciones">
                  <div class="timeline-period">{{ edu.fechaFin | date:'yyyy' }}</div>
                  <div class="timeline-company">{{ edu.institucion }}</div>
                  <div class="timeline-role">{{ edu.titulo }}</div>
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
              Contactar a {{ cv.personales?.nombreCompleto }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body pt-2">
            <p class="text-muted small mb-4">
              Completa el formulario y {{ primerNombre(cv.personales?.nombreCompleto) }} recibirá tu mensaje directamente.
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
                  <select class="form-select" [(ngModel)]="contacto.motivoContacto" name="ctcMotivo">
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
export class DetalleCvComponent implements OnInit {
  cv: CvDetalleDto | null = null;
  contactoEnviado = false;
  enviandoContacto = false;
  loading = false;
  contacto: ContactarDto = { nombre: '', empresa: null, email: '', motivoContacto: null, asunto: null, mensaje: '' };

  get redesSocialesMap(): Record<string, string> {
    const map: Record<string, string> = {};
    (this.cv?.redesSociales ?? []).forEach((r: any) => {
      if (r.tipo && r.url) map[r.tipo] = r.url;
    });
    return map;
  }

  get idiomasPublicos() {
    return (this.cv?.habilidades ?? []).filter((h: any) => h.tipo === 'Idioma');
  }

  constructor(
    private route: ActivatedRoute,
    private publicService: PublicService
  ) {}

  ngOnInit(): void {
    const urlPublica = this.route.snapshot.paramMap.get('urlPublica') ?? '';
    if (!urlPublica) return;
    this.loading = true;
    this.publicService.getDetalle(urlPublica).subscribe({
      next: data => { this.cv = data; this.loading = false; },
      error: () => { this.cv = null; this.loading = false; }
    });
  }

  iniciales(nombre: string | null | undefined): string {
    if (!nombre) return '?';
    return nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  colorClass(id: number | null | undefined): string {
    const classes = ['bg-primary', 'bg-success', 'bg-danger', 'bg-warning', 'bg-info', 'bg-secondary'];
    return classes[(id ?? 0) % classes.length];
  }

  primerNombre(nombreCompleto: string | null | undefined): string {
    return nombreCompleto ? nombreCompleto.split(' ')[0] : '';
  }

  enviarContacto(): void {
    if (!this.cv) return;
    this.enviandoContacto = true;
    this.publicService.contactar(this.cv.urlPublica, this.contacto).subscribe({
      next: () => {
        this.contactoEnviado = true;
        this.enviandoContacto = false;
      },
      error: () => { this.enviandoContacto = false; }
    });
  }
}
