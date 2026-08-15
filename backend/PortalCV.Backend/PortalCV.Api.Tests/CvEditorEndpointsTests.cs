using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Api.Tests;

/// <summary>
/// Tests de integracion del editor de CV (api/cv/*): CRUD completo sobre una
/// entidad representativa (Perfil) para ejercitar los helpers compartidos de
/// CvEditorService (GetOwnedOrThrowAsync, GuardarYNotificarAsync,
/// DeleteEntidadAsync) que usan las 8 entidades del editor.
///
/// El usuario/curriculum se crean directo en la base (via scope) y el JWT se
/// arma a mano (mismo patron que CrearJwtSinCurriculumId en
/// AuthEndpointsTests) en vez de pasar por /api/auth/register + /login:
/// evita depender del seed de la tabla Rol (no existe en la InMemory de
/// tests) y del rate limiting real de "auth-public" (10 req/min), que con
/// varios tests haciendo register+login cada uno se agota rapido.
/// </summary>
public class CvEditorEndpointsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public CvEditorEndpointsTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<HttpClient> CreateAuthenticatedClientAsync(string emailPrefix)
    {
        int usuarioId;
        int curriculumId;

        using (var scope = _factory.Services.CreateScope())
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

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("Cookie", $"portalcv_auth={token}");
        return client;
    }

    private static StringContent PerfilPayload(string nombre, decimal? experienciaAnios = null) =>
        new(
            $"{{\"nombrePerfil\":\"{nombre}\",\"descripcionPerfil\":null,\"experienciaPerfilAnios\":{(experienciaAnios.HasValue ? experienciaAnios.Value.ToString() : "null")},\"aspiracionSalarialPesos\":null,\"aspiracionSalarialDolares\":null,\"esActivo\":true}}",
            Encoding.UTF8, "application/json");

    private static readonly JsonSerializerOptions CamelCase = new(JsonSerializerDefaults.Web);

    private static StringContent JsonPayload(object obj) =>
        new(JsonSerializer.Serialize(obj, CamelCase), Encoding.UTF8, "application/json");

    /// <summary>
    /// CRUD (+ visibilidad donde aplica) de las restantes 7 entidades del editor de CV,
    /// via HTTP real. Ejercita las mismas rutas de CvEditorService (GetOwnedOrThrowAsync,
    /// GuardarYNotificarAsync, DeleteEntidadAsync) que Perfil ya cubre, pero cada wrapper
    /// DeleteXAsync/CreateXAsync/UpdateXAsync es una linea de codigo distinta y solo cuenta
    /// como cubierta si esa entidad puntual se ejercita.
    /// </summary>
    [Fact]
    public async Task Experiencia_CrudYVisibilidad_FuncionaDePrincipioAFin()
    {
        var client = await CreateAuthenticatedClientAsync("exp-crud");

        var createResponse = await client.PostAsync("/api/cv/experiencias", JsonPayload(new UpsertExperienciaRequest
        {
            Empresa = "Acme", Cargo = "Dev", EsActual = true, FechaInicio = new DateOnly(2020, 1, 1),
        }));
        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);
        var created = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync()).RootElement;
        var id = created.GetProperty("experienciaId").GetInt32();

        var updateResponse = await client.PutAsync($"/api/cv/experiencias/{id}", JsonPayload(new UpsertExperienciaRequest
        {
            Empresa = "Acme Corp", Cargo = "Dev Senior", EsActual = true, FechaInicio = new DateOnly(2020, 1, 1),
        }));
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var visibilidadResponse = await client.PutAsync($"/api/cv/experiencias/{id}/visibilidad",
            JsonPayload(new UpdateExperienciaVisibilidadRequest { MostrarEnCv = false }));
        Assert.Equal(HttpStatusCode.OK, visibilidadResponse.StatusCode);

        var deleteResponse = await client.DeleteAsync($"/api/cv/experiencias/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task Formacion_CrudYVisibilidad_FuncionaDePrincipioAFin()
    {
        var client = await CreateAuthenticatedClientAsync("form-crud");

        var createResponse = await client.PostAsync("/api/cv/formaciones", JsonPayload(new UpsertFormacionRequest(
            Titulo: "Ingeniería", Institucion: "Universidad X", Area: null,
            FechaInicio: new DateOnly(2015, 1, 1), FechaFin: new DateOnly(2019, 1, 1),
            TipoFormacion: "Pregrado", Descripcion: null, AdjuntoSoporte: null,
            FechaVigencia: null, DuracionHoras: null, MostrarEnCv: true)));
        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);
        var created = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync()).RootElement;
        var id = created.GetProperty("formacionId").GetInt32();

        var updateResponse = await client.PutAsync($"/api/cv/formaciones/{id}", JsonPayload(new UpsertFormacionRequest(
            Titulo: "Ingeniería de Sistemas", Institucion: "Universidad X", Area: null,
            FechaInicio: new DateOnly(2015, 1, 1), FechaFin: new DateOnly(2019, 1, 1),
            TipoFormacion: "Pregrado", Descripcion: null, AdjuntoSoporte: null,
            FechaVigencia: null, DuracionHoras: null, MostrarEnCv: true)));
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var visibilidadResponse = await client.PutAsync($"/api/cv/formaciones/{id}/visibilidad",
            JsonPayload(new UpdateFormacionVisibilidadRequest { MostrarEnCv = false }));
        Assert.Equal(HttpStatusCode.OK, visibilidadResponse.StatusCode);

        var deleteResponse = await client.DeleteAsync($"/api/cv/formaciones/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task Habilidad_CrudCompleto_FuncionaDePrincipioAFin()
    {
        var client = await CreateAuthenticatedClientAsync("hab-crud");

        var createResponse = await client.PostAsync("/api/cv/habilidades", JsonPayload(new UpsertHabilidadRequest(
            Nombre: "Java", Tipo: "Tecnica", Nivel: "Avanzado", Descripcion: null,
            NivelLectura: null, NivelEscritura: null, NivelEscucha: null, NivelHabla: null)));
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync()).RootElement;
        var id = created.GetProperty("habilidadId").GetInt32();

        var updateResponse = await client.PutAsync($"/api/cv/habilidades/{id}", JsonPayload(new UpsertHabilidadRequest(
            Nombre: "Java", Tipo: "Tecnica", Nivel: "Experto", Descripcion: null,
            NivelLectura: null, NivelEscritura: null, NivelEscucha: null, NivelHabla: null)));
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var deleteResponse = await client.DeleteAsync($"/api/cv/habilidades/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task Proyecto_CrudYVisibilidad_FuncionaDePrincipioAFin()
    {
        var client = await CreateAuthenticatedClientAsync("proy-crud");

        var createResponse = await client.PostAsync("/api/cv/proyectos", JsonPayload(new UpsertProyectoRequest(
            NombreProyecto: "Portal CV", Rol: "Backend", EquipoTamano: 3, DuracionMeses: 6,
            StackTecnologico: ".NET", Aporte: null, Logro: null, Desafio: null, MostrarEnCv: true)));
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync()).RootElement;
        var id = created.GetProperty("proyectoId").GetInt32();

        var updateResponse = await client.PutAsync($"/api/cv/proyectos/{id}", JsonPayload(new UpsertProyectoRequest(
            NombreProyecto: "Portal CV v2", Rol: "Backend Lead", EquipoTamano: 3, DuracionMeses: 6,
            StackTecnologico: ".NET", Aporte: null, Logro: null, Desafio: null, MostrarEnCv: true)));
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var visibilidadResponse = await client.PutAsync($"/api/cv/proyectos/{id}/visibilidad",
            JsonPayload(new UpdateProyectoVisibilidadRequest { MostrarEnCv = false }));
        Assert.Equal(HttpStatusCode.OK, visibilidadResponse.StatusCode);

        var deleteResponse = await client.DeleteAsync($"/api/cv/proyectos/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task Referencia_CrudCompleto_FuncionaDePrincipioAFin()
    {
        var client = await CreateAuthenticatedClientAsync("ref-crud");

        var createResponse = await client.PostAsync("/api/cv/referencias", JsonPayload(new UpsertReferenciaRequest(
            TipoReferencia: "Laboral", ExperienciaId: null, Nombre: "Ana", Apellido: "Gómez",
            Email: null, Telefono: null, Parentesco: null, Cargo: "Gerente", Empresa: "Acme",
            Relacion: null, Observaciones: null, AdjuntoSoporte: null)));
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync()).RootElement;
        var id = created.GetProperty("referenciaId").GetInt32();

        var updateResponse = await client.PutAsync($"/api/cv/referencias/{id}", JsonPayload(new UpsertReferenciaRequest(
            TipoReferencia: "Laboral", ExperienciaId: null, Nombre: "Ana", Apellido: "Gómez Ruiz",
            Email: null, Telefono: null, Parentesco: null, Cargo: "Directora", Empresa: "Acme",
            Relacion: null, Observaciones: null, AdjuntoSoporte: null)));
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var deleteResponse = await client.DeleteAsync($"/api/cv/referencias/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task RedSocial_CrudCompleto_FuncionaDePrincipioAFin()
    {
        var client = await CreateAuthenticatedClientAsync("red-crud");

        var createResponse = await client.PostAsync("/api/cv/redes-sociales", JsonPayload(new UpsertRedSocialRequest(
            NombreRed: "LinkedIn", LinkPublico: "https://linkedin.com/in/test", UsuarioContacto: null)));
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync()).RootElement;
        var id = created.GetProperty("redSocialId").GetInt32();

        var updateResponse = await client.PutAsync($"/api/cv/redes-sociales/{id}", JsonPayload(new UpsertRedSocialRequest(
            NombreRed: "LinkedIn", LinkPublico: "https://linkedin.com/in/test2", UsuarioContacto: null)));
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var deleteResponse = await client.DeleteAsync($"/api/cv/redes-sociales/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task Familiar_CrudCompleto_FuncionaDePrincipioAFin()
    {
        var client = await CreateAuthenticatedClientAsync("fam-crud");

        var createResponse = await client.PostAsync("/api/cv/familiares", JsonPayload(new UpsertFamiliarContactoRequest(
            Parentesco: "Madre", Nombres: "María", Apellidos: "Pérez", Email: null, Telefono: null,
            EsContactoPrincipal: true)));
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync()).RootElement;
        var id = created.GetProperty("familiarId").GetInt32();

        var updateResponse = await client.PutAsync($"/api/cv/familiares/{id}", JsonPayload(new UpsertFamiliarContactoRequest(
            Parentesco: "Madre", Nombres: "María", Apellidos: "Pérez Ruiz", Email: null, Telefono: null,
            EsContactoPrincipal: true)));
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var deleteResponse = await client.DeleteAsync($"/api/cv/familiares/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task Personales_Upsert_CreaYActualiza()
    {
        var client = await CreateAuthenticatedClientAsync("pers-crud");

        var upsertResponse = await client.PutAsync("/api/cv/personales", JsonPayload(new UpsertPersonalesRequest(
            TipoIdentificacion: null, NumeroDocumento: null, FechaExpedicion: null, LugarExpedicion: null,
            LibretaMilitarNumero: null, LibretaMilitarClase: null, PasaporteNumero: null, PasaporteVigencia: null,
            VisaNumero: null, VisaVigencia: null, VisaClase: null,
            PrimerNombre: "Juan", SegundoNombre: null, PrimerApellido: "Pérez", SegundoApellido: null,
            FechaNacimiento: null, LugarNacimiento: null, Genero: null, Nacionalidad: null, TipoSangre: null,
            EPS: null, Pencion: null, Cesantias: null, Email: null, Celular: null, TelefonoFijo: null,
            Pais: null, Departamento: null, Ciudad: null, Barrio: null, CodigoPostal: null, Direccion: null,
            TipoResidencia: null, FotoUrl: null)));
        Assert.Equal(HttpStatusCode.OK, upsertResponse.StatusCode);

        var getResponse = await client.GetAsync("/api/cv/personales");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        var dto = JsonDocument.Parse(await getResponse.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal("Juan", dto.GetProperty("primerNombre").GetString());
    }

    [Fact]
    public async Task Visibilidad_Update_CreaYActualizaSecciones()
    {
        var client = await CreateAuthenticatedClientAsync("vis-crud");

        var cambios = new[] { new UpdateVisibilidadRequest("Experiencia", false) };
        var updateResponse = await client.PutAsync("/api/cv/visibilidad", JsonPayload(cambios));
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var getResponse = await client.GetAsync("/api/cv/visibilidad");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
    }

    [Fact]
    public async Task Presentacion_UpdateYPublicacion_FuncionaDePrincipioAFin()
    {
        var client = await CreateAuthenticatedClientAsync("pres-crud");

        var updateResponse = await client.PutAsync("/api/cv/presentacion",
            JsonPayload(new UpdatePresentacionCvRequest("profesional")));
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var publicacionResponse = await client.PutAsync("/api/cv/presentacion/publicacion",
            JsonPayload(new UpdateCurriculumPublicacionRequest(true)));
        Assert.Equal(HttpStatusCode.OK, publicacionResponse.StatusCode);

        var getResponse = await client.GetAsync("/api/cv/presentacion");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        var dto = JsonDocument.Parse(await getResponse.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal("profesional", dto.GetProperty("plantillaCodigo").GetString());
        Assert.True(dto.GetProperty("publicado").GetBoolean());
    }

    [Fact]
    public async Task Perfil_CrudCompleto_FuncionaDePrincipioAFin()
    {
        var client = await CreateAuthenticatedClientAsync("perfil-crud");

        var getInicial = await client.GetAsync("/api/cv/perfiles");
        Assert.Equal(HttpStatusCode.OK, getInicial.StatusCode);
        Assert.Equal("[]", (await getInicial.Content.ReadAsStringAsync()).Trim());

        var createResponse = await client.PostAsync("/api/cv/perfiles", PerfilPayload("Backend Developer", 5));
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync()).RootElement;
        var perfilId = created.GetProperty("perfilId").GetInt32();
        Assert.True(perfilId > 0);
        Assert.Equal("Backend Developer", created.GetProperty("nombrePerfil").GetString());

        var updateResponse = await client.PutAsync($"/api/cv/perfiles/{perfilId}", PerfilPayload("Backend Developer Senior", 6));
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updated = JsonDocument.Parse(await updateResponse.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal("Backend Developer Senior", updated.GetProperty("nombrePerfil").GetString());

        var getConDato = await client.GetAsync("/api/cv/perfiles");
        var lista = JsonDocument.Parse(await getConDato.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal(1, lista.GetArrayLength());

        var deleteResponse = await client.DeleteAsync($"/api/cv/perfiles/{perfilId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getFinal = await client.GetAsync("/api/cv/perfiles");
        Assert.Equal("[]", (await getFinal.Content.ReadAsStringAsync()).Trim());
    }

    [Fact]
    public async Task Perfil_Update_DeOtroUsuario_Retorna403()
    {
        var clientA = await CreateAuthenticatedClientAsync("perfil-owner");
        var clientB = await CreateAuthenticatedClientAsync("perfil-intruder");

        var createResponse = await clientA.PostAsync("/api/cv/perfiles", PerfilPayload("Perfil de A"));
        var created = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync()).RootElement;
        var perfilId = created.GetProperty("perfilId").GetInt32();

        var updateResponse = await clientB.PutAsync($"/api/cv/perfiles/{perfilId}", PerfilPayload("Hackeado"));

        Assert.Equal(HttpStatusCode.Forbidden, updateResponse.StatusCode);
    }

    [Fact]
    public async Task Perfil_Delete_DeOtroUsuario_Retorna403YNoLoBorra()
    {
        var clientA = await CreateAuthenticatedClientAsync("perfil-owner2");
        var clientB = await CreateAuthenticatedClientAsync("perfil-intruder2");

        var createResponse = await clientA.PostAsync("/api/cv/perfiles", PerfilPayload("Perfil protegido"));
        var created = JsonDocument.Parse(await createResponse.Content.ReadAsStringAsync()).RootElement;
        var perfilId = created.GetProperty("perfilId").GetInt32();

        var deleteResponse = await clientB.DeleteAsync($"/api/cv/perfiles/{perfilId}");
        Assert.Equal(HttpStatusCode.Forbidden, deleteResponse.StatusCode);

        var getDeA = await clientA.GetAsync("/api/cv/perfiles");
        var lista = JsonDocument.Parse(await getDeA.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal(1, lista.GetArrayLength());
    }

    [Fact]
    public async Task Perfil_Update_Inexistente_Retorna404()
    {
        var client = await CreateAuthenticatedClientAsync("perfil-404");

        var response = await client.PutAsync("/api/cv/perfiles/999999", PerfilPayload("No existe"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
