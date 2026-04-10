# Vista: Proyectos (`/proyectos`)

**Layout:** `AdminLayoutComponent`  
**Módulo:** `PrivateModule` (ruta lazy `features/private`)  
**Componente:** `ProyectosComponent` — `frontend/src/app/features/private/pages/proyectos.component.ts`  
**Estilos:** `frontend/src/styles/portal-pages.scss` (bloque **Proyectos**, clases `project-card`, `stack-tag`, `meta-pill`, etc.)  
**Clases `<body>`:** `layout-fixed sidebar-expand-lg bg-body-tertiary` (vía `Renderer2`)  
**Acceso:** requiere `authGuard`  
**API:** `GET/POST /api/cv/proyectos`, `PUT/DELETE /api/cv/proyectos/{id}`  
**Prototipo:** [proyectos.html](../../prototipos/privada/proyectos.html)

---

## Resumen de UX

- Lista de **tarjetas** (`project-card`): cabecera clicable expande/colapsa el formulario; en cabecera se muestran título, subtítulo (rol · tamaño de equipo), pills de duración/equipo e icono chevron.
- **Agregar proyecto** abre una tarjeta de **borrador** con borde discontinuo (no se añade a la lista hasta **Crear proyecto**). Mientras exista un borrador, el botón superior queda deshabilitado.
- Cada proyecto guardado tiene **Guardar** y **Eliminar** en el pie del formulario; el borrador solo **Crear proyecto** en el pie y **Cancelar** en la cabecera del borrador.

---

## Mockup (estructura)

```
+------------------------------------------------------------------+
| TOPBAR  bg:#343A40  h:56px   (igual que Dashboard)               |
+------------------+-----------------------------------------------+
|  SIDEBAR         |   MAIN CONTENT  bg:#F4F6F9                    |
|  bg:#2D3748      |                                               |
|  w:220px         |   ┌─────────────────────────────────────────┐ |
|                  |   │ Proyectos                    [+ Agregar] │ |
|                  |   │ Muestra los proyectos más relevantes…    │ |
|                  |   └─────────────────────────────────────────┘ |
|                  |                                               |
|  ▣ Proyectos ◄   |   ┌ — — — — Nuevo proyecto — — — — ┐ [Cancelar]|
|                  |   │ (formulario + Crear proyecto)   │          |
|                  |   └─────────────────────────────────┘          |
|                  |                                               |
|                  |   ▼ [icon] Título del proyecto                 |
|                  │     Rol · Equipo de N personas                 |
|                  │     [8 meses] [N personas]              ⌄       |
|                  |   ┌─────────────────────────────────┐          |
|                  |   │ Nombre*  Rol*  Equipo  Duración │          |
|                  |   │ Stack: [tag][tag] input [+]     │          |
|                  |   │ Mi aporte | Logro | Desafío     │          |
|                  |   │              [Eliminar] [Guardar]│          |
|                  |   └─────────────────────────────────┘          |
+------------------+-----------------------------------------------+
```

---

## Campos del formulario (alineados con API / dominio)

| Campo (UI) | Propiedad API (`UpsertProyectoRequest`) | Notas |
|---|---|---|
| Nombre del proyecto | `nombreProyecto` | Obligatorio en cliente |
| Rol en el proyecto | `rol` | Obligatorio en cliente |
| Equipo | `equipoTamano` | Número (personas), opcional en API |
| Duración (meses) | `duracionMeses` | Opcional |
| Stack tecnológico | `stackTecnologico` | En UI: tags; se persiste como **texto** separado por comas |
| Mi aporte al proyecto | `aporte` | Texto largo |
| Logro principal | `logro` | Texto largo |
| Principal desafío | `desafio` | Texto largo |

No hay en esta vista campos de URL ni fechas inicio/fin: el modelo actual del CV y el prototipo HTML oficial usan rol, equipo, duración, stack y textos de impacto.

---

## Comportamiento de tags de stack

- Input + botón **+** o tecla **Enter** agrega un tag (duplicados ignorados).
- Cada tag tiene control para quitarlo.
- En base de datos / JSON el stack es un **string** (`stackTecnologico`), típicamente valores unidos por coma al guardar.

---

## Estructura de capas (Penpot / mental model)

```
Board (1440×1024)
├── Topbar
├── Sidebar  (item "Proyectos" activo)
└── Main-content
    ├── page-header (título, subtítulo, Agregar proyecto)
    ├── project-card--nuevo (borrador, opcional)
    └── lista project-card
        ├── project-card-header (icono, título, rol, meta-pills, chevron)
        ├── project-body (formulario)
        └── project-action-row (Eliminar + Guardar, o solo Crear)
```

---

## Especificaciones de estilos

| Elemento | Clase / detalle |
|---|---|
| Tarjeta | `.project-card`, sombra suave, `border-radius: 10px` |
| Borrador | `.project-card--nuevo` borde discontinuo `var(--cv-primary)` |
| Cabecera | `.project-card-header`; hover en filas guardadas |
| Icono | `.project-icon` fondo `#EBF2FF`, acento primario |
| Título / rol | `.project-title`, `.project-role` |
| Pills | `.meta-pill` (duración, equipo) |
| Chevron | `.project-chevron` rota cuando `.expanded` |
| Cuerpo | `.project-body` visible si `.expanded` o tarjeta nueva |
| Tags stack | `.stack-tags`, `.stack-tag`, `.stack-tag-del` |
| Input stack | `.input-group-sm`, `.stack-input-group` (max-width ~320px) |
| Pie | `.project-action-row` + `justify-content-end gap-2` (Eliminar y Guardar juntos a la derecha, como Educación / Perfil) |
| Botón primario | `btn btn-primary` (`#2C7BE5` vía tema) |
| Eliminar | `btn btn-outline-danger btn-sm`, icono `bi-trash3` |
