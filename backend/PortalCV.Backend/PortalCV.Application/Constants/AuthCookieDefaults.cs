namespace PortalCV.Application.Constants;

/// <summary>
/// Nombre de la cookie HttpOnly que transporta el JWT. Compartido entre el
/// controlador que la emite/borra (Api) y el pipeline de autenticación que la
/// lee (Program.cs) para no duplicar el literal.
/// </summary>
public static class AuthCookieDefaults
{
    public const string Name = "portalcv_auth";
}
