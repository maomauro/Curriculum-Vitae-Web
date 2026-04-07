# Politica de Proteccion de Ramas

## Objetivo
Evitar cambios directos en ramas principales y asegurar control de calidad mediante revision por pares y validaciones automaticas.

## Alcance
Aplica a todo el repositorio y a todos los colaboradores:
- Rama main
- Rama develop

## Politica Obligatoria
1. No se permite push directo a main ni develop.
2. Todo cambio debe entrar por Pull Request (GitHub) o Merge Request (GitLab).
3. Todo PR/MR debe tener minimo 1 aprobacion.
4. El pipeline CI debe estar en estado exitoso antes de permitir merge.
5. Se bloquea force-push y eliminacion de ramas protegidas.

## Configuracion en GitHub
1. Ir a Settings > Branches > Add branch protection rule.
2. Crear regla para main y repetir para develop.
3. Activar:
   - Require a pull request before merging.
   - Require approvals (minimo 1).
   - Dismiss stale approvals when new commits are pushed.
   - Require status checks to pass before merging.
   - Require branches to be up to date before merging.
   - Block force pushes.
   - Block deletions.
4. Recomendado: activar Include administrators.

## Configuracion en GitLab
1. Ir a Settings > Repository > Protected branches.
2. Proteger main y develop con:
   - Allowed to push: No one.
   - Allowed to merge: Maintainers (o rol definido).
3. Ir a Settings > Merge requests y activar:
   - Aprobaciones requeridas (minimo 1).
   - Pipeline must succeed.
   - Prevent approvals by author (recomendado).

## Flujo de Trabajo Esperado
1. Crear rama feature/* o bugfix/* desde develop.
2. Hacer commits en la rama de trabajo.
3. Abrir PR/MR hacia develop.
4. Esperar CI en verde.
5. Obtener aprobacion.
6. Ejecutar merge.
7. Eliminar rama temporal.

## Excepciones
Solo se permiten excepciones en incidentes criticos de produccion y deben cumplir:
1. Aprobacion explicita del lider tecnico.
2. Registro del incidente y del motivo de bypass.
3. Regularizacion posterior mediante PR/MR documentado.

## Checklist de Implementacion
- Regla creada para main.
- Regla creada para develop.
- Push directo bloqueado en ambas ramas.
- PR/MR obligatorio habilitado.
- Minimo 1 aprobacion requerida.
- CI obligatorio para merge.
- Force-push bloqueado.
- Eliminacion de ramas protegidas bloqueada.

## Evidencia de Cumplimiento
Conservar evidencia por sprint:
1. Captura de reglas de proteccion activas.
2. Ejemplo de PR/MR aprobado y mergeado.
3. Evidencia de rechazo de push directo.
4. Historial de pipelines en estado exitoso.

## Revision de la Politica
Frecuencia recomendada: mensual o al cambiar el flujo CI/CD.
Responsable: lider tecnico del proyecto.
