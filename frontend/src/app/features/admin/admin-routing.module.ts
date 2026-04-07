import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminPanelComponent } from './pages/admin-panel/admin-panel.component';

const routes: Routes = [
  { path: 'panel', component: AdminPanelComponent },
  { path: '', redirectTo: 'panel', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
