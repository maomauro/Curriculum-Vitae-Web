import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { BuscarCvsComponent } from './pages/buscar-cvs.component';
import { DetalleCvComponent } from './pages/detalle-cv.component';
import { DashboardCandidatoComponent } from './pages/dashboard-candidato.component';

const routes: Routes = [
  { path: '',                    component: HomeComponent },
  { path: 'cvs',                 component: BuscarCvsComponent },
  { path: 'cv/:urlPublica',              component: DetalleCvComponent },
  { path: 'cv/:urlPublica/dashboard',    component: DashboardCandidatoComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PublicRoutingModule { }
