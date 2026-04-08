using PortalCV.Application.DTOs.Auth;

namespace PortalCV.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
}
