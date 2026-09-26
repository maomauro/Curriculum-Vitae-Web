# ADRs (Architecture Decision Records)

Registro de decisiones de arquitectura relevantes, con su contexto y alternativas
consideradas. Formato corto (estilo MADR): Contexto, Decisión, Alternativas
consideradas, Consecuencias.

Una decisión se documenta acá cuando cambiarla más adelante requeriría entender
primero *por qué* se tomó así — no decisiones triviales o fácilmente reversibles.

| ADR | Título | Estado |
|---|---|---|
| [0001](0001-conector-mariadb.md) | Conector EF Core para MariaDB: Oracle en vez de Pomelo | Aceptada |
| [0002](0002-questpdf-generacion-pdf.md) | Generación de PDF con QuestPDF en vez de navegador headless | Aceptada |
| [0003](0003-mailkit-envio-correo.md) | Envío de correo con MailKit en vez de librería SMTP nativa | Aceptada |
| [0004](0004-vps-contabo-cloudflare.md) | Hosting de producción: VPS de Contabo + Cloudflare en vez de cloud gestionado | Aceptada |

## Cómo agregar una nueva

1. Copiar el formato de cualquier ADR existente.
2. Numerar consecutivamente (`000N-titulo-corto.md`).
3. Agregar la fila a la tabla de arriba.
4. Una decisión superada no se borra: se marca "Reemplazada por ADR-000X" y se enlaza la nueva.
