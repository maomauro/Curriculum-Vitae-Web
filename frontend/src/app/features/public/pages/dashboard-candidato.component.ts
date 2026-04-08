import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

interface MetricaCard {
  label: string;
  valor: string;
  sub: string;
  icono: string;
  gradiente: string;
}

interface ExpEmpresa {
  empresa: string;
  meses: number;
  porcentaje: number;
}

interface HabilidadTipo {
  tipo: string;
  cantidad: number;
  color: string;
}

@Component({
  selector: 'app-dashboard-candidato',
  standalone: false,
  template: `
    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb" class="mb-3">
      <ol class="breadcrumb small">
        <li class="breadcrumb-item">
          <a routerLink="/cvs" class="text-decoration-none">Buscar CVs</a>
        </li>
        <li class="breadcrumb-item">
          <a [routerLink]="['/cv', cvId]" class="text-decoration-none">{{ nombre }}</a>
        </li>
        <li class="breadcrumb-item active">Dashboard analítico</li>
      </ol>
    </nav>

    <!-- Cabecera candidato + tabs -->
    <div class="bg-white rounded-3 shadow-sm p-4 mb-4">
      <div class="d-flex align-items-center gap-3 mb-3 flex-wrap">
        <div class="avatar-circle blue" style="width:68px;height:68px;font-size:1.45rem;">
          {{ iniciales }}
        </div>
        <div>
          <h4 class="fw-bold mb-0">{{ nombre }}</h4>
          <span class="text-muted">{{ titulo }}
            <i class="bi bi-geo-alt-fill text-primary small ms-1"></i> {{ ciudad }}
          </span>
        </div>
        <div class="ms-auto d-none d-md-flex gap-2">
          <a [routerLink]="['/cv', cvId]" class="btn btn-outline-secondary btn-sm">
            <i class="bi bi-file-earmark-person me-1"></i>Ver CV completo
          </a>
          <button class="btn btn-primary btn-sm">
            <i class="bi bi-envelope-fill me-1"></i>Contactar
          </button>
        </div>
      </div>
      <!-- Tabs -->
      <ul class="nav gap-1 border-0 mb-0">
        <li class="nav-item">
          <a class="nav-link fw-semibold text-muted" style="border-radius:0;"
             [routerLink]="['/cv', cvId]">
            <i class="bi bi-file-earmark-person me-1"></i>Hoja de vida
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link fw-semibold"
             style="color:#2c7be5;border-bottom:2px solid #2c7be5;border-radius:0;margin-bottom:-1px;">
            <i class="bi bi-bar-chart-fill me-1"></i>Dashboard analítico
          </a>
        </li>
      </ul>
    </div>

    <!-- Page header -->
    <div class="bg-white rounded-3 shadow-sm p-4 d-flex align-items-center gap-3 mb-4">
      <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
           style="width:50px;height:50px;background:#eef3fb;color:#2c7be5;font-size:1.55rem;">
        <i class="bi bi-bar-chart-steps"></i>
      </div>
      <div>
        <h5 class="fw-bold mb-0">Dashboard de Hoja de Vida</h5>
        <p class="text-muted mb-0" style="font-size:.9rem;">
          Visualiza y analiza la información personal, profesional y académica.
        </p>
      </div>
    </div>

    <!-- ── 6 métricas ── -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-md-4 col-xl-2" *ngFor="let m of metricas">
        <div class="rounded-3 p-4 text-white h-100"
             [style.background]="m.gradiente"
             style="box-shadow:0 2px 10px rgba(0,0,0,.13);">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div style="font-size:.75rem;opacity:.88;font-weight:600;margin-bottom:6px;line-height:1.3;">
                {{ m.label }}
              </div>
              <div style="font-size:2rem;font-weight:700;line-height:1;margin-bottom:4px;">{{ m.valor }}</div>
              <div style="font-size:.72rem;opacity:.78;line-height:1.35;">{{ m.sub }}</div>
            </div>
            <i class="bi" [ngClass]="m.icono"
               style="font-size:2.6rem;opacity:.20;"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Fila 1: Barras horizontales + Línea de tiempo ── -->
    <div class="row g-3 mb-4">

      <!-- Experiencia por empresa -->
      <div class="col-lg-6">
        <div class="bg-white rounded-3 shadow-sm p-4 h-100">
          <div class="fw-bold" style="font-size:.95rem;">Experiencia laboral por empresa</div>
          <div class="text-muted mb-3" style="font-size:.8rem;">Duración aproximada en meses por empleador.</div>
          <div *ngFor="let e of expEmpresas" class="mb-3">
            <div class="d-flex justify-content-between mb-1">
              <span style="font-size:.85rem;font-weight:600;">{{ e.empresa }}</span>
              <span class="text-muted" style="font-size:.8rem;">{{ e.meses }} meses</span>
            </div>
            <div class="progress" style="height:10px;border-radius:6px;">
              <div class="progress-bar" role="progressbar"
                   [style.width.%]="e.porcentaje"
                   style="background:#2c7be5;border-radius:6px;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Línea de tiempo educación + experiencia -->
      <div class="col-lg-6">
        <div class="bg-white rounded-3 shadow-sm p-4 h-100">
          <div class="fw-bold" style="font-size:.95rem;">Línea de tiempo: Educación y experiencia</div>
          <div class="text-muted mb-3" style="font-size:.8rem;">Eventos académicos y laborales por año.</div>
          <div class="d-flex flex-column gap-2">
            <div *ngFor="let ev of timeline" class="d-flex gap-3 align-items-start">
              <div class="text-muted flex-shrink-0" style="width:40px;font-size:.8rem;font-weight:600;">
                {{ ev.anio }}
              </div>
              <div class="d-flex align-items-center gap-2 flex-grow-1">
                <div class="rounded-circle flex-shrink-0"
                     style="width:8px;height:8px;"
                     [style.background]="ev.tipo === 'edu' ? '#7c3aed' : '#2c7be5'"></div>
                <span style="font-size:.85rem;">{{ ev.descripcion }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ── Fila 2: Habilidades por tipo + Nivel promedio ── -->
    <div class="row g-3 mb-5">

      <!-- Habilidades por tipo (barras) -->
      <div class="col-lg-6">
        <div class="bg-white rounded-3 shadow-sm p-4 h-100">
          <div class="fw-bold" style="font-size:.95rem;">Cantidad de habilidades por tipo</div>
          <div class="text-muted mb-3" style="font-size:.8rem;">Cuántas habilidades tienes en cada categoría.</div>
          <div *ngFor="let h of habilidadesPorTipo" class="mb-3">
            <div class="d-flex justify-content-between mb-1">
              <span style="font-size:.85rem;font-weight:600;">{{ h.tipo }}</span>
              <span class="badge rounded-pill px-2"
                    [style.background]="h.color + '22'"
                    [style.color]="h.color"
                    style="font-size:.75rem;font-weight:600;">{{ h.cantidad }}</span>
            </div>
            <div class="progress" style="height:8px;border-radius:6px;">
              <div class="progress-bar" role="progressbar"
                   [style.width.%]="(h.cantidad / maxHabilidades) * 100"
                   [style.background]="h.color"
                   style="border-radius:6px;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Nivel promedio -->
      <div class="col-lg-6">
        <div class="bg-white rounded-3 shadow-sm p-4 h-100">
          <div class="fw-bold" style="font-size:.95rem;">Nivel promedio de habilidades por tipo</div>
          <div class="text-muted mb-3" style="font-size:.8rem;">Nivel promedio en cada categoría (1 = Básico → 4 = Experto).</div>
          <div *ngFor="let n of nivelPromedio" class="mb-3">
            <div class="d-flex justify-content-between mb-1">
              <span style="font-size:.85rem;font-weight:600;">{{ n.tipo }}</span>
              <span class="text-muted" style="font-size:.8rem;">{{ n.promedio.toFixed(1) }} / 4</span>
            </div>
            <div class="progress" style="height:8px;border-radius:6px;">
              <div class="progress-bar" role="progressbar"
                   [style.width.%]="(n.promedio / 4) * 100"
                   style="background:#22c55e;border-radius:6px;"></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `
})
export class DashboardCandidatoComponent implements OnInit {
  cvId: string = '';
  nombre  = 'Ana García';
  titulo  = 'Frontend Developer';
  ciudad  = 'Madrid, España';
  iniciales = 'AG';

  metricas: MetricaCard[] = [
    { label: 'Experiencia en TI', valor: '12', sub: 'Años en desarrollo y gestión', icono: 'bi-graph-up-arrow', gradiente: 'linear-gradient(135deg,#22c55e,#15803d)' },
    { label: 'Empleos en Desarrollo', valor: '5', sub: 'Total empleos en tecnología', icono: 'bi-buildings', gradiente: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' },
    { label: 'Títulos académicos', valor: '3', sub: 'Total títulos', icono: 'bi-mortarboard-fill', gradiente: 'linear-gradient(135deg,#a855f7,#7c3aed)' },
    { label: 'Habilidades', valor: '18', sub: 'Total habilidades', icono: 'bi-tools', gradiente: 'linear-gradient(135deg,#f97316,#c2410c)' },
    { label: 'Perfiles', valor: '1', sub: 'Total perfiles', icono: 'bi-person-badge-fill', gradiente: 'linear-gradient(135deg,#ec4899,#be185d)' },
    { label: 'Completitud', valor: '85%', sub: 'Completitud del perfil', icono: 'bi-check-square-fill', gradiente: 'linear-gradient(135deg,#06b6d4,#0e7490)' },
  ];

  expEmpresas: ExpEmpresa[] = [
    { empresa: 'Accenture España',  meses: 36, porcentaje: 100 },
    { empresa: 'Indra Sistemas',    meses: 33, porcentaje: 92  },
    { empresa: 'StartupHub Madrid', meses: 20, porcentaje: 56  },
  ];

  timeline = [
    { anio: '2023', tipo: 'edu',  descripcion: 'Certificación AWS Solutions Architect' },
    { anio: '2022', tipo: 'exp',  descripcion: 'Senior Frontend Developer — Accenture' },
    { anio: '2019', tipo: 'exp',  descripcion: 'Frontend Developer — Indra Sistemas' },
    { anio: '2019', tipo: 'edu',  descripcion: 'Máster en Ingeniería del Software — UPM' },
    { anio: '2017', tipo: 'edu',  descripcion: 'Grado en Ingeniería Informática — UCM' },
    { anio: '2017', tipo: 'exp',  descripcion: 'Frontend Developer Junior — StartupHub' },
  ];

  habilidadesPorTipo: HabilidadTipo[] = [
    { tipo: 'Técnicas',  cantidad: 10, color: '#2c7be5' },
    { tipo: 'Blandas',   cantidad: 5,  color: '#22c55e' },
    { tipo: 'Idiomas',   cantidad: 3,  color: '#7c3aed' },
  ];

  nivelPromedio = [
    { tipo: 'Técnicas', promedio: 3.4 },
    { tipo: 'Blandas',  promedio: 3.8 },
    { tipo: 'Idiomas',  promedio: 2.7 },
  ];

  get maxHabilidades(): number {
    return Math.max(...this.habilidadesPorTipo.map(h => h.cantidad), 1);
  }

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.cvId = this.route.snapshot.paramMap.get('id') ?? '';
  }
}
