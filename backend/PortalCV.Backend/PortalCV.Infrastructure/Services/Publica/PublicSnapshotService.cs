using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PortalCV.Application.DTOs.Publica;
using PortalCV.Application.Interfaces;
using PortalCV.Infrastructure.Data;

namespace PortalCV.Infrastructure.Services;

/// <summary>
/// Genera y mantiene un snapshot en memoria con CVs públicos.
/// Se refresca automáticamente solo cuando hay conectividad con DB.
/// </summary>
public sealed class PublicSnapshotService : BackgroundService, IPublicSnapshotService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PublicSnapshotService> _logger;
    private readonly TimeSpan _refreshInterval;

    private PublicCvsSnapshotDto _current = new(
        DateTime.UnixEpoch,
        "bootstrap-empty",
        []);

    public PublicSnapshotService(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<PublicSnapshotService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;

        var minutes = configuration.GetValue<int?>("PublicSnapshot:RefreshIntervalMinutes") ?? 10;
        if (minutes < 1) minutes = 1;
        _refreshInterval = TimeSpan.FromMinutes(minutes);
    }

    public PublicCvsSnapshotDto GetLatest() => _current;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("PublicSnapshotService iniciado. Intervalo: {Minutes} min", _refreshInterval.TotalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await TryRefreshSnapshotAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error refrescando snapshot público.");
            }

            try
            {
                await Task.Delay(_refreshInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    private async Task TryRefreshSnapshotAsync(CancellationToken ct)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalCvDbContext>();

        if (!await db.Database.CanConnectAsync(ct))
        {
            _logger.LogDebug("Snapshot público: DB no disponible, se conserva snapshot anterior.");
            return;
        }

        var publicCvService = scope.ServiceProvider.GetRequiredService<IPublicCvService>();
        const int pageSize = 50;
        var page = 1;
        var total = 0;
        var items = new List<PublicSnapshotItemDto>();

        do
        {
            var result = await publicCvService.BuscarCvsAsync(
                new BuscarCvsQuery(null, null, null, page, pageSize),
                ct);

            total = result.Total;
            foreach (var listado in result.Items)
            {
                var detalle = await publicCvService.GetDetalleAsync(listado.UrlPublica, null, ct);
                if (detalle is null) continue;
                var stats = await publicCvService.GetEstadisticasAsync(listado.UrlPublica, ct);
                items.Add(new PublicSnapshotItemDto(listado, detalle, stats));
            }

            page++;
        }
        while ((page - 1) * pageSize < total);

        _current = new PublicCvsSnapshotDto(
            DateTime.UtcNow,
            "api-background-v1",
            items);

        _logger.LogInformation("Snapshot público actualizado con {ItemsCount} CVs.", items.Count);
    }
}

