namespace PortalCV.Application.DTOs.Privada;

/// <summary>Nunca incluye la clave de API — ni cifrada ni en texto plano.</summary>
public record ProveedorIaDto(
    int ProveedorIaId,
    string Proveedor,
    string? Nombre,
    string? Modelo,
    string? Endpoint,
    bool EsActivo,
    DateTime FechaActualizacion);

public record CrearProveedorIaRequest(
    string Proveedor,
    string? Nombre,
    string? Modelo,
    string? Endpoint,
    string? ApiKey);

/// <summary>ApiKey null/vacío en una actualización significa "no cambiar la clave
/// guardada" (la clave nunca se devuelve al front-end, así que no hay forma de que el
/// usuario la reenvíe sin escribirla de nuevo salvo que decida cambiarla).</summary>
public record ActualizarProveedorIaRequest(
    string Proveedor,
    string? Nombre,
    string? Modelo,
    string? Endpoint,
    string? ApiKey);

public record ProbarConexionIaRequest(
    string Proveedor,
    string? Modelo,
    string? Endpoint,
    string? ApiKey);

public record ProbarConexionIaResponse(bool Ok, string Mensaje);
