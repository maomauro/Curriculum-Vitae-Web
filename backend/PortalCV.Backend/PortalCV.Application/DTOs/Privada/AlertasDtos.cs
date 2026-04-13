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
    string? Pais,
    int? VistasAcumuladas = null);

public record AlertasPageDto(
    IReadOnlyList<AlertaVisitaDto> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages);

