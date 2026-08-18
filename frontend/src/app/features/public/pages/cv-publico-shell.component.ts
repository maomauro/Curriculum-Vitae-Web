import { Component, DestroyRef, HostListener, inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { NgForm } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import { catchError, distinctUntilChanged, finalize, map, Observable, of, switchMap, tap, timeout } from 'rxjs';
import { PublicService, CvDetalleDto, ContactarDto } from '../../../core/services/public/public.service';
import { getOrCreatePortalCvVisitorId } from '../../../core/utils/portal-cv-visitor-id.util';
import { CvAnaliticasDetalleService } from '../../../core/services/cv/cv-analiticas-detalle.service';
import { CvDetalleVistaContext } from '../../../shared/contexts/cv-detalle-vista.context';
import {
  contactoPublicoVacio,
  marcarControlesTocados,
  primerNombrePublico,
} from '../cv-publico.utils';
import { cvPublicoMuestraPestanaDashboard } from '../../../core/utils/cv-dashboard-publico.util';

type ShellEstado = 'cargando' | 'listo' | 'no_encontrado' | 'error';

@Component({
  selector: 'app-cv-publico-shell',
  standalone: false,
  providers: [CvDetalleVistaContext],
  templateUrl: './cv-publico-shell.component.html',
})
export class CvPublicoShellComponent implements OnInit, OnDestroy {
  readonly ctx = inject(CvDetalleVistaContext);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly renderer = inject(Renderer2);
  private readonly publicService = inject(PublicService);
  private readonly cvAnaliticasDetalle = inject(CvAnaliticasDetalleService);
  private readonly destroyRef = inject(DestroyRef);

  private static readonly BODY_FICHA_CLASS = 'cv-publico-ficha-activa';

  /** Expuesto al template (alias de utilidad pura). */
  readonly primerNombre = primerNombrePublico;

  get mostrarPestanaDashboard(): boolean {
    return cvPublicoMuestraPestanaDashboard(this.ctx.cv);
  }

  /** Solo en la pestaña Hoja de vida (misma vista previa que Mi CV). */
  get mostrarBotonImprimirCv(): boolean {
    const path = this.router.url.split('?')[0].replace(/\/$/, '') || '/';
    return /^\/cv\/[^/]+$/.test(path);
  }

  estado: ShellEstado = 'cargando';
  urlPublica = '';

  modalContactoAbierto = false;
  contactoEnviado = false;
  enviandoContacto = false;
  contacto: ContactarDto = contactoPublicoVacio();

  ngOnInit(): void {
    this.renderer.addClass(document.body, CvPublicoShellComponent.BODY_FICHA_CLASS);

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
    this.renderer.removeClass(document.body, CvPublicoShellComponent.BODY_FICHA_CLASS);
  }

  imprimirCv(): void {
    const slug = this.ctx.cv?.urlPublica ?? this.urlPublica;
    const vid = getOrCreatePortalCvVisitorId();
    if (!slug || !vid) {
      window.print();
      return;
    }
    this.publicService
      .registrarImpresionPdf(slug, vid)
      .pipe(
        catchError(() => of(null)),
        finalize(() => window.print())
      )
      .subscribe();
  }

  abrirModalContacto(): void {
    this.modalContactoAbierto = true;
    document.body.style.overflow = 'hidden';
  }

  cerrarModalContacto(): void {
    this.modalContactoAbierto = false;
    document.body.style.overflow = '';
  }

  cerrarModalSiBackdrop(ev: MouseEvent | KeyboardEvent): void {
    if (ev.target === ev.currentTarget) {
      this.cerrarModalContacto();
    }
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
    return this.cvAnaliticasDetalle.detallePublicoParaAnaliticas$(slug).pipe(
      timeout(25_000),
      catchError((err: unknown) => {
        if (err instanceof TimeoutError) {
          this.estado = 'error';
          return of(null);
        }
        const httpErr = err as HttpErrorResponse;
        if (httpErr.status === 404) {
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
