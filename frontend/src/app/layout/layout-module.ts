import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { HeaderComponent } from './components/header.component';
import { FooterComponent } from './components/footer.component';
import { MainLayoutComponent } from './containers/main-layout.component';

@NgModule({
  declarations: [HeaderComponent, FooterComponent, MainLayoutComponent],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [HeaderComponent, FooterComponent, MainLayoutComponent]
})
export class LayoutModule { }
