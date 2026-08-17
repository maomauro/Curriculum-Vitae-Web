import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { CV_ROL } from '../../core/constants/cv-roles';
import { AuthService, UserInfo } from '../../core/services/auth/auth.service';
import { AlertasConteoRefreshService } from '../../core/services/private/alertas-conteo-refresh.service';
import { DashboardService } from '../../core/services/private/dashboard.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  host: {
    class: 'app-sidebar cv-sidebar shadow-sm',
    'data-bs-theme': 'dark',
    id: 'cvSidebar',
  },
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit {
  currentUser: UserInfo | null = null;
  /** Misma métrica que la campana del topbar: alertas de CV sin leer. */
  conteoAlertasNoLeidas = 0;

  private readonly destroyRef = inject(DestroyRef);

  get mostrarMenuPublicador(): boolean {
    return this.authService.hasRol(CV_ROL.publicador);
  }

  get mostrarMenuAdmin(): boolean {
    return this.authService.hasRol(CV_ROL.admin);
  }

  /** Inicio del logo: CV si es publicador; panel admin si solo administrador. */
  get marcaInicio(): string {
    return this.mostrarMenuPublicador ? '/dashboard' : '/admin/usuarios';
  }

  get initials(): string {
    if (!this.currentUser?.nombre) return 'U';
    return this.currentUser.nombre
      .split(' ')
      .slice(0, 2)
      .map(p => p[0])
      .join('')
      .toUpperCase();
  }

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router,
    private alertasConteoRefresh: AlertasConteoRefreshService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user && this.authService.hasRol(CV_ROL.publicador)) {
        this.refrescarConteoAlertas();
      } else {
        this.conteoAlertasNoLeidas = 0;
      }
    });

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        if (this.currentUser && this.authService.hasRol(CV_ROL.publicador)) {
          this.refrescarConteoAlertas();
        }
      });

    this.alertasConteoRefresh.refreshRequested$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.currentUser && this.authService.hasRol(CV_ROL.publicador)) {
          this.refrescarConteoAlertas();
        }
      });
  }

  private refrescarConteoAlertas(): void {
    this.dashboardService.getNotificaciones(1).subscribe({
      next: d => {
        this.conteoAlertasNoLeidas = d.conteoNoLeidas;
      },
    });
  }
}
