using System.Text;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;
using PortalCV.Infrastructure.Services;

namespace PortalCV.Api.Tests;

/// <summary>
/// Test unitario del renderizador de PDF del CV adjunto a los correos de Analizar
/// Oferta -- sin DB ni HTTP, solo verifica que produce bytes de un PDF valido a partir
/// de datos conocidos.
/// </summary>
public class CvPdfRendererServiceTests
{
    private static PersonalesDto PersonalesDeEjemplo() => new(
        PersonalesId: 1, CurriculumId: 2, TipoIdentificacion: null, NumeroDocumento: null,
        FechaExpedicion: null, LugarExpedicion: null, LibretaMilitarNumero: null, LibretaMilitarClase: null,
        PasaporteNumero: null, PasaporteVigencia: null, VisaNumero: null, VisaVigencia: null, VisaClase: null,
        PrimerNombre: "Ana", SegundoNombre: null, PrimerApellido: "Ríos", SegundoApellido: null,
        FechaNacimiento: null, LugarNacimiento: null, Genero: null, Nacionalidad: null, TipoSangre: null,
        EPS: null, Pencion: null, Cesantias: null,
        Email: "ana@example.com", Celular: "3001234567", TelefonoFijo: null,
        Pais: "Colombia", Departamento: null, Ciudad: "Bogotá", Barrio: null, CodigoPostal: null, Direccion: null,
        TipoResidencia: null, FotoUrl: null);

    private static PerfilDto PerfilDeEjemplo() => new(
        5, "Arquitecta de Datos", "Ingeniera con experiencia en arquitectura de datos y liderazgo técnico.",
        13.0m, 12000000m, 3200m, true);

    private static ContenidoCvGeneradoDto ContenidoDeEjemplo() => new(
        Experiencia: new List<ExperienciaCondensadaDto>
        {
            new("Arquitecta de Datos -- Acme, 2020-2024", new List<string> { "Diseñó el pipeline de analítica.", "Lideró la migración a Azure." }),
        },
        Educacion: new List<string> { "Ingeniería de Sistemas -- Universidad X (2015)" },
        Proyectos: new List<string> { "Data Lake corporativo -- Azure, Spark." },
        Habilidades: new List<HabilidadCondensadaDto> { new("SQL", "Tecnica"), new("Liderazgo", "Blanda") });

    [Fact]
    public void Renderar_ConDatosCompletos_DevuelveBytesDeUnPdfValido()
    {
        ICvPdfRendererService renderer = new CvPdfRendererService();

        var bytes = renderer.Renderar(PersonalesDeEjemplo(), PerfilDeEjemplo(), ContenidoDeEjemplo());

        Assert.NotEmpty(bytes);
        var header = Encoding.ASCII.GetString(bytes, 0, 5);
        Assert.Equal("%PDF-", header);
    }

    [Fact]
    public void Renderar_ConSeccionesVacias_NoFalla()
    {
        ICvPdfRendererService renderer = new CvPdfRendererService();
        var contenidoVacio = new ContenidoCvGeneradoDto(
            new List<ExperienciaCondensadaDto>(), new List<string>(), new List<string>(), new List<HabilidadCondensadaDto>());
        var perfilSinDescripcion = new PerfilDto(5, "Sin descripción", null, null, null, null, true);

        var bytes = renderer.Renderar(PersonalesDeEjemplo(), perfilSinDescripcion, contenidoVacio);

        Assert.NotEmpty(bytes);
    }
}
