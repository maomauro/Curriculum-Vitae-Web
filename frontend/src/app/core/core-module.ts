import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { ApiService } from './services/api.service';
import { AuthService } from './services/auth.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    ApiService,
    AuthService
  ]
})
export class CoreModule { }
