import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { PrivateRoutingModule } from './private-routing.module';

import { DashboardComponent }       from './pages/dashboard.component';
import { AlertasComponent }         from './pages/alertas.component';
import { MiCvComponent }            from './pages/mi-cv.component';
import { ProfesionalComponent }     from './pages/profesional.component';
import { DatosPersonalesComponent } from './pages/datos-personales.component';
import { PerfilComponent }          from './pages/perfil.component';
import { ExperienciaComponent }     from './pages/experiencia.component';
import { EducacionComponent }       from './pages/educacion.component';
import { HabilidadesComponent }     from './pages/habilidades.component';
import { ProyectosComponent }       from './pages/proyectos.component';
import { ConfiguracionComponent }   from './pages/configuracion.component';
import { PreviewPublicoPanelComponent } from './pages/preview-publico-panel.component';
import { ReferenciasComponent }      from './pages/referencias.component';
import { RedesSocialesComponent }    from './pages/redes-sociales.component';
import { FamiliaresComponent }       from './pages/familiares.component';
import { ContactosComponent }        from './pages/contactos.component';
import { AnalizarOfertaComponent }   from './pages/analizar-oferta.component';
import { PromptsIaComponent }        from './pages/prompts-ia.component';
import { SharedModule } from '../../shared/shared-module';

@NgModule({
  declarations: [
    DashboardComponent,
    AlertasComponent,
    MiCvComponent,
    ProfesionalComponent,
    DatosPersonalesComponent,
    PerfilComponent,
    ExperienciaComponent,
    EducacionComponent,
    HabilidadesComponent,
    ProyectosComponent,
    AnalizarOfertaComponent,
    PromptsIaComponent,
    ReferenciasComponent,
    RedesSocialesComponent,
    FamiliaresComponent,
    ContactosComponent,
    ConfiguracionComponent,
    PreviewPublicoPanelComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PrivateRoutingModule,
    SharedModule,
  ],
})
export class PrivateModule {}
