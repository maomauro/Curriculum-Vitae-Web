import { Component } from '@angular/core';

/** "Mi CV": el CV generado por IA que el postulante marcó como activo (uno por oferta
 * gestionada, ver docs/arquitectura/Roadmap-Ofertas-IA.md, Fase 4). Esa fase todavía no
 * está construida -- por ahora esta página solo muestra un estado vacío. El consolidado
 * de toda la información profesional (lo que esta página mostraba antes) vive ahora en
 * ProfesionalComponent. */
@Component({
  selector: 'app-mi-cv',
  standalone: false,
  templateUrl: './mi-cv.component.html',
})
export class MiCvComponent {}
