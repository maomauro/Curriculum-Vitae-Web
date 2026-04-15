# Vista: Educación y Formación (`/educacion`)

**Layout:** `AdminLayoutComponent`  
**Módulo:** `EducacionModule`  
**Componente:** `EducacionComponent`  
**Clases `<body>`:** `layout-fixed sidebar-expand-lg bg-body-tertiary` (via `Renderer2`)  
**Acceso:** requiere `authGuard`  
**Prototipo:** [educacion.html](../../prototipos/privada/educacion.html)

---

## Mockup

```
+------------------------------------------------------------------+
| TOPBAR  bg:#343A40  h:56px   (igual que Dashboard)               |
+------------------+-----------------------------------------------+
|  SIDEBAR         |   MAIN CONTENT  bg:#F4F6F9                    |
|  bg:#2D3748      |                                               |
|  w:220px         |   ┌─────────────────────────────────────┐    |
|                  |   │  Educación y Formación                │    |
|  [ AG 80px ]     |   │  Agrega tus estudios y certificados   │    |
|  Ana García      |   └─────────────────────────────────────┘    |
|  Cargo/título    |                                               |
|  ─────────────── |   [ Posgrado ][ Pregrado ][ Tecnólogo ]       |
|  ▣ Dashboard     |   [ Diplomados ][ Certificaciones ]           |
|  ▣ Alertas  [5]  |   ← tabs por TipoFormacion →                 |
|  ▣ Mi CV         |                                               |
|  ▣ Dat.Personales|   TAB ACTIVO: Pregrado                        |
|  ▣ Perfil        |   ┌─────────────────────────────────────┐    |
|  ▣ Experiencia   |   │ Institución: [ Univ. Nacional   ]   │    |
|  ▣ Educación  ◄  |   │ Título:      [ Ing. de Sistemas ]   │    |
|  ▣ Habilidades   |   │ Inicio:  [AAAA]  Fin: [AAAA]        │    |
|  ▣ Proyectos     |   │ Ciudad:  [ Bogotá           ]        │    |
|  ▣ Configuración |   │   [ ✕ Eliminar     ]                 │    |
|                  |   └─────────────────────────────────────┘    |
|                  |                                               |
|                  |   [ + Agregar Pregrado ]                      |
|                  |                                               |
|                  |   ─── Agregar nueva formación ───             |
|                  |   [ Tipo ▾ ] Institución: [    ]              |
|                  |   Título: [    ]  Inicio: [  ] Fin: [  ]      |
|                  |   [ Cancelar ] [ Guardar ]                    |
|                  |                                               |
|                  |              [ Guardar cambios ]              |
+------------------+-----------------------------------------------+
```

---

## Tabs por tipo de formación

| Tab | `TipoFormacion` | Descripción |
|---|---|---|
| Posgrado | `posgrado` | Maestrías, doctorados, especializaciones |
| Pregrado | `pregrado` | Carreras universitarias de 4–5 años |
| Tecnólogo | `tecnologo` | Programas técnico-tecnológicos |
| Diplomados | `diplomado` | Diplomados y cursos de extensión |
| Certificaciones | `certificacion` | Certificados oficiales de entidades externas |

---

## Formulario de nueva formación (inline)

Aparece al clic en "+ Agregar [Tipo]" o desde el formulario general:
- Selector **Tipo de formación** (pre-seleccionado al tipo del tab activo)
- Institución, Título obtenido, Ciudad, Año inicio, Año fin (o "En curso")
- Botones: **Cancelar** – **Guardar**

---

## Estructura de capas (Penpot)

```
Board (1440×1024)
├── Topbar
├── Sidebar  (item "Educación" activo)
└── Main-content
    ├── page-header
    ├── tabs-tipo-formacion
    │   ├── tab-Posgrado
    │   ├── tab-Pregrado  (activo)
    │   ├── tab-Tecnologo
    │   ├── tab-Diplomados
    │   └── tab-Certificaciones
    ├── lista-formaciones  (del tipo activo)
    │   ├── item-formacion-1
    │   └── btn-agregar
    ├── form-nueva-formacion  (expandible)
    └── btn-guardar
```

---

## Especificaciones de estilos

| Elemento | Clase / Color | Detalle |
|---|---|---|
| Tabs tipo | `nav nav-tabs` Bootstrap 5 | Tab activo: border-bottom `#2C7BE5` |
| Item formación | `card card-body mb-2` | Campos inline o acordeón |
| Botón eliminar | `btn btn-outline-danger btn-sm` | Rojo, dentro del ítem |
| Botón agregar | `btn btn-outline-secondary` | `+ Agregar [Tipo]` |
| Formulario nuevo | `card bg-light p-3` | Aparece debajo del listado |
| Botón guardar | `btn btn-primary` | Azul `#2C7BE5` |
