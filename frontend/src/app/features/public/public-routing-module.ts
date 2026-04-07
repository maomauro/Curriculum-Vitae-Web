import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { CvsComponent } from './pages/cvs.component';
import { CvDetailComponent } from './pages/cv-detail.component';

const routes: Routes = [
  { path: '',        component: HomeComponent },
  { path: 'cvs',    component: CvsComponent },
  { path: 'cv/:id', component: CvDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PublicRoutingModule { }
