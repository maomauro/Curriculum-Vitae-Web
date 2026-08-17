import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertasConteoRefreshService } from '../../../core/services/private/alertas-conteo-refresh.service';
import { DashboardService, ContactoDto } from '../../../core/services/private/dashboard.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';

@Component({
  selector: 'app-contactos',
  standalone: false,
  templateUrl: './contactos.component.html',
})
export class ContactosComponent implements OnInit {
  contactos: ContactoDto[] = [];
  loading = false;
  filtro: 'todos' | 'noLeidos' = 'todos';

  get noLeidosCount(): number {
    return this.contactos.filter(c => !c.esLeido).length;
  }

  get contactosFiltrados(): ContactoDto[] {
    return this.filtro === 'noLeidos'
      ? this.contactos.filter(c => !c.esLeido)
      : this.contactos;
  }

  constructor(
    private dashboardService: DashboardService,
    private notificationService: NotificationService,
    private alertasConteoRefresh: AlertasConteoRefreshService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.dashboardService.getContactos().subscribe({
      next: data => { this.contactos = data; this.loading = false; },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      }
    });
  }

  marcarLeido(c: ContactoDto): void {
    this.dashboardService.marcarContactoLeido(c.visitanteContactoId).subscribe({
      next: () => {
        c.esLeido = true;
        this.alertasConteoRefresh.requestRefresh();
      },
      error: (error: HttpErrorResponse) =>
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError)
    });
  }

  inicial(nombre: string | null): string {
    return nombre ? nombre.trim()[0].toUpperCase() : '?';
  }

  motivoLabel(motivo: string | null): string {
    const map: Record<string, string> = {
      'oferta_laboral': 'Oferta laboral',
      'freelance':      'Proyecto freelance',
      'consulta':       'Consulta',
      'otro':           'Otro',
    };
    return map[motivo ?? ''] ?? (motivo ?? '');
  }
}
