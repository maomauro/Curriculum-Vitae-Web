namespace PortalCV.Application.Constants;

/// <summary>
/// Mensajes de respuesta HTTP de la API (español). Evita duplicar cadenas en controladores y servicios
/// y facilita alinear textos con el frontend cuando aplique.
/// </summary>
public static class ApiMessages
{
    /// <summary>
    /// Respuestas genéricas (middleware, errores no tipados).
    /// </summary>
    public static class General
    {
        public const string ErrorInternoServidor = "Ocurrió un error interno del servidor.";
    }

    /// <summary>
    /// Área Mi CV / editor privado.
    /// </summary>
    public static class Cv
    {
        public const string SesionSinCurriculumValido =
            "Tu sesión no tiene un curriculum válido. Cierra sesión y vuelve a entrar para renovar el token.";

        public const string PlantillaInvalida =
            "La plantilla indicada no es válida. Usa: clasico o profesional.";
    }

    /// <summary>
    /// Panel de administración.
    /// </summary>
    public static class Admin
    {
        public const string UsuarioNoEncontrado = "Usuario no encontrado.";
        public const string RolNoEncontrado = "Rol no encontrado.";
        public const string UsuarioYaTieneEseRol = "El usuario ya tiene ese rol.";
        public const string DebeQuedarAlMenosUnAdmin = "Debe quedar al menos un usuario con rol Admin.";
    }

    /// <summary>
    /// Autenticación y registro.
    /// </summary>
    public static class Auth
    {
        public const string CorreoYaRegistrado = "El correo ya está registrado.";
        public const string ForgotPasswordRespuestaGenerica =
            "Si el correo está registrado, recibirás las instrucciones en breve.";
    }

    /// <summary>
    /// Endpoints públicos (CV, contacto).
    /// </summary>
    public static class Publico
    {
        public const string MensajeEnviadoCorrectamente = "Mensaje enviado correctamente.";
    }
}
