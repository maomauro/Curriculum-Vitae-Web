import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AlertasConteoRefreshService } from '../../../core/services/private/alertas-conteo-refresh.service';
import { AlertasService, AlertaVisitaDto } from '../../../core/services/private/alertas.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';

@Component({
  selector: 'app-alertas',
  standalone: false,
  templateUrl: './alertas.component.html',
})
export class AlertasComponent implements OnInit {
  alertas: AlertaVisitaDto[] = [];
  alertasFiltradas: AlertaVisitaDto[] = [];
  loading = false;
  filtro = 'todas';
  tipo = '';
  periodo = 'mes';
  page = 1;
  readonly pageSize = 10;
  total = 0;
  totalPages = 1;

  get noLeidasCount(): number {
    return this.alertas.filter(a => !a.esLeida).length;
  }
  get leidasCount(): number {
    return this.alertas.filter(a => a.esLeida).length;
  }
  get noLeidas(): AlertaVisitaDto[] {
    return this.alertasFiltradas.filter(a => !a.esLeida);
  }
  get leidas(): AlertaVisitaDto[] {
    return this.alertasFiltradas.filter(a => a.esLeida);
  }
  get pages(): number[] {
    const size = 5;
    const start = Math.max(1, this.page - Math.floor(size / 2));
    const end = Math.min(this.totalPages, start + size - 1);
    const adjustedStart = Math.max(1, end - size + 1);
    return Array.from({ length: end - adjustedStart + 1 }, (_, i) => adjustedStart + i);
  }
  get conteoContactos(): number {
    return this.alertas.filter(a => a.tipoVisita === 'Contacto').length;
  }
  get conteoVistas(): number {
    return this.alertas.filter(a => a.tipoVisita === 'Vista').length;
  }
  get conteoDescargas(): number {
    return this.alertas.filter(a => a.tipoVisita === 'Descarga').length;
  }

  constructor(
    private alertasService: AlertasService,
    private notificationService: NotificationService,
    private router: Router,
    private alertasConteoRefresh: AlertasConteoRefreshService
  ) {}

  ngOnInit(): void {
    this.cargarAlertas();
  }

  cargarAlertas(): void {
    this.loading = true;
    this.alertasService
      .getAlertas(this.filtro === 'noleidas', this.tipo, this.periodo, this.page, this.pageSize)
      .subscribe({
      next: data => {
        this.alertas = data.items;
        this.total = data.total;
        this.totalPages = data.totalPages;
        this.alertasFiltradas = [...this.alertas];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      }
    });
  }

  setFiltro(valor: string): void {
    this.filtro = valor;
    this.page = 1;
    this.cargarAlertas();
  }

  aplicarFiltros(): void {
    this.page = 1;
    this.cargarAlertas();
  }

  marcarLeida(alerta: AlertaVisitaDto): void {
    if (alerta.esLeida) return;
    this.alertasService.marcarLeida(alerta.alertaVisitaId).subscribe({
      next: () => {
        alerta.esLeida = true;
        this.alertasFiltradas = [...this.alertas];
        this.alertasConteoRefresh.requestRefresh();
      },
      error: (error: HttpErrorResponse) =>
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError)
    });
  }

  marcarTodasLeidas(): void {
    this.alertasService.marcarTodasLeidas().subscribe({
      next: () => {
        this.alertas.forEach(a => (a.esLeida = true));
        this.cargarAlertas();
        this.alertasConteoRefresh.requestRefresh();
        this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
      },
      error: (error: HttpErrorResponse) =>
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError)
    });
  }

  limpiarLeidas(): void {
    const mensaje =
      'Se eliminarán de forma permanente todas las alertas que ya marcaste como leídas. ' +
      'Las alertas sin leer no se borran. Los mensajes en «Contactos recibidos» siguen guardados. ' +
      '¿Deseas continuar?';
    if (!window.confirm(mensaje)) {
      return;
    }
    this.alertasService.limpiarLeidas().subscribe({
      next: (r) => {
        this.cargarAlertas();
        this.alertasConteoRefresh.requestRefresh();
        this.notificationService.success(r.eliminadas > 0 ? 'Alertas leídas eliminadas.' : 'No había alertas leídas.');
      },
      error: (error: HttpErrorResponse) =>
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError)
    });
  }

  irPagina(p: number): void {
    if (p < 1 || p > this.totalPages || p === this.page) return;
    this.page = p;
    this.cargarAlertas();
  }

  irAContactos(ev: Event): void {
    ev.stopPropagation();
    void this.router.navigate(['/contactos']);
  }

  tipoClass(tipo: string | null): string {
    const map: Record<string, string> = {
      'Contacto': 'contact', 'Vista': 'view',
      'Descarga': 'download', 'Sistema': 'system'
    };
    return tipo ? (map[tipo] ?? 'system') : 'system';
  }

  tipoIcono(tipo: string | null): string {
    const map: Record<string, string> = {
      'Contacto': 'bi-envelope-fill', 'Vista': 'bi-eye-fill',
      'Descarga': 'bi-file-earmark-arrow-down-fill', 'Sistema': 'bi-gear-fill'
    };
    return tipo ? (map[tipo] ?? 'bi-bell-fill') : 'bi-bell-fill';
  }
}
