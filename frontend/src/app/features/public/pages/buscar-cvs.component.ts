import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PublicService, CvListadoItemDto } from '../../../core/services/public/public.service';

@Component({
  selector: 'app-buscar-cvs',
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
                  [(ngModel)]="busqueda" (keyup.enter)="buscar()">
              </div>
            </div>
            <div class="col-12 col-md-3">
              <input type="text" class="form-select" placeholder="Filtrar por ciudad..."
                     [(ngModel)]="ciudad" (keyup.enter)="buscar()">
            </div>
            <div class="col-12 col-md-3">
              <button class="btn btn-primary w-100" (click)="buscar()">
                <i class="bi bi-search me-2"></i>Buscar
              </button>
            </div>
          </div>
          <div class="mt-3 text-muted small">
            <ng-container *ngIf="!loading">
              {{ total }} CV(s) encontrado(s)
            </ng-container>
            <ng-container *ngIf="loading">
              Buscando...
            </ng-container>
          </div>
        </div>
      </div>
    </section>

    <!-- Grid de CVs -->
    <section class="py-5" style="background:#f4f6f9;">
      <div class="container">

        <!-- Loading -->
        <div *ngIf="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>

        <div *ngIf="!loading" class="row row-cols-1 row-cols-md-3 g-4">

          <div class="col" *ngFor="let cv of cvs">
            <div class="card card-cv h-100">
              <div class="card-body p-4">
                <!-- Avatar + nombre + título -->
                <div class="d-flex align-items-center gap-3 mb-3">
                  <div *ngIf="cv.fotoUrl" class="flex-shrink-0">
                    <img [src]="cv.fotoUrl" class="rounded-circle"
                         style="width:48px;height:48px;object-fit:cover;" alt="">
                  </div>
                  <div *ngIf="!cv.fotoUrl" class="avatar-circle {{ colorClass(cv.curriculumId) }} flex-shrink-0">
                    {{ iniciales(cv.nombreCompleto) }}
                  </div>
                  <div>
                    <div class="cv-name fw-bold" style="color:#212529;">{{ cv.nombreCompleto }}</div>
                    <div class="cv-title text-muted small">{{ cv.nombrePerfil }}</div>
                    <div *ngIf="cv.ciudad || cv.pais" class="text-muted small">
                      <i class="bi bi-geo-alt-fill me-1"></i>{{ cv.ciudad }}<ng-container *ngIf="cv.ciudad && cv.pais">, </ng-container>{{ cv.pais }}
                    </div>
                  </div>
                </div>
                <!-- Tecnologías / Habilidades -->
                <div class="d-flex flex-wrap gap-2">
                  <span class="badge-tech" *ngFor="let tech of cv.habilidades | slice:0:5">{{ tech }}</span>
                </div>
              </div>
              <div class="card-footer bg-transparent border-0 px-4 pb-4 pt-0">
                <a [routerLink]="['/cv', cv.urlPublica]"
                   class="btn btn-outline-primary btn-sm w-100">
                  Ver perfil →
                </a>
              </div>
            </div>
          </div>

          <!-- Sin resultados -->
          <div class="col-12 text-center py-5" *ngIf="cvs.length === 0">
            <i class="bi bi-search display-4 text-muted"></i>
            <p class="text-muted mt-3 mb-3">No se encontraron CVs con ese criterio.</p>
            <button class="btn btn-outline-secondary btn-sm" (click)="limpiarFiltro()">
              Ver todos los CVs
            </button>
          </div>

        </div>

        <!-- Paginación -->
        <div *ngIf="!loading && totalPages > 1" class="d-flex justify-content-center mt-4 gap-2">
          <button class="btn btn-outline-secondary btn-sm" [disabled]="page === 1"
                  (click)="cambiarPagina(page - 1)">
            <i class="bi bi-chevron-left"></i>
          </button>
          <span class="btn btn-sm disabled">{{ page }} / {{ totalPages }}</span>
          <button class="btn btn-outline-secondary btn-sm" [disabled]="page === totalPages"
                  (click)="cambiarPagina(page + 1)">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>

      </div>
    </section>
  `
})
export class BuscarCvsComponent implements OnInit {
  busqueda = '';
  ciudad = '';
  cvs: CvListadoItemDto[] = [];
  total = 0;
  page = 1;
  pageSize = 12;
  totalPages = 1;
  loading = false;

  private readonly colores = ['blue', 'green', 'purple', 'orange', 'teal', 'red'];

  constructor(
    private publicService: PublicService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.busqueda = params['q'] ?? '';
      this.ciudad   = params['ciudad'] ?? '';
      this.page = 1;
      this.cargar();
    });
  }

  cargar(): void {
    this.loading = true;
    this.publicService.buscarCvs({
      q:        this.busqueda  || undefined,
      ciudad:   this.ciudad    || undefined,
      page:     this.page,
      pageSize: this.pageSize
    }).subscribe({
      next: res => {
        this.cvs        = res.items;
        this.total      = res.total;
        this.totalPages = res.totalPages;
        this.loading    = false;
      },
      error: () => { this.loading = false; }
    });
  }

  buscar(): void {
    this.page = 1;
    this.cargar();
  }

  limpiarFiltro(): void {
    this.busqueda = '';
    this.ciudad   = '';
    this.page     = 1;
    this.cargar();
  }

  cambiarPagina(p: number): void {
    this.page = p;
    this.cargar();
  }

  iniciales(nombre: string | null): string {
    if (!nombre) return '?';
    return nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  colorClass(id: number): string {
    return this.colores[id % this.colores.length];
  }
}
