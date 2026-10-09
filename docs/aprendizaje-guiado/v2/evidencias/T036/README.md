# T036 — Permisos, secretos y concurrencia

**PASS LOCAL.** Solicitud: «continua con t036». Fecha de trabajo: 2026-10-04,
America/Caracas. Base: `11737fd84562ee5a65e9ef124442b82f9aa16785`.
Dependencias T022, T034 y T035 con `result.json` en PASS. No se inició T037.

Se añadieron pruebas a `apps/api/test/guided-v2-security.test.ts` y se creó
`apps/web/tests/e2e/guided-v2-security.spec.ts`, dentro de la ficha autorizada.
No hubo reparaciones en código productivo, cambios de permisos globales,
migraciones, instalación de dependencias, commit ni despliegue.
`preservation.json` verifica los 162 archivos previos capturados en la base.

## Matriz ejecutada

| Caso | Resultado comprobado |
|---|---|
| S01 | Alumno rechazado en 15 operaciones editoriales, incluido catálogo y sesiones de preview; creador ajeno sin lectura/edición/exportación/publicación; creador propio puede crear/leer pero no publicar; administrador puede leer. |
| S02 | Doce operaciones sobre intento/matrícula ajenos devuelven 404 sin detalles ni efectos en aprendizaje; incluye imagen, alternativa, upgrade, ayuda, heartbeat y feedback. |
| S03 | DTOs públicos, SSR, RSC `text/x-component`, DOM y BFF sin soluciones, rúbricas, coordenadas privadas, feedback ni ítems reservados antes de la autorización. Ocho actividades inspeccionadas cubren los siete tipos puntuables; study se usa como prerrequisito. La segunda etapa del caso no se entrega anticipadamente. Reveal de respuesta construida requiere texto previo. |
| S04 | Retirar acceso al tema, fuente o asset rechaza lectura, URL de imagen y replay de respuesta aceptada con `access_revoked`; conserva las filas históricas. |
| S05 | Paquetes con scripts, `file://`, capacidades desconocidas o más de 10 MiB rechazados; identidad, rol, score y status enviados por cliente no se aceptan. |
| S06 | Conexiones PostgreSQL independientes como anon/authenticated: SELECT/INSERT/UPDATE/DELETE denegados en las siete tablas v2. Runtime real sin superuser, BYPASSRLS ni propiedad de tablas; sin lectura de secretos de auth, escrituras de catálogo o modificación/borrado de respuestas. RLS y funciones privadas verificados. |
| S07 | Origen hostil y ausencia de identidad válida rechazados en API y BFF; replay después de que el adaptador deje de reconocer la sesión produce 401. |
| S08 | APIs v1 de matrícula/editor/delete rechazan IDs v2; complete-block solo proyecta el mapa, sin acreditar aprendizaje. Conversión autorizada produce un borrador incompleto idempotente y conserva la versión v1 íntegra. |
| I04 | Dos conexiones runtime observadas esperando simultáneamente locks PostgreSQL. Respuesta, complete y heartbeat duplicados: un efecto; respuestas diferentes a la misma versión: 200/409. Aplicación correcta duplicada: una respuesta, una agenda, un reward de recuperación y uno de dominio. Replay adicional no cambia contadores. |

Los conteos del harness excluyen recibos internos de mutación; los rechazos se
evalúan por ausencia de efectos en datos editoriales/aprendizaje, sin equiparar
la escritura de un recibo de error con concesión de progreso.

## Validación

| Comando / comprobación | Resultado | Evidencia |
|---|---|---|
| Build contracts | exit 0 | `contracts-build.txt` |
| Security API, ejecución serial final | 30 PASS, 7 omisiones heredadas | `api-security-final-serial.txt` |
| Ampliación S01 a catálogo y preview-sessions | 1 PASS focalizado | `api-editorial-expanded.txt` |
| Harness T035 y upgrade T034 | 5 + 10 PASS dentro de la ejecución de tres archivos | `api-final.txt` |
| Playwright desktop + móvil | 4 PASS, 0 skipped/flaky | `browser-final.txt`, `playwright.json`, `browser-artifacts/` |
| Tipos API y web | exit 0 | `typecheck-api-final.txt`, `typecheck-web-final.txt` |
| ESLint archivos de tests | exit 0 | `lint-api-final.txt`, `lint-web-final.txt` |
| Preservación y diff | PASS | `preservation.json`, `diff-check.txt`, `source-hashes.json` |
| Base de navegador exacta eliminada | 0 filas en PostgreSQL | `cleanup.json`, `browser-cleanup-verification.txt` |

Son 45 casos API distintos aprobados entre las suites y sus repeticiones
focalizadas, además de los cuatro casos de navegador. La ejecución conjunta
`api-final.txt` tuvo 44 PASS y un timeout S06 de 5s mientras también corrían tipos
y lint. Security se repitió sola: 30 PASS sin ampliar el timeout. No se presenta
aquella ejecución conjunta como exit 0. Las siete omisiones son seis pruebas
antiguas que requieren el harness T022 de puerto 55422 y su navegador de renderer
anterior. La matriz T036 sí ejecutó PostgreSQL real y el player v2 actual.

## Incidencias resueltas

Los logs iniciales conservan errores del nuevo test: nombre de columna, schema
privado inaccesible al consultar ACL desde anon, derechos del asset sintético,
valores de confianza fuera del contrato, ausencia de nodo de mapa y omisión de
un prerrequisito. Se corrigieron fixtures/assertions manteniendo los requisitos.
Una respuesta study con el mismo answer y distinta confianza puede devolver el
recibo existente sin otro efecto; el conflicto concurrente se comprueba con dos
respuestas objetivas diferentes, yes/no, a la misma versión.

La prueba antigua «conversión diferida» quedó obsoleta con T034. Ahora comprueba
ownership/CAS, incidencias que bloquean publicación, nuevo draft sin matrículas,
idempotencia y preservación exacta de la versión v1.

La configuración de evidencia tiene su propio directorio de trabajo y salida,
sin sobrescribir T035. En móvil se espera la actividad actual en el árbol
accesible antes de inspeccionar DOM, pues Next puede conservar transitoriamente
un árbol anterior oculto durante streaming. No se ocultó contenido ni se forzaron
clics. Las assertions de privacidad inspeccionan también el DOM completo.

## Repetición y límites

Node 24.19.0 y pnpm 11.19.0 existentes; Chromium de Playwright. PostgreSQL
desechable en loopback 55435, control `koraz_guided_v2_control_test`, usuario
`koraz_test`, guardia de hostname/puerto/base/usuario/marcador del harness T035.
`../M01/cluster.json` identifica el clúster utilizado, dejado detenido al cerrar.
Cada harness aplica la cadena activa con el perfil vacío aceptado en M01.

```powershell
$env:NODE_ENV='test'
$env:KORAZ_GUIDED_V2_TEST_SERVER='true'
$env:KORAZ_TEST_DATABASE='true'
$env:KORAZ_GUIDED_V2_TEST_DATABASE_URL='postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test'
pnpm --filter @cediah/api exec vitest run test/guided-v2-security.test.ts --maxWorkers=1
pnpm --filter @cediah/web exec playwright test --config ../../docs/aprendizaje-guiado/v2/evidencias/T036/playwright.config.mts
```

El navegador usa el build local vigente de T035; los cambios de esta ficha son
tests. Tras editar código productivo, reconstruir web antes de repetir navegador.
La identidad es sintética: las operaciones de aprendizaje/editor usan servicios
y persistencia reales. La lectura de roles y el mapa usan el subsistema existente
separado; los servicios de aprendizaje/editor de la matriz API usan login DB
`cediah_runtime`. No se afirma haber verificado emisión, firma o expiración real
de cookies Better Auth. Los escenarios de sesión simulan la ausencia de identidad
en su adaptador y verifican el rechazo HTTP sin efectos.

Se conservan avisos heredados de `next start`/standalone y NO_COLOR. La eliminación
se verificó aparte para la base exacta del último navegador; no se eliminaron
otras bases temporales del clúster sin procedencia registrada en esta ficha.
No quedaron conexiones de prueba ni listeners en 31035/41035/41036 al cierre.

Este PASS corresponde a S01–S08/I04 locales con fixtures sintéticos. T037,
rendimiento T038, restauración T041, revisión clínica/piloto, Hito S y producción
permanecen fuera de esta aceptación. No se inició la siguiente ficha.
