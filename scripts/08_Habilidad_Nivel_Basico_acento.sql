-- -----------------------------------------------------------------------------
-- Corrige CK_Habilidad_Nivel: el cliente Angular envía "Básico" (con tilde);
-- el esquema original solo permitía "Basico" y fallaba el INSERT/UPDATE (error 500).
-- Ejecutar una vez en bases ya creadas.
-- -----------------------------------------------------------------------------

IF EXISTS (
    SELECT 1
    FROM sys.check_constraints cc
    INNER JOIN sys.tables t ON cc.parent_object_id = t.object_id
    WHERE t.name = N'Habilidad' AND cc.name = N'CK_Habilidad_Nivel'
)
BEGIN
    ALTER TABLE dbo.Habilidad DROP CONSTRAINT CK_Habilidad_Nivel;
END
GO

ALTER TABLE dbo.Habilidad WITH NOCHECK ADD CONSTRAINT CK_Habilidad_Nivel CHECK (
    Nivel IN (N'Basico', N'Básico', N'Intermedio', N'Avanzado', N'Experto') OR Nivel IS NULL
);
GO

ALTER TABLE dbo.Habilidad WITH CHECK CHECK CONSTRAINT CK_Habilidad_Nivel;
GO
