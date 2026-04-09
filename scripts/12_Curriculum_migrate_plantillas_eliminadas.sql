-- Migra códigos de plantilla ya no soportados (moderno, minimal, creativo) a clasico.
-- Ejecutar una vez en entornos con datos existentes.

UPDATE dbo.Curriculum
SET PlantillaCodigo = N'clasico'
WHERE LOWER(LTRIM(RTRIM(PlantillaCodigo))) IN (N'moderno', N'minimal', N'creativo');
GO
