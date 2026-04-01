import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: false,
  template: `
    <footer class="footer">
      <div class="container">
        <p>&copy; 2026 PortalCV. All rights reserved.</p>
        <nav class="footer-nav">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </nav>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background-color: #2c3e50;
      color: white;
      padding: 2rem 0;
      text-align: center;
      margin-top: 2rem;
      border-top: 1px solid #34495e;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    p {
      margin: 0;
    }
    .footer-nav {
      display: flex;
      gap: 1rem;
    }
    .footer-nav a {
      color: #bdc3c7;
      text-decoration: none;
      transition: color 0.3s;
    }
    .footer-nav a:hover {
      color: white;
    }
  `]
})
export class FooterComponent { }
