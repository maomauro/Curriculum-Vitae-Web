/*
  Migración: visibilidad por empleo en Mi CV / detalle público.
  Idempotente: solo añade la columna si no existe.
*/
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Experiencia', N'U')
      AND name = N'MostrarEnCv'
)
BEGIN
    ALTER TABLE dbo.Experiencia
    ADD MostrarEnCv BIT NOT NULL
        CONSTRAINT DF_Experiencia_MostrarEnCv DEFAULT (1);
END
GO
