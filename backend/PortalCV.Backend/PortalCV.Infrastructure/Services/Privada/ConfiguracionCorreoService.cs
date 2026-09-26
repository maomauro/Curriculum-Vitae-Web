using Microsoft.EntityFrameworkCore;
using PortalCV.Application.DTOs.Privada;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

public class ConfiguracionCorreoService : IConfiguracionCorreoService
{
    private const string HostPorDefecto = "smtp.gmail.com";
    private const int PuertoPorDefecto = 587;

    private readonly PortalCvDbContext _context;
    private readonly IApiKeyCipher _cipher;

    public ConfiguracionCorreoService(PortalCvDbContext context, IApiKeyCipher cipher)
    {
        _context = context;
        _cipher = cipher;
    }

    public async Task<ConfiguracionCorreoDto> ObtenerAsync(int curriculumId, CancellationToken ct = default)
    {
        var e = await _context.ConfiguracionesCorreo.AsNoTracking()
            .FirstOrDefaultAsync(c => c.CurriculumId == curriculumId, ct);

        if (e is null)
            return new ConfiguracionCorreoDto(0, HostPorDefecto, PuertoPorDefecto, true, false, null);

        return Map(e);
    }

    public async Task<ConfiguracionCorreoDto> GuardarAsync(
        int curriculumId, GuardarConfiguracionCorreoRequest r, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(r.Host))
            throw new ArgumentException("El host SMTP es requerido.");
        if (r.Puerto is <= 0 or > 65535)
            throw new ArgumentException("El puerto SMTP no es válido.");

        var e = await _context.ConfiguracionesCorreo.FirstOrDefaultAsync(c => c.CurriculumId == curriculumId, ct);
        if (e is null)
        {
            if (string.IsNullOrWhiteSpace(r.Password))
                throw new ArgumentException("La contraseña es requerida para configurar el correo por primera vez.");

            e = new ConfiguracionCorreo
            {
                CurriculumId = curriculumId,
                FechaCreacion = DateTime.UtcNow,
            };
            _context.ConfiguracionesCorreo.Add(e);
        }

        e.Host = r.Host.Trim();
        e.Puerto = r.Puerto;
        e.UsarTls = r.UsarTls;
        if (!string.IsNullOrWhiteSpace(r.Password))
            e.PasswordCifrada = _cipher.Encrypt(r.Password.Trim());
        e.FechaActualizacion = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        return Map(e);
    }

    private static ConfiguracionCorreoDto Map(ConfiguracionCorreo e) => new(
        e.ConfiguracionCorreoId, e.Host, e.Puerto, e.UsarTls,
        !string.IsNullOrEmpty(e.PasswordCifrada), e.FechaActualizacion);
}
