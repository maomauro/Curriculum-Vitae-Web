# Guía de Buenas Prácticas de Git

Ramas, commits y flujo de trabajo para el proyecto. Alineada con la estrategia actual de integración `feature -> develop -> main` y las validaciones de CI activas en GitHub Actions.

---

## 1. Estrategia de Ramas

### 1.1. Ramas permanentes

Existen durante toda la vida del proyecto. **No se eliminarán nunca.**

| Rama | Propósito | Protección |
|------|-----------|-----------|
| `main` | Código desplegado en producción. Solo se actualiza por PR desde `develop`. | Push directo bloqueado |
| `develop` | Rama de integración. Recibe el trabajo terminado de las ramas de trabajo. | Push directo bloqueado |

### 1.2. Ramas de trabajo (largo plazo)

En lugar de crear una rama por historia técnica, se mantienen **cuatro ramas de trabajo** de larga duración, una por área. Cada área acumula commits con mensajes semánticos que identifican la historia (`feat(hs09): api listado cvs`).

| Rama | Área | Qué incluye |
|------|------|-------------|
| `feat/frontend` | Frontend Angular | Layouts, AdminLTE, páginas, componentes, services, environments |
| `feat/backend` | Backend .NET | Endpoints, CRUDs, middleware, servicios de aplicación |
| `feat/database` | Base de datos | Scripts SQL Server, migraciones, datos de prueba, scripts Azure SQL |
| `feat/infra` | Infraestructura | Docker, GitHub Actions, configuración Azure |
| `feat/docs` | Documentación | Cambios en `/docs`, `README.md`, `database/README.md` |

**Ciclo de vida de una rama de trabajo:**

```
develop
  └─ feat/frontend      ← commits de múltiples historias acumuladas
       │  feat(hs61): crear AdminLayoutComponent
       │  feat(hs17): landing page con buscador
       │  ...
       └─ PR → develop  (cuando hay un bloque funcional estable)
            └─ feat/frontend se crea nuevamente desde develop actualizado
```

> `feat/docs` se cierra y recrea después de cada bloque de documentación.
> `feat/frontend` y `feat/backend` se mantienen abiertas más tiempo y se mergean periódicamente.

### 1.3. Ramas de emergencia (corto plazo)

Solo para situaciones especiales. Se eliminan tras el merge.

| Rama | Origen | Destino | Cuándo usarla |
|------|--------|---------|---------------|
| `hotfix/*` | `main` | `main` + `develop` | Bug crítico en producción que no puede esperar el ciclo normal |
| `bugfix/*` | `develop` | `develop` | Bug en develop que bloquea a otros |

---

## 2. Flujo de Trabajo Diario

```bash
# 1. Actualizar la rama de trabajo con los últimos cambios de develop
git checkout feat/frontend
git fetch origin
git rebase origin/develop   # historia más limpia que merge

# 2. Trabajar y hacer commits atómicos
git add src/app/layout/containers/admin-layout.component.ts
git commit -m "feat(hs61): crear AdminLayoutComponent con shell AdminLTE"

git add src/app/layout/components/sidebar/sidebar.component.ts
git commit -m "feat(hs61): implementar SidebarComponent con navegacion"

# 3. Subir la rama al remoto
git push origin feat/frontend

# 4. Cuando el bloque es estable → crear PR en GitHub (feat/frontend → develop)

# 5. Tras el merge del PR, actualizar develop local
git checkout develop
git pull origin develop
```

### Estado de ramas (referencia estable)

El estado puntual de PRs y ramas cambia cada semana. Para evitar desactualización, esta guía mantiene solo la regla permanente:

- Ramas auxiliares (`feat/*`, `bugfix/*`, `hotfix/*`) integran en `develop`.
- Promoción a producción solo por PR `develop -> main`.

---

## 3. Commits — Convención Semántica

```
<tipo>(<ámbito>): <descripción breve>

<cuerpo opcional — qué y por qué, no cómo>
```

**Tipos disponibles:**

| Tipo | Cuándo usarlo | Ejemplo |
|------|--------------|---------|
| `feat` | Nueva funcionalidad | `feat(hs09): api listado cvs paginado` |
| `fix` | Corrección de error | `fix(auth): corregir token expirado no redirige` |
| `docs` | Documentación | `docs: actualizar Despliegue.md con output_location` |
| `chore` | Config, deps, herramientas | `chore: actualizar admin-lte a 4.0.1` |
| `refactor` | Código sin cambio de comportamiento | `refactor(api-service): extraer baseUrl a environment` |
| `test` | Tests | `test(auth): añadir test login incorrecto` |
| `ci` | Pipeline CI/CD | `ci: agregar job package-and-deploy a main` |
| `style` | Formato, espacios (no lógica) | `style: aplicar prettier` |
| `perf` | Mejora de rendimiento | `perf(cache): añadir IMemoryCache en CvController` |

**Reglas:**
- Verbo en **imperativo**: "crear", "corregir", "añadir" — no "creado", "correcciones"
- Primera línea **< 72 caracteres**
- El ámbito (`hs09`, `auth`, `docker`) es opcional pero útil para rastrear historias del backlog
- **Nunca** reescribir commits ya subidos a origin (no `amend`, no `rebase` de commits públicos)

---

## 4. Pull Requests

### Cuándo crear un PR

- Cuando la rama de trabajo tiene un **bloque funcional estable** (no necesariamente completo)
- Antes de que la rama diverja demasiado de `develop` (evitar conflictos grandes)
- Siempre que se quiera llevar código a `develop` o `main`

### Checklist antes de abrir el PR

```
[ ] Los tests pasan localmente (dotnet test / ng test)
[ ] El CI pasa en la rama (verificar en GitHub Actions)
[ ] No hay archivos de configuración con credenciales reales
[ ] Los commits tienen mensajes semánticos
[ ] Se actualizó documentación si aplica
```

### Implementación "modo free" (GitHub + SonarCloud)

Este proyecto puede trabajar en modo gratuito manteniendo calidad de PR con GitHub Actions y usando SonarCloud como referencia principal en `main`.

#### Checklist de configuración

```
[ ] Protección de ramas en `develop` y `main`
[ ] PR obligatorio para merge (sin push directo)
[ ] Al menos 1 aprobación para merge
[ ] Status checks obligatorios en ramas protegidas (`Backend (.NET 10)`, `Frontend (Angular 20)`, `SonarCloud (quality gate)`)
[ ] SonarCloud configurado con `SONAR_TOKEN`, `SONAR_ORGANIZATION`, `SONAR_PROJECT_KEY`
[ ] Ramas de trabajo activas (`feat/*`) siempre con destino a `develop`
```

#### Paso a paso (operativo)

1. **Configurar protección de ramas (GitHub)**
   - Ir a `Settings > Branches > Add branch protection rule`.
   - Crear regla para `develop` y otra para `main`.
   - Activar: `Require a pull request before merging` y `Require status checks to pass before merging`.
   - Seleccionar checks obligatorios del flujo actual: `Backend (.NET 10)`, `Frontend (Angular 20)` y `SonarCloud (quality gate)`.

2. **Trabajar con flujo de ramas**
   - Crear/usar rama de trabajo desde `develop` (`feat/frontend`, `feat/backend`, etc.).
   - Abrir PR siempre hacia `develop`.
   - Cuando `develop` esté estable, abrir PR `develop -> main`.

3. **Usar CI como gate principal en ramas auxiliares**
   - En ramas `feat/*`, validar build/tests con GitHub Actions.
   - Corregir fallos de CI antes de pedir aprobación.

4. **Entender el alcance de SonarCloud en plan gratis**
   - El plan actual puede mostrar análisis completo principalmente en `main`.
   - Es normal que ramas auxiliares no aparezcan con análisis completo en SonarCloud.
   - Mantener SonarCloud en CI para calidad general y revisar resultados en rama principal.

5. **Rutina recomendada por PR**
   - Push a `feat/*` -> revisar `Actions`.
   - Si CI verde, solicitar review.
   - Merge a `develop`.
   - Repetir y luego promover `develop -> main`.
### Plantillas disponibles

| Plantilla | Cuándo usarla |
|-----------|--------------|
| `.github/PULL_REQUEST_TEMPLATE/standard.md` | Cambios de código con impacto medio/alto (`feat`, `fix`, `refactor`) |
| `.github/PULL_REQUEST_TEMPLATE/hotfix-short.md` | Cambios rápidos y de bajo riesgo (`docs`, `chore`, `hotfix`) |

---

## 5. Resolución de Conflictos

### Prevención

Actualiza la rama de trabajo con develop frecuentemente:

```bash
git fetch origin
git rebase origin/develop   # historia más lineal que merge
# si hay conflictos: resolver → git add . → git rebase --continue
```

### Proceso de resolución

1. `git status` → identificar archivos en conflicto
2. Abrir cada archivo y resolver los marcadores:
   ```
   <<<<<<< HEAD (tus cambios)
   ...
   =======
   ... (cambios de la otra rama)
   >>>>>>> nombre-rama
   ```
3. Borrar los marcadores y dejar el código correcto
4. `git add <archivo>` → marcar como resuelto
5. `git rebase --continue` o `git commit` según el caso

---

## 6. Comandos de Referencia

### Ramas

```bash
git branch -a                              # listar todas las ramas (local + remoto)
git checkout -b feat/frontend              # crear y cambiar a nueva rama
git branch -d feat/docs                    # eliminar rama local (solo si merged)
git push origin --delete feat/docs         # eliminar rama en remoto
git branch --merged develop                # ver qué ramas ya están merged en develop
```

### Sincronización

```bash
git fetch origin                           # descargar cambios sin aplicar
git pull origin develop                    # actualizar develop local
git rebase origin/develop                  # reaplicar mis commits sobre develop actualizado
git push origin feat/frontend              # subir mis commits al remoto
git push origin feat/frontend --force-with-lease  # push tras rebase (seguro)
```

### Inspección

```bash
git log --oneline --graph --all            # grafo completo de todas las ramas
git log origin/develop..feat/frontend      # commits de mi rama que no están en develop
git diff origin/develop                    # diferencias respecto a develop
git status                                 # estado del working tree
```

### Correcciones (solo commits locales — no publicados)

```bash
git commit --amend -m "nuevo mensaje"      # corregir mensaje del último commit
git reset --soft HEAD~1                    # deshacer último commit, mantener cambios staged
git restore <archivo>                      # descartar cambios no staged de un archivo
```

---

## 7. Resumen: Qué hacer y qué no hacer

| ✅ Hacer | ❌ No hacer |
|---------|-----------|
| Commits pequeños y atómicos | Un commit gigante con todo el día |
| Mensajes semánticos con ámbito | `git commit -m "cambios"` |
| Actualizar la rama con develop antes de trabajar | Dejarla divergir semanas |
| PR cuando hay un bloque estable | Acumular work-in-progress interminablemente |
| Eliminar ramas ya mergeadas | Dejar ramas fantasma en el remoto |
| `--force-with-lease` si necesitas re-push tras rebase | `--force` que puede borrar trabajo de otros |
| Crear rama de trabajo desde develop actualizado | Crear rama desde una feature antigua |

---

## Referencias del proyecto

| Documento | Relación con esta guía |
|-----------|------------------------|
| [Checklist-Produccion.md](../devops/Checklist-Produccion.md) | Validaciones mínimas previas a salida y operación |
| [Integracion-SonarCloud.md](../produccion/Integracion-SonarCloud.md) | Configuración SonarCloud, secretos/variables y alcance en plan free |

---

*Esta guía aplica al desarrollo del Portal de Currículum Vitae.*