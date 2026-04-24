using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Azure.Storage.Blobs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PortalCV.Application.DTOs.Publica;
using PortalCV.Application.Interfaces;

namespace PortalCV.Infrastructure.Services;

/// <summary>
/// Guarda y recupera <see cref="PublicCvsSnapshotDto"/> en Azure Blob Storage.
/// Si <c>PublicSnapshot:Blob:ConnectionString</c> está vacío, todas las operaciones son no-op.
/// </summary>
public sealed class BlobPublicSnapshotPersistence : IPublicSnapshotPersistence
{
    private readonly BlobContainerClient? _container;
    private readonly string _blobName;
    private readonly ILogger<BlobPublicSnapshotPersistence> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        WriteIndented = false,
    };

    public BlobPublicSnapshotPersistence(
        IConfiguration configuration,
        ILogger<BlobPublicSnapshotPersistence> logger)
    {
        _logger = logger;
        _blobName = configuration["PublicSnapshot:Blob:BlobName"]?.Trim() ?? "public-cvs-snapshot.json";
        var connectionString = configuration["PublicSnapshot:Blob:ConnectionString"]?.Trim();
        var containerName = configuration["PublicSnapshot:Blob:ContainerName"]?.Trim() ?? "portalcv-snapshots";

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            _logger.LogInformation(
                "PublicSnapshot Blob: sin PublicSnapshot:Blob:ConnectionString; persistencia desactivada.");
            _container = null;
            return;
        }

        _container = new BlobServiceClient(connectionString).GetBlobContainerClient(containerName);
    }

    public async Task<PublicCvsSnapshotDto?> TryLoadAsync(CancellationToken ct = default)
    {
        if (_container is null)
        {
            return null;
        }

        try
        {
            var blob = _container.GetBlobClient(_blobName);
            if (!await blob.ExistsAsync(ct))
            {
                return null;
            }

            await using var ms = new MemoryStream();
            await blob.DownloadToAsync(ms, ct);
            var json = Encoding.UTF8.GetString(ms.ToArray());
            var dto = JsonSerializer.Deserialize<PublicCvsSnapshotDto>(json, JsonOptions);
            if (dto is null || dto.Items.Count == 0)
            {
                return null;
            }

            _logger.LogInformation(
                "Snapshot público cargado desde Blob ({Blob}, {Count} CVs, {Version}).",
                _blobName,
                dto.Items.Count,
                dto.SourceVersion);
            return dto;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo leer snapshot público desde Blob.");
            return null;
        }
    }

    public async Task TrySaveAsync(PublicCvsSnapshotDto snapshot, CancellationToken ct = default)
    {
        if (_container is null)
        {
            return;
        }

        try
        {
            await _container.CreateIfNotExistsAsync(cancellationToken: ct);
            var blob = _container.GetBlobClient(_blobName);
            var json = JsonSerializer.Serialize(snapshot, JsonOptions);
            await blob.UploadAsync(
                new BinaryData(Encoding.UTF8.GetBytes(json)),
                overwrite: true,
                cancellationToken: ct);
            _logger.LogInformation(
                "Snapshot público guardado en Blob ({Blob}, {Count} CVs).",
                _blobName,
                snapshot.Items.Count);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo guardar snapshot público en Blob.");
        }
    }
}
