using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using PortalCV.Application.Constants;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Domain.Exceptions;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

public class OfertaEnvioService : IOfertaEnvioService
{
    private const string CodigoPromptRedactor = "REDACTOR_CORREO_OFERTA";
    private static readonly JsonSerializerOptions JsonOpciones = new(JsonSerializerDefaults.Web);

    private readonly PortalCvDbContext _context;
    private readonly IIaPromptInvoker _invoker;
    private readonly IApiKeyCipher _cipher;
    private readonly IEmailSender _emailSender;
    private readonly ICvPdfRendererService _pdfRenderer;
    private readonly ICvAuditoriaService _auditoriaCv;
    private readonly IHttpContextAccessor _http;

    public OfertaEnvioService(
        PortalCvDbContext context, IIaPromptInvoker invoker, IApiKeyCipher cipher, IEmailSender emailSender,
        ICvPdfRendererService pdfRenderer, ICvAuditoriaService auditoriaCv, IHttpContextAccessor http)
    {
        _context = context;
        _invoker = invoker;
        _cipher = cipher;
        _emailSender = emailSender;
        _pdfRenderer = pdfRenderer;
        _auditoriaCv = auditoriaCv;
        _http = http;
    }

    public async Task<CorreoBorradorDto> RedactarAsync(int curriculumId, int ofertaId, CancellationToken ct = default)
    {
        var oferta = await GetOfertaOwnedAsync(curriculumId, ofertaId, ct);
        ValidarNoEnviadaAun(oferta);
        var perfil = await GetPerfilAsignadoAsync(oferta, ct);

        var ofertaJson = JsonSerializer.Serialize(
            new { oferta.Cargo, oferta.Empresa, oferta.Descripcion, oferta.NombreReclutador }, JsonOpciones);
        var perfilJson = JsonSerializer.Serialize(
            new { perfil.NombrePerfil, perfil.DescripcionPerfil }, JsonOpciones);

        var valores = new Dictionary<string, string>
        {
            ["OFERTA_JSON"] = ofertaJson,
            ["PERFIL_JSON"] = perfilJson,
        };

        var (textoRespuesta, promptPorDefecto) = await _invoker.InvocarAsync(
            curriculumId, CodigoPromptRedactor, PromptsPorDefecto.RedactorCorreoOferta, valores, ct: ct);

        var generado = RespuestaIaJsonParser.Parsear<CorreoGeneradoJson>(textoRespuesta);
        var cuerpo = (generado.Cuerpo ?? string.Empty).Trim();

        var personales = await _context.Personales.AsNoTracking()
            .FirstOrDefaultAsync(p => p.CurriculumId == curriculumId, ct);
        var firma = ConstruirFirma(personales);
        if (!string.IsNullOrEmpty(firma))
            cuerpo = $"{cuerpo}\n\n{firma}";

        return new CorreoBorradorDto((generado.Asunto ?? string.Empty).Trim(), cuerpo, promptPorDefecto);
    }

    /// <summary>La IA nunca redacta la firma (mismo criterio que el resto de la app: los
    /// datos de contacto siempre vienen de Personales, no de la IA) -- se arma acá con
    /// los datos reales y se agrega al borrador antes de mostrárselo al usuario, para
    /// que lo que revisa/edita sea exactamente lo que se va a enviar.</summary>
    private static string ConstruirFirma(Personales? personales)
    {
        if (personales is null) return string.Empty;

        var nombreCompleto = string.Join(' ', new[]
            {
                personales.PrimerNombre, personales.SegundoNombre, personales.PrimerApellido, personales.SegundoApellido,
            }.Where(s => !string.IsNullOrWhiteSpace(s)));
        var telefono = personales.Celular ?? personales.TelefonoFijo;

        var lineas = new[] { nombreCompleto, telefono, personales.Email }
            .Where(s => !string.IsNullOrWhiteSpace(s));
        return string.Join('\n', lineas);
    }

    public async Task<OfertaDto> EnviarAsync(
        int curriculumId, int ofertaId, EnviarCorreoRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Destinatario))
            throw new ArgumentException("El correo del destinatario es requerido.");
        if (string.IsNullOrWhiteSpace(request.Asunto))
            throw new ArgumentException("El asunto del correo es requerido.");
        if (string.IsNullOrWhiteSpace(request.Cuerpo))
            throw new ArgumentException("El cuerpo del correo es requerido.");

        var oferta = await GetOfertaOwnedAsync(curriculumId, ofertaId, ct);
        ValidarNoEnviadaAun(oferta);
        var perfil = await GetPerfilAsignadoAsync(oferta, ct);

        var cvPerfil = await _context.CvsGenerados.AsNoTracking()
            .FirstOrDefaultAsync(c => c.PerfilId == perfil.PerfilId, ct)
            ?? throw new ArgumentException(
                $"El perfil «{perfil.NombrePerfil}» todavía no tiene un CV generado. Generalo primero en Mi CV.");

        var config = await _context.ConfiguracionesCorreo.AsNoTracking()
            .FirstOrDefaultAsync(c => c.CurriculumId == curriculumId, ct);
        if (config is null || string.IsNullOrEmpty(config.PasswordCifrada))
            throw new ArgumentException("Todavía no configuraste el correo saliente. Configuralo en Configuración.");

        var personales = await _context.Personales.AsNoTracking()
            .FirstOrDefaultAsync(p => p.CurriculumId == curriculumId, ct);
        if (personales is null || string.IsNullOrWhiteSpace(personales.Email))
            throw new ArgumentException("Falta el correo en Información Personal -- es el remitente del envío.");

        var contenido = JsonSerializer.Deserialize<ContenidoCvGeneradoDto>(cvPerfil.ContenidoJson, JsonOpciones)
            ?? new ContenidoCvGeneradoDto(new List<ExperienciaCondensadaDto>(), new List<string>(), new List<string>(), new List<HabilidadCondensadaDto>());

        var nombreCompleto = string.Join(' ', new[]
            {
                personales.PrimerNombre, personales.SegundoNombre, personales.PrimerApellido, personales.SegundoApellido,
            }.Where(s => !string.IsNullOrWhiteSpace(s)));

        var personalesDto = new PersonalesDto(
            personales.PersonalesId, personales.CurriculumId, null, null, null, null, null, null, null, null, null, null, null,
            personales.PrimerNombre, personales.SegundoNombre, personales.PrimerApellido, personales.SegundoApellido,
            null, null, null, null, null, null, null, null,
            personales.Email, personales.Celular, personales.TelefonoFijo,
            personales.Pais, null, personales.Ciudad, null, null, null, null, null);

        var perfilDto = new PerfilDto(
            perfil.PerfilId, perfil.NombrePerfil, perfil.DescripcionPerfil,
            perfil.ExperienciaPerfilAnios, perfil.AspiracionSalarialPesos, perfil.AspiracionSalarialDolares, perfil.EsActivo);

        var pdfBytes = _pdfRenderer.Renderar(personalesDto, perfilDto, contenido);
        var nombreArchivo = $"CV - {nombreCompleto}.pdf".Trim();

        var (ok, error) = await _emailSender.EnviarAsync(new EmailEnvioRequest(
            Host: config.Host,
            Puerto: config.Puerto,
            UsarTls: config.UsarTls,
            RemitenteEmail: personales.Email!,
            RemitenteNombre: string.IsNullOrWhiteSpace(nombreCompleto) ? null : nombreCompleto,
            PasswordSmtp: _cipher.Decrypt(config.PasswordCifrada!),
            DestinatarioEmail: request.Destinatario.Trim(),
            DestinatarioNombre: oferta.NombreReclutador,
            Asunto: request.Asunto.Trim(),
            CuerpoTexto: request.Cuerpo.Trim(),
            Adjuntos: new List<EmailAdjunto> { new(nombreArchivo, pdfBytes, "application/pdf") }), ct);

        if (!ok)
            throw new ArgumentException($"No se pudo enviar el correo: {error}");

        var ofertaTracked = await _context.Ofertas.FirstAsync(o => o.OfertaId == ofertaId, ct);
        ofertaTracked.Estado = "EnviadaPorCorreo";
        ofertaTracked.FechaEnvioCorreo = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        await _auditoriaCv.RegistrarAsync(
            TryGetActorUsuarioId(), curriculumId, CvAuditoriaAcciones.OfertaCorreoEnviar, "Oferta", ofertaId,
            new Dictionary<string, string> { ["destinatario"] = request.Destinatario.Trim() }, ct);

        return new OfertaDto(
            ofertaTracked.OfertaId, ofertaTracked.Cargo, ofertaTracked.Empresa, ofertaTracked.Descripcion,
            ofertaTracked.CorreoReclutador, ofertaTracked.NombreReclutador, ofertaTracked.TextoOriginal,
            ofertaTracked.OrigenEntrada, ofertaTracked.Estado, ofertaTracked.PerfilId,
            ofertaTracked.FechaAnalisis, ofertaTracked.FechaEnvioCorreo,
            ofertaTracked.Modalidad, ofertaTracked.TipoContrato, ofertaTracked.Moneda, ofertaTracked.Duracion,
            ofertaTracked.Horario, ofertaTracked.ExperienciaRequerida, ofertaTracked.StackTecnologico, ofertaTracked.NivelIdioma);
    }

    private async Task<Oferta> GetOfertaOwnedAsync(int curriculumId, int ofertaId, CancellationToken ct)
    {
        var oferta = await _context.Ofertas.FirstOrDefaultAsync(o => o.OfertaId == ofertaId, ct)
            ?? throw new KeyNotFoundException($"Oferta {ofertaId} no encontrada.");
        if (oferta.CurriculumId != curriculumId)
            throw new ForbiddenOperationException($"Oferta {ofertaId} no pertenece al curriculum {curriculumId}.");
        return oferta;
    }

    /// <summary>El front ya evita reabrir el flujo de envío para una oferta con estado
    /// EnviadaPorCorreo (la redirige a una vista de solo lectura) -- esta es la
    /// validación real del lado del servidor, por si el cliente queda con un estado
    /// desactualizado.</summary>
    private static void ValidarNoEnviadaAun(Oferta oferta)
    {
        if (oferta.Estado == "EnviadaPorCorreo")
        {
            var fecha = oferta.FechaEnvioCorreo?.ToString("dd/MM/yyyy") ?? "una fecha anterior";
            throw new ArgumentException($"Esta oferta ya fue enviada por correo el {fecha}. No se puede reenviar.");
        }
    }

    private async Task<Perfil> GetPerfilAsignadoAsync(Oferta oferta, CancellationToken ct)
    {
        if (oferta.PerfilId is null)
            throw new ArgumentException("Esta oferta todavía no tiene un perfil asignado.");

        return await _context.Perfiles.FirstOrDefaultAsync(p => p.PerfilId == oferta.PerfilId, ct)
            ?? throw new KeyNotFoundException($"Perfil {oferta.PerfilId} no encontrado.");
    }

    private int? TryGetActorUsuarioId()
    {
        var user = _http.HttpContext?.User;
        if (user?.Identity?.IsAuthenticated != true)
            return null;
        var v = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        return int.TryParse(v, out var id) && id > 0 ? id : null;
    }

    private sealed class CorreoGeneradoJson
    {
        public string? Asunto { get; set; }
        public string? Cuerpo { get; set; }
    }
}
