import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, UserInfo } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: false,
  template: `
    <header class="header">
      <div class="container">
        <div class="header-left">
          <h1 class="logo">PortalCV</h1>
        </div>
        <nav class="header-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            Home
          </a>
          <a routerLink="/editor" routerLinkActive="active">
            Editor
          </a>
          <a routerLink="/dashboard" routerLinkActive="active">
            Dashboard
          </a>
        </nav>
        <div class="header-right">
          <span class="user-info" *ngIf="currentUser">
            {{ currentUser.nombre }}
          </span>
          <button class="logout-btn" (click)="logout()" *ngIf="isAuthenticated">
            Logout
          </button>
          <a *ngIf="!isAuthenticated" routerLink="/auth" class="login-link">
            Login
          </a>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background-color: #2c3e50;
      color: white;
      padding: 1rem 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      margin: 0;
      font-size: 1.5rem;
      font-weight: bold;
    }
    .header-nav {
      display: flex;
      gap: 1.5rem;
    }
    .header-nav a {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background-color 0.3s;
    }
    .header-nav a:hover,
    .header-nav a.active {
      background-color: #34495e;
    }
    .header-right {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    .user-info {
      font-size: 0.9rem;
    }
    .logout-btn {
      background-color: #e74c3c;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .logout-btn:hover {
      background-color: #c0392b;
    }
    .login-link {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      background-color: #27ae60;
      border-radius: 4px;
      transition: background-color 0.3s;
    }
    .login-link:hover {
      background-color: #229954;
    }
  `]
})
export class HeaderComponent implements OnInit {
  isAuthenticated = false;
  currentUser: UserInfo | null = null;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
