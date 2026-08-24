# Roadmap: Flujo de Ofertas + IA real

Documento vivo para no perder la línea en esta funcionalidad — se va a ir ampliando
en el camino. No confundir con [Backlog.md](Backlog.md) (backlog general del
producto): este archivo es específico del flujo Oferta → Perfil → CV generado.

**Estado general: Fase 0, Fase 0.5, Fase 1, Fase 2, Fase 3 y Fase 4 completas —
el flujo completo Oferta → Perfil → CV generado es full-stack real de punta a punta.**

---

## 1. Resumen del flujo

1. El postulante pega texto o sube una imagen de una oferta laboral en "Analizar Oferta".
2. Se llama a un proveedor de IA real (ej. Claude) usando el prompt activo `EXTRACTOR_OFERTA`
   (tabla `PromptIa`) para extraer los datos de la oferta.
3. Esos datos se guardan en una tabla nueva `Oferta` — historial de ofertas que el
   postulante va gestionando. CRUD completo, vive en la vista "Analizar Oferta".
4. La tabla `Oferta` también sirve para evitar guardar la misma oferta dos veces.
5. Con la oferta guardada + los perfiles existentes del postulante...
6. ...se llama al prompt activo `SELECTOR_PERFIL` para que la IA decida si reutilizar
   un `Perfil` existente o sugerir crear uno nuevo, alineado a esa oferta.
7. Con oferta + perfil + los datos base del CV (Experiencia/Educación/Habilidades/etc.),
   se llama al prompt activo `GENERADOR_CV_ATS`, y el resultado se guarda como JSON en
   una tabla nueva, para que `/mi-cv` lo use.

Todo el flujo depende de los 3 prompts que ya existen en `PromptIa` (self-service,
editables por el usuario, versionados) — esta funcionalidad es lo que finalmente les
da uso real.

---

## 2. Decisiones

- [x] **`/mi-cv`**: se **reemplaza** la vista actual. Pasa a mostrar los CVs que arma la
      IA (uno por oferta/postulación). Cada CV debe poder verse/descargarse en **PDF** o
      como lista lista para imprimir. Deben ser **compactos** (formato ATS, no extensos)
      — la tabla en JSON (sección 3) es justo para tener a mano cuáles CVs se han
      generado.
- [x] **Duplicados en `Oferta`**: se arranca con la propuesta simple — único
      `(CurriculumId, Cargo, Empresa)` normalizado. Mejoras (matching difuso, etc.) se
      agregan más adelante si hace falta.
- [x] **Proveedor de IA**: **cada usuario configura su propia conexión** desde
      `/configuracion` (proveedor + modelo + clave de API), no una key única del portal.
      Maqueta ya hecha (ver sección 5) — falta el backend real.
- [x] **Si falta algún prompt**: el portal trae **prompts sugeridos por defecto**
      (`EXTRACTOR_OFERTA` / `SELECTOR_PERFIL` / `GENERADOR_CV_ATS`), y el usuario los
      puede modificar como cualquier otro prompt propio. Pendiente: decidir si se
      siembran al crear el `Curriculum`, o se sirven como fallback de solo-lectura hasta
      que el usuario los "adopte" (guarda su propia versión).
- [x] **Sustitución de marcadores**: construido — `IPromptEnsambladorService`, ver
      sección 4 (decisión final: un solo marcador de texto por prompt, la imagen viaja
      aparte como adjunto multimodal, no sustituida como texto).
- [ ] **Costos / límites**: ¿rate limiting por usuario? ¿límite de análisis por día?
      (Ahora es más fácil de acotar: como la key es del propio usuario, el costo lo
      asume él — igual conviene un límite razonable para evitar loops por error del frontend.)
      Sigue sin implementar — el único límite hoy es el timeout de 60s del HttpClient.
- [x] Manejo de errores cuando la IA devuelve algo que no calza con el `FormatoSalida`
      esperado: `RespuestaIaJsonParser` tolera que la respuesta venga envuelta en un
      bloque ```json ... ``` y traduce cualquier fallo de parseo a un 400 con mensaje
      claro (`ApiMessages.Ia.RespuestaNoEsJsonValido`) — no se persiste nada a medias.

---

## 3. Estructura de datos — ✅ ambas tablas construidas

### Tabla `Oferta`

| Columna | Tipo | Notas |
|---|---|---|
| OfertaId | int PK | |
| CurriculumId | int FK → Curriculum, ON DELETE CASCADE | Dueño, mismo patrón que Perfil/Experiencia/PromptIa |
| Cargo | nvarchar(150) NOT NULL | |
| Empresa | nvarchar(150) NOT NULL | |
| Descripcion | nvarchar(max) NULL | |
| CorreoReclutador | nvarchar(150) NULL | |
| NombreReclutador | nvarchar(150) NULL | |
| TextoOriginal | nvarchar(max) NOT NULL | Texto pegado y/o nota de la imagen adjunta (ver Fase 2) |
| OrigenEntrada | nvarchar(20) NOT NULL | `texto` \| `imagen` \| `ambos` |
| Estado | nvarchar(20) NOT NULL | `Analizada` → `PerfilAsignado` → `CvGenerado` |
| PerfilId | int FK → Perfil, NULL | Se llena en el paso 6 |
| FechaAnalisis | datetime2(0) NOT NULL | |

Índice único propuesto: `(CurriculumId, Cargo, Empresa)` normalizado (trim + mayúsculas)
— mismo patrón que la unicidad de `Codigo` en `PromptIa`.

Ejemplos:
```
Cargo: Desarrollador Backend .NET             | Empresa: Grupo Bancario Andino | Estado: Analizada      | PerfilId: NULL
Cargo: Desarrollador Frontend Angular Senior  | Empresa: Tecnalia Software     | Estado: PerfilAsignado | PerfilId: 2
```

### Tabla `CvGenerado`

`/mi-cv` lista estos registros (uno por Oferta), cada uno visualizable como texto ATS
compacto con "Descargar / Imprimir PDF" (vía el diálogo de impresión del navegador, sin
librería de generación de PDF en el backend — ver Fase 4).

| Columna | Tipo | Notas |
|---|---|---|
| CvGeneradoId | int PK | |
| CurriculumId | int FK → Curriculum, ON DELETE CASCADE | Dueño |
| OfertaId | int FK → Oferta, ON DELETE NO ACTION, único | Uno por oferta -- regenerar reemplaza el contenido |
| PerfilId | int FK → Perfil, NULL, ON DELETE NO ACTION | Perfil usado (existente o recién creado) |
| ContenidoJson | nvarchar(max) NOT NULL | `ContenidoCvGeneradoDto` serializado (ver abajo) |
| PromptPorDefecto | bit NOT NULL DEFAULT 0 | Congela si se usó el prompt `GENERADOR_CV_ATS` por defecto al momento de generar |
| FechaGeneracion | datetime2(0) NOT NULL | |

`OfertaId`/`PerfilId` son `ON DELETE NO ACTION` (no `CASCADE`): `Curriculum` ya cascadea
directo hacia `CvGenerado`, y una segunda ruta de cascada vía `Oferta` o `Perfil`
chocaría con la primera (error 1785 de SQL Server) — mismo patrón que `Oferta.PerfilId`.

Schema final de `ContenidoJson` (`ContenidoCvGeneradoDto`, similar al mock original de
`analizar-oferta.component.ts` que ahora reemplaza):
```json
{
  "contacto": { "nombreCompleto": "...", "email": "...", "celular": "...", "ciudad": "...", "pais": "..." },
  "resumen": "...",
  "experiencia": ["...", "..."],
  "educacion": ["...", "..."],
  "habilidades": ["...", "..."]
}
```
`contacto` se llena directo desde `Personales` (nunca confiado a la IA, para no
arriesgarse a que alucine un correo o celular); el resto lo genera la IA a partir de
Experiencia/Formación/Habilidades con `MostrarEnCv=true` del CV (mismo criterio que ya
usa el resto del portal para "lo que el usuario quiere representarlo profesionalmente").

---

## 4. Diseño: sustitución de marcadores y flujo de invocación a la IA — ✅ construido

**Dónde ocurre:** `IPromptEnsambladorService`/`PromptEnsambladorService` (regex sobre
`{{MARCADOR}}`): recibe el `Contenido` ya ensamblado del prompt activo (el texto que ya
arma `PromptIaService.EnsamblarContenido`) más un diccionario `{marcador: valor}`, y
reemplaza cada `{{MARCADOR}}` por su valor. Valida contra el `Contenido` ORIGINAL (no el
ya sustituido) antes de reemplazar, para que un valor sustituido que a su vez contenga
`{{algo}}` en texto libre (p. ej. una oferta pegada citando una plantilla) no se
reinterprete como marcador sin resolver. Si algún `{{...}}` del prompt no tiene valor en
el diccionario, lanza `ArgumentException` con el nombre del marcador (p. ej. *"El prompt
activo referencia un marcador desconocido: {{FOO}}"*) en vez de mandarle a la IA un
prompt roto.

Los tres pasos (`IOfertaAnalisisService`, `IPerfilSeleccionService`, `ICvGeneradoService`)
comparten la orquestación común (resolver proveedor activo → descifrar clave → resolver
prompt activo o su fallback por defecto → ensamblar → llamar al proveedor) a través de
`IIaPromptInvoker`/`IaPromptInvoker` — cada servicio solo aporta su Código de prompt, sus
marcadores, y el parseo del JSON de salida que espera (`RespuestaIaJsonParser`, tolera
que la IA envuelva la respuesta en un bloque ```json ... ```).

**Marcadores fijos por Código de prompt** (el usuario edita el texto alrededor, pero los
nombres de marcador los define el sistema, no el usuario):

| Código | Marcadores | Quién los llena |
|---|---|---|
| `EXTRACTOR_OFERTA` | `{{OFERTA_TEXTO}}` | Texto pegado por el usuario, o texto ya extraído si vino de imagen |
| `SELECTOR_PERFIL` | `{{OFERTA_JSON}}`, `{{PERFILES_JSON}}` | La `Oferta` recién guardada + lista de `Perfil` del CV, serializados |
| `GENERADOR_CV_ATS` | `{{PERFIL_JSON}}`, `{{CURRICULUM_JSON}}`, `{{OFERTA_JSON}}` | Perfil elegido + agregado de Experiencia/Formación/Habilidades/Personales + la oferta |

**Entrada por imagen — pegar desde el portapapeles (Ctrl+V):** ✅ hecho. Confirmado con
el usuario que el caso de uso real es copiar la captura de una oferta (p. ej. de un
grupo de WhatsApp) y pegarla directo, no subir un archivo. Se agregó `onPaste` en
`analizar-oferta.component.ts` (listener a nivel de documento, activo solo en paso
`entrada` + modo `imagen`) — convive con el selector de archivo y arrastrar-y-soltar
que ya existían.

**Decisión cerrada — entrada por imagen (procesamiento):** un solo marcador de texto
(`{{OFERTA_TEXTO}}` para `EXTRACTOR_OFERTA`) — **no** hay un segundo marcador para la
imagen. La imagen viaja aparte, como adjunto multimodal real en la misma solicitud a la
IA (`IAiProviderClient.GenerarTextoAsync(..., imagenBytes, imagenContentType, ...)`),
sin ningún paso previo de OCR. Se prefirió sobre la alternativa de "resolver a texto
primero" porque los proveedores con visión (Claude, Gemini) ya soportan texto+imagen en
un solo mensaje de forma nativa — evita una llamada extra y una capa de texto
intermedio con pérdida de información visual.

**Secuencia de una llamada (los 3 pasos comparten esta misma secuencia vía `IIaPromptInvoker`):**
1. Backend busca la conexión activa (`ProveedorIa.EsActivo`) del CV y descifra su clave.
2. Busca la versión activa del `PromptIa` requerido (`CurriculumId` + `Codigo`), o usa
   `PromptsPorDefecto` si el CV no tiene una propia.
3. Arma el diccionario de valores según el paso (tabla de arriba).
4. `IPromptEnsambladorService.Ensamblar(activo.Contenido, valores)` → prompt final.
5. Llama al proveedor de IA (`IAiProviderClient.GenerarTextoAsync`, con la imagen
   adjunta si aplica) con ese prompt final.
6. `RespuestaIaJsonParser.Parsear<T>` contra el DTO esperado (según `FormatoSalida`).
7. Si el parseo falla, o el proveedor no responde `Ok`, error claro al usuario (400) —
   no se persiste nada a medias.

---

## 5. Proveedor de IA por usuario — ✅ completo (frontend + backend, multi-proveedor)

`/configuracion` tiene la sección "Proveedores de IA"
(`frontend/src/app/features/private/pages/configuracion.component.ts/html`), conectada
al backend real vía `frontend/src/app/core/services/private/proveedor-ia.service.ts`.
Un postulante puede guardar **varias conexiones** a la vez (p. ej. Claude para uso
personal + un Ollama local + una cuenta de trabajo con OpenAI) y tiene siempre como
máximo **una marcada "activa"** — esa es la que usa el flujo de Ofertas. Cada conexión
tiene proveedor, nombre/alias opcional (para distinguir varias del mismo proveedor),
modelo, endpoint (obligatorio solo para self-hosted) y clave de API (opcional — Ollama
local normalmente no la requiere). CRUD completo: agregar, editar (la clave se mantiene
si se deja en blanco), eliminar (si se elimina la activa, se activa automáticamente la
más reciente), "usar esta" para cambiar cuál está activa, y "probar conexión".

Proveedores soportados en el selector: `claude`, `openai`, `gemini`, `ollama`, `otro`.
Prueba de conexión **real** para `claude`, `gemini` y `ollama` (cada uno con su propio
`IAiProviderClient`, registrado en `DependencyInjection.cs`: `ClaudeAiProviderClient`
llama a `v1/messages` de Anthropic, `GeminiAiProviderClient` y `OllamaAiProviderClient`
al endpoint correspondiente de cada proveedor). `openai` y `otro` todavía no tienen
cliente registrado: responden con un mensaje claro de "todavía no soportado" en vez de
fallar — se pueden guardar igual, solo no se pueden probar en vivo todavía.

**Nota sobre Ollama en producción:** la prueba de conexión y la futura invocación real
corren en el *backend*, no en el navegador del usuario. Si el backend está en Azure y el
Ollama del usuario es su `localhost`, el backend no puede alcanzarlo — el endpoint tiene
que ser una URL accesible desde donde corra el backend (misma red/VPN/túnel, o backend y
Ollama en el mismo Docker en desarrollo local). Esto es una limitación de arquitectura,
no un bug; vale la pena tenerlo presente antes de ofrecerlo como opción "lista para
producción" en la documentación de cara al usuario.

Backend: `ProveedorIaController` (`/api/cv/proveedor-ia` — `GET` lista, `POST` crea,
`PUT {id}` actualiza, `DELETE {id}` elimina, `PUT {id}/activar` cambia cuál está activa,
`POST probar` prueba sin persistir), `ProveedorIaService`, tabla `ProveedorIa`
(varias filas por `CurriculumId`, índice único filtrado `WHERE EsActivo = 1` — mismo
patrón que `PromptIa.EsActivo`). Cifrado AES-256-GCM vía `AesGcmApiKeyCipher` (clave en
`Encryption:Key`), cliente real `ClaudeAiProviderClient`. La clave de API nunca se
devuelve al frontend.

---

## 6. Checklist por fases

Siguiendo la convención del proyecto: vista/maqueta primero (mock, sin backend),
backend después, en iteración separada — ver precedente de "Analizar Oferta" y
"Prompts de IA".

### Fase 0 — Diseño y decisiones
- [x] Cerrar las decisiones principales de la sección 2 (`/mi-cv`, duplicados,
      proveedor por usuario, prompts por defecto)
- [x] Cerrar sustitución de marcadores (entrada por imagen) — ver sección 4. Costos/límites sigue abierto (sección 2).
- [x] Validar estructura final de `Oferta` y `CvGenerado` con datos reales de ejemplo — sección 3

### Fase 0.5 — Proveedor de IA por usuario — ✅ completa (multi-proveedor)
- [x] Maqueta frontend en `/configuracion` (mock, sin backend) — ver sección 5
- [x] Tabla `ProveedorIa`: **varias filas por `CurriculumId`**, con índice único
      filtrado `(CurriculumId) WHERE EsActivo = 1` (mismo patrón que
      `PromptIa.EsActivo` — a lo sumo una activa a la vez). Columnas: `Proveedor`,
      `Nombre` (alias opcional), `Modelo`, `Endpoint` (obligatorio solo para self-hosted,
      hoy `ollama`), `ApiKeyCifrada` (opcional), `EsActivo`, `FechaCreacion`,
      `FechaActualizacion`. `scripts/manual/01_CreateSchema.sql`,
      `scripts/production/05_AzureSQL_CreateSchema.sql` (esquema completo) +
      `scripts/production/10_AddProveedorIaConfig.sql` (migración incremental,
      self-healing: si detecta la versión anterior 1:1, migra sin perder datos — la
      única conexión existente por CV queda como la activa) + `database/01_CreateSchema.dbml`
      + `database/DiccionarioDeDatos.md`.
- [x] Backend: `IProveedorIaService`/`ProveedorIaService` (listar/crear/actualizar/
      eliminar/activar + probar) + `ProveedorIaController` (`/api/cv/proveedor-ia`:
      `GET` lista, `POST` crea, `PUT {id}` actualiza, `DELETE {id}` elimina — si era la
      activa, activa automáticamente la más reciente —, `PUT {id}/activar`, `POST
      probar`). La clave de API se cifra con **AES-256-GCM** (`AesGcmApiKeyCipher`,
      clave única en `Encryption:Key`, mismo patrón que `Jwt:Key`) y nunca se devuelve
      al front-end. Al editar sin escribir una clave nueva, se conserva la anterior (no
      hay forma de "reenviar" una clave que nunca vuelve del servidor). Validaciones:
      proveedor debe ser uno de `claude/openai/gemini/ollama/otro`; clave requerida solo
      para `claude/openai/gemini`; endpoint requerido solo para `ollama`. Tests (87 en
      total el módulo): cifrado (round-trip, nonce distinto por llamada, falla con otra
      clave), persistencia (clave cifrada en la fila, nunca en el cuerpo de la
      respuesta), aislamiento por CV, primera conexión queda activa automáticamente,
      segunda no, activar desactiva las demás, eliminar la activa reactiva otra.
- [x] `IAiProviderClient`: interfaz + implementación inicial (`ClaudeAiProviderClient`,
      llamada real y mínima a `v1/messages` de Anthropic para validar clave/modelo, con
      manejo de 401/400/timeout/red — nunca lanza). Proveedores sin cliente real
      (`openai`/`gemini`/`ollama`/`otro`) responden `Ok=false` con mensaje claro en vez
      de fallar; se pueden guardar igual, solo no tienen prueba de conexión todavía —
      decisión deliberada de no implementar aún un cliente real para Ollama por el
      riesgo de SSRF de aceptar una URL arbitraria del usuario y la limitación de
      reachability descrita en la sección 5 (se puede retomar más adelante si hace
      falta). Tests con `HttpMessageHandler` falso (sin red real).
- [x] Frontend conectado al backend real vía `proveedor-ia.service.ts` — lista de
      tarjetas (mismo patrón visual que Prompts de IA), "Agregar conexión" / editar /
      eliminar / "Usar esta" por tarjeta, formulario que muestra el campo de endpoint
      solo para proveedores self-hosted. Agregado el estado de error que faltaba en la
      UI de "Probar conexión" (antes solo había rama para el caso `ok`).

### Fase 1 — Historial de Ofertas (CRUD, todavía sin IA real) — ✅ completa
- [x] Maqueta frontend: extender "Analizar Oferta" para listar/editar/eliminar ofertas
      guardadas. Paso `historial` (pantalla de entrada por defecto), con
      `nuevaOferta()` / `editarOferta()` / `eliminarOferta()` / `volverAlHistorial()`
      en `analizar-oferta.component.ts/html`.
- [x] Tabla `Oferta`: `scripts/manual/01_CreateSchema.sql`,
      `scripts/production/05_AzureSQL_CreateSchema.sql` (esquema completo) +
      `scripts/production/09_AddOferta.sql` (migración incremental para bases ya
      existentes) + `database/01_CreateSchema.dbml` + `database/DiccionarioDeDatos.md`.
      `PerfilId` es FK opcional a `Perfil` (`ON DELETE NO ACTION`, mismo patrón que
      `Referencia.ExperienciaId` — evita la ruta doble de cascada hacia `Curriculum`).
- [x] Backend: entidad `Oferta` (Domain) + `OfertaConfiguration` (EF) + métodos
      `GetOfertasAsync/CreateOfertaAsync/UpdateOfertaAsync/DeleteOfertaAsync` en
      `ICvEditorService`/`CvEditorService` (mismo patrón que Perfil — sin repositorio
      separado, todas las entidades del editor comparten un único servicio) +
      `OfertaController` (`/api/cv/ofertas`). Tests de integración en
      `CvEditorEndpointsTests.cs` (CRUD completo, ownership 403, duplicado 400).
- [x] Validación de duplicados: a nivel de aplicación (`ValidarOfertaAsync` en
      `CvEditorService`), compara `(CurriculumId, Cargo, Empresa)` normalizado (trim +
      mayúsculas) antes de crear/actualizar — devuelve 400 con mensaje claro. No es un
      índice único en la base de datos (evita depender de una columna calculada solo
      para la normalización).
- [x] Frontend conectado al backend real vía `oferta.service.ts` — el mock en memoria
      quedó reemplazado por `getOfertas/crearOferta/actualizarOferta/eliminarOferta`.
      La extracción de datos de la oferta (`analizarOferta()`) sigue simulada
      (`setTimeout` + contenido fijo) hasta la Fase 2 — es la única parte que falta
      para que el flujo sea 100% real.

### Fase 2 — Extracción real con IA (pasos 1-2 del flujo) — ✅ completa
- [x] `IPromptEnsambladorService`/`PromptEnsambladorService`: sustitución de
      marcadores `{{MARCADOR}}` (regex), valida contra el contenido ORIGINAL antes de
      sustituir (para que un valor con `{{...}}` literal no se reinterprete como
      marcador sin resolver), lanza `ArgumentException` con el nombre del marcador si
      queda alguno sin resolver.
- [x] **Decisión de la sección 4 cerrada: un solo marcador `{{OFERTA_TEXTO}}`, la
      imagen viaja aparte como adjunto multimodal** (no como texto sustituido, y sin
      paso previo de OCR) — `IAiProviderClient.GenerarTextoAsync(modelo, endpoint,
      apiKey, prompt, imagenBytes, imagenContentType, ct)`, nueva. Implementada en
      `ClaudeAiProviderClient` (bloque `image` + bloque `text` en el mismo mensaje),
      `GeminiAiProviderClient` (`inlineData` + `text` en `parts`), y
      `OllamaAiProviderClient` (`POST /api/generate` con `images: [base64]` para
      modelos con visión, p. ej. llava). Mismo contrato "nunca lanza" que
      `ProbarConexionAsync`. Timeout del HttpClient subido de 10s a 60s (compartido con
      la prueba de conexión) para dar margen a una generación real, sobre todo con
      imagen.
- [x] Reemplazado el mock de "Analizar Oferta": `IOfertaAnalisisService`/
      `OfertaAnalisisService` (nuevo) resuelve el proveedor de IA activo del CV,
      descifra su clave, busca la versión activa de `EXTRACTOR_OFERTA` (o usa
      `PromptsPorDefecto.ExtractorOferta` como fallback de solo-lectura si el CV
      todavía no tiene uno propio — cierra la decisión pendiente de la sección 2),
      ensambla el prompt, llama al proveedor, parsea la respuesta como JSON (tolera que
      venga envuelta en un bloque ```json```), y arma `OrigenEntrada` (`texto` /
      `imagen` / `ambos`) y `TextoOriginal` según lo que el usuario haya aportado.
      Endpoint `POST /api/cv/ofertas/analizar` (multipart: `texto` opcional + `archivo`
      opcional, imagen JPG/PNG/WEBP hasta 5MB) en `OfertaController` — no persiste nada,
      el resultado se revisa/edita en el front y se guarda aparte vía el CRUD normal.
      `origenEntrada` ahora acepta también `"ambos"` en la validación de `Oferta`
      (antes solo `texto`/`imagen`).
- [x] Frontend: `analizar-oferta.component.ts` — el toggle excluyente "Pegar texto" /
      "Subir imagen" se reemplazó por dos bloques complementarios siempre visibles
      (textarea + zona de imagen, separados por "Y / O"), ambos opcionales pero al
      menos uno requerido; `analizarOferta()` llama a `ofertaService.analizarOferta()`
      real en vez del `setTimeout` con datos fijos. Validación de imagen también en
      cliente (JPG/PNG/WEBP, máx. 5MB) antes de subir.
- [x] Manejo de errores: todo error de negocio (sin proveedor activo, proveedor sin
      cliente real, clave inválida, timeout, JSON inválido de la IA) se traduce a 400
      con mensaje claro (`ArgumentException` → `GlobalExceptionMiddleware`), mostrado
      como notificación en el front. Verificado en vivo contra la API real de Anthropic
      (clave inválida de prueba → 401 real → "La clave de API no es válida." en la UI).
      Límites de costo/tasa por usuario: no implementados todavía (queda abierto, ver
      sección 2).
- Backend: 188/188 tests (29 nuevos: clientes IA con imagen, `PromptEnsambladorService`,
  10 de integración de `/ofertas/analizar` con un `IAiProviderClient` falso vía
  `WithWebHostBuilder`). Frontend: `ng lint` 0 errores, 796/796 tests, build de
  producción limpio.

### Fase 3 — Selector de perfil con IA (pasos 5-6) — ✅ completa
- [x] `IPerfilSeleccionService`/`PerfilSeleccionService`: arma el prompt `SELECTOR_PERFIL`
      con `{{OFERTA_JSON}}` (cargo/empresa/descripción, la oferta puede no estar
      persistida todavía) y `{{PERFILES_JSON}}` (perfiles reales del CV, no de ejemplo).
      Si el CV no tiene ningún `Perfil` guardado, responde determinista ("se creará uno
      nuevo") sin gastar una llamada a la IA. Defensa contra alucinación: si la IA
      sugiere un `perfilId` que no existe (o de otro CV), se trata como sugerencia de
      perfil nuevo en vez de confiar ciegamente en el número. Endpoint
      `POST /api/cv/ofertas/seleccionar-perfil` (no persiste nada).
- [x] Frontend: tras extraer los datos de la oferta, `analizar-oferta.component.ts`
      llama a `seleccionarPerfil()` automáticamente (spinner "Analizando qué perfil se
      ajusta mejor…") y precarga el `<select>` de "Perfil sugerido" con perfiles reales
      del usuario (ya no la lista `PERFILES_EJEMPLO` hardcodeada) + la razón que dio la
      IA. El usuario puede cambiar la sugerencia libremente antes de continuar. Si la
      sugerencia falla, no bloquea el flujo (cae a "crear perfil nuevo" con un aviso).

### Fase 4 — Generador de CV con IA (paso 7) — ✅ completa
- [x] Tabla `CvGenerado` (sección 3) — `scripts/production/17_AddCvGenerado.sql` +
      esquema completo + DBML + diccionario.
- [x] `ICvGeneradoService`/`CvGeneradoService`: si el usuario aceptó "perfil nuevo", crea
      el `Perfil` primero (nombre = cargo de la oferta si no se indica otro); arma el
      prompt `GENERADOR_CV_ATS` con `{{PERFIL_JSON}}`, `{{CURRICULUM_JSON}}` (Experiencia/
      Formación/Habilidades con `MostrarEnCv=true`) y `{{OFERTA_JSON}}`; los datos de
      contacto del CV final se toman directo de `Personales` (nunca de la IA, evita que
      alucine un correo/celular). Generar de nuevo para la misma oferta reemplaza el
      contenido existente en vez de duplicar (índice único en `OfertaId`). Al terminar,
      actualiza `Oferta.Estado = "CvGenerado"` y `Oferta.PerfilId`. Endpoints
      `POST /api/cv/ofertas/{id}/generar-cv` y `GET /api/cv/cv-generado` (listar, para
      `/mi-cv`). `CvEditorService.DeleteOfertaAsync` borra primero el `CvGenerado`
      asociado (si existe) antes de borrar la oferta, para no chocar con la FK
      `ON DELETE NO ACTION`.
- [x] Rediseñado `/mi-cv`: lista los CV generados reales (uno por oferta), cada uno se
      abre como texto plano ATS con "Descargar / Imprimir PDF" — vía el diálogo de
      impresión nativo del navegador (`window.print()` + CSS `@media print` que oculta
      sidebar/botones y limpia el borde/fondo del bloque de texto), sin agregar una
      librería de generación de PDF al backend. Se retiró el botón "Enviar por correo"
      del mock original (no había una infraestructura real de envío de correo detrás y
      no estaba en el alcance de esta fase).
- Backend: 201/201 tests (+12: `PerfilSeleccionEndpointTests`, `CvGeneradoEndpointTests`).
  Frontend: `ng lint` 0 errores, 812/812 tests (+16), build de producción limpio.
  Verificado en vivo (Playwright, interceptando las 3 respuestas de IA — no hay una
  clave real disponible en este entorno): historial → analizar → resultado con perfil
  sugerido real y sus avisos de prompt-por-defecto → generado con el texto ATS real
  (contacto real desde Personales, resumen/experiencia/educación/habilidades de la
  respuesta) → `/mi-cv` listando y abriendo ese mismo CV.

---

## 7. Bitácora (agregar aquí lo que vaya saliendo en el camino)

- 2026-08-19: Documento creado, flujo confirmado con el usuario, estructura de
  `Oferta` propuesta.
- 2026-08-19: Decisiones cerradas — `/mi-cv` se reemplaza por el listado de CVs
  generados (PDF, formato ATS compacto); duplicados arrancan simples; el proveedor de
  IA lo configura cada usuario desde `/configuracion` (maqueta ya construida); prompts
  por defecto sugeridos si al usuario le faltan. Diseño de sustitución de marcadores
  documentado (sección 4), pendiente de construir. Tabla `CvGenerado` propuesta
  (sección 3).
- 2026-08-19: Fase 1 (mock) — "Analizar Oferta" ahora arranca en un historial de
  ofertas guardadas (mock, 3 ejemplos precargados), con crear/editar/eliminar y
  bloqueo de duplicados por `(Cargo, Empresa)`. `ng lint` 0 errores, 28/28 tests,
  build de producción limpio.
- 2026-08-19: Fase 1 completa (full-stack) — agregada tabla `Oferta` (esquema +
  migración incremental `09_AddOferta.sql`), CRUD backend completo (`OfertaController`,
  `CvEditorService`, validación de duplicados a nivel de aplicación con 400 claro,
  tests de integración con ownership 403 y duplicado 400), y el frontend conectado al
  backend real (`oferta.service.ts`) reemplazando el historial en memoria. Backend:
  56/56 tests. Frontend: `ng lint` 0 errores, 683/683 tests, build de producción
  limpio. Pendiente para cerrar el flujo completo: extracción real con IA (Fase 2) —
  hoy "Analizar oferta" sigue siendo un mock con `setTimeout` y contenido fijo.
- 2026-08-19: Fase 0.5 completa (full-stack) — tabla `ProveedorIaConfig` (1:1 por CV),
  `ProveedorIaController`/`ProveedorIaService`, cifrado AES-256-GCM de la clave de API
  (`AesGcmApiKeyCipher`, clave en `Encryption:Key`), cliente real `ClaudeAiProviderClient`
  (prueba de conexión real contra la API de Anthropic, sin llamar a la red en los tests
  — `HttpMessageHandler` falso). `/configuracion` conectado al backend real. Backend:
  77/77 tests. Frontend: `ng lint` 0 errores, 690/690 tests, build de producción limpio.
  Con esto, todas las piezas de infraestructura para IA real (persistencia de ofertas +
  conexión de IA por usuario) están listas — Fase 2 puede construir directamente sobre
  ellas (`IPromptEnsambladorService` + reemplazar el mock de "Analizar Oferta").
- 2026-08-19: Fase 0.5 rediseñada a multi-proveedor — el usuario preguntó qué pasa si
  tiene más de un proveedor de IA (Copilot, Gemini, Claude, OpenAI, o un Ollama local),
  y si debería poder agregar/activar/desactivar cuál usa el flujo de Ofertas. Se
  confirmó y se migró `ProveedorIaConfig` de 1:1 por CV a varias filas por CV con
  `EsActivo` (mismo patrón que `PromptIa`), se agregó `Nombre` (alias) y `Endpoint`
  (para self-hosted), la clave de API pasó a ser opcional, y se agregaron `gemini` y
  `ollama` a la lista de proveedores soportados (Copilot no se agregó como valor propio
  — no tiene un modelo de API key de uso general como los demás; cae en "otro" si el
  usuario quiere guardarlo igual). Prueba de conexión real sigue siendo solo Claude —
  no se implementó cliente real para Ollama en esta pasada por el riesgo de SSRF de
  aceptar una URL arbitraria y la limitación de reachability (backend en Azure no puede
  alcanzar el `localhost` del usuario). Migración incremental self-healing (detecta la
  versión 1:1 anterior y la migra sin perder datos). Backend: 87/87 tests. Frontend:
  `ng lint` 0 errores, 699/699 tests, build de producción limpio.
- 2026-08-21: Frontend de "Analizar Oferta" rediseñado — el usuario preguntó si texto e
  imagen podían complementarse en vez de ser modos excluyentes (una captura puede venir
  con una nota adicional, o el correo del reclutador ilegible en la imagen puede
  aportarse como texto). Se reemplazó el toggle por dos bloques siempre visibles
  (textarea + zona de imagen) separados por "Y / O", ambos opcionales pero al menos uno
  requerido; `origenEntrada` pasó a admitir `texto`/`imagen`/`ambos`. Solo maqueta en
  esta pasada (mock).
- 2026-08-21: **Fase 2 completa (full-stack)** — decisión de la sección 4 cerrada: un
  solo marcador `{{OFERTA_TEXTO}}`, la imagen viaja aparte como adjunto multimodal en la
  misma solicitud a la IA (sin OCR previo) — confirma la recomendación de diseño
  discutida con el usuario. `IAiProviderClient.GenerarTextoAsync` nuevo, implementado en
  los 3 proveedores (Claude, Gemini, Ollama); `IPromptEnsambladorService` nuevo;
  `IOfertaAnalisisService`/`OfertaAnalisisService` nuevo (resuelve proveedor activo +
  prompt activo o el default del sistema + llama a la IA + parsea JSON); endpoint
  `POST /api/cv/ofertas/analizar`. Frontend conectado (`oferta.service.ts` real en vez
  del `setTimeout`). Verificado en vivo contra la API real de Anthropic (clave inválida
  de prueba → 401 real de Anthropic → "La clave de API no es válida." en la UI) — prueba
  end-to-end de que la solicitud multimodal realmente sale del backend hacia el
  proveedor. Backend: 188/188 tests (+29). Frontend: `ng lint` 0 errores, 796/796 tests
  (+7), build de producción limpio. Pendiente: Fase 3 (selector de perfil con IA) y
  Fase 4 (generador de CV con IA); límites de costo/tasa por usuario siguen sin decidir.
- 2026-08-21: Aviso de "prompt por defecto" — el usuario preguntó si el flujo realmente
  usaba el proveedor/modelo seleccionado en Proveedores de IA junto con los Prompts de
  IA creados; se confirmó que sí, con una salvedad: si el CV no tiene una versión activa
  propia de `EXTRACTOR_OFERTA`, el fallback al prompt por defecto del sistema era
  silencioso (sin ningún indicio en la UI). `OfertaAnalizadaDto` ganó el campo
  `PromptPorDefecto` (`OfertaAnalisisService` lo marca `true` cuando
  `GetActivoPorCodigoAsync` no encuentra nada propio); el paso "resultado" de Analizar
  Oferta muestra un aviso discreto con enlace directo a Prompts de IA cuando aplica.
  Verificado en vivo interceptando la respuesta de red en Playwright (sin necesitar una
  clave de IA real que funcione) — aviso visible y el enlace navega correctamente.
  Backend: 189/189 tests (+1). Frontend: `ng lint` 0 errores, 798/798 tests (+2).
- 2026-08-21: **Fase 3 y Fase 4 completas (full-stack) — flujo Oferta → Perfil → CV
  generado cerrado de punta a punta.** El usuario pidió construir el resto del flujo
  completo. Se factorizó la orquestación común de los 3 pasos que llaman a la IA
  (resolver proveedor activo, descifrar clave, resolver prompt activo o su default,
  ensamblar, invocar) en `IIaPromptInvoker`, y el parseo JSON compartido en
  `RespuestaIaJsonParser` (`OfertaAnalisisService` se refactorizó para usarlos también).
  Fase 3: `IPerfilSeleccionService` sugiere reutilizar un `Perfil` real o crear uno
  nuevo, con defensa contra que la IA alucine un `PerfilId` inexistente. Fase 4:
  `ICvGeneradoService` genera el CV en JSON (contacto real desde `Personales`, resto
  generado por la IA a partir de Experiencia/Formación/Habilidades visibles), crea el
  `Perfil` nuevo si aplica, persiste en la tabla `CvGenerado` nueva
  (`17_AddCvGenerado.sql`, único por `Oferta`), y avanza `Oferta.Estado` a
  `CvGenerado`. `/mi-cv` (antes un stub vacío) ahora lista los CV reales, cada uno con
  descarga/impresión a PDF vía el diálogo nativo del navegador — se descartó agregar una
  librería de generación de PDF al backend, y se retiró el botón "Enviar por correo" del
  mock (sin infraestructura real de envío detrás, fuera del alcance del roadmap). De
  paso se corrigió un bug encontrado en el camino: el `CHECK` constraint
  `CK_Oferta_OrigenEntrada` en la base de datos nunca se había actualizado para aceptar
  `'ambos'` cuando esa opción se agregó en una pasada anterior de la Fase 2
  (`16_FixOfertaOrigenEntradaAmbos.sql`). Backend: 201/201 tests (+12). Frontend:
  `ng lint` 0 errores, 812/812 tests (+16), build de producción limpio. Verificado en
  vivo con Playwright (historial → analizar → perfil sugerido real → CV generado real
  con contacto real → `/mi-cv`), interceptando las 3 respuestas de IA (no hay clave real
  disponible en este entorno; la llamada de red real ya se verificó en la Fase 2).
  Pendiente: límites de costo/tasa por usuario (única decisión de la sección 2 que
  sigue abierta).
