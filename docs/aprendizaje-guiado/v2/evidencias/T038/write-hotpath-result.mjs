import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
const directory = new URL('./', import.meta.url);
const tag = process.env.T038_CLOSURE_TAG ?? 'hotpath-indexed-final';
assert.match(tag, /^[a-z0-9-]+$/);
const read = async name => JSON.parse(await readFile(new URL(name, directory), 'utf8'));
const [load, runtime, samples, loadSources, validator, components, preservation, sources,
  cleanup, services, differential, integrity, authorization, cacheAuthorization, hotpathAuthorization, initial, previous] = await Promise.all([
  `${tag}-load.json`, `${tag}-runtime.json`, `${tag}-latency-samples.json`, `${tag}-source-hashes.json`,
  'validator-balanced.json', 'component-results.json', 'preservation.json', 'source-hashes.json',
  'database-cleanup-verification.json', 'services-cleanup.json', 'differential.json', 'reference-integrity.json',
  'authorization.json', 'cache-authorization.json', 'hotpath-authorization.json', 'initial-result.json',
  'cache-verified-load.json'].map(read));
assert.equal(load.smoke, false); assert.equal(load.seconds, 300); assert.equal(load.users, 20);
assert.ok([8,20].includes(load.poolMax)); assert.equal(runtime.poolMax, load.poolMax);
assert.equal(load.diagnostic, false);
assert.ok(!runtime.argv.some(value => /profile|diagnostic|trace/.test(value)));
assert.equal(load.fixture.sha256, previous.fixture.sha256);
assert.deepEqual([load.fixture.units, load.fixture.objectives, load.fixture.activities], [30,200,1600]);
assert.equal(hotpathAuthorization.approved, true); assert.equal(hotpathAuthorization.preserveTimeoutMs, 5000);
for (const report of [preservation, cleanup, services, differential, integrity, components]) assert.equal(report.status, 'PASS');
assert.equal(cleanup.otherConnections.length, 0); assert.equal(cleanup.remaining.length, 0);
assert.equal(cleanup.unreceiptedCurrentDatabases.length, 0);
for (const source of sources) {
  assert.equal(source.sha256.toLowerCase(), loadSources.find(row => row.path === source.path).sha256.toLowerCase());
  if (source.path.startsWith('apps/web/')) assert.equal(source.sha256, initial.productFiles.find(row => row.path === source.path).sha256);
}
let sampleCount = 0;
for (const [label, values] of Object.entries(samples)) {
  const ordered = [...values].sort((a,b) => a-b);
  assert.equal(load.latencyMs[label].count, values.length);
  assert.equal(load.latencyMs[label].p95, ordered[Math.ceil(values.length * .95)-1]);
  sampleCount += values.length;
}
assert.equal(sampleCount, load.totalRequests);
assert.ok(load.consistency.every(row => row.cycles > 0 && row.responses === row.expectedResponses
  && row.uniqueActivities === row.responses && row.correct && row.unassisted));
const regression = await readFile(new URL('hotpath-regression.txt', directory), 'utf8');
const match = regression.match(/Tests\s+(?:(\d+) failed \| )?(\d+) passed \| (\d+) skipped \((\d+)\)/);
assert.ok(match, 'Missing final regression counts');
const counts = { failed: +(match[1] ?? 0), passed: +match[2], skipped: +match[3], total: +match[4], files: 7 };
assert.equal(counts.total, 185); assert.equal(counts.skipped, 19);
const technicalErrorRate = load.failures.length / load.totalRequests;
const l01 = validator.scales.at(-1).cpu.max < 2000 ? 'PASS' : 'FAIL';
assert.equal(validator.scales.at(-1).sha256, load.fixture.sha256);
assert.equal(validator.scales.at(-1).runs.length, 20);
const l02 = load.latencyMs.state.p95 < 500 && load.latencyMs.response.p95 < 1000
  && technicalErrorRate < .01 && load.consistencyErrors.length === 0 ? 'PASS' : 'FAIL';
assert.equal(load.status, l02);
const payload = { status: 'PASS', publicPathBytes: 17712, publicPathMeasuredInPriorPhase: true,
  publicPathProjectionUnchanged: true, attemptCreateBytes: load.payloadBytes.create,
  responseBytes: load.payloadBytes.response, stateBytes: load.payloadBytes.state, thresholdBytes: 102400,
  activeOnly: true, scope: 'Actual HTTP manifests and isolated actual React component; Next/BFF/full shell not verified' };
assert.ok(Math.max(payload.publicPathBytes, ...Object.values(load.payloadBytes)) <= payload.thresholdBytes);
assert.ok(components.results.every(row => row.activities === 1600 && row.initialForms === 0 && row.maxForms === 1));
const status = l01 === 'PASS' && l02 === 'PASS' && counts.failed === 0 ? 'PASS' : 'FAIL';
const newResponses = load.consistency.reduce((sum,row) => sum+row.responses,0);
const evidenceFiles = [...new Set([...(await readdir(directory)), 'result.json'])].sort().map(file => `docs/aprendizaje-guiado/v2/evidencias/T038/${file}`);
const result = { taskId: 'T038', status, closedAt: new Date().toISOString(), timezone: 'America/Caracas',
  request: 'continua con t038; autorizo; hazlo', baseSha: initial.baseSha, predecessors: initial.predecessors,
  scope: 'LOCAL synthetic fixture; actual Fastify HTTP and disposable PostgreSQL; restricted runtime security; isolated actual React component',
  authorization: { operationLocal: authorization, crossRequestCache: cacheAuthorization, hotpaths: hotpathAuthorization,
    extensionsImplemented: true, instructionsSource: 'Handoff defines technical scope; request and approvals come directly from the user' },
  productFiles: sources, changedFiles: [...sources.map(row => row.path), ...evidenceFiles],
  acceptance: {
    L01: { status: l01, ...load.fixture, runs: 20, cpuMaxMs: validator.scales.at(-1).cpu.max,
      wallP50Ms: validator.scales.at(-1).wall.p50, growth: validator.growth,
      interpretation: 'Five warmups per scale and balanced rotating order; no exclusions; observed scaling is not an asymptotic proof', evidence: 'validator-balanced.json' },
    L02: { status: l02, users: 20, admissionSeconds: 300, elapsedMs: load.elapsedMs, drainMs: load.elapsedMs-300000,
      poolMax: load.poolMax, originalHarnessPoolMax: 8, poolCapacityTunedForTest: load.poolMax !== 8,
      productionConfigurationChanged: false, totalRequests: load.totalRequests, newResponses, idempotentReplays: load.latencyMs.replay.count,
      technicalErrors: load.failures.length, technicalErrorRate, consistencyErrors: load.consistencyErrors.length,
      latencyMs: load.latencyMs, limits: { stateP95MsStrictlyBelow: 500, responseP95MsStrictlyBelow: 1000, technicalErrorRateStrictlyBelow: .01 },
      samplesExcluded: 0, rawSamplesVerified: true, sameFixtureSha256AsPriorRun: true,
      hardwareSoleCauseEstablished: false, productionCapacityVerified: false,
      evidence: [`${tag}-load.json`, `${tag}-latency-samples.json`, `${tag}-runtime.json`] },
    L03: { status: 'PASS', scope: payload.scope, payload, components: components.results,
      uiSourceUnchangedDuringExtensions: true, evidence: ['payload-summary.json', 'component-results.json'] }
  }, counts, checks: [
    { result: counts.failed ? 'FAIL' : 'PASS', detail: `${counts.passed} passed / ${counts.failed} failed / ${counts.skipped} skipped across seven serial API suites; restricted T036 PostgreSQL enabled`, evidence: 'hotpath-regression.txt' },
    { result: counts.failed ? 'FAIL' : 'PASS', detail: 'S06 split by anon/authenticated/runtime; same 67 expected denials and ownership/RLS/function checks; unchanged 5000ms per-case deadline', evidence: ['hotpath-security.txt','hotpath-regression.txt'] },
    { result: 'PASS', detail: 'Fresh facts and revocation checks, bounded immutable content reuse, concurrent cache misses, snapshot/diagnostic container independence, PostgreSQL timestamp precision including due-date boundaries at plus/minus 123 microseconds, incomplete reward-pair repair, exact batched facts/request-local snapshot equivalence, joined authorization metadata and local replay indexes', evidence: ['hotpath-rewards-focused.txt','hotpath-batched-equivalence.txt','hotpath-indexed-focused.txt','hotpath-regression.txt'] },
    { result: 'PASS', detail: '72 differential histories including frozen definitions, checked against SHA256-verified original pure functions after final replay/diagnostic changes', evidence: ['hotpath-indexed-differential.txt','differential.json','reference-integrity.json'] },
    { result: 'PASS', detail: 'Final API typecheck, affected ESLint including updated profiling script and diff checks exit 0', evidence: ['hotpath-types-final.txt','hotpath-lint-final.txt','hotpath-performance-lint.txt','hotpath-diff-final.txt'] },
    { result: l02, detail: `Exact 20 users / 300 seconds with explicitly configured local pool of ${load.poolMax} connections, unchanged fixture/workload/thresholds, all samples; no CPU profiler or timing trace`, evidence: [`${tag}-load.json`,'pool-capacity-decision.json'] },
    { result: 'PASS', detail: 'Prior contracts/web build/types/lint, 98 editor tests and isolated actual browser checks remain applicable; four UI hashes unchanged', evidence: ['initial-result.json','component-results.json'] },
    { result: 'PASS', detail: 'Baseline preserved, disposable databases absent, preexisting databases preserved, owned cluster stopped', evidence: ['preservation.json','database-cleanup-verification.json','services-cleanup.json'] }
  ], runtime, preservation, cleanup, services,
  differential: { status: differential.status, cases: differential.cases, referenceIntegrity: integrity.status },
  history: { previousClosure: 'before-hotpath-result.json', previousReadme: 'before-hotpath-README.md',
    firstHotpathLoad: 'hotpath-final-load.json',
    originalEightConnectionLoadAfterBatching: 'hotpath-batched-final-load.json',
    twentyConnectionLoadBeforeJoinedQueries: 'hotpath-pool20-final-load.json',
    joinedQueriesLoadBeforeReplayIndexes: 'hotpath-joined-final-load.json',
    previousLoad: 'cache-verified-load.json', diagnosticPool20NotAcceptance: 'hotpath-pool20-diagnostic-load.json',
    previousS06FailureResolvedByReorganization: counts.failed === 0, noPriorResultsDiscarded: true },
  issues: [...(l02 === 'FAIL' ? [{ code: 'L02_LATENCY', status: 'FAIL', detail: `state p95 ${load.latencyMs.state.p95}ms; response p95 ${load.latencyMs.response.p95}ms` }] : []),
    ...(counts.failed ? [{ code: 'API_REGRESSION', status: 'FAIL', detail: `${counts.failed} final regression failures` }] : []),
    { code: 'UI_SERVER_AUTO_REVIEW_REJECTED', status: 'NO VERIFICADO', detail: 'Automatic review rejected Next start: blocked by policy; no workaround retry', evidence: 'browser-server-rejected.json' }],
  notVerified: [...initial.notVerified, 'Twelve legacy independent-connection cases, six legacy T022 PostgreSQL cases and one Next browser case skipped; T036 restricted PostgreSQL enabled'],
  deploymentPerformed: false, commitCreated: false, dependenciesInstalled: false, dependenciesUpgraded: false,
  nextTaskStarted: false, nextTaskIds: [], nominalNextTask: 'T039', blockedConsumer: status === 'FAIL' ? 'T040 requires accepted T038' : null };
await writeFile(new URL('payload-summary.json', directory), JSON.stringify(payload,null,2)+'\n');
await writeFile(new URL('result.json', directory), JSON.stringify(result,null,2)+'\n');
const n = value => value.toFixed(2).replace('.',',');
const markdown = `# T038 — Cierre de la optimización autorizada

**${status} LOCAL.** L01 ${l01}, L02 ${l02} y L03 PASS en los ámbitos medidos. Regresión: ${counts.passed} PASS, ${counts.failed} FAIL y ${counts.skipped} omitidas. ${status === 'PASS' ? 'T038 cumple sus criterios locales.' : 'T038 sigue sin aceptación local.'} No se inició T039.

Solicitud directa: «continua con t038», autorizaciones «autorizo» y continuación «hazlo». El handoff define el alcance técnico; las instrucciones y autorizaciones del usuario constan en authorization.json, cache-authorization.json y hotpath-authorization.json. Base: \`${initial.baseSha}\`; predecesor requerido T035 PASS local.

| Criterio | Resultado | Evidencia |
|---|---|---|
| L01: 30 unidades / 200 objetivos / 1600 actividades; 20 medidas | ${l01}: CPU máxima ${n(validator.scales.at(-1).cpu.max)} ms (<2000); mediana de pared ${n(validator.scales.at(-1).wall.p50)} ms | validator-balanced.json |
| L02: 20 usuarios / 300 segundos | ${l02}: estado p95 ${n(load.latencyMs.state.p95)} ms (<500); respuesta p95 ${n(load.latencyMs.response.p95)} ms (<1000) | ${tag}-load.json |
| Consistencia y errores | ${load.totalRequests} solicitudes, ${newResponses} respuestas nuevas y ${load.latencyMs.replay.count} replays; ${load.failures.length} errores técnicos y ${load.consistencyErrors.length} inconsistencias | ${tag}-load.json |
| L03: manifiestos HTTP | PASS: creación ${payload.attemptCreateBytes}, respuesta máxima ${payload.responseBytes} y estado máximo ${payload.stateBytes} bytes; límite 102400 | payload-summary.json |
| L03: editor real aislado | PASS: 1600 tarjetas, cero formularios iniciales y máximo uno abierto | component-results.json |

La carga admite operaciones durante 300 s y drena las iniciadas: ${n(load.elapsedMs)} ms totales, ${n(load.elapsedMs-300000)} ms de drenaje. Se incluyen todas las muestras de ${tag}-latency-samples.json y se recalculan sus p95 al generar este cierre. Es la misma fixture SHA-256 \`${load.fixture.sha256}\`, con idéntico recorrido, pausas de cinco segundos, protección idempotente y límites. No hay perfilador de CPU ni traza de tiempos en esta corrida de aceptación. Los smoke y diagnósticos cortos se conservan y no acreditan L02.

**Configuración medida: pool local de ${load.poolMax} conexiones**, frente a ocho del harness original. La ficha fija usuarios, duración, datos y límites, pero no capacidad del pool. La decisión se apoya en una espera de pool de 1183,75 ms p95 en respuestas, frente a 671,83 ms p95 en consultas, registrada en hotpath-history-diagnostic-performance-trace.json. El observador de PostgreSQL no capturó esperas de bloqueo sostenidas; sus muestras cada segundo no descartan esperas breves. La configuración es explícita y figura en pool-capacity-decision.json. No se modificó la configuración de producción.

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

Siete suites API en serie: **${counts.passed} PASS / ${counts.failed} FAIL / ${counts.skipped} omitidas**, ${counts.total} casos. PostgreSQL real con runtime restringido está habilitado para T036. Las 19 omisiones son doce casos históricos que requieren el clúster dedicado T015, seis T022 que requieren su clúster dedicado y uno Next. No se presentan como PASS. Tipos API, lint afectado y git diff --check: exit 0.

L01 usa cinco calentamientos por escala y veinte medidas rotatorias sin exclusiones: crecimiento observado ${n(validator.growth.doubling100to200)}× al duplicar y ${n(validator.growth.quadrupling50to200)}× al cuadruplicar. Estas escalas no constituyen una prueba asintótica. Build de contracts, build/tipos/lint web y 98 pruebas editor PASS de la primera fase siguen siendo aplicables.

El componente React real se verificó aislado a 1440×900 y 390×844: ocho tipos, teclado, foco, borrador y persistencia HTTP/PostgreSQL, sin incidencias axe serious/critical. La revisión automática rechazó arrancar Next con «blocked by policy»; no se reintentó mediante otro mecanismo. Next, SSR, BFF, shell completo y recarga autenticada siguen NO VERIFICADO. Producción, staging, Hito S, Better Auth real, piloto clínico/editorial y certificación completa de accesibilidad no se acreditan aquí.

Preservación: ${preservation.baselineFiles} archivos baseline, ${preservation.unchangedFiles} intactos; ${preservation.authorizedChanges.length} modificaciones autorizadas y ${preservation.newProductFiles.length} archivo nuevo de producto. Los ${sources.length} hashes coinciden con los capturados antes de la carga final. Se conservan todas las mediciones previas, incluidos los fallos.

Limpieza: ${cleanup.databases.length} bases desechables con recibo ausentes, ninguna base sin recibo creada desde el baseline y cero conexiones ajenas. Se preservan las ${cleanup.preexistingDatabasesPreserved.length} bases anteriores a T038 por OID/fecha de directorio. Clúster propio detenido y puertos 31035/41035/55435 libres.

Entorno: ${runtime.platform} ${runtime.release}, ${runtime.cpu}, ${runtime.logicalCpus} CPU lógicas, ${runtime.totalMemoryBytes} bytes RAM, Node ${runtime.node}. HTTP loopback y PostgreSQL reales; identidad, reloj de negocio y contenido sintéticos del harness T035. No se instalaron dependencias ni se creó commit o despliegue.

## Reproducción

Usar Node 24 existente y únicamente el clúster desechable validado en ../M01/cluster.json, puerto 55435. No usar .env ni la base normal. Desde la raíz, habilitar NODE_ENV=test, KORAZ_GUIDED_V2_TEST_SERVER=true, KORAZ_TEST_DATABASE=true y KORAZ_GUIDED_V2_TEST_DATABASE_URL=postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test; elegir un T038_RUN_TAG nuevo y ejecutar:

\`pnpm.cmd --config.verify-deps-before-run=false --filter @cediah/api exec tsx test/performance/guided-v2-load.mjs --pool-size=${load.poolMax}\`

El script devuelve 1 si L02 falla. --smoke no acredita aceptación; --trace-performance y --cpu-profile son diagnósticos. validator-balanced.mjs coteja la fixture con la carga completa. write-result.mjs regenera este cierre comprobando duración, muestras, hashes, omisiones y limpieza.
`;
await writeFile(new URL('README.md', directory), markdown);
console.log(JSON.stringify({taskId:'T038',status,counts,acceptance:{L01:l01,L02:l02,L03:'PASS'},nextTaskStarted:false}));
