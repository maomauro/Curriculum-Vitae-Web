namespace PortalCV.Application.DTOs.Privada;

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

