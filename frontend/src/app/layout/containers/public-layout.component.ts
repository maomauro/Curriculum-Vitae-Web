import { Component } from '@angular/core';

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
export class PublicLayoutComponent { }
