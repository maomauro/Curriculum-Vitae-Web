namespace PortalCV.Domain.Entities;

public class Personales
{
    public int PersonalesId { get; set; }
    public int CurriculumId { get; set; }

    // Identificación
    public string? TipoIdentificacion { get; set; }
    public string? NumeroDocumento { get; set; }
    public DateOnly? FechaExpedicion { get; set; }
    public string? LugarExpedicion { get; set; }
    public string? LibretaMilitarNumero { get; set; }
    public string? LibretaMilitarClase { get; set; }
    public string? PasaporteNumero { get; set; }
    public DateOnly? PasaporteVigencia { get; set; }
    public string? VisaNumero { get; set; }
    public DateOnly? VisaVigencia { get; set; }
    public string? VisaClase { get; set; }

    // Datos básicos
    public string PrimerNombre { get; set; } = string.Empty;
    public string? SegundoNombre { get; set; }
    public string PrimerApellido { get; set; } = string.Empty;
    public string? SegundoApellido { get; set; }
    public DateOnly? FechaNacimiento { get; set; }
    public string? LugarNacimiento { get; set; }
    public string? Genero { get; set; }
    public string? Nacionalidad { get; set; }
    public string? TipoSangre { get; set; }
    public string? EPS { get; set; }
    public string? Pencion { get; set; }
    public string? Cesantias { get; set; }

    // Contacto
    public string? Email { get; set; }
    public string? Celular { get; set; }
    public string? TelefonoFijo { get; set; }

    // Residencia
    public string? Pais { get; set; }
    public string? Departamento { get; set; }
    public string? Ciudad { get; set; }
    public string? Barrio { get; set; }
    public string? CodigoPostal { get; set; }
    public string? Direccion { get; set; }
    public string? TipoResidencia { get; set; }

    public string? FotoUrl { get; set; }

    public Curriculum Curriculum { get; set; } = null!;
}
