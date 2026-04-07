import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar-public',
  standalone: false,
  template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-white sticky-top shadow-sm">
      <div class="container">
        <!-- Logo -->
        <a class="navbar-brand fw-bold text-primary d-flex align-items-center gap-1" routerLink="/">
          <i class="bi bi-file-earmark-person-fill"></i>PortalCV
        </a>

        <!-- Hamburger -->
        <button class="navbar-toggler border-0" type="button"
          data-bs-toggle="collapse" data-bs-target="#navbarPublic"
          aria-controls="navbarPublic" aria-expanded="false" aria-label="Abrir menú">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarPublic">
          <!-- Links -->
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link" routerLink="/" routerLinkActive="active fw-semibold"
                [routerLinkActiveOptions]="{ exact: true }">Inicio</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/cvs" routerLinkActive="active fw-semibold">
                Buscar CVs
              </a>
            </li>
          </ul>

          <!-- Acciones -->
          <div class="d-flex gap-2 ms-lg-3">
            <a class="btn btn-outline-primary btn-sm px-3" routerLink="/auth/login">
              Iniciar sesión
            </a>
            <a class="btn btn-primary btn-sm px-3" routerLink="/auth/register">
              Registrarse
            </a>
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarPublicComponent { }
