import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicLayoutComponent } from './layout/containers/public-layout.component';
import { AuthLayoutComponent } from './layout/containers/auth-layout.component';
import { AdminLayoutComponent } from './layout/containers/admin-layout.component';
import { authGuard } from './core/guards/auth.guard';

const routes: Routes = [
  // ── Módulo público ──────────────────────────────────────────────────────────
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/public/public-module').then(m => m.PublicModule)
      }
    ]
  },

  // ── Autenticación ───────────────────────────────────────────────────────────
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/auth/auth-module').then(m => m.AuthModule)
      }
    ]
  },

  // ── Área privada (requiere authGuard) ───────────────────────────────────────
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard-module').then(m => m.DashboardModule)
      },
      {
        path: 'editor',
        loadChildren: () =>
          import('./features/editor/editor-module').then(m => m.EditorModule)
      }
    ]
  },

  // ── Fallback ────────────────────────────────────────────────────────────────
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
