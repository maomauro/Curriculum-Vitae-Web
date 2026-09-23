using Microsoft.EntityFrameworkCore;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Domain.Exceptions;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

public class ProveedorIaService : IProveedorIaService
{
    private static readonly string[] ProveedoresValidos = { "claude", "openai", "gemini", "groq", "ollama", "otro" };
    private static readonly string[] ProveedoresQueRequierenApiKey = { "claude", "openai", "gemini", "groq" };
    private static readonly string[] ProveedoresQueRequierenEndpoint = { "ollama" };

    private readonly PortalCvDbContext _context;
    private readonly IApiKeyCipher _cipher;
    private readonly IEnumerable<IAiProviderClient> _aiClients;

    public ProveedorIaService(PortalCvDbContext context, IApiKeyCipher cipher, IEnumerable<IAiProviderClient> aiClients)
    {
        _context = context;
        _cipher = cipher;
        _aiClients = aiClients;
    }

    public async Task<IReadOnlyList<ProveedorIaDto>> ListarAsync(int curriculumId, CancellationToken ct = default)
        => await _context.ProveedoresIa.AsNoTracking()
            .Where(p => p.CurriculumId == curriculumId)
            .OrderByDescending(p => p.EsActivo)
            .ThenByDescending(p => p.FechaActualizacion)
            .Select(p => Map(p))
            .ToListAsync(ct);

    public async Task<ProveedorIaDto> CrearAsync(
        int curriculumId, CrearProveedorIaRequest r, CancellationToken ct = default)
    {
        ValidarProveedor(r.Proveedor);
        ValidarApiKeyRequerida(r.Proveedor, r.ApiKey);
        ValidarEndpointRequerido(r.Proveedor, r.Endpoint);

        var esPrimera = !await _context.ProveedoresIa.AnyAsync(p => p.CurriculumId == curriculumId, ct);

        var e = new ProveedorIa
        {
            CurriculumId = curriculumId,
            Proveedor = r.Proveedor,
            Nombre = string.IsNullOrWhiteSpace(r.Nombre) ? null : r.Nombre.Trim(),
            Modelo = string.IsNullOrWhiteSpace(r.Modelo) ? null : r.Modelo.Trim(),
            Endpoint = string.IsNullOrWhiteSpace(r.Endpoint) ? null : r.Endpoint.Trim(),
            ApiKeyCifrada = string.IsNullOrWhiteSpace(r.ApiKey) ? null : _cipher.Encrypt(r.ApiKey.Trim()),
            EsActivo = esPrimera,
            FechaCreacion = DateTime.UtcNow,
            FechaActualizacion = DateTime.UtcNow,
        };
        _context.ProveedoresIa.Add(e);
        await _context.SaveChangesAsync(ct);
        return Map(e);
    }

    public async Task<ProveedorIaDto> ActualizarAsync(
        int curriculumId, int id, ActualizarProveedorIaRequest r, CancellationToken ct = default)
    {
        var e = await GetOwnedOrThrowAsync(curriculumId, id, ct);
        ValidarProveedor(r.Proveedor);
        ValidarEndpointRequerido(r.Proveedor, r.Endpoint);

        e.Proveedor = r.Proveedor;
        e.Nombre = string.IsNullOrWhiteSpace(r.Nombre) ? null : r.Nombre.Trim();
        e.Modelo = string.IsNullOrWhiteSpace(r.Modelo) ? null : r.Modelo.Trim();
        e.Endpoint = string.IsNullOrWhiteSpace(r.Endpoint) ? null : r.Endpoint.Trim();
        if (!string.IsNullOrWhiteSpace(r.ApiKey))
            e.ApiKeyCifrada = _cipher.Encrypt(r.ApiKey.Trim());
        e.FechaActualizacion = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        return Map(e);
    }

    public async Task EliminarAsync(int curriculumId, int id, CancellationToken ct = default)
    {
        var e = await GetOwnedOrThrowAsync(curriculumId, id, ct);
        var eraActiva = e.EsActivo;
        _context.ProveedoresIa.Remove(e);
        await _context.SaveChangesAsync(ct);

        if (!eraActiva) return;

        var siguiente = await _context.ProveedoresIa
            .Where(p => p.CurriculumId == curriculumId)
            .OrderByDescending(p => p.FechaActualizacion)
            .FirstOrDefaultAsync(ct);
        if (siguiente is null) return;

        siguiente.EsActivo = true;
        await _context.SaveChangesAsync(ct);
    }

    public async Task<ProveedorIaDto> ActivarAsync(int curriculumId, int id, CancellationToken ct = default)
    {
        var e = await GetOwnedOrThrowAsync(curriculumId, id, ct);
        if (!e.EsActivo)
        {
            // Dos SaveChanges separados a propósito: el índice único filtrado
            // (EsActivo=1 por CurriculumId) se valida por sentencia, no al final de la
            // transacción -- si se desactiva la vieja y se activa la nueva en un mismo
            // SaveChangesAsync, EF Core no garantiza el orden de los UPDATE dentro del
            // lote y puede mandar primero el "activar", chocando con la fila que aún
            // sigue activa.
            var activasActuales = await _context.ProveedoresIa
                .Where(p => p.CurriculumId == curriculumId && p.EsActivo)
                .ToListAsync(ct);
            foreach (var activa in activasActuales) activa.EsActivo = false;
            await _context.SaveChangesAsync(ct);

            e.EsActivo = true;
            await _context.SaveChangesAsync(ct);
        }
        return Map(e);
    }

    public Task<ProbarConexionIaResponse> ProbarConexionAsync(ProbarConexionIaRequest r, CancellationToken ct = default)
        => EjecutarPruebaAsync(r.Proveedor, r.Modelo, r.Endpoint, r.ApiKey, ct);

    public async Task<ProbarConexionIaResponse> ProbarConexionGuardadaAsync(int curriculumId, int id, CancellationToken ct = default)
    {
        var e = await GetOwnedOrThrowAsync(curriculumId, id, ct);
        var apiKey = string.IsNullOrEmpty(e.ApiKeyCifrada) ? null : _cipher.Decrypt(e.ApiKeyCifrada);
        return await EjecutarPruebaAsync(e.Proveedor, e.Modelo, e.Endpoint, apiKey, ct);
    }

    private async Task<ProbarConexionIaResponse> EjecutarPruebaAsync(
        string proveedor, string? modelo, string? endpoint, string? apiKey, CancellationToken ct)
    {
        var cliente = _aiClients.FirstOrDefault(c => string.Equals(c.Proveedor, proveedor, StringComparison.OrdinalIgnoreCase));
        if (cliente is null)
        {
            return new ProbarConexionIaResponse(
                false, "Este proveedor todavía no tiene prueba de conexión real implementada; la conexión se puede guardar igual.");
        }

        var (ok, mensaje) = await cliente.ProbarConexionAsync(modelo, endpoint, apiKey, ct);
        return new ProbarConexionIaResponse(ok, mensaje);
    }

    private async Task<ProveedorIa> GetOwnedOrThrowAsync(int curriculumId, int id, CancellationToken ct)
    {
        var entity = await _context.ProveedoresIa.FirstOrDefaultAsync(p => p.ProveedorIaId == id, ct)
            ?? throw new KeyNotFoundException($"ProveedorIa {id} no encontrado.");

        if (entity.CurriculumId != curriculumId)
            throw new ForbiddenOperationException($"ProveedorIa {id} no pertenece al curriculum {curriculumId}.");

        return entity;
    }

    private static void ValidarProveedor(string proveedor)
    {
        if (!ProveedoresValidos.Contains(proveedor))
            throw new ArgumentException("El proveedor de IA no es válido.");
    }

    private static void ValidarApiKeyRequerida(string proveedor, string? apiKey)
    {
        if (ProveedoresQueRequierenApiKey.Contains(proveedor) && string.IsNullOrWhiteSpace(apiKey))
            throw new ArgumentException("La clave de API es requerida para este proveedor.");
    }

    private static void ValidarEndpointRequerido(string proveedor, string? endpoint)
    {
        if (ProveedoresQueRequierenEndpoint.Contains(proveedor) && string.IsNullOrWhiteSpace(endpoint))
            throw new ArgumentException("Este proveedor requiere la URL del servidor.");
    }

    private static ProveedorIaDto Map(ProveedorIa e) => new(
        e.ProveedorIaId, e.Proveedor, e.Nombre, e.Modelo, e.Endpoint, e.EsActivo, e.FechaActualizacion);
}
