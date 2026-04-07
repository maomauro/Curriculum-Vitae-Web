import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { PrivateRoutingModule } from './private-routing.module';

import { DashboardComponent }       from './pages/dashboard/dashboard.component';
import { AlertasComponent }         from './pages/alertas/alertas.component';
import { MiCvComponent }            from './pages/mi-cv/mi-cv.component';
import { DatosPersonalesComponent } from './pages/datos-personales/datos-personales.component';
import { PerfilComponent }          from './pages/perfil/perfil.component';
import { ExperienciaComponent }     from './pages/experiencia/experiencia.component';
import { EducacionComponent }       from './pages/educacion/educacion.component';
import { HabilidadesComponent }     from './pages/habilidades/habilidades.component';
import { ProyectosComponent }       from './pages/proyectos/proyectos.component';
import { ConfiguracionComponent }   from './pages/configuracion/configuracion.component';
import { EditorCvComponent }        from './pages/editor-cv/editor-cv.component';

@NgModule({
  declarations: [
    DashboardComponent,
    AlertasComponent,
    MiCvComponent,
    DatosPersonalesComponent,
    PerfilComponent,
    ExperienciaComponent,
    EducacionComponent,
    HabilidadesComponent,
    ProyectosComponent,
    ConfiguracionComponent,
    EditorCvComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PrivateRoutingModule,
  ],
})
export class PrivateModule {}
