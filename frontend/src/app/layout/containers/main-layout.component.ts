import { Component } from '@angular/core';

@Component({
  selector: 'app-main-layout',
  standalone: false,
  template: `
    <div class="layout-wrapper">
      <app-header></app-header>
      <main class="layout-main">
        <div class="container">
          <router-outlet></router-outlet>
        </div>
      </main>
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    .layout-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .layout-main {
      flex: 1;
      padding: 2rem 0;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }
  `]
})
export class MainLayoutComponent { }
