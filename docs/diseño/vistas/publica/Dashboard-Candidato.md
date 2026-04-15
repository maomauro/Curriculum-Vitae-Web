# Vista: Dashboard Analítico del Candidato (`/cv/:id/dashboard`)

**Layout:** `PublicLayoutComponent`  
**Módulo:** `PublicModule`  
**Componente:** `CvDashboardComponent`  
**Acceso:** Público (sin autenticación)  
**Prototipo:** [dashboard-candidato.html](../../prototipos/publica/dashboard-candidato.html)

---

## Descripción

Vista pública de analítica visible para cualquier reclutador que acceda al perfil de un candidato. Complementa la vista de [Detalle CV](./Detalle-CV.md) mediante el segundo tab "Dashboard analítico". Muestra métricas de actividad del candidato y visualizaciones interactivas con **Chart.js**.

---

## Mockup

```
+--------------------------------------------------------------+
| Navbar (igual que Home)                                      |
+--------------------------------------------------------------+
|                                                              |
|  [ ← Volver al listado ]                                     |
|                                                              |
|  [ Hoja de vida ]  [ Dashboard analítico ◄ ]                |
|                                                              |
|  ┌──────────────────────────────────────────────────────┐   |
|  │  Dashboard Analítico — Ana García  📊                  │   |
|  └──────────────────────────────────────────────────────┘   |
|                                                              |
|  +----------+ +----------+ +----------+ +----------+        |
|  |   124    | |    89    | |    12    | |    3     |        |
|  | Vistas   | |Visitantes| |Contactos | | Descargas|        |
|  | este mes | | únicos   | |recibidos | |    PDF   |        |
|  | #2C7BE5  | | #28A745  | | #6F42C1  | | #FD7E14 |        |
|  +----------+ +----------+ +----------+ +----------+        |
|                                                              |
|  +---------------------------+ +-------------------------+   |
|  | Habilidades más buscadas  | | Evolución de vistas     |   |
|  | (barra horizontal)        | | (timeline agrupado)     |   |
|  |                           | |                         |   |
|  | React      ████████  40%  | | ene feb mar abr may jun |   |
|  | Node.js    ██████    30%  | | [barras mes/candidato]  |   |
|  | Docker     ████      20%  | |                         |   |
|  +---------------------------+ +-------------------------+   |
|                                                              |
|  +---------------------------+ +-------------------------+   |
|  | Distribución de visitas   | | Perfil de buscadores   |   |
|  | por origen (pie chart)    | | (radar chart)          |   |
|  |                           | |                         |   |
|  |     🟦 Directo  45%       | | Técnico  Liderazgo     |   |
|  |     🟩 LinkedIn 30%       | | Comunic. Innovación    |   |
|  |     🟧 Búsqueda 25%       | | [polígono radar]        |   |
|  +---------------------------+ +-------------------------+   |
|                                                              |
+--------------------------------------------------------------+
| Footer (igual que Home)                                      |
+--------------------------------------------------------------+
```

---

## Cards de métricas (6 totales)

| Card | Métrica | Color |
|---|---|---|
| Vistas este mes | Total de vistas al CV en el mes actual | `#2C7BE5` azul |
| Visitantes únicos | Usuarios únicos que vieron el CV | `#28A745` verde |
| Contactos recibidos | Mensajes recibidos vía modal de contacto | `#6F42C1` morado |
| Descargas PDF | Número de veces que se descargó el CV en PDF | `#FD7E14` naranja |
| Promedio tiempo lectura | Tiempo medio de permanencia en la vista de CV | `#20C997` teal |
| Tasa de contacto | % de visitantes que enviaron contacto | `#DC3545` rojo |

---

## Gráficas (Chart.js)

| Gráfica | Tipo | Descripción |
|---|---|---|
| Habilidades más buscadas | Barras horizontal (`horizontalBar`) | Top habilidades que motivaron la visita, con porcentaje |
| Evolución de vistas | Barras agrupadas (`bar`) | Vistas mensuales por candidato vs. media del sector (últimos 6 meses) |
| Distribución por origen | Pie / Dona (`doughnut`) | Porcentaje de visitas por origen: Directo, LinkedIn, Búsqueda orgánica, Referido |
| Perfil de buscadores | Radar (`radar`) | 5 dimensiones de interés de quienes visitan el CV: Técnico, Liderazgo, Comunicación, Innovación, Gestión |

---

## Estructura de capas (Penpot)

```
Board (1440×1024)
├── Navbar
├── contenido-principal
│   ├── btn-volver
│   ├── tabs-vista
│   │   ├── tab-HojaDeVida
│   │   └── tab-DashboardAnalitico  (activo)
│   ├── page-header
│   │   └── titulo "Dashboard Analítico — {nombre candidato}"
│   ├── metrics-row  (4 cards principales)
│   │   ├── card-vistas-mes
│   │   ├── card-visitantes-unicos
│   │   ├── card-contactos
│   │   └── card-descargas
│   ├── metrics-row-2  (2 cards secundarias)
│   │   ├── card-tiempo-lectura
│   │   └── card-tasa-contacto
│   └── charts-grid  (2×2)
│       ├── chart-habilidades-buscadas  (barras horizontal)
│       ├── chart-evolucion-vistas      (barras agrupado)
│       ├── chart-distribucion-origen   (dona)
│       └── chart-perfil-buscadores     (radar)
└── Footer
```

---

## Especificaciones de estilos

| Elemento | Clase / Color | Detalle |
|---|---|---|
| Tabs de vista | `nav nav-tabs` Bootstrap 5 | Tab activo: border-bottom `#2C7BE5` |
| Cards métricas | `card shadow-sm text-center` | Número en `h2`, métrica en `small text-muted` |
| Contenedor gráfica | `card shadow-sm p-3` | h: 280px, Chart.js canvas |
| Grid gráficas | `row row-cols-1 row-cols-md-2` | 2 columnas en desktop |

---

## Dependencias

- **Chart.js** (CDN) — cargado en el `<head>` del prototipo
- Los datos son **estáticos** en el prototipo HTML (arrays de ejemplo hardcodeados en `<script>`)
- En producción se obtendrán via `GET /api/cv/:id/stats`

---

## Navegación

- Tab "Hoja de vida" → `/cv/:id` (componente `CvDetailComponent`)
- Tab "Dashboard analítico" → `/cv/:id/dashboard` (este componente)
- Botón "← Volver al listado" → `/cvs`
