# Checklist — salida a producción (PortalCV)

Lista orientativa antes de exponer el portal a usuarios reales. Complementa [Integracion-SonarCloud.md](../produccion/Integracion-SonarCloud.md), [Plan-Trabajo-Produccion.md](../produccion/Plan-Trabajo-Produccion.md) y [Guia-git.md](../guias/Guia-git.md).

---

## Configuración y secretos

- [ ] **Cadena SQL**: `ConnectionStrings__DefaultConnection` con `Encrypt=True` y certificados correctos en Azure SQL (no usar `TrustServerCertificate=True` en prod salvo criterio explícito).
- [ ] **JWT**: `Jwt__Key` larga y aleatoria (≥ 32 caracteres); `Jwt__Issuer` y `Jwt__Audience` alineados con el despliegue. Rotación documentada.
- [ ] **CORS**: `Cors__AllowedOrigins__0` (y más índices si aplica) con la **URL exacta** del SPA (incluye `https://`, sin barra final salvo que el navegador la envíe así). En producción la API **falla al arrancar** si no hay orígenes configurados y `AllowedOrigins` está vacío en appsettings.
- [ ] **Usuario demo** (`Auth__DemoUser`): deshabilitar o eliminar en producción si el endpoint no debe existir.
- [ ] **Variables**: ningún secreto en el repositorio; usar secretos del proveedor (Azure Key Vault, GitHub Secrets, variables de Container Apps / App Service).

---

## Base de datos

- [ ] **Base nueva (recomendado):** ejecutar `scripts/production/05_AzureSQL_CreateSchema.sql` una vez en Azure SQL (incluye esquema completo y roles base). **Local/Docker:** queda cubierto por `scripts/init-db.sh` + `scripts/manual/01_CreateSchema.sql` (y opcionalmente `02_InsertTestData.sql` si `SEED_TEST_DATA=true`).
- [ ] Revisar política de backups y retención definida por el equipo (documentar responsable, periodicidad y restauración).

---

## API (.NET)

- [ ] `ASPNETCORE_ENVIRONMENT=Production`.
- [ ] Swagger desactivado fuera de Development (comportamiento actual en `Program.cs`).
- [ ] HTTPS terminado correctamente (proxy / Container Apps); `UseHttpsRedirection` activo fuera de Development.
- [ ] Revisar `AllowedHosts` en `appsettings` si se desea restringir host headers.

---

## Frontend (Angular)

- [ ] Build de producción: `npm run build -- --configuration production`.
- [ ] El SPA llama a la API con rutas relativas `/api/...`; el hosting debe **enrutar** o hacer proxy hacia el backend según la arquitectura (Static Web Apps + API enlazada, reverse proxy, etc.).
- [ ] Probar login, CV público, contacto, alertas y panel privado contra el entorno real.

---

## Observabilidad y seguridad

- [ ] Logs (Serilog) hacia consola/sink adecuado en el entorno cloud.
- [ ] Revisar CORS y cabeceras de seguridad en el frontal (CDN / Static Web Apps).
- [ ] Rate limiting / WAF según política de la organización (opcional en fase inicial).

---

## CI/CD

- [ ] Ramas `develop` y `main` protegidas con PR obligatorio y checks requeridos (`Backend (.NET 10)`, `Frontend (Angular 20)`, `SonarCloud (quality gate)`).
- [ ] Pipeline [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) en verde antes del merge a `main`.

---

## Post-despliegue

- [ ] Smoke test en producción (lectura pública + login + una acción de escritura).
- [ ] Plan de rollback (imagen anterior del contenedor / versión anterior del SPA).
