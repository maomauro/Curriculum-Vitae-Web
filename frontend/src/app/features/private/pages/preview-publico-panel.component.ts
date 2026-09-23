import { Component, inject, OnInit } from '@angular/core';
import { CvEditorService } from '../../../core/services/private/cv-editor.service';
import { CvDetalleVistaContext } from '../../../shared/contexts/cv-detalle-vista.context';
import { VisibilidadSeccionResolver } from '../../../core/utils/visibilidad-seccion-resolver';
import { cvDetalleDtoToPreviewVm } from '../../../shared/mappers/cv-detalle-to-preview-vm';
import type { CvPreviewVisibilidad, CvPreviewVm } from '../../../shared/models/cv-preview-vm';
import {
  hayContenidoHojaDeVida,
  type HojaDeVidaContenidoDto,
  type PerfilPublicoDto,
  type PersonalesPublicoDto,
  type RedSocialPublicoDto,
} from '../../../core/services/public/public.service';
import type { CvPlantillaCodigo } from '../../../core/constants/cv-plantillas';

type PestanaPreview = 'profesional' | 'dashboard' | 'hoja-de-vida';

/** Panel de vista previa en vivo de Configuración: exactamente lo que vería un
 * visitante en las pestañas "Información profesional" y "Dashboard analítico" del CV
 * público, con la visibilidad actual -- sin necesidad de que el CV esté publicado. Se
 * recarga después de cada cambio guardado en Configuración (ver recargar()). */
@Component({
  selector: 'app-preview-publico-panel',
  standalone: false,
  providers: [CvDetalleVistaContext],
  templateUrl: './preview-publico-panel.component.html',
})
export class PreviewPublicoPanelComponent implements OnInit {
  private readonly cvEditorService = inject(CvEditorService);
  readonly ctx = inject(CvDetalleVistaContext);

  pestanaActiva: PestanaPreview = 'profesional';
  cargando = true;
  error = false;

  get vistaPlantilla(): CvPreviewVm | null {
    return this.ctx.cv ? cvDetalleDtoToPreviewVm(this.ctx.cv) : null;
  }

  get visibilidad(): CvPreviewVisibilidad {
    return new VisibilidadSeccionResolver(this.ctx.cv?.visibilidadSeccion);
  }

  get hojaDeVidaContenido(): HojaDeVidaContenidoDto | null {
    return this.ctx.cv?.hojaDeVidaContenido ?? null;
  }

  get hayContenidoHojaDeVida(): boolean {
    return hayContenidoHojaDeVida(this.hojaDeVidaContenido);
  }

  get personales(): PersonalesPublicoDto | null {
    return this.ctx.cv?.personales ?? null;
  }

  get redesSociales(): RedSocialPublicoDto[] {
    return this.ctx.cv?.redesSociales ?? [];
  }

  get perfilActivoHojaDeVida(): PerfilPublicoDto | null {
    return this.ctx.cv?.perfiles?.find(p => p.esActivo) ?? null;
  }

  get plantillaCodigo(): CvPlantillaCodigo | undefined {
    return this.ctx.cv?.plantillaCodigo as CvPlantillaCodigo | undefined;
  }

  ngOnInit(): void {
    this.recargar();
  }

  seleccionarPestana(pestana: PestanaPreview): void {
    this.pestanaActiva = pestana;
  }

  recargar(): void {
    this.cargando = true;
    this.error = false;
    this.cvEditorService.getPreviewPublico().subscribe({
      next: cv => {
        this.ctx.cv = cv;
        this.cargando = false;
      },
      error: () => {
        this.ctx.cv = null;
        this.cargando = false;
        this.error = true;
      },
    });
  }
}
