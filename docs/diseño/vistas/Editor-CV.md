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

## Tabs del editor

| Tab | Tabla BD | Campos |
|---|---|---|
| Datos Personales | `Personales` | Nombre, Apellidos, Cargo/Título, Email, Teléfono, Ciudad, LinkedIn, Resumen profesional |
| Perfil Profesional | `Perfil` | NombrePerfil, DescripcionPerfil, AspiracionSalarialPesos, AspiracionSalarialDolares |
| Experiencia | `Experiencia` | Lista de empleos: Empresa, Cargo, Fecha inicio/fin, Descripción. Botón `+ Agregar` |
| Educación | `Formacion` | Lista: Institución, Título, Fecha inicio/fin. Botón `+ Agregar` |
| Habilidades | `Habilidad` | Lista: Nombre de habilidad, Nivel (1-5). Botón `+ Agregar` |
| Proyectos | `Proyecto` | Lista: Nombre, URL, Descripción, Tecnologías usadas. Botón `+ Agregar` |
| Referencias | `Referencia` | Lista: Nombre, Cargo, Empresa, Email, Relación. Botón `+ Agregar` |
| Redes Sociales | `RedSocial` | LinkedIn, GitHub, Portfolio/web, Twitter/X, Stack Overflow (campos de URL) |
| Familiares | `FamiliarContacto` | Lista: Parentesco, Nombres, Apellidos, Email, Teléfono, EsContactoPrincipal (switch). No visible en CV público. Botón `+ Agregar` |
| Visibilidad | `VisibilidadSeccion` | Toggles por sección (Experiencia, Educación, Habilidades, Proyectos, Referencias, Redes Sociales, Contacto); privacidad de email (público / solo reclutadores / oculto) |

---

## Estructura de capas (Penpot)

```
Board (1440×1024)
├── Topbar
├── Sidebar
└── Main-content
    ├── page-header
    │   └── titulo-pagina
    ├── tabs-navegacion
    │   ├── tab-DatosPersonales  (activo)
    │   ├── tab-PerfilProfesional
    │   ├── tab-Experiencia
    │   ├── tab-Educacion
    │   ├── tab-Habilidades
    │   ├── tab-Proyectos
    │   ├── tab-Referencias
    │   ├── tab-RedesSociales
    │   ├── tab-Familiares
    │   └── tab-Visibilidad
    └── formulario-activo
        ├── campo-nombre
        ├── campo-apellidos
        ├── campo-cargo
        ├── campo-email
        ├── campo-ciudad
        ├── campo-linkedin
        ├── campo-resumen
        └── btn-guardar
```

---

## Especificaciones de estilos

| Elemento | Clase | Detalle |
|---|---|---|
| Contenedor tabs | `nav nav-tabs` | Bootstrap tabs |
| Tab activo | `nav-link active` | border-bottom `#2C7BE5` |
| Tab inactivo | `nav-link` | `#6C757D` |
| Panel formulario | `tab-content card card-body` | padding: 24px, sombra leve |
| Label campos | `form-label fw-semibold` | `#343A40`, 14px |
| Inputs | `form-control` | Border `#DEE2E6` |
| Textarea resumen | `form-control` | rows: 4 |
| Botón guardar | `btn btn-primary px-4` | Azul `#2C7BE5`, alineado derecha |
| Btn agregar ítem | `btn btn-outline-secondary btn-sm` | `+ Agregar experiencia` |

---

## Comportamientos

- Los tabs usan el sistema de tabs de Bootstrap 5 (`data-bs-toggle="tab"`)
- Los datos se guardan en `[(ngModel)]` en el componente
- El botón `Guardar cambios` llama a `cvService.save(cvData)` (pendiente integración API)
- En Experiencia/Educación/Habilidades: botón `+ Agregar` inserta un nuevo ítem en la lista
- Cada ítem de lista tiene botón `✕ Eliminar`

---

## Pendiente (fase 2)

- Vista previa del CV en panel lateral o modal (toggle con botón `👁 Vista previa`)
- Exportar CV en PDF
