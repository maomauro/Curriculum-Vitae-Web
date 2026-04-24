using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PortalCV.Application.Interfaces;
using PortalCV.Domain.Entities;
using PortalCV.Infrastructure.Data;
using PortalCV.Infrastructure.Repositories;
using PortalCV.Infrastructure.Services;

namespace PortalCV.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection no está configurado.");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("ConnectionStrings:DefaultConnection no puede estar vacío.");
        }

        services.AddDbContext<PortalCvDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddHttpContextAccessor();

        // Repositorios genéricos
        services.AddScoped(typeof(IRepository<>), typeof(GenericRepository<>));
        services.AddScoped<ICurriculumRepository, CurriculumRepository>();

        // Servicios de aplicación
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IPublicCvVisitaRegistroService, PublicCvVisitaRegistroService>();
        services.AddScoped<IPublicCvService, PublicCvService>();
        services.AddSingleton<IPublicSnapshotPersistence, BlobPublicSnapshotPersistence>();
        services.AddSingleton<IPublicSnapshotService, PublicSnapshotService>();
        services.AddHostedService(sp => (PublicSnapshotService)sp.GetRequiredService<IPublicSnapshotService>());
        services.AddScoped<ICvEditorService, CvEditorService>();
        services.AddScoped<IAlertaService, AlertaService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IAdminAuditoriaService, AdminAuditoriaService>();
        services.AddScoped<ICvAuditoriaService, CvAuditoriaService>();

        return services;
    }
}

