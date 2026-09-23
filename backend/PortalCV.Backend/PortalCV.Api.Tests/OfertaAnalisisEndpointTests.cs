using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
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
/// Tests de integracion de POST /api/cv/ofertas/analizar (Fase 2 del flujo de Ofertas).
/// Reemplaza IAiProviderClient por un doble de prueba (FakeAiProviderClient) via
/// WithWebHostBuilder -- nunca llama a un proveedor de IA real. Cada test arma su propia
/// factory derivada (con su propia base InMemory aislada) para poder controlar la
/// respuesta simulada del proveedor sin estado compartido entre tests.
/// </summary>
public class OfertaAnalisisEndpointTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions CamelCase = new(JsonSerializerDefaults.Web);

    public OfertaAnalisisEndpointTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private sealed class FakeAiProviderClient : IAiProviderClient
    {
        public string Proveedor { get; }
        public bool Ok { get; set; } = true;
        public string? Texto { get; set; }
        public string? Error { get; set; }
        public string? UltimoPromptRecibido { get; private set; }
        public byte[]? UltimaImagenRecibida { get; private set; }

        public FakeAiProviderClient(string proveedor) => Proveedor = proveedor;

        public Task<(bool Ok, string Mensaje)> ProbarConexionAsync(
            string? modelo, string? endpoint, string? apiKey, CancellationToken ct = default)
            => Task.FromResult((true, "ok"));

        public Task<(bool Ok, string? Texto, string? Error)> GenerarTextoAsync(
            string? modelo, string? endpoint, string? apiKey, string prompt,
            byte[]? imagenBytes, string? imagenContentType, CancellationToken ct = default)
        {
            UltimoPromptRecibido = prompt;
            UltimaImagenRecibida = imagenBytes;
            return Task.FromResult((Ok, Texto, Error));
        }
    }

    /// <summary>Crea un usuario/curriculum autenticado sobre una factory propia (base
    /// InMemory aislada de la de otros tests) con <paramref name="clienteFalso"/> como
    /// único IAiProviderClient registrado -- null si el test no debe llegar a resolver
    /// ninguno (p. ej. falta de proveedor activo, o el proveedor pedido no tiene
    /// cliente).</summary>
    private async Task<(HttpClient Client, int CurriculumId)> CreateClientAsync(
        string emailPrefix, FakeAiProviderClient? clienteFalso)
    {
        var factory = _factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IAiProviderClient>();
            if (clienteFalso is not null)
                services.AddSingleton<IAiProviderClient>(clienteFalso);
        }));

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

    private static async Task AgregarProveedorActivoAsync(HttpClient client, string proveedor = "claude")
    {
        // El endpoint ahora es admin-only (config global de IA) -- se cambia
        // momentaneamente la cookie de auth del cliente Publicador por una de Admin
        // solo para esta llamada, y se restaura despues.
        var cookieOriginal = client.DefaultRequestHeaders.GetValues("Cookie").First();
        client.DefaultRequestHeaders.Remove("Cookie");
        client.DefaultRequestHeaders.Add("Cookie", $"portalcv_auth={CrearTokenAdmin()}");
        try
        {
            var response = await client.PostAsJsonAsync(
                "/api/admin/proveedor-ia",
                new { proveedor, nombre = (string?)null, modelo = (string?)null, endpoint = (string?)null, apiKey = "clave-de-prueba" },
                CamelCase);
            response.EnsureSuccessStatusCode();
        }
        finally
        {
            client.DefaultRequestHeaders.Remove("Cookie");
            client.DefaultRequestHeaders.Add("Cookie", cookieOriginal);
        }
    }

    private static string CrearTokenAdmin()
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, "0"),
            new Claim(JwtRegisteredClaimNames.Email, "admin-seed@example.com"),
            new Claim(ClaimTypes.Role, "Admin"),
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

    private static MultipartFormDataContent BuildForm(string? texto = null, (string Nombre, byte[] Bytes, string ContentType)? archivo = null)
    {
        var form = new MultipartFormDataContent();
        if (texto is not null)
            form.Add(new StringContent(texto), "texto");
        if (archivo is { } a)
        {
            var contenido = new ByteArrayContent(a.Bytes);
            contenido.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(a.ContentType);
            form.Add(contenido, "archivo", a.Nombre);
        }
        return form;
    }

    [Fact]
    public async Task Analizar_SinTextoNiImagen_Devuelve400()
    {
        var (client, _) = await CreateClientAsync("oferta-ia-vacio", new FakeAiProviderClient("claude"));
        await AgregarProveedorActivoAsync(client);

        var response = await client.PostAsync("/api/cv/ofertas/analizar", BuildForm());

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Analizar_SinProveedorActivo_Devuelve400ConMensajeClaro()
    {
        var (client, _) = await CreateClientAsync("oferta-ia-sinproveedor", new FakeAiProviderClient("claude"));

        var response = await client.PostAsync("/api/cv/ofertas/analizar", BuildForm(texto: "Se busca desarrollador"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("proveedor de IA activo", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Analizar_ConProveedorSinClienteRegistrado_Devuelve400()
    {
        // El unico IAiProviderClient falso registrado es "claude"; el proveedor guardado es "gemini".
        var (client, _) = await CreateClientAsync("oferta-ia-sincliente", new FakeAiProviderClient("claude"));
        await AgregarProveedorActivoAsync(client, proveedor: "gemini");

        var response = await client.PostAsync("/api/cv/ofertas/analizar", BuildForm(texto: "Se busca desarrollador"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var mensaje = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("message").GetString();
        Assert.Contains("análisis real", mensaje, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Analizar_SoloConTexto_DevuelveDatosExtraidosYOrigenTexto()
    {
        var fake = new FakeAiProviderClient("claude")
        {
            Ok = true,
            Texto = "{\"cargo\":\"Desarrollador Backend\",\"empresa\":\"Acme\",\"descripcion\":\"Una oferta\",\"correoReclutador\":\"rh@acme.com\",\"nombreReclutador\":\"Ana\"}",
        };
        var (client, _) = await CreateClientAsync("oferta-ia-textook", fake);
        await AgregarProveedorActivoAsync(client);

        var response = await client.PostAsync(
            "/api/cv/ofertas/analizar", BuildForm(texto: "Se busca Desarrollador Backend en Acme"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Desarrollador Backend", dto.GetProperty("cargo").GetString());
        Assert.Equal("Acme", dto.GetProperty("empresa").GetString());
        Assert.Equal("rh@acme.com", dto.GetProperty("correoReclutador").GetString());
        Assert.Equal("texto", dto.GetProperty("origenEntrada").GetString());
        Assert.Contains("Se busca Desarrollador Backend en Acme", dto.GetProperty("textoOriginal").GetString());
        Assert.Contains("Se busca Desarrollador Backend en Acme", fake.UltimoPromptRecibido);
        Assert.True(dto.GetProperty("promptPorDefecto").GetBoolean());
    }

    [Fact]
    public async Task Analizar_ExtraeLosAtributosDetalladosCuandoElProveedorLosDevuelve()
    {
        var fake = new FakeAiProviderClient("claude")
        {
            Ok = true,
            Texto = "{\"cargo\":\"Software Engineer\",\"empresa\":\"Knezevic\",\"modalidad\":\"100% remoto\"," +
                    "\"tipoContrato\":\"Contractor\",\"moneda\":\"USD\",\"duracion\":\"6 meses\",\"horario\":\"CST\"," +
                    "\"experienciaRequerida\":\"3 a 5 años\",\"stackTecnologico\":\"C#, .NET, React\",\"nivelIdioma\":\"Inglés B2+\"}",
        };
        var (client, _) = await CreateClientAsync("oferta-ia-atributos", fake);
        await AgregarProveedorActivoAsync(client);

        var response = await client.PostAsync(
            "/api/cv/ofertas/analizar", BuildForm(texto: "Oferta con muchos detalles"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("100% remoto", dto.GetProperty("modalidad").GetString());
        Assert.Equal("Contractor", dto.GetProperty("tipoContrato").GetString());
        Assert.Equal("USD", dto.GetProperty("moneda").GetString());
        Assert.Equal("6 meses", dto.GetProperty("duracion").GetString());
        Assert.Equal("CST", dto.GetProperty("horario").GetString());
        Assert.Equal("3 a 5 años", dto.GetProperty("experienciaRequerida").GetString());
        Assert.Equal("C#, .NET, React", dto.GetProperty("stackTecnologico").GetString());
        Assert.Equal("Inglés B2+", dto.GetProperty("nivelIdioma").GetString());
    }

    [Fact]
    public async Task Analizar_SinAtributosDetalladosEnLaRespuesta_DevuelveNullSinFallar()
    {
        var fake = new FakeAiProviderClient("claude")
        {
            Ok = true,
            Texto = "{\"cargo\":\"Software Engineer\",\"empresa\":\"Knezevic\"}",
        };
        var (client, _) = await CreateClientAsync("oferta-ia-sinatributos", fake);
        await AgregarProveedorActivoAsync(client);

        var response = await client.PostAsync(
            "/api/cv/ofertas/analizar", BuildForm(texto: "Oferta simple"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(JsonValueKind.Null, dto.GetProperty("modalidad").ValueKind);
        Assert.Equal(JsonValueKind.Null, dto.GetProperty("stackTecnologico").ValueKind);
    }

    [Fact]
    public async Task Analizar_ConPromptExtractorOfertaPropioActivo_NoUsaElPorDefectoYEnviaElContenidoPropio()
    {
        var fake = new FakeAiProviderClient("claude")
        {
            Ok = true,
            Texto = "{\"cargo\":\"Dev\",\"empresa\":\"Acme\"}",
        };
        var (client, _) = await CreateClientAsync("oferta-ia-promptpropio", fake);
        await AgregarProveedorActivoAsync(client);

        var promptRes = await client.PostAsJsonAsync("/api/prompts-ia", new
        {
            codigo = "EXTRACTOR_OFERTA",
            nombre = "Mi extractor propio",
            descripcion = (string?)null,
            rolContexto = "Eres un extractor de datos de ofertas MARCADOR-UNICO-PROPIO-99",
            tarea = "Extrae los datos de: {{OFERTA_TEXTO}}",
            reglas = (string?)null,
            formatoSalida = "JSON",
            ejemplos = (string?)null,
        }, CamelCase);
        promptRes.EnsureSuccessStatusCode();

        var response = await client.PostAsync(
            "/api/cv/ofertas/analizar", BuildForm(texto: "Oferta de prueba"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(dto.GetProperty("promptPorDefecto").GetBoolean());
        Assert.Contains("MARCADOR-UNICO-PROPIO-99", fake.UltimoPromptRecibido);
    }

    [Fact]
    public async Task Analizar_SoloConImagen_OrigenEntradaEsImagenYSeEnviaLaImagenAlProveedor()
    {
        var fake = new FakeAiProviderClient("claude")
        {
            Ok = true,
            Texto = "{\"cargo\":\"QA\",\"empresa\":\"Beta\",\"descripcion\":null,\"correoReclutador\":null,\"nombreReclutador\":null}",
        };
        var (client, _) = await CreateClientAsync("oferta-ia-imgok", fake);
        await AgregarProveedorActivoAsync(client);
        var imagen = new byte[] { 1, 2, 3, 4, 5 };

        var response = await client.PostAsync(
            "/api/cv/ofertas/analizar", BuildForm(archivo: ("oferta.png", imagen, "image/png")));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("imagen", dto.GetProperty("origenEntrada").GetString());
        Assert.Contains("oferta.png", dto.GetProperty("textoOriginal").GetString());
        Assert.Equal(imagen, fake.UltimaImagenRecibida);
    }

    [Fact]
    public async Task Analizar_ConTextoEImagen_OrigenEntradaEsAmbos()
    {
        var fake = new FakeAiProviderClient("claude")
        {
            Ok = true,
            Texto = "{\"cargo\":\"Data Engineer\",\"empresa\":\"NovaCloud\",\"descripcion\":null,\"correoReclutador\":null,\"nombreReclutador\":null}",
        };
        var (client, _) = await CreateClientAsync("oferta-ia-ambos", fake);
        await AgregarProveedorActivoAsync(client);
        var imagen = new byte[] { 9, 9, 9 };

        var response = await client.PostAsync(
            "/api/cv/ofertas/analizar",
            BuildForm(texto: "Nota complementaria", archivo: ("captura.jpg", imagen, "image/jpeg")));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("ambos", dto.GetProperty("origenEntrada").GetString());
        var textoOriginal = dto.GetProperty("textoOriginal").GetString();
        Assert.Contains("Nota complementaria", textoOriginal);
        Assert.Contains("captura.jpg", textoOriginal);
    }

    [Fact]
    public async Task Analizar_CuandoElProveedorFalla_Devuelve400ConElMensajeDelProveedor()
    {
        var fake = new FakeAiProviderClient("claude") { Ok = false, Error = "La clave de API no es válida." };
        var (client, _) = await CreateClientAsync("oferta-ia-provfalla", fake);
        await AgregarProveedorActivoAsync(client);

        var response = await client.PostAsync("/api/cv/ofertas/analizar", BuildForm(texto: "Oferta de prueba"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("clave de API", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Analizar_ConRespuestaQueNoEsJsonValido_Devuelve400ConMensajeClaro()
    {
        var fake = new FakeAiProviderClient("claude") { Ok = true, Texto = "esto no es un JSON" };
        var (client, _) = await CreateClientAsync("oferta-ia-jsonmalo", fake);
        await AgregarProveedorActivoAsync(client);

        var response = await client.PostAsync("/api/cv/ofertas/analizar", BuildForm(texto: "Oferta de prueba"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var mensaje = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("message").GetString();
        Assert.Contains("formato válido", mensaje, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Analizar_ConRespuestaEnvueltaEnBloqueDeCodigoMarkdown_LaParseaIgual()
    {
        var fake = new FakeAiProviderClient("claude")
        {
            Ok = true,
            Texto = "```json\n{\"cargo\":\"Dev\",\"empresa\":\"Acme\"}\n```",
        };
        var (client, _) = await CreateClientAsync("oferta-ia-markdown", fake);
        await AgregarProveedorActivoAsync(client);

        var response = await client.PostAsync("/api/cv/ofertas/analizar", BuildForm(texto: "Oferta de prueba"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Dev", dto.GetProperty("cargo").GetString());
    }

    [Fact]
    public async Task Analizar_SustituyeElMarcadorOfertaTextoEnElPromptEnsamblado()
    {
        var fake = new FakeAiProviderClient("claude")
        {
            Ok = true,
            Texto = "{\"cargo\":\"X\",\"empresa\":\"Y\"}",
        };
        var (client, _) = await CreateClientAsync("oferta-ia-marcador", fake);
        await AgregarProveedorActivoAsync(client);

        await client.PostAsync(
            "/api/cv/ofertas/analizar", BuildForm(texto: "TEXTO-UNICO-DE-ESTE-TEST-12345"));

        Assert.NotNull(fake.UltimoPromptRecibido);
        Assert.Contains("TEXTO-UNICO-DE-ESTE-TEST-12345", fake.UltimoPromptRecibido);
        Assert.DoesNotContain("{{OFERTA_TEXTO}}", fake.UltimoPromptRecibido);
    }
}
