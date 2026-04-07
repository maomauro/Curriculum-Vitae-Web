# Diseño UI — Portal CV

Documento de arquitectura visual. Cada vista tiene su propio archivo detallado en `docs/diseño/vistas/`.

---

## Vistas del proyecto

| Vista | Ruta | Layout | Acceso | Archivo |
|---|---|---|---|---|
| Home | `/` | PublicLayout | Público | [Home.md](./vistas/Home.md) |
| Buscar CVs | `/cvs` | PublicLayout | Público | [Buscar-CVs.md](./vistas/Buscar-CVs.md) |
| Detalle CV | `/cv/:id` | PublicLayout | Público | [Detalle-CV.md](./vistas/Detalle-CV.md) |
| Login | `/auth/login` | AuthLayout | Público | [Login.md](./vistas/Login.md) |
| Register | `/auth/register` | AuthLayout | Público | [Register.md](./vistas/Register.md) |
| Dashboard | `/dashboard` | AdminLayout | `authGuard` | [Dashboard.md](./vistas/Dashboard.md) |
| Editor CV | `/editor` | AdminLayout | `authGuard` | [Editor-CV.md](./vistas/Editor-CV.md) |
| Alertas | `/dashboard/alertas` | AdminLayout | `authGuard` | [Alertas.md](./vistas/Alertas.md) |
| Panel Admin | `/admin` | AdminLayout | `adminGuard` | [Admin-Panel.md](./vistas/Admin-Panel.md) |

---

## Decisión de plantilla: AdminLTE 4

**AdminLTE 4** es la plantilla seleccionada para el área privada (editor y dashboard).

- Gratuita (MIT), compatible con Bootstrap 5, sin jQuery
- NPM: `npm install admin-lte@4`
- Docs: https://adminlte.io

La sección **pública** usa Bootstrap 5 directamente (incluido con AdminLTE) con diseño personalizado. No aplica el sidebar de AdminLTE.

---

## Arquitectura de layouts

Tres layouts independientes según la sección:

```
AppComponent
  └── <router-outlet>
       ├── PublicLayoutComponent   (/  /cvs  /cv/:id)
       │    ├── NavbarPublicComponent
       │    ├── <router-outlet>
       │    └── FooterPublicComponent
       │
       ├── AuthLayoutComponent     (/auth/login  /auth/register)
       │    └── <router-outlet>
       │
       └── AdminLayoutComponent    (/dashboard  /editor  /dashboard/alertas  /admin)
            ├── TopbarComponent
            ├── SidebarComponent
            └── <router-outlet>
```

### Clases del `<body>` por layout

| Layout | Clases `<body>` | Quién las aplica |
|---|---|---|
| Admin | `layout-fixed sidebar-expand-lg bg-body-tertiary` | `AdminLayoutComponent` via `Renderer2` |
| Auth | `login-page bg-body-secondary` | `AuthLayoutComponent` via `Renderer2` |
| Public | *(ninguna)* | `PublicLayoutComponent` las limpia via `Renderer2` |

> Las clases del `<body>` **no** se ponen en `index.html`. Cada layout las gestiona en `ngOnInit()` (add) y `ngOnDestroy()` (remove) con `Renderer2`.

---

## Paleta de colores

Definida en `frontend/src/styles.scss`:

```scss
:root {
  --bs-primary:   #2c7be5;
  --bs-secondary: #6c757d;
  --bs-success:   #00b74a;
  --bs-info:      #39c0ed;
  --bs-warning:   #ffa900;
  --bs-danger:    #f93154;
}
```

Colores adicionales para cards de métricas:

| Uso | Color |
|---|---|
| Card Total CVs | `#28A745` |
| Card Vistas | `#007BFF` |
| Card Visitantes | `#6F42C1` |
| Card Completitud | `#20C997` |

---

## Estructura de carpetas

```
frontend/src/app/layout/
  containers/
    public-layout.component.ts
    auth-layout.component.ts
    admin-layout.component.ts
  components/
    navbar-public/
    footer/
    sidebar/
    topbar/
```

---

## Integración en Angular

```json
// angular.json — styles y scripts
"styles": [
  "node_modules/admin-lte/dist/css/adminlte.min.css",
  "src/styles.scss"
],
"scripts": [
  "node_modules/admin-lte/dist/js/adminlte.min.js"
]
```

CDN en `index.html`:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/overlayscrollbars@2.11.0/styles/overlayscrollbars.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/source-sans-3@5.0.12/index.css">
```

---

## Decisiones descartadas

| Opción | Razón |
|---|---|
| AdminLTE 3.x | Requiere jQuery |
| ng-admin-lte | Sin mantenimiento, incompatible con Angular 17+ |
| Angular Material | No tiene look de panel de administración |
| PrimeNG | Licencia para algunos componentes |
| Tailwind CSS | Sin componentes de admin listos |
