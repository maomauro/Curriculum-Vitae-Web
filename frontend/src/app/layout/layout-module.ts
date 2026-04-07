import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { PublicLayoutComponent } from './containers/public-layout.component';
import { AuthLayoutComponent } from './containers/auth-layout.component';
import { AdminLayoutComponent } from './containers/admin-layout.component';
import { NavbarPublicComponent } from './components/navbar-public/navbar-public.component';
import { FooterPublicComponent } from './components/footer/footer.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { TopbarComponent } from './components/topbar/topbar.component';

@NgModule({
  declarations: [
    PublicLayoutComponent,
    AuthLayoutComponent,
    AdminLayoutComponent,
    NavbarPublicComponent,
    FooterPublicComponent,
    SidebarComponent,
    TopbarComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    PublicLayoutComponent,
    AuthLayoutComponent,
    AdminLayoutComponent
  ]
})
export class LayoutModule { }
