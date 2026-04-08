namespace PortalCV.Application.DTOs.Privada;

public record AlertaVisitaDto(
    int AlertaVisitaId,
    int CurriculumId,
    DateTime FechaVisita,
    string? Origen,
    string? TipoVisita,
    bool EsLeida,
    string? Titulo,
    string? Descripcion,
    string? Ciudad,
    string? Pais);

