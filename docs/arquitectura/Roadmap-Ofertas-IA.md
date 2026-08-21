# Roadmap: Flujo de Ofertas + IA real

Documento vivo para no perder la línea en esta funcionalidad — se va a ir ampliando
en el camino. No confundir con [Backlog.md](Backlog.md) (backlog general del
producto): este archivo es específico del flujo Oferta → Perfil → CV generado.

**Estado general: Fase 0, Fase 0.5 y Fase 1 completas (proveedor de IA por usuario y
historial de ofertas, ambos full-stack reales). Fases 2-4 (IA real end-to-end en el
flujo de ofertas) sin empezar — ya existe la pieza que les faltaba (proveedor de IA
configurado y cliente Claude real).**

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
- [ ] **Sustitución de marcadores**: diseño propuesto en la sección 4 — falta validar y
      construir.
- [ ] **Costos / límites**: ¿rate limiting por usuario? ¿límite de análisis por día?
      (Ahora es más fácil de acotar: como la key es del propio usuario, el costo lo
      asume él — igual conviene un límite razonable para evitar loops por error del frontend.)
- [ ] Manejo de errores cuando la IA devuelve algo que no calza con el `FormatoSalida`
      esperado (JSON inválido, campos faltantes).

---

## 3. Estructura de datos propuesta

### Tabla `Oferta` (nueva — propuesta, sin crear todavía)

| Columna | Tipo | Notas |
|---|---|---|
| OfertaId | int PK | |
| CurriculumId | int FK → Curriculum, ON DELETE CASCADE | Dueño, mismo patrón que Perfil/Experiencia/PromptIa |
| Cargo | nvarchar(150) NOT NULL | |
| Empresa | nvarchar(150) NOT NULL | |
| Descripcion | nvarchar(max) NULL | |
| CorreoReclutador | nvarchar(150) NULL | |
| NombreReclutador | nvarchar(150) NULL | |
| TextoOriginal | nvarchar(max) NOT NULL | Texto pegado, o texto OCR si vino de imagen |
| OrigenEntrada | nvarchar(20) NOT NULL | `texto` \| `imagen` |
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

### Tabla para el CV generado (nueva — propuesta, Fase 4)

`/mi-cv` pasa a listar estos registros (uno por oferta/postulación), cada uno
descargable/visualizable en PDF, formato ATS compacto.

| Columna | Tipo | Notas |
|---|---|---|
| CvGeneradoId | int PK | |
| CurriculumId | int FK → Curriculum, ON DELETE CASCADE | Dueño |
| OfertaId | int FK → Oferta | Para qué oferta se generó |
| PerfilId | int FK → Perfil, NULL | Perfil usado (existente o recién creado) |
| ContenidoJson | nvarchar(max) NOT NULL | CV estructurado en JSON (secciones ATS: resumen, experiencia, educación, habilidades — compacto) |
| FechaGeneracion | datetime2(0) NOT NULL | |

Falta definir el schema exacto del JSON en `ContenidoJson` (Fase 4) — probablemente muy
similar a lo que ya usa el mock de `analizar-oferta.component.ts` (`ContenidoCvEjemplo`:
resumen, experiencia[], educacion[], habilidades[]).

---

## 4. Diseño: sustitución de marcadores y flujo de invocación a la IA

(Diseño propuesto — todavía no construido, entra en la Fase 2.)

**Dónde ocurre:** un servicio nuevo en el backend, ej. `IPromptEnsambladorService`, con
una función simple: recibe el `Contenido` ya ensamblado del prompt activo (el texto que
ya arma `PromptIaService.EnsamblarContenido`) más un diccionario `{marcador: valor}`, y
reemplaza cada `{{MARCADOR}}` por su valor. Si al terminar queda algún `{{...}}` sin
resolver, lanza un error claro (p. ej. *"El prompt activo referencia un marcador
desconocido: {{FOO}}"*) en vez de mandarle a la IA un prompt roto.

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

**Pendiente de decidir — entrada por imagen (procesamiento):** los prompts sembrados hoy en `PromptIa`
tienen dos marcadores para `EXTRACTOR_OFERTA` (`{{OFERTA_TEXTO}}` y `{{OFERTA_IMAGEN}}`).
Alternativa más simple para la Fase 2: **un solo marcador** (`{{OFERTA_TEXTO}}`) siempre
— si el usuario subió una imagen, se resuelve a texto primero (vía OCR o la propia
visión del modelo en un paso previo) y de ahí en adelante el flujo es idéntico al de
texto. Recomendado por simplicidad, pero no bloquea el resto del diseño — se puede
ajustar el contenido del prompt (es self-service) cuando se decida.

**Secuencia de una llamada:**
1. Backend busca la versión activa del `PromptIa` requerido (`CurriculumId` + `Codigo`).
2. Arma el diccionario de valores según el paso (tabla de arriba).
3. `IPromptEnsambladorService.Ensamblar(activo.Contenido, valores)` → prompt final.
4. Llama al proveedor de IA configurado por el usuario en `/configuracion`
   (`IAiProviderClient`, una implementación por proveedor) con ese prompt final.
5. Parsea la respuesta como JSON contra el DTO esperado (según `FormatoSalida`).
6. Si el parseo falla, error claro al usuario — no se persiste nada a medias.

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
`POST probar` prueba sin persistir), `ProveedorIaService`, tabla `ProveedorIaConfig`
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
- [ ] Cerrar sustitución de marcadores (entrada por imagen) y costos/límites
- [ ] Validar estructura final de `Oferta` y `CvGenerado` con datos reales de ejemplo

### Fase 0.5 — Proveedor de IA por usuario — ✅ completa (multi-proveedor)
- [x] Maqueta frontend en `/configuracion` (mock, sin backend) — ver sección 5
- [x] Tabla `ProveedorIaConfig`: **varias filas por `CurriculumId`**, con índice único
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

### Fase 2 — Extracción real con IA (pasos 1-2 del flujo)
- [ ] `IPromptEnsambladorService` (sustitución de marcadores — ver sección 4)
- [ ] Reemplazar el mock de "Analizar Oferta" por la llamada real usando `EXTRACTOR_OFERTA`
- [ ] Manejo de errores/costos/límites

### Fase 3 — Selector de perfil con IA (pasos 5-6)
- [ ] Servicio backend que arma el prompt `SELECTOR_PERFIL` con oferta + perfiles existentes
- [ ] UI para mostrar la sugerencia y permitir aceptarla o elegir otra

### Fase 4 — Generador de CV con IA (paso 7)
- [ ] Tabla `CvGenerado` (sección 3) — script SQL + DBML + diccionario
- [ ] Servicio backend que arma el prompt `GENERADOR_CV_ATS`
- [ ] Rediseñar `/mi-cv` como listado de CVs generados, con vista/descarga en PDF

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
