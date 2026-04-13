-- Añade columna EsLeida a VisitanteContacto (marcar contacto como leído en el panel).
-- Idempotente: seguro ejecutar varias veces.
IF COL_LENGTH(N'dbo.VisitanteContacto', N'EsLeida') IS NULL
BEGIN
    ALTER TABLE dbo.VisitanteContacto
        ADD EsLeida BIT NOT NULL
            CONSTRAINT DF_VisitanteContacto_EsLeida DEFAULT 0;
END
GO
