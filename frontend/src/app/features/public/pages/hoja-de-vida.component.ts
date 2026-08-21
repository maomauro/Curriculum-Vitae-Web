import { Component } from '@angular/core';

/** Pestaña pública "Hoja de vida": muestra el CV generado por IA que el postulante
 * marcó como activo (ver docs/arquitectura/Roadmap-Ofertas-IA.md, Fase 4). Hasta que esa
 * fase exista, no hay ningún CV generado que mostrar -- ver informacion-profesional.
 * component para el consolidado de toda la información profesional. */
@Component({
  selector: 'app-hoja-de-vida',
  standalone: false,
  templateUrl: './hoja-de-vida.component.html',
})
export class HojaDeVidaComponent {}
