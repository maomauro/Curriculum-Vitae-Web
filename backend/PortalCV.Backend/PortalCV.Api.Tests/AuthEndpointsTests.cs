using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

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
    public async Task Login_CredencialesInvalidas_Retorna401()
    {
        var client = _factory.CreateClient();
        var payload = new StringContent(
            "{\"email\":\"noexiste@example.com\",\"password\":\"incorrecta\"}",
            Encoding.UTF8,
            "application/json");

        var response = await client.PostAsync("/api/auth/login", payload);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Register_EmailInvalido_Retorna400()
    {
        var client = _factory.CreateClient();
        var payload = new StringContent(
            "{\"email\":\"no-es-un-correo\",\"password\":\"password123\",\"nombreCompleto\":\"Test User\"}",
            Encoding.UTF8,
            "application/json");

        var response = await client.PostAsync("/api/auth/register", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Register_PasswordCorta_Retorna400()
    {
        var client = _factory.CreateClient();
        var payload = new StringContent(
            "{\"email\":\"nuevo@example.com\",\"password\":\"1234567\",\"nombreCompleto\":\"Test User\"}",
            Encoding.UTF8,
            "application/json");

        var response = await client.PostAsync("/api/auth/register", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Register_CamposVacios_Retorna400()
    {
        var client = _factory.CreateClient();
        var payload = new StringContent(
            "{\"email\":\"\",\"password\":\"\",\"nombreCompleto\":\"\"}",
            Encoding.UTF8,
            "application/json");

        var response = await client.PostAsync("/api/auth/register", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_EmailInvalido_Retorna400()
    {
        var client = _factory.CreateClient();
        var payload = new StringContent(
            "{\"email\":\"no-es-un-correo\",\"password\":\"algo\"}",
            Encoding.UTF8,
            "application/json");

        var response = await client.PostAsync("/api/auth/login", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_CredencialesValidas_DevuelveCookieHttpOnlySinTokenEnBody()
    {
        var client = _factory.CreateClient();
        var email = $"cookie-test-{Guid.NewGuid():N}@example.com";

        var registerPayload = new StringContent(
            $"{{\"email\":\"{email}\",\"password\":\"password123\",\"nombreCompleto\":\"Cookie Test\"}}",
            Encoding.UTF8, "application/json");
        var registerResponse = await client.PostAsync("/api/auth/register", registerPayload);
        Assert.Equal(HttpStatusCode.Created, registerResponse.StatusCode);

        var loginPayload = new StringContent(
            $"{{\"email\":\"{email}\",\"password\":\"password123\"}}",
            Encoding.UTF8, "application/json");
        var loginResponse = await client.PostAsync("/api/auth/login", loginPayload);

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        // El JWT solo debe viajar como cookie HttpOnly, nunca en el body JSON.
        Assert.True(loginResponse.Headers.TryGetValues("Set-Cookie", out var cookies));
        var authCookie = cookies!.FirstOrDefault(c => c.StartsWith("portalcv_auth=", StringComparison.Ordinal));
        Assert.NotNull(authCookie);
        Assert.Contains("httponly", authCookie!, StringComparison.OrdinalIgnoreCase);

        var body = await loginResponse.Content.ReadAsStringAsync();
        Assert.DoesNotContain("\"token\"", body, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("\"usuarioId\"", body, StringComparison.OrdinalIgnoreCase);

        // La cookie por si sola (sin header Authorization) debe autenticar al endpoint protegido.
        // Cliente nuevo y sin cookie container propio: evita que se mezcle con cookies que
        // el handler por defecto ya haya podido capturar automaticamente de las respuestas previas.
        var cookieValue = authCookie!.Split(';')[0];
        using var meClient = _factory.CreateClient();
        var meRequest = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        meRequest.Headers.TryAddWithoutValidation("Cookie", cookieValue);
        var meResponse = await meClient.SendAsync(meRequest);

        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);

        // Regresion: el JwtBearerHandler remapea el claim corto "email" a ClaimTypes.Email;
        // si Me() solo busca la forma corta, este campo queda vacio (bug detectado en vivo).
        var meBody = await meResponse.Content.ReadAsStringAsync();
        Assert.Contains($"\"email\":\"{email}\"", meBody, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Logout_BorraLaCookieDelJwt()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsync("/api/auth/logout", new StringContent("", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("Set-Cookie", out var cookies));
        var authCookie = cookies!.FirstOrDefault(c => c.StartsWith("portalcv_auth=", StringComparison.Ordinal));
        Assert.NotNull(authCookie);
        Assert.Contains("portalcv_auth=;", authCookie!, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task DashboardStats_SinToken_Retorna401()
    {
        // Cualquier endpoint que herede de CvControllerBase requiere JWT valido.
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/dashboard/stats");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task DashboardStats_TokenSinCurriculumId_Retorna401()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", CrearJwtSinCurriculumId());

        var response = await client.GetAsync("/api/dashboard/stats");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private static string CrearJwtSinCurriculumId()
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, "123"),
            new Claim(JwtRegisteredClaimNames.Email, "test@example.com"),
            new Claim(ClaimTypes.Role, "Publicador"),
        };

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestWebApplicationFactory.TestJwtKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var jwt = new JwtSecurityToken(
            issuer: TestWebApplicationFactory.TestJwtIssuer,
            audience: TestWebApplicationFactory.TestJwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(5),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(jwt);
    }
}
