import { Component, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-public-layout',
  standalone: false,
  template: `
    <app-navbar-public></app-navbar-public>
    <main>
      <router-outlet></router-outlet>
    </main>
    <app-footer-public></app-footer-public>
  `
})
export class PublicLayoutComponent implements OnInit {
  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.renderer.removeClass(document.body, 'login-page');
    this.renderer.removeClass(document.body, 'bg-body-secondary');
    this.renderer.removeClass(document.body, 'layout-fixed');
    this.renderer.removeClass(document.body, 'sidebar-expand-lg');
    this.renderer.removeClass(document.body, 'sidebar-mini');
    this.renderer.removeClass(document.body, 'sidebar-collapse');
    this.renderer.removeClass(document.body, 'sidebar-open');
    this.renderer.removeClass(document.body, 'bg-body-tertiary');
  }

}
