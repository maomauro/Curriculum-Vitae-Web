import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent }      from './pages/dashboard/dashboard.component';
import { AlertasComponent }        from './pages/alertas/alertas.component';
import { MiCvComponent }           from './pages/mi-cv/mi-cv.component';
import { DatosPersonalesComponent } from './pages/datos-personales/datos-personales.component';
import { PerfilComponent }         from './pages/perfil/perfil.component';
import { ExperienciaComponent }    from './pages/experiencia/experiencia.component';
import { EducacionComponent }      from './pages/educacion/educacion.component';
import { HabilidadesComponent }    from './pages/habilidades/habilidades.component';
import { ProyectosComponent }      from './pages/proyectos/proyectos.component';
import { ConfiguracionComponent }  from './pages/configuracion/configuracion.component';
import { EditorCvComponent }       from './pages/editor-cv/editor-cv.component';

const routes: Routes = [
  { path: 'dashboard',        component: DashboardComponent },
  { path: 'alertas',          component: AlertasComponent },
  { path: 'mi-cv',            component: MiCvComponent },
  { path: 'datos-personales', component: DatosPersonalesComponent },
  { path: 'perfil',           component: PerfilComponent },
  { path: 'experiencia',      component: ExperienciaComponent },
  { path: 'educacion',        component: EducacionComponent },
  { path: 'habilidades',      component: HabilidadesComponent },
  { path: 'proyectos',        component: ProyectosComponent },
  { path: 'configuracion',    component: ConfiguracionComponent },
  { path: 'editor',           component: EditorCvComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrivateRoutingModule {}
