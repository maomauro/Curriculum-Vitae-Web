import { Component, inject } from '@angular/core';
import { cvDetalleDtoToPreviewVm } from '../../../shared/mappers/cv-detalle-to-preview-vm';
import type { CvPreviewVisibilidad, CvPreviewVm } from '../../../shared/models/cv-preview-vm';
import { CvDetalleVistaContext } from '../../../shared/contexts/cv-detalle-vista.context';
import { VisibilidadSeccionResolver } from '../../../core/utils/visibilidad-seccion-resolver';

/** Pestaña pública "Información profesional": consolidado de toda la información
 * profesional del postulante -- misma vista que antes ocupaba "Hoja de vida" antes de
 * separar ambos conceptos (ver docs/arquitectura/Roadmap-Ofertas-IA.md, Fase 4). Filtra
 * por los switches de "Información Personal"/"Información Profesional" de Configuración
 * (VisibilidadSeccionResolver), igual que hacía antes la vista privada. */
@Component({
  selector: 'app-informacion-profesional',
  standalone: false,
  templateUrl: './informacion-profesional.component.html',
})
export class InformacionProfesionalComponent {
  private readonly shellCtx = inject(CvDetalleVistaContext);

  get vistaPlantilla(): CvPreviewVm | null {
    const cv = this.shellCtx.cv;
    return cv ? cvDetalleDtoToPreviewVm(cv) : null;
  }

  get visibilidad(): CvPreviewVisibilidad {
    return new VisibilidadSeccionResolver(this.shellCtx.cv?.visibilidadSeccion);
  }
}
