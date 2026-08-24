using System.Linq;
using System.Text.RegularExpressions;
using PortalCV.Application.Interfaces;

namespace PortalCV.Infrastructure.Services;

public partial class PromptEnsambladorService : IPromptEnsambladorService
{
    [GeneratedRegex(@"\{\{([A-Z0-9_]+)\}\}")]
    private static partial Regex MarcadorRegex();

    public string Ensamblar(string contenido, IReadOnlyDictionary<string, string> valores)
    {
        // Se valida contra el CONTENIDO ORIGINAL (no el ya sustituido): si un valor
        // sustituido contiene a su vez "{{algo}}" en texto libre (p. ej. una oferta
        // pegada que cita una plantilla), no debe reinterpretarse como marcador sin
        // resolver -- Regex.Replace además nunca reescanea su propio reemplazo.
        var sinResolver = MarcadorRegex().Matches(contenido)
            .FirstOrDefault(m => !valores.ContainsKey(m.Groups[1].Value));
        if (sinResolver is not null)
        {
            throw new ArgumentException(
                $"El prompt activo referencia un marcador desconocido: {sinResolver.Value}");
        }

        return MarcadorRegex().Replace(contenido, match => valores[match.Groups[1].Value]);
    }
}
