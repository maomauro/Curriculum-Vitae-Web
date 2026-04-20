# Inventario Minimo Local (Borrador)

## Objetivo
Definir, de forma simple, que identidades y secretos minimos deben existir en ambiente local para que el proyecto funcione.

## Regla
- No guardar valores reales (passwords, tokens, keys) en este archivo.
- Solo registrar nombre logico, uso, owner y estado.

## Items minimos (local)

| ID | Nombre logico | Tipo | Uso | Owner | Estado |
|---|---|---|---|---|---|
| L-DB-APP | `DB-APP-LOCAL` | Identidad DB app | Conexion runtime del backend a la base de datos |  | Pendiente |
| L-DB-ADM | `DB-ADM-LOCAL` | Identidad DB admin | Scripts, mantenimiento y cambios de esquema |  | Pendiente |
| L-AUTH-JWT | `AUTH-JWT-KEY-LOCAL` | Secreto | Firma de tokens JWT en local |  | Pendiente |
| L-DEMO-EMAIL | `AUTH-DEMO-EMAIL-LOCAL` | Configuracion | Usuario demo local (si aplica) |  | Opcional |
| L-DEMO-PASS | `AUTH-DEMO-PASSWORD-LOCAL` | Secreto | Password demo local (si aplica) |  | Opcional |

## Aclaraciones clave
- El backend usa solo `DB-APP-LOCAL` para operar.
- `DB-ADM-LOCAL` no se usa desde la aplicacion.
- Si se usa `Trusted_Connection=true`, la identidad DB puede ser la cuenta de Windows local en lugar de un login SQL.

## Ubicacion recomendada de secretos (local)
- `dotnet user-secrets` para backend.
- Nunca dejar secretos reales en `launchSettings.json` ni en `appsettings.json`.

## Checklist rapido
- [ ] Existe identidad de aplicacion para DB local.
- [ ] Existe identidad admin separada para tareas de BD.
- [ ] Existe `Jwt__Key` local.
- [ ] Si hay usuario demo, su password no esta en archivos versionados.
