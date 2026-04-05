import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  template: `
    <div class="wrapper">
      <app-topbar></app-topbar>
      <app-sidebar></app-sidebar>
      <main class="app-main">
        <div class="app-content">
          <div class="container-fluid">
            <router-outlet></router-outlet>
          </div>
        </div>
      </main>
      <footer class="app-footer">
        <strong>&copy; 2026 PortalCV</strong>
      </footer>
    </div>
  `
})
export class AdminLayoutComponent { }
