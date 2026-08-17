import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { PublicService, CvListadoItemDto } from '../../../core/services/public/public.service';
import {
  etiquetaOrigenSnapshot,
  mostrarFechaGeneracionSnapshot,
} from '../../../core/utils/public-snapshot-source-label';

@Component({
  selector: 'app-buscar-cvs',
  standalone: false,
  templateUrl: './buscar-cvs.component.html',
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
  readonly mostrarFechaGeneracionSnapshot = mostrarFechaGeneracionSnapshot;
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
