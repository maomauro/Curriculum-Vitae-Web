namespace PortalCV.Application.DTOs.Admin;

/// <summary>Datos de un usuario para el panel de administraciÃ³n (sin info sensible).</summary>
public class UsuarioAdminDto
{
    public int UsuarioId       { get; set; }
    public string Email        { get; set; } = string.Empty;
    public string Estado       { get; set; } = string.Empty;
    public DateTime FechaRegistro { get; set; }
    public List<RolDto> Roles  { get; set; } = [];
}

/// <summary>Datos bÃ¡sicos de un rol del sistema.</summary>
public class RolDto
{
    public int RolId           { get; set; }
    public string NombreRol    { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
}
