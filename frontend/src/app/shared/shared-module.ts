import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalNotificationsComponent } from './components/global-notifications.component';



@NgModule({
  declarations: [GlobalNotificationsComponent],
  imports: [
    CommonModule
  ],
  exports: [GlobalNotificationsComponent]
})
export class SharedModule { }
