import { Component, DestroyRef, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { PublicService, CvDetalleDto, ContactarDto } from '../../../core/services/public/public.service';
import { cvDetalleDtoToPreviewVm } from '../../../shared/mappers/cv-detalle-to-preview-vm';
import type { CvPreviewVm } from '../../../shared/models/cv-preview-vm';

type DetalleEstadoCarga = 'cargando' | 'listo' | 'no_encontrado' | 'error';

@Component({
  selector: 'app-detalle-cv',
  standalone: false,
  template: `
    <div class="public-cv-ficha">
    <div class="container py-5 text-center" *ngIf="estado === 'cargando'">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando CV…</span>
      </div>
      <p class="text-muted small mt-3 mb-0">Cargando hoja de vida…</p>
    </div>

    <div class="container py-4" *ngIf="estado === 'listo' && cv">

      <!-- Botón volver -->
      <a routerLink="/cvs" class="btn btn-sm btn-outline-secondary mb-3">
        <i class="bi bi-arrow-left me-1"></i>Volver al listado
      </a>

      <!-- Tabs -->
      <ul class="nav gap-1 mb-3 cv-tabs-nav">
        <li class="nav-item">
          <a class="nav-link fw-semibold cv-nav-link-active">
            <i class="bi bi-file-earmark-person me-1"></i>Hoja de vida
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link fw-semibold text-muted cv-nav-link-passive"
             [routerLink]="['/cv', cv.urlPublica, 'dashboard']">
            <i class="bi bi-bar-chart-fill me-1"></i>Dashboard analítico
          </a>
        </li>
      </ul>

      <div class="d-flex flex-wrap justify-content-end gap-2 mb-3">
        <button type="button" class="btn btn-primary" (click)="abrirModalContacto()">
          <i class="bi bi-envelope-fill me-2"></i>Contactar a {{ primerNombre(cv.personales?.nombreCompleto) }}
        </button>
      </div>

      <app-cv-plantilla-preview *ngIf="vistaPlantilla" [vm]="vistaPlantilla"></app-cv-plantilla-preview>
    </div>

    <div class="container py-5 text-center" *ngIf="estado === 'no_encontrado'">
      <i class="bi bi-file-earmark-x display-4 text-muted"></i>
      <p class="text-muted mt-3">CV no encontrado o ya no está publicado.</p>
      <a routerLink="/cvs" class="btn btn-outline-primary">Ver todos los CVs</a>
    </div>

    <div class="container py-5 text-center" *ngIf="estado === 'error'">
      <i class="bi bi-wifi-off display-4 text-muted"></i>
      <p class="text-muted mt-3">No pudimos cargar este CV. Revisa tu conexión o inténtalo de nuevo.</p>
      <button type="button" class="btn btn-outline-primary me-2" (click)="reintentar()">Reintentar</button>
      <a routerLink="/cvs" class="btn btn-outline-secondary">Volver al listado</a>
    </div>

    <!-- Sin bootstrap.bundle.js: modal controlado por Angular -->
    <ng-container *ngIf="cv && modalContactoAbierto">
      <div class="modal-backdrop fade show" (click)="cerrarModalContacto()" aria-hidden="true"></div>
      <div
        id="modalContacto"
        class="modal fade show d-block"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalContactoLabel"
        (click)="cerrarModalContacto()">
        <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
        <div class="modal-content cv-modal-soft">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold" id="modalContactoLabel">
              <i class="bi bi-envelope-fill me-2 text-primary"></i>
              Contactar a {{ cv.personales?.nombreCompleto }}
            </h5>
            <button type="button" class="btn-close" (click)="cerrarModalContacto()" aria-label="Cerrar"></button>
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
            <button type="button" class="btn btn-outline-secondary" (click)="cerrarModalContacto()">
              Cancelar
            </button>
            <button type="button" class="btn btn-primary px-4"
                    (click)="enviarContacto()" [disabled]="contactoEnviado || enviandoContacto">
              <span *ngIf="enviandoContacto" class="spinner-border spinner-border-sm me-2" role="status"></span>
              <i *ngIf="!enviandoContacto" class="bi bi-send-fill me-2"></i>Enviar mensaje
            </button>
          </div>
        </div>
      </div>
      </div>
    </ng-container>
    </div>
  `
})
export class DetalleCvComponent implements OnInit, OnDestroy {
  cv: CvDetalleDto | null = null;
  estado: DetalleEstadoCarga = 'cargando';
  modalContactoAbierto = false;
  contactoEnviado = false;
  enviandoContacto = false;
  contacto: ContactarDto = { nombre: '', empresa: null, email: '', motivoContacto: null, asunto: null, mensaje: '' };

  private readonly route = inject(ActivatedRoute);
  private readonly publicService = inject(PublicService);
  private readonly destroyRef = inject(DestroyRef);

  private urlPublicaActual = '';

  get vistaPlantilla(): CvPreviewVm | null {
    return this.cv ? cvDetalleDtoToPreviewVm(this.cv) : null;
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map(p => (p.get('urlPublica') ?? '').trim()),
        distinctUntilChanged(),
        tap(slug => {
          this.urlPublicaActual = slug;
          this.estado = 'cargando';
          this.cv = null;
        }),
        switchMap(slug => {
          if (!slug) {
            this.estado = 'no_encontrado';
            return of<CvDetalleDto | null>(null);
          }
          return this.publicService.getDetalle(slug).pipe(
            catchError((err: HttpErrorResponse) => {
              if (err.status === 404) {
                this.estado = 'no_encontrado';
              } else {
                this.estado = 'error';
              }
              return of<CvDetalleDto | null>(null);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        if (data) {
          this.cv = data;
          this.estado = 'listo';
          this.modalContactoAbierto = false;
          document.body.style.overflow = '';
          this.contactoEnviado = false;
          this.contacto = {
            nombre: '',
            empresa: null,
            email: '',
            motivoContacto: null,
            asunto: null,
            mensaje: '',
          };
        } else if (this.estado === 'cargando') {
          this.cv = null;
          this.estado = 'no_encontrado';
        }
      });
  }

  reintentar(): void {
    const slug = this.urlPublicaActual;
    if (!slug) return;
    this.estado = 'cargando';
    this.cv = null;
    this.publicService.getDetalle(slug).subscribe({
      next: data => {
        this.cv = data;
        this.estado = 'listo';
        this.modalContactoAbierto = false;
        document.body.style.overflow = '';
      },
      error: (err: HttpErrorResponse) => {
        this.cv = null;
        this.estado = err.status === 404 ? 'no_encontrado' : 'error';
      },
    });
  }

  primerNombre(nombreCompleto: string | null | undefined): string {
    return nombreCompleto ? nombreCompleto.split(' ')[0] : '';
  }

  abrirModalContacto(): void {
    this.modalContactoAbierto = true;
    document.body.style.overflow = 'hidden';
  }

  cerrarModalContacto(): void {
    this.modalContactoAbierto = false;
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscapeCerrarModal(): void {
    if (this.modalContactoAbierto) {
      this.cerrarModalContacto();
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
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
