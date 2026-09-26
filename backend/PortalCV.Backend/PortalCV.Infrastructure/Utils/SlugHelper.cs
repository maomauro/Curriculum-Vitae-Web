using System.Text;

namespace PortalCV.Infrastructure.Utils;

/// <summary>
/// Normalización de slugs para la URL pública del CV. Compartida entre
/// <see cref="Auth.AuthService"/> (generación automática al registrarse) y
/// <see cref="Privada.CvEditorService"/> (edición manual desde Configuración) para
/// que ambos caminos produzcan siempre el mismo formato.
/// </summary>
public static class SlugHelper
{
    public static string Normalizar(string input)
    {
        var mapa = new Dictionary<char, char>
        {
            ['á'] = 'a', ['à'] = 'a', ['ä'] = 'a', ['â'] = 'a',
            ['é'] = 'e', ['è'] = 'e', ['ë'] = 'e', ['ê'] = 'e',
            ['í'] = 'i', ['ì'] = 'i', ['ï'] = 'i', ['î'] = 'i',
            ['ó'] = 'o', ['ò'] = 'o', ['ö'] = 'o', ['ô'] = 'o',
            ['ú'] = 'u', ['ù'] = 'u', ['ü'] = 'u', ['û'] = 'u',
            ['ñ'] = 'n', ['ç'] = 'c'
        };

        var sb = new StringBuilder();
        foreach (var c in (input ?? string.Empty).ToLowerInvariant())
        {
            if (mapa.TryGetValue(c, out var mapped)) sb.Append(mapped);
            else if (char.IsLetterOrDigit(c)) sb.Append(c);
            else if (c == ' ' || c == '-' || c == '_') sb.Append('-');
        }

        // Eliminar guiones dobles o al inicio/final
        var slug = sb.ToString().Trim('-');
        while (slug.Contains("--"))
            slug = slug.Replace("--", "-");

        return slug;
    }
}
