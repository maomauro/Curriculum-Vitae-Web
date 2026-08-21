namespace PortalCV.Domain.Entities;

/// <summary>
/// Prompt del asistente de IA, propio de un CV (<see cref="CurriculumId"/>) y editable desde
/// su área privada. Cada edición inserta una fila nueva (mismo Curriculum+<see cref="Codigo"/>,
/// <see cref="Version"/>+1) y desactiva la anterior: ninguna columna de una fila existente se
/// sobrescribe. <see cref="Contenido"/> se ensambla automáticamente a partir de
/// <see cref="RolContexto"/>/<see cref="Tarea"/>/<see cref="Reglas"/>/<see cref="FormatoSalida"/>/
/// <see cref="Ejemplos"/> y nunca se edita a mano.
/// </summary>
public class PromptIa
{
    public int PromptIaId { get; set; }
    public int CurriculumId { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }

    public string RolContexto { get; set; } = string.Empty;
    public string Tarea { get; set; } = string.Empty;
    public string? Reglas { get; set; }
    public string FormatoSalida { get; set; } = string.Empty;
    public string? Ejemplos { get; set; }

    public string Contenido { get; set; } = string.Empty;

    public int Version { get; set; } = 1;
    public bool EsActivo { get; set; } = true;
    public DateTime FechaCreacion { get; set; }
    public int? ActualizadoPorUsuarioId { get; set; }

    public Curriculum? Curriculum { get; set; }
    public Usuario? ActualizadoPor { get; set; }
}
