import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: false,
  template: `
    <!-- Hero Section -->
    <section class="py-5 bg-light border-bottom">
      <div class="container text-center">
        <h1 class="display-5 fw-bold text-primary mb-3">Encuentra el talento que necesitas</h1>
        <p class="lead text-muted mb-4">
          Explora currículums de profesionales y conecta con el candidato ideal para tu empresa.
        </p>
        <div class="row justify-content-center">
          <div class="col-md-6">
            <div class="input-group input-group-lg shadow-sm">
              <input type="text" class="form-control" placeholder="Buscar por nombre, cargo o tecnología...">
              <button class="btn btn-primary px-4" type="button">
                <i class="bi bi-search me-1"></i>Buscar
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-5">
      <div class="container text-center">
        <h2 class="h4 fw-semibold mb-2">¿Eres un profesional?</h2>
        <p class="text-muted mb-4">Crea tu CV online y compártelo con reclutadores de todo el mundo.</p>
        <a routerLink="/auth/register" class="btn btn-outline-primary btn-lg">
          Crear mi CV gratis
        </a>
      </div>
    </section>
  `,
  styles: []
})
export class HomeComponent { }

