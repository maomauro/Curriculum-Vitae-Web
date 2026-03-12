
---

### **Guía de Buenas Prácticas de Git: Ramas, Commits y Flujo de Trabajo**

#### **Objetivo**
Establecer un estándar claro y eficiente para el uso de Git en equipos de desarrollo, garantizando un historial limpio, una colaboración fluida y una integración continua de calidad.

---

### **1. Estrategia de Ramas (Branching Strategy)**

La forma en que organizas tus ramas es la base de un buen flujo de trabajo. La estrategia más común y recomendada es **Git Flow** (o una versión simplificada del mismo).

#### **1.1. Clasificación de Ramas Principales (Eternas)**

Estas ramas existen durante toda la vida del proyecto.

*   **`main` (o `master`)**:
    *   **Propósito**: Contiene el código listo para producción. Es la imagen fiel de lo que está desplegado y funcionando para los usuarios.
    *   **Regla de Oro**: Está estrictamente prohibido hacer `commit` directo en `main`. Solo se actualiza mediante *Pull Requests (PRs) / Merge Requests (MRs)* desde `develop` (o `hotfix`). Cada `merge` a `main` debería idealmente generar una nueva versión (tag).

*   **`develop`**:
    *   **Propósito**: Es la rama de integración. Contiene la última versión de desarrollo con todas las nuevas funcionalidades que están siendo probadas y validadas para la próxima versión.
    *   **Regla de Oro**: Tampoco se hacen `commits` directos aquí. Nace de `main` y recibe las funcionalidades terminadas mediante PRs desde las ramas de apoyo.

#### **1.2. Clasificación de Ramas de Apoyo (Temporales)**

Estas ramas tienen una vida limitada y se crean para un propósito específico. Una vez cumplido su objetivo, se eliminan.

*   **`feature/*` (o `feat/*`)**:
    *   **Propósito**: Desarrollar una nueva funcionalidad específica.
    *   **¿De dónde nace?**: Siempre de la rama `develop` más actualizada.
    *   **¿Dónde se integra?**: De vuelta a `develop` cuando la funcionalidad está **completa y testeada**. Se recomienda usar `--no-ff` (no fast-forward) para preservar la historia de la rama.

*   **`bugfix/*`**:
    *   **Propósito**: Corregir un error encontrado durante el desarrollo en `develop` y que no es crítico para producción.
    *   **¿De dónde nace?**: De `develop`.
    *   **¿Dónde se integra?**: De vuelta a `develop`.

*   **`hotfix/*`**:
    *   **Propósito**: Corregir un error crítico en producción (en `main`) de forma urgente.
    *   **¿De dónde nace?**: Directamente de la rama `main`.
    *   **¿Dónde se integra?**: Se mergea a `main` (para desplegar la solución) Y TAMBIÉN a `develop` (para que la corrección esté presente en el próximo ciclo de desarrollo). Es una de las pocas ramas que se mergea a dos ramas principales.

*   **`release/*`** (Opcional, para proyectos más formales):
    *   **Propósito**: Preparar una nueva versión para producción. Aquí se hacen los últimos retoques, se corrige la documentación, se actualiza la versión, etc. Una vez estable, se mergea a `main` y a `develop`.

---

### **2. Buenas Prácticas para Commits**

Un buen commit no solo guarda el código, sino que cuenta la historia del proyecto.

#### **2.1. ¿Cuándo hacer un commit?**

*   **Cambios Atómicos**: Cada commit debe representar un cambio lógico único y completo. Si estás arreglando un bug y refactorizando una función, haz dos commits separados.
*   **Frecuencia**: Es mejor hacer commits pequeños y frecuentes que uno gigante al final del día. Facilita la revisión y el revertir cambios si algo sale mal.

#### **2.2. ¿Cómo redactar un buen mensaje de commit?**

Sigue la **Convención de Commits Semánticos (Conventional Commits)**. Esto permite generar changelogs automáticos y entender el propósito del cambio de un vistazo.

**Estructura del mensaje:**
```
<tipo>(<ámbito opcional>): <descripción breve>

<cuerpo opcional, más detallado>

<pie opcional, ej: "Fixes: #123">
```

**Clasificación por tipo:**

| Tipo | Descripción | Ejemplo |
| :--- | :--- | :--- |
| **`feat`** | Nueva funcionalidad para el usuario. | `feat(auth): añadir botón de "Iniciar con Google"` |
| **`fix`** | Corrección de un error. | `fix(api): corregir error 500 al obtener usuario` |
| **`docs`** | Cambios en la documentación. | `docs(readme): actualizar instrucciones de instalación` |
| **`style`** | Cambios de formato, espacios, comas, etc. No afectan el código. | `style: aplicar formateo automático de prettier` |
| **`refactor`** | Cambio en el código que no corrige un error ni añade funcionalidad. | `refactor(utils): simplificar función de validación de email` |
| **`perf`** | Mejora de rendimiento. | `perf(db): optimizar consulta de listado de productos` |
| **`test`** | Añadir o corregir tests. | `test(cart): añadir tests para el cálculo del total` |
| **`chore`** | Cambios en herramientas, configuración, librerías, etc. | `chore(deps): actualizar dependencia de lodash a 4.17.21` |
| **`ci`** | Cambios en la configuración de integración continua. | `ci: actualizar versión de Node en el pipeline de GitHub` |

**Reglas de Oro:**
*   **Verbo en imperativo**: "Añadir", "Corregir", no "Añadido" ni "Correcciones".
*   **Primera línea < 50 caracteres**: Debe ser un resumen conciso.
*   **Cuerpo explicativo**: Si el cambio lo requiere, explica el **qué** y el **por qué**, no el cómo (el cómo ya lo muestra el código).

---

### **3. Resolución de Conflictos**

Los conflictos ocurren cuando dos ramas modifican la misma línea de un archivo o cuando una rama elimina un archivo que otra modificó. No hay que temerles, sino gestionarlos con calma.

#### **3.1. Prevención**
*   **Sincronización Frecuente**: Actualiza tu rama de características (`feature/x`) con los cambios de `develop` a menudo (`git merge develop` o `git rebase develop`). Así los conflictos son más pequeños y manejables.
*   **Comunicación en Equipo**: Si sabes que vas a trabajar en un módulo que un compañero está modificando, coordinen.

#### **3.2. Proceso de Resolución (con Merge)**

1.  **Identificar**: Al hacer `git merge` (o un PR), Git te avisará del conflicto y marcará los archivos en conflicto.
2.  **Inspeccionar**: Usa `git status` para ver qué archivos están en conflicto (usualmente listados como `both modified`).
3.  **Resolver**: Abre los archivos conflictivos. Busca los marcadores de conflicto de Git:
    ```
    <<<<<<< HEAD (tus cambios locales)
    ... tu código ...
    =======
    ... el código de la rama que estás mergeando ...
    >>>>>>> nombre-de-la-rama
    ```
    *   **Elige**: Decide qué código conservar. Puede ser el tuyo, el de la otra rama, o una mezcla de ambos. **¡Borra los marcadores `<`, `=`, `>`!**
4.  **Marcar como resuelto**: Una vez editado el archivo, guárdalo y añádelo al área de staging: `git add <archivo>`.
5.  **Finalizar**: Una vez resueltos todos los conflictos y añadidos los archivos, ejecuta `git commit` (Git generará un mensaje por defecto que puedes modificar).

#### **3.3. Herramientas Útiles**
*   **`git mergetool`**: Abre una herramienta visual configurada (como Meld, KDiff3, o el editor de código como VSCode) para facilitar la resolución.

---

### **4. Comandos Clave de Git**

Un compendio de los comandos esenciales para el día a día.

#### **4.1. Configuración Inicial**
*   `git config --global user.name "Tu Nombre"`
*   `git config --global user.email "tu@email.com"`
*   `git config --global core.editor "code --wait"` (Ejemplo para usar VSCode).

#### **4.2. Básicos Diarios**
*   `git init`: Inicializa un repositorio.
*   `git clone <url>`: Clona un repositorio remoto.
*   `git status`: Muestra el estado de los archivos.
*   `git add <archivo>`: Añade archivos al staging area.
*   `git commit -m "mensaje"`: Crea un commit con los archivos del staging.
*   `git log --oneline --graph`: Muestra el historial de forma compacta y gráfica.
*   `git push origin <rama>`: Sube tus commits locales al repositorio remoto.
*   `git pull origin <rama>`: Descarga y fusiona los cambios del remoto a tu local (equivale a `git fetch` + `git merge`).

#### **4.3. Ramas y Fusión**
*   `git branch`: Lista las ramas locales.
*   `git branch <nombre-rama>`: Crea una nueva rama.
*   `git checkout <nombre-rama>`: Cambia a otra rama.
*   `git checkout -b <nombre-rama>`: Crea y cambia a una nueva rama (el más usado).
*   `git merge <nombre-rama>`: Fusiona la rama especificada a la rama actual.
*   `git merge --no-ff <nombre-rama>`: Fuerza un commit de merge aunque se pueda hacer fast-forward (recomendado para `feature/*`).
*   `git branch -d <nombre-rama>`: Elimina una rama (solo si ya fue fusionada).
*   `git branch -D <nombre-rama>`: Forza la eliminación de una rama (incluso si no se ha fusionado).

#### **4.4. Para "Arreglar" el Desastre (¡Con Cuidado!)**
*   `git restore <archivo>`: Descarta los cambios en un archivo sin staging (¡peligro!).
*   `git restore --staged <archivo>`: Saca un archivo del staging area.
*   `git commit --amend -m "Nuevo mensaje"`: Corrige el mensaje del último commit o añade archivos olvidados (solo si no lo has subido, ¡nunca modifiques commits públicos!).
*   `git reset --soft HEAD~1`: Deshace el último commit, pero deja los cambios en staging.
*   `git reset --mixed HEAD~1`: (Por defecto) Deshace el último commit y staging, deja los cambios sin trackear.
*   `git reset --hard HEAD~1`: Deshace el último commit **Y TODOS LOS CAMBIOS** (¡muy peligroso!).
*   `git rebase <rama>`: Reaplica los commits de la rama actual sobre la punta de otra rama (para una historia más lineal, pero requiere más cuidado que `merge`).

#### **4.5. Remotos e Inspección**
*   `git fetch origin`: Descarga los cambios del remoto sin fusionarlos.
*   `git remote -v`: Muestra las URLs de los repositorios remotos configurados.
*   `git diff`: Muestra las diferencias en el código.
*   `git blame <archivo>`: Muestra quién cambió qué y en qué commit (útil para saber el contexto de una línea).

---

### **Flujo de Trabajo Típico (Día a Día)**

1.  **Actualizar `develop` local**:
    ```bash
    git checkout develop
    git pull origin develop
    ```

2.  **Crear una nueva rama de funcionalidad**:
    ```bash
    git checkout -b feature/nueva-ventana-modal
    ```

3.  **Trabajar y hacer commits atómicos**:
    ```bash
    git add src/components/Modal.jsx
    git commit -m "feat(modal): crear estructura básica del componente"
    # ... más trabajo ...
    git add src/styles/modal.css
    git commit -m "feat(modal): añadir estilos base"
    ```

4.  **(Opcional pero recomendado) Sincronizarse con `develop` para evitar conflictos grandes**:
    ```bash
    git fetch origin develop
    git rebase origin/develop
    # Resolver conflictos si los hay, y luego git add . y git rebase --continue
    ```

5.  **Subir la rama al remoto para compartir o crear un PR**:
    ```bash
    git push origin feature/nueva-ventana-modal
    ```

6.  **En la plataforma (GitHub/GitLab), crear un Pull Request (PR) hacia `develop`**.

7.  **Una vez aprobado el PR y mergeado, eliminar la rama local y remota**:
    ```bash
    git checkout develop
    git pull origin develop
    git branch -d feature/nueva-ventana-modal
    ```

---

### **Resumen de Buenas Prácticas**

1.  **Ramas**: `main` para producción, `develop` para integración, `feature/*` para nuevas funcionalidades, `hotfix/*` para urgencias.
2.  **Commits**: Atómicos y con mensajes semánticos (`feat:`, `fix:`, `docs:`...).
3.  **Pull Requests**: Úsalos para todo merge a ramas principales. Son el punto de control para revisión de código y discusión.
4.  **Sincronización**: Actualiza tu rama frecuentemente con `develop` para minimizar conflictos.
5.  **Historial**: Prefiere `merge --no-ff` para ramas de features, ya que muestra claramente que fue una funcionalidad añadida.
6.  **No reescribas historia pública**: Nunca uses `git commit --amend` o `git rebase` en commits que ya hayan sido subidos y compartidos con otros. Puede causar un caos.

¡Espero que esta guía te sea de gran ayuda para empezar a trabajar de forma más profesional y ordenada con Git!