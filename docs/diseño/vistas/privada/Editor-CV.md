# Vista: Editor CV (`/editor`)

**Layout:** `AdminLayoutComponent`  
**Módulo:** `EditorModule`  
**Componente:** `EditorComponent`  
**Clases `<body>`:** `layout-fixed sidebar-expand-lg bg-body-tertiary` (via `Renderer2`)  
**Acceso:** requiere `authGuard`

---

## Mockup

```
+------------------------------------------------------------------+
| TOPBAR  (igual que Dashboard)                                    |
+------------------+-----------------------------------------------+
|  SIDEBAR         |   MAIN CONTENT                                |
|  (igual que      |                                               |
|   Dashboard)     |   Editor de Curriculum Vitae                  |
|                  |   ─────────────────────────────               |
|                  |                                               |
|                  |   [ Datos Personales ][ Experiencia ]         |
|                  |   [ Educación        ][ Habilidades ]         |
|                  |   ← tabs de secciones →                       |
|                  |                                               |
|                  |   +---------------------------------------+   |
|                  |   |  FORMULARIO ACTIVO (tab seleccionado) |   |
|                  |   |                                       |   |
|                  |   |  Nombre:    [ ___________________ ]   |   |
|                  |   |  Apellidos: [ ___________________ ]   |   |
|                  |   |  Cargo:     [ ___________________ ]   |   |
|                  |   |  Email:     [ ___________________ ]   |   |
|                  |   |  Ciudad:    [ ___________________ ]   |   |
|                  |   |  LinkedIn:  [ ___________________ ]   |   |
|                  |   |                                       |   |
|                  |   |  Resumen profesional:                 |   |
|                  |   |  [ textarea ______________________ ]  |   |
|                  |   |                                       |   |
|                  |   |              [ Guardar cambios ]      |   |
|                  |   +---------------------------------------+   |
|                  |                                               |
+------------------+-----------------------------------------------+
```

---

## Secciones del CV

Cada sección del CV es una **página independiente** accesible desde el botón "Editar →" en la vista previa o directamente desde el sidebar de navegación.

| Sección | Ruta | Archivo vistas |
|---|---|---|
| Datos Personales | `/datos-personales` | [Datos-Personales.md](./Datos-Personales.md) |
| Perfil Profesional | `/perfil` | [Perfil.md](./Perfil.md) |
| Experiencia | `/experiencia` | [Experiencia.md](./Experiencia.md) |
| Educación | `/educacion` | [Educacion.md](./Educacion.md) |
| Habilidades | `/habilidades` | [Habilidades.md](./Habilidades.md) |
| Proyectos | `/proyectos` | [Proyectos.md](./Proyectos.md) |
| Configuración / Visibilidad | `/configuracion` | [Configuracion.md](./Configuracion.md) |

---

## Estructura de capas (Penpot)

```
Board (1440×1024)
├── Topbar
├── Sidebar
└── Main-content
    ├── page-header
    │   └── titulo-pagina  "Mi Curriculum Vitae"
    ├── preview-card
    │   ├── header-cv  (nombre, cargo, resumen)
    │   ├── seccion-experiencia  [→ btn-editar]
    │   ├── seccion-educacion    [→ btn-editar]
    │   ├── seccion-habilidades  [→ btn-editar]
    │   └── seccion-proyectos    [→ btn-editar]
    └── actions-bar
        ├── btn-ver-perfil-publico
        └── btn-exportar-pdf
```

---

## Especificaciones de estilos

| Elemento | Clase | Detalle |
|---|---|---|
| Vista previa CV | `card card-body` | padding: 24px, sombra leve |
| Encabezados de sección | `fw-semibold border-bottom pb-1` | `#343A40`, 14px |
| Botón editar | `btn btn-outline-primary btn-sm` | alineado a la derecha del encabezado |
| Botón ver público | `btn btn-outline-secondary` | `#6C757D` |
| Botón exportar PDF | `btn btn-primary` | Azul `#2C7BE5` |

---

## Comportamientos

- Cada botón "Editar →" navega a la página independiente de la sección correspondiente
- "Ver perfil público" abre `/cv/:id` en nueva pestaña
- "Exportar PDF" dispara la generación y descarga del CV en formato PDF (pendiente integración API)

---

## Pendiente (fase 2)

- Vista previa del CV en panel lateral o modal (toggle con botón `👁 Vista previa`)
- Exportar CV en PDF
