using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using PortalCV.Application.Interfaces;

namespace PortalCV.Infrastructure.Services;

/// <summary>Cifrado AES-256-GCM (autenticado) con una clave simétrica única leída de
/// configuración (Encryption:Key, base64 de 32 bytes) — mismo patrón de configuración
/// que Jwt:Key. El resultado empaqueta nonce + tag + texto cifrado en un solo valor
/// base64, listo para guardar en una columna de texto.</summary>
public class AesGcmApiKeyCipher : IApiKeyCipher
{
    private readonly byte[] _key;

    public AesGcmApiKeyCipher(IConfiguration configuration)
    {
        var base64Key = configuration["Encryption:Key"];
        if (string.IsNullOrWhiteSpace(base64Key))
            throw new InvalidOperationException("Encryption:Key no está configurado.");

        try
        {
            _key = Convert.FromBase64String(base64Key);
        }
        catch (FormatException ex)
        {
            throw new InvalidOperationException("Encryption:Key debe ser una clave AES-256 de 32 bytes codificada en base64.", ex);
        }

        if (_key.Length != 32)
            throw new InvalidOperationException("Encryption:Key debe ser una clave AES-256 de 32 bytes codificada en base64.");
    }

    public string Encrypt(string plainText)
    {
        var nonce = RandomNumberGenerator.GetBytes(AesGcm.NonceByteSizes.MaxSize);
        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var cipherBytes = new byte[plainBytes.Length];
        var tag = new byte[AesGcm.TagByteSizes.MaxSize];

        using (var aes = new AesGcm(_key, tag.Length))
        {
            aes.Encrypt(nonce, plainBytes, cipherBytes, tag);
        }

        var result = new byte[nonce.Length + tag.Length + cipherBytes.Length];
        Buffer.BlockCopy(nonce, 0, result, 0, nonce.Length);
        Buffer.BlockCopy(tag, 0, result, nonce.Length, tag.Length);
        Buffer.BlockCopy(cipherBytes, 0, result, nonce.Length + tag.Length, cipherBytes.Length);
        return Convert.ToBase64String(result);
    }

    public string Decrypt(string cipherText)
    {
        var data = Convert.FromBase64String(cipherText);
        var nonceSize = AesGcm.NonceByteSizes.MaxSize;
        var tagSize = AesGcm.TagByteSizes.MaxSize;
        var cipherSize = data.Length - nonceSize - tagSize;
        if (cipherSize < 0)
            throw new CryptographicException("Valor cifrado con formato inválido.");

        var nonce = data.AsSpan(0, nonceSize);
        var tag = data.AsSpan(nonceSize, tagSize);
        var cipherBytes = data.AsSpan(nonceSize + tagSize, cipherSize);
        var plainBytes = new byte[cipherSize];

        using (var aes = new AesGcm(_key, tagSize))
        {
            aes.Decrypt(nonce, cipherBytes, tag, plainBytes);
        }

        return Encoding.UTF8.GetString(plainBytes);
    }
}
