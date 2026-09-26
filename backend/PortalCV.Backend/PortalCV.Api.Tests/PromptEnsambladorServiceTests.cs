using PortalCV.Infrastructure.Services;

namespace PortalCV.Api.Tests;

public class PromptEnsambladorServiceTests
{
    private readonly PromptEnsambladorService _sut = new();

    [Fact]
    public void Ensamblar_ReemplazaUnMarcadorSimple()
    {
        var resultado = _sut.Ensamblar("Texto: {{OFERTA_TEXTO}}.", new Dictionary<string, string>
        {
            ["OFERTA_TEXTO"] = "contenido pegado",
        });

        Assert.Equal("Texto: contenido pegado.", resultado);
    }

    [Fact]
    public void Ensamblar_ReemplazaVariasOcurrenciasDelMismoMarcador()
    {
        var resultado = _sut.Ensamblar("{{X}} y otra vez {{X}}.", new Dictionary<string, string> { ["X"] = "A" });

        Assert.Equal("A y otra vez A.", resultado);
    }

    [Fact]
    public void Ensamblar_ReemplazaVariosMarcadoresDistintos()
    {
        var resultado = _sut.Ensamblar("{{A}}-{{B}}", new Dictionary<string, string> { ["A"] = "1", ["B"] = "2" });

        Assert.Equal("1-2", resultado);
    }

    [Fact]
    public void Ensamblar_SinMarcadores_DevuelveElContenidoTalCual()
    {
        var resultado = _sut.Ensamblar("Sin marcadores aquí.", new Dictionary<string, string>());

        Assert.Equal("Sin marcadores aquí.", resultado);
    }

    [Fact]
    public void Ensamblar_ConMarcadorDesconocido_LanzaArgumentExceptionConElNombre()
    {
        var ex = Assert.Throws<ArgumentException>(
            () => _sut.Ensamblar("{{FOO}}", new Dictionary<string, string> { ["OTRO"] = "x" }));

        Assert.Contains("{{FOO}}", ex.Message);
    }

    [Fact]
    public void Ensamblar_ValorConLlavesDobles_NoSeReinterpretaComoMarcador()
    {
        var resultado = _sut.Ensamblar("{{X}}", new Dictionary<string, string> { ["X"] = "{{NO_DEBERIA_EXPANDIRSE}}" });

        Assert.Equal("{{NO_DEBERIA_EXPANDIRSE}}", resultado);
    }
}
