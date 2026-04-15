# Vista: Experiencia Laboral (`/experiencia`)

**Layout:** `AdminLayoutComponent`  
**Módulo:** `ExperienciaModule`  
**Componente:** `ExperienciaComponent`  
**Clases `<body>`:** `layout-fixed sidebar-expand-lg bg-body-tertiary` (via `Renderer2`)  
**Acceso:** requiere `authGuard`  
**Prototipo:** [experiencia.html](../../prototipos/privada/experiencia.html)

---

## Mockup

```
+------------------------------------------------------------------+
| TOPBAR  bg:#343A40  h:56px   (igual que Dashboard)               |
+------------------+-----------------------------------------------+
|  SIDEBAR         |   MAIN CONTENT  bg:#F4F6F9                    |
|  bg:#2D3748      |                                               |
|  w:220px         |   ┌─────────────────────────────────────┐    |
|                  |   │  Experiencia Laboral                  │    |
|  [ AG 80px ]     |   │  Registra tus empleos anteriores      │    |
|  Ana García      |   └─────────────────────────────────────┘    |
|  Cargo/título    |                                               |
|  ─────────────── |   ▼ Empresa ABC · 2022–hoy                   |
|  ▣ Dashboard     |   ┌─────────────────────────────────────┐    |
|  ▣ Alertas  [5]  |   │ Empresa: [ Empresa ABC          ]   │    |
|  ▣ Mi CV         |   │ Cargo:   [ Desarrollador Senior ]   │    |
|  ▣ Dat.Personales|   │ Inicio:  [MM/AAAA] Fin: [ Actual]   │    |
|  ▣ Perfil        |   │ Desc.:   [ textarea... ]            │    |
|  ▣ Experiencia ◄ |   │ Soporte: [ 📎 Adjuntar cert. lab. ] │    |
|  ▣ Educación     |   │   [ ✕ Eliminar este empleo ]        │    |
|  ▣ Habilidades   |   └─────────────────────────────────────┘    |
|  ▣ Proyectos     |                                               |
|  ▣ Configuración |   ► Empresa XYZ · 2019–2022                  |
|                  |                                               |
|                  |   [ + Agregar empleo ]                        |
|                  |                                               |
|                  |   ─── Referencias laborales ───               |
|                  |   ┌─────────────────────────────────────┐    |
|                  |   │ Nombre │ Cargo │ Empresa │ Email    │    |
|                  |   │ Juan P.│ Dir.  │ ABC     │ j@abc.co │    |
|                  |   └─────────────────────────────────────┘    |
|                  |   [ + Agregar referencia ]                    |
|                  |                                               |
|                  |              [ Guardar cambios ]              |
+------------------+-----------------------------------------------+
```

---

## Secciones de la vista

### Acordeón de empleos
- Cada empleo es un ítem del acordeón: título = Empresa · período
- Campos: Empresa, Cargo/puesto, Fecha inicio (MM/AAAA), Fecha fin (MM/AAAA o "Actual"), Descripción de funciones (textarea), Adjunto certificación laboral (input `type="file"`)
- Botón "✕ Eliminar este empleo" dentro del acordeón

### Referencias laborales
- Tabla con: Nombre, Cargo, Empresa, Email, Teléfono, Relación
- Botón "+ Agregar referencia" al pie de la tabla

---

## Estructura de capas (Penpot)

```
Board (1440×1024)
├── Topbar
├── Sidebar  (item "Experiencia" activo)
└── Main-content
    ├── page-header
    ├── accordion-empleos
    │   ├── item-empleo-1  (expandido)
    │   │   ├── campos-empleo
    │   │   ├── input-file-certificacion
    │   │   └── btn-eliminar
    │   ├── item-empleo-2  (colapsado)
    │   └── btn-agregar-empleo
    ├── seccion-referencias
    │   ├── tabla-referencias
    │   └── btn-agregar-referencia
    └── btn-guardar
```

---

## Especificaciones de estilos

| Elemento | Clase / Color | Detalle |
|---|---|---|
| Acordeón | `accordion` | Bootstrap 5 |
| Input file | `form-control` | label: "Adjuntar certificación laboral" |
| Botón eliminar | `btn btn-outline-danger btn-sm` | Rojo, dentro del acordeón |
| Botón agregar | `btn btn-outline-secondary` | `+ Agregar empleo` |
| Tabla referencias | `table table-sm table-bordered` | Con botón `+ Agregar` al pie |
| Botón guardar | `btn btn-primary` | Azul `#2C7BE5` |
