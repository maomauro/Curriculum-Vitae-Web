import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DashboardService, ContactoDto } from '../../../core/services/private/dashboard.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';

@Component({
  selector: 'app-contactos',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-envelope-fill me-2 text-primary"></i>Contactos recibidos</h4>
        <span class="text-muted small">Mensajes de reclutadores y profesionales interesados en tu perfil</span>
      </div>
    </div>

    <!-- Filtro no-leídos -->
    <div class="d-flex align-items-center gap-3 mb-3" *ngIf="!loading">
      <button class="btn btn-sm"
              [class.btn-primary]="filtro === 'todos'"
              [class.btn-outline-secondary]="filtro !== 'todos'"
              (click)="filtro = 'todos'">
        Todos <span class="badge bg-secondary ms-1">{{ contactos.length }}</span>
      </button>
      <button class="btn btn-sm"
              [class.btn-warning]="filtro === 'noLeidos'"
              [class.btn-outline-secondary]="filtro !== 'noLeidos'"
              (click)="filtro = 'noLeidos'">
        Sin leer <span class="badge bg-warning text-dark ms-1">{{ noLeidosCount }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Sin contactos -->
    <div *ngIf="!loading && contactosFiltrados.length === 0" class="text-center py-5 text-muted">
      <i class="bi bi-envelope-open display-5"></i>
      <p class="mt-3">
        {{ filtro === 'noLeidos' ? 'No tienes mensajes sin leer.' : 'Aún no has recibido mensajes de contacto.' }}
      </p>
    </div>

    <!-- Lista de contactos -->
    <div *ngFor="let c of contactosFiltrados"
         class="bg-white rounded-3 shadow-sm mb-3 overflow-hidden"
         [style.border-left]="c.esLeido ? '4px solid #e9ecef' : '4px solid #2c7be5'">

      <div class="p-4">
        <!-- Fila superior: avatar + nombre + fecha + badge -->
        <div class="d-flex align-items-start gap-3">
          <!-- Avatar inicial -->
          <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold"
               style="width:44px;height:44px;background:#ebf2ff;color:#2c7be5;font-size:1rem;">
            {{ inicial(c.nombre) }}
          </div>

          <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
              <div>
                <span class="fw-bold" style="font-size:.95rem;">{{ c.nombre || 'Anónimo' }}</span>
                <span *ngIf="c.empresa" class="text-muted ms-2" style="font-size:.85rem;">
                  · {{ c.empresa }}
                </span>
              </div>
              <div class="d-flex align-items-center gap-2">
                <span class="text-muted" style="font-size:.78rem;">
                  <i class="bi bi-clock me-1"></i>{{ c.fechaContacto | date:'dd/MM/yyyy HH:mm' }}
                </span>
                <span *ngIf="!c.esLeido"
                      class="badge rounded-pill bg-primary"
                      style="font-size:.68rem;">Nuevo</span>
              </div>
            </div>

            <!-- Email + motivo -->
            <div class="mt-1" style="font-size:.82rem;color:#6c757d;">
              <i class="bi bi-envelope me-1"></i>{{ c.correo }}
              <ng-container *ngIf="c.motivoContacto">
                <span class="mx-2">·</span>
                <i class="bi bi-tag me-1"></i>{{ motivoLabel(c.motivoContacto) }}
              </ng-container>
            </div>

            <!-- Asunto -->
            <div *ngIf="c.asunto" class="mt-2 fw-semibold" style="font-size:.88rem;">
              {{ c.asunto }}
            </div>

            <!-- Mensaje -->
            <div *ngIf="c.mensaje" class="mt-1" style="font-size:.85rem;color:#495057;line-height:1.5;">
              {{ c.mensaje }}
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div class="d-flex justify-content-end gap-2 mt-3">
          <a [href]="'mailto:' + c.correo" class="btn btn-sm btn-outline-primary">
            <i class="bi bi-reply me-1"></i>Responder
          </a>
          <button *ngIf="!c.esLeido" class="btn btn-sm btn-outline-secondary"
                  (click)="marcarLeido(c)">
            <i class="bi bi-check2 me-1"></i>Marcar como leído
          </button>
        </div>
      </div>
    </div>
  `,
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
    private notificationService: NotificationService
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
      next: () => { c.esLeido = true; },
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
