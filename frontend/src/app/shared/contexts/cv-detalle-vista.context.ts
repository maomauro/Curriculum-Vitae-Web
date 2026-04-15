import { Injectable } from '@angular/core';
import type { CvDetalleDto } from '../../core/services/public/public.service';

/** CV cargado por un padre (shell público o página privada) para el dashboard analítico. */
@Injectable()
export class CvDetalleVistaContext {
  cv: CvDetalleDto | null = null;
}
