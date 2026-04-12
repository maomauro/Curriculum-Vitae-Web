import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AdminPanelComponent } from './pages/admin-panel.component';
import { AdminRolesComponent } from './pages/admin-roles.component';
import { AdminAuditoriaComponent } from './pages/admin-auditoria.component';

/** Componentes admin; rutas en <c>AppRoutingModule</c> (eager en main, no lazy). */
@NgModule({
  declarations: [
    AdminPanelComponent,
    AdminRolesComponent,
    AdminAuditoriaComponent,
  ],
  imports: [CommonModule, FormsModule, RouterModule],
  exports: [AdminPanelComponent, AdminRolesComponent, AdminAuditoriaComponent],
})
export class AdminModule {}
