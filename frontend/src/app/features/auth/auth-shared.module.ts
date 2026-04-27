import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { LoginComponent } from './pages/login.component';
import { RegisterComponent } from './pages/register.component';
import { RecuperarContrasenaComponent } from './pages/recuperar-contrasena.component';
import { AuthPublicBridgeComponent } from './pages/auth-public-bridge.component';
import { AuthReadinessBannerComponent } from './components/auth-readiness-banner.component';

@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    RecuperarContrasenaComponent,
    AuthPublicBridgeComponent,
    AuthReadinessBannerComponent,
  ],
  imports: [CommonModule, FormsModule, RouterModule],
  exports: [LoginComponent, RegisterComponent, RecuperarContrasenaComponent],
})
export class AuthSharedModule {}
