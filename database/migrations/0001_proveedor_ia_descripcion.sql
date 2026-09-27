-- Migracion 0001: agrega la columna Descripcion (notas libres del Admin: plan
-- contratado, credito comprado, fecha de vencimiento, proyecto GCP, etc.) a
-- ProveedorIa. No cifrada, a diferencia de ApiKeyCifrada.
--
-- IF NOT EXISTS hace esta migracion segura de re-ejecutar (idempotente): una base
-- nueva ya trae la columna desde 01_CreateSchema.sql, así que aca no hace nada.
ALTER TABLE ProveedorIa
    ADD COLUMN IF NOT EXISTS Descripcion TEXT NULL AFTER ApiKeyCifrada;
