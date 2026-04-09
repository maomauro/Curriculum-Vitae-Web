namespace PortalCV.Application;

/// <summary>Códigos de plantilla de presentación del CV (minúsculas en API y BD).</summary>
public static class CvPlantillaCodigos
{
    public const string Clasico = "clasico";
    public const string Profesional = "profesional";

    private static readonly HashSet<string> Validos = new(StringComparer.OrdinalIgnoreCase)
    {
        Clasico,
        Profesional,
    };

    public static string NormalizeOrDefault(string? codigo)
    {
        var c = (codigo ?? string.Empty).Trim();
        if (Validos.Contains(c)) return c.ToLowerInvariant();
        // Plantillas eliminadas (moderno, minimal, creativo): migrar a clásico
        if (string.Equals(c, "moderno", StringComparison.OrdinalIgnoreCase)
            || string.Equals(c, "minimal", StringComparison.OrdinalIgnoreCase)
            || string.Equals(c, "creativo", StringComparison.OrdinalIgnoreCase))
            return Clasico;
        return Clasico;
    }

    /// <summary>Devuelve el código en minúsculas o null si no es válido.</summary>
    public static string? TryNormalize(string? codigo)
    {
        var c = (codigo ?? string.Empty).Trim();
        if (!Validos.Contains(c)) return null;
        return c.ToLowerInvariant();
    }
}
