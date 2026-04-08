namespace PortalCV.Application.DTOs.Curriculum;

public record ProyectoDto(
    int ProyectoId,
    string? NombreProyecto,
    string? Rol,
    int? EquipoTamano,
    int? DuracionMeses,
    string? StackTecnologico,
    string? Aporte,
    string? Logro,
    string? Desafio);

public record UpsertProyectoRequest(
    string? NombreProyecto,
    string? Rol,
    int? EquipoTamano,
    int? DuracionMeses,
    string? StackTecnologico,
    string? Aporte,
    string? Logro,
    string? Desafio);
