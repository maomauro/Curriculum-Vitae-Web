# Vista: Detalle CV (`/cv/:id`)

**Layout:** `PublicLayoutComponent`  
**Módulo:** `PublicModule`  
**Componente:** `CvDetailComponent`

---

## Mockup

```
+--------------------------------------------------------------+
| Navbar (igual que Home)                                      |
+--------------------------------------------------------------+
|                                                              |
|  [ ← Volver al listado ]                                     |
|                                                              |
|  [ Hoja de vida ◄ ]  [ Dashboard analítico → ]              |
|                                                              |
|  +--------------------+  +-------------------------------+   |
|  |  COLUMNA IZQ       |  |  COLUMNA DERECHA              |   |
|  |  w: ~30%           |  |  w: ~70%                      |   |
|  |                    |  |                               |   |
|  |  [ avatar 120px ]  |  |  RESUMEN                      |   |
|  |  Nombre completo   |  |  "Desarrollador con 10 años..." |  |
|  |  Título profesional|  |                               |   |
|  |                    |  |  EXPERIENCIA                  |   |
|  |  ── Contacto ──    |  |  ┌─ 2022–hoy ──────────────┐  |   |
|  |  ✉ email           |  |  │ Empresa ABC             │  |   |
|  |  📍 Ciudad         |  |  │ Desarrollador Senior     │  |   |
|  |  🔗 LinkedIn       |  |  │ Descripción del rol...   │  |   |
|  |                    |  |  └──────────────────────────┘  |   |
|  |  ── Habilidades ── |  |  ┌─ 2019–2022 ─────────────┐  |   |
|  |  [React    ████  ] |  |  │ Empresa XYZ             │  |   |
|  |  [Node.js  ███   ] |  |  │ Desarrollador Jr        │  |   |
|  |  [Docker   ██    ] |  |  └──────────────────────────┘  |   |
|  |                    |  |                               |   |
|  |  ── Idiomas ──     |  |  EDUCACIÓN                    |   |
|  |  Español  Nativo   |  |  ┌─ 2015–2019 ─────────────┐  |   |
|  |  Inglés   B2       |  |  │ Univ. Nacional          │  |   |
|  |                    |  |  │ Ing. de Sistemas         │  |   |
|  +--------------------+  |  └──────────────────────────┘  |   |
|                           +-------------------------------+   |
+--------------------------------------------------------------+
| Footer (igual que Home)                                      |
+--------------------------------------------------------------+
```

---

## Tabs de la vista

| Tab | Ruta | Descripción |
|---|---|---|
| Hoja de vida | `/cv/:id` | Columna izquierda (contacto, habilidades, idiomas) + columna derecha (resumen, experiencia, educación) |
| Dashboard analítico | `/cv/:id/dashboard` | Métricas y gráficas de actividad del candidato (6 cards + 4 charts) |

---

## Estructura de capas (Penpot)

```
Board (1440×1024)
├── Navbar
├── contenido-principal
│   ├── btn-volver
│   ├── tabs-vista            ← nuevo
│   │   ├── tab-HojaDeVida (activo)
│   │   └── tab-DashboardAnalitico
│   ├── columna-izquierda
│   │   ├── avatar
│   │   ├── nombre
│   │   ├── titulo-profesional
│   │   ├── seccion-contacto
│   │   │   ├── email
│   │   │   ├── ciudad
│   │   │   └── linkedin
│   │   ├── seccion-habilidades
│   │   │   └── skill-bar (×N)
│   │   ├── seccion-idiomas
│   │   └── btn-contactar  (abre modal #modalContacto)
│   └── columna-derecha
│       ├── seccion-resumen
│       ├── seccion-experiencia
│       │   └── item-experiencia (×N)
│       └── seccion-educacion
│           └── item-educacion (×N)
├── modal-contacto (#modalContacto)
│   ├── campo-nombre
│   ├── campo-empresa
│   ├── campo-email
│   ├── campo-motivo-contacto  (select: Oferta laboral / Proyecto freelance / Consulta / Otro → `VisitanteContacto.MotivoContacto`)
│   ├── campo-asunto
│   ├── campo-mensaje (textarea)
│   └── btn-enviar
└── Footer
```

---

## Especificaciones de estilos

| Elemento | Clase / Color | Tamaño |
|---|---|---|
| Columna izquierda fondo | `bg-light rounded` | w: 30%, padding: 24px |
| Avatar | círculo, borde `#2C7BE5` 3px | 120×120px |
| Nombre | bold `#212529` | 22px |
| Título profesional | `#6C757D` | 15px |
| Encabezados sección | bold `#343A40`, border-bottom | 13px uppercase |
| Iconos contacto | `bi bi-envelope` / `bi bi-geo-alt` / `bi bi-linkedin` | 14px `#2C7BE5` |
| Barra de habilidad | `progress` Bootstrap | h: 8px, color `#2C7BE5` |
| Timeline experiencia | `border-start border-primary border-2 ps-3` | — |
| Fecha timeline | `text-muted` | 12px |
| Empresa | bold `#212529` | 16px |
| Cargo | `#2C7BE5` | 14px |
| Descripción | `#6C757D` | 14px |

---

## Comportamientos

- `id` se lee de `ActivatedRoute` → busca en array de datos
- Si no existe el CV, redirige a `/cvs`
- Botón `← Volver al listado` navega a `/cvs`
- Las barras de habilidades tienen animación de entrada (CSS transition)
- Botón `Contactar` en columna izquierda abre el modal `#modalContacto`
- Al enviar el formulario de contacto se muestra alerta de éxito y se cierra el modal a los 2.5 s
- El campo email del formulario de contacto es validado con formato RFC
- El campo `MotivoContacto` es un `<select>` con opciones: Oferta laboral, Proyecto freelance, Consulta, Otro — se persiste en `VisitanteContacto.MotivoContacto`
