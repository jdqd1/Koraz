# T038 — Rendimiento tras la ampliación autorizada

**FAIL LOCAL.** L01 y L03 pasan en los ámbitos medidos; L02 sigue fuera de los límites originales. T038 no está aceptada. No se inició T039 ni se acepta Hito S.

Solicitud: «continua con t038» y continuación «autorizo», 07/10/2026, America/Caracas. Base: `11737fd84562ee5a65e9ef124442b82f9aa16785`. Predecesor obligatorio T035 PASS local; T037 PASS local también inspeccionado. Autorización: `authorization.json` y `AMPLIACION-PROPUESTA.md`. Cierre anterior conservado en `initial-README.md` e `initial-result.json`.

## Aceptación

| Criterio | Resultado vigente | Evidencia |
|---|---|---|
| L01: 30 unidades, 200 objetivos, 1600 ítems, 20 corridas | PASS local. Orden alternado: CPU máxima 78 ms, mediana de pared 17,29 ms; crecimiento 2,32× al duplicar y 5,55× al cuadruplicar. | `validator-balanced.json` |
| L02: 20 usuarios, 300 segundos | FAIL. p95 estado 1985,32 ms frente a <500; respuesta 4889,25 ms frente a <1000. | `authorized-final-load.json` |
| Consistencia y error técnico de L02 | PASS. 1724 solicitudes, 417 respuestas nuevas, 56 replays idénticos, cero errores técnicos y cero inconsistencias. | `authorized-final-load.json` |
| L03: manifiestos HTTP | PASS. Creación 664 bytes, respuesta máxima 70795, estado máximo 69411. Límite 102400. Ruta pública medida en la fase anterior: 17712 bytes; proyección conservada. | `payload-summary.json` |
| L03: formularios bajo demanda | PASS del componente real aislado: 1600 tarjetas, cero formularios iniciales, máximo uno abierto. | `component-results.json` |

La medición ordenada anterior al ensayo tuvo crecimiento 6,90×/9,68× y CPU máxima 125 ms; se conserva en `authorized-final-validator.json`. Para separar orden y calentamiento, se repitieron veinte mediciones por escala con cinco calentamientos previos y orden rotatorio, sin descartar muestras. La comparación alternada no muestra crecimiento cuadrático en estas escalas; no demuestra complejidad asintótica. Todas las mediciones de CPU de la fixture completa quedaron por debajo de dos segundos.

La ventana de admisión dura 300 segundos; se terminan las operaciones ya iniciadas. Total: 307045,11 ms, incluidos 7,05 segundos de drenaje. Se incluyen todas las observaciones. Es carga cerrada por alumno con pausa máxima de cinco segundos entre actividades; no mide una tasa fija ni alumnos reales. Se mantuvieron fixture, usuarios, duración y umbrales.

| p95 | Antes de la ampliación | Después | Reducción observada |
|---|---:|---:|---:|
| Estado | 12540,79 ms | 1985,32 ms | 84,17 % |
| Respuesta | 30522,26 ms | 4889,25 ms | 83,98 % |

Misma fixture y metodología, con variabilidad del equipo: la comparación no demuestra que toda la diferencia sea causal. Ambas corridas fallan L02. No se atribuye todo el fallo a hardware o memoria.

## Implementación

- Proveedor: upsert ordenado por lote de objetivos modificados y una sola lectura de definición privada por creación, respuesta y finalización HTTP, comprobada por traza SQL.
- Evidencia: índices de objetivos, explicaciones, umbrales y casos; cada hecho recalcula el objetivo modificado y mantiene timestamps históricos.
- Selección: índices locales de actividades, respuestas, objetivos y unidades; diagnóstico reutiliza grafo y orden editorial.
- Contexto: snapshots parseados una vez, hechos reutilizados antes de mutarlos y agenda anotada sobre el mismo replay. Las mutaciones leen hechos frescos. Matrícula, bindings, catálogo y locks se comprueban en cada transacción. No se guarda estado de alumno entre peticiones.
- Editor: campos de una sola tarjeta montados bajo demanda, borrador en el padre y foco exacto. Sus cuatro archivos web mantienen los hashes de la fase anterior.

La comparación diferencial coteja 72 historiales completos con copias anteriores verificadas por SHA-256: orden, deduplicación, asistencia, errores, retención, ramas y repasos. Sus fixtures de 200 objetivos tienen 1814 actividades; no sustituyen las 1600 de L01/L02. Dos regresiones nuevas comprueban historia de objetivos no afectados y revocación entre lectura y mutación con definición reutilizada. Se conservan score, reglas, contratos y migraciones.

## Verificación

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Siete suites API afectadas, seriales | 146 PASS, 29 omisiones heredadas | `authorized-regression-closure.txt` |
| Seguridad con PostgreSQL restringido | 30 PASS, 7 omitidos; 22 casos adicionales | `authorized-security-postgres.txt` |
| Unión API sin duplicados | 168 PASS, 7 omitidos, 175 distintos | Logs anteriores |
| Diferencial y referencias | 72 PASS; hashes coinciden con baseline | `differential.json`, `reference-integrity.json` |
| Tipos API del árbol final y ESLint afectado | exit 0 | `authorized-typecheck-final-tree.txt`, `authorized-lint-final.txt` |
| Build contracts, build/tipos/lint web, editor | Evidencia previa conservada: exit 0 y 98 casos editor distintos PASS; fuentes web intactas durante la ampliación | `initial-result.json` |
| React real aislado, 1440×900 y 390×844 | PASS: ocho tipos, teclado, foco, borrador y persistencia HTTP/PostgreSQL; axe sin serious/critical en ese componente | `component-results.json` |
| Preservación | 751 archivos baseline, 742 intactos, nueve modificaciones autorizadas y un archivo nuevo de producto | `preservation.json`, `source-hashes.json` |
| Limpieza | Diez bases exactas ausentes, sin conexiones abiertas; clúster detenido y puertos 31035/41035/55435 libres | `database-cleanup-verification.json`, `services-cleanup.json` |
| Diff | exit 0 | `authorized-diff-check.txt` |

La primera regresión de esta continuación tuvo un timeout de 5000 ms en rutas (`authorized-api-regression.txt`). Recheck serial y corrida final completa pasaron sin aumentar timeouts. Se conservan el error inicial de formato de módulo del diferencial y el del verificador de limpieza, que confundía el recibo de puertos con uno de base de datos; los verificadores corregidos se repitieron. No se descartaron resultados.

## Entorno y límites

Windows 10.0.26300, Intel Core i3-1305U, seis CPU lógicas, 8267882496 bytes RAM, Node 24.19.0 (`authorized-final-runtime.json`). `authorized-resources-during-load.json` es una sola observación, no una serie ni prueba causal. No se instalaron ni actualizaron dependencias.

Fastify, proveedores y PostgreSQL reales, ocho conexiones del pool, HTTP loopback. Identidad, reloj y contenido sintéticos del harness T035. Reloj de negocio 04/10/2026; duración con reloj monotónico. Fixture: 140 objetivos requeridos CORE, 60 opcionales SUPPORTING, diagnóstico, gates, checkpoints, reservas y prerrequisitos acíclicos. SHA-256 completo: `2eca6fd7f8d30713253877b10bb311f68d6cec1ca36587cf1e5d6a022f16d372`.

El arranque de Next fue rechazado automáticamente con «blocked by policy». No se acredita navegación Next, SSR, BFF, shell completo ni persistencia tras recarga autenticada. El componente aislado usa fuentes reales conservadas y no equivale a verificar toda la UI. Tampoco se acredita producción, staging, Hito S, piloto clínico/editorial ni certificación de accesibilidad. No se creó commit ni despliegue.

## Reproducción y pendiente

Usar solo el clúster desechable de `../M01/cluster.json`, verificando rutas y puerto. Desde la raíz, con Node 24 existente:

```powershell
$env:NODE_ENV='test'
$env:KORAZ_GUIDED_V2_TEST_SERVER='true'
$env:KORAZ_TEST_DATABASE='true'
$env:KORAZ_GUIDED_V2_TEST_DATABASE_URL='postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test'
$env:T038_RUN_TAG='recheck-t038-2' # elegir un tag nuevo
node --import ./apps/api/node_modules/tsx/dist/loader.mjs apps/api/test/performance/guided-v2-load.mjs
```

Devuelve 1 si L02 falla. `--smoke` nunca acredita L02. `--profile-only --operation-profile` comprueba lecturas por operación. `validator-balanced.mjs` mide sin PostgreSQL y comprueba el hash contra la carga. `write-result.mjs` genera el cierre vigente.

`AMPLIACION-CACHE-PROPUESTA.md` queda pendiente: definiciones publicadas inmutables e índices entre peticiones, con límites, expiración, aislamiento y comprobaciones frescas de acceso. No está implementada. La autorización anterior cubría reutilización dentro de una sola operación. Antes de aceptar T038 debe cumplirse L02 en un host autorizado; si el equipo limita la medición, registrar NO VERIFICADO y repetir en entorno comparable, conservando umbrales.
