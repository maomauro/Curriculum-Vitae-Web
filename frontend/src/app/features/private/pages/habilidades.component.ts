import { Component, OnInit } from '@angular/core';
import { CvEditorService, HabilidadDto, UpsertHabilidadRequest } from '../../../core/services/private/cv-editor.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';

interface HabilidadUI extends HabilidadDto {
  editando: boolean;
}

@Component({
  selector: 'app-habilidades',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-stars me-2 text-primary"></i>Habilidades e Idiomas</h4>
        <span class="text-muted small">Competencias técnicas, blandas y conocimiento de idiomas</span>
      </div>
      <button class="btn btn-primary btn-sm" (click)="agregarHabilidad('Tecnica')">
        <i class="bi bi-plus-circle me-1"></i>Agregar habilidad
      </button>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <ng-container *ngIf="!loading">

    <!-- Habilidades técnicas -->
    <div class="seccion-card">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div class="seccion-titulo mb-0">Habilidades técnicas</div>
        <button class="btn btn-outline-primary btn-sm" (click)="agregarHabilidad('Tecnica')">
          <i class="bi bi-plus-circle me-1"></i>Agregar
        </button>
      </div>
      <div *ngIf="tecnicas.length === 0" class="text-muted small">Sin habilidades técnicas registradas.</div>
      <div class="row g-3">
        <div class="col-md-6 col-lg-4" *ngFor="let skill of tecnicas">
          <div class="d-flex flex-column gap-1 p-3 rounded-3"
               style="background:#f8faff;border:1px solid #e4effd;">
            <div class="d-flex align-items-center justify-content-between">
              <ng-container *ngIf="!skill.editando">
                <span class="fw-semibold" style="font-size:.9rem;">{{ skill.nombre }}</span>
                <span class="nivel-pill" [ngClass]="nivelClass(skill.nivel)">{{ skill.nivel }}</span>
              </ng-container>
              <input *ngIf="skill.editando" type="text" class="form-control form-control-sm"
                     [(ngModel)]="skill.nombre" style="max-width:140px;">
            </div>
            <select *ngIf="skill.editando" class="form-select form-select-sm mt-1" [(ngModel)]="skill.nivel">
              <option *ngFor="let n of niveles">{{ n }}</option>
            </select>
            <div class="d-flex gap-1 mt-1 justify-content-end">
              <button *ngIf="!skill.editando" class="btn btn-outline-secondary btn-sm py-0 px-2"
                      (click)="skill.editando=true"><i class="bi bi-pencil"></i></button>
              <button *ngIf="!skill.editando" class="btn btn-outline-danger btn-sm py-0 px-2"
                      (click)="eliminar(skill)"><i class="bi bi-trash"></i></button>
              <button *ngIf="skill.editando" class="btn btn-outline-secondary btn-sm py-0 px-2"
                      (click)="skill.editando=false">Cancelar</button>
              <button *ngIf="skill.editando" class="btn btn-primary btn-sm py-0 px-2"
                      (click)="guardar(skill)" [disabled]="guardando">
                <i class="bi bi-floppy-fill"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Habilidades blandas -->
    <div class="seccion-card">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div class="seccion-titulo mb-0">Habilidades blandas</div>
        <button class="btn btn-outline-primary btn-sm rounded-pill px-3"
                (click)="agregarHabilidad('Blanda')">
          <i class="bi bi-plus"></i> Agregar
        </button>
      </div>
      <div *ngIf="blandas.length === 0" class="text-muted small">Sin habilidades blandas registradas.</div>
      <div class="d-flex flex-wrap gap-2">
        <ng-container *ngFor="let skill of blandas">
          <span *ngIf="!skill.editando"
                class="badge rounded-pill px-3 py-2"
                style="background:#ebf3fb;color:#2c7be5;font-size:.8rem;font-weight:500;cursor:pointer;"
                (click)="skill.editando=true">
            {{ skill.nombre }}
            <i class="bi bi-x ms-1" (click)="$event.stopPropagation(); eliminar(skill)"></i>
          </span>
          <div *ngIf="skill.editando" class="d-flex gap-1 align-items-center">
            <input type="text" class="form-control form-control-sm" [(ngModel)]="skill.nombre"
                   style="max-width:140px;">
            <button class="btn btn-outline-secondary btn-sm py-0 px-2"
                    (click)="skill.editando=false">✕</button>
            <button class="btn btn-primary btn-sm py-0 px-2"
                    (click)="guardar(skill)" [disabled]="guardando">✓</button>
          </div>
        </ng-container>
      </div>
    </div>

    <!-- Idiomas -->
    <div class="seccion-card">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div class="seccion-titulo mb-0">Idiomas</div>
        <button class="btn btn-outline-primary btn-sm" (click)="agregarHabilidad('Idioma')">
          <i class="bi bi-plus-circle me-1"></i>Agregar idioma
        </button>
      </div>
      <div *ngIf="idiomas.length === 0" class="text-muted small">Sin idiomas registrados.</div>
      <div class="row g-3">
        <div class="col-md-4" *ngFor="let idioma of idiomas">
          <div class="p-3 rounded-3" style="background:#f8faff;border:1px solid #e4effd;">
            <ng-container *ngIf="!idioma.editando">
              <div class="d-flex align-items-center gap-2 mb-1">
                <i class="bi bi-translate text-primary"></i>
                <span class="fw-bold">{{ idioma.nombre }}</span>
              </div>
              <small class="text-muted d-block">Lectura: {{ idioma.nivelLectura }}</small>
              <small class="text-muted d-block">Escritura: {{ idioma.nivelEscritura }}</small>
              <small class="text-muted d-block">Habla: {{ idioma.nivelHabla }}</small>
              <div class="d-flex gap-1 mt-2">
                <button class="btn btn-outline-secondary btn-sm py-0 px-2"
                        (click)="idioma.editando=true"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-outline-danger btn-sm py-0 px-2"
                        (click)="eliminar(idioma)"><i class="bi bi-trash"></i></button>
              </div>
            </ng-container>
            <ng-container *ngIf="idioma.editando">
              <input type="text" class="form-control form-control-sm mb-2"
                     placeholder="Idioma" [(ngModel)]="idioma.nombre">
              <select class="form-select form-select-sm mb-1" [(ngModel)]="idioma.nivelLectura">
                <option value="">Lectura —</option>
                <option *ngFor="let n of nivelesIdioma">{{ n }}</option>
              </select>
              <select class="form-select form-select-sm mb-1" [(ngModel)]="idioma.nivelEscritura">
                <option value="">Escritura —</option>
                <option *ngFor="let n of nivelesIdioma">{{ n }}</option>
              </select>
              <select class="form-select form-select-sm mb-1" [(ngModel)]="idioma.nivelHabla">
                <option value="">Habla —</option>
                <option *ngFor="let n of nivelesIdioma">{{ n }}</option>
              </select>
              <div class="d-flex gap-1 mt-2">
                <button class="btn btn-outline-secondary btn-sm"
                        (click)="idioma.editando=false">Cancelar</button>
                <button class="btn btn-primary btn-sm" (click)="guardar(idioma)" [disabled]="guardando">
                  <i class="bi bi-floppy-fill"></i>
                </button>
              </div>
            </ng-container>
          </div>
        </div>
      </div>
    </div>

    </ng-container>
  `,
  styles: [`
    .nivel-pill {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: .72rem;
      font-weight: 600;
    }
    .nivel-pill.basico    { background:#fef9c3;color:#92400e; }
    .nivel-pill.intermedio{ background:#dbeafe;color:#1e40af; }
    .nivel-pill.avanzado  { background:#d1fae5;color:#065f46; }
    .nivel-pill.experto   { background:#ede9fe;color:#5b21b6; }
  `]
})
export class HabilidadesComponent implements OnInit {
  habilidades: HabilidadUI[] = [];
  loading = false;
  guardando = false;

  niveles = ['Básico', 'Intermedio', 'Avanzado', 'Experto'];
  nivelesIdioma = ['Básico A1', 'Básico A2', 'Intermedio B1', 'Intermedio B2', 'Avanzado C1', 'Avanzado C2', 'Nativo'];

  get tecnicas(): HabilidadUI[] { return this.habilidades.filter(h => h.tipo !== 'Blanda' && h.tipo !== 'Idioma'); }
  get blandas():  HabilidadUI[] { return this.habilidades.filter(h => h.tipo === 'Blanda');  }
  get idiomas():  HabilidadUI[] { return this.habilidades.filter(h => h.tipo === 'Idioma');  }

  constructor(
    private cvEditorService: CvEditorService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.cvEditorService.getHabilidades().subscribe({
      next: data => {
        this.habilidades = data.map(h => ({ ...h, editando: false }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      }
    });
  }

  agregarHabilidad(tipo: string): void {
    const nueva: HabilidadUI = {
      habilidadId: 0, nombre: '', tipo,
      nivel: tipo === 'Idioma' ? null : 'Básico',
      descripcion: null,
      nivelLectura: null, nivelEscritura: null, nivelEscucha: null, nivelHabla: null,
      editando: true
    };
    this.habilidades.push(nueva);
  }

  guardar(skill: HabilidadUI): void {
    if (!skill.nombre.trim()) return;
    this.guardando = true;
    const form: UpsertHabilidadRequest = {
      nombre: skill.nombre, tipo: skill.tipo, nivel: skill.nivel,
      descripcion: skill.descripcion, nivelLectura: skill.nivelLectura,
      nivelEscritura: skill.nivelEscritura, nivelEscucha: skill.nivelEscucha,
      nivelHabla: skill.nivelHabla
    };
    if (skill.habilidadId === 0) {
      this.cvEditorService.createHabilidad(form).subscribe({
        next: creada => {
          Object.assign(skill, creada, { editando: false });
          this.guardando = false;
          this.notificationService.success(NOTIFICATION_MESSAGES.createSuccess);
        },
        error: () => {
          this.guardando = false;
          this.notificationService.error(NOTIFICATION_MESSAGES.saveError);
        }
      });
    } else {
      this.cvEditorService.updateHabilidad(skill.habilidadId, form).subscribe({
        next: actualizada => {
          Object.assign(skill, actualizada, { editando: false });
          this.guardando = false;
          this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
        },
        error: () => {
          this.guardando = false;
          this.notificationService.error(NOTIFICATION_MESSAGES.saveError);
        }
      });
    }
  }

  eliminar(skill: HabilidadUI): void {
    if (skill.habilidadId === 0) { this.habilidades = this.habilidades.filter(h => h !== skill); return; }
    if (!confirm('¿Eliminar esta habilidad?')) return;
    this.cvEditorService.deleteHabilidad(skill.habilidadId).subscribe({
      next: () => {
        this.habilidades = this.habilidades.filter(h => h !== skill);
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.deleteError)
    });
  }

  nivelClass(nivel: string | null): string {
    const map: Record<string, string> = {
      'Básico': 'basico', 'Intermedio': 'intermedio', 'Avanzado': 'avanzado', 'Experto': 'experto'
    };
    return nivel ? (map[nivel] ?? 'basico') : 'basico';
  }
}
