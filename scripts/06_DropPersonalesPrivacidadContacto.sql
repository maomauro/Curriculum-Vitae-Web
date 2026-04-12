-- Quita PrivacidadEmail y PrivacidadTelefono de Personales.
-- La visibilidad de correo y celular en el CV público queda solo en VisibilidadSeccion
-- (p. ej. datos-personales.email, datos-personales.telefono).
-- Ejecutar contra la base ya creada (no aplica en instalaciones nuevas si usas 01_CreateSchema actualizado).

SET NOCOUNT ON;

-- Nombres de CHECK según EF (PersonalesConfiguration) o scripts 01/05 históricos
IF OBJECT_ID(N'dbo.CK_Personales_PrivacidadEmail', N'C') IS NOT NULL
    ALTER TABLE dbo.Personales DROP CONSTRAINT CK_Personales_PrivacidadEmail;

IF OBJECT_ID(N'dbo.CK_Personales_PrivacidadTelefono', N'C') IS NOT NULL
    ALTER TABLE dbo.Personales DROP CONSTRAINT CK_Personales_PrivacidadTelefono;

IF OBJECT_ID(N'dbo.CK_Personales_PrivEmail', N'C') IS NOT NULL
    ALTER TABLE dbo.Personales DROP CONSTRAINT CK_Personales_PrivEmail;

IF OBJECT_ID(N'dbo.CK_Personales_PrivTel', N'C') IS NOT NULL
    ALTER TABLE dbo.Personales DROP CONSTRAINT CK_Personales_PrivTel;

-- DEFAULT con nombre autogenerado (p. ej. DF__Personale__Priva__4262CC11) impide DROP COLUMN hasta quitarlo
DECLARE @dcName sysname;
DECLARE @dropDc nvarchar(400);
WHILE 1 = 1
BEGIN
    SELECT @dcName = (
        SELECT TOP (1) dc.name
        FROM sys.default_constraints dc
        INNER JOIN sys.columns col
            ON col.object_id = dc.parent_object_id AND col.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(N'dbo.Personales')
          AND col.name IN (N'PrivacidadEmail', N'PrivacidadTelefono')
    );
    IF @dcName IS NULL BREAK;

    SET @dropDc = N'ALTER TABLE dbo.Personales DROP CONSTRAINT ' + QUOTENAME(@dcName);
    EXEC sys.sp_executesql @dropDc;
END;

IF COL_LENGTH(N'dbo.Personales', N'PrivacidadEmail') IS NOT NULL
    ALTER TABLE dbo.Personales DROP COLUMN PrivacidadEmail;

IF COL_LENGTH(N'dbo.Personales', N'PrivacidadTelefono') IS NOT NULL
    ALTER TABLE dbo.Personales DROP COLUMN PrivacidadTelefono;

PRINT 'Personales: columnas PrivacidadEmail / PrivacidadTelefono eliminadas.';
