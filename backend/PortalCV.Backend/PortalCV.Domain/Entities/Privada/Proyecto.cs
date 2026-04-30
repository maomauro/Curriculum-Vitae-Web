namespace PortalCV.Domain.Entities;

public class Proyecto
{
    public int ProyectoId { get; set; }
    public int CurriculumId { get; set; }
    public string? NombreProyecto { get; set; }
    public string? Rol { get; set; }
    public int? EquipoTamano { get; set; }
    public int? DuracionMeses { get; set; }
    public string? StackTecnologico { get; set; }
    public string? Aporte { get; set; }
    public string? Logro { get; set; }
    public string? Desafio { get; set; }
    public bool MostrarEnCv { get; set; } = true;

    public Curriculum Curriculum { get; set; } = null!;
}
