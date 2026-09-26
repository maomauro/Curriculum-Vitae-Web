# ADR-0002: Generación de PDF con QuestPDF en vez de navegador headless

## Estado

Aceptada.

## Contexto

`OfertaEnvioService` necesita adjuntar el CV como PDF al correo que se envía al reclutador
(`ICvPdfRendererService` / `CvPdfRendererService`). La imagen Docker de runtime del backend es
deliberadamente mínima: `mcr.microsoft.com/dotnet/aspnet:10.0`, sin pasos `apt-get`. Esta es
una restricción real y explícita del proyecto (ver `CLAUDE.md`, sección Docker): cualquier
dependencia nueva del backend debe ser puramente administrada (managed, sin binarios nativos),
o fuerza modificar el Dockerfile para instalar dependencias del sistema.

Las dos formas habituales de generar un PDF desde .NET son:

- Un renderizador de PDF administrado (ej. QuestPDF), que dibuja el documento con una API de
  layout en C#, sin dependencias externas.
- Un navegador headless (ej. Puppeteer/Chromium vía librerías como PuppeteerSharp), que
  renderiza HTML/CSS real y lo exporta a PDF — pero requiere un binario de Chromium instalado
  en el contenedor.

## Decisión

Se usa **QuestPDF** para el renderizado del PDF adjunto. Es una librería 100% administrada
(no requiere binarios nativos ni pasos de instalación en el Dockerfile), lo cual encaja
directamente con la imagen de runtime mínima ya decidida.

Como consecuencia de esta elección, el PDF adjunto usa un layout profesional genérico único
(no replica ninguna de las 5 plantillas de color visuales del producto) — ver también la nota
de "duplicación de plantilla" en `CLAUDE.md`: reproducir las plantillas de color hubiera sido
una tercera implementación visual duplicada, y QuestPDF no está pensado para reproducir
HTML/CSS arbitrario de todas formas.

## Alternativas consideradas

- **Navegador headless (Chromium vía Puppeteer/Playwright)** — descartada: requiere instalar
  un binario de Chromium (decenas/cientos de MB, dependencias nativas del sistema operativo)
  en la imagen de runtime, rompiendo la restricción de imagen mínima sin pasos `apt-get`.
  También hubiera permitido reusar el HTML/CSS de las plantillas existentes, pero el costo de
  imagen/infraestructura no lo justificó.
- **Otro generador de PDF administrado con soporte HTML→PDF** (ej. librerías basadas en
  motores de layout HTML puros) — no evaluado a fondo porque QuestPDF ya resolvía el caso de
  uso (un layout genérico, no una reproducción exacta de las plantillas) con una API de C#
  directa y sin dependencias nativas.

## Consecuencias

- El adjunto PDF de los correos nunca coincidirá visualmente con las 5 plantillas de color que
  ve el usuario en pantalla — es una decisión consciente, no un descuido, y no debería
  "corregirse" agregando una tercera implementación de las plantillas dentro de QuestPDF.
- Si en el futuro se necesitara un PDF que replique exactamente el HTML/CSS de una plantilla,
  hay que revisar esta decisión considerando el costo real de imagen que implicaría un
  navegador headless (o evaluar alternativas administradas con soporte HTML→PDF más completo).

## Referencias

- `CLAUDE.md`, sección Docker y sección "La duplicación de 'plantilla' es real y conocida".
