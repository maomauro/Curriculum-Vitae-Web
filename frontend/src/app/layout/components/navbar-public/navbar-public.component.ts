import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar-public',
  standalone: false,
  template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
      <div class="container">
        <a class="navbar-brand fw-bold text-primary" routerLink="/">
          PortalCV
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
          data-bs-target="#navbarPublic" aria-controls="navbarPublic"
          aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarPublic">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link" routerLink="/" routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: true }">Inicio</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/cvs" routerLinkActive="active">
                Buscar CVs
              </a>
            </li>
          </ul>
          <div class="d-flex gap-2">
            <a class="btn btn-outline-primary btn-sm" routerLink="/auth/login">
              Iniciar sesión
            </a>
            <a class="btn btn-primary btn-sm" routerLink="/auth/register">
              Registrarse
            </a>
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarPublicComponent { }
