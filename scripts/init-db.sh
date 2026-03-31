#!/bin/bash
# =============================================================================
# init-db.sh — Inicialización automática de la base de datos PortalCV
# Se ejecuta una sola vez cuando docker-compose up arranca por primera vez.
#
# Flujo:
#   1. Crea la base de datos PortalCV si no existe
#   2. Ejecuta 01_CreateSchema.sql  (tablas, triggers, vistas, índices)
#   3. Ejecuta 02_InsertTestData.sql (datos de prueba)
# =============================================================================

# Variables de conexión
SERVER="db"                        # Nombre del servicio en docker-compose
USER="SA"
PASSWORD="${SA_PASSWORD}"          # Viene de la variable de entorno del contenedor
SQLCMD="/opt/mssql-tools18/bin/sqlcmd"

echo "========================================================"
echo " PortalCV - Inicialización de base de datos"
echo "========================================================"

# ── PASO 1: Crear la base de datos ──────────────────────────────────────────
# El script 01_CreateSchema.sql usa USE [PortalCV], por eso la creamos primero.
echo "[1/3] Creando base de datos PortalCV..."

$SQLCMD -S "$SERVER" -U "$USER" -P "$PASSWORD" -No -Q "
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'PortalCV')
BEGIN
    CREATE DATABASE [PortalCV];
    PRINT 'Base de datos PortalCV creada.';
END
ELSE
BEGIN
    PRINT 'Base de datos PortalCV ya existe, continuando...';
END
"

if [ $? -ne 0 ]; then
  echo "[ERROR] No se pudo crear la base de datos. Abortando."
  exit 1
fi

# ── PASO 2: Ejecutar schema ──────────────────────────────────────────────────
echo "[2/3] Ejecutando 01_CreateSchema.sql (tablas, triggers, vistas, indices)..."

$SQLCMD -S "$SERVER" -U "$USER" -P "$PASSWORD" -No -i /scripts/01_CreateSchema.sql

if [ $? -ne 0 ]; then
  echo "[ERROR] Fallo en 01_CreateSchema.sql. Abortando."
  exit 1
fi

echo "[OK] Schema creado correctamente."

# ── PASO 3: Insertar datos de prueba ────────────────────────────────────────
echo "[3/3] Ejecutando 02_InsertTestData.sql (datos de prueba)..."

$SQLCMD -S "$SERVER" -U "$USER" -P "$PASSWORD" -No -i /scripts/02_InsertTestData.sql

if [ $? -ne 0 ]; then
  echo "[ERROR] Fallo en 02_InsertTestData.sql. Abortando."
  exit 1
fi

echo "[OK] Datos de prueba insertados correctamente."
echo "========================================================"
echo " Inicializacion completada exitosamente."
echo "========================================================"
