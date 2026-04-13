namespace PortalCV.Domain.Entities;

public class AlertaVisita
{
    public int AlertaVisitaId { get; set; }
    public int CurriculumId { get; set; }
    public DateTime FechaVisita { get; set; }
    public string? Origen { get; set; }
    public string? TipoVisita { get; set; } // 'Vista' | 'Contacto' | 'Descarga' | 'Sistema'
    public bool EsLeida { get; set; } = false;
    public string? Titulo { get; set; }
    public string? Descripcion { get; set; }
    public string? Ciudad { get; set; }
    public string? Pais { get; set; }
    /// <summary>Identificador anónimo del navegador (UUID) para deduplicar vistas públicas del mismo visitante.</summary>
    public string? VisitanteAnonimoId { get; set; }
    /// <summary>
    /// Para <see cref="TipoVisita"/> Vista o Descarga con <see cref="VisitanteAnonimoId"/>: veces que ese visitante repitió la acción (cargas / imprimir-PDF).
    /// </summary>
    public int VistasAcumuladas { get; set; } = 1;
    /// <summary>Solo <see cref="TipoVisita"/> Contacto: fila en <c>VisitanteContacto</c> que originó la alerta.</summary>
    public int? VisitanteContactoId { get; set; }
    public VisitanteContacto? VisitanteContacto { get; set; }

    public Curriculum Curriculum { get; set; } = null!;
}
