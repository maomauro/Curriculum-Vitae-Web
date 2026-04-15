# Vista: Configuración (`/configuracion`)

**Layout:** `AdminLayoutComponent`  
**Módulo:** `PrivateModule`  
**Componente:** `ConfiguracionComponent`  
**Clases `<body>`:** `layout-fixed sidebar-expand-lg bg-body-tertiary` (via `Renderer2`)  
**Acceso:** requiere `authGuard`  
**Prototipo:** [configuracion.html](../../prototipos/privada/configuracion.html)

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

### Visibilidad — Secciones del CV (clasificado por páginas)
Toggle ON/OFF para activar o desactivar la visualización pública de cada página ya implementada:
- Datos Personales
- Perfil
- Experiencia
- Educación
- Habilidades
- Proyectos

En cada fila se muestra además una descripción de **atributos visibles** (qué campos concretos se publican cuando está activa la sección).
Cada sección incluye:
- un switch general para activar/desactivar toda la página;
- switches por atributo para control más personalizado (ej. en Proyectos: nombre, rol, equipo, duración, stack, aporte, logro y desafío).

**Regla actual para `Mi CV` (v1):**
- En `Habilidades`, el prototipo de `Mi CV` solo muestra bloques de **técnicas** e **idiomas**.
- Las habilidades blandas se mantienen en datos (tabla `Habilidad`) pero no se renderizan como bloque independiente en `Mi CV` hasta la siguiente iteración de diseño.

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
