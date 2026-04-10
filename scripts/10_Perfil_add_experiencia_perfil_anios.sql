-- Agrega campo editable para "experiencia del perfil" (diferente a trayectoria total calculada).

IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Perfil')
      AND name = N'ExperienciaPerfilAnios')
BEGIN
    ALTER TABLE dbo.Perfil
    ADD ExperienciaPerfilAnios DECIMAL(5,2) NULL;
END
GO
