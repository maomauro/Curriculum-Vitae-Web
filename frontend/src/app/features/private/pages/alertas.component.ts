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
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-bell-fill me-2 text-primary"></i>Alertas privadas</h4>
        <span class="text-muted small">Notificaciones de actividad en tu CV — Solo tú puedes verlas</span>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm"
                (click)="marcarTodasLeidas()" [disabled]="noLeidasCount === 0">
          <i class="bi bi-check2-all me-1"></i>Marcar todas como leídas
        </button>
        <button class="btn btn-outline-danger btn-sm"
                (click)="limpiarLeidas()"
                [disabled]="leidasCount === 0">
          <i class="bi bi-trash3 me-1"></i>Limpiar leídas
        </button>
      </div>
    </div>

    <!-- Resumen -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-md-3">
        <div class="bg-white rounded-3 p-3 shadow-sm text-center">
          <div class="fw-bold fs-4 text-primary">{{ noLeidasCount }}</div>
          <div class="text-muted small">No leídas</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="bg-white rounded-3 p-3 shadow-sm text-center">
          <div class="fw-bold fs-4 text-primary">{{ conteoContactos }}</div>
          <div class="text-muted small">Contactos nuevos</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="bg-white rounded-3 p-3 shadow-sm text-center">
          <div class="fw-bold fs-4 text-success">{{ conteoVistas }}</div>
          <div class="text-muted small">Vistas recientes</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="bg-white rounded-3 p-3 shadow-sm text-center">
          <div class="fw-bold fs-4 text-warning">{{ conteoDescargas }}</div>
          <div class="text-muted small">Descargas</div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-3 p-3 shadow-sm mb-4 d-flex flex-wrap gap-2 align-items-center">
      <span class="fw-semibold small text-muted">Filtrar por:</span>
      <div class="btn-group btn-group-sm">
        <button class="btn" [class.btn-primary]="filtro==='todas'"
                [class.btn-outline-secondary]="filtro!=='todas'" (click)="setFiltro('todas')">
          Todas ({{ alertas.length }})
        </button>
        <button class="btn" [class.btn-primary]="filtro==='noleidas'"
                [class.btn-outline-secondary]="filtro!=='noleidas'" (click)="setFiltro('noleidas')">
          No leídas ({{ noLeidasCount }})
        </button>
      </div>
      <select class="form-select form-select-sm admin-filter-select" [(ngModel)]="tipo" (change)="aplicarFiltros()">
        <option value="">Tipo: Todos</option>
        <option value="Contacto">Contactos recibidos</option>
        <option value="Vista">Vistas del CV</option>
        <option value="Descarga">Descargas</option>
        <option value="Sistema">Sistema</option>
      </select>
      <select class="form-select form-select-sm admin-filter-select" [(ngModel)]="periodo" (change)="aplicarFiltros()">
        <option value="mes">Período: Este mes</option>
        <option value="semana">Última semana</option>
        <option value="tresmeses">Últimos 3 meses</option>
        <option value="todo">Todo</option>
      </select>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Lista de alertas -->
    <ng-container *ngIf="!loading">
      <div *ngIf="alertasFiltradas.length === 0" class="text-center py-5 text-muted">
        <i class="bi bi-bell-slash display-5"></i>
        <p class="mt-3">No hay alertas que mostrar.</p>
      </div>

      <div *ngFor="let alerta of noLeidas"
           class="alert-item cv-cursor-pointer" [class.unread]="!alerta.esLeida"
           [ngClass]="'type-' + tipoClass(alerta.tipoVisita)"
           (click)="marcarLeida(alerta)">
        <div class="alert-icon" [ngClass]="tipoClass(alerta.tipoVisita)">
          <i class="bi" [ngClass]="tipoIcono(alerta.tipoVisita)"></i>
        </div>
        <div class="alert-body">
          <div class="alert-title">{{ alerta.titulo }}</div>
          <div class="alert-desc">{{ alerta.descripcion }}</div>
          <div class="alert-meta">
            <span><i class="bi bi-clock me-1"></i>{{ alerta.fechaVisita | date:'short' }}</span>
            <span *ngIf="alerta.ciudad || alerta.pais">
              <i class="bi bi-geo-alt me-1"></i>{{ alerta.ciudad }}<ng-container *ngIf="alerta.ciudad && alerta.pais">, </ng-container>{{ alerta.pais }}
            </span>
            <span *ngIf="alerta.origen">
              <i class="bi bi-globe me-1"></i>{{ alerta.origen }}
            </span>
            <a *ngIf="alerta.tipoVisita === 'Contacto'"
               class="text-primary fw-semibold cv-cursor-pointer"
               (click)="irAContactos($event)">
              Ver mensaje completo →
            </a>
          </div>
        </div>
        <div *ngIf="!alerta.esLeida" class="unread-dot"></div>
      </div>

      <div *ngIf="noLeidas.length > 0 && leidas.length > 0" class="d-flex align-items-center gap-3 my-4">
        <hr class="flex-grow-1">
        <span class="text-muted small fw-semibold">Alertas anteriores (leídas)</span>
        <hr class="flex-grow-1">
      </div>

      <div *ngFor="let alerta of leidas"
           class="alert-item cv-cursor-pointer"
           [ngClass]="'type-' + tipoClass(alerta.tipoVisita)">
        <div class="alert-icon" [ngClass]="tipoClass(alerta.tipoVisita)">
          <i class="bi" [ngClass]="tipoIcono(alerta.tipoVisita)"></i>
        </div>
        <div class="alert-body">
          <div class="alert-title">{{ alerta.titulo }}</div>
          <div class="alert-desc">{{ alerta.descripcion }}</div>
          <div class="alert-meta">
            <span><i class="bi bi-clock me-1"></i>{{ alerta.fechaVisita | date:'short' }}</span>
            <span *ngIf="alerta.ciudad || alerta.pais">
              <i class="bi bi-geo-alt me-1"></i>{{ alerta.ciudad }}<ng-container *ngIf="alerta.ciudad && alerta.pais">, </ng-container>{{ alerta.pais }}
            </span>
            <span *ngIf="alerta.origen">
              <i class="bi bi-globe me-1"></i>{{ alerta.origen }}
            </span>
            <a *ngIf="alerta.tipoVisita === 'Contacto'"
               class="text-primary fw-semibold cv-cursor-pointer"
               (click)="irAContactos($event)">
              Ver mensaje completo →
            </a>
          </div>
        </div>
      </div>

      <nav *ngIf="totalPages > 1" class="mt-4 d-flex justify-content-center">
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" [class.disabled]="page === 1">
            <button class="page-link" (click)="irPagina(page - 1)" [disabled]="page === 1">«</button>
          </li>
          <li class="page-item"
              *ngFor="let p of pages"
              [class.active]="p === page">
            <button class="page-link" (click)="irPagina(p)">{{ p }}</button>
          </li>
          <li class="page-item" [class.disabled]="page >= totalPages">
            <button class="page-link" (click)="irPagina(page + 1)" [disabled]="page >= totalPages">»</button>
          </li>
        </ul>
      </nav>
    </ng-container>
  `
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
