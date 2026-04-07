# Vista: Mi CV (`/mi-cv`)

**Layout:** `AdminLayoutComponent`  
**Módulo:** `EditorModule`  
**Componente:** `MiCvComponent`  
**Clases `<body>`:** `layout-fixed sidebar-expand-lg bg-body-tertiary` (via `Renderer2`)  
**Acceso:** requiere `authGuard`  
**Prototipo:** [mi-cv.html](../../../frontend/prototipos/privada/mi-cv.html)

---

## Mockup

```
+------------------------------------------------------------------+
| TOPBAR  bg:#343A40  h:56px   (igual que Dashboard)               |
+------------------+-----------------------------------------------+
|  SIDEBAR         |   MAIN CONTENT  bg:#F4F6F9                    |
|  bg:#2D3748      |                                               |
|  w:220px         |   ┌─────────────────────────────────────┐    |
|                  |   │  Mi Curriculum Vitae                  │    |
|  [ AG 80px ]     |   │  Vista previa de tu perfil público    │    |
|  Ana García      |   └─────────────────────────────────────┘    |
|  Cargo/título    |                                               |
|  ─────────────── |   +---------------------------------------+   |
|  ▣ Dashboard     |   |  [Nombre completo]  [Cargo]           |   |
|  ▣ Alertas  [5]  |   |  [Resumen profesional...]             |   |
|  ▣ Mi CV      ◄  |   |  ────────────────────────────────     |   |
|  ▣ Dat.Personales|   |  EXPERIENCIA              [Editar →]  |   |
|  ▣ Perfil        |   |  Empresa ABC · 2022–hoy               |   |
|  ▣ Experiencia   |   |  ────────────────────────────────     |   |
|  ▣ Educación     |   |  EDUCACIÓN                [Editar →]  |   |
|  ▣ Habilidades   |   |  Univ. Nacional · 2015–2019           |   |
|  ▣ Proyectos     |   |  ────────────────────────────────     |   |
|  ▣ Configuración |   |  HABILIDADES              [Editar →]  |   |
|                  |   |  React · Node.js · Docker             |   |
|                  |   |  ────────────────────────────────     |   |
|                  |   |  PROYECTOS                [Editar →]  |   |
|                  |   |  PortalCV · Blog personal             |   |
|                  |   +---------------------------------------+   |
|                  |                                               |
|                  |   [ Ver perfil público ]  [ Exportar PDF ]   |
|                  |                                               |
+------------------+-----------------------------------------------+
```

---

## Secciones de la vista previa

| Sección | Ruta de edición | Descripción |
|---|---|---|
| Datos personales / Cabecera | `/datos-personales` | Nombre, cargo, foto, resumen |
| Experiencia | `/experiencia` | Lista de empleos en acordeón |
| Educación | `/educacion` | Formaciones por tipo |
| Habilidades | `/habilidades` | Técnicas, blandas, idiomas, cursos |
| Proyectos | `/proyectos` | Lista de proyectos con stack |

---

## Estructura de capas (Penpot)

```
Board (1440×1024)
├── Topbar
├── Sidebar  (item "Mi CV" activo)
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

| Elemento | Clase / Color | Detalle |
|---|---|---|
| Preview card | `card shadow-sm` | border-radius: 8px, padding: 24px |
| Encabezado sección | `fw-semibold text-uppercase border-bottom` | 12px, `#6C757D` |
| Botón editar | `btn btn-outline-primary btn-sm float-end` | alineado derecha del encabezado |
| Botón ver público | `btn btn-outline-secondary` | `#6C757D` |
| Botón exportar PDF | `btn btn-primary` | Azul `#2C7BE5` |
