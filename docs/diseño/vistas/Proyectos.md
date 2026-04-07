# Vista: Proyectos (`/proyectos`)

**Layout:** `AdminLayoutComponent`  
**Módulo:** `ProyectosModule`  
**Componente:** `ProyectosComponent`  
**Clases `<body>`:** `layout-fixed sidebar-expand-lg bg-body-tertiary` (via `Renderer2`)  
**Acceso:** requiere `authGuard`  
**Prototipo:** [proyectos.html](../../frontend/prototipos/privada/proyectos.html)

---

## Mockup

```
+------------------------------------------------------------------+
| TOPBAR  bg:#343A40  h:56px   (igual que Dashboard)               |
+------------------+-----------------------------------------------+
|  SIDEBAR         |   MAIN CONTENT  bg:#F4F6F9                    |
|  bg:#2D3748      |                                               |
|  w:220px         |   ┌─────────────────────────────────────┐    |
|                  |   │  Proyectos                            │    |
|  [ AG 80px ]     |   │  Muestra tus desarrollos y trabajos   │    |
|  Ana García      |   └─────────────────────────────────────┘    |
|  Cargo/título    |                                               |
|  ─────────────── |   ▼ PortalCV · 2024                          |
|  ▣ Dashboard     |   ┌─────────────────────────────────────┐    |
|  ▣ Alertas  [5]  |   │ Nombre:  [ PortalCV             ]   │    |
|  ▣ Mi CV         |   │ URL:     [ https://portalcv.co  ]   │    |
|  ▣ Dat.Personales|   │ Desc.:   [ textarea...          ]   │    |
|  ▣ Perfil        |   │ Stack:   [React] [Node] [+ tag] ✕  │    |
|  ▣ Experiencia   |   │ Inicio: [AAAA]   Fin: [AAAA / Activo]│   |
|  ▣ Educación     |   │   [ ✕ Eliminar proyecto ]           │    |
|  ▣ Habilidades   |   └─────────────────────────────────────┘    |
|  ▣ Proyectos  ◄  |                                               |
|  ▣ Configuración |   ► Blog Personal · 2023                      |
|                  |                                               |
|                  |   [ + Agregar proyecto ]                      |
|                  |                                               |
|                  |              [ Guardar cambios ]              |
+------------------+-----------------------------------------------+
```

---

## Campos del formulario de proyecto

| Campo | Descripción |
|---|---|
| Nombre | Nombre del proyecto |
| URL | Enlace al repositorio o demo pública |
| Descripción | Texto libre de qué hace el proyecto |
| Stack tecnológico | Tags dinámicos: el usuario escribe y presiona Enter para agregar; `✕` para eliminar cada tag |
| Fecha inicio | Año (AAAA) |
| Fecha fin | Año (AAAA) o switch "En desarrollo" |

---

## Comportamiento de tags de stack

- Input de texto + Enter → crea tag con el valor escrito
- Cada tag tiene botón `✕` para eliminarlo
- Los tags se almacenan como array de strings en `Proyecto.Stack`

---

## Estructura de capas (Penpot)

```
Board (1440×1024)
├── Topbar
├── Sidebar  (item "Proyectos" activo)
└── Main-content
    ├── page-header
    ├── accordion-proyectos
    │   ├── item-proyecto-1  (expandido)
    │   │   ├── campos-proyecto
    │   │   ├── input-stack-tags
    │   │   └── btn-eliminar
    │   ├── item-proyecto-2  (colapsado)
    │   └── btn-agregar-proyecto
    └── btn-guardar
```

---

## Especificaciones de estilos

| Elemento | Clase / Color | Detalle |
|---|---|---|
| Acordeón | `accordion` Bootstrap 5 | Título: Nombre · Año |
| Tag de stack | `badge bg-primary me-1` | Con `×` inline |
| Input tags | `form-control form-control-sm` | Placeholder: "Ej: React, Enter para agregar" |
| Botón eliminar | `btn btn-outline-danger btn-sm` | Rojo, dentro del acordeón |
| Botón agregar | `btn btn-outline-secondary` | `+ Agregar proyecto` |
| Botón guardar | `btn btn-primary` | Azul `#2C7BE5` |
