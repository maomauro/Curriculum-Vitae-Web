import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { PrivateRoutingModule } from './private-routing.module';

import { DashboardComponent }       from './pages/dashboard.component';
import { AlertasComponent }         from './pages/alertas.component';
import { MiCvComponent }            from './pages/mi-cv.component';
import { DatosPersonalesComponent } from './pages/datos-personales.component';
import { PerfilComponent }          from './pages/perfil.component';
import { ExperienciaComponent }     from './pages/experiencia.component';
import { EducacionComponent }       from './pages/educacion.component';
import { HabilidadesComponent }     from './pages/habilidades.component';
import { ProyectosComponent }       from './pages/proyectos.component';
import { ConfiguracionComponent }   from './pages/configuracion.component';import { ReferenciasComponent }      from './pages/referencias.component';
import { RedesSocialesComponent }    from './pages/redes-sociales.component';
import { FamiliaresComponent }       from './pages/familiares.component';import { EditorCvComponent }        from './pages/editor-cv.component';

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
    ReferenciasComponent,
    RedesSocialesComponent,
    FamiliaresComponent,
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
