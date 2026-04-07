# Diseño UI — Portal CV

## Decisión: AdminLTE 4

**AdminLTE 4** es la plantilla seleccionada para el área privada (editor y dashboard). Es gratuita (MIT), compatible con Bootstrap 5 y no tiene dependencia de jQuery.

- NPM: `admin-lte@4`
- Bootstrap 5 incluido
- Documentación: https://adminlte.io

---

## 1. Análisis de las secciones de la aplicación

El portal tiene tres tipos de experiencia visual distintas, lo que requiere **tres layouts independientes**:

| Sección | Rutas | Layout | Descripción |
|---------|-------|--------|-------------|
| Pública | `/`, `/cvs`, `/cv/:id` | `PublicLayoutComponent` | Portal de reclutadores. Limpio, profesional. Sin sidebar. |
| Auth | `/auth/login`, `/auth/register` | `AuthLayoutComponent` | Página centrada. Patrón de login de AdminLTE. |
| Privada | `/editor/*`, `/dashboard/*` | `AdminLayoutComponent` | Panel completo AdminLTE: sidebar + topbar + área de contenido. |

### ¿Por qué AdminLTE no se aplica a la sección pública?

La sección pública es un **portal de consulta de CVs para reclutadores**, no un panel de administración. Aplicar el sidebar de AdminLTE aquí sería incorrecto visualmente. En cambio, usará Bootstrap 5 (incluido con AdminLTE) con un diseño personalizado limpio.

AdminLTE aplica directamente en:
- Login / Register → plantilla de página de autenticación de AdminLTE
- Editor de CV → sidebar con secciones del CV, área de edición principal
- Dashboard → tarjetas de estadísticas, tablas de alertas

---

## 2. Integración en Angular 20

### Opción elegida: CSS directo (sin librería wrapper)

No se usa ninguna librería wrapper de Angular para AdminLTE (como `ng-admin-lte`), ya que están desactualizadas (apuntan a AdminLTE 3) y no son compatibles con Angular 17+.

Integración directa:

```bash
npm install admin-lte@4
```

En `angular.json`, sección `styles`:

```json
"styles": [
  "node_modules/admin-lte/dist/css/adminlte.min.css",
  "src/styles.scss"
]
```

Los componentes Angular utilizan las clases CSS de AdminLTE directamente en sus templates. No se necesita ningún módulo adicional.

---

## 3. Arquitectura de layouts

### Layout actual (problemático para AdminLTE)

```
AppComponent
  └─ MainLayoutComponent          ← Layout único para todo
       ├─ HeaderComponent
       ├─ <router-outlet>
       │    ├─ public module
       │    ├─ auth module
       │    ├─ editor module
       │    └─ dashboard module
       └─ FooterComponent
```

Un solo `MainLayoutComponent` para todas las rutas es incompatible con los distintos patrones visuales necesarios (con/sin sidebar, página centrada, portal público).

### Layout propuesto (3 shells)

```
AppComponent
  └─ <router-outlet>
       ├─ PublicLayoutComponent (/  /cvs  /cv/:id)
       │    ├─ NavbarPublicComponent
       │    ├─ <router-outlet>
       │    └─ FooterPublicComponent
       │
       ├─ AuthLayoutComponent (/auth/login  /auth/register)
       │    └─ <router-outlet>       ← Página centrada sin navbar
       │
       └─ AdminLayoutComponent (/editor  /dashboard)
            ├─ SidebarComponent      ← Sidebar AdminLTE
            ├─ TopbarComponent       ← Barra superior AdminLTE
            └─ <router-outlet>       ← Contenido de la página
```

### Cambio en el enrutamiento

```typescript
// app-routing-module.ts — propuesto

const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', loadChildren: () => import('./features/public/...) },
    ]
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      { path: '', loadChildren: () => import('./features/auth/...) },
    ]
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'editor', loadChildren: () => import('./features/editor/...) },
      { path: 'dashboard', loadChildren: () => import('./features/dashboard/...) },
    ]
  }
];
```

---

## 4. Estructura de carpetas propuesta

```
frontend/src/app/layout/
  containers/
    public-layout.component.ts       ← Reemplaza MainLayoutComponent
    auth-layout.component.ts         ← Nuevo
    admin-layout.component.ts        ← Nuevo (AdminLTE shell)
  components/
    navbar-public/
      navbar-public.component.ts     ← Barra de navegación pública
    footer/
      footer.component.ts            ← Footer actual (reutilizable)
    sidebar/
      sidebar.component.ts           ← Sidebar AdminLTE (privado)
    topbar/
      topbar.component.ts            ← Topbar AdminLTE (privado)
```

---

## 5. Diseño por sección

### 5.1 Sección pública (`PublicLayoutComponent`)

Bootstrap 5 con diseño personalizado. Sin sidebar.

- **Landing** (`/`): Hero section con buscador de CVs, descripción del portal, CTA para registro.
- **Listado de CVs** (`/cvs`): Grid de tarjetas con foto, nombre, título profesional y tecnologías.
- **Detalle de CV** (`/cv/:id`): Vista completa del CV: foto, datos personales, experiencia, educación, habilidades.
- **Navbar**: Logo + links de navegación + botón "Iniciar sesión".
- **Footer**: Información básica del portal.

### 5.2 Sección Auth (`AuthLayoutComponent`)

Página centrada, fondo neutro. Usa el patrón de la plantilla de login de AdminLTE.

- **Login** (`/auth/login`): Tarjeta centrada con formulario, logo arriba.
- **Register** (`/auth/register`): Igual que login con campos adicionales.

AdminLTE 4 incluye páginas de ejemplo de login listas para adaptar.

### 5.3 Sección privada (`AdminLayoutComponent`)

Shell completo de AdminLTE 4.

**Sidebar — navegación:**
```
Portal CV
├── Mis CVs
├── Crear CV
└── Dashboard
    ├── Estadísticas
    └── Alertas
```

**Dashboard** (`/dashboard`):
- Tarjetas de métricas: total CVs, vistas del mes, visitas únicas.
- Tabla de alertas recientes (estilo AdminLTE).
- Gráficos de visitas por CV (librería de charts a definir: Chart.js o ngx-charts).

**Editor de CV** (`/editor`):
- Sidebar secundario (o tabs) con las secciones del CV: Datos personales, Experiencia, Educación, Habilidades, etc.
- Formulario principal en el área de contenido.
- Vista previa del CV (panel lateral o modal).

---

## 6. Paleta de colores / personalización

AdminLTE 4 usa variables CSS de Bootstrap 5, lo que facilita la personalización sin modificar la librería.

En `styles.scss`:

```scss
// Sobreescribir variables Bootstrap antes del import de AdminLTE
:root {
  --bs-primary: #2c7be5;   // Azul corporativo (ejemplo)
  --bs-secondary: #6c757d;
}
```

La paleta definitiva se definirá durante la implementación del branch `feat/hs-ui-design`.

---

## 7. Pendientes de implementación

| Tarea | Branch | Descripción |
|-------|--------|-------------|
| Instalar AdminLTE 4 + Bootstrap 5 | `feat/hs-ui-design` | `npm install admin-lte@4` y configurar `angular.json` |
| Crear 3 layout components | `feat/hs-ui-design` | `PublicLayoutComponent`, `AuthLayoutComponent`, `AdminLayoutComponent` |
| Refactorizar enrutamiento | `feat/hs-ui-design` | Separar módulos en su layout correspondiente, añadir `authGuard` en admin |
| Eliminar `MainLayoutComponent` | `feat/hs-ui-design` | Reemplazado por los 3 layouts |
| Implementar `SidebarComponent` | `feat/hs-ui-admin` | Navegación lateral AdminLTE para sección privada |
| Implementar `NavbarPublicComponent` | `feat/hs-ui-public` | Navbar responsive para sección pública |
| Diseño Landing page | `feat/hs-ui-public` | Hero + buscador + tarjetas de CVs |
| Diseño pages Auth | `feat/hs-ui-auth` | Login + Register con estilo AdminLTE |
| Diseño Dashboard | `feat/hs-ui-admin` | Tarjetas de métricas + tabla de alertas |
| Diseño Editor de CV | `feat/hs-ui-admin` | Formulario seccional + vista previa |
| Personalización de paleta | `feat/hs-ui-design` | Variables Bootstrap/AdminLTE en `styles.scss` |

---

## 8. Decisiones descartadas

| Opción | Razón de descarte |
|--------|------------------|
| AdminLTE 3.x | Requiere jQuery. Incompatible con el enfoque Angular moderno. |
| ng-admin-lte (librería Angular) | Sin mantenimiento desde Angular 14. No compatible con Angular 17+. |
| Material Design (Angular Material) | No tiene el look de panel de administración que se busca. |
| PrimeNG | Requiere licencia para algunos componentes. Overhead mayor. |
| Tailwind CSS | No aporta componentes de admin listos. Requeriría construir todo desde cero. |
