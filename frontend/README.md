# Frontend — PortalCV (`portalcv-web`)

Aplicación **Angular 20** del portal (zona pública, autenticación y panel privado). Los servicios HTTP usan rutas relativas **`/api/...`** y readiness en **`/health/...`**; en local, `proxy.conf.js` reenvía ambas rutas al backend (por defecto `http://localhost:5005`; opcional `PORTALCV_API_PROXY_TARGET`).

## Requisitos

- Node.js **22** (alineado con CI; ver [`.github/workflows/ci.yml`](../.github/workflows/ci.yml))
- `npm ci` para instalar dependencias reproducibles

## Servidor de desarrollo

```bash
cd frontend
npm ci
ng serve
```

Abre `http://localhost:4200/`. Los cambios recargan en caliente.

**Producción:** `npm run build -- --configuration production` (salida en `dist/`). El hosting debe servir el SPA y resolver `/api` (y, si aplica readiness directo, `/health`) hacia la API (proxy inverso, Static Web Apps con API enlazada, etc.).

## Calidad de código (ESLint)

- `npm run lint`: lint general del frontend (reporta warnings y falla solo con errores).
- `npm run lint:strict`: mismo lint general, pero falla también por warnings.
- `npm run lint:private:strict`: piloto estricto sobre `src/app/features/private/pages` (sin warnings ni errores en TS de esa carpeta).
- `npm run lint:public:strict`: piloto estricto sobre `src/app/features/public/pages` (mismo enfoque gradual del piloto privado).
- `npm run lint:layout:strict`: piloto estricto sobre `src/app/layout`.
- `npm run lint:core-services:strict`: piloto estricto sobre `src/app/core/services`.
- `npm run lint:admin-pages:strict`: piloto estricto sobre `src/app/features/admin/pages`.
- `npm run lint:pilots`: ejecuta todos los pilotos estrictos por zonas en una sola corrida.

---

## Plantilla Angular CLI (referencia)

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.1.

### Development server (genérico)

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
