# Vista: Home (`/`)

**Layout:** `PublicLayoutComponent`  
**Módulo:** `PublicModule`  
**Componente:** `HomeComponent`

---

## Mockup

```
+--------------------------------------------------------------+
| NavbarPublicComponent  →  nav.navbar.navbar-expand-lg        |
|  [PortalCV]  [Inicio]  [Buscar CVs]    [Login] [Registrarse] |
+--------------------------------------------------------------+
|                                                              |
|   HERO  bg:#F8F9FA                                           |
|                                                              |
|        Encuentra el talento que necesitas                    |
|        (36px bold, color #2C7BE5, centrado)                  |
|                                                              |
|   Explora currículums de profesionales y conecta con el      |
|   candidato ideal para tu empresa.                           |
|   (16px, color #6C757D, centrado)                            |
|                                                              |
|   [ Buscar por nombre, cargo o tecnología...  ] [Buscar]     |
|                                                              |
+--------------------------------------------------------------+
|                                                              |
|   CTA  bg:#FFFFFF                                            |
|                                                              |
|              ¿Eres un profesional?                           |
|   Crea tu CV online y compártelo con reclutadores            |
|                                                              |
|              [ Crear mi CV gratis ]                          |
|                                                              |
+--------------------------------------------------------------+
| FooterPublicComponent  →  footer.bg-dark                     |
|  © 2026 PortalCV. All rights reserved.    Privacy Terms      |
+--------------------------------------------------------------+
```

---

## Estructura de capas (Penpot)

```
Board (1440×1024)
├── Navbar
│   ├── logo-PortalCV
│   ├── nav-links
│   │   ├── Inicio
│   │   └── Buscar CVs
│   └── nav-actions
│       ├── btn-Iniciar-sesión
│       └── btn-Registrarse
├── Hero
│   ├── titulo
│   ├── subtitulo
│   └── buscador
│       ├── input-Buscar
│       └── btn-Buscar
├── Cta
│   ├── titulo-cta
│   ├── subtitulo-cta
│   └── btn-CrearCV
└── Footer
    ├── texto-copyright
    └── footer-links
        ├── Privacidad
        ├── Términos
        └── Contacto
```

---

## Especificaciones de estilos

| Elemento | Clase / Color | Tamaño |
|---|---|---|
| Navbar fondo | `bg-white border-bottom shadow-sm` | h: 64px |
| Logo | color `#2C7BE5`, bold | 20px |
| Links nav | color `#212529` | 15px |
| Btn Login | `btn btn-outline-primary btn-sm` | — |
| Btn Registrar | `btn btn-primary btn-sm` | — |
| Hero fondo | `bg-light` (`#F8F9FA`) | h: ~300px |
| Título Hero | `#2C7BE5`, bold | 36px |
| Subtítulo Hero | `#6C757D` | 16px |
| Input búsqueda | `form-control` | w: ~500px, h: 44px |
| Btn Buscar | `btn btn-primary` | — |
| CTA fondo | `#FFFFFF` | h: ~200px |
| Footer fondo | `#343A40` (dark) | h: 60px |
| Footer texto | `#FFFFFF` / links `#ADB5BD` | 13px |

---

## Comportamientos

- El buscador en Hero navega a `/cvs?q={termino}` al hacer submit
- El botón `Crear mi CV gratis` navega a `/auth/register`
- El botón `Iniciar sesión` navega a `/auth/login`
- `Inicio` en navbar tiene `routerLinkActiveOptions: { exact: true }`
