import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { PublicLayoutComponent } from './containers/public-layout.component';
import { AuthLayoutComponent } from './containers/auth-layout.component';
import { AdminLayoutComponent } from './containers/admin-layout.component';
import { NavbarPublicComponent } from './components/navbar-public.component';
import { AuthModalsHostComponent } from './components/auth-modals-host.component';
import { FooterPublicComponent } from './components/footer.component';
import { AuthSharedModule } from '../features/auth/auth-shared.module';
import { SidebarComponent } from './components/sidebar.component';
import { TopbarComponent } from './components/topbar.component';

@NgModule({
  declarations: [
    PublicLayoutComponent,
    AuthLayoutComponent,
    AdminLayoutComponent,
    NavbarPublicComponent,
    AuthModalsHostComponent,
    FooterPublicComponent,
    SidebarComponent,
    TopbarComponent
  ],
  imports: [CommonModule, RouterModule, AuthSharedModule],
  exports: [
    PublicLayoutComponent,
    AuthLayoutComponent,
    AdminLayoutComponent,
    AuthModalsHostComponent,
  ]
})
export class LayoutModule { }
