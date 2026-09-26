using Microsoft.EntityFrameworkCore;
using PortalCV.Application.Constants;
using PortalCV.Application.Interfaces;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

public class IaPromptInvoker : IIaPromptInvoker
{
    private readonly PortalCvDbContext _context;
    private readonly IApiKeyCipher _cipher;
    private readonly IEnumerable<IAiProviderClient> _aiClients;
    private readonly IPromptIaRepository _prompts;
    private readonly IPromptEnsambladorService _ensamblador;

    public IaPromptInvoker(
        PortalCvDbContext context,
        IApiKeyCipher cipher,
        IEnumerable<IAiProviderClient> aiClients,
        IPromptIaRepository prompts,
        IPromptEnsambladorService ensamblador)
    {
        _context = context;
        _cipher = cipher;
        _aiClients = aiClients;
        _prompts = prompts;
        _ensamblador = ensamblador;
    }

    public async Task<(string TextoRespuesta, bool PromptPorDefecto)> InvocarAsync(
        int curriculumId,
        string codigoPrompt,
        string contenidoPromptPorDefecto,
        IReadOnlyDictionary<string, string> valores,
        byte[]? imagenBytes = null,
        string? imagenContentType = null,
        CancellationToken ct = default)
    {
        var proveedorConfig = await _context.ProveedoresIa.AsNoTracking()
            .FirstOrDefaultAsync(p => p.EsActivo, ct)
            ?? throw new ArgumentException(ApiMessages.Ia.SinProveedorActivo);

        var cliente = _aiClients.FirstOrDefault(c =>
            string.Equals(c.Proveedor, proveedorConfig.Proveedor, StringComparison.OrdinalIgnoreCase))
            ?? throw new ArgumentException(ApiMessages.Ia.ProveedorSinClienteReal(proveedorConfig.Proveedor));

        var apiKey = string.IsNullOrEmpty(proveedorConfig.ApiKeyCifrada) ? null : _cipher.Decrypt(proveedorConfig.ApiKeyCifrada);

        var promptActivo = await _prompts.GetActivoPorCodigoAsync(curriculumId, codigoPrompt, ct);
        var contenidoPrompt = promptActivo?.Contenido ?? contenidoPromptPorDefecto;
        var promptFinal = _ensamblador.Ensamblar(contenidoPrompt, valores);

        var (ok, textoRespuesta, error) = await cliente.GenerarTextoAsync(
            proveedorConfig.Modelo, proveedorConfig.Endpoint, apiKey, promptFinal,
            imagenBytes, imagenContentType, ct);

        if (!ok || textoRespuesta is null)
            throw new ArgumentException(error ?? "No se pudo completar la solicitud a la IA.");

        return (textoRespuesta, promptActivo is null);
    }
}
