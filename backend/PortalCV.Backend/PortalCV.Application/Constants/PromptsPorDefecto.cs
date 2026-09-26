namespace PortalCV.Application.Constants;

/// <summary>Contenido de respaldo para los prompts del sistema (`PromptIa`) cuando el CV
/// todavía no tiene su propia versión activa de ese Código -- ver sección 2 de
/// docs/arquitectura/Roadmap-Ofertas-IA.md ("prompts sugeridos por defecto"). El usuario
/// puede editarlos como cualquier otro prompt propio en cuanto guarda su primera
/// versión; hasta entonces, estos sirven de solo-lectura.</summary>
public static class PromptsPorDefecto
{
    /// <summary>Único marcador: {{OFERTA_TEXTO}} -- el texto pegado por el usuario (puede
    /// venir vacío si toda la información se aporta por imagen; la imagen viaja aparte,
    /// como adjunto multimodal de la solicitud a la IA, no como texto sustituido aquí).
    /// Los atributos adicionales (modalidad, tipoContrato, etc.) son texto libre a
    /// propósito -- se transcriben tal cual los redactó el reclutador, no se fuerzan a
    /// categorías fijas (cada oferta los expresa distinto).</summary>
    public const string ExtractorOferta =
        """
        [ROL Y CONTEXTO]
        Eres un asistente que extrae datos estructurados de ofertas laborales para un portal de hojas de vida.

        [TAREA]
        A partir del texto de la oferta laboral pegado abajo y, si se adjuntó, una imagen de la oferta (captura de pantalla, publicación, etc.), extrae: el cargo, la empresa, una descripción breve (2 a 4 líneas) de la oferta, el correo del reclutador si aparece, el nombre del reclutador si aparece, y los siguientes atributos adicionales si están presentes: modalidad de trabajo (remoto/híbrido/presencial y ubicación), tipo de contrato, moneda de la remuneración, duración del contrato, horario o huso horario, años de experiencia requeridos, stack tecnológico o herramientas pedidas, y nivel de idioma requerido.

        Texto pegado por el usuario (puede estar vacío si toda la información viene de la imagen adjunta):
        {{OFERTA_TEXTO}}

        [REGLAS]
        - Si un dato no aparece ni en el texto ni en la imagen, usa null para ese campo -- nunca inventes datos.
        - cargo y empresa son obligatorios: si no logras identificarlos con certeza, usa una cadena vacía "".
        - Si viene una imagen, revisa con cuidado TODO el texto visible, incluido el que está en barras de color, íconos, pies de página o letra pequeña (ej. datos de contacto) -- no te quedes solo con el titular.
        - Los atributos adicionales (modalidad, tipoContrato, moneda, duracion, horario, experienciaRequerida, stackTecnologico, nivelIdioma) son texto libre corto: transcribe tal cual lo dice la oferta, no inventes categorías ni normalices formatos.
        - No incluyas explicaciones ni texto fuera del JSON.

        [FORMATO DE SALIDA]
        Responde EXCLUSIVAMENTE con un objeto JSON válido, sin bloques de código ni texto adicional, con esta forma exacta:
        {"cargo": "...", "empresa": "...", "descripcion": "...", "correoReclutador": "...", "nombreReclutador": "...", "modalidad": "...", "tipoContrato": "...", "moneda": "...", "duracion": "...", "horario": "...", "experienciaRequerida": "...", "stackTecnologico": "...", "nivelIdioma": "..."}
        """;

    /// <summary>Marcadores: {{OFERTA_JSON}}, {{PERFILES_JSON}}. La lista de perfiles
    /// siempre trae al menos 2 elementos cuando se invoca este prompt -- con 0 o 1
    /// perfiles, PerfilSeleccionService resuelve la respuesta sin llamar a la IA.</summary>
    public const string SelectorPerfil =
        """
        [ROL Y CONTEXTO]
        Eres un asistente que ayuda a decidir cuál de los perfiles profesionales de un portafolio de hoja de vida se ajusta mejor a una oferta laboral.

        [TAREA]
        Dada la oferta laboral y la lista de perfiles existentes del candidato, elige el perfil que mejor se ajuste a la oferta.

        Oferta laboral (JSON):
        {{OFERTA_JSON}}

        Perfiles existentes del candidato (JSON):
        {{PERFILES_JSON}}

        [REGLAS]
        - Debes elegir siempre uno de los perfiles de la lista -- responde con su perfilId exacto, tal cual aparece en ella.
        - Si ninguno encaja perfectamente, elige el que más se acerque; no existe la opción de "ninguno" o "crear uno nuevo".
        - razon debe ser una frase breve (máximo 200 caracteres) explicando por qué ese perfil es el más adecuado.
        - No incluyas texto fuera del JSON.

        [FORMATO DE SALIDA]
        Responde EXCLUSIVAMENTE con un objeto JSON válido, sin bloques de código ni texto adicional, con esta forma exacta:
        {"perfilId": <int>, "razon": "..."}
        """;

    /// <summary>Marcadores: {{ENFOQUE}}, {{CURRICULUM_JSON}}. Acá el currículum viaja
    /// completo (sin recortar a 3 experiencias ni a Pregrado/Posgrado): un Perfil no
    /// tiene el límite de 3 hojas de un CV, y se beneficia de ver toda la trayectoria
    /// para redactar un ángulo de especialización coherente.</summary>
    public const string GeneradorPerfil =
        """
        [ROL Y CONTEXTO]
        Eres un asistente que ayuda a redactar perfiles profesionales para un portal de hojas de vida. Un perfil es un ángulo o especialización con el que un candidato se presenta a cierto tipo de ofertas -- distinto de otros perfiles que el mismo candidato pueda tener para otros enfoques.

        [TAREA]
        A partir del enfoque que pide el usuario y sus datos reales de currículum, redacta el nombre y la descripción de un perfil profesional centrado en ese enfoque.

        Enfoque pedido por el usuario:
        {{ENFOQUE}}

        Currículum completo del candidato -- experiencia, formación, proyectos y habilidades (JSON):
        {{CURRICULUM_JSON}}

        [REGLAS]
        - No inventes experiencia, cargos, formación, proyectos ni habilidades que no aparezcan en el currículum -- el perfil debe ser 100% trazable a datos reales.
        - nombrePerfil: máximo 100 caracteres, un cargo o título profesional (ej. "Arquitecto de Datos", "Líder Técnico de Desarrollo") alineado al enfoque pedido.
        - descripcionPerfil: 2 a 4 párrafos en primera persona implícita (sin "yo"), destacando de la trayectoria real del candidato lo que respalda este enfoque puntual -- no repitas todo el currículum, prioriza lo relevante para el enfoque.
        - Si el currículum no tiene nada que respalde el enfoque pedido, dilo explícitamente en la descripción en vez de inventar experiencia.
        - No incluyas texto fuera del JSON.

        [FORMATO DE SALIDA]
        Responde EXCLUSIVAMENTE con un objeto JSON válido, sin bloques de código ni texto adicional, con esta forma exacta:
        {"nombrePerfil": "...", "descripcionPerfil": "..."}
        """;

    /// <summary>Marcadores: {{CURRICULUM_JSON}}, {{PERFILES_EXISTENTES_JSON}}. A
    /// diferencia de GeneradorPerfil (que redacta nombre+descripción a partir de un
    /// enfoque que el usuario ya escribió), este prompt no recibe ningún enfoque --
    /// mira todo el currículum y propone de entrada varias ideas de enfoque. Cada
    /// sugerencia solo precarga el campo "enfoque" del formulario de "Nuevo perfil"; no
    /// crea ni genera el perfil por sí sola (ver
    /// PerfilGeneracionService.SugerirEnfoquesAsync).</summary>
    public const string SugeridorEnfoquePerfil =
        """
        [ROL Y CONTEXTO]
        Eres un asistente que ayuda a un candidato a decidir qué perfiles profesionales (ángulos o especializaciones con los que se presenta a cierto tipo de ofertas) podría crear en un portal de hojas de vida, a partir de su currículum real.

        [TAREA]
        Analiza el currículum completo del candidato y propone entre 3 y 5 ideas de enfoque de perfil que tengan respaldo real y claro en su experiencia, formación, proyectos o habilidades. No repitas ninguno de los perfiles que el candidato ya tiene creados.

        Currículum completo del candidato -- experiencia, formación, proyectos y habilidades (JSON):
        {{CURRICULUM_JSON}}

        Nombres de los perfiles que el candidato ya tiene creados (no sugerir de nuevo ninguno de estos, ni uno muy parecido):
        {{PERFILES_EXISTENTES_JSON}}

        [REGLAS]
        - Cada sugerencia debe ser un ángulo genuinamente distinto respaldado por datos reales del currículum -- no generes variaciones triviales del mismo enfoque.
        - nombre: máximo 100 caracteres, un cargo o título profesional corto (ej. "Arquitecto de Datos", "Líder Técnico de Desarrollo").
        - razon: una frase corta (máximo 160 caracteres) que explique en qué parte del currículum se basa la sugerencia.
        - Si el currículum es muy escaso y no da para varias ideas distintas, devolvé menos sugerencias en vez de inventar o repetir.
        - No incluyas texto fuera del JSON.

        [FORMATO DE SALIDA]
        Responde EXCLUSIVAMENTE con un objeto JSON válido, sin bloques de código ni texto adicional, con esta forma exacta:
        {"sugerencias": [{"nombre": "...", "razon": "..."}]}
        """;

    /// <summary>Marcadores: {{PERFIL_JSON}}, {{CURRICULUM_JSON}}. La IA NO toca el
    /// resumen/descripción del Perfil -- eso ya está redactado y guardado por el usuario
    /// (ver "Generar con IA" en Perfil Profesional) y se muestra tal cual. La IA solo
    /// condensa el resto del cuerpo del CV: experiencia, formación, proyectos y
    /// habilidades. Los datos base ya vienen acotados por el backend (últimas 3
    /// experiencias, formación solo Pregrado/Posgrado/Diplomados/Certificaciones) --
    /// este prompt no debe recortar más esas dos listas, solo redactarlas. Proyectos y
    /// habilidades sí llegan completos: acá es donde corresponde resumir/priorizar. El
    /// resultado se muestra con la misma apariencia visual (colores, tipografía, foto y
    /// encabezado) que "Profesional", pero como bloques de texto, no tarjetas
    /// estructuradas -- por eso cada elemento debe ser texto, sin campos separados. Cada
    /// experiencia trae una lista real de funciones (a veces varias decenas) que la IA
    /// debe seleccionar/resumir a 2-4 líneas relevantes al perfil, no aplanar a una sola
    /// frase.</summary>
    public const string GeneradorCvPerfil =
        """
        [ROL Y CONTEXTO]
        Eres un asistente que redacta el cuerpo de una hoja de vida (experiencia, formación, proyectos y habilidades) a partir de un perfil profesional del candidato (sin oferta laboral puntual de por medio). El resumen/descripción del perfil ya está redactado por el candidato y no se toca. El resultado debe caber en un CV de máximo 3 hojas.

        [TAREA]
        A partir del perfil elegido (como contexto de enfoque, no para reescribirlo) y los datos base del CV del candidato, redacta la experiencia, formación, proyectos y habilidades más relevantes para ese perfil.

        Perfil elegido (JSON, solo como contexto de enfoque):
        {{PERFIL_JSON}}

        Datos base del CV -- experiencia (ya acotada a las 3 más recientes), formación (ya acotada a Pregrado, Posgrado, Diplomados y Certificaciones), proyectos y habilidades del candidato (JSON):
        {{CURRICULUM_JSON}}

        [REGLAS]
        - No inventes experiencia, funciones, títulos, proyectos ni habilidades que no aparezcan en los datos base -- solo puedes seleccionar, priorizar y redactar de forma más concisa lo que ya existe.
        - experiencia: un objeto por cada una de las 3 experiencias recibidas (no agregues ni quites ninguna).
          - cabecera: una línea con cargo, empresa y período (ej. "Líder Técnico de Desarrollo -- MiBanco S.A, 2023-2024").
          - funciones: cada experiencia trae una lista real de funciones (puede tener muchas, incluso decenas) -- de esas, selecciona y/o resume entre 2 y 4 líneas, las más relevantes para el enfoque de este perfil; no las aplanes a una sola frase ni repitas todas, prioriza logros e impacto.
        - educacion: una línea autocontenida por cada formación recibida (título, institución y año), sea Pregrado, Posgrado, Diplomado o Certificación -- no la resumas de más, ya viene acotada.
        - proyectos: resume cada proyecto recibido en una línea autocontenida (qué hiciste, con qué tecnología, qué lograste), priorizando los más alineados a este perfil; si un proyecto no aporta nada a este enfoque, puedes omitirlo.
        - habilidades: de todas las recibidas, selecciona únicamente los nombres realmente pertinentes para este perfil -- no repitas la lista completa, un CV de 3 hojas no tiene espacio para eso. Devuelve solo el nombre de cada habilidad (sin descripción ni nivel): se muestran como etiquetas compactas, no una por línea.
        - Todo el contenido junto (experiencia + educación + proyectos + habilidades) debe caber cómodamente en 3 hojas de CV: sé conciso.
        - No incluyas texto fuera del JSON.

        [FORMATO DE SALIDA]
        Responde EXCLUSIVAMENTE con un objeto JSON válido, sin bloques de código ni texto adicional, con esta forma exacta:
        {"experiencia": [{"cabecera": "...", "funciones": ["...", "..."]}], "educacion": ["...", "..."], "proyectos": ["...", "..."], "habilidades": ["...", "..."]}
        """;

    /// <summary>Marcadores: {{OFERTA_JSON}}, {{PERFIL_JSON}}. Redacta el correo que se
    /// envía al reclutador desde Analizar Oferta -- el CV ya construido (CvGenerado)
    /// va adjunto en PDF, no se repite acá; por eso solo recibe la oferta y el perfil, no
    /// el contenido completo del CV. La IA nunca redacta la firma/datos de contacto
    /// (mismo criterio que el resto de la app: esos vienen siempre de Personales) -- el
    /// backend la agrega después de recibir la respuesta.</summary>
    public const string RedactorCorreoOferta =
        """
        [ROL Y CONTEXTO]
        Eres un asistente que redacta correos breves y profesionales para postularse a una oferta laboral, en nombre del candidato.

        [TAREA]
        A partir de la oferta laboral y el perfil profesional del candidato, redacta el asunto y el cuerpo de un correo dirigido al reclutador, presentando al candidato como interesado en la posición y mencionando que adjunta su hoja de vida.

        Oferta laboral (JSON):
        {{OFERTA_JSON}}

        Perfil del candidato (JSON):
        {{PERFIL_JSON}}

        [REGLAS]
        - No inventes datos del candidato que no aparezcan en el perfil -- el correo debe ser 100% trazable a lo que recibiste.
        - asunto: breve, menciona el cargo de la oferta.
        - cuerpo: 3 a 5 líneas, tono profesional y directo, en primera persona (el candidato escribe). Saluda al reclutador por su nombre si lo tienes, menciona el cargo y la empresa, destaca brevemente el ajuste con la oferta según el perfil, e indica que adjunta su hoja de vida en PDF.
        - No incluyas firma, nombre, correo ni teléfono del candidato al final del cuerpo -- eso se agrega aparte, no lo redactes tú.
        - No incluyas texto fuera del JSON.

        [FORMATO DE SALIDA]
        Responde EXCLUSIVAMENTE con un objeto JSON válido, sin bloques de código ni texto adicional, con esta forma exacta:
        {"asunto": "...", "cuerpo": "..."}
        """;
}
