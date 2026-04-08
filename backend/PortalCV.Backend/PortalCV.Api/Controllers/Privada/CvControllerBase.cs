using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PortalCV.Api.Controllers;

/// <summary>
/// Clase base para controladores que requieren un usuario autenticado con curriculum.
/// Expone helpers para leer claims del JWT.
/// </summary>
[ApiController]
[Authorize(Roles = "Publicador,Admin")]
public abstract class CvControllerBase : ControllerBase
{
    protected int GetUsuarioId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        return int.TryParse(value, out var id) ? id : 0;
    }

    protected int GetCurriculumId()
    {
        var value = User.FindFirstValue("curriculum_id");
        return int.TryParse(value, out var id) ? id : 0;
    }
}
