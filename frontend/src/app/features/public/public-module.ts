import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { PublicRoutingModule } from './public-routing-module';
import { HomeComponent } from './pages/home.component';
import { BuscarCvsComponent } from './pages/buscar-cvs.component';
import { DetalleCvComponent } from './pages/detalle-cv.component';
import { DashboardCandidatoComponent } from './pages/dashboard-candidato.component';

@NgModule({
  declarations: [
    HomeComponent,
    BuscarCvsComponent,
    DetalleCvComponent,
    DashboardCandidatoComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PublicRoutingModule
  ]
})
export class PublicModule { }
