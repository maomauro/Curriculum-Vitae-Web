using PortalCV.Application.Constants;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;

namespace PortalCV.Infrastructure.Services;

public class OfertaAnalisisService : IOfertaAnalisisService
{
    private const string CodigoPromptExtractor = "EXTRACTOR_OFERTA";
    private static readonly string[] ImagenContentTypesPermitidos = { "image/jpeg", "image/png", "image/webp" };
    private const long ImagenMaxBytes = 5 * 1024 * 1024;

    private readonly IIaPromptInvoker _invoker;

    public OfertaAnalisisService(IIaPromptInvoker invoker)
    {
        _invoker = invoker;
    }

    public async Task<OfertaAnalizadaDto> AnalizarAsync(
        int curriculumId,
        string? texto,
        byte[]? imagenBytes,
        string? imagenContentType,
        string? nombreArchivoImagen,
        CancellationToken ct = default)
    {
        var textoNormalizado = string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();
        var hayImagen = imagenBytes is { Length: > 0 };

        if (textoNormalizado is null && !hayImagen)
            throw new ArgumentException(ApiMessages.OfertaAnalisis.SinEntrada);

        if (hayImagen)
            ValidarImagen(imagenBytes!, imagenContentType);

        var valores = new Dictionary<string, string>
        {
            ["OFERTA_TEXTO"] = textoNormalizado ?? "(sin texto pegado; toda la información viene de la imagen adjunta)",
        };

        var (textoRespuesta, promptPorDefecto) = await _invoker.InvocarAsync(
            curriculumId, CodigoPromptExtractor, PromptsPorDefecto.ExtractorOferta, valores,
            imagenBytes, imagenContentType, ct);

        var extraido = RespuestaIaJsonParser.Parsear<OfertaExtraidaJson>(textoRespuesta);

        var origenEntrada = (textoNormalizado, hayImagen) switch
        {
            (not null, true) => "ambos",
            (null, true) => "imagen",
            _ => "texto",
        };
        var textoOriginal = ConstruirTextoOriginal(textoNormalizado, hayImagen, nombreArchivoImagen);

        return new OfertaAnalizadaDto(
            extraido.Cargo ?? string.Empty,
            extraido.Empresa ?? string.Empty,
            string.IsNullOrWhiteSpace(extraido.Descripcion) ? null : extraido.Descripcion,
            string.IsNullOrWhiteSpace(extraido.CorreoReclutador) ? null : extraido.CorreoReclutador,
            string.IsNullOrWhiteSpace(extraido.NombreReclutador) ? null : extraido.NombreReclutador,
            textoOriginal,
            origenEntrada,
            promptPorDefecto,
            NuloSiVacio(extraido.Modalidad),
            NuloSiVacio(extraido.TipoContrato),
            NuloSiVacio(extraido.Moneda),
            NuloSiVacio(extraido.Duracion),
            NuloSiVacio(extraido.Horario),
            NuloSiVacio(extraido.ExperienciaRequerida),
            NuloSiVacio(extraido.StackTecnologico),
            NuloSiVacio(extraido.NivelIdioma));
    }

    private static string? NuloSiVacio(string? texto) => string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();

    private static void ValidarImagen(byte[] contenido, string? contentType)
    {
        if (contenido.Length > ImagenMaxBytes)
            throw new ArgumentException(ApiMessages.OfertaAnalisis.ImagenDemasiadoGrande);
        if (!ImagenContentTypesPermitidos.Contains(contentType, StringComparer.OrdinalIgnoreCase))
            throw new ArgumentException(ApiMessages.OfertaAnalisis.ImagenNoSoportada);
    }

    private static string ConstruirTextoOriginal(string? texto, bool hayImagen, string? nombreArchivoImagen)
    {
        if (!hayImagen)
            return texto ?? string.Empty;

        var notaImagen = string.IsNullOrWhiteSpace(nombreArchivoImagen)
            ? "(imagen adjunta)"
            : $"(imagen adjunta: {nombreArchivoImagen})";

        return texto is null ? notaImagen : $"{texto}\n\n{notaImagen}";
    }

    private sealed class OfertaExtraidaJson
    {
        public string? Cargo { get; set; }
        public string? Empresa { get; set; }
        public string? Descripcion { get; set; }
        public string? CorreoReclutador { get; set; }
        public string? NombreReclutador { get; set; }
        public string? Modalidad { get; set; }
        public string? TipoContrato { get; set; }
        public string? Moneda { get; set; }
        public string? Duracion { get; set; }
        public string? Horario { get; set; }
        public string? ExperienciaRequerida { get; set; }
        public string? StackTecnologico { get; set; }
        public string? NivelIdioma { get; set; }
    }
}
