#!/bin/bash
# =============================================================================
# init-db.sh — Inicialización automática de la base de datos PortalCV
# Se ejecuta una sola vez cuando docker-compose up arranca por primera vez.
#
# Flujo:
#   1. Crea la base de datos PortalCV si no existe
#   2. Ejecuta 01_CreateSchema.sql  (tablas, triggers, vistas, índices)
#   3. Ejecuta 02_InsertTestData.sql (datos de prueba)
#   4. Crea usuario de aplicación con permisos mínimos
# =============================================================================

# Variables de conexión de bootstrap (administración inicial)
SERVER="db"                        # Nombre del servicio en docker-compose
ADMIN_DB_USER="${ADMIN_DB_USER:-SA}"
ADMIN_DB_PASSWORD="${SA_PASSWORD}" # Password del usuario admin (solo bootstrap)
SQLCMD="/opt/mssql-tools18/bin/sqlcmd"
DB_NAME="${DB_NAME:-PortalCV}"
APP_DB_USER="${APP_DB_USER}"
APP_DB_PASSWORD="${APP_DB_PASSWORD}"

if [ -z "$APP_DB_USER" ] || [ -z "$APP_DB_PASSWORD" ]; then
  echo "[ERROR] APP_DB_USER y APP_DB_PASSWORD son obligatorios."
  exit 1
fi

# Escapa comillas simples para inyección segura en SQL literal
APP_DB_USER_ESCAPED="${APP_DB_USER//\'/\'\'}"
APP_DB_PASSWORD_ESCAPED="${APP_DB_PASSWORD//\'/\'\'}"
APP_DB_USER_BRACKET_ESCAPED="${APP_DB_USER//]/]]}"

echo "========================================================"
echo " PortalCV - Inicialización de base de datos"
echo "========================================================"

# ── PASO 1: Crear la base de datos ──────────────────────────────────────────
# El script 01_CreateSchema.sql usa USE [PortalCV], por eso la creamos primero.
echo "[1/4] Creando base de datos ${DB_NAME}..."

$SQLCMD -S "$SERVER" -U "$ADMIN_DB_USER" -P "$ADMIN_DB_PASSWORD" -No -b -d master -Q "
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${DB_NAME}')
BEGIN
  CREATE DATABASE [${DB_NAME}];
  PRINT 'Base de datos ${DB_NAME} creada.';
END
ELSE
BEGIN
  PRINT 'Base de datos ${DB_NAME} ya existe, continuando...';
END
"

if [ $? -ne 0 ]; then
  echo "[ERROR] No se pudo crear la base de datos. Abortando."
  exit 1
fi

# ── PASO 2: Ejecutar schema ──────────────────────────────────────────────────
echo "[2/4] Ejecutando 01_CreateSchema.sql (tablas, triggers, vistas, indices)..."

$SQLCMD -S "$SERVER" -U "$ADMIN_DB_USER" -P "$ADMIN_DB_PASSWORD" -No -b -d "$DB_NAME" -i /scripts/01_CreateSchema.sql

if [ $? -ne 0 ]; then
  echo "[ERROR] Fallo en 01_CreateSchema.sql. Abortando."
  exit 1
fi

echo "[OK] Schema creado correctamente."

# ── PASO 3: Insertar datos de prueba ────────────────────────────────────────
echo "[3/4] Ejecutando 02_InsertTestData.sql (datos de prueba)..."

$SQLCMD -S "$SERVER" -U "$ADMIN_DB_USER" -P "$ADMIN_DB_PASSWORD" -No -b -d "$DB_NAME" -i /scripts/02_InsertTestData.sql

if [ $? -ne 0 ]; then
  echo "[ERROR] Fallo en 02_InsertTestData.sql. Abortando."
  exit 1
fi

echo "[OK] Datos de prueba insertados correctamente."

# ── PASO 4: Crear usuario de aplicación con privilegios mínimos ────────────
echo "[4/4] Creando usuario de aplicación y permisos mínimos..."

$SQLCMD -S "$SERVER" -U "$ADMIN_DB_USER" -P "$ADMIN_DB_PASSWORD" -No -b -d master -Q "
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = '${APP_DB_USER_ESCAPED}')
BEGIN
  CREATE LOGIN [${APP_DB_USER_BRACKET_ESCAPED}] WITH PASSWORD = '${APP_DB_PASSWORD_ESCAPED}';
END

USE [${DB_NAME}];

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = '${APP_DB_USER_ESCAPED}')
BEGIN
  CREATE USER [${APP_DB_USER_BRACKET_ESCAPED}] FOR LOGIN [${APP_DB_USER_BRACKET_ESCAPED}];
END

GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO [${APP_DB_USER_BRACKET_ESCAPED}];
GRANT EXECUTE ON SCHEMA::dbo TO [${APP_DB_USER_BRACKET_ESCAPED}];
"

if [ $? -ne 0 ]; then
  echo "[ERROR] Fallo al crear usuario de aplicación. Abortando."
  exit 1
fi

echo "[OK] Usuario de aplicación '${APP_DB_USER}' configurado con permisos mínimos."
echo "========================================================"
echo " Inicializacion completada exitosamente."
echo "========================================================"
