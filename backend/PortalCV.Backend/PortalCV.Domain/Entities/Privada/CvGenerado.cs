namespace PortalCV.Domain.Entities;

/// <summary>CV general de un Perfil generado por IA -- experiencia, formación, proyectos
/// y habilidades condensados para caber en máximo 3 hojas, mostrados con la misma
/// apariencia visual (colores, tipografía, foto y encabezado) que "Profesional", pero
/// como bloques de texto redactados por la IA, no como las tarjetas estructuradas de esa
/// vista. El resumen/descripción del Perfil no lo toca la IA -- se muestra tal cual está
/// guardado. Se genera una sola vez por Perfil (sin depender de ninguna oferta); Analizar
/// Oferta reutiliza este CV para enviarlo por correo. Uno por Perfil; regenerar reemplaza
/// el contenido en vez de crear una fila nueva.</summary>
public class CvGenerado
{
    public int CvGeneradoId { get; set; }
    public int CurriculumId { get; set; }
    public int PerfilId { get; set; }

    /// <summary>Serializado de ContenidoCvGeneradoDto -- experiencia/educacion/
    /// proyectos/habilidades redactados por la IA.</summary>
    public string ContenidoJson { get; set; } = string.Empty;

    /// <summary>true si al generar este CV el usuario todavía no tenía una versión activa
    /// propia de GENERADOR_CV_PERFIL -- congela el dato en el momento de la generación.</summary>
    public bool PromptPorDefecto { get; set; }

    public DateTime FechaGeneracion { get; set; }

    public Curriculum Curriculum { get; set; } = null!;
    public Perfil Perfil { get; set; } = null!;
}
