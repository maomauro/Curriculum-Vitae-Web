import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  template: `
    <app-sidebar></app-sidebar>
    <div class="app-wrapper">
      <app-topbar></app-topbar>
      <main class="app-main">
        <div class="app-content-header">
          <div class="container-fluid"></div>
        </div>
        <div class="app-content">
          <div class="container-fluid">
            <router-outlet></router-outlet>
          </div>
        </div>
      </main>
      <app-footer-public></app-footer-public>
    </div>
  `
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'layout-fixed');
    this.renderer.addClass(document.body, 'sidebar-expand-lg');
    this.renderer.addClass(document.body, 'bg-body-tertiary');
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'layout-fixed');
    this.renderer.removeClass(document.body, 'sidebar-expand-lg');
    this.renderer.removeClass(document.body, 'bg-body-tertiary');
  }
}
