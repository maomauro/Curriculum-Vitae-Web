import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalNotificationsComponent } from './components/global-notifications.component';
import { CvPlantillaPreviewComponent } from './components/cv-plantilla-preview/cv-plantilla-preview.component';

@NgModule({
  declarations: [GlobalNotificationsComponent, CvPlantillaPreviewComponent],
  imports: [CommonModule],
  exports: [GlobalNotificationsComponent, CvPlantillaPreviewComponent],
})
export class SharedModule {}
