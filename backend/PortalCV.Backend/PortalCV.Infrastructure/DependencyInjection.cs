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
            options
                .UseSqlServer(
                    connectionString,
                    sqlOptions => sqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)));

        services.AddHttpContextAccessor();
        services.AddMemoryCache();

        // Repositorios genéricos
        services.AddScoped(typeof(IRepository<>), typeof(GenericRepository<>));
        services.AddScoped<ICurriculumRepository, CurriculumRepository>();
        services.AddScoped<IPromptIaRepository, PromptIaRepository>();

        // Servicios de aplicación
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IPublicCvVisitaRegistroService, PublicCvVisitaRegistroService>();
        services.AddScoped<IPublicCvService, PublicCvService>();
        services.AddScoped<ICvEditorService, CvEditorService>();
        services.AddScoped<IAlertaService, AlertaService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IPromptIaService, PromptIaService>();
        services.AddScoped<IAdminAuditoriaService, AdminAuditoriaService>();
        services.AddScoped<ICvAuditoriaService, CvAuditoriaService>();
        services.AddScoped<IAuthAuditoriaService, AuthAuditoriaService>();
        services.AddScoped<IProveedorIaService, ProveedorIaService>();

        services.AddSingleton<IApiKeyCipher, AesGcmApiKeyCipher>();
        // Nombre explícito en cada registro: AddHttpClient<TClient, TImpl>() sin nombre usa
        // typeof(TClient).Name como clave del HttpClient -- como las tres implementaciones
        // comparten TClient=IAiProviderClient, sin un nombre propio colisionarían (ASP.NET
        // Core lanza InvalidOperationException la primera vez que se resuelve el segundo
        // TImplementation registrado bajo el mismo TClient).
        services.AddHttpClient<IAiProviderClient, ClaudeAiProviderClient>("ia-claude", client =>
        {
            client.BaseAddress = new Uri("https://api.anthropic.com/");
            client.Timeout = TimeSpan.FromSeconds(10);
        });
        services.AddHttpClient<IAiProviderClient, GeminiAiProviderClient>("ia-gemini", client =>
        {
            client.BaseAddress = new Uri("https://generativelanguage.googleapis.com/");
            client.Timeout = TimeSpan.FromSeconds(10);
        });
        services.AddHttpClient<IAiProviderClient, OllamaAiProviderClient>("ia-ollama", client =>
        {
            // Sin BaseAddress fija: cada conexión guardada trae su propio Endpoint
            // (Docker local, LAN, etc.), usado como URI absoluta en cada solicitud.
            client.Timeout = TimeSpan.FromSeconds(10);
        });

        return services;
    }
}

