import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthModalService } from '../../../core/services/auth/auth-modal.service';

@Component({
  selector: 'app-home',
  standalone: false,
  template: `
    <div class="public-home">
      <section class="hero-section" aria-labelledby="home-hero-title">
        <div class="container">
          <h1 id="home-hero-title" class="hero-title">Encuentra el talento que necesitas</h1>
          <p class="hero-subtitle">
            Explora perfiles de profesionales que han <strong>publicado</strong> su CV en el portal.
            Como visitante no necesitas registro para buscar ni ver fichas públicas.
          </p>

          <div class="hero-search">
            <label class="visually-hidden" for="home-search-q">Buscar por nombre, cargo o habilidad</label>
            <div class="input-group input-group-lg shadow-sm">
              <span class="input-group-text bg-white border-end-0">
                <i class="bi bi-search text-muted" aria-hidden="true"></i>
              </span>
              <input
                id="home-search-q"
                type="search"
                class="form-control border-start-0 ps-0"
                placeholder="Nombre, cargo, ciudad o tecnología…"
                autocomplete="off"
                [(ngModel)]="busqueda"
                (keyup.enter)="buscar()">
              <button
                class="btn btn-primary px-4"
                type="button"
                (click)="buscar()">
                <i class="bi bi-search me-1" aria-hidden="true"></i>Buscar
              </button>
            </div>
          </div>

          <p class="hero-footnote text-muted small mb-0">
            El listado solo incluye CV en estado <strong>publicado</strong> por cada profesional.
          </p>

          <div class="d-flex flex-wrap justify-content-center gap-2 mt-3">
            <a routerLink="/cvs" class="btn btn-outline-primary btn-sm">
              <i class="bi bi-grid-3x3-gap me-1" aria-hidden="true"></i>Ver todos los CVs
            </a>
          </div>

          <div class="row g-4 hero-pillars justify-content-center">
            <div class="col-12 col-md-4">
              <div class="hero-pillar">
                <div class="hero-pillar-icon" aria-hidden="true">
                  <i class="bi bi-search"></i>
                </div>
                <h3 class="hero-pillar-title">Búsqueda abierta</h3>
                <p class="hero-pillar-text text-muted small mb-0">
                  Filtra por palabra clave o ciudad desde el directorio público.
                </p>
              </div>
            </div>
            <div class="col-12 col-md-4">
              <div class="hero-pillar">
                <div class="hero-pillar-icon" aria-hidden="true">
                  <i class="bi bi-person-badge"></i>
                </div>
                <h3 class="hero-pillar-title">Perfiles con contexto</h3>
                <p class="hero-pillar-text text-muted small mb-0">
                  Resumen, ubicación y habilidades para acotar candidatos.
                </p>
              </div>
            </div>
            <div class="col-12 col-md-4">
              <div class="hero-pillar">
                <div class="hero-pillar-icon" aria-hidden="true">
                  <i class="bi bi-envelope-paper"></i>
                </div>
                <h3 class="hero-pillar-title">Contacto directo</h3>
                <p class="hero-pillar-text text-muted small mb-0">
                  Desde cada CV público puedes enviar un mensaje al profesional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="cta-section" aria-labelledby="home-cta-title">
        <div class="container text-center">
          <h2 id="home-cta-title">¿Eres un profesional?</h2>
          <p class="text-muted mb-4">
            Crea tu CV, elige cuándo <strong>publicarlo</strong> y compártelo con reclutadores.
          </p>
          <button type="button" class="btn btn-primary btn-lg" (click)="abrirRegistro()">
            <i class="bi bi-person-plus-fill me-2" aria-hidden="true"></i>Crear mi CV gratis
          </button>
          <p class="small text-muted mt-4 mb-0">
            ¿Ya tienes cuenta?
            <button type="button" class="btn btn-link link-primary p-0 align-baseline" (click)="abrirLogin()">
              Inicia sesión
            </button>
          </p>
        </div>
      </section>
    </div>
  `,
})
export class HomeComponent {
  busqueda = '';

  private readonly router = inject(Router);
  private readonly authModal = inject(AuthModalService);

  abrirLogin(): void {
    this.authModal.openLogin();
  }

  abrirRegistro(): void {
    this.authModal.openRegister();
  }

  buscar(): void {
    const q = this.busqueda.trim();
    this.router.navigate(['/cvs'], {
      queryParams: q ? { q } : {},
    });
  }
}
