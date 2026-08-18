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

Generado originalmente con [Angular CLI](https://github.com/angular/angular-cli) 20.1.1. No hay tests end-to-end configurados (Angular CLI no incluye uno por defecto); la cobertura de pruebas es solo unitaria (Karma/Jasmine, ver `npm run test`).
