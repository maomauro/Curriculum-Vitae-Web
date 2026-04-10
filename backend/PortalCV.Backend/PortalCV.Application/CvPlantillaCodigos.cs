namespace PortalCV.Application;

/// <summary>Códigos de plantilla de presentación del CV (minúsculas en API y BD).</summary>
public static class CvPlantillaCodigos
{
    public const string Clasico = "clasico";
    public const string Profesional = "profesional";
    public const string Ats = "ats";
    public const string Corporativo = "corporativo";
    public const string Ejecutivo = "ejecutivo";

    private static readonly HashSet<string> Validos = new(StringComparer.OrdinalIgnoreCase)
    {
        Clasico,
        Profesional,
        Ats,
        Corporativo,
        Ejecutivo,
    };

    public static string NormalizeOrDefault(string? codigo)
    {
        var c = (codigo ?? string.Empty).Trim();
        if (!Validos.Contains(c)) return Clasico;
        return c.ToLowerInvariant();
    }

    /// <summary>Devuelve el código en minúsculas o null si no es válido.</summary>
    public static string? TryNormalize(string? codigo)
    {
        var c = (codigo ?? string.Empty).Trim();
        if (!Validos.Contains(c)) return null;
        return c.ToLowerInvariant();
    }
}
