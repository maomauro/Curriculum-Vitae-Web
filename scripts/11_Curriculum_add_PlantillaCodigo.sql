-- Añade plantilla de presentación del CV (Mi CV / impresión).
-- Valores válidos en aplicación: clasico | profesional | ats | corporativo | ejecutivo

IF COL_LENGTH(N'dbo.Curriculum', N'PlantillaCodigo') IS NULL
BEGIN
    ALTER TABLE dbo.Curriculum ADD PlantillaCodigo NVARCHAR(32) NOT NULL
        CONSTRAINT DF_Curriculum_PlantillaCodigo DEFAULT N'clasico';
END
GO
