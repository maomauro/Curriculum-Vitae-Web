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
    public string TextoOriginal { get; set; } = string.Empty;
    public string OrigenEntrada { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public int? PerfilId { get; set; }
    public DateTime FechaAnalisis { get; set; }

    public Curriculum Curriculum { get; set; } = null!;
    public Perfil? Perfil { get; set; }
}
