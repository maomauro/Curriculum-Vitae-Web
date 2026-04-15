using System.Collections.Generic;

namespace PortalCV.Application.DTOs.Auth;

/// <summary>
/// DTO que representa la información del usuario actualmente autenticado para el endpoint /me.
/// </summary>
public record UserMeResponse(
    string Email,
    IEnumerable<string> Roles,
    int? CurriculumId
);
