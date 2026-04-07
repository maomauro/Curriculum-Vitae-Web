# Vista: Perfil Profesional (`/perfil`)

**Layout:** `AdminLayoutComponent`  
**Módulo:** `PerfilModule`  
**Componente:** `PerfilComponent`  
**Clases `<body>`:** `layout-fixed sidebar-expand-lg bg-body-tertiary` (via `Renderer2`)  
**Acceso:** requiere `authGuard`  
**Prototipo:** [perfil.html](../../../frontend/prototipos/privada/perfil.html)

---

## Mockup

```
+------------------------------------------------------------------+
| TOPBAR  bg:#343A40  h:56px   (igual que Dashboard)               |
+------------------+-----------------------------------------------+
|  SIDEBAR         |   MAIN CONTENT  bg:#F4F6F9                    |
|  bg:#2D3748      |                                               |
|  w:220px         |   ┌─────────────────────────────────────┐    |
|                  |   │  Perfiles Profesionales               │    |
|  [ AG 80px ]     |   │  Define los roles que quieres mostrar │    |
|  Ana García      |   └─────────────────────────────────────┘    |
|  Cargo/título    |                                               |
|  ─────────────── |   +-----------------------------------+       |
|  ▣ Dashboard     |   | 💼 Desarrollador Frontend          |  ◉  |
|  ▣ Alertas  [5]  |   | Activo · $ 4.500.000 COP          |       |
|  ▣ Mi CV         |   | "React, TypeScript, 5 años exp..." |       |
|  ▣ Dat.Personales|   |              [Editar] [Eliminar]   |       |
|  ▣ Perfil     ◄  |   +-----------------------------------+       |
|  ▣ Experiencia   |                                               |
|  ▣ Educación     |   +-----------------------------------+       |
|  ▣ Habilidades   |   | 🔧 Consultor Backend               |  ○  |
|  ▣ Proyectos     |   | Inactivo · $ 6.000.000 COP         |      |
|  ▣ Configuración |   | "Node.js, AWS, microservicios..."  |       |
|                  |   |              [Editar] [Eliminar]   |       |
|                  |   +-----------------------------------+       |
|                  |                                               |
|                  |   [ + Agregar nuevo perfil ]                  |
+------------------+-----------------------------------------------+
```

---

## Comportamiento de la vista

- Cada perfil tiene un **toggle Activo/Inactivo** — solo el perfil activo se muestra en el CV público
- Al activar un perfil se desactiva el anterior automáticamente (solo uno activo a la vez)
- Botón **Editar** abre un formulario inline o modal con los campos del perfil
- Botón **Agregar** despliega formulario en blanco al final de la lista

---

## Campos del formulario de perfil

| Campo | Descripción |
|---|---|
| Nombre del perfil | Ej.: "Desarrollador Frontend", "Consultor Backend" |
| Descripción | Texto libre de presentación del perfil |
| Aspiración salarial (COP) | Número entero en pesos colombianos |
| Aspiración salarial (USD) | Número entero en dólares |

---

## Estructura de capas (Penpot)

```
Board (1440×1024)
├── Topbar
├── Sidebar  (item "Perfil" activo)
└── Main-content
    ├── page-header
    ├── lista-perfiles
    │   ├── card-perfil-1  (toggle activo)
    │   ├── card-perfil-2  (toggle inactivo)
    │   └── ...
    └── btn-agregar-perfil
```

---

## Especificaciones de estilos

| Elemento | Clase / Color | Detalle |
|---|---|---|
| Card perfil | `card shadow-sm mb-3` | border-left: 4px solid según estado |
| Toggle activo | `form-check-input` Bootstrap 5 | Verde `#28A745` cuando activo |
| Badge activo | `badge bg-success` | "Activo" |
| Badge inactivo | `badge bg-secondary` | "Inactivo" |
| Botón agregar | `btn btn-outline-primary` | `+ Agregar nuevo perfil` |
