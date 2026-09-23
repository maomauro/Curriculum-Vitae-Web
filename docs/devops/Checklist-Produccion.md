# Checklist — salida a producción (PortalCV)

Lista orientativa antes de exponer el portal a usuarios reales. Complementa [Integracion-SonarCloud.md](../produccion/Integracion-SonarCloud.md), [Plan-Trabajo-Produccion.md](../produccion/Plan-Trabajo-Produccion.md) y [Guia-git.md](../guias/Guia-git.md).

> ⚠️ Los ítems marcados `[x]` reflejan el corte previo (base de datos Azure SQL,
> hosting en Azure Container Apps / Static Web Apps). Ese corte ya no está
> vigente: la base de datos es **MariaDB** (ver `database/README.md`) y el
> hosting de producción está pendiente de definir (ver `CLAUDE.md`). Revisar
> y re-verificar cada ítem contra el destino real antes del próximo despliegue.

Referencia de corte vigente para retomar trabajo:
- [Smoke-Test-Produccion.md](./Smoke-Test-Produccion.md)

---

## Configuración y secretos

- [ ] **Cadena de conexión**: `ConnectionStrings__DefaultConnection` apuntando a la instancia MariaDB de producción, con usuario/permisos dedicados (no `root`).
- [ ] **JWT**: `Jwt__Key` larga y aleatoria (≥ 32 caracteres); `Jwt__Issuer` y `Jwt__Audience` alineados con el despliegue. Rotación documentada.
- [x] **CORS**: `Cors__AllowedOrigins__0` (y más índices si aplica) con la **URL exacta** del SPA (incluye `https://`, sin barra final salvo que el navegador la envíe así). En producción la API **falla al arrancar** si no hay orígenes configurados y `AllowedOrigins` está vacío en appsettings.
- [ ] **Usuario demo** (`Auth__DemoUser`): deshabilitar o eliminar en producción si el endpoint no debe existir.
- [x] **Variables**: ningún secreto en el repositorio; usar secretos del proveedor (Azure Key Vault, GitHub Secrets, variables de entorno de Azure Container Apps).

---

## Base de datos

- [ ] **Base nueva:** ejecutar `database/01_CreateSchema.sql` una vez contra la instancia MariaDB de producción (incluye esquema completo, índices, triggers y roles base) — ver `database/README.md`.
- [ ] Revisar política de backups y retención definida por el equipo (documentar responsable, periodicidad y restauración).

---

## API (.NET)

- [x] `ASPNETCORE_ENVIRONMENT=Production`.
- [x] Swagger desactivado fuera de Development (comportamiento actual en `Program.cs`).
- [x] HTTPS terminado correctamente (proxy / Container Apps); `UseHttpsRedirection` activo fuera de Development.
- [ ] Revisar `AllowedHosts` en `appsettings` si se desea restringir host headers.

---

## Frontend (Angular)

- [x] Build de producción: `npm run build -- --configuration production`.
- [x] El frontend publicado en SWA consume API productiva en ACA (configuración de runtime para host `*.azurestaticapps.net`).
- [ ] Probar login, CV público, contacto, alertas y panel privado contra el entorno real.

---

## Observabilidad y seguridad

- [ ] Logs (Serilog) hacia consola/sink adecuado en el entorno cloud.
- [ ] Revisar CORS y cabeceras de seguridad en el frontal (CDN / Static Web Apps).
- [ ] Rate limiting / WAF según política de la organización (opcional en fase inicial).

---

## CI/CD

- [x] Ramas `develop` y `main` protegidas con PR obligatorio y checks requeridos (`Backend (.NET 10)`, `Frontend (Angular 20)`, `SonarCloud (quality gate)`).
- [x] Pipeline [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) en verde antes del merge a `main`.

---

## Post-despliegue

- [ ] Smoke test en producción (lectura pública + login + una acción de escritura).
- [ ] Plan de rollback (imagen anterior del contenedor / versión anterior del SPA).
