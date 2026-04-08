import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: false,
  template: `
    <!-- HERO -->
    <section class="hero-section">
      <div class="container">
        <h1 class="hero-title">Encuentra el talento que necesitas</h1>
        <p class="hero-subtitle">
          Explora currículums de profesionales y conecta con el candidato ideal para tu empresa.
        </p>
        <div class="hero-search">
          <div class="input-group shadow-sm">
            <input type="text" class="form-control form-control-lg"
              placeholder="Buscar por nombre, cargo o tecnología..."
              [(ngModel)]="busqueda" (keyup.enter)="buscar()">
            <button class="btn btn-primary px-4" type="button" (click)="buscar()">
              <i class="bi bi-search me-1"></i>Buscar
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <div class="container text-center">
        <h2>¿Eres un profesional?</h2>
        <p class="text-muted">Crea tu CV online y compártelo con reclutadores de todo el mundo.</p>
        <a routerLink="/auth/register" class="btn btn-primary btn-lg">
          <i class="bi bi-person-plus-fill me-2"></i>Crear mi CV gratis
        </a>
      </div>
    </section>
  `,
  styles: [`
    .hero-section {
      background: #F8F9FA;
      padding: 96px 0 80px;
      text-align: center;
    }
    .hero-title {
      font-size: 2.6rem;
      font-weight: 700;
      color: #2C7BE5;
      margin-bottom: 16px;
    }
    .hero-subtitle {
      font-size: 1.1rem;
      color: #6C757D;
      max-width: 560px;
      margin: 0 auto 36px;
    }
    .hero-search {
      max-width: 520px;
      margin: 0 auto;
    }
    .cta-section {
      background: #fff;
      padding: 80px 0;
    }
    .cta-section h2 {
      font-size: 1.9rem;
      font-weight: 700;
      color: #212529;
      margin-bottom: 12px;
    }
  `]
})
export class HomeComponent {
  busqueda = '';

  constructor(private router: Router) {}

  buscar(): void {
    if (this.busqueda.trim()) {
      this.router.navigate(['/cvs'], { queryParams: { q: this.busqueda } });
    } else {
      this.router.navigate(['/cvs']);
    }
  }
}
