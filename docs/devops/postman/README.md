# Postman - PortalCV

## Archivos

- `PortalCV-APIs.postman_collection.json` — coleccion unica, sirve para local y produccion (solo cambia el environment activo).
- `PortalCV-Produccion.postman_environment.json` — apunta al backend real en Azure Container Apps.
- `PortalCV-Local.postman_environment.json` — apunta al backend corriendo en Docker local (`localhost:5005`, ver `backend/README.md` / raiz `README.md` para levantarlo). Trae `authEmail`/`authPassword` precargados con un usuario de prueba ya registrado en la base local durante el desarrollo; si tu base local no lo tiene, registralo primero con `POST /api/auth/register` o cambia esas variables por un usuario propio.

## Autenticacion (cookie HttpOnly, no bearer manual)

El login (`POST /api/auth/login`) **ya no devuelve el JWT en el body**: el backend lo deja
en una cookie `HttpOnly` (`portalcv_auth`, `Secure`, `SameSite=None` en produccion). Postman
guarda esa cookie en su cookie jar (pestaña **Cookies** del dominio de `baseUrl`) y la reenvia
solo automaticamente en las siguientes requests al mismo dominio: no hay que copiar ningun
token a mano ni pegarlo en un header `Authorization`. Por eso las requests privadas/admin de
esta coleccion ya no tienen configurado un auth tipo Bearer.

Requisito: usar el cliente de escritorio de Postman (o uno con cookie jar habilitado) y correr
las requests en orden dentro de la misma sesion/workspace, para que la cookie capturada en el
login siga disponible en las siguientes llamadas.

## Pasos de uso

1. Importar la coleccion y **ambos** environments en Postman.
2. Seleccionar el environment segun donde quieras probar:
   - `PortalCV Local` — backend Docker en `localhost:5005` (recomendado para probar cambios antes de desplegar).
   - `PortalCV Produccion` — backend real en Azure.
3. Completar/revisar variables:
   - `authEmail`, `authPassword` (ya vienen cargados en `PortalCV Local` con un usuario de prueba)
   - `publicSlug` (slug de un CV publicado, por ejemplo `mao-cv`)
4. Ejecutar `POST /api/auth/login`. Postman guarda la cookie de sesion automaticamente
   (y, de paso, `jwtExpiracion` en el environment, solo informativo).
5. Ejecutar requests privados/admin: la cookie ya autentica sin pasos adicionales.

## Notas

- **Local**: el backend debe estar corriendo (`docker run ...` segun `README.md` de la raiz, o
  `dotnet run` desde `PortalCV.Api`). Si no responde, revisar `docker ps` / logs del contenedor.
- **Produccion**: la URL base apunta **directo al backend en Azure Container Apps** (no al
  frontend de SWA): la SPA en `*.azurestaticapps.net` no tiene un backend enlazado que reenvie
  `/api/*` — llamar a esas rutas contra el dominio de SWA devuelve el `index.html` de Angular,
  no la API.
  - `https://portalcv-api.wittyriver-e6fd0cd4.brazilsouth.azurecontainerapps.io`
  - Si cambia el hostname del Container App, actualizar `baseUrl` en el environment de
    Produccion (mismo valor que `apiBaseUrl` en `frontend/public/app-config.json`).
- Si algun request devuelve 401:
  - revisar en la pestaña Cookies de Postman si `portalcv_auth` sigue presente para el dominio
    de `baseUrl`; si no esta o vencio, volver a ejecutar login.
- Si algun request devuelve 404 en `/api` (con el environment de Produccion):
  - confirmar que `baseUrl` apunta al backend (ACA), no al frontend (SWA).

## Flujo recomendado rapido

1. `GET /health`
2. `POST /api/auth/login`
3. `GET /api/auth/me`
4. `GET /api/public/cvs`
5. `GET /api/cv/personales`
6. `GET /api/admin/roles` (solo usuario admin)
