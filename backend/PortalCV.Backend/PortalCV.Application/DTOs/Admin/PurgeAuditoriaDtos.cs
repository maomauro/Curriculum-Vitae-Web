namespace PortalCV.Application.DTOs.Admin;

public enum AuditoriaPurgeModo
{
    AnioMes,
    Anio,
    Todo
}

/// <summary>Solicitud de purga de tablas de auditoría (solo Admin).</summary>
public class PurgeAuditoriaRequestDto
{
    /// <summary>"admin" o "cv".</summary>
    public string Tabla { get; set; } = string.Empty;

    /// <summary>"anioMes", "anio" o "todo".</summary>
    public string Modo { get; set; } = string.Empty;

    public int? Anio { get; set; }

    /// <summary>1–12 cuando <see cref="Modo"/> es anioMes.</summary>
    public int? Mes { get; set; }

    /// <summary>Debe coincidir con <see cref="AuditoriaPurgeConfirmacion.VaciarTodo"/> si Modo es todo.</summary>
    public string? Confirmacion { get; set; }
}

public class PurgeAuditoriaResponseDto
{
    public int Eliminados { get; set; }
}

public static class AuditoriaPurgeConfirmacion
{
    public const string VaciarTodo = "VACIAR_AUDITORIA";
}
