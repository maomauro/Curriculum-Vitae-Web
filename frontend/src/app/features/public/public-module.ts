import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { PublicRoutingModule } from './public-routing-module';
import { HomeComponent } from './pages/home.component';
import { CvsComponent } from './pages/cvs.component';
import { CvDetailComponent } from './pages/cv-detail.component';

@NgModule({
  declarations: [
    HomeComponent,
    CvsComponent,
    CvDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PublicRoutingModule
  ]
})
export class PublicModule { }
