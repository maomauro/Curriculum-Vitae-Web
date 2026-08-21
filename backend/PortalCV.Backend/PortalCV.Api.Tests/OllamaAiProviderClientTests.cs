using System.Net;
using PortalCV.Infrastructure.Services;

namespace PortalCV.Api.Tests;

/// <summary>
/// Tests unitarios de OllamaAiProviderClient con un HttpMessageHandler falso — nunca
/// llama a la red real. Cubre validación del endpoint, ausencia de clave de API
/// (opcional en Ollama) y detección de si el modelo solicitado está descargado.
/// </summary>
public class OllamaAiProviderClientTests
{
    private const string EndpointValido = "http://localhost:11434";

    private sealed class FakeHandler : HttpMessageHandler
    {
        private readonly HttpStatusCode _status;
        private readonly string _body;

        public HttpRequestMessage? UltimaSolicitud { get; private set; }

        public FakeHandler(HttpStatusCode status, string body = "{\"models\":[]}")
        {
            _status = status;
            _body = body;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            UltimaSolicitud = request;
            var response = new HttpResponseMessage(_status) { Content = new StringContent(_body) };
            return Task.FromResult(response);
        }
    }

    private static (OllamaAiProviderClient Cliente, FakeHandler Handler) ClienteConRespuesta(HttpStatusCode status, string body = "{\"models\":[]}")
    {
        var handler = new FakeHandler(status, body);
        return (new OllamaAiProviderClient(new HttpClient(handler)), handler);
    }

    [Fact]
    public async Task ProbarConexionAsync_ConRespuesta200SinModeloPedido_DevuelveOk()
    {
        var (cliente, _) = ClienteConRespuesta(HttpStatusCode.OK);

        var (ok, mensaje) = await cliente.ProbarConexionAsync(null, EndpointValido, null);

        Assert.True(ok);
        Assert.False(string.IsNullOrWhiteSpace(mensaje));
    }

    [Fact]
    public async Task ProbarConexionAsync_SinEndpoint_DevuelveOkFalseSinLlamarARed()
    {
        var (cliente, handler) = ClienteConRespuesta(HttpStatusCode.OK);

        var (ok, mensaje) = await cliente.ProbarConexionAsync(null, null, null);

        Assert.False(ok);
        Assert.False(string.IsNullOrWhiteSpace(mensaje));
        Assert.Null(handler.UltimaSolicitud);
    }

    [Fact]
    public async Task ProbarConexionAsync_ConEndpointNoValido_DevuelveOkFalseSinLlamarARed()
    {
        var (cliente, handler) = ClienteConRespuesta(HttpStatusCode.OK);

        var (ok, mensaje) = await cliente.ProbarConexionAsync(null, "no-es-una-url", null);

        Assert.False(ok);
        Assert.False(string.IsNullOrWhiteSpace(mensaje));
        Assert.Null(handler.UltimaSolicitud);
    }

    [Fact]
    public async Task ProbarConexionAsync_ConHostDeMetadatosBloqueado_DevuelveOkFalseSinLlamarARed()
    {
        var (cliente, handler) = ClienteConRespuesta(HttpStatusCode.OK);

        var (ok, mensaje) = await cliente.ProbarConexionAsync(null, "http://169.254.169.254/", null);

        Assert.False(ok);
        Assert.False(string.IsNullOrWhiteSpace(mensaje));
        Assert.Null(handler.UltimaSolicitud);
    }

    [Fact]
    public async Task ProbarConexionAsync_ConModeloDescargado_DevuelveOkConMensajeExitoso()
    {
        var (cliente, _) = ClienteConRespuesta(HttpStatusCode.OK, "{\"models\":[{\"name\":\"llama3.1:latest\"}]}");

        var (ok, mensaje) = await cliente.ProbarConexionAsync("llama3.1", EndpointValido, null);

        Assert.True(ok);
        Assert.DoesNotContain("no está descargado", mensaje);
    }

    [Fact]
    public async Task ProbarConexionAsync_ConModeloNoDescargado_DevuelveOkTrueConAviso()
    {
        var (cliente, _) = ClienteConRespuesta(HttpStatusCode.OK, "{\"models\":[{\"name\":\"llama3.1:latest\"}]}");

        var (ok, mensaje) = await cliente.ProbarConexionAsync("mistral", EndpointValido, null);

        Assert.True(ok);
        Assert.Contains("no está descargado", mensaje);
    }

    [Fact]
    public async Task ProbarConexionAsync_ConErrorDeServidor_DevuelveOkFalseConCodigoEnElMensaje()
    {
        var (cliente, _) = ClienteConRespuesta(HttpStatusCode.ServiceUnavailable);

        var (ok, mensaje) = await cliente.ProbarConexionAsync(null, EndpointValido, null);

        Assert.False(ok);
        Assert.Contains("503", mensaje);
    }

    [Fact]
    public async Task ProbarConexionAsync_ApuntaAlPathApiTagsDelEndpoint()
    {
        var (cliente, handler) = ClienteConRespuesta(HttpStatusCode.OK);

        await cliente.ProbarConexionAsync(null, EndpointValido, null);

        Assert.NotNull(handler.UltimaSolicitud);
        Assert.Equal("/api/tags", handler.UltimaSolicitud!.RequestUri!.AbsolutePath);
    }

    [Fact]
    public void Proveedor_EsOllama()
    {
        var (cliente, _) = ClienteConRespuesta(HttpStatusCode.OK);
        Assert.Equal("ollama", cliente.Proveedor);
    }
}
