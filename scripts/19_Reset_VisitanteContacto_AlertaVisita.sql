-- Vacía VisitanteContacto y AlertaVisita y reinicia los IDENTITY (ejercicio desde cero).
-- Orden: AlertaVisita primero (FK VisitanteContactoId → NO ACTION).
-- DELETE dispara los triggers de sincronización de contadores / EstadisticasPublicas (TRUNCATE no).
USE [PortalCV];
GO

SET NOCOUNT ON;

DELETE FROM dbo.AlertaVisita;
DELETE FROM dbo.VisitanteContacto;

-- Siguiente fila en cada tabla usará AlertaVisitaId = 1, VisitanteContactoId = 1
DBCC CHECKIDENT (N'dbo.AlertaVisita', RESEED, 0);
DBCC CHECKIDENT (N'dbo.VisitanteContacto', RESEED, 0);
GO
