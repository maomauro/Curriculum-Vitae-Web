using System.Net;

namespace PortalCV.Api.Tests;

/// <summary>
/// Tests de integracion sobre el pipeline de autenticacion: verifican que la
/// pipeline JWT esta activa y que los endpoints protegidos rechazan requests
/// sin token.
/// </summary>
public class AuthEndpointsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public AuthEndpointsTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetMe_SinToken_Retorna401()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ForgotPassword_DevuelveMensajeGenerico()
    {
        // ForgotPassword nunca revela si el email existe: siempre 200 con mensaje generico.
        var client = _factory.CreateClient();
        var payload = new StringContent(
            "{\"email\":\"noexiste@example.com\"}",
            System.Text.Encoding.UTF8,
            "application/json");

        var response = await client.PostAsync("/api/auth/forgot-password", payload);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task DashboardStats_SinToken_Retorna401()
    {
        // Cualquier endpoint que herede de CvControllerBase requiere JWT valido.
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/dashboard/stats");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
