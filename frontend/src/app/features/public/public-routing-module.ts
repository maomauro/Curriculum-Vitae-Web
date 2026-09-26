import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { BuscarCvsComponent } from './pages/buscar-cvs.component';
import { CvPublicoShellComponent } from './pages/cv-publico-shell.component';
import { HojaDeVidaComponent } from './pages/hoja-de-vida.component';
import { InformacionProfesionalComponent } from './pages/informacion-profesional.component';
import { DashboardCandidatoComponent } from '../../shared/components/dashboard-candidato.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'cvs', component: BuscarCvsComponent },
  {
    path: 'cv/:urlPublica',
    component: CvPublicoShellComponent,
    children: [
      { path: '', pathMatch: 'full', component: HojaDeVidaComponent },
      { path: 'profesional', component: InformacionProfesionalComponent },
      { path: 'dashboard', component: DashboardCandidatoComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PublicRoutingModule { }
