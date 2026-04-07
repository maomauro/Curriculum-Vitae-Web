# Vista: Panel de Administración (`/admin`)

**Layout:** `AdminLayoutComponent`  
**Módulo:** `AdminModule`  
**Componente:** `AdminPanelComponent`  
**Clases `<body>`:** `layout-fixed sidebar-expand-lg bg-body-tertiary` (via `Renderer2`)  
**Acceso:** requiere `adminGuard` (rol `Admin`)  
**Épica:** Épica 5 — Administración (COULD HAVE)

---

## Mockup

```
+------------------------------------------------------------------+
| TOPBAR  bg:#343A40  [ ≡ ] PortalCV  [ADMIN badge]   CA ▾        |
+------------------+-----------------------------------------------+
|  SIDEBAR         |   MAIN CONTENT  bg:#F4F6F9                    |
|  bg:#2D3748      |                                               |
|  [ CA avatar ]   |   ┌───────────────────────────────────┐      |
|  Carlos Admin    |   │ 🛡 Panel de Administración         │      |
|  Administrador   |   └───────────────────────────────────┘      |
|  ─────────────   |                                               |
|  Administración  |   +------+ +--------+ +--------+ +--------+  |
|  ▣ Usuarios  ◄   |   | 142  | |  118   | |   17   | |    7   |  |                                               |
|  ▣ Roles         |   [ Usuarios ] [ Roles ] [ Auditoría ]  ←tabs|
|  ▣ Auditoría     |                                               |
|                  |   TAB USUARIOS:                               |
|                  |   [Buscar...] [Todos][Activos][Bloq.] [Rol▾]  |
|                  |   ┌────────────────────────────────────────┐  |
|                  |   │ # │ Nombre      │ Rol   │ Estado │ Acc │  |
|                  |   │ 31│ Ana García  │ Publ. │ Activo │ ⊙✎🚫│  |
|                  |   │ 28│ Marcos P.   │ Publ. │ Activo │ ⊙✎🚫│  |
|                  |   │  2│ Carlos A.   │ Admin │ Activo │ ⊙──│  |
|                  |   └────────────────────────────────────────┘  |
|                  |   Mostrando 1-6 de 142   [← 1 2 3 … 24 →]    |
|                  |                                               |
+------------------+-----------------------------------------------+
```

---

## Tabs del panel

| Tab | Contenido |
|---|---|
| Usuarios | Tabla paginada de usuarios: ID, nombre, email, rol, estado, nº CVs, fecha registro. Acciones: Ver detalle / Activar / Desactivar / Bloquear |
| Roles | Tabla con selector de rol por usuario. Regla: al menos un Admin siempre. Propio usuario deshabilitado |
| Auditoría | Log cronológico de acciones administrativas con filtro por tipo y fecha |

---

## Modal: Detalle de usuario

Muestra en panel lateral o modal:
- Avatar e iniciales, nombre, email, rol, estado
- ID, fecha de registro, último acceso
- Nº de CVs, vistas acumuladas, contactos recibidos
- Acciones: Desactivar / Bloquear

---

## Modal: Confirmar bloqueo

- Nombre del usuario afectado
- Selector de motivo (obligatorio): Contenido inapropiado / Spam / Incumplimiento de términos / Solicitud del usuario / Otro
- Textarea de notas adicionales (opcional)
- Botón "Confirmar bloqueo" en rojo

---

## Modal: Confirmar cambio de rol

- Muestra usuario afectado
- Badge rol actual → Badge rol nuevo
- Aviso de que queda registrado en auditoría

---

## Estructura de capas (Penpot)

```
Board (1440×1024)
├── Topbar  (badge ADMIN en rojo junto al logo)
├── Sidebar  (solo sección "Administración": Usuarios activo, Roles, Auditoría)
└── Main-content
    ├── page-header
    ├── cards-metricas (4 cards: Total, Activos, Inactivos, Bloqueados)
    ├── panel-tabs
    │   ├── tab-Usuarios  (activo)
    │   │   ├── filter-bar
    │   │   ├── tabla-usuarios
    │   │   └── paginacion
    │   ├── tab-Roles
    │   │   ├── alerta-seguridad
    │   │   └── tabla-roles
    │   └── tab-Auditoria
    │       ├── filter-bar
    │       ├── lista-audit-entries
    │       └── paginacion
    ├── modal-detalle-usuario
    ├── modal-confirmar-bloqueo
    └── modal-confirmar-rol
```

---

## Especificaciones de estilos

| Elemento | Clase / Color | Detalle |
|---|---|---|
| Avatar admin | `background:#DC3545` | Rojo en lugar de azul Publicador |
| Badge ADMIN topbar | `background:#DC3545; font-size:.7rem` | Junto al logo |
| Tab activo | `border-bottom: 3px solid #DC3545; color:#DC3545` | Rojo admin |
| Sidebar item activo | `border-left: 3px solid #DC3545` | Rojo en lugar de azul |
| Card Total | `linear-gradient(#2C7BE5,#1A5FC7)` | Azul |
| Card Activos | `linear-gradient(#28A745,#1E7E34)` | Verde |
| Card Inactivos | `linear-gradient(#6C757D,#495057)` | Gris |
| Card Bloqueados | `linear-gradient(#DC3545,#A71D2A)` | Rojo |
| Status Activo | `color:#28A745` + punto verde | `.status-activo` |
| Status Inactivo | `color:#6C757D` + punto gris | `.status-inactivo` |
| Status Bloqueado | `color:#DC3545` + punto rojo | `.status-bloqueado` |
| Audit entry borde | Color según tipo: azul/rojo/verde/naranja | `border-left: 3px solid` |

---

## Badges de rol

| Rol | Badge Bootstrap |
|---|---|
| Publicador | `badge bg-primary` (azul) |
| Administrador | `badge bg-danger` (rojo) |

---

## Reglas de negocio / Comportamientos

- Un admin **no puede** desactivar, bloquear ni cambiar el rol de su propia cuenta
- Debe existir **al menos 1 Administrador** en todo momento; el sistema bloquea downgrade si es el último
- Las acciones de Desactivar / Bloquear / Cambio de rol requieren confirmación modal
- Todas las acciones quedan registradas en el log de Auditoría con `admin_id`, `target_user_id`, `accion`, `timestamp`
- La tabla de usuarios es paginada (10 por página) y búsqueda en tiempo real
- Solo usuarios con rol `Admin` pueden acceder; `adminGuard` redirige a `/dashboard` si no tiene permisos
