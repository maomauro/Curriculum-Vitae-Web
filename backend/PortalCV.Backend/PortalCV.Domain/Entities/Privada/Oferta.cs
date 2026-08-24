namespace PortalCV.Domain.Entities;

public class Oferta
{
    public int OfertaId { get; set; }
    public int CurriculumId { get; set; }
    public string Cargo { get; set; } = string.Empty;
    public string Empresa { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? CorreoReclutador { get; set; }
    public string? NombreReclutador { get; set; }

    /// <summary>Atributos adicionales de la oferta -- texto libre, tal cual los redactó
    /// el reclutador (la IA no los clasifica en categorías fijas: cada oferta los
    /// expresa distinto). Todos opcionales.</summary>
    public string? Modalidad { get; set; }
    public string? TipoContrato { get; set; }
    public string? Moneda { get; set; }
    public string? Duracion { get; set; }
    public string? Horario { get; set; }
    public string? ExperienciaRequerida { get; set; }
    public string? StackTecnologico { get; set; }
    public string? NivelIdioma { get; set; }

    public string TextoOriginal { get; set; } = string.Empty;
    public string OrigenEntrada { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public int? PerfilId { get; set; }
    public DateTime FechaAnalisis { get; set; }
    /// <summary>Cuándo se envió el correo con el CV adjunto al reclutador -- null si
    /// todavía no se envió (ver IOfertaEnvioService).</summary>
    public DateTime? FechaEnvioCorreo { get; set; }

    public Curriculum Curriculum { get; set; } = null!;
    public Perfil? Perfil { get; set; }
}
