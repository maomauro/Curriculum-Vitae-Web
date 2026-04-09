-- Evita 500 al guardar formación cuando "Area" supera 100 caracteres.
-- Ajusta la columna existente a NVARCHAR(300) de forma idempotente.

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Formacion')
      AND name = N'Area'
      AND max_length < 600 -- NVARCHAR(300) = 600 bytes
)
BEGIN
    ALTER TABLE dbo.Formacion
    ALTER COLUMN Area NVARCHAR(300) NULL;
END
GO
