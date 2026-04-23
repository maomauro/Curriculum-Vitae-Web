using System.Net;

namespace PortalCV.Api.Tests;

/// <summary>
/// Smoke tests de los endpoints publicos: deben ser accesibles sin JWT y no
/// fallar al consultar la base InMemory vacia.
/// </summary>
public class PublicEndpointsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public PublicEndpointsTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task BuscarCvs_SinAutenticacion_Retorna200YCeroResultados()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/public/cvs");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"total\":0", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetFiltros_SinAutenticacion_Retorna200()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/public/filters");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetDetalle_UrlInexistente_Retorna404()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/public/cvs/slug-que-no-existe-en-la-base");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Health_SinAutenticacion_Retorna200YHealthy()
    {
        // /health lo consume Azure Container Apps como liveness probe.
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Equal("Healthy", body);
    }

    [Fact]
    public async Task HealthReady_SinAutenticacion_Retorna200YHealthy()
    {
        // /health/ready valida conexion a base (InMemory en tests).
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/health/ready");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Equal("Healthy", body);
    }
}
