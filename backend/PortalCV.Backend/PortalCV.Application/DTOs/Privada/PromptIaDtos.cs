namespace PortalCV.Application.DTOs.Privada;

/// <summary>Fila de la tabla de administración de prompts del CV: un Código con su versión activa.</summary>
public class PromptIaListItemDto
{
    public int PromptIaId { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int VersionActiva { get; set; }
    public DateTime FechaActualizacion { get; set; }
}

/// <summary>Una versión (fila) puntual de un prompt, incluyendo su estructura completa.</summary>
public class PromptIaVersionDto
{
    public int PromptIaId { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string RolContexto { get; set; } = string.Empty;
    public string Tarea { get; set; } = string.Empty;
    public string? Reglas { get; set; }
    public string FormatoSalida { get; set; } = string.Empty;
    public string? Ejemplos { get; set; }
    public string Contenido { get; set; } = string.Empty;
    public int Version { get; set; }
    public bool EsActivo { get; set; }
    public DateTime FechaCreacion { get; set; }
}

/// <summary>Cuerpo POST para crear un prompt con Código nuevo.</summary>
public class CrearPromptIaRequest
{
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string RolContexto { get; set; } = string.Empty;
    public string Tarea { get; set; } = string.Empty;
    public string? Reglas { get; set; }
    public string FormatoSalida { get; set; } = string.Empty;
    public string? Ejemplos { get; set; }
}

/// <summary>Cuerpo POST para crear una nueva versión de un Código existente.</summary>
public class CrearVersionPromptIaRequest
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string RolContexto { get; set; } = string.Empty;
    public string Tarea { get; set; } = string.Empty;
    public string? Reglas { get; set; }
    public string FormatoSalida { get; set; } = string.Empty;
    public string? Ejemplos { get; set; }
}
