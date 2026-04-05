import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-layout',
  standalone: false,
  template: `
    <div class="login-page" style="min-height: 100vh;">
      <div class="login-box">
        <div class="text-center mb-4">
          <a routerLink="/" class="text-decoration-none">
            <span class="brand-text fw-bold fs-3">PortalCV</span>
          </a>
        </div>
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class AuthLayoutComponent { }
