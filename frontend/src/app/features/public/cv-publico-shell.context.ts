import { Injectable } from '@angular/core';
import type { CvDetalleDto } from '../../core/services/public/public.service';

/** Estado del CV cargado por el layout padre (hoja de vida + dashboard comparten una sola carga HTTP). */
@Injectable()
export class CvPublicoShellContext {
  cv: CvDetalleDto | null = null;
}
