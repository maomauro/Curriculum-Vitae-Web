import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { PublicRoutingModule } from './public-routing-module';
import { HomeComponent } from './pages/home.component';
import { BuscarCvsComponent } from './pages/buscar-cvs.component';
import { CvPublicoShellComponent } from './pages/cv-publico-shell.component';
import { DetalleCvComponent } from './pages/detalle-cv.component';
import { SharedModule } from '../../shared/shared-module';

@NgModule({
  declarations: [
    HomeComponent,
    BuscarCvsComponent,
    CvPublicoShellComponent,
    DetalleCvComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PublicRoutingModule,
    SharedModule,
  ]
})
export class PublicModule { }
