using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PortalCV.Application.Constants;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

public class PerfilSeleccionService : IPerfilSeleccionService
{
    private const string CodigoPromptSelector = "SELECTOR_PERFIL";

    private readonly PortalCvDbContext _context;
    private readonly IIaPromptInvoker _invoker;

    public PerfilSeleccionService(PortalCvDbContext context, IIaPromptInvoker invoker)
    {
        _context = context;
        _invoker = invoker;
    }

    public async Task<PerfilSugeridoDto> SugerirAsync(
        int curriculumId, SeleccionarPerfilRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Cargo) || string.IsNullOrWhiteSpace(request.Empresa))
            throw new ArgumentException("Cargo y empresa son requeridos para sugerir un perfil.");

        var perfiles = await _context.Perfiles.AsNoTracking()
            .Where(p => p.CurriculumId == curriculumId)
            .OrderBy(p => p.PerfilId)
            .ToListAsync(ct);

        // Este flujo ya no crea perfiles nuevos -- si el candidato no tiene ninguno,
        // no hay nada entre qué elegir.
        if (perfiles.Count == 0)
            throw new ArgumentException(
                "Todavía no tienes perfiles guardados. Crea al menos uno en Perfil Profesional antes de continuar.");

        // Un solo perfil: no tiene sentido gastar una llamada a la IA, la respuesta es
        // determinista.
        if (perfiles.Count == 1)
        {
            var unico = perfiles[0];
            return new PerfilSugeridoDto(unico.PerfilId, unico.NombrePerfil ?? string.Empty, "Es tu único perfil guardado.", false);
        }

        var valores = new Dictionary<string, string>
        {
            ["OFERTA_JSON"] = JsonSerializer.Serialize(new { request.Cargo, request.Empresa, request.Descripcion }),
            ["PERFILES_JSON"] = JsonSerializer.Serialize(
                perfiles.Select(p => new { p.PerfilId, p.NombrePerfil, p.DescripcionPerfil })),
        };

        var (textoRespuesta, promptPorDefecto) = await _invoker.InvocarAsync(
            curriculumId, CodigoPromptSelector, PromptsPorDefecto.SelectorPerfil, valores, ct: ct);

        var sugerido = RespuestaIaJsonParser.Parsear<PerfilSugeridoJson>(textoRespuesta);

        // Defensa: si la IA "alucina" un PerfilId que no existe (o de otro CV), cae al
        // primer perfil de la lista en vez de confiar ciegamente en el número --
        // siempre debe devolver un perfil real, ya no existe la salida "nuevo".
        var perfilValido = sugerido.PerfilId.HasValue
            ? perfiles.FirstOrDefault(p => p.PerfilId == sugerido.PerfilId.Value)
            : null;

        if (perfilValido is not null)
        {
            var razon = string.IsNullOrWhiteSpace(sugerido.Razon) ? "Sin razón indicada por la IA." : sugerido.Razon.Trim();
            return new PerfilSugeridoDto(perfilValido.PerfilId, perfilValido.NombrePerfil ?? string.Empty, razon, promptPorDefecto);
        }

        var primero = perfiles[0];
        return new PerfilSugeridoDto(
            primero.PerfilId, primero.NombrePerfil ?? string.Empty,
            "La IA no sugirió un perfil válido; se preseleccionó el primero de tu lista.", promptPorDefecto);
    }

    private sealed class PerfilSugeridoJson
    {
        public int? PerfilId { get; set; }
        public string? Razon { get; set; }
    }
}
