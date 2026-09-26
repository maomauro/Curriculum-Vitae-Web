# Diagramas de arquitectura

Fuentes `.mmd` reutilizables de los diagramas embebidos en `docs/arquitectura/Documentacion.md`
(sección 6 "Diagramas de arquitectura"). Se pueden abrir con cualquier visor Mermaid
(extension de VSCode, mermaid.live, GitHub los renderiza directo en el `.mmd`/`.md`).

| Diagrama | Descripción | Usado en |
|---|---|---|
| [ssh-autenticacion.mmd](ssh-autenticacion.mmd) | Flujo de autenticación por llave SSH (operador ↔ VPS) | Documentacion.md §6.3 |
| [tls-certificado-origen.mmd](tls-certificado-origen.mmd) | Flujo del certificado TLS de Origen (Cloudflare ↔ VPS) | Documentacion.md §6.3 |

## Diagramas interactivos (HTML autocontenido)

| Diagrama | Descripción |
|---|---|
| [ia-integracion-portalcv.html](ia-integracion-portalcv.html) | Arquitectura de integración de IA: flujo Editor→Controladores→Flujos de negocio→`IIaPromptInvoker`→proveedor activo (Claude/Gemini/Groq/Ollama), cifrado de la clave y cache de prompts. Abrir directo en el navegador. |
