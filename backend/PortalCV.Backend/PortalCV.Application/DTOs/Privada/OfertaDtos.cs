namespace PortalCV.Application.DTOs.Privada;

public record OfertaDto(
    int OfertaId,
    string Cargo,
    string Empresa,
    string? Descripcion,
    string? CorreoReclutador,
    string? NombreReclutador,
    string TextoOriginal,
    string OrigenEntrada,
    string Estado,
    int? PerfilId,
    DateTime FechaAnalisis);

public record UpsertOfertaRequest(
    string Cargo,
    string Empresa,
    string? Descripcion,
    string? CorreoReclutador,
    string? NombreReclutador,
    string TextoOriginal,
    string OrigenEntrada,
    string Estado,
    int? PerfilId);
