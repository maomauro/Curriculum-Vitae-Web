namespace PortalCV.Application;

/// <summary>Valores persistidos en <c>Curriculum.Estado</c> (misma capitalización que en BD).</summary>
public static class CurriculumEstados
{
    public const string Borrador = "Borrador";
    public const string Publicado = "Publicado";

    public static bool EsPublicado(string? estado) =>
        string.Equals(estado, Publicado, StringComparison.OrdinalIgnoreCase);
}
