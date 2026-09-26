import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalNotificationsComponent } from './components/global-notifications.component';
import { CvPlantillaPreviewComponent } from './components/cv-plantilla-preview/cv-plantilla-preview.component';
import { DashboardCandidatoComponent } from './components/dashboard-candidato.component';
import { CvHojaDeVidaContenidoComponent } from './components/cv-hoja-de-vida-contenido/cv-hoja-de-vida-contenido.component';

@NgModule({
  declarations: [
    GlobalNotificationsComponent,
    CvPlantillaPreviewComponent,
    DashboardCandidatoComponent,
    CvHojaDeVidaContenidoComponent,
  ],
  imports: [CommonModule],
  exports: [
    GlobalNotificationsComponent,
    CvPlantillaPreviewComponent,
    DashboardCandidatoComponent,
    CvHojaDeVidaContenidoComponent,
  ],
})
export class SharedModule {}
