import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  template: `
    <app-topbar></app-topbar>
    <app-sidebar></app-sidebar>
    <main class="cv-main">
      <router-outlet></router-outlet>
    </main>
  `
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'bg-body-tertiary');
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'bg-body-tertiary');
  }
}
