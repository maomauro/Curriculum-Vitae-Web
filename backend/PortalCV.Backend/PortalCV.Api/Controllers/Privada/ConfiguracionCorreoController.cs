using Microsoft.AspNetCore.Mvc;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;

namespace PortalCV.Api.Controllers;

[Route("api/cv/configuracion-correo")]
public class ConfiguracionCorreoController : CvControllerBase
{
    private readonly IConfiguracionCorreoService _service;

    public ConfiguracionCorreoController(IConfiguracionCorreoService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct = default)
        => Ok(await _service.ObtenerAsync(GetCurriculumId(), ct));

    [HttpPut]
    public async Task<IActionResult> Guardar([FromBody] GuardarConfiguracionCorreoRequest request, CancellationToken ct = default)
        => Ok(await _service.GuardarAsync(GetCurriculumId(), request, ct));
}
