import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { PublicService, CvListadoItemDto } from '../../../core/services/public/public.service';
import { etiquetaOrigenSnapshot } from '../../../core/utils/public-snapshot-source-label';

@Component({
  selector: 'app-buscar-cvs',
  standalone: false,
  template: `
    <div class="public-buscar-cvs">
      <section
        class="py-4 cv-section-toolbar"
        aria-label="Filtros de búsqueda de CVs públicos">
        <div class="container">
          <div class="bg-white p-4 rounded-3 shadow-sm">
            <div class="row align-items-end g-3">
              <div class="col-12 col-md-5">
                <label class="form-label small text-muted mb-1" for="buscar-cvs-q">
                  Palabra clave
                </label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-search text-muted" aria-hidden="true"></i>
                  </span>
                  <input
                    id="buscar-cvs-q"
                    type="search"
                    class="form-control border-start-0 ps-0 cv-buscar-input-search"
                    placeholder="Nombre, cargo, habilidad…"
                    autocomplete="off"
                    [(ngModel)]="busqueda"
                    (input)="onFiltroInput('q')"
                    (keyup.enter)="buscar()">
                </div>
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label small text-muted mb-1" for="buscar-cvs-ciudad">
                  Ciudad
                </label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-geo-alt text-muted" aria-hidden="true"></i>
                  </span>
                  <input
                    id="buscar-cvs-ciudad"
                    type="search"
                    class="form-control border-start-0 ps-0 cv-buscar-input-search"
                    placeholder="Ej. Bogotá, Medellín…"
                    autocomplete="off"
                    [(ngModel)]="ciudad"
                    (input)="onFiltroInput('ciudad')"
                    (keyup.enter)="buscar()">
                </div>
              </div>
              <div class="col-12 col-md-3">
                <label class="form-label small text-muted mb-1 d-none d-md-block">&nbsp;</label>
                <button type="button" class="btn btn-primary w-100" (click)="buscar()">
                  <i class="bi bi-search me-2" aria-hidden="true"></i>Buscar
                </button>
              </div>
            </div>
            <div class="mt-3 text-muted small" role="status" aria-live="polite">
              <ng-container *ngIf="!loading">{{ resumenResultados }}</ng-container>
              <ng-container *ngIf="loading">Buscando…</ng-container>
            </div>
            <div *ngIf="usandoSnapshot" class="alert alert-warning py-2 px-3 mt-3 mb-0 small" role="status">
              <strong class="d-block mb-1">Vista temporal (no es la consulta en vivo a la base de datos todavía)</strong>
              <span class="d-block">{{ etiquetaOrigenSnapshot(snapshotSourceVersion) }}</span>
              <span *ngIf="snapshotActualizadoEn" class="d-block mt-1">
                Fecha de última generación del snapshot: {{ snapshotActualizadoEn | date:'medium' }}.
              </span>
            </div>
            <div
              *ngIf="!loading && !usandoSnapshot"
              class="mt-2 small text-success"
              role="status">
              <i class="bi bi-cloud-check me-1" aria-hidden="true"></i>
              Datos en directo desde el servidor (base de datos).
            </div>
          </div>
        </div>
      </section>

      <section class="py-5 cv-section-list" aria-label="Resultados">
        <div class="container">
          <div *ngIf="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando resultados…</span>
            </div>
          </div>

          <div *ngIf="!loading" class="row row-cols-1 row-cols-md-3 g-4">
            <div class="col" *ngFor="let cv of cvs">
              <article class="card card-cv h-100">
                <div class="card-body p-4">
                  <div class="d-flex align-items-center gap-3 mb-3">
                    <div *ngIf="cv.fotoUrl" class="flex-shrink-0">
                      <img
                        [src]="cv.fotoUrl"
                        class="rounded-circle cv-thumb"
                        [alt]="altFoto(cv.nombreCompleto)">
                    </div>
                    <div *ngIf="!cv.fotoUrl" class="avatar-circle {{ colorClass(cv.curriculumId) }} flex-shrink-0" aria-hidden="true">
                      {{ iniciales(cv.nombreCompleto) }}
                    </div>
                    <div>
                      <div class="cv-name fw-bold cv-name-strong">{{ cv.nombreCompleto }}</div>
                      <div class="cv-title text-muted small">{{ cv.nombrePerfil }}</div>
                      <div *ngIf="cv.ciudad || cv.pais" class="text-muted small">
                        <i class="bi bi-geo-alt-fill me-1" aria-hidden="true"></i>{{ cv.ciudad }}<ng-container *ngIf="cv.ciudad && cv.pais">, </ng-container>{{ cv.pais }}
                      </div>
                    </div>
                  </div>
                  <div class="d-flex flex-wrap gap-2">
                    <span class="badge-tech" *ngFor="let tech of cv.habilidades | slice:0:5">{{ tech }}</span>
                  </div>
                </div>
                <div class="card-footer bg-transparent border-0 px-4 pb-4 pt-0">
                  <a
                    [routerLink]="['/cv', cv.urlPublica]"
                    class="btn btn-outline-primary btn-sm w-100">
                    Ver CV
                    <span class="ms-1" aria-hidden="true">→</span>
                  </a>
                </div>
              </article>
            </div>

            <div class="col-12 text-center py-5" *ngIf="cvs.length === 0">
              <i class="bi bi-search display-4 text-muted" aria-hidden="true"></i>
              <p class="text-muted mt-3 mb-3">No hay CVs publicados que coincidan con estos filtros.</p>
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="limpiarFiltro()">
                Quitar filtros y ver todo el directorio
              </button>
            </div>
          </div>

          <nav
            *ngIf="!loading && totalPages > 1"
            class="d-flex justify-content-center align-items-center mt-4 gap-2"
            aria-label="Paginación de resultados">
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm"
              [disabled]="page === 1"
              (click)="cambiarPagina(page - 1)"
              aria-label="Página anterior">
              <i class="bi bi-chevron-left" aria-hidden="true"></i>
            </button>
            <span class="px-2 small text-muted">{{ page }} / {{ totalPages }}</span>
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm"
              [disabled]="page === totalPages"
              (click)="cambiarPagina(page + 1)"
              aria-label="Página siguiente">
              <i class="bi bi-chevron-right" aria-hidden="true"></i>
            </button>
          </nav>
        </div>
      </section>
    </div>
  `,
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
  usandoSnapshot = false;
  snapshotActualizadoEn: string | null = null;
  /** `sourceVersion` del snapshot (p. ej. `seed-local` vs `api-background-v1`). */
  snapshotSourceVersion: string | null = null;
  readonly etiquetaOrigenSnapshot = etiquetaOrigenSnapshot;
  private requestId = 0;

  private readonly colores = ['blue', 'green', 'purple', 'orange', 'teal', 'red'];

  private readonly publicService = inject(PublicService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.busqueda = params['q'] ?? '';
      this.ciudad = params['ciudad'] ?? '';
      const rawPage = parseInt(params['page'] ?? '1', 10);
      this.page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
      this.cargar();
    });
  }

  get resumenResultados(): string {
    if (this.total === 0) return 'Ningún CV encontrado.';
    if (this.total === 1) return '1 CV publicado encontrado.';
    return `${this.total} CVs publicados encontrados.`;
  }

  /**
   * Tras borrar con la X nativa de `type="search"` o vaciar el campo a mano:
   * al quedar vacío, actualiza la URL y resultados (misma lógica que antes con el botón ×).
   */
  onFiltroInput(campo: 'q' | 'ciudad'): void {
    queueMicrotask(() => {
      if (campo === 'q' && !this.busqueda.trim()) {
        this.aplicarNavegacion(1);
      }
      if (campo === 'ciudad' && !this.ciudad.trim()) {
        this.aplicarNavegacion(1);
      }
    });
  }

  private queryParamsFor(page: number): Record<string, string> {
    const out: Record<string, string> = {};
    const q = this.busqueda.trim();
    const c = this.ciudad.trim();
    if (q) out['q'] = q;
    if (c) out['ciudad'] = c;
    if (page > 1) out['page'] = String(page);
    return out;
  }

  private aplicarNavegacion(page: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.queryParamsFor(page),
    });
  }

  cargar(): void {
    const runId = ++this.requestId;
    this.loading = true;
    this.usandoSnapshot = false;
    this.snapshotSourceVersion = null;

    this.publicService
      .buscarCvsSnapshot({
        q: this.busqueda || undefined,
        ciudad: this.ciudad || undefined,
        page: this.page,
        pageSize: this.pageSize,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(snapshot => {
        if (runId !== this.requestId || !snapshot) return;
        this.cvs = snapshot.items;
        this.total = snapshot.total;
        this.totalPages = snapshot.totalPages;
        this.usandoSnapshot = true;
        this.snapshotActualizadoEn = snapshot.generatedAtUtc;
        this.snapshotSourceVersion = snapshot.sourceVersion ?? null;
        this.loading = false;
      });

    this.publicService
      .buscarCvs({
        q: this.busqueda || undefined,
        ciudad: this.ciudad || undefined,
        page: this.page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: res => {
          if (runId !== this.requestId) return;
          this.cvs = res.items;
          this.total = res.total;
          this.totalPages = res.totalPages;
          this.usandoSnapshot = false;
          this.snapshotActualizadoEn = null;
          this.snapshotSourceVersion = null;
          this.loading = false;

          const tp = this.totalPages;
          if (tp > 0 && this.page > tp) {
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: this.queryParamsFor(tp),
              replaceUrl: true,
            });
          }
        },
        error: () => {
          if (runId !== this.requestId) return;
          this.loading = false;
        },
      });
  }

  buscar(): void {
    this.aplicarNavegacion(1);
  }

  limpiarFiltro(): void {
    this.busqueda = '';
    this.ciudad = '';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });
  }

  cambiarPagina(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.aplicarNavegacion(p);
  }

  altFoto(nombre: string | null): string {
    const n = (nombre ?? '').trim();
    return n ? `Foto de perfil de ${n}` : 'Foto de perfil del candidato';
  }

  iniciales(nombre: string | null): string {
    if (!nombre) return '?';
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  colorClass(id: number): string {
    return this.colores[Math.abs(id) % this.colores.length];
  }
}
