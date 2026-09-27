using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PortalCV.Infrastructure.Data;
using PortalCV.Infrastructure.Services;

namespace PortalCV.Api.Tests;

/// <summary>SchemaMigrationRunner ejecuta SQL crudo especifico de MariaDB (GET_LOCK,
/// ALTER TABLE) -- probarlo end-to-end requeriria una base real, lo que este proyecto
/// evita a proposito (ver TestWebApplicationFactory). Este test cubre el unico
/// comportamiento verificable sin una base real: que se salta por completo para
/// proveedores no relacionales (InMemory, el que usan todos los demas tests de este
/// proyecto) en vez de fallar al intentar correr SQL que ese proveedor no soporta.</summary>
public class SchemaMigrationRunnerTests
{
    [Fact]
    public async Task ApplyPendingMigrationsAsync_ProveedorNoRelacional_NoHaceNada()
    {
        var options = new DbContextOptionsBuilder<PortalCvDbContext>()
            .UseInMemoryDatabase($"SchemaMigrationRunnerTests-{Guid.NewGuid()}")
            .Options;
        await using var context = new PortalCvDbContext(options);
        var runner = new SchemaMigrationRunner(context, NullLogger<SchemaMigrationRunner>.Instance);

        // No debe lanzar (InMemory no soporta GET_LOCK ni ALTER TABLE).
        await runner.ApplyPendingMigrationsAsync();
    }
}
