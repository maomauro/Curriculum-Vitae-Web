using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using PortalCV.Application.DTOs.Auth;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly PortalCvDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(PortalCvDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Login
    // ──────────────────────────────────────────────────────────────────────────

    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var usuario = await _context.Usuarios
            .Include(u => u.UsuarioRoles)
                .ThenInclude(ur => ur.Rol)
            .Include(u => u.Curriculums)
                .ThenInclude(c => c.Personales)
            .FirstOrDefaultAsync(u => u.Email == request.Email, ct);

        // Mensaje genérico para no revelar si el email existe
        const string invalidMsg = "Credenciales inválidas.";

        if (usuario is null || usuario.Estado != "Activo")
            throw new UnauthorizedAccessException(invalidMsg);

        if (!BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash))
            throw new UnauthorizedAccessException(invalidMsg);

        var roles = usuario.UsuarioRoles.Select(ur => ur.Rol.NombreRol).ToList();
        var curriculum = usuario.Curriculums.FirstOrDefault();
        var curriculumId = curriculum?.CurriculumId ?? 0;

        // NombreCompleto desde Personales si ya está cargado, si no usa el email
        string nombreCompleto = usuario.Email;
        if (curriculum?.Personales is { PrimerNombre: var pn, PrimerApellido: var pa })
            nombreCompleto = $"{pn} {pa}".Trim();

        var (token, expiracion) = BuildJwt(usuario, roles, curriculumId);

        return new LoginResponse(token, usuario.Email, nombreCompleto, roles, expiracion);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Register
    // ──────────────────────────────────────────────────────────────────────────

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var emailTaken = await _context.Usuarios
            .AnyAsync(u => u.Email == request.Email, ct);

        if (emailTaken)
            throw new InvalidOperationException("El correo ya está registrado.");

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12);

        var usuario = new Usuario
        {
            Email = request.Email,
            PasswordHash = passwordHash,
            Estado = "Activo",
            FechaRegistro = DateTime.UtcNow
        };

        // Asignar rol "Publicador" por defecto
        var rolPublicador = await _context.Set<Rol>()
            .FirstOrDefaultAsync(r => r.NombreRol == "Publicador", ct);

        if (rolPublicador is not null)
            usuario.UsuarioRoles.Add(new UsuarioRol { Rol = rolPublicador, Usuario = usuario });

        // Crear curriculum vacío con URL pública derivada del nombre
        var urlPublica = await GenerarUrlPublicaUnicaAsync(request.NombreCompleto, request.Email, ct);

        var curriculum = new Curriculum
        {
            UrlPublica = urlPublica,
            Estado = "Borrador",
            FechaCreacion = DateTime.UtcNow,
            FechaActualizacion = DateTime.UtcNow,
            Usuario = usuario
        };
        usuario.Curriculums.Add(curriculum);

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync(ct);

        return new RegisterResponse(usuario.UsuarioId, usuario.Email, request.NombreCompleto);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers privados
    // ──────────────────────────────────────────────────────────────────────────

    private (string token, DateTime expiracion) BuildJwt(
        Usuario usuario, IEnumerable<string> roles, int curriculumId)
    {
        var issuer    = _configuration["Jwt:Issuer"]    ?? throw new InvalidOperationException("Jwt:Issuer no configurado.");
        var audience  = _configuration["Jwt:Audience"]  ?? throw new InvalidOperationException("Jwt:Audience no configurado.");
        var secretKey = _configuration["Jwt:Key"]       ?? throw new InvalidOperationException("Jwt:Key no configurado.");

        var expiracion = DateTime.UtcNow.AddHours(8);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub,   usuario.UsuarioId.ToString()),
            new(JwtRegisteredClaimNames.Email, usuario.Email),
            new("curriculum_id",               curriculumId.ToString())
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var jwt = new JwtSecurityToken(
            issuer:             issuer,
            audience:           audience,
            claims:             claims,
            expires:            expiracion,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(jwt), expiracion);
    }

    private async Task<string> GenerarUrlPublicaUnicaAsync(
        string nombreCompleto, string email, CancellationToken ct)
    {
        var base64 = !string.IsNullOrWhiteSpace(nombreCompleto)
            ? NormalizarSlug(nombreCompleto)
            : NormalizarSlug(email.Split('@')[0]);

        if (base64.Length < 3) base64 = "cv-" + base64;

        var url = base64;
        var counter = 1;

        while (await _context.Curriculums.AnyAsync(c => c.UrlPublica == url, ct))
        {
            url = $"{base64}-{counter++}";
        }

        return url;
    }

    private static string NormalizarSlug(string input)
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

        var sb = new System.Text.StringBuilder();
        foreach (var c in input.ToLowerInvariant())
        {
            if (mapa.TryGetValue(c, out var mapped)) sb.Append(mapped);
            else if (char.IsLetterOrDigit(c)) sb.Append(c);
            else if (c == ' ' || c == '-') sb.Append('-');
        }

        // Eliminar guiones dobles o al inicio/final
        var slug = sb.ToString().Trim('-');
        while (slug.Contains("--"))
            slug = slug.Replace("--", "-");

        return slug;
    }
}
