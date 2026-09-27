using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PortalCV.Application.Interfaces;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

/// <summary>Ver ISchemaMigrationRunner. Los scripts viven en database/migrations/ (raíz
/// del repo) y se compilan como recursos embebidos del ensamblado (ver
/// PortalCV.Infrastructure.csproj) -- así llegan dentro del binario publicado sin
/// depender de que la carpeta exista en el sistema de archivos en tiempo de ejecución
/// (la imagen Docker de producción no la copia aparte).
///
/// Cada archivo se aplica una sola vez por base de datos: se registra su nombre en la
/// tabla SchemaMigrations (creada acá mismo si no existe) apenas se ejecuta con éxito.
/// Un candado de sesión de MariaDB (GET_LOCK) evita que dos instancias del backend
/// arrancando al mismo tiempo apliquen la misma migración en paralelo.</summary>
public class SchemaMigrationRunner : ISchemaMigrationRunner
{
    private const string NombreCandado = "portalcv_schema_migrations";
    private const int TimeoutCandadoSegundos = 30;

    private readonly PortalCvDbContext _context;
    private readonly ILogger<SchemaMigrationRunner> _logger;

    public SchemaMigrationRunner(PortalCvDbContext context, ILogger<SchemaMigrationRunner> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ApplyPendingMigrationsAsync(CancellationToken ct = default)
    {
        // Los tests de integración usan el proveedor InMemory (ver
        // TestWebApplicationFactory) -- no soporta SQL crudo ni tiene sentido
        // versionar su esquema, así que no hay nada que migrar ahí. Se comprueba por
        // nombre de proveedor (no con Database.IsRelational()): al arrancar el host de
        // pruebas, este código corre antes de que WebApplicationFactory termine de
        // sustituir el DbContext por el de InMemory, y en ese instante intermedio
        // IsRelational() todavía reporta el proveedor MySQL original.
        if (_context.Database.ProviderName?.Contains("MySql", StringComparison.OrdinalIgnoreCase) != true)
        {
            return;
        }

        var connection = _context.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(ct);
        }

        if (!await ObtenerCandadoAsync(connection, ct))
        {
            _logger.LogWarning(
                "No se pudo obtener el candado de migraciones de esquema en {Timeout}s -- " +
                "asumiendo que otra instancia ya las está aplicando.", TimeoutCandadoSegundos);
            return;
        }

        try
        {
            await _context.Database.ExecuteSqlRawAsync(
                """
                CREATE TABLE IF NOT EXISTS SchemaMigrations (
                    MigrationId VARCHAR(255) NOT NULL,
                    FechaAplicacion DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
                    CONSTRAINT PK_SchemaMigrations PRIMARY KEY (MigrationId)
                ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
                """, ct);

            var aplicadas = (await _context.Database
                    .SqlQueryRaw<string>("SELECT MigrationId FROM SchemaMigrations")
                    .ToListAsync(ct))
                .ToHashSet(StringComparer.Ordinal);

            foreach (var (id, sql) in ObtenerMigracionesEmbebidas())
            {
                if (aplicadas.Contains(id))
                {
                    continue;
                }

                _logger.LogInformation("Aplicando migración de esquema {MigrationId}...", id);
                await _context.Database.ExecuteSqlRawAsync(sql, ct);
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"INSERT INTO SchemaMigrations (MigrationId) VALUES ({id})", ct);
                _logger.LogInformation("Migración de esquema {MigrationId} aplicada.", id);
            }
        }
        finally
        {
            await LiberarCandadoAsync(connection, ct);
        }
    }

    private static async Task<bool> ObtenerCandadoAsync(IDbConnection connection, CancellationToken ct)
    {
        using var cmd = connection.CreateCommand();
        cmd.CommandText = "SELECT GET_LOCK(@name, @timeout)";
        AgregarParametro(cmd, "@name", NombreCandado);
        AgregarParametro(cmd, "@timeout", TimeoutCandadoSegundos);
        var resultado = await ((System.Data.Common.DbCommand)cmd).ExecuteScalarAsync(ct);
        return Convert.ToInt64(resultado) == 1;
    }

    private static async Task LiberarCandadoAsync(IDbConnection connection, CancellationToken ct)
    {
        using var cmd = connection.CreateCommand();
        cmd.CommandText = "SELECT RELEASE_LOCK(@name)";
        AgregarParametro(cmd, "@name", NombreCandado);
        await ((System.Data.Common.DbCommand)cmd).ExecuteScalarAsync(ct);
    }

    private static void AgregarParametro(IDbCommand cmd, string nombre, object valor)
    {
        var p = cmd.CreateParameter();
        p.ParameterName = nombre;
        p.Value = valor;
        cmd.Parameters.Add(p);
    }

    /// <summary>Recursos embebidos con namespace "PortalCV.Infrastructure.Migrations.&lt;archivo&gt;.sql"
    /// (ver LinkBase en el .csproj), ordenados por nombre -- por eso la numeración
    /// (0001_, 0002_, ...) importa: define el orden de aplicación.</summary>
    private static IEnumerable<(string Id, string Sql)> ObtenerMigracionesEmbebidas()
    {
        var asm = typeof(SchemaMigrationRunner).Assembly;
        var nombres = asm.GetManifestResourceNames()
            .Where(n => n.Contains(".Migrations.", StringComparison.Ordinal)
                && n.EndsWith(".sql", StringComparison.OrdinalIgnoreCase))
            .OrderBy(n => n, StringComparer.Ordinal);

        foreach (var nombre in nombres)
        {
            using var stream = asm.GetManifestResourceStream(nombre)
                ?? throw new InvalidOperationException($"No se pudo leer el recurso embebido '{nombre}'.");
            using var reader = new StreamReader(stream);
            yield return (ExtraerId(nombre), reader.ReadToEnd());
        }
    }

    private static string ExtraerId(string nombreRecurso)
    {
        var sinExtension = nombreRecurso[..^".sql".Length];
        var idx = sinExtension.LastIndexOf('.');
        return idx >= 0 ? sinExtension[(idx + 1)..] : sinExtension;
    }
}
