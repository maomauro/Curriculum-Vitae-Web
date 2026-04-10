-- Si POST /api/cv/formaciones devuelve 500 y en logs aparece "Invalid column name 'FechaVigencia'" o similar,
-- ejecuta este script contra tu base (una vez).

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Formacion') AND name = N'FechaVigencia')
BEGIN
    ALTER TABLE dbo.Formacion ADD FechaVigencia DATE NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Formacion') AND name = N'DuracionHoras')
BEGIN
    ALTER TABLE dbo.Formacion ADD DuracionHoras INT NULL;
END
GO
