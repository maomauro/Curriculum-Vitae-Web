using Microsoft.Extensions.Configuration;
using PortalCV.Infrastructure.Services;

namespace PortalCV.Api.Tests;

public class AesGcmApiKeyCipherTests
{
    private static AesGcmApiKeyCipher CipherConClave(string base64Key)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Encryption:Key"] = base64Key })
            .Build();
        return new AesGcmApiKeyCipher(configuration);
    }

    private static string ClaveDePrueba() => Convert.ToBase64String(new byte[32]);

    [Fact]
    public void Encrypt_LuegoDecrypt_DevuelveElTextoOriginal()
    {
        var cipher = CipherConClave(ClaveDePrueba());

        var cifrado = cipher.Encrypt("sk-ant-super-secreta-123");

        Assert.NotEqual("sk-ant-super-secreta-123", cifrado);
        Assert.Equal("sk-ant-super-secreta-123", cipher.Decrypt(cifrado));
    }

    [Fact]
    public void Encrypt_DosVecesElMismoTexto_ProduceValoresDistintos()
    {
        var cipher = CipherConClave(ClaveDePrueba());

        var cifrado1 = cipher.Encrypt("misma-clave");
        var cifrado2 = cipher.Encrypt("misma-clave");

        // Nonce aleatorio por llamada — evita que un mismo texto plano sea reconocible
        // por su ciphertext (importante para claves de API que se repiten poco pero no nunca).
        Assert.NotEqual(cifrado1, cifrado2);
    }

    [Fact]
    public void Decrypt_ConOtraClave_Falla()
    {
        var cifrado = CipherConClave(ClaveDePrueba()).Encrypt("secreto");
        var otraClave = Convert.ToBase64String(Enumerable.Repeat((byte)7, 32).ToArray());
        var cipherConOtraClave = CipherConClave(otraClave);

        Assert.ThrowsAny<Exception>(() => cipherConOtraClave.Decrypt(cifrado));
    }

    [Fact]
    public void Constructor_SinEncryptionKeyConfigurada_LanzaExcepcion()
    {
        var configuration = new ConfigurationBuilder().Build();

        Assert.Throws<InvalidOperationException>(() => new AesGcmApiKeyCipher(configuration));
    }

    [Fact]
    public void Constructor_ConClaveDeLongitudInvalida_LanzaExcepcion()
    {
        var claveCorta = Convert.ToBase64String(new byte[16]);

        Assert.Throws<InvalidOperationException>(() => CipherConClave(claveCorta));
    }
}
