using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Tokens;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Api.Tests;

/// <summary>
/// Tests de integracion de POST /api/cv/ofertas/{id}/redactar-correo y
/// /enviar-correo -- reemplazan al viejo "generar CV para la oferta". Reemplaza
/// IAiProviderClient e IEmailSender por dobles de prueba: nunca llama a un proveedor de
/// IA real ni envia un correo real.
/// </summary>
public class OfertaEnvioEndpointTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions CamelCase = new(JsonSerializerDefaults.Web);
    private const string RespuestaCorreoValida = "{\"asunto\":\"Postulación -- Backend .NET\",\"cuerpo\":\"Estimado reclutador, escribo para postularme...\"}";

    public OfertaEnvioEndpointTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private sealed class FakeAiProviderClient : IAiProviderClient
    {
        public string Proveedor { get; }
        public bool Ok { get; set; } = true;
        public string? Texto { get; set; }
        public string? Error { get; set; }

        public FakeAiProviderClient(string proveedor) => Proveedor = proveedor;

        public Task<(bool Ok, string Mensaje)> ProbarConexionAsync(
            string? modelo, string? endpoint, string? apiKey, CancellationToken ct = default)
            => Task.FromResult((true, "ok"));

        public Task<(bool Ok, string? Texto, string? Error)> GenerarTextoAsync(
            string? modelo, string? endpoint, string? apiKey, string prompt,
            byte[]? imagenBytes, string? imagenContentType, CancellationToken ct = default)
            => Task.FromResult((Ok, Texto, Error));
    }

    private sealed class FakeEmailSender : IEmailSender
    {
        public bool Ok { get; set; } = true;
        public string? Error { get; set; }
        public EmailEnvioRequest? UltimoRequest { get; private set; }

        public Task<(bool Ok, string? Error)> EnviarAsync(EmailEnvioRequest request, CancellationToken ct = default)
        {
            UltimoRequest = request;
            return Task.FromResult((Ok, Error));
        }
    }

    private WebApplicationFactory<PortalCV.Api.Program> CreateFactory(FakeAiProviderClient? ai, FakeEmailSender? email)
        => _factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IAiProviderClient>();
            if (ai is not null) services.AddSingleton<IAiProviderClient>(ai);

            services.RemoveAll<IEmailSender>();
            if (email is not null) services.AddSingleton<IEmailSender>(email);
        }));

    private async Task<(HttpClient Client, int CurriculumId)> AuthenticateAsync(
        WebApplicationFactory<PortalCV.Api.Program> factory, string emailPrefix)
    {
        int usuarioId;
        int curriculumId;

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();
            var usuario = new Usuario
            {
                Email = $"{emailPrefix}-{Guid.NewGuid():N}@example.com",
                PasswordHash = "no-se-usa-en-este-test",
                Estado = "Activo",
                FechaRegistro = DateTime.UtcNow,
            };
            var curriculum = new Curriculum
            {
                UrlPublica = $"cv-{Guid.NewGuid():N}",
                Estado = "Borrador",
                FechaCreacion = DateTime.UtcNow,
                FechaActualizacion = DateTime.UtcNow,
                Usuario = usuario,
            };
            usuario.Curriculums.Add(curriculum);
            db.Usuarios.Add(usuario);
            await db.SaveChangesAsync();

            usuarioId = usuario.UsuarioId;
            curriculumId = curriculum.CurriculumId;
        }

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuarioId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, $"{emailPrefix}@example.com"),
            new Claim("curriculum_id", curriculumId.ToString()),
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
        var token = new JwtSecurityTokenHandler().WriteToken(jwt);

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Cookie", $"portalcv_auth={token}");
        return (client, curriculumId);
    }

    private static async Task AgregarProveedorActivoAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync(
            "/api/cv/proveedor-ia",
            new { proveedor = "claude", nombre = (string?)null, modelo = (string?)null, endpoint = (string?)null, apiKey = "clave-de-prueba" },
            CamelCase);
        response.EnsureSuccessStatusCode();
    }

    private static async Task ConfigurarPersonalesAsync(HttpClient client)
    {
        var response = await client.PutAsJsonAsync("/api/cv/personales", new
        {
            tipoIdentificacion = (string?)null, numeroDocumento = (string?)null, fechaExpedicion = (string?)null,
            lugarExpedicion = (string?)null, libretaMilitarNumero = (string?)null, libretaMilitarClase = (string?)null,
            pasaporteNumero = (string?)null, pasaporteVigencia = (string?)null, visaNumero = (string?)null,
            visaVigencia = (string?)null, visaClase = (string?)null,
            primerNombre = "Ana", segundoNombre = (string?)null, primerApellido = "Ríos", segundoApellido = (string?)null,
            fechaNacimiento = (string?)null, lugarNacimiento = (string?)null, genero = (string?)null,
            nacionalidad = (string?)null, tipoSangre = (string?)null, ePS = (string?)null, pencion = (string?)null,
            cesantias = (string?)null,
            email = "ana@example.com", celular = "3001234567", telefonoFijo = (string?)null,
            pais = "Colombia", departamento = (string?)null, ciudad = "Bogotá", barrio = (string?)null,
            codigoPostal = (string?)null, direccion = (string?)null, tipoResidencia = (string?)null,
        }, CamelCase);
        response.EnsureSuccessStatusCode();
    }

    private static async Task ConfigurarCorreoAsync(HttpClient client)
    {
        var response = await client.PutAsJsonAsync(
            "/api/cv/configuracion-correo",
            new { host = "smtp.gmail.com", puerto = 587, usarTls = true, password = "clave-de-aplicacion" },
            CamelCase);
        response.EnsureSuccessStatusCode();
    }

    private static async Task<int> CrearPerfilAsync(HttpClient client, string nombre)
    {
        var response = await client.PostAsJsonAsync("/api/cv/perfiles", new
        {
            nombrePerfil = nombre,
            descripcionPerfil = "Descripción de prueba.",
            experienciaPerfilAnios = (decimal?)null,
            aspiracionSalarialPesos = (decimal?)null,
            aspiracionSalarialDolares = (decimal?)null,
            esActivo = true,
        }, CamelCase);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("perfilId").GetInt32();
    }

    private static async Task<int> CrearOfertaAsync(HttpClient client, int? perfilId, string estado)
    {
        var response = await client.PostAsJsonAsync("/api/cv/ofertas", new
        {
            cargo = "Desarrollador Backend",
            empresa = "Acme",
            descripcion = "Una oferta de prueba",
            correoReclutador = "reclutador@acme.com",
            nombreReclutador = "Laura Gómez",
            textoOriginal = "Texto de la oferta de prueba",
            origenEntrada = "texto",
            estado,
            perfilId,
        }, CamelCase);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("ofertaId").GetInt32();
    }

    [Fact]
    public async Task RedactarCorreo_SinPerfilAsignado_Devuelve400()
    {
        var factory = CreateFactory(new FakeAiProviderClient("claude") { Texto = RespuestaCorreoValida }, new FakeEmailSender());
        var (client, _) = await AuthenticateAsync(factory, "envio-sinperfil");
        var ofertaId = await CrearOfertaAsync(client, perfilId: null, estado: "Analizada");

        var response = await client.PostAsync($"/api/cv/ofertas/{ofertaId}/redactar-correo", null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task RedactarCorreo_ConPerfilAsignado_DevuelveElBorrador()
    {
        var factory = CreateFactory(new FakeAiProviderClient("claude") { Texto = RespuestaCorreoValida }, new FakeEmailSender());
        var (client, _) = await AuthenticateAsync(factory, "envio-redactar");
        await AgregarProveedorActivoAsync(client);
        var perfilId = await CrearPerfilAsync(client, "Backend .NET");
        var ofertaId = await CrearOfertaAsync(client, perfilId, "PerfilAsignado");

        var response = await client.PostAsync($"/api/cv/ofertas/{ofertaId}/redactar-correo", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Postulación -- Backend .NET", dto.GetProperty("asunto").GetString());
    }

    [Fact]
    public async Task RedactarCorreo_ConPersonalesConfigurado_AgregaLaFirmaAlCuerpo()
    {
        var factory = CreateFactory(new FakeAiProviderClient("claude") { Texto = RespuestaCorreoValida }, new FakeEmailSender());
        var (client, _) = await AuthenticateAsync(factory, "envio-firma");
        await AgregarProveedorActivoAsync(client);
        await ConfigurarPersonalesAsync(client);
        var perfilId = await CrearPerfilAsync(client, "Backend .NET");
        var ofertaId = await CrearOfertaAsync(client, perfilId, "PerfilAsignado");

        var response = await client.PostAsync($"/api/cv/ofertas/{ofertaId}/redactar-correo", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        var cuerpo = dto.GetProperty("cuerpo").GetString()!;
        Assert.StartsWith("Estimado reclutador", cuerpo);
        Assert.Contains("Ana Ríos", cuerpo);
        Assert.Contains("3001234567", cuerpo);
        Assert.Contains("ana@example.com", cuerpo);
    }

    [Fact]
    public async Task RedactarCorreo_OfertaYaEnviada_Devuelve400ConMensajeClaro()
    {
        var factory = CreateFactory(new FakeAiProviderClient("claude") { Texto = RespuestaCorreoValida }, new FakeEmailSender());
        var (client, _) = await AuthenticateAsync(factory, "envio-yaenviada-redactar");
        var perfilId = await CrearPerfilAsync(client, "Backend .NET");
        var ofertaId = await CrearOfertaAsync(client, perfilId, "EnviadaPorCorreo");

        var response = await client.PostAsync($"/api/cv/ofertas/{ofertaId}/redactar-correo", null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("ya fue enviada", body);
    }

    [Fact]
    public async Task EnviarCorreo_OfertaYaEnviada_Devuelve400ConMensajeClaroYNoReenvia()
    {
        var email = new FakeEmailSender();
        var factory = CreateFactory(new FakeAiProviderClient("claude") { Texto = RespuestaCorreoValida }, email);
        var (client, _) = await AuthenticateAsync(factory, "envio-yaenviada-enviar");
        var perfilId = await CrearPerfilAsync(client, "Backend .NET");
        var ofertaId = await CrearOfertaAsync(client, perfilId, "EnviadaPorCorreo");

        var response = await client.PostAsJsonAsync($"/api/cv/ofertas/{ofertaId}/enviar-correo",
            new { destinatario = "reclutador@acme.com", asunto = "Postulación", cuerpo = "Cuerpo" }, CamelCase);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("ya fue enviada", body);
        Assert.Null(email.UltimoRequest);
    }

    [Fact]
    public async Task EnviarCorreo_PerfilSinCvGenerado_Devuelve400ConMensajeClaro()
    {
        var factory = CreateFactory(new FakeAiProviderClient("claude"), new FakeEmailSender());
        var (client, _) = await AuthenticateAsync(factory, "envio-sincv");
        await AgregarProveedorActivoAsync(client);
        await ConfigurarCorreoAsync(client);
        var perfilId = await CrearPerfilAsync(client, "Backend .NET");
        var ofertaId = await CrearOfertaAsync(client, perfilId, "PerfilAsignado");

        var response = await client.PostAsJsonAsync($"/api/cv/ofertas/{ofertaId}/enviar-correo", new
        {
            destinatario = "reclutador@acme.com",
            asunto = "Postulación",
            cuerpo = "Cuerpo del correo.",
        }, CamelCase);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("CV generado", body);
    }

    [Fact]
    public async Task EnviarCorreo_SinConfiguracionCorreo_Devuelve400()
    {
        var factory = CreateFactory(new FakeAiProviderClient("claude") { Texto = "{\"experiencia\":[],\"educacion\":[],\"proyectos\":[],\"habilidades\":[]}" }, new FakeEmailSender());
        var (client, _) = await AuthenticateAsync(factory, "envio-sinconfig");
        await AgregarProveedorActivoAsync(client);
        var perfilId = await CrearPerfilAsync(client, "Backend .NET");
        await client.PostAsync($"/api/cv/perfiles/{perfilId}/generar-cv", null);
        var ofertaId = await CrearOfertaAsync(client, perfilId, "PerfilAsignado");

        var response = await client.PostAsJsonAsync($"/api/cv/ofertas/{ofertaId}/enviar-correo", new
        {
            destinatario = "reclutador@acme.com",
            asunto = "Postulación",
            cuerpo = "Cuerpo del correo.",
        }, CamelCase);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task EnviarCorreo_ConTodoListo_EnviaElCorreoConElPdfAdjuntoYActualizaLaOferta()
    {
        var fakeEmail = new FakeEmailSender();
        var factory = CreateFactory(
            new FakeAiProviderClient("claude") { Texto = "{\"experiencia\":[],\"educacion\":[],\"proyectos\":[],\"habilidades\":[\"C#\"]}" },
            fakeEmail);
        var (client, _) = await AuthenticateAsync(factory, "envio-completo");
        await AgregarProveedorActivoAsync(client);
        await ConfigurarPersonalesAsync(client);
        await ConfigurarCorreoAsync(client);
        var perfilId = await CrearPerfilAsync(client, "Backend .NET");
        var genResponse = await client.PostAsync($"/api/cv/perfiles/{perfilId}/generar-cv", null);
        Assert.True(genResponse.IsSuccessStatusCode, await genResponse.Content.ReadAsStringAsync());
        var ofertaId = await CrearOfertaAsync(client, perfilId, "PerfilAsignado");

        var response = await client.PostAsJsonAsync($"/api/cv/ofertas/{ofertaId}/enviar-correo", new
        {
            destinatario = "reclutador@acme.com",
            asunto = "Postulación -- Backend .NET",
            cuerpo = "Cuerpo del correo.",
        }, CamelCase);

        Assert.True(response.IsSuccessStatusCode, await response.Content.ReadAsStringAsync());
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("EnviadaPorCorreo", dto.GetProperty("estado").GetString());
        Assert.False(dto.GetProperty("fechaEnvioCorreo").ValueKind == JsonValueKind.Null);

        Assert.NotNull(fakeEmail.UltimoRequest);
        Assert.Equal("reclutador@acme.com", fakeEmail.UltimoRequest!.DestinatarioEmail);
        Assert.Single(fakeEmail.UltimoRequest.Adjuntos);
        Assert.Equal("application/pdf", fakeEmail.UltimoRequest.Adjuntos[0].ContentType);
        Assert.NotEmpty(fakeEmail.UltimoRequest.Adjuntos[0].Bytes);
    }

    [Fact]
    public async Task EnviarCorreo_SiElEnvioFalla_NoCambiaElEstadoDeLaOferta()
    {
        var factory = CreateFactory(
            new FakeAiProviderClient("claude") { Texto = "{\"experiencia\":[],\"educacion\":[],\"proyectos\":[],\"habilidades\":[]}" },
            new FakeEmailSender { Ok = false, Error = "SMTP rechazó la autenticación." });
        var (client, _) = await AuthenticateAsync(factory, "envio-falla");
        await AgregarProveedorActivoAsync(client);
        await ConfigurarPersonalesAsync(client);
        await ConfigurarCorreoAsync(client);
        var perfilId = await CrearPerfilAsync(client, "Backend .NET");
        await client.PostAsync($"/api/cv/perfiles/{perfilId}/generar-cv", null);
        var ofertaId = await CrearOfertaAsync(client, perfilId, "PerfilAsignado");

        var response = await client.PostAsJsonAsync($"/api/cv/ofertas/{ofertaId}/enviar-correo", new
        {
            destinatario = "reclutador@acme.com",
            asunto = "Postulación",
            cuerpo = "Cuerpo del correo.",
        }, CamelCase);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var ofertas = await client.GetFromJsonAsync<JsonElement>("/api/cv/ofertas");
        var oferta = ofertas.EnumerateArray().First(o => o.GetProperty("ofertaId").GetInt32() == ofertaId);
        Assert.Equal("PerfilAsignado", oferta.GetProperty("estado").GetString());
    }
}
