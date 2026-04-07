import { Component } from '@angular/core';

@Component({
  selector: 'app-proyectos',
  standalone: false,
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-kanban-fill me-2 text-primary"></i>Proyectos</h4>
        <span class="text-muted small">Portfolio de proyectos personales y profesionales</span>
      </div>
      <button class="btn btn-primary btn-sm" (click)="agregar()">
        <i class="bi bi-plus-circle me-1"></i>Agregar proyecto
      </button>
    </div>

    <!-- Lista de proyectos -->
    <div *ngFor="let p of proyectos; let i = index">
      <div class="bg-white rounded-3 shadow-sm mb-3 overflow-hidden">
        <!-- Cabecera -->
        <div class="p-4 d-flex align-items-center gap-3" style="cursor:pointer;"
             (click)="p.expanded = !p.expanded">
          <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
               style="width:44px;height:44px;background:#ebf2ff;color:#2c7be5;font-size:1.1rem;">
            <i class="bi bi-kanban-fill"></i>
          </div>
          <div class="flex-grow-1">
            <div class="fw-bold" style="font-size:.95rem;">{{ p.nombre }}</div>
            <div class="d-flex flex-wrap gap-1 mt-1">
              <span *ngFor="let tag of p.stack"
                    style="background:#ebf2ff;color:#2c7be5;font-size:.7rem;font-weight:600;padding:2px 8px;border-radius:10px;">
                {{ tag }}
              </span>
            </div>
          </div>
          <span class="badge" [style.background]="p.destacado ? '#ebf3fb' : '#f1f5f9'"
                [style.color]="p.destacado ? '#2c7be5' : '#6c757d'"
                style="font-size:.7rem;border-radius:12px;padding:3px 10px;">
            {{ p.destacado ? '⭐ Destacado' : 'Normal' }}
          </span>
          <i class="bi ms-2" [class.bi-chevron-down]="!p.expanded"
             [class.bi-chevron-up]="p.expanded" style="color:#adb5bd;"></i>
        </div>

        <!-- Cuerpo expandible -->
        <div *ngIf="p.expanded" class="px-4 pb-4" style="border-top:1px solid #f0f0f0;">
          <div class="row g-3 mt-1">
            <div class="col-md-8">
              <label class="form-label">Nombre del proyecto</label>
              <input type="text" class="form-control" [value]="p.nombre">
            </div>
            <div class="col-md-4 d-flex align-items-end">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" [(ngModel)]="p.destacado"
                       [id]="'dest_'+i">
                <label class="form-check-label" [for]="'dest_'+i">Marcar como destacado</label>
              </div>
            </div>
            <div class="col-12">
              <label class="form-label">Descripción</label>
              <textarea class="form-control" rows="3" [value]="p.descripcion"></textarea>
            </div>
            <div class="col-md-6">
              <label class="form-label">URL del proyecto</label>
              <input type="url" class="form-control" [value]="p.url" placeholder="https://...">
            </div>
            <div class="col-md-6">
              <label class="form-label">Repositorio (GitHub / GitLab)</label>
              <input type="url" class="form-control" [value]="p.repo" placeholder="https://github.com/...">
            </div>
            <div class="col-12">
              <label class="form-label">Stack tecnológico
                <span class="text-muted small">(separar por coma)</span></label>
              <input type="text" class="form-control" [value]="p.stack.join(', ')">
            </div>
            <div class="col-12 d-flex justify-content-end gap-2 pt-2"
                 style="border-top:1px solid #f0f0f0;">
              <button class="btn btn-outline-danger btn-sm">
                <i class="bi bi-trash me-1"></i>Eliminar
              </button>
              <button class="btn btn-primary btn-sm">
                <i class="bi bi-floppy-fill me-1"></i>Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProyectosComponent {
  proyectos = [
    { nombre: 'Portal de Empleo Angular', descripcion: 'Plataforma SPA con Angular y .NET para gestión de ofertas laborales y CVs.', stack: ['Angular', 'TypeScript', '.NET', 'PostgreSQL'], url: 'https://portal.example.com', repo: 'https://github.com/user/portal', destacado: true, expanded: false },
    { nombre: 'API REST de Inventario', descripcion: 'API REST con Node.js y Express para gestión de inventarios en tiempo real.', stack: ['Node.js', 'Express', 'MongoDB'], url: '', repo: 'https://github.com/user/api-inventario', destacado: false, expanded: false },
  ];

  agregar(): void {
    this.proyectos.push({ nombre: '', descripcion: '', stack: [], url: '', repo: '', destacado: false, expanded: true });
  }
}
