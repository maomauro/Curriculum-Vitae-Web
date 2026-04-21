# Inventario Minimo Local

## Objetivo
Definir, de forma simple, que identidades y secretos minimos deben existir en ambiente local para que el proyecto funcione.

## Regla
- No guardar valores reales (passwords, tokens, keys) en este archivo.
- Solo registrar nombre logico, uso, owner y estado.

## Items minimos (local)

| ID | Nombre logico | Tipo | Uso | Owner | Estado |
|---|---|---|---|---|---|
| L-DB-APP | `DB-APP-LOCAL` (`portalcv_app`) | Identidad DB app | Conexion runtime del backend a `PortalCV` cuando se corre en Docker (SQL Auth) | maomauro | Activo |
| L-DB-ADM | `DB-ADM-LOCAL` | Identidad DB admin | Crear/alterar esquema y jobs; usa Windows Auth del desarrollador o `sa` de `SQLEXPRESS` | maomauro | Activo |
| L-DB-TRUSTED | `DB-TRUSTED-LOCAL` | Identidad Windows | Ejecucion nativa via `dotnet run` con `Trusted_Connection=true` (ver `launchSettings.json`) | maomauro | Activo |
| L-AUTH-JWT | `AUTH-JWT-KEY-LOCAL` | Secreto | Firma de tokens JWT en local | maomauro | Activo (en `docker/backend.local.env`) / Pendiente en `dotnet user-secrets` |
| L-DEMO-EMAIL | `AUTH-DEMO-EMAIL-LOCAL` | Configuracion | Usuario demo local (si se usa) | maomauro | No configurado (opcional) |
| L-DEMO-PASS | `AUTH-DEMO-PASSWORD-LOCAL` | Secreto | Password demo local (si se usa) | maomauro | No configurado (opcional) |

## Aclaraciones clave
- El backend usa solo `DB-APP-LOCAL` (`portalcv_app`) para operar cuando corre en Docker contra la base local.
- `DB-ADM-LOCAL` no se usa desde la aplicacion; solo para tareas manuales de DBA (crear el login `portalcv_app`, aplicar scripts de `scripts/manual/`).
- En el flujo nativo (`dotnet run`) se usa `Trusted_Connection=true` — la identidad DB es la cuenta de Windows del desarrollador, no un login SQL.
- `Jwt__Key` debe tener como minimo 32 caracteres. En PowerShell se puede generar con:
  `[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))`

## Ubicacion recomendada de secretos (local)

| Flujo | Donde vive el secreto | Archivo de referencia |
|---|---|---|
| Nativo (`dotnet run` / F5) | `dotnet user-secrets` (perfil del SO) | — (fuera del repo) |
| Docker local (`docker run --env-file`) | `docker/backend.local.env` | Plantilla en `docker/backend.local.env.example` |

Nunca dejar secretos reales en `launchSettings.json` ni en `appsettings.json`.

## Checklist rapido
- [x] Existe identidad de aplicacion para DB local (`portalcv_app` con `db_datareader` + `db_datawriter`).
- [x] Existe identidad admin separada para tareas de BD (Windows Auth del dev).
- [x] Existe `Jwt__Key` local para el flujo Docker (`docker/backend.local.env`).
- [ ] `Jwt__Key` cargado en `dotnet user-secrets` para el flujo nativo.
- [x] Si hay usuario demo, su password no esta en archivos versionados.

> Este inventario aplica al entorno local. Para develop/prod ver [Guia-inventario-secrets-por-ambiente.md](./Guia-inventario-secrets-por-ambiente.md).
