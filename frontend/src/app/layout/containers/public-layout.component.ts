import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';

// Clases que pueden haber quedado de otras vistas
const CLASSES_TO_REMOVE = ['layout-fixed', 'sidebar-expand-lg', 'bg-body-tertiary', 'login-page', 'bg-body-secondary'];

@Component({
  selector: 'app-public-layout',
  standalone: false,
  template: `
    <div class="d-flex flex-column min-vh-100">
      <app-navbar-public></app-navbar-public>
      <main class="flex-grow-1 py-4">
        <router-outlet></router-outlet>
      </main>
      <app-footer-public></app-footer-public>
    </div>
  `
})
export class PublicLayoutComponent implements OnInit, OnDestroy {
  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    CLASSES_TO_REMOVE.forEach(c => this.renderer.removeClass(document.body, c));
  }

  ngOnDestroy(): void {}
}
