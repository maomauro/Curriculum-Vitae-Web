import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { BuscarCvsComponent } from './pages/buscar-cvs.component';
import { CvPublicoShellComponent } from './pages/cv-publico-shell.component';
import { DetalleCvComponent } from './pages/detalle-cv.component';
import { DashboardCandidatoComponent } from './pages/dashboard-candidato.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'cvs', component: BuscarCvsComponent },
  {
    path: 'cv/:urlPublica',
    component: CvPublicoShellComponent,
    children: [
      { path: '', pathMatch: 'full', component: DetalleCvComponent },
      { path: 'dashboard', component: DashboardCandidatoComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PublicRoutingModule { }
