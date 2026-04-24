using PortalCV.Application.DTOs.Publica;

namespace PortalCV.Application.Interfaces;

public interface IPublicSnapshotService
{
    PublicCvsSnapshotDto GetLatest();
}

