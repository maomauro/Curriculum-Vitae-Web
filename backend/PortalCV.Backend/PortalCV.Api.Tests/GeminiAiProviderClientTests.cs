using System.Net;
using PortalCV.Infrastructure.Services;

namespace PortalCV.Api.Tests;

/// <summary>
/// Tests unitarios de GeminiAiProviderClient con un HttpMessageHandler falso — nunca
/// llama a la red real de Google. Cubre el mapeo de códigos de estado HTTP a
/// (Ok, Mensaje) y que la clave se envía en el header esperado.
/// </summary>
public class GeminiAiProviderClientTests
{
    private sealed class FakeHandler : HttpMessageHandler
    {
        private readonly HttpStatusCode _status;
        private readonly string _body;

        public HttpRequestMessage? UltimaSolicitud { get; private set; }
        public string? UltimaSolicitudCuerpo { get; private set; }

        public FakeHandler(HttpStatusCode status, string body = "{}")
        {
            _status = status;
            _body = body;
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            UltimaSolicitud = request;
            UltimaSolicitudCuerpo = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(_status) { Content = new StringContent(_body) };
        }
    }

    private static (GeminiAiProviderClient Cliente, FakeHandler Handler) ClienteConRespuesta(HttpStatusCode status, string body = "{}")
    {
        var handler = new FakeHandler(status, body);
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://generativelanguage.googleapis.com/") };
        return (new GeminiAiProviderClient(httpClient), handler);
    }

    [Fact]
    public async Task ProbarConexionAsync_ConRespuesta200_DevuelveOk()
    {
        var (cliente, _) = ClienteConRespuesta(HttpStatusCode.OK, "{\"candidates\":[]}");

        var (ok, mensaje) = await cliente.ProbarConexionAsync("gemini-2.5-flash", null, "clave-valida");

        Assert.True(ok);
        Assert.False(string.IsNullOrWhiteSpace(mensaje));
    }

    [Fact]
    public async Task ProbarConexionAsync_Con403_DevuelveOkFalseYMensajeDeClaveInvalida()
    {
        var (cliente, _) = ClienteConRespuesta(HttpStatusCode.Forbidden);

        var (ok, mensaje) = await cliente.ProbarConexionAsync(null, null, "clave-invalida");

        Assert.False(ok);
        Assert.Contains("clave", mensaje, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ProbarConexionAsync_Con400YCuerpoApiKeyInvalid_DevuelveOkFalseYMensajeDeClaveInvalida()
    {
        var (cliente, _) = ClienteConRespuesta(HttpStatusCode.BadRequest, "{\"error\":{\"status\":\"API_KEY_INVALID\"}}");

        var (ok, mensaje) = await cliente.ProbarConexionAsync(null, null, "clave-invalida");

        Assert.False(ok);
        Assert.Contains("clave", mensaje, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ProbarConexionAsync_Con404_DevuelveOkFalseYMensajeDeModelo()
    {
        var (cliente, _) = ClienteConRespuesta(HttpStatusCode.NotFound);

        var (ok, mensaje) = await cliente.ProbarConexionAsync("modelo-inexistente", null, "clave");

        Assert.False(ok);
        Assert.Contains("modelo", mensaje, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ProbarConexionAsync_ConErrorDeServidor_DevuelveOkFalseConCodigoEnElMensaje()
    {
        var (cliente, _) = ClienteConRespuesta(HttpStatusCode.InternalServerError);

        var (ok, mensaje) = await cliente.ProbarConexionAsync(null, null, "clave");

        Assert.False(ok);
        Assert.Contains("500", mensaje);
    }

    [Fact]
    public async Task ProbarConexionAsync_EnviaLaClaveComoQueryParam()
    {
        var (cliente, handler) = ClienteConRespuesta(HttpStatusCode.OK);

        await cliente.ProbarConexionAsync(null, null, "clave-secreta-123");

        Assert.NotNull(handler.UltimaSolicitud);
        Assert.Contains("key=clave-secreta-123", handler.UltimaSolicitud!.RequestUri!.Query);
    }

    [Fact]
    public async Task ProbarConexionAsync_SinApiKey_DevuelveOkFalseSinLlamarARed()
    {
        var (cliente, handler) = ClienteConRespuesta(HttpStatusCode.OK);

        var (ok, mensaje) = await cliente.ProbarConexionAsync(null, null, null);

        Assert.False(ok);
        Assert.False(string.IsNullOrWhiteSpace(mensaje));
        Assert.Null(handler.UltimaSolicitud);
    }

    [Fact]
    public void Proveedor_EsGemini()
    {
        var (cliente, _) = ClienteConRespuesta(HttpStatusCode.OK);
        Assert.Equal("gemini", cliente.Proveedor);
    }

    [Fact]
    public async Task GenerarTextoAsync_SinApiKey_DevuelveOkFalseSinLlamarARed()
    {
        var (cliente, handler) = ClienteConRespuesta(HttpStatusCode.OK);

        var (ok, texto, error) = await cliente.GenerarTextoAsync(null, null, null, "prompt", null, null);

        Assert.False(ok);
        Assert.Null(texto);
        Assert.False(string.IsNullOrWhiteSpace(error));
        Assert.Null(handler.UltimaSolicitud);
    }

    [Fact]
    public async Task GenerarTextoAsync_ConRespuesta200_DevuelveElTextoDeLaPrimeraParte()
    {
        var (cliente, _) = ClienteConRespuesta(
            HttpStatusCode.OK,
            "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"{\\\"cargo\\\":\\\"Dev\\\"}\"}]}}]}");

        var (ok, texto, error) = await cliente.GenerarTextoAsync(null, null, "clave", "prompt", null, null);

        Assert.True(ok);
        Assert.Equal("{\"cargo\":\"Dev\"}", texto);
        Assert.Null(error);
    }

    [Fact]
    public async Task GenerarTextoAsync_ConImagenAdjunta_ArmaUnaParteInlineDataYUnaDeTexto()
    {
        var (cliente, handler) = ClienteConRespuesta(
            HttpStatusCode.OK, "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"ok\"}]}}]}");
        var imagen = new byte[] { 1, 2, 3, 4 };

        await cliente.GenerarTextoAsync(null, null, "clave", "prompt", imagen, "image/jpeg");

        var cuerpo = handler.UltimaSolicitudCuerpo;
        Assert.NotNull(cuerpo);
        Assert.Contains("inlineData", cuerpo);
        Assert.Contains("image/jpeg", cuerpo);
        Assert.Contains(Convert.ToBase64String(imagen), cuerpo);
    }

    [Fact]
    public async Task GenerarTextoAsync_ConRespuestaSinCandidates_DevuelveOkFalseConFormatoInesperado()
    {
        var (cliente, _) = ClienteConRespuesta(HttpStatusCode.OK, "{\"otraCosa\":true}");

        var (ok, texto, error) = await cliente.GenerarTextoAsync(null, null, "clave", "prompt", null, null);

        Assert.False(ok);
        Assert.Null(texto);
        Assert.False(string.IsNullOrWhiteSpace(error));
    }
}
