import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicLayoutComponent } from './layout/containers/public-layout.component';
import { AuthLayoutComponent } from './layout/containers/auth-layout.component';
import { AdminLayoutComponent } from './layout/containers/admin-layout.component';
import { authGuard } from './core/guards/auth.guard';

const routes: Routes = [
  // Sección Auth — /auth/login, /auth/register
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('./features/auth/auth-module').then(m => m.AuthModule)
      }
    ]
  },
  // Sección privada — /dashboard, /editor (requiere autenticación)
  {
    path: 'dashboard',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./features/dashboard/dashboard-module').then(m => m.DashboardModule)
      }
    ]
  },
  {
    path: 'editor',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./features/editor/editor-module').then(m => m.EditorModule)
      }
    ]
  },
  // Sección pública — /, /cvs, /cv/:id (debe ir al final)
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('./features/public/public-module').then(m => m.PublicModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
