# Vista: Dashboard (`/dashboard`)

**Layout:** `AdminLayoutComponent`  
**Módulo:** `DashboardModule`  
**Componente:** `DashboardComponent`  
**Clases `<body>`:** `layout-fixed sidebar-expand-lg bg-body-tertiary` (via `Renderer2`)  
**Acceso:** requiere `authGuard`

---

## Mockup general

```
+------------------------------------------------------------------+
| TOPBAR  bg:#343A40  h:56px                                       |
| [ ≡ ]  PortalCV             Nombre - Cargo        [ 👤 usuario ] |
+------------------+-----------------------------------------------+
|  SIDEBAR         |   MAIN CONTENT  bg:#F4F6F9                    |
|  bg:#2D3748      |                                               |
|  w:220px         |   ┌─────────────────────────────────────┐    |
|                  |   │  Dashboard de tu Hoja de Vida  📊   │    |
|  [ foto 80px ]   |   │  Visualiza y analiza tu información  │    |
|  Nombre usuario  |   └─────────────────────────────────────┘    |
|  Cargo/título    |                                               |
|  ─────────────────  |   +----------+ +----------+ +----------+  |
|  ▣ Dashboard    ◄   |   | Total CVs| | Vistas   | |Visitantes|  |
|  ▣ Alertas   [5]    |   |    3     | |   124    | |    89    |  |
|  ▣ Mi CV            |   | #28A745  | | #007BFF  | | #6F42C1  |  |
|  ▣ Datos Personales |   +----------+ +----------+ +----------+  |
|  ▣ Perfil           |                                            |
|  ▣ Experiencia      |   +------------------+ +------------------+|
|  ▣ Educación        |   | Vistas por mes   | | Completitud      ||
|  ▣ Habilidades      |   | [gráfica barras] | | perfil: 75%      ||
|  ▣ Proyectos        |   |                  | | [progress bar]   ||
|  ▣ Configuración    |   +------------------+ +------------------+|
|                  |                                               |
|                  |   ALERTAS RECIENTES                           |
|                  |   ┌─────────────────────────────────────┐    |
|                  |   │ Fecha  │ Evento          │ Estado   │    |
|                  |   │ 05/04  │ Nuevo visitante │ Info     │    |
|                  |   │ 04/04  │ CV actualizado  │ OK       │    |
|                  |   └─────────────────────────────────────┘    |
+------------------+-----------------------------------------------+
```

---

## Comportamiento del sidebar hamburguesa ≡

```
Estado EXPANDIDO (default)          Estado COMPACTO (clic en ≡)
+------------------+                +------+
|  ▣ Dashboard     |                | ▣    |
|  ▣ Alertas  [5]  |  ──────────►   | ▣    |
|  ▣ Mi CV         |                | ▣    |
|  ▣ Experiencia   |                | ▣    |
|  w: 220px        |                | w:60 |
|  texto + icono   |                | solo iconos + tooltip
+------------------+                +------+
```

- Expandido: `<body>` sin clase extra
- Compacto: agregar `sidebar-collapse` al `<body>` via `Renderer2`
- Al hover sobre icono en modo compacto: `tooltip` con el nombre del ítem

---

## Estructura de capas (Penpot) — 2 frames

### Frame 1: Dashboard-Expandido (1440×1024)
```
Board
├── Topbar
│   ├── btn-hamburguesa
│   ├── logo-PortalCV
│   ├── nombre-cargo-centro
│   └── user-dropdown
├── Sidebar-expanded  (w:220)
│   ├── user-photo
│   ├── user-name
│   ├── user-cargo
│   └── nav-menu
│       ├── item-Dashboard (activo)
│       ├── item-Alertas  (badge: 5)
│       ├── item-MiCV
│       ├── item-DatosPersonales
│       ├── item-Perfil
│       ├── item-Experiencia
│       ├── item-Educacion
│       ├── item-Habilidades
│       ├── item-Proyectos
│       └── item-Configuracion
└── Main-content
    ├── header-card
    ├── metrics-row
    │   ├── card-totalCVs
    │   ├── card-vistas
    │   └── card-visitantes
    ├── charts-row
    │   ├── chart-vistas-mes
    │   └── card-completitud
    └── tabla-alertas

```

### Frame 2: Dashboard-Compacto (1440×1024)
```
Board
├── Topbar  (idéntico)
├── Sidebar-compact  (w:60)
│   └── nav-icons-only
└── Main-content  (idéntico, más ancho)
```

---

## Cards de métricas

| Card | Métrica | Color fondo | Icono |
|---|---|---|---|
| Card 1 | Total CVs publicados | `#28A745` verde | `bi-file-earmark-check` |
| Card 2 | Vistas este mes | `#007BFF` azul | `bi-eye` |
| Card 3 | Visitantes únicos | `#6F42C1` morado | `bi-people` |

Estructura HTML de cada card:
```html
<div class="col-md-4">
  <div class="card text-white" style="background-color: #28A745">
    <div class="card-body">
      <div class="d-flex justify-content-between">
        <div>
          <h5 class="card-title">Total CVs</h5>
          <h2 class="fw-bold">3</h2>
          <small>CVs publicados</small>
        </div>
        <i class="bi bi-file-earmark-check fs-1 opacity-50"></i>
      </div>
    </div>
  </div>
</div>
```

---

## Gráficas

| Gráfica | Tipo | Librería | Datos |
|---|---|---|---|
| Vistas por mes | Barras verticales | Chart.js via `ng2-charts` | Vistas por mes (últimos 6 meses) |
| Completitud perfil | Progress bar Bootstrap | Bootstrap 5 | % campos completados |

---

## Tabla de alertas

Columnas: `Fecha` · `Evento` · `Estado`  
Clases: `table table-hover table-sm`  
Estado badges: `badge bg-info` / `badge bg-success` / `badge bg-warning`

---

## Especificaciones Topbar

| Elemento | Posición | Estilo |
|---|---|---|
| `≡` Hamburguesa | Izquierda | `data-lte-toggle="sidebar"` |
| Logo `PortalCV` | Izquierda | `brand-text`, blanco |
| Nombre + Cargo | Centro | `"Nombre - Cargo"` · blanco · 15px |
| Avatar usuario | Derecha | Dropdown con opción Cerrar sesión |
