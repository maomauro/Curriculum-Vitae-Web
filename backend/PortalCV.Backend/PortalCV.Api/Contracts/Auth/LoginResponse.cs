namespace PortalCV.Api.Contracts.Auth;

public class LoginResponse
{
    public string TokenType { get; set; } = "Bearer";
    public string AccessToken { get; set; } = string.Empty;
    public long ExpiresIn { get; set; }
}
