import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';

const ADMIN_BODY_CLASSES = ['layout-fixed', 'sidebar-expand-lg', 'bg-body-tertiary'];

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  template: `
    <div class="app-wrapper">
      <app-topbar></app-topbar>
      <app-sidebar></app-sidebar>
      <main class="app-main">
        <router-outlet></router-outlet>
      </main>
      <footer class="app-footer">
        <strong>&copy; 2026 PortalCV</strong>
      </footer>
    </div>
  `
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    ADMIN_BODY_CLASSES.forEach(c => this.renderer.addClass(document.body, c));
  }

  ngOnDestroy(): void {
    ADMIN_BODY_CLASSES.forEach(c => this.renderer.removeClass(document.body, c));
  }
}
