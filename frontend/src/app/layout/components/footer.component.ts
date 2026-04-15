import { Component } from '@angular/core';

@Component({
  selector: 'app-footer-public',
  standalone: false,
  template: `
    <footer class="bg-dark text-white py-4 mt-auto">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-12">
            <span class="text-white">&copy; 2026. Todos los derechos reservados.</span>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class FooterPublicComponent { }
