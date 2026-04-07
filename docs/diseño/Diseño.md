# Diseño UI — Portal CV

Documento de arquitectura visual. Cada vista tiene su propio archivo detallado en `docs/diseño/vistas/`.

---

## Vistas del proyecto

### 🌐 Módulo Público

| Vista | Ruta | Layout | Acceso | Prototipo | Archivo |
|---|---|---|---|---|---|
| Home | `/` | PublicLayout | Público | [home.html](../prototipos/publica/home.html) | [Home.md](./vistas/publica/Home.md) |
| Buscar CVs | `/cvs` | PublicLayout | Público | [buscar-cvs.html](../prototipos/publica/buscar-cvs.html) | [Buscar-CVs.md](./vistas/publica/Buscar-CVs.md) |
| Detalle CV | `/cv/:id` | PublicLayout | Público | [detalle-cv.html](../prototipos/publica/detalle-cv.html) | [Detalle-CV.md](./vistas/publica/Detalle-CV.md) |
| Dashboard Candidato | `/cv/:id/dashboard` | PublicLayout | Público | [dashboard-candidato.html](../prototipos/publica/dashboard-candidato.html) | [Dashboard-Candidato.md](./vistas/publica/Dashboard-Candidato.md) |

### 🔐 Módulo de Autenticación

| Vista | Ruta | Layout | Acceso | Prototipo | Archivo |
|---|---|---|---|---|---|
| Login | `/auth/login` | AuthLayout | Público | [login.html](../prototipos/auth/login.html) | [Login.md](./vistas/auth/Login.md) |
| Registro | `/auth/register` | AuthLayout | Público | [register.html](../prototipos/auth/register.html) | [Register.md](./vistas/auth/Register.md) |
| Recuperar Contraseña | `/auth/forgot-password` | AuthLayout | Público | [recuperar-contrasena.html](../prototipos/auth/recuperar-contrasena.html) | [Recuperar-Contrasena.md](./vistas/auth/Recuperar-Contrasena.md) |

### 📋 Módulo Privado — Publicador (`authGuard`)

| Vista | Ruta | Layout | Prototipo | Archivo |
|---|---|---|---|---|
| Dashboard | `/dashboard` | AdminLayout | [dashboard.html](../prototipos/privada/dashboard.html) | [Dashboard.md](./vistas/privada/Dashboard.md) |
| Alertas | `/alertas` | AdminLayout | [alertas.html](../prototipos/privada/alertas.html) | [Alertas.md](./vistas/privada/Alertas.md) |
| Mi CV | `/mi-cv` | AdminLayout | [mi-cv.html](../prototipos/privada/mi-cv.html) | [Mi-CV.md](./vistas/privada/Mi-CV.md) |
| Datos Personales | `/datos-personales` | AdminLayout | [datos-personales.html](../prototipos/privada/datos-personales.html) | [Datos-Personales.md](./vistas/privada/Datos-Personales.md) |
| Perfil | `/perfil` | AdminLayout | [perfil.html](../prototipos/privada/perfil.html) | [Perfil.md](./vistas/privada/Perfil.md) |
| Experiencia | `/experiencia` | AdminLayout | [experiencia.html](../prototipos/privada/experiencia.html) | [Experiencia.md](./vistas/privada/Experiencia.md) |
| Educación | `/educacion` | AdminLayout | [educacion.html](../prototipos/privada/educacion.html) | [Educacion.md](./vistas/privada/Educacion.md) |
| Habilidades | `/habilidades` | AdminLayout | [habilidades.html](../prototipos/privada/habilidades.html) | [Habilidades.md](./vistas/privada/Habilidades.md) |
| Proyectos | `/proyectos` | AdminLayout | [proyectos.html](../prototipos/privada/proyectos.html) | [Proyectos.md](./vistas/privada/Proyectos.md) |
| Configuración | `/configuracion` | AdminLayout | [configuracion.html](../prototipos/privada/configuracion.html) | [Configuracion.md](./vistas/privada/Configuracion.md) |
| Editor CV | `/editor` | AdminLayout | [editor-cv.html](../prototipos/privada/editor-cv.html) | [Editor-CV.md](./vistas/privada/Editor-CV.md) |

### 👑 Módulo de Administración (`adminGuard`)

| Vista | Ruta | Layout | Prototipo | Archivo |
|---|---|---|---|---|
| Panel Admin | `/admin` | AdminLayout | [admin-panel.html](../prototipos/admin/admin-panel.html) | [Admin-Panel.md](./vistas/admin/Admin-Panel.md) |

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
       ├── PublicLayoutComponent   (/  /cvs  /cv/:id  /cv/:id/dashboard)
       │    ├── NavbarPublicComponent
       │    ├── <router-outlet>
       │    └── FooterPublicComponent
       │
       ├── AuthLayoutComponent     (/auth/login  /auth/register  /auth/forgot-password)
       │    └── <router-outlet>
       │
       └── AdminLayoutComponent    (/dashboard  /alertas  /mi-cv  /datos-personales
                                    /perfil  /experiencia  /educacion  /habilidades
                                    /proyectos  /configuracion  /editor  /admin)
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
