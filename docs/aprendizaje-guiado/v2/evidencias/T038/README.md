# T038 — Cierre de la optimización autorizada

**PASS LOCAL.** L01 PASS, L02 PASS y L03 PASS en los ámbitos medidos. Regresión: 166 PASS, 0 FAIL y 19 omitidas. T038 cumple sus criterios locales. No se inició T039.

Solicitud directa: «continua con t038», autorizaciones «autorizo» y continuación «hazlo». El handoff define el alcance técnico; las instrucciones y autorizaciones del usuario constan en authorization.json, cache-authorization.json y hotpath-authorization.json. Base: `11737fd84562ee5a65e9ef124442b82f9aa16785`; predecesor requerido T035 PASS local.

| Criterio | Resultado | Evidencia |
|---|---|---|
| L01: 30 unidades / 200 objetivos / 1600 actividades; 20 medidas | PASS: CPU máxima 109,00 ms (<2000); mediana de pared 24,04 ms | validator-balanced.json |
| L02: 20 usuarios / 300 segundos | PASS: estado p95 210,88 ms (<500); respuesta p95 514,19 ms (<1000) | hotpath-indexed-final-load.json |
| Consistencia y errores | 4348 solicitudes, 1057 respuestas nuevas y 120 replays; 0 errores técnicos y 0 inconsistencias | hotpath-indexed-final-load.json |
| L03: manifiestos HTTP | PASS: creación 667, respuesta máxima 72801 y estado máximo 71429 bytes; límite 102400 | payload-summary.json |
| L03: editor real aislado | PASS: 1600 tarjetas, cero formularios iniciales y máximo uno abierto | component-results.json |

La carga admite operaciones durante 300 s y drena las iniciadas: 300010,94 ms totales, 10,94 ms de drenaje. Se incluyen todas las muestras de hotpath-indexed-final-latency-samples.json y se recalculan sus p95 al generar este cierre. Es la misma fixture SHA-256 `2eca6fd7f8d30713253877b10bb311f68d6cec1ca36587cf1e5d6a022f16d372`, con idéntico recorrido, pausas de cinco segundos, protección idempotente y límites. No hay perfilador de CPU ni traza de tiempos en esta corrida de aceptación. Los smoke y diagnósticos cortos se conservan y no acreditan L02.

**Configuración medida: pool local de 20 conexiones**, frente a ocho del harness original. La ficha fija usuarios, duración, datos y límites, pero no capacidad del pool. La decisión se apoya en una espera de pool de 1183,75 ms p95 en respuestas, frente a 671,83 ms p95 en consultas, registrada en hotpath-history-diagnostic-performance-trace.json. El observador de PostgreSQL no capturó esperas de bloqueo sostenidas; sus muestras cada segundo no descartan esperas breves. La configuración es explícita y figura en pool-capacity-decision.json. No se modificó la configuración de producción.

La carga con ocho conexiones anterior a las consultas unidas sigue documentada como FAIL: estado p95 582,61 ms y respuesta 1670,66 ms (hotpath-batched-final-load.json). La primera carga con veinte conexiones, también anterior a esas consultas, falló con 599,09 y 1364,60 ms respectivamente (hotpath-pool20-final-load.json). El resultado de este cierre se limita al código, pool y hardware indicados; no acredita la configuración original de ocho conexiones ni capacidad de producción. No se atribuyen las variaciones exclusivamente a una optimización o al equipo.

La fase de consultas unidas también falló: estado p95 537,28 ms y respuesta 1285,18 ms, cero errores y cero inconsistencias (hotpath-joined-final-load.json). Se conserva íntegra junto con sus hashes y muestras; dio lugar a la posterior eliminación de recorridos repetidos del historial y consultas separadas de vencimiento.

La corrida final se realizó tras reanudar la sesión y recuperar el clúster desechable, con una base de carga nueva. resumed-environment.json documenta el chequeo independiente de disponibilidad antes de medir y la salida tardía del wrapper de arranque, cuyo probe se ejecutó cuando el clúster ya estaba detenido. Las corridas no aíslan por sí solas el efecto del entorno frente al del código.

## Cambios y evidencia

- S06 se organiza en casos anon, authenticated y runtime: conserva las 67 denegaciones SQL esperadas y todas las comprobaciones de RLS, ownership y privilegios; plazo original de 5000 ms por caso. El anterior fallo por timeout queda documentado en before-hotpath-result.json; la regresión final acredita el estado actual.
- La estructura de evidencia se reutiliza únicamente cuando la definición está profundamente congelada. Los gates reciben los objetivos de su unidad con las mismas reglas. Se reconstruyen hechos, estado y fechas del alumno en cada operación. Diferencial: 72 historiales exactos contra originales verificados por hash; la fixture diferencial grande tiene 1814 actividades y es distinta de la fixture L01/L02.
- La comparación de caché derivada se hace en PostgreSQL con JSONB y devuelve claves/booleanos, manteniendo todos los locks ordenados y el upsert de objetivos cambiados. La precisión de fechas coincide con Date del driver; una regresión incluye microsegundos y reparación de caché corrupta.
- Solo se comparten snapshots de contenido para actividades/revisiones publicadas e inmutables, máximo 64 destinos por definición. Cada llamada recibe contenedores independientes; las evaluaciones adaptativas se preparan de nuevo. No cambia la selección de objetivos ni actividades.
- La definición publicada mantiene el presupuesto por cliente de ocho versiones, 8 MiB de JSON codificado y TTL absoluto de 60 s con LRU; ese presupuesto no representa el heap completo. Las lecturas frías simultáneas comparten únicamente un cuerpo publicado con metadatos coincidentes; cada lector consulta sus propios metadatos. Borradores, reemplazos, fallos y cuerpos sobredimensionados no se reutilizan indebidamente.
- Se leen una vez por reconstrucción los pares evento/recompensa ya completos. Las nuevas recompensas y los pares incompletos siguen usando la función original, con los mismos XP, fechas y conflictos. La prueba elimina una recompensa y comprueba su reparación con el mismo evento, sin duplicarlo. Los eventos y snapshots frescos de una misma operación se reutilizan para la selección; no se guarda estado del alumno entre peticiones.
- La lectura agrupada de intentos/respuestas/eventos usa la función original de recorrido de versiones adoptadas y los mismos filtros. Convierte timestamps a Date y proyecta únicamente campos de eventos usados por el replay. La comparación detectó inicialmente que DATE se decodifica distinto de JSON; se retiró ese campo no utilizado de la proyección y se verificó la igualdad de todos los campos consumidos, incluyendo aislamiento entre usuarios. Se conserva el fallo inicial en hotpath-batched-focused.txt.
- Dentro de una petición HTTP, un lector conserva hasta 128 snapshots y 2 MiB de JSON codificado. Cada reutilización compara el JSON completo recién leído; cualquier cambio o corrupción obliga a validar de nuevo. El lector se destruye al terminar la petición, devuelve objetos congelados y no se comparte entre peticiones o alumnos. No se cachean respuestas, relojes, permisos ni estado derivado entre peticiones.
- La autorización del intento obtiene matrícula y metadatos de versión en una consulta unida, conserva las distinciones not_found/access_revoked y bloquea únicamente el intento. El contexto también obtiene metadatos de versión junto con la matrícula; el lector solo reutiliza contenido si esos metadatos frescos coinciden. La agenda usa las filas bloqueadas o devueltas por el upsert de esa misma transacción, con orden estable por objetivo. La comparación de vencimientos sigue en PostgreSQL y conserva su precisión. Estas uniones reducen viajes a la base sin guardar autorizaciones o datos del alumno entre peticiones.
- El replay construye índices locales por objetivo, intento, actividad y respuesta para sustituir búsquedas repetidas, conservando el orden y las reglas originales. No recorre todos los objetivos para logros de ruta antes de existir una evaluación final válida. El diagnóstico de contenido inmutable se calcula una vez y devuelve arrays independientes. Los vencimientos se calculan en PostgreSQL en las filas bloqueadas o devueltas por el upsert, sin una consulta adicional; la prueba de ±123 microsegundos verifica la frontera temporal. Estos índices de hechos desaparecen al terminar la operación.
- Se conservan las optimizaciones del editor y las fases anteriores. Los cuatro hashes web coinciden con la primera fase; no cambian contratos, migraciones, score ni reglas de validación.

## Verificación y límites

Siete suites API en serie: **166 PASS / 0 FAIL / 19 omitidas**, 185 casos. PostgreSQL real con runtime restringido está habilitado para T036. Las 19 omisiones son doce casos históricos que requieren el clúster dedicado T015, seis T022 que requieren su clúster dedicado y uno Next. No se presentan como PASS. Tipos API, lint afectado y git diff --check: exit 0.

L01 usa cinco calentamientos por escala y veinte medidas rotatorias sin exclusiones: crecimiento observado 2,29× al duplicar y 5,64× al cuadruplicar. Estas escalas no constituyen una prueba asintótica. Build de contracts, build/tipos/lint web y 98 pruebas editor PASS de la primera fase siguen siendo aplicables.

El componente React real se verificó aislado a 1440×900 y 390×844: ocho tipos, teclado, foco, borrador y persistencia HTTP/PostgreSQL, sin incidencias axe serious/critical. La revisión automática rechazó arrancar Next con «blocked by policy»; no se reintentó mediante otro mecanismo. Next, SSR, BFF, shell completo y recarga autenticada siguen NO VERIFICADO. Producción, staging, Hito S, Better Auth real, piloto clínico/editorial y certificación completa de accesibilidad no se acreditan aquí.

Preservación: 751 archivos baseline, 739 intactos; 12 modificaciones autorizadas y 1 archivo nuevo de producto. Los 13 hashes coinciden con los capturados antes de la carga final. Se conservan todas las mediciones previas, incluidos los fallos.

Limpieza: 28 bases desechables con recibo ausentes, ninguna base sin recibo creada desde el baseline y cero conexiones ajenas. Se preservan las 11 bases anteriores a T038 por OID/fecha de directorio. Clúster propio detenido y puertos 31035/41035/55435 libres.

Entorno: win32 10.0.26300, 13th Gen Intel(R) Core(TM) i3-1305U, 6 CPU lógicas, 8267882496 bytes RAM, Node v24.19.0. HTTP loopback y PostgreSQL reales; identidad, reloj de negocio y contenido sintéticos del harness T035. No se instalaron dependencias ni se creó commit o despliegue.

## Reproducción

Usar Node 24 existente y únicamente el clúster desechable validado en ../M01/cluster.json, puerto 55435. No usar .env ni la base normal. Desde la raíz, habilitar NODE_ENV=test, KORAZ_GUIDED_V2_TEST_SERVER=true, KORAZ_TEST_DATABASE=true y KORAZ_GUIDED_V2_TEST_DATABASE_URL=postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test; elegir un T038_RUN_TAG nuevo y ejecutar:

`pnpm.cmd --config.verify-deps-before-run=false --filter @cediah/api exec tsx test/performance/guided-v2-load.mjs --pool-size=20`

El script devuelve 1 si L02 falla. --smoke no acredita aceptación; --trace-performance y --cpu-profile son diagnósticos. validator-balanced.mjs coteja la fixture con la carga completa. write-result.mjs regenera este cierre comprobando duración, muestras, hashes, omisiones y limpieza.
