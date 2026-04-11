import { Component, DestroyRef, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, distinctUntilChanged, map, Observable, of, switchMap, tap } from 'rxjs';
import {
  PublicService,
  CvDetalleDto,
  ContactarDto,
} from '../../../core/services/public/public.service';
import { CvPublicoShellContext } from '../cv-publico-shell.context';
import {
  contactoPublicoVacio,
  marcarControlesTocados,
  primerNombrePublico,
} from '../cv-publico.utils';

type ShellEstado = 'cargando' | 'listo' | 'no_encontrado' | 'error';

@Component({
  selector: 'app-cv-publico-shell',
  standalone: false,
  providers: [CvPublicoShellContext],
  template: `
    <div class="public-cv-ficha">
      <div class="container py-5 text-center" *ngIf="estado === 'cargando'">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando perfil…</span>
        </div>
        <p class="text-muted small mt-3 mb-0">Cargando hoja de vida…</p>
      </div>

      <div class="container py-4" *ngIf="estado === 'listo' && ctx.cv">
        <a routerLink="/cvs" class="btn btn-sm btn-outline-secondary mb-3">
          <i class="bi bi-arrow-left me-1"></i>Volver al listado
        </a>

        <ul class="nav gap-1 mb-3 cv-tabs-nav">
          <li class="nav-item">
            <a
              class="nav-link fw-semibold cv-nav-link-passive text-muted"
              routerLinkActive="cv-nav-link-active"
              [routerLinkActiveOptions]="{ exact: true }"
              [routerLink]="['/cv', urlPublica]">
              <i class="bi bi-file-earmark-person me-1"></i>Hoja de vida
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link fw-semibold cv-nav-link-passive text-muted"
              routerLinkActive="cv-nav-link-active"
              [routerLink]="['/cv', urlPublica, 'dashboard']">
              <i class="bi bi-bar-chart-fill me-1"></i>Dashboard analítico
            </a>
          </li>
        </ul>

        <div class="d-flex flex-wrap justify-content-end gap-2 mb-3">
          <button type="button" class="btn btn-primary" (click)="abrirModalContacto()">
            <i class="bi bi-envelope-fill me-2"></i>Contactar a
            {{ primerNombre(ctx.cv.personales?.nombreCompleto) }}
          </button>
        </div>

        <router-outlet></router-outlet>
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

      <ng-container *ngIf="ctx.cv && modalContactoAbierto">
        <div class="modal-backdrop fade show" (click)="cerrarModalContacto()" aria-hidden="true"></div>
        <div
          id="modalContactoPublico"
          class="modal fade show d-block"
          tabindex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalContactoPublicoLabel"
          (click)="cerrarModalContacto()">
          <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
            <div class="modal-content cv-modal-soft">
              <div class="modal-header border-0 pb-0">
                <h5 class="modal-title fw-bold" id="modalContactoPublicoLabel">
                  <i class="bi bi-envelope-fill me-2 text-primary"></i>
                  Contactar a {{ ctx.cv.personales?.nombreCompleto }}
                </h5>
                <button type="button" class="btn-close" (click)="cerrarModalContacto()" aria-label="Cerrar"></button>
              </div>
              <div class="modal-body pt-2">
                <p class="text-muted small mb-4">
                  Completa el formulario y
                  {{ primerNombre(ctx.cv.personales?.nombreCompleto) }} recibirá tu solicitud de contacto.
                </p>
                <div *ngIf="contactoEnviado" class="alert alert-success d-flex align-items-center gap-2 mb-3">
                  <i class="bi bi-check-circle-fill"></i>
                  <div>¡Contacto enviado correctamente!</div>
                </div>
                <form *ngIf="!contactoEnviado" #contactoForm="ngForm" (ngSubmit)="enviarContacto(contactoForm)">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label fw-semibold small">Tu nombre <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" [(ngModel)]="contacto.nombre" required
                             name="shellCtcNombre" placeholder="Juan Pérez" autocomplete="name"
                             #shellCtcNombreRef="ngModel"
                             [class.is-invalid]="shellCtcNombreRef.invalid && shellCtcNombreRef.touched">
                      <div class="invalid-feedback">Indica tu nombre.</div>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label fw-semibold small">Tu empresa <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" [(ngModel)]="contacto.empresa" required
                             name="shellCtcEmpresa" placeholder="Empresa SA" autocomplete="organization"
                             #shellCtcEmpresaRef="ngModel"
                             [class.is-invalid]="shellCtcEmpresaRef.invalid && shellCtcEmpresaRef.touched">
                      <div class="invalid-feedback">Indica tu empresa.</div>
                    </div>
                    <div class="col-12">
                      <label class="form-label fw-semibold small">Tu correo electrónico <span class="text-danger">*</span></label>
                      <input type="email" class="form-control" [(ngModel)]="contacto.email" required email
                             name="shellCtcEmail" placeholder="tu@empresa.com" autocomplete="email"
                             #shellCtcEmailRef="ngModel"
                             [class.is-invalid]="shellCtcEmailRef.invalid && shellCtcEmailRef.touched">
                      <div class="invalid-feedback" *ngIf="shellCtcEmailRef.invalid && shellCtcEmailRef.touched">
                        <span *ngIf="shellCtcEmailRef.errors?.['required']">Indica tu correo.</span>
                        <span *ngIf="shellCtcEmailRef.errors?.['email'] && !shellCtcEmailRef.errors?.['required']">
                          Correo no válido.
                        </span>
                      </div>
                    </div>
                    <div class="col-12">
                      <label class="form-label fw-semibold small">Motivo de contacto <span class="text-danger">*</span></label>
                      <select class="form-select" [(ngModel)]="contacto.motivoContacto" name="shellCtcMotivo" required
                              #shellCtcMotivoRef="ngModel"
                              [class.is-invalid]="shellCtcMotivoRef.invalid && shellCtcMotivoRef.touched">
                        <option value="">— Selecciona un motivo —</option>
                        <option value="oferta_laboral">Oferta laboral</option>
                        <option value="freelance">Proyecto freelance</option>
                        <option value="consulta">Consulta</option>
                        <option value="otro">Otro</option>
                      </select>
                      <div class="invalid-feedback">Selecciona un motivo.</div>
                    </div>
                  </div>
                  <div class="modal-footer border-0 px-0 pb-0 pt-3">
                    <button type="button" class="btn btn-outline-secondary" (click)="cerrarModalContacto()">
                      Cancelar
                    </button>
                    <button type="submit" class="btn btn-primary px-4" [disabled]="enviandoContacto">
                      <span *ngIf="enviandoContacto" class="spinner-border spinner-border-sm me-2" role="status"></span>
                      <i *ngIf="!enviandoContacto" class="bi bi-send-fill me-2"></i>Enviar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class CvPublicoShellComponent implements OnInit, OnDestroy {
  readonly ctx = inject(CvPublicoShellContext);
  private readonly route = inject(ActivatedRoute);
  private readonly publicService = inject(PublicService);
  private readonly destroyRef = inject(DestroyRef);

  /** Expuesto al template (alias de utilidad pura). */
  readonly primerNombre = primerNombrePublico;

  estado: ShellEstado = 'cargando';
  urlPublica = '';

  modalContactoAbierto = false;
  contactoEnviado = false;
  enviandoContacto = false;
  contacto: ContactarDto = contactoPublicoVacio();

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map(p => (p.get('urlPublica') ?? '').trim()),
        distinctUntilChanged(),
        tap(slug => {
          this.urlPublica = slug;
          this.estado = slug ? 'cargando' : 'no_encontrado';
          this.ctx.cv = null;
          this.cerrarModalContactoSilencioso();
          this.contactoEnviado = false;
          this.contacto = contactoPublicoVacio();
        }),
        switchMap(slug => this.detalleCv$(slug)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(data => {
        if (data) {
          this.ctx.cv = data;
          this.estado = 'listo';
        } else if (this.estado === 'cargando') {
          this.ctx.cv = null;
          this.estado = 'no_encontrado';
        }
      });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
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

  enviarContacto(form: NgForm): void {
    const cv = this.ctx.cv;
    if (!cv) return;
    const c = this.contacto;
    c.nombre = c.nombre.trim();
    c.empresa = c.empresa.trim();
    c.email = c.email.trim();
    c.motivoContacto = c.motivoContacto.trim();
    if (form.invalid || !c.nombre || !c.empresa || !c.email || !c.motivoContacto) {
      marcarControlesTocados(form);
      return;
    }
    const dto: ContactarDto = {
      nombre: c.nombre,
      empresa: c.empresa,
      email: c.email,
      motivoContacto: c.motivoContacto,
    };
    this.enviandoContacto = true;
    this.publicService.contactar(cv.urlPublica, dto).subscribe({
      next: () => {
        this.contactoEnviado = true;
        this.enviandoContacto = false;
      },
      error: () => {
        this.enviandoContacto = false;
      },
    });
  }

  reintentar(): void {
    const slug = this.urlPublica;
    if (!slug) return;
    this.estado = 'cargando';
    this.ctx.cv = null;
    this.detalleCv$(slug).subscribe(data => {
      if (data) {
        this.ctx.cv = data;
        this.estado = 'listo';
      } else {
        this.ctx.cv = null;
      }
    });
  }

  /** GET detalle público; en error HTTP fija `estado` y emite null. */
  private detalleCv$(slug: string): Observable<CvDetalleDto | null> {
    if (!slug) {
      this.estado = 'no_encontrado';
      return of(null);
    }
    return this.publicService.getDetalle(slug).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.estado = 'no_encontrado';
        } else {
          this.estado = 'error';
        }
        return of(null);
      })
    );
  }

  private cerrarModalContactoSilencioso(): void {
    this.modalContactoAbierto = false;
    document.body.style.overflow = '';
  }
}
