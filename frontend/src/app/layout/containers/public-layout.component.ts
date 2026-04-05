import { Component } from '@angular/core';

@Component({
  selector: 'app-public-layout',
  standalone: false,
  template: `
    <div class="wrapper">
      <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
        <div class="container">
          <a class="navbar-brand fw-bold" routerLink="/">PortalCV</a>
          <div class="ms-auto">
            <a class="btn btn-outline-primary btn-sm me-2" routerLink="/auth/login">Iniciar sesión</a>
            <a class="btn btn-primary btn-sm" routerLink="/auth/register">Registrarse</a>
          </div>
        </div>
      </nav>
      <main class="py-4">
        <router-outlet></router-outlet>
      </main>
      <footer class="footer bg-dark text-white py-3 mt-auto">
        <div class="container text-center">
          <small>&copy; 2026 PortalCV</small>
        </div>
      </footer>
    </div>
  `
})
export class PublicLayoutComponent { }
