import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent }      from './pages/dashboard.component';
import { AlertasComponent }        from './pages/alertas.component';
import { MiCvComponent }           from './pages/mi-cv.component';
import { DatosPersonalesComponent } from './pages/datos-personales.component';
import { PerfilComponent }         from './pages/perfil.component';
import { ExperienciaComponent }    from './pages/experiencia.component';
import { EducacionComponent }      from './pages/educacion.component';
import { HabilidadesComponent }    from './pages/habilidades.component';
import { ProyectosComponent }      from './pages/proyectos.component';
import { ConfiguracionComponent }  from './pages/configuracion.component';import { ReferenciasComponent }     from './pages/referencias.component';
import { RedesSocialesComponent }   from './pages/redes-sociales.component';
import { FamiliaresComponent }      from './pages/familiares.component';import { EditorCvComponent }       from './pages/editor-cv.component';

const routes: Routes = [
  { path: 'dashboard',        component: DashboardComponent },
  { path: 'alertas',          component: AlertasComponent },
  { path: 'mi-cv',            component: MiCvComponent },
  { path: 'datos-personales', component: DatosPersonalesComponent },
  { path: 'perfil',           component: PerfilComponent },
  { path: 'experiencia',      component: ExperienciaComponent },
  { path: 'educacion',        component: EducacionComponent },
  { path: 'habilidades',      component: HabilidadesComponent },
  { path: 'proyectos',      component: ProyectosComponent },
  { path: 'referencias',    component: ReferenciasComponent },
  { path: 'redes-sociales', component: RedesSocialesComponent },
  { path: 'familiares',     component: FamiliaresComponent },
  { path: 'configuracion',  component: ConfiguracionComponent },
  { path: 'editor',           component: EditorCvComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrivateRoutingModule {}
