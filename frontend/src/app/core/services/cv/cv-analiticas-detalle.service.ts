import { Injectable, inject } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CvEditorService } from '../private/cv-editor.service';
import { PublicService, type CvDetalleDto } from '../public/public.service';
import { mapEditorToCvDetalleDto } from '../../mappers/map-editor-to-cv-detalle-dto';

/**
 * Única capa que sabe cómo obtener un CvDetalleDto para el dashboard analítico:
 * - público: detalle por URL (API pública)
 * - privado: agregado del editor (API /api/cv) mapeado al mismo DTO
 */
@Injectable({ providedIn: 'root' })
export class CvAnaliticasDetalleService {
  private readonly publicApi = inject(PublicService);
  private readonly cvEditor = inject(CvEditorService);

  detallePublicoParaAnaliticas$(urlPublica: string): Observable<CvDetalleDto> {
    return this.publicApi.getDetalle(urlPublica);
  }

  detallePrivadoParaAnaliticas$(): Observable<CvDetalleDto> {
    return forkJoin({
      personales: this.cvEditor.getPersonales(),
      perfiles: this.cvEditor.getPerfiles(),
      experiencias: this.cvEditor.getExperiencias(),
      formaciones: this.cvEditor.getFormaciones(),
      habilidades: this.cvEditor.getHabilidades(),
      proyectos: this.cvEditor.getProyectos(),
      redes: this.cvEditor.getRedesSociales(),
      referencias: this.cvEditor.getReferencias(),
      presentacion: this.cvEditor.getPresentacion(),
    }).pipe(
      map(
        ({
          personales,
          perfiles,
          experiencias,
          formaciones,
          habilidades,
          proyectos,
          redes,
          referencias,
          presentacion,
        }) =>
          mapEditorToCvDetalleDto(
            personales,
            presentacion,
            perfiles,
            experiencias,
            formaciones,
            habilidades,
            proyectos,
            referencias,
            redes
          )
      )
    );
  }
}
