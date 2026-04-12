/**
 * Mapa de bundles (Angular dev server / build):
 * - Eager en main: layout + admin (Usuarios, Roles, Auditoría) vía AppModule → AdminModule.
 * - Lazy (loadChildren): PublicModule, AuthModule, PrivateModule — un chunk por área, sin lazy anidado.
 * Si en dev una zona no refleja cambios: `npm run start:fresh` o `npx ng cache clean` y reiniciar serve.
 */
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicLayoutComponent } from './layout/containers/public-layout.component';
import { AuthLayoutComponent } from './layout/containers/auth-layout.component';
import { AdminLayoutComponent } from './layout/containers/admin-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { AdminPanelComponent } from './features/admin/pages/admin-panel.component';
import { AdminRolesComponent } from './features/admin/pages/admin-roles.component';
import { AdminAuditoriaComponent } from './features/admin/pages/admin-auditoria.component';

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
        path: '',
        loadChildren: () =>
          import('./features/private/private.module').then(m => m.PrivateModule)
      }
    ]
  },

  // ── Panel de administración (eager: evita chunk lazy admin-module cacheado en dev) ──
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        canActivate: [adminGuard],
        children: [
          { path: 'usuarios', component: AdminPanelComponent },
          { path: 'roles', component: AdminRolesComponent },
          { path: 'auditoria', component: AdminAuditoriaComponent },
          { path: 'panel', redirectTo: 'usuarios', pathMatch: 'full' },
          { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
        ],
      },
    ],
  },

  // ── Fallback ────────────────────────────────────────────────────────────────
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
