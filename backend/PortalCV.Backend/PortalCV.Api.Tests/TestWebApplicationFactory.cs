using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PortalCV.Api;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Api.Tests;

/// <summary>
/// Factory de tests de integracion. Levanta el host de PortalCV.Api en memoria y
/// reemplaza el DbContext configurado con SQL Server por uno con proveedor
/// InMemory, de manera que los tests no dependen de una base de datos real.
///
/// Tambien fuerza valores minimos de configuracion (Jwt y ConnectionString) para
/// que Program.cs no aborte por validaciones al arrancar. Se usa UseSetting en
/// vez de ConfigureAppConfiguration porque los values de UseSetting se aplican
/// antes de que Program.cs lea IConfiguration en AddInfrastructure.
/// </summary>
public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    // Clave JWT solo para tests. Longitud minima 32 chars (HS256).
    private const string TestJwtKey = "test-jwt-key-for-integration-tests-only-32plus";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        // Valores minimos requeridos por Program.cs y AddInfrastructure. El
        // ConnectionString es un placeholder: el DbContext real se reemplaza
        // por InMemory en ConfigureTestServices.
        builder.UseSetting(
            "ConnectionStrings:DefaultConnection",
            "Server=(localdb);Database=Test;Trusted_Connection=True;");
        builder.UseSetting("Jwt:Key", TestJwtKey);
        builder.UseSetting("Jwt:Issuer", "PortalCV.Api.Tests");
        builder.UseSetting("Jwt:Audience", "PortalCV.Client.Tests");

        builder.ConfigureTestServices(services =>
        {
            // Retira el DbContext de SQL Server registrado por AddInfrastructure.
            // Si ademas no se aisla el provider interno, EF aborta con
            // "Services for database providers 'SqlServer','InMemory' have been
            // registered" porque AddInfrastructure registro los servicios
            // internos de SqlServer como singletons en el mismo contenedor.
            var dbContextDescriptor = services.Single(
                s => s.ServiceType == typeof(DbContextOptions<PortalCvDbContext>));
            services.Remove(dbContextDescriptor);

            // Proveedor interno de EF Core exclusivo para InMemory, aislado del
            // contenedor principal (evita colision con el provider de SqlServer).
            var efInMemoryProvider = new ServiceCollection()
                .AddEntityFrameworkInMemoryDatabase()
                .BuildServiceProvider();

            services.AddDbContext<PortalCvDbContext>(options =>
            {
                options.UseInMemoryDatabase($"PortalCV-Tests-{Guid.NewGuid()}");
                options.UseInternalServiceProvider(efInMemoryProvider);
            });
        });
    }
}
