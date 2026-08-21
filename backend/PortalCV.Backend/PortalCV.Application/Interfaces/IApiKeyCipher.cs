namespace PortalCV.Application.Interfaces;

/// <summary>Cifrado reversible (no hashing) para secretos que el back-end necesita
/// volver a leer en texto plano más adelante — p. ej. la clave de API de un
/// proveedor de IA, que se usa para llamar a ese proveedor. Nunca se expone al
/// front-end, ni cifrada ni en texto plano.</summary>
public interface IApiKeyCipher
{
    string Encrypt(string plainText);
    string Decrypt(string cipherText);
}
