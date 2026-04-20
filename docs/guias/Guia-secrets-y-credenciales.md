# Guia de Secrets y Credenciales

## Objetivo
Definir una forma segura y consistente de manejar contraseñas, tokens y llaves por entorno en el proyecto `Curriculum-Vitae-Web`, evitando exponer secretos en el repositorio y reduciendo alertas de seguridad en Sonar.

## Regla base
- No guardar secretos en archivos versionados (`appsettings.json`, `launchSettings.json`, `.env`, scripts SQL, etc.).
- No publicar secretos en Pull Requests, Issues, comentarios o capturas.
- Guardar secretos en:
  - `dotnet user-secrets` para desarrollo local.
  - GitHub Secrets/Environment Secrets para CI/CD.
  - Variables de entorno del servicio en runtime (o Key Vault cuando aplique).

## Clasificacion recomendada
- **Secretos (sensibles):**
  - Passwords de base de datos.
  - API keys y tokens.
  - JWT signing keys.
  - Connection strings con credenciales.
- **Variables no sensibles:**
  - `SONAR_ORGANIZATION`.
  - `SONAR_PROJECT_KEY`.
  - URLs publicas sin credenciales.
  - Flags de configuracion no critica.

## Nombres estandar de claves (backend)
Usar nombres consistentes para mapear a configuracion .NET:

- `ConnectionStrings__DefaultConnection`
- `Jwt__Key`
- `Jwt__Issuer`
- `Jwt__Audience`
- `Auth__DemoUser__Email`
- `Auth__DemoUser__Password`

> Nota: el separador `__` en variables de entorno equivale a `:` en configuracion de .NET.

## Estado esperado en archivos versionados

### `appsettings.json`
- Permitir placeholders vacios para valores sensibles.
- Ejemplo:
  - `"ConnectionStrings": { "DefaultConnection": "" }`
  - `"Jwt": { "Key": "" }`
  - `"Auth": { "DemoUser": { "Password": "" } }`

### `Properties/launchSettings.json`
- No poner llaves o passwords reales.
- Usar cadena vacia o marcador:
  - `"Jwt__Key": "__SET_IN_USER_SECRETS__"`
  - `"Auth__DemoUser__Password": "__SET_IN_USER_SECRETS__"`

## Desarrollo local (gratis, recomendado)
Para cada desarrollador, configurar secretos en su maquina con `dotnet user-secrets`.

Desde `backend/PortalCV.Backend/PortalCV.Api`:

```powershell
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=...;Database=...;User Id=...;Password=..."
dotnet user-secrets set "Jwt:Key" "una-clave-larga-y-segura"
dotnet user-secrets set "Jwt:Issuer" "PortalCV.Api"
dotnet user-secrets set "Jwt:Audience" "PortalCV.Client"
dotnet user-secrets set "Auth:DemoUser:Email" "demo@portalcv.com"
dotnet user-secrets set "Auth:DemoUser:Password" "password-local-seguro"
```

Comandos utiles:

```powershell
dotnet user-secrets list
dotnet user-secrets remove "Auth:DemoUser:Password"
dotnet user-secrets clear
```

## CI/CD (GitHub Actions)
Configurar secretos en:
- `Settings -> Secrets and variables -> Actions` (repo).
- Recomendado: `Settings -> Environments` con separacion por entorno.

### Environments sugeridos
- `develop`:
  - secretos de desarrollo/integracion.
- `production`:
  - secretos de produccion.
  - con reviewers/aprobacion para despliegues (si aplica).

### SonarCloud (actual en el repo)
Para habilitar analisis Sonar en CI:
- Secret:
  - `SONAR_TOKEN`
- Variables:
  - `SONAR_ORGANIZATION`
  - `SONAR_PROJECT_KEY`

## Runtime en nube (develop/prod)
- Inyectar secretos como variables de entorno en el servicio.
- No depender de secretos embebidos en imagen Docker o artefactos build.
- Usar credenciales diferentes para `develop` y `production`.
- Rotar secretos periodicamente y ante cualquier exposicion.

## Politica de rotacion y respuesta
Si un secreto se expone por error:
1. Revocar/rotar inmediatamente el secreto comprometido.
2. Eliminar el valor del codigo y reemplazar por placeholder.
3. Publicar fix via PR.
4. Verificar Sonar y CI.
5. Documentar incidente de forma breve en el historial del equipo.

## Checklist rapido antes de abrir PR
- [ ] No hay contraseñas, tokens ni keys en archivos versionados.
- [ ] `launchSettings.json` no contiene secretos reales.
- [ ] `appsettings*.json` mantiene placeholders vacios para secretos.
- [ ] Los secretos necesarios existen en `user-secrets` local.
- [ ] Los secretos/variables de CI (`develop`/`production`) estan configurados.
- [ ] Sonar no reporta `hard-coded credential` en los cambios nuevos.

## Errores comunes
- Subir `.env` con credenciales reales.
- Reutilizar password de `develop` en `production`.
- Guardar `Jwt__Key` en claro en `launchSettings.json`.
- Compartir secretos por chat o capturas.

## Resumen
La aplicacion debe leer configuracion desde `IConfiguration`, pero los valores sensibles deben venir siempre desde fuentes seguras por entorno (`user-secrets`, GitHub Secrets, variables runtime). Esta practica mejora seguridad, cumplimiento y estabilidad del pipeline.
