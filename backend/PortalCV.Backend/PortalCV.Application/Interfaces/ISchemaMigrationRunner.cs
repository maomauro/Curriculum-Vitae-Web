namespace PortalCV.Application.Interfaces;

/// <summary>Aplica, al arrancar la API, los cambios incrementales de esquema que
/// todavía no corrieron contra esta base (ver database/migrations/ en la raíz del
/// repo). Reemplaza el paso manual de correr un ALTER TABLE a mano contra
/// producción antes de desplegar un backend que ya espera una columna nueva.</summary>
public interface ISchemaMigrationRunner
{
    Task ApplyPendingMigrationsAsync(CancellationToken ct = default);
}
