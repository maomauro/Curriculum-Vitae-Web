import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/containers/main-layout.component';

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('./features/public/public-module').then(m => m.PublicModule)
      },
      {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth-module').then(m => m.AuthModule)
      },
      {
        path: 'editor',
        loadChildren: () => import('./features/editor/editor-module').then(m => m.EditorModule)
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard-module').then(m => m.DashboardModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
