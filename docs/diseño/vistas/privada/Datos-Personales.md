# Vista: Datos Personales (`/datos-personales`)

**Layout:** `AdminLayoutComponent`  
**Módulo:** `DatosPersonalesModule`  
**Componente:** `DatosPersonalesComponent`  
**Clases `<body>`:** `layout-fixed sidebar-expand-lg bg-body-tertiary` (via `Renderer2`)  
**Acceso:** requiere `authGuard`  
**Prototipo:** [datos-personales.html](../../../frontend/prototipos/privada/datos-personales.html)

---

## Mockup

```
+------------------------------------------------------------------+
| TOPBAR  bg:#343A40  h:56px   (igual que Dashboard)               |
+------------------+-----------------------------------------------+
|  SIDEBAR         |   MAIN CONTENT  bg:#F4F6F9                    |
|  bg:#2D3748      |                                               |
|  w:220px         |   ┌─────────────────────────────────────┐    |
|                  |   │  Datos Personales                     │    |
|  [ AG 80px ]     |   │  Gestiona tu información personal     │    |
|  Ana García      |   └─────────────────────────────────────┘    |
|  Cargo/título    |                                               |
|  ─────────────── |   ▼ Identificación                            |
|  ▣ Dashboard     |   ┌─────────────────────────────────────┐    |
|  ▣ Alertas  [5]  |   │ Tipo doc ▾ │ Número documento       │    |
|  ▣ Mi CV         |   │ Fecha nacimiento │ Lugar nacimiento  │    |
|  ▣ Dat.Pers.  ◄  |   └─────────────────────────────────────┘    |
|  ▣ Perfil        |                                               |
|  ▣ Experiencia   |   ▼ Datos básicos                             |
|  ▣ Educación     |   ┌─────────────────────────────────────┐    |
|  ▣ Habilidades   |   │ Nombres │ Apellidos                  │    |
|  ▣ Proyectos     |   │ Cargo/Título profesional             │    |
|  ▣ Configuración |   │ Resumen profesional (textarea)       │    |
|                  |   └─────────────────────────────────────┘    |
|                  |                                               |
|                  |   ► Contacto                                  |
|                  |   ► Residencia                                |
|                  |   ► Seguridad Social                          |
|                  |   ► Información Familiar                      |
|                  |   ► Redes Sociales                            |
|                  |   ► Referencias Personales                    |
|                  |                                               |
|                  |              [ Guardar cambios ]              |
+------------------+-----------------------------------------------+
```

---

## Acordeones de la vista

| Acordeón | Campos principales |
|---|---|
| Identificación | Tipo documento, Nº documento, Fecha nacimiento, Lugar nacimiento |
| Datos básicos | Nombres, Apellidos, Cargo/Título, Foto de perfil (file input), Resumen profesional |
| Contacto | Email personal, Email profesional, Teléfono móvil, Teléfono fijo |
| Residencia | País, Departamento, Ciudad, Dirección, Código postal |
| Seguridad Social | EPS, AFP, ARL, Caja compensación |
| Información Familiar | Estado civil, Hijos (cantidad), Familiares de contacto (lista) |
| Redes Sociales | LinkedIn, GitHub, Portfolio/web, Twitter/X, Stack Overflow |
| Referencias Personales | Lista: Nombre, Cargo, Empresa, Email, Teléfono, Relación |

---

## Estructura de capas (Penpot)

```
Board (1440×1024)
├── Topbar
├── Sidebar  (item "Datos Personales" activo)
└── Main-content
    ├── page-header
    ├── accordion-identificacion  (expandido por defecto)
    ├── accordion-datos-basicos   (expandido por defecto)
    ├── accordion-contacto
    ├── accordion-residencia
    ├── accordion-seguridad-social
    ├── accordion-familiar
    ├── accordion-redes-sociales
    ├── accordion-referencias
    └── btn-guardar
```

---

## Especificaciones de estilos

| Elemento | Clase / Color | Detalle |
|---|---|---|
| Acordeón | `accordion accordion-flush` | Bootstrap 5 |
| Header acordeón expandido | `accordion-button` | `background:#F0F4FF; color:#2C7BE5` |
| Foto de perfil | círculo 96px, borde `#2C7BE5` 2px | Input file + preview |
| Botón guardar | `btn btn-primary w-100 mt-3` | Azul `#2C7BE5` |
