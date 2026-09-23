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
            "La plantilla indicada no es válida. Usa: clasico, profesional, ats, corporativo o ejecutivo.";
    }

    /// <summary>
    /// Panel de administración.
    /// </summary>
    public static class Admin
    {
        public const string AuditoriaPurgeConfirmacionInvalida =
            "Para vaciar toda la tabla escribe exactamente la frase de confirmación indicada en pantalla.";

        public const string AuditoriaPurgeParametrosInvalidos =
            "Año o mes no válidos para eliminar el período indicado.";

        public const string AuditoriaPurgeTablaInvalida = "Tabla de auditoría no reconocida.";

        public const string AuditoriaPurgeModoInvalido = "Modo de purga no reconocido.";

        public const string UsuarioNoEncontrado = "Usuario no encontrado.";
        public const string CurriculumNoEncontradoParaUsuario = "El usuario no tiene un curriculum asociado.";
        public const string RolNoEncontrado = "Rol no encontrado.";
        public const string UsuarioYaTieneEseRol = "El usuario ya tiene ese rol.";
        public const string DebeQuedarAlMenosUnAdmin = "Debe quedar al menos un usuario con rol Admin.";
    }

    /// <summary>
    /// Prompts de IA del área privada (propios de cada Publicador).
    /// </summary>
    public static class PromptIa
    {
        public const string CodigoRequerido = "El código del prompt es requerido.";
        public const string CodigoInvalido =
            "El código del prompt solo puede tener letras, números y guion bajo (p. ej. EXTRACTOR_OFERTA).";
        public const string CodigoDuplicado = "Ya tienes un prompt con ese código.";
        public const string NombreRequerido = "El nombre del prompt es requerido.";
        public const string RolContextoRequerido = "El rol/contexto del prompt es requerido.";
        public const string TareaRequerida = "La tarea del prompt es requerida.";
        public const string FormatoSalidaRequerido = "El formato de salida del prompt es requerido.";
        public const string NoEncontrado = "No existe un prompt activo con ese código.";
        public const string VersionNoEncontrada = "No existe esa versión de prompt.";
    }

    /// <summary>
    /// Compartidos por cualquier paso del flujo de Ofertas que invoque a la IA
    /// (extracción, selección de perfil, generación de CV) -- ver IIaPromptInvoker.
    /// </summary>
    public static class Ia
    {
        public const string SinProveedorActivo = "No hay un proveedor de IA activo configurado. Contactá al administrador del portal.";
        public const string RespuestaNoEsJsonValido = "La IA no devolvió un formato válido. Intenta de nuevo.";

        public static string ProveedorSinClienteReal(string proveedor) =>
            $"El proveedor \"{proveedor}\" todavía no tiene análisis real implementado.";
    }

    /// <summary>
    /// Extracción de datos de una oferta laboral con IA (POST /api/cv/ofertas/analizar).
    /// </summary>
    public static class OfertaAnalisis
    {
        public const string SinEntrada = "Debes pegar el texto de la oferta, adjuntar una imagen, o ambos.";
        public const string ImagenNoSoportada = "Formato de imagen no soportado. Usa JPG, PNG o WEBP.";
        public const string ImagenDemasiadoGrande = "La imagen no puede superar 5 MB.";
    }

    /// <summary>
    /// Autenticación y registro.
    /// </summary>
    public static class Auth
    {
        public const string CorreoYaRegistrado = "El correo ya está registrado.";
        public const string ForgotPasswordRespuestaGenerica =
            "Si el correo está registrado, recibirás las instrucciones en breve.";
        public const string ContraseñaActualizada = "Contraseña actualizada correctamente.";
        public const string SesionCerrada = "Sesión cerrada.";
    }

    /// <summary>
    /// Endpoints públicos (CV, contacto).
    /// </summary>
    public static class Publico
    {
        public const string MensajeEnviadoCorrectamente = "Mensaje enviado correctamente.";
    }
}
