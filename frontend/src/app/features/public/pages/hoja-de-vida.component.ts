import { Component, inject } from '@angular/core';
import { CvDetalleVistaContext } from '../../../shared/contexts/cv-detalle-vista.context';
import { VisibilidadSeccionResolver } from '../../../core/utils/visibilidad-seccion-resolver';
import type { CvPreviewVisibilidad } from '../../../shared/models/cv-preview-vm';
import {
  hayContenidoHojaDeVida,
  type HojaDeVidaContenidoDto,
  type PerfilPublicoDto,
  type PersonalesPublicoDto,
  type RedSocialPublicoDto,
} from '../../../core/services/public/public.service';
import type { CvPlantillaCodigo } from '../../../core/constants/cv-plantillas';

/** Pestaña pública "Hoja de vida": muestra el CV generado por IA del Perfil que el
 * candidato marcó como activo (Perfil.EsActivo) -- ver PublicCvService.ResolverHojaDeVidaContenido.
 * Misma apariencia visual (encabezado, plantilla de color) que "Ver CV" en Mi CV --
 * delegada en app-cv-hoja-de-vida-contenido (compartido con el panel de vista previa de
 * Configuración) para no reimplementar el layout acá. */
@Component({
  selector: 'app-hoja-de-vida',
  standalone: false,
  templateUrl: './hoja-de-vida.component.html',
})
export class HojaDeVidaComponent {
  private readonly shellCtx = inject(CvDetalleVistaContext);

  get contenido(): HojaDeVidaContenidoDto | null {
    return this.shellCtx.cv?.hojaDeVidaContenido ?? null;
  }

  get hayContenido(): boolean {
    return hayContenidoHojaDeVida(this.contenido);
  }

  get personales(): PersonalesPublicoDto | null {
    return this.shellCtx.cv?.personales ?? null;
  }

  get redesSociales(): RedSocialPublicoDto[] {
    return this.shellCtx.cv?.redesSociales ?? [];
  }

  get perfilActivo(): PerfilPublicoDto | null {
    return this.shellCtx.cv?.perfiles?.find(p => p.esActivo) ?? null;
  }

  get plantillaCodigo(): CvPlantillaCodigo | undefined {
    return this.shellCtx.cv?.plantillaCodigo as CvPlantillaCodigo | undefined;
  }

  get visibilidad(): CvPreviewVisibilidad {
    return new VisibilidadSeccionResolver(this.shellCtx.cv?.visibilidadSeccion);
  }
}
