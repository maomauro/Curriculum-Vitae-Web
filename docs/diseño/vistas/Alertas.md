# Vista: Alertas (`/dashboard/alertas`)

**Layout:** `AdminLayoutComponent`  
**Módulo:** `DashboardModule`  
**Componente:** `AlertasComponent`  
**Clases `<body>`:** `layout-fixed sidebar-expand-lg bg-body-tertiary` (via `Renderer2`)  
**Acceso:** requiere `authGuard`

---

## Mockup

```
+------------------------------------------------------------------+
| TOPBAR  bg:#343A40  h:56px   (igual que Dashboard)               |
+------------------+-----------------------------------------------+
|  SIDEBAR         |   MAIN CONTENT  bg:#F4F6F9                    |
|  bg:#2D3748      |                                               |
|  w:220px         |   ┌───────────────────────────────────────┐   |
|                  |   │  🔔 Alertas privadas                   │   |
|  [ foto 80px ]   |   │  Notificaciones de actividad ─ solo tú│   |
|  Nombre usuario  |   └───────────────────────────────────────┘   |
|  Cargo/título    |                                               |
|  ─────────────   |   +-------+ +----------+ +-------+ +-------+ |
|  ▣ Dashboard     |   |   5   | |    3     | |   8   | |   2   | |
|  ▣ Mis CVs       |   |No lei.| |Contactos | |Vistas | |Descarg| |
|  ▣ Editor CV     |   +-------+ +----------+ +-------+ +-------+ |
|  ▣ Alertas  ◄    |                                               |
|  —————————       |   FILTROS: [Todas(12)] [Sin leer(5)] [Tipo▾] |
|                  |                                               |
|                  |   ┌──────────────────────────────────────┐   |
|                  |   │ 🔵 No leída │ Nuevo mensaje de Juan P │   |
|                  |   │ Consulting Partners SL — hace 15 min  │   |
|                  |   │                   [Ver mensaje →]     │   |
|                  |   ├──────────────────────────────────────┤   |
|                  |   │ 🟠 No leída │ CV descargado en PDF    │   |
|                  |   │ Desde Madrid, España — hace 1 hora    │   |
|                  |   ├──────────────────────────────────────┤   |
|                  |   │ ── Alertas anteriores (leídas) ────── │   |
|                  |   ├──────────────────────────────────────┤   |
|                  |   │ 🟢 Leída │ CV visto desde Barcelona    │   |
|                  |   │ Hace 2 días                            │   |
|                  |   └──────────────────────────────────────┘   |
|                  |                                               |
+------------------+-----------------------------------------------+
```

---

## Tipos de alerta

| Tipo | Color borde izquierdo | Icono | Descripción |
|---|---|---|---|
| Contacto recibido | `#2C7BE5` azul | `bi-envelope-fill` | Mensaje enviado a través del modal de contacto del CV |
| Vista destacada | `#28A745` verde | `bi-eye-fill` | CV superó umbral de visitas en 24 h |
| Descarga PDF | `#FD7E14` naranja | `bi-file-earmark-arrow-down-fill` | Alguien descargó el CV en PDF |
| Sistema | `#6C757D` gris | `bi-gear-fill` | Acciones del sistema: CV publicado, cuenta activada, etc. |

---

## Cards de resumen

| Card | Métrica | |
|---|---|---|
| No leídas | Alertas pendientes de leer | contador destacado |
| Contactos nuevos | Mensajes recibidos sin leer | |
| Vistas hoy | Visitas acumuladas del día | |
| Descargas | PDFs descargados en el período | |

---

## Estructura de capas (Penpot)

```
Board (1440×1024)
├── Topbar
├── Sidebar  (item "Alertas" activo, badge con count)
└── Main-content
    ├── page-header
    │   ├── titulo  "Alertas privadas"
    │   ├── subtitulo
    │   ├── btn-marcar-todas-leidas
    │   └── btn-limpiar-leidas
    ├── cards-resumen (4 cards métricas)
    ├── filter-bar
    │   ├── btn-group  (Todas / Sin leer)
    │   ├── select-tipo
    │   └── select-periodo
    ├── lista-alertas-no-leidas
    │   └── alert-item (×N)  [borde-left color, icono, texto, fecha, acción]
    ├── separador-leidas
    ├── lista-alertas-leidas
    │   └── alert-item (×N)
    └── paginacion
```

---

## Especificaciones de estilos

| Elemento | Clase / Color | Detalle |
|---|---|---|
| Item no leído fondo | `#EBF3FB` | Azul muy suave |
| Item no leído borde | `border-left: 4px solid #2C7BE5` | Varía según tipo |
| Item leído fondo | `#FFFFFF` | Blanco |
| Icono círculo | `width:42px; border-radius:50%` | Color de fondo suave del tipo |
| Título alerta | `font-weight:700; font-size:.9rem` | `#212529` |
| Descripción | `font-size:.85rem` | `#495057` |
| Meta (fecha, extra) | `font-size:.78rem` | `#6C757D` |
| Punto no leído | `width:8px; border-radius:50%; background:#2C7BE5` | Esquina superior derecha |

---

## Comportamientos

- Al hacer clic en "Marcar todas como leídas" → `alertasService.marcarTodasLeidas()` y recarga listado
- Al hacer clic en "Limpiar leídas" → elimina alertas con `leida=true` del store local
- El badge del sidebar desaparece cuando `no_leidas === 0`
- Filtro "Sin leer" oculta los items con `leida=true`
- "Ver mensaje completo →" navega a la vista de detalle del mensaje (phase 2) o abre un panel lateral
- Paginación: 10 alertas por página
