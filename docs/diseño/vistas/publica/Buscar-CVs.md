# Vista: Buscar CVs (`/cvs`)

**Layout:** `PublicLayoutComponent`  
**Módulo:** `PublicModule`  
**Componente:** `CvsComponent`

---

## Mockup

```
+--------------------------------------------------------------+
| Navbar (igual que Home)                                      |
+--------------------------------------------------------------+
|                                                              |
|  FILTROS  bg:#F8F9FA  border-bottom                          |
|                                                              |
|  [ Buscar por nombre, cargo o tecnología... ]  [Ordenar ▾]  |
|                                                              |
+--------------------------------------------------------------+
|                                                              |
|  GRID DE CVs  (3 columnas, padding 32px)                     |
|                                                              |
|  +------------------+ +------------------+ +----------------+|
|  |  [ AG ]          | |  [ CR ]          | |  [ LM ]        ||
|  |  avatar/iniciales| |                  | |                ||
|  |                  | |                  | |                ||
|  |  Ana García      | |  Carlos Ruiz     | |  Laura Martínez||
|  |  Frontend Dev    | |  Backend Dev     | |  UX Designer   ||
|  |                  | |                  | |                ||
|  |  [React][Angular]| |  [Node][Docker]  | |  [Figma][CSS]  ||
|  |                  | |                  | |                ||
|  |  [Ver perfil →]  | |  [Ver perfil →]  | |  [Ver perfil →]||
|  +------------------+ +------------------+ +----------------+|
|                                                              |
|  +------------------+ +------------------+ +----------------+|
|  |  ...             | |  ...             | |  ...           ||
|  +------------------+ +------------------+ +----------------+|
|                                                              |
+--------------------------------------------------------------+
| Footer (igual que Home)                                      |
+--------------------------------------------------------------+
```

---

## Estructura de capas (Penpot)

```
Board (1440×1024)
├── Navbar
├── Filtros
│   ├── input-busqueda
│   └── select-orden
├── Grid-CVs
│   ├── Card-1
│   │   ├── avatar
│   │   ├── nombre
│   │   ├── titulo-profesional
│   │   ├── badges-tecnologias
│   │   └── btn-ver-perfil
│   ├── Card-2
│   ├── Card-3
│   └── ... (6 cards total)
└── Footer
```

---

## Especificaciones de estilos

| Elemento | Clase / Color | Tamaño |
|---|---|---|
| Barra filtros fondo | `bg-light border-bottom` | h: 64px |
| Input búsqueda | `form-control` | w: ~400px |
| Selector orden | `form-select` | w: ~200px |
| Grid | `row row-cols-1 row-cols-md-3 g-4` | padding: 32px |
| Card | `card h-100 shadow-sm` | — |
| Avatar iniciales | círculo, fondo `#2C7BE5`, texto blanco | w/h: 64px |
| Nombre | bold, `#212529` | 18px |
| Título profesional | `#6C757D` | 14px |
| Badge tecnología | `badge bg-primary-subtle text-primary` | — |
| Btn Ver perfil | `btn btn-outline-primary btn-sm w-100` | — |

---

## Comportamientos

- El input de búsqueda filtra en tiempo real (por nombre, título y tecnologías)
- El selector `Ordenar` tiene opciones: `Más recientes`, `A-Z`, `Z-A`
- Cada card navega a `/cv/:id` al hacer clic en "Ver perfil"
- Si no hay resultados, muestra mensaje: "No se encontraron perfiles con ese criterio"
