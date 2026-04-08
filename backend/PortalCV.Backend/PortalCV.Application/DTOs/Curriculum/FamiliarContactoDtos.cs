namespace PortalCV.Application.DTOs.Curriculum;

public record FamiliarContactoDto(
    int FamiliarId,
    string? Parentesco,
    string? Nombres,
    string? Apellidos,
    string? Email,
    string? Telefono,
    bool EsContactoPrincipal);

public record UpsertFamiliarContactoRequest(
    string? Parentesco,
    string? Nombres,
    string? Apellidos,
    string? Email,
    string? Telefono,
    bool EsContactoPrincipal = false);
