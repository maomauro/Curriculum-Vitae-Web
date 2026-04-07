# Vista: Configuración (`/configuracion`)

**Layout:** `AdminLayoutComponent`  
**Módulo:** `ConfiguracionModule`  
**Componente:** `ConfiguracionComponent`  
**Clases `<body>`:** `layout-fixed sidebar-expand-lg bg-body-tertiary` (via `Renderer2`)  
**Acceso:** requiere `authGuard`  
**Prototipo:** [configuracion.html](../../frontend/prototipos/privada/configuracion.html)

---

## Mockup

```
+------------------------------------------------------------------+
| TOPBAR  bg:#343A40  h:56px   (igual que Dashboard)               |
+------------------+-----------------------------------------------+
|  SIDEBAR         |   MAIN CONTENT  bg:#F4F6F9                    |
|  bg:#2D3748      |                                               |
|  w:220px         |   ┌─────────────────────────────────────┐    |
|                  |   │  Configuración de Privacidad          │    |
|  [ AG 80px ]     |   │  Controla qué datos son visibles      │    |
|  Ana García      |   └─────────────────────────────────────┘    |
|  Cargo/título    |                                               |
|  ─────────────── |   VISIBILIDAD — Información Personal          |
|  ▣ Dashboard     |   ┌─────────────────────────────────────┐    |
|  ▣ Alertas  [5]  |   │ Email           [●──] Público       │    |
|  ▣ Mi CV         |   │ Teléfono        [─●─] Solo reclut.  │    |
|  ▣ Dat.Personales|   │ Ciudad          [●──] Público       │    |
|  ▣ Perfil        |   │ Fecha nacimiento[──●] Oculto        │    |
|  ▣ Experiencia   |   └─────────────────────────────────────┘    |
|  ▣ Educación     |                                               |
|  ▣ Habilidades   |   VISIBILIDAD — Secciones del CV              |
|  ▣ Proyectos     |   ┌─────────────────────────────────────┐    |
|  ▣ Configuración◄|   │ ◉ Experiencia laboral  [Visible]    │    |
|                  |   │ ◉ Educación            [Visible]    │    |
|                  |   │ ◉ Habilidades          [Visible]    │    |
|                  |   │ ○ Proyectos            [Oculto]     │    |
|                  |   │ ◉ Referencias          [Visible]    │    |
|                  |   └─────────────────────────────────────┘    |
|                  |                                               |
|                  |   PRIVACIDAD                                  |
|                  |   ┌─────────────────────────────────────┐    |
|                  |   │ CV indexable por buscadores  [ ◉ ]  │    |
|                  |   │ Link público de mi CV:               │    |
|                  |   │ portalcv.co/cv/ana-garcia  [Copiar] │    |
|                  |   └─────────────────────────────────────┘    |
|                  |                                               |
|                  |   SEGURIDAD                                   |
|                  |   ┌─────────────────────────────────────┐    |
|                  |   │ Contraseña actual: [______________]  │    |
|                  |   │ Nueva contraseña:  [______________]  │    |
|                  |   │ Confirmar nueva:   [______________]  │    |
|                  |   │       [ Cambiar contraseña ]        │    |
|                  |   └─────────────────────────────────────┘    |
|                  |                                               |
|                  |              [ Guardar configuración ]        |
+------------------+-----------------------------------------------+
```

---

## Secciones de la vista

### Visibilidad — Información Personal
Controles de privacidad para cada dato personal sensible. Niveles:
- **Público**: cualquier visitante lo ve en el CV
- **Solo reclutadores**: requiere login con rol Reclutador (futuro)
- **Oculto**: no aparece en el CV público

| Campo | Opciones |
|---|---|
| Email | Público / Solo reclutadores / Oculto |
| Teléfono | Público / Solo reclutadores / Oculto |
| Ciudad | Público / Oculto |
| Fecha de nacimiento | Público / Oculto |
| Nº documento | Siempre oculto (informativo) |

### Visibilidad — Secciones del CV
Toggle ON/OFF para activar o desactivar la visualización de cada sección en el CV público:
- Experiencia laboral, Educación, Habilidades, Proyectos, Referencias

### Privacidad
- Toggle "CV indexable por buscadores" (activa/desactiva `<meta name="robots">`)
- Mostrar y copiar el link público del CV: `portalcv.co/cv/{slug}`

### Seguridad — Cambio de contraseña
- Contraseña actual (validación backend)
- Nueva contraseña + Confirmar nueva contraseña

---

## Estructura de capas (Penpot)

```
Board (1440×1024)
├── Topbar
├── Sidebar  (item "Configuración" activo)
└── Main-content
    ├── page-header
    ├── seccion-visibilidad-personal
    │   └── lista-toggles-privacidad
    ├── seccion-visibilidad-secciones
    │   └── lista-toggles-secciones
    ├── seccion-privacidad
    │   ├── toggle-indexable
    │   └── link-publico + btn-copiar
    ├── seccion-seguridad
    │   ├── input-contrasena-actual
    │   ├── input-nueva-contrasena
    │   ├── input-confirmar-contrasena
    │   └── btn-cambiar-contrasena
    └── btn-guardar
```

---

## Especificaciones de estilos

| Elemento | Clase / Color | Detalle |
|---|---|---|
| Toggle sección | `form-check form-switch` Bootstrap 5 | Verde `#28A745` activo |
| Selector privacidad | `form-select form-select-sm` | 3 opciones por campo |
| Input link público | `form-control` readonly + `btn-outline-secondary` [Copiar] | |
| Inputs contraseña | `form-control` + `type="password"` | Con toggle ver/ocultar |
| Botón cambiar clave | `btn btn-warning` | Amarillo, dentro de la sección |
| Botón guardar | `btn btn-primary` | Azul `#2C7BE5`, al fondo |
