# Smoke test de produccion (PortalCV)

Documento operativo para validar el flujo minimo end-to-end antes de declarar salida.

## Precondiciones

- Frontend y backend desplegados en produccion.
- Variables de entorno productivas cargadas en backend.
- Usuario de prueba no administrador disponible.
- Al menos 1 CV publicado para validar flujo publico.

## Matriz de pruebas

| ID | Flujo | Paso | Resultado esperado |
|---|---|---|---|
| ST-01 | Salud API | `GET /health` | 200 OK |
| ST-02 | Home publica | Abrir `/` y navegar a `/cvs` | Carga sin errores bloqueantes |
| ST-03 | Listado publico | Buscar CV por termino simple | Lista resultados o estado vacio controlado |
| ST-04 | Detalle CV | Entrar a un CV por slug | Detalle renderiza sin error 500/JS |
| ST-05 | Contacto publico | Enviar formulario contacto en CV publico | Respuesta exitosa y persistencia de contacto |
| ST-06 | Login | Iniciar sesion con publicador | Token emitido, redireccion correcta |
| ST-07 | Dashboard privado | Abrir `/dashboard` | Estadisticas cargan sin errores |
| ST-08 | Edicion CV | Modificar 1 campo en datos personales | Cambio persiste tras recargar |
| ST-09 | Alertas | Abrir `/alertas` y marcar leida | Estado de lectura persiste |
| ST-10 | Contactos privados | Abrir `/contactos` | Se visualizan contactos recibidos |
| ST-11 | Autorizacion | Acceder ruta privada sin token | Redireccion a login o 401 controlado |
| ST-12 | CORS real | Ejecutar flujo frontend completo contra API | Sin bloqueos CORS en navegador |

## Registro de evidencia (plantilla)

Completar por cada caso:

- ID:
- Fecha/hora:
- Resultado: OK / FAIL
- Evidencia: captura, log o URL de pipeline
- Observaciones:

## Criterio de aprobacion

- Todos los casos criticos ST-01 a ST-09 en OK.
- Ningun error bloqueante en consola del navegador durante flujos base.
- Si falla algun caso, registrar incidencia y repetir smoke test completo tras correccion.
