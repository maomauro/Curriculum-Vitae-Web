namespace PortalCV.Domain.Entities;

public class Usuario
{
    public int UsuarioId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Estado { get; set; } = "Activo";
    public DateTime FechaRegistro { get; set; }

    public ICollection<UsuarioRol> UsuarioRoles { get; set; } = new List<UsuarioRol>();
    public ICollection<Curriculum> Curriculums { get; set; } = new List<Curriculum>();
}
