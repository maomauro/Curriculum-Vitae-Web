import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AuthRoutingModule } from './auth-routing-module';
import { LoginComponent } from './pages/login.component';
import { RegisterComponent } from './pages/register.component';
import { RecuperarContrasenaComponent } from './pages/recuperar-contrasena.component';

@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    RecuperarContrasenaComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AuthRoutingModule
  ]
})
export class AuthModule { }
