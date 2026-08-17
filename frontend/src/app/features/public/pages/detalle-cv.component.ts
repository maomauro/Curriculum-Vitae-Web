import { Component, inject } from '@angular/core';
import { cvDetalleDtoToPreviewVm } from '../../../shared/mappers/cv-detalle-to-preview-vm';
import type { CvPreviewVm } from '../../../shared/models/cv-preview-vm';
import { CvDetalleVistaContext } from '../../../shared/contexts/cv-detalle-vista.context';

@Component({
  selector: 'app-detalle-cv',
  standalone: false,
  templateUrl: './detalle-cv.component.html',
})
export class DetalleCvComponent {
  private readonly shellCtx = inject(CvDetalleVistaContext);

  get vistaPlantilla(): CvPreviewVm | null {
    const cv = this.shellCtx.cv;
    return cv ? cvDetalleDtoToPreviewVm(cv) : null;
  }
}
