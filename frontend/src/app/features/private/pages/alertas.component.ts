import { Component, OnInit } from '@angular/core';
import { AlertasService, AlertaVisitaDto } from '../../../core/services/alertas.service';

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
          <div class="fw-bold fs-4" style="color:#2c7be5;">{{ conteoContactos }}</div>
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
      <select class="form-select form-select-sm" style="width:auto;" [(ngModel)]="tipo" (change)="aplicarFiltros()">
        <option value="">Tipo: Todos</option>
        <option value="Contacto">Contactos recibidos</option>
        <option value="Vista">Vistas del CV</option>
        <option value="Descarga">Descargas</option>
        <option value="Sistema">Sistema</option>
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

      <div *ngFor="let alerta of alertasFiltradas"
           class="alert-item" [class.unread]="!alerta.esLeida"
           [ngClass]="'type-' + tipoClass(alerta.tipoVisita)"
           style="cursor:pointer;" (click)="marcarLeida(alerta)">
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
          </div>
        </div>
        <div *ngIf="!alerta.esLeida" class="unread-dot"></div>
      </div>
    </ng-container>
  `
})
export class AlertasComponent implements OnInit {
  alertas: AlertaVisitaDto[] = [];
  alertasFiltradas: AlertaVisitaDto[] = [];
  loading = false;
  filtro = 'todas';
  tipo = '';

  get noLeidasCount(): number {
    return this.alertas.filter(a => !a.esLeida).length;
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

  constructor(private alertasService: AlertasService) {}

  ngOnInit(): void {
    this.cargarAlertas();
  }

  cargarAlertas(): void {
    this.loading = true;
    this.alertasService.getAlertas().subscribe({
      next: data => {
        this.alertas = data;
        this.aplicarFiltros();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  setFiltro(valor: string): void {
    this.filtro = valor;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.alertasFiltradas = this.alertas.filter(a => {
      const pasaFiltro = this.filtro === 'todas' || (this.filtro === 'noleidas' && !a.esLeida);
      const pasaTipo   = !this.tipo || a.tipoVisita === this.tipo;
      return pasaFiltro && pasaTipo;
    });
  }

  marcarLeida(alerta: AlertaVisitaDto): void {
    if (alerta.esLeida) return;
    this.alertasService.marcarLeida(alerta.alertaVisitaId).subscribe({
      next: () => { alerta.esLeida = true; this.aplicarFiltros(); }
    });
  }

  marcarTodasLeidas(): void {
    this.alertasService.marcarTodasLeidas().subscribe({
      next: () => {
        this.alertas.forEach(a => (a.esLeida = true));
        this.aplicarFiltros();
      }
    });
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
