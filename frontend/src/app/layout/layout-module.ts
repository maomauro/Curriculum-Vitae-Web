import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { PublicLayoutComponent } from './containers/public-layout.component';
import { AuthLayoutComponent } from './containers/auth-layout.component';
import { AdminLayoutComponent } from './containers/admin-layout.component';

@NgModule({
  declarations: [PublicLayoutComponent, AuthLayoutComponent, AdminLayoutComponent],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [PublicLayoutComponent, AuthLayoutComponent, AdminLayoutComponent]
})
export class LayoutModule { }
