import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthPublicBridgeComponent } from './pages/auth-public-bridge.component';

const routes: Routes = [
  { path: 'login', component: AuthPublicBridgeComponent },
  { path: 'register', component: AuthPublicBridgeComponent },
  { path: 'recuperar-contrasena', component: AuthPublicBridgeComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
