import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalNotificationsComponent } from './components/global-notifications.component';
import { CvPlantillaPreviewComponent } from './components/cv-plantilla-preview/cv-plantilla-preview.component';
import { DashboardCandidatoComponent } from './components/dashboard-candidato.component';

@NgModule({
  declarations: [GlobalNotificationsComponent, CvPlantillaPreviewComponent, DashboardCandidatoComponent],
  imports: [CommonModule],
  exports: [GlobalNotificationsComponent, CvPlantillaPreviewComponent, DashboardCandidatoComponent],
})
export class SharedModule {}
