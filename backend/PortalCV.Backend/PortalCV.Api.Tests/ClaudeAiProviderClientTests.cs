using System.Net;
using PortalCV.Infrastructure.Services;

namespace PortalCV.Api.Tests;

/// <summary>
/// Tests unitarios de ClaudeAiProviderClient con un HttpMessageHandler falso — nunca
/// llama a la red real de Anthropic. Cubre el mapeo de códigos de estado HTTP a
/// (Ok, Mensaje) y que la clave se envía en el header esperado.
/// </summary>
public class ClaudeAiProviderClientTests
{
    private sealed class FakeHandler : HttpMessageHandler
    {
        private readonly HttpStatusCode _status;
        private readonly string _body;

        public HttpRequestMessage? UltimaSolicitud { get; private set; }
        /// <summary>Cuerpo leído durante SendAsync -- el request (y su Content) se
        /// dispone al salir del `using` en el cliente, así que leerlo después ya no
        /// funciona.</summary>
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

    private static (ClaudeAiProviderClient Cliente, FakeHandler Handler) ClienteConRespuesta(HttpStatusCode status, string body = "{}")
    {
        var handler = new FakeHandler(status, body);
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://api.anthropic.com/") };
        return (new ClaudeAiProviderClient(httpClient), handler);
    }

    [Fact]
    public async Task ProbarConexionAsync_ConRespuesta200_DevuelveOk()
    {
        var (cliente, _) = ClienteConRespuesta(HttpStatusCode.OK, "{\"id\":\"msg_1\"}");

        var (ok, mensaje) = await cliente.ProbarConexionAsync("claude-3-5-haiku-20241022", null, "clave-valida");

        Assert.True(ok);
        Assert.False(string.IsNullOrWhiteSpace(mensaje));
    }

    [Fact]
    public async Task ProbarConexionAsync_Con401_DevuelveOkFalseYMensajeDeClaveInvalida()
    {
        var (cliente, _) = ClienteConRespuesta(HttpStatusCode.Unauthorized);

        var (ok, mensaje) = await cliente.ProbarConexionAsync(null, null, "clave-invalida");

        Assert.False(ok);
        Assert.Contains("clave", mensaje, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ProbarConexionAsync_Con400_DevuelveOkFalseYMensajeDeModelo()
    {
        var (cliente, _) = ClienteConRespuesta(HttpStatusCode.BadRequest);

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
    public async Task ProbarConexionAsync_EnviaLaClaveEnElHeaderXApiKey()
    {
        var (cliente, handler) = ClienteConRespuesta(HttpStatusCode.OK);

        await cliente.ProbarConexionAsync(null, null, "clave-secreta-123");

        Assert.NotNull(handler.UltimaSolicitud);
        Assert.Equal("clave-secreta-123", handler.UltimaSolicitud!.Headers.GetValues("x-api-key").Single());
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
    public void Proveedor_EsClaude()
    {
        var (cliente, _) = ClienteConRespuesta(HttpStatusCode.OK);
        Assert.Equal("claude", cliente.Proveedor);
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
    public async Task GenerarTextoAsync_ConRespuesta200_DevuelveElTextoDelPrimerBloqueDeContenido()
    {
        var (cliente, _) = ClienteConRespuesta(
            HttpStatusCode.OK, "{\"content\":[{\"type\":\"text\",\"text\":\"{\\\"cargo\\\":\\\"Dev\\\"}\"}]}");

        var (ok, texto, error) = await cliente.GenerarTextoAsync(null, null, "clave", "prompt", null, null);

        Assert.True(ok);
        Assert.Equal("{\"cargo\":\"Dev\"}", texto);
        Assert.Null(error);
    }

    [Fact]
    public async Task GenerarTextoAsync_Con401_DevuelveMensajeDeClaveInvalida()
    {
        var (cliente, _) = ClienteConRespuesta(HttpStatusCode.Unauthorized);

        var (ok, texto, error) = await cliente.GenerarTextoAsync(null, null, "clave", "prompt", null, null);

        Assert.False(ok);
        Assert.Null(texto);
        Assert.Contains("clave", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GenerarTextoAsync_ConRespuestaSinCampoContent_DevuelveOkFalseConFormatoInesperado()
    {
        var (cliente, _) = ClienteConRespuesta(HttpStatusCode.OK, "{\"otraCosa\":true}");

        var (ok, texto, error) = await cliente.GenerarTextoAsync(null, null, "clave", "prompt", null, null);

        Assert.False(ok);
        Assert.Null(texto);
        Assert.False(string.IsNullOrWhiteSpace(error));
    }

    [Fact]
    public async Task GenerarTextoAsync_ConImagenAdjunta_ArmaUnBloqueDeImagenYUnoDeTexto()
    {
        var (cliente, handler) = ClienteConRespuesta(HttpStatusCode.OK, "{\"content\":[{\"type\":\"text\",\"text\":\"ok\"}]}");
        var imagen = new byte[] { 1, 2, 3, 4 };

        await cliente.GenerarTextoAsync(null, null, "clave", "prompt", imagen, "image/png");

        var cuerpo = handler.UltimaSolicitudCuerpo;
        Assert.NotNull(cuerpo);
        Assert.Contains("\"type\":\"image\"", cuerpo);
        Assert.Contains("image/png", cuerpo);
        Assert.Contains(Convert.ToBase64String(imagen), cuerpo);
        Assert.Contains("\"type\":\"text\"", cuerpo);
    }
}
