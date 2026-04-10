# Vista: Habilidades (`/habilidades`)

**Layout:** `AdminLayoutComponent`  
**Módulo:** `HabilidadesModule`  
**Componente:** `HabilidadesComponent`  
**Clases `<body>`:** `layout-fixed sidebar-expand-lg bg-body-tertiary` (via `Renderer2`)  
**Acceso:** requiere `authGuard`  
**Prototipo:** [habilidades.html](../../prototipos/privada/habilidades.html)

---

## Mockup

```
+------------------------------------------------------------------+
| TOPBAR  bg:#343A40  h:56px   (igual que Dashboard)               |
+------------------+-----------------------------------------------+
|  SIDEBAR         |   MAIN CONTENT  bg:#F4F6F9                    |
|  bg:#2D3748      |                                               |
|  w:220px         |   ┌─────────────────────────────────────┐    |
|                  |   │  Habilidades                          │    |
|  [ AG 80px ]     |   │  Competencias técnicas y personales   │    |
|  Ana García      |   └─────────────────────────────────────┘    |
|  Cargo/título    |                                               |
|  ─────────────── |   TÉCNICAS                                    |
|  ▣ Dashboard     |   ┌─────────────────────────────────────┐    |
|  ▣ Alertas  [5]  |   │ React       ████████░░  80%  [✕]    │    |
|  ▣ Mi CV         |   │ Node.js     ██████░░░░  60%  [✕]    │    |
|  ▣ Dat.Personales|   │ Docker      ████░░░░░░  40%  [✕]    │    |
|  ▣ Perfil        |   │ [ + Agregar habilidad técnica ]      │    |
|  ▣ Experiencia   |   └─────────────────────────────────────┘    |
|  ▣ Educación     |                                               |
|  ▣ Habilidades ◄ |   BLANDAS                                     |
|  ▣ Proyectos     |   ┌─────────────────────────────────────┐    |
|  ▣ Configuración |   │ Liderazgo   [✕]  Trabajo en equipo [✕]│  |
|                  |   │ Comunicación[✕]                      │    |
|                  |   │ [ + Agregar habilidad blanda ]       │    |
|                  |   └─────────────────────────────────────┘    |
|                  |                                               |
|                  |   IDIOMAS                                     |
|                  |   ┌─────────────────────────────────────┐    |
|                  |   │ Español  Nativo    [✕]               │    |
|                  |   │ Inglés   B2        [✕]               │    |
|                  |   │ [ + Agregar idioma ]                  │    |
|                  |   └─────────────────────────────────────┘    |
|                  |                                               |
|                  |   CURSOS Y CERTIFICADOS                       |
|                  |   ┌────────────────────────────────────────┐ |
|                  |   │ Curso         │ Institución │ Certificado│|
|                  |   │ React Avanzado│ Udemy       │ [📎 ver]   │|
|                  |   │ AWS Fundament.│ AWS         │ [📎 ver]   │|
|                  |   └────────────────────────────────────────┘ |
|                  |   [ + Agregar curso ]                         |
|                  |                                               |
|                  |              [ Guardar cambios ]              |
+------------------+-----------------------------------------------+
```

---

## Secciones de la vista

### Habilidades técnicas
- Lista con barra de nivel (0–100 %) + botón eliminar `✕`
- "+ Agregar": input texto (nombre habilidad) + slider porcentaje

### Habilidades blandas
- Lista de tags/chips + botón eliminar `✕`
- "+ Agregar": input texto libre

### Idiomas
- Lista: Nombre idioma + nivel (Nativo / A1 / A2 / B1 / B2 / C1 / C2) + botón eliminar
- "+ Agregar": input nombre + selector nivel

### Cursos y certificados
- Tabla: Nombre curso, Institución, Fecha, Adjunto certificado (input `type="file"`)
- "+ Agregar curso" añade fila al final de la tabla

---

## Estructura de capas (Penpot)

```
Board (1440×1024)
├── Topbar
├── Sidebar  (item "Habilidades" activo)
└── Main-content
    ├── page-header
    ├── seccion-tecnicas
    │   ├── lista-habilidades-tecnicas
    │   └── btn-agregar-tecnica
    ├── seccion-blandas
    │   ├── lista-tags-blandas
    │   └── btn-agregar-blanda
    ├── seccion-idiomas
    │   ├── lista-idiomas
    │   └── btn-agregar-idioma
    ├── seccion-cursos
    │   ├── tabla-cursos  (con input-file por fila)
    │   └── btn-agregar-curso
    └── btn-guardar
```

---

## Especificaciones de estilos

| Elemento | Clase / Color | Detalle |
|---|---|---|
| Barra habilidad técnica | `progress` Bootstrap | h: 8px, color `#2C7BE5` |
| Tag habilidad blanda | `badge bg-light text-dark border` | Con `✕` inline |
| Selector nivel idioma | `form-select form-select-sm` | A1–C2 + Nativo |
| Input file curso | `form-control form-control-sm` | En columna de la tabla |
| Botón guardar | `btn btn-primary` | Azul `#2C7BE5` |
