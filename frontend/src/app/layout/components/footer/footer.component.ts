import { Component } from '@angular/core';

@Component({
  selector: 'app-footer-public',
  standalone: false,
  template: `
    <footer class="bg-dark text-white py-4 mt-auto">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-md-6">
            <span class="fw-bold">PortalCV</span>
            <span class="text-muted ms-2">&copy; 2026. Todos los derechos reservados.</span>
          </div>
          <div class="col-md-6 text-md-end mt-2 mt-md-0">
            <a href="#" class="text-white-50 text-decoration-none me-3">Privacidad</a>
            <a href="#" class="text-white-50 text-decoration-none me-3">Términos</a>
            <a href="#" class="text-white-50 text-decoration-none">Contacto</a>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class FooterPublicComponent { }
