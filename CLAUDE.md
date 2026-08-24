# CLAUDE.md

Este archivo brinda contexto a Claude Code (claude.ai/code) al trabajar con código en este repositorio.

## Descripción general del proyecto

PortalCV: un portal que conecta a profesionales (publicadores de CV) con reclutadores. Cada usuario controla si su CV está **publicado** (visible en búsqueda/detalle público) o en **borrador** (edición privada únicamente). Solo los publicadores y administradores necesitan registrarse/autenticarse. Monorepo: backend en **.NET 10** (Clean Architecture) + frontend en **Angular 20**, base de datos **SQL Server**, todo desplegado en **Azure** (Container Apps + Static Web Apps + Azure SQL) mediante una imagen Docker publicada en GHCR.

Todo el código, comentarios, mensajes de commit y documentación de este repositorio están escritos en **español**. Mantené esa convención al editar.

Respondé siempre en español en el chat, sin excepción, independientemente del idioma en que esté escrito el código o los archivos.

## Comandos

### Backend (`backend/PortalCV.Backend`)

```bash
# Ejecutar una sola clase de test / un solo test
dotnet test backend/PortalCV.Backend/PortalCV.Api.Tests/PortalCV.Api.Tests.csproj --filter "FullyQualifiedName~CvGeneradoEndpointTests"
dotnet test backend/PortalCV.Backend/PortalCV.Api.Tests/PortalCV.Api.Tests.csproj --filter "FullyQualifiedName~CvGeneradoEndpointTests.GenerarCv_PerfilValido_CreaYDevuelveDto"
```

Swagger UI se sirve en `http://localhost:{puerto}/swagger` cuando está corriendo.

### Frontend (`frontend`)

```bash
ng serve                                    # http://localhost:4200, redirige /api y /health a :5005

npm run build -- --configuration production # build de producción → dist/

npx ng test --watch=false --browsers=ChromeHeadless           # sin interfaz, corrida única (usar esta)
npx ng test --watch=false --browsers=ChromeHeadless --include='**/mi-cv.component.spec.ts'  # un solo archivo spec
```

No hay tests e2e configurados — solo tests unitarios con Karma/Jasmine.

Si la API no está en el puerto 5005, configurá `PORTALCV_API_PROXY_TARGET` antes de `npm start` (ver comentario en `frontend/proxy.conf.js`).

### Base de datos

No se usan migraciones de EF Core. El SQL está escrito a mano y vive en `scripts/`:

- `scripts/manual/01_CreateSchema.sql` — esquema completo de arranque local (drop+create).
- `scripts/production/05_AzureSQL_CreateSchema.sql` — esquema completo de arranque para Azure (drop+create). **Nunca volver a ejecutar contra una base de datos con datos reales.**
- `scripts/production/NN_*.sql` — migraciones incrementales numeradas para una base de datos Azure existente (estilo `IF OBJECT_ID(...) IS NULL CREATE TABLE...`, seguro de re-ejecutar). Al agregar una tabla/columna, agregá el siguiente script incremental numerado acá *y* reflejá el mismo cambio tanto en `01_CreateSchema.sql` (manual) como en `05_AzureSQL_CreateSchema.sql` (producción) para que sigan siendo la referencia completa. Renombrar una tabla/columna existente que pueda tener datos reales → usar `sp_rename` en el script incremental, no drop+recreate.
- Aplicar localmente en SQL Server con `sqlcmd` — este proyecto ha tenido problemas de UTF-8/texto acentuado antes, así que siempre ejecutá `chcp.com 65001` primero y pasá `-f 65001 -C` a `sqlcmd`.

`database/01_CreateSchema.dbml` (visualizar en dbdiagram.io) y `database/DiccionarioDeDatos.md` están pensados para reflejar el esquema, pero **históricamente han quedado desactualizados** respecto a `scripts/` — tratá los scripts SQL como la fuente de verdad, no estos documentos, y verificá antes de confiar en cualquiera de los dos.

### Docker (solo backend — así se despliega a Azure Container Apps)

```bash
cd backend && docker build -f Dockerfile -t portalcv-backend:local .
# copiar docker/backend.local.env.example -> docker/backend.local.env (ignorado por git) y completar valores reales primero
docker run --rm -p 5005:8080 --add-host=host.docker.internal:host-gateway --env-file docker/backend.local.env --name portalcv-api-local portalcv-backend:local
curl http://localhost:5005/health
```

La imagen de runtime es mínima (`mcr.microsoft.com/dotnet/aspnet:10.0`, sin pasos apt-get) — esto es una restricción real: cualquier dependencia nueva agregada al backend debe ser puramente administrada/sin dependencias nativas, o fuerza un cambio en el Dockerfile. Esto ya definió dos decisiones en este código base: QuestPDF en lugar de un renderizador de PDF con navegador headless, y MailKit (administrada) en lugar de cualquier librería SMTP nativa.

### CI (`.github/workflows/ci.yml`)

Tres jobs: `backend` (`dotnet build` + `dotnet test` con cobertura), `frontend` (`npm run lint` + `npm run lint:pilots` + build de producción + `npm run test -- --configuration=ci`), `sonarcloud` (quality gate, necesita ambos). Reproducí estos comandos localmente antes de hacer push.

## Arquitectura

### Backend: Clean Architecture, 4 capas + 1 proyecto de tests

`PortalCV.Backend.slnx` contiene `PortalCV.Domain` → `PortalCV.Application` → `PortalCV.Infrastructure` → `PortalCV.Api`, las dependencias solo apuntan hacia adentro, más `PortalCV.Api.Tests`.

- **Domain**: entidades simples, sin dependencias externas, namespace plano `PortalCV.Domain.Entities` sin importar la subcarpeta física.
- **Application**: solo interfaces + DTOs, sin lógica. Namespaces planos (`PortalCV.Application.Interfaces`, `PortalCV.Application.DTOs.Privada`, etc.) sin importar la subcarpeta.
- **Infrastructure**: EF Core (`PortalCvDbContext`, una clase `Configurations/*.cs` por entidad para el mapeo de tablas), repositorios, y todos los servicios concretos. Namespace plano `PortalCV.Infrastructure.Services`.
- **Api**: controladores, configuración JWT/CORS, `GlobalExceptionMiddleware` (mapea `KeyNotFoundException`→404, `UnauthorizedAccessException`→403, todo lo demás→500).

Las subcarpetas físicas en las cuatro capas siguen las mismas tres zonas funcionales (reflejan `docs/diseño/prototipos/`): `Auth/` (identidad, roles, auditoría de auth), `Privada/` (el área del editor de CV — todo lo que el publicador edita/gestiona), `Publica/` (búsqueda/detalle/contacto público sin autenticación). Un puñado de servicios transversales (auditoría, auditoría de admin) viven en la raíz de su capa en lugar de en una carpeta de zona.

Flujo de una petición: `Middleware → Controller (lee claims del JWT) → I{Service/Repository} (Application) → {Service/Repository} (Infrastructure) → PortalCvDbContext → SQL Server`.

`DependencyInjection.cs` (`AddInfrastructure`) es el único punto de registro para cada servicio/repositorio; `Program.cs` solo lo invoca.

### Auth (JWT en una cookie HttpOnly, no en localStorage)

`AuthController` coloca el JWT en una cookie `HttpOnly` (`portalcv_auth`), no en el cuerpo de la respuesta, para mantenerlo fuera del alcance de XSS. `Secure=true; SameSite=None` en Producción (el SPA y la API son dominios distintos), `Secure=false; SameSite=Lax` en Desarrollo (con proxy a través de `ng serve`, mismo origen aparente). El pipeline de `JwtBearer` acepta el token desde el header `Authorization: Bearer` **o** desde la cookie, así que los clientes que no son SPA (Postman, scripts) siguen funcionando con el header. `GET /api/auth/me` es cómo el frontend restaura el estado de sesión después de un reload, ya que no puede leer la cookie HttpOnly por sí mismo. Claims: `sub`, `email`, `nombre`, `role`, `curriculum_id` — `CvControllerBase` lee `curriculum_id` para que cada controlador privado sepa con qué CV operar sin que el frontend tenga que pasar un id nunca. Roles: `Visitante`, `Publicador`, `Admin`.

### Arquitectura de proveedores de IA / prompts

Esta es la parte menos evidente del backend y abarca varios archivos:

- Cada `Curriculum` puede tener varias filas `ProveedorIa` guardadas (Claude/Gemini/Groq/Ollama), una activa a la vez. La clave de API se cifra en reposo con `IApiKeyCipher`/`AesGcmApiKeyCipher` (AES-256-GCM, singleton, clave desde config `Encryption:Key`) y **nunca** vuelve a salir de ningún endpoint, ni cifrada ni en texto plano — los DTOs de respuesta simplemente la omiten. Una contraseña/clave en blanco en una solicitud de actualización significa "mantener la existente".
- Los cuatro proveedores implementan `IAiProviderClient` y se registran vía `AddHttpClient<IAiProviderClient, TImpl>("ia-<name>", ...)` — cada uno **necesita un nombre explícito** en `DependencyInjection.cs` porque comparten el mismo `TClient`, o ASP.NET Core lanza una excepción cuando se resuelve la segunda implementación. Ollama tiene un timeout HTTP mucho más largo (300s vs 60s) ya que típicamente es un modelo local/auto-hospedado sobre CPU, a veces tunelizado (ngrok).
- Cada flujo de "pedirle a la IA JSON estructurado" (extraer una oferta, seleccionar/hacer match de un Perfil, generar un CV condensado, redactar un correo para reclutador, etc.) pasa por el mismo `IIaPromptInvoker.InvocarAsync(curriculumId, codigoPrompt, contenidoPromptPorDefecto, valores, imagenBytes?, imagenContentType?, ct)`: resuelve el proveedor activo, descifra la clave, resuelve la versión activa del `PromptIa` propio del CV para `codigoPrompt` (o usa el texto por defecto codificado si no existe), sustituye los placeholders `{{MARCADOR}}` y llama al proveedor. Quien llama solo provee el código del prompt, sus marcadores, y cómo parsear la respuesta JSON (vía `RespuestaIaJsonParser.Parsear<T>`, que quita los fences ```json y deserializa sin distinguir mayúsculas/minúsculas).
- Los textos de prompts por defecto viven como constantes en `PortalCV.Application.Constants.PromptsPorDefecto`. Un usuario solo ve un prompt en la UI "Prompts de IA" una vez que ha creado su propia fila `PromptIa` con ese código — no hay un registro que actualizar al agregar un nuevo prompt.
- Las filas de `PromptIa` son de solo-append/versionadas por `(CurriculumId, Codigo)`: editar inserta una fila nueva y desactiva la anterior en lugar de sobrescribir. La versión activa por `(CurriculumId, Codigo)` se cachea en `IMemoryCache` por 30 min y se invalida al crear/activar (`PromptIaRepository`).
- Las reglas de negocio que reducen/filtran el payload enviado a la IA (por ej. "solo las 3 Experiencias más recientes", "solo Pregrado/Posgrado/Diplomado/Certificacion") pertenecen al servicio de C#, no al texto del prompt — el prompt solo recibe instrucciones de idioma/criterio.

### Flujo Oferta → Perfil → CV → correo

`OfertaAnalisisService` (extrae cargo/empresa/etc. de texto pegado o una imagen subida) → `PerfilSeleccionService` (la IA sugiere reutilizar un `Perfil` existente) → el usuario elige/confirma un `Perfil` → si ese `Perfil` ya tiene un `CvGenerado` (construido de antemano desde "Mi CV", uno por Perfil, regenerar lo reemplaza), `OfertaEnvioService` redacta un correo para el reclutador con IA (prompt `REDACTOR_CORREO_OFERTA`, usando solo datos de Oferta+Perfil — nunca el CV completo, ya que eso va como adjunto PDF) y lo envía vía `IEmailSender`/`MailKitEmailSender`, con el CV renderizado en el servidor a PDF vía `ICvPdfRendererService`/`CvPdfRendererService` (QuestPDF — un layout profesional genérico único, deliberadamente **sin** intentar reproducir las 5 plantillas de color en pantalla, para evitar una tercera implementación duplicada de "cómo se ve cada plantilla"; ver el siguiente párrafo). `Oferta.Estado` avanza `Analizada → PerfilAsignado → EnviadaPorCorreo`. La configuración SMTP por CV vive en `ConfiguracionCorreo` (mismo patrón de secreto cifrado que `ProveedorIa`); la dirección de envío siempre es `Personales.Email` — no hay un campo separado de login SMTP.

### La duplicación de "plantilla" (plantilla visual de CV) es real y conocida

Las 5 plantillas de color de CV ("Profesional", "Corporativo", etc.) están implementadas como un componente **compartido** `app-cv-plantilla-preview` para la vista estructurada Profesional, pero **Mi CV** (que muestra el contenido condensado por IA de `CvGenerado` — bloques de texto narrativo, no entidades estructuradas) tiene su propia segunda implementación hecha a mano de las mismas plantillas visuales, porque las formas de los datos no coinciden (texto condensado vs. entidades estructuradas como filas de `Experiencia`/`Formacion`). Esta es una duplicación confirmada y conocida, no un descuido — un bug visual de plantilla se ha tenido que arreglar dos veces en este código base por esta razón. Tené en cuenta, al tocar los visuales de las plantillas (colores, layout del sidebar, etc.), que los cambios usualmente necesitan aplicarse en ambos lugares para mantenerse sincronizados, y es exactamente por esto que el adjunto PDF de los correos usa deliberadamente un layout genérico simple en lugar de una tercera reimplementación.

### Secretos

Nunca hardcodeados en `appsettings.json`/`launchSettings.json`. Tres lugares distintos según cómo se ejecute:

| Cómo lo ejecutás | Dónde viven los secretos |
|---|---|
| `dotnet run` / IDE | `dotnet user-secrets` (perfil por usuario del SO, no está en el repo) |
| Docker local | `docker/backend.local.env` (ignorado por git; copiar desde `.example`) |
| CI / Azure Container Apps | variables de entorno / Key Vault |

Requeridos localmente: `ConnectionStrings:DefaultConnection`, `Jwt:Key` (≥32 caracteres), `Encryption:Key` (base64 AES-256, 32 bytes — sin esto, cada endpoint `api/cv/proveedor-ia` y `api/cv/configuracion-correo` devuelve 500). `dotnet user-secrets set` usa sintaxis de dos puntos (`Seccion:Clave`); el doble guion bajo (`Seccion__Clave`) es solo para variables de entorno y **no** es traducido por user-secrets.

Si se le pide a un usuario que provea un secreto (contraseña SMTP, una clave de API de IA, etc.), debe ingresarse a través de la propia UI de la aplicación — nunca pegarlo en el chat ni escribirlo vos mismo en un archivo.

### Estructura del frontend

Angular 20, ruteo standalone-módulo-por-zona (chunks lazy `private-module`, `public-module`, `auth-module`). `src/app/core/services/{admin,auth,cv,private,public,shared}` refleja la misma división de zonas Auth/Privada/Publica que el backend. `src/app/features/{admin,auth,private,public}/pages` contiene los componentes de página ruteados; `frontend/src/app/features/private/pages` es por lejos el más grande (el editor de CV + Mi CV + Analizar Oferta + Configuración, etc.).

### Tests del backend

`PortalCV.Api.Tests` son tests de integración con xUnit que levantan el host real de la API vía `WebApplicationFactory<Program>` con EF Core **InMemory** en lugar de SQL Server (`TestWebApplicationFactory` aísla el proveedor para que InMemory/SqlServer no colisionen) — no se necesita una base de datos real para correr los tests.