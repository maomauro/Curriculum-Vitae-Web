# ADR-0001: Conector EF Core para MariaDB — Oracle en vez de Pomelo

## Estado

Aceptada.

## Contexto

El motor de base de datos del proyecto es MariaDB, accedido vía EF Core (`PortalCvDbContext`,
esquema escrito a mano en `database/01_CreateSchema.sql`). EF Core necesita un proveedor de
base de datos (`Microsoft.EntityFrameworkCore.*Provider`) para MariaDB; hay dos candidatos
maduros en el ecosistema .NET:

- `Pomelo.EntityFrameworkCore.MySql` — el proveedor comunitario históricamente más recomendado
  específicamente para MariaDB.
- `MySql.EntityFrameworkCore` — el proveedor oficial de Oracle, pensado primero para MySQL.

El proyecto corre sobre .NET 10 / EF Core 10.

## Decisión

Se usa `MySql.EntityFrameworkCore` (Oracle), no Pomelo.

Al momento de tomar la decisión, Pomelo no tenía ninguna versión compatible con EF Core 10:
la última publicada (9.0.0) falla en runtime con `MissingMethodException` al resolver el
primer `DbContext` — una incompatibilidad binaria real contra
`Microsoft.EntityFrameworkCore.Abstractions` 10.x, no un problema de configuración. El
conector de Oracle sí publica una versión `10.0.x` en paralelo a cada versión de EF Core, y
fue probado contra MariaDB real (no solo contra MySQL).

## Alternativas consideradas

- **Pomelo.EntityFrameworkCore.MySql** — descartada por incompatibilidad binaria con EF Core
  10 al momento de decidir (ver Contexto). Es la opción más orientada a MariaDB
  específicamente, así que vale la pena revisar si publica soporte para EF Core 10 más
  adelante.
- **Quedarse en una versión anterior de EF Core** solo para poder usar Pomelo — descartada:
  ataría todo el proyecto a una versión vieja del framework por un solo paquete.

## Consecuencias

- Migrar de vuelta a Pomelo, si en el futuro publica soporte para EF Core 10, es un cambio
  chico: mismo `DbContext`, mismo esquema (`database/01_CreateSchema.sql` no cambia, es SQL
  estándar sin sintaxis específica del proveedor).
- El conector de Oracle está pensado primero para MySQL; cualquier feature específica de
  MariaDB que no sea compatible con MySQL debe verificarse contra este proveedor antes de
  usarse.

## Referencias

- `backend/README.md` (sección del `DbContext`, comentario original de esta decisión).
