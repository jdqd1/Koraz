import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
const directory = new URL('./', import.meta.url);
const read = async name => JSON.parse(await readFile(new URL(name, directory), 'utf8'));
const [load, previous, firstCache, validator, components, preservation, sources, loadSources, cleanup,
  services, differential, integrity, authorization, cacheAuthorization, initial] = await Promise.all([
  'cache-verified-load.json', 'authorized-final-load.json', 'cache-final-load.json', 'validator-balanced.json',
  'component-results.json', 'preservation.json', 'source-hashes.json', 'cache-verified-source-hashes.json',
  'database-cleanup-verification.json', 'services-cleanup.json', 'differential.json', 'reference-integrity.json',
  'authorization.json', 'cache-authorization.json', 'initial-result.json'].map(read));
assert.equal(load.smoke, false); assert.equal(load.seconds, 300); assert.equal(load.users, 20);
assert.equal(load.fixture.sha256, previous.fixture.sha256); assert.equal(load.fixture.sha256, firstCache.fixture.sha256);
assert.equal(load.fixture.units, 30); assert.equal(load.fixture.objectives, 200); assert.equal(load.fixture.activities, 1600);
assert.equal(load.failures.length, 0); assert.equal(load.consistencyErrors.length, 0);
assert.ok(load.consistency.every(row => row.cycles > 0 && row.responses === row.expectedResponses && row.uniqueActivities === row.responses && row.correct && row.unassisted));
for (const report of [preservation, cleanup, services, differential, integrity]) assert.equal(report.status, 'PASS');
assert.equal(cleanup.otherConnections.length, 0); assert.equal(cleanup.remaining.length, 0);
assert.equal(cleanup.unreceiptedCurrentDatabases.length, 0);
assert.ok(cleanup.preexistingDatabasesPreserved.every(row => row.directoryCreatedAt < cleanup.baselineCreatedAt));
assert.equal(cacheAuthorization.approved, true); assert.equal(cacheAuthorization.implemented, true);
for (const source of sources) {
  assert.equal(source.sha256.toLowerCase(), loadSources.find(row => row.path === source.path).sha256.toLowerCase());
  if (source.path.startsWith('apps/web/')) assert.equal(source.sha256, initial.productFiles.find(row => row.path === source.path).sha256);
}
const samples = await read('cache-verified-latency-samples.json');
let sampleCount = 0;
for (const [label, values] of Object.entries(samples)) {
  const ordered = [...values].sort((a,b) => a-b);
  assert.equal(load.latencyMs[label].count, values.length);
  assert.equal(load.latencyMs[label].p95, ordered[Math.ceil(values.length * .95)-1]);
  sampleCount += values.length;
}
assert.equal(sampleCount, load.totalRequests);
const sql = {};
for (const name of ['create', 'response', 'complete']) {
  sql[name] = await read(`cache-verified-profile-sql-operation-${name}.json`);
  assert.equal(sql[name].definitions, 0); assert.ok(sql[name].metadataChecks >= 1);
}
sql.state = await read('cache-verified-profile-sql-before-load.json');
const regression = await readFile(new URL('cache-regression-final.txt', directory), 'utf8');
const countMatch = regression.match(/Tests\s+1 failed \| (\d+) passed \| (\d+) skipped \((\d+)\)/);
assert.ok(countMatch);
assert.match(regression, /S06 external logins cannot access v2 tables/);
assert.match(await readFile(new URL('cache-security-recheck.txt', directory), 'utf8'), /1 failed \| 29 passed \| 7 skipped/);
assert.match(await readFile(new URL('cache-security-case-recheck.txt', directory), 'utf8'), /1 failed \| 36 skipped/);
const permissions = await read('cache-permission-audit.json'); assert.equal(permissions.status, 'PASS'); assert.equal(permissions.denials, 67);
const counts = { passed: +countMatch[1], failed: 1, skipped: +countMatch[2], total: +countMatch[3], files: 7,
  broadRun: { passed: +countMatch[1], failed: 1, skipped: +countMatch[2] },
  isolatedSecurityRecheck: { passed: 29, failed: 1, skipped: 7 },
  isolatedCaseRecheck: { failed: 1, skippedByNameFilter: 36 },
  interpretation: 'Same S06 5s timeout persisted in suite and single-case rechecks; independent SQL audit is separate evidence and does not erase the Vitest failure' };
assert.equal(counts.passed, 162); assert.equal(counts.skipped, 19); assert.equal(counts.total, 182);
const l02 = load.latencyMs.state.p95 < 500 && load.latencyMs.response.p95 < 1000 ? 'PASS' : 'FAIL';
assert.equal(load.status, l02);
assert.ok(validator.scales.at(-1).cpu.max < 2000);
const payload = { status: 'PASS', publicPathBytes: 17712, publicPathMeasuredInPriorPhase: true,
  publicPathProjectionUnchanged: true, httpStatus: 200, attemptCreateBytes: load.payloadBytes.create,
  responseBytes: load.payloadBytes.response, stateBytes: load.payloadBytes.state, thresholdBytes: 102400,
  activeOnly: true, scope: 'HTTP manifests and isolated actual React component; Next/BFF/full shell not verified' };
assert.ok(Math.max(payload.publicPathBytes, ...Object.values(load.payloadBytes)) <= payload.thresholdBytes);
await writeFile(new URL('payload-summary.json', directory), JSON.stringify(payload, null, 2) + '\n');
const evidenceFiles = [...new Set([...(await readdir(directory)), 'result.json'])].sort().map(file => `docs/aprendizaje-guiado/v2/evidencias/T038/${file}`);
const result = { taskId: 'T038', status: 'FAIL', closedAt: new Date().toISOString(), timezone: 'America/Caracas',
  request: 'continua con t038; autorizo', baseSha: initial.baseSha, predecessors: initial.predecessors,
  scope: 'LOCAL synthetic fixtures; actual HTTP/Fastify and disposable PostgreSQL; restricted runtime security; isolated actual React component',
  authorization: { operationLocal: authorization, crossRequestCache: cacheAuthorization, extensionsImplemented: true },
  productFiles: sources, changedFiles: [...sources.map(row => row.path), ...evidenceFiles],
  acceptance: {
    L01: { status: 'PASS', ...load.fixture, runs: 20, cpuMaxMs: validator.scales.at(-1).cpu.max,
      wallP50Ms: validator.scales.at(-1).wall.p50, growth: validator.growth,
      interpretation: 'Balanced rotating scale order after five warmups; no samples excluded. Observed scaling, not an asymptotic complexity proof.', evidence: 'validator-balanced.json' },
    L02: { status: l02, users: 20, admissionSeconds: 300, elapsedMs: load.elapsedMs, drainMs: load.elapsedMs-300000,
      totalRequests: load.totalRequests, newResponses: load.consistency.reduce((sum,row) => sum+row.responses,0),
      idempotentReplays: load.latencyMs.replay.count, technicalErrors: 0, technicalErrorRate: 0, consistencyErrors: 0,
      latencyMs: load.latencyMs, limits: { stateP95MsStrictlyBelow: 500, responseP95MsStrictlyBelow: 1000, technicalErrorRateStrictlyBelow: .01 },
      samplesExcluded: 0, rawSamplesVerified: true, sameFixtureSha256AsPriorRun: true, hardwareSoleCauseEstablished: false,
      productionCapacityVerified: false, evidence: ['cache-verified-load.json', 'cache-verified-latency-samples.json'] },
    L03: { status: 'PASS', scope: payload.scope, payload, components: components.results,
      uiSourceUnchangedDuringExtensions: true, evidence: ['payload-summary.json', 'component-results.json'] }
  }, counts, checks: [
    { result: 'FAIL', detail: `${counts.passed} passed / 1 timeout / ${counts.skipped} skipped; S06 timeout persisted in suite and single-case rechecks; restricted T036 PostgreSQL runtime enabled`, evidence: ['cache-regression-final.txt','cache-security-recheck.txt','cache-security-case-recheck.txt'] },
    { result: 'PASS', detail: 'Independent exact S06 SQL audit: 67 expected 42501 denials and runtime/ownership/RLS/function assertions; no Vitest deadline; timed-out Vitest case remains FAIL', evidence: 'cache-permission-audit.json' },
    { result: 'PASS', detail: 'Cache TTL, LRU, aggregate bytes, oversized bypass, same-id concurrent misses, deletion/replacement, immutability and database isolation', evidence: 'cache-regression-final.txt' },
    { result: 'PASS', detail: 'Fresh facts and revocation checks with warm definition cache; all catalog locks retained, current status read after locks', evidence: ['cache-regression-final.txt', 'cache-verified-profile-sql-operation-response.json'] },
    { result: 'PASS', detail: '72 differential histories, including frozen definitions, against hash-verified original pure functions', evidence: ['differential.json', 'reference-integrity.json'] },
    { result: 'PASS', detail: 'No full definition read in warm create/respond/complete; metadata checked every operation', evidence: ['cache-verified-profile-sql-operation-create.json','cache-verified-profile-sql-operation-response.json','cache-verified-profile-sql-operation-complete.json'] },
    { result: 'PASS', detail: 'Final API types, affected ESLint and diff checks exit 0', evidence: ['cache-types-final.txt','cache-lint-final.txt','cache-diff-final.txt'] },
    { result: l02, detail: 'Exact 20-user, 300-second workload with unchanged thresholds and all samples', evidence: 'cache-verified-load.json' },
    { result: 'PASS', detail: 'Prior contracts and web build/types/lint, 98 editor tests and isolated browser evidence remain applicable; four UI hashes unchanged', evidence: ['initial-result.json','component-results.json'] },
    { result: 'PASS', detail: 'Baseline preservation, exact disposable database cleanup and owned service shutdown', evidence: ['preservation.json','database-cleanup-verification.json','services-cleanup.json'] }
  ], sqlQueryCounts: Object.fromEntries(Object.entries(sql).map(([key,value]) => [key, value.queries])),
  preservation, cleanup, services, permissions, differential: { status: differential.status, cases: differential.cases, referenceIntegrity: integrity.status },
  history: { originalClosure: 'initial-result.json', operationLocalClosure: 'before-cache-result.json',
    firstCacheLoad: 'cache-final-load.json', firstCacheLoadSupersededByConcurrentByteAccountingFix: true,
    finalLoad: 'cache-verified-load.json', noPriorResultsDiscarded: true },
  issues: [...(l02 === 'FAIL' ? [{ code: 'L02_LATENCY', status: 'FAIL', detail: `state p95 ${load.latencyMs.state.p95}ms; response p95 ${load.latencyMs.response.p95}ms exceed original limits` }] : []),
    { code: 'S06_TEST_TIMEOUT', status: 'FAIL', detail: 'S06 external-login permission test exceeded its unchanged 5s deadline in three final-tree runs; independent exact SQL assertions passed separately', evidence: ['cache-regression-final.txt','cache-security-recheck.txt','cache-security-case-recheck.txt','cache-permission-audit.json'] },
    { code: 'UI_SERVER_AUTO_REVIEW_REJECTED', status: 'NO VERIFICADO', detail: 'Automatic review rejected Next start: blocked by policy; no retry through workaround', evidence: 'browser-server-rejected.json' }],
  notVerified: [...initial.notVerified, 'Six legacy T022 dedicated-PostgreSQL cases and twelve legacy independent-connection cases skipped in current run; T036 restricted independent PostgreSQL was enabled'],
  deploymentPerformed: false, commitCreated: false, dependenciesInstalled: false, dependenciesUpgraded: false,
  nextTaskStarted: false, nextTaskIds: [], nominalNextTask: 'T039', blockedConsumer: 'T040 requires accepted T038' };
await writeFile(new URL('result.json', directory), JSON.stringify(result, null, 2) + '\n');
const n = value => value.toFixed(2).replace('.', ',');
const cache = cacheAuthorization.limits;
const markdown = `# T038 — Cierre de la ampliación autorizada de caché

**FAIL LOCAL.** L01 y L03 pasan en sus ámbitos medidos; L02 ${l02 === 'FAIL' ? 'no cumple los límites originales' : 'cumple los límites originales'}. Persiste además un timeout de S06. T038 no está aceptada. No se inició T039 ni se acepta Hito S.

Solicitud: «continua con t038» y «autorizo», 07/10/2026, America/Caracas. Base: \`${initial.baseSha}\`. T035 PASS local es el predecesor requerido; T037 PASS local también fue inspeccionado. Ambas ampliaciones constan en \`authorization.json\`, \`cache-authorization.json\` y sus propuestas. El documento adjunto define el alcance técnico; la solicitud y las autorizaciones proceden del usuario.

| Criterio | Resultado medido | Evidencia |
|---|---|---|
| L01: 30 unidades, 200 objetivos, 1600 actividades, 20 corridas | PASS. CPU máxima ${n(validator.scales.at(-1).cpu.max)} ms; mediana de pared ${n(validator.scales.at(-1).wall.p50)} ms. | validator-balanced.json |
| L02: 20 usuarios durante 300 s | ${l02}. p95 estado ${n(load.latencyMs.state.p95)} ms (<500); respuesta ${n(load.latencyMs.response.p95)} ms (<1000). | cache-verified-load.json |
| Errores y consistencia | ${load.totalRequests} solicitudes, ${result.acceptance.L02.newResponses} respuestas nuevas, ${load.latencyMs.replay.count} replays idénticos; cero errores técnicos y cero inconsistencias. | cache-verified-load.json |
| L03: manifiestos HTTP | PASS. Creación ${payload.attemptCreateBytes}, respuesta máxima ${payload.responseBytes}, estado máximo ${payload.stateBytes} bytes; límite 102400. | payload-summary.json |
| L03: formularios | PASS del componente real aislado: 1600 tarjetas, cero formularios iniciales y máximo uno abierto. | component-results.json |

La ventana de admisión dura 300 s y se drenan las operaciones iniciadas: total ${n(load.elapsedMs)} ms, drenaje ${n(load.elapsedMs-300000)} ms. Se incluyen y verifican todas las muestras de \`cache-verified-latency-samples.json\`. La carga es cerrada, con pausa de hasta cinco segundos por actividad; no acredita una tasa fija ni alumnos reales. La fixture SHA-256 es \`${load.fixture.sha256}\`, igual en todas las cargas completas.

| p95 | Antes de caché entre peticiones | Primera carga con caché | Árbol final |
|---|---:|---:|---:|
| Estado | ${n(previous.latencyMs.state.p95)} ms | ${n(firstCache.latencyMs.state.p95)} ms | ${n(load.latencyMs.state.p95)} ms |
| Respuesta | ${n(previous.latencyMs.response.p95)} ms | ${n(firstCache.latencyMs.response.p95)} ms | ${n(load.latencyMs.response.p95)} ms |

Se conservan todas las corridas, incluidos los fallos. La primera carga con caché precede a la corrección del contador ante lecturas simultáneas; la final corresponde exactamente a los doce hashes de producto entregados. La variación del equipo impide atribuir las diferencias a una sola causa. No se rebajan umbrales ni se atribuye el fallo exclusivamente al hardware.

## Implementación y límites de caché

Se guardan únicamente definiciones publicadas, validadas y congeladas profundamente, por cliente de base de datos: ${cache.entries} versiones como máximo, ${cache.serializedJsonBytes} bytes de JSON codificado y TTL absoluto de ${cache.ttlMilliseconds} ms, con expulsión LRU. El presupuesto describe JSON codificado, no el heap total de objetos e índices. Las lecturas simultáneas de la misma versión reemplazan también su peso, evitando contarlo dos veces. Borradores, definiciones inválidas o sobredimensionadas no se retienen.

Cada operación coteja id, policy, estado, edit_version y updated_at con precisión PostgreSQL. Los índices estructurales solo se reutilizan para definiciones profundamente inmutables. Matrícula, catálogo, bindings, permisos, hechos del alumno, agenda, relojes y recibos se leen de nuevo. No se almacena estado del alumno entre peticiones. Los locks de catálogo mantienen su orden; el estado se consulta en una sentencia posterior para observar revocaciones tras esperas.

La traza caliente registra cero descargas completas de definición y una comprobación de metadatos por creación/respuesta/finalización. Estado usa ${sql.state.queries} consultas SQL; creación ${sql.create.queries}, respuesta ${sql.response.queries}, finalización ${sql.complete.queries}. Esto verifica consultas, no aceptación de latencia.

Se conservan las optimizaciones anteriores: upsert ordenado por lote de objetivos modificados, timestamps históricos, índices de evidencia/selección, reutilización dentro de una operación y editor con una sola tarjeta abierta. No cambian score, reglas, contratos ni migraciones. Los cuatro archivos web mantienen los hashes de la primera fase.

## Verificación

- Siete suites API seriales: **162 PASS / un FAIL por timeout / 19 omitidas**, 182 casos. S06 excede 5000 ms en la corrida amplia, en seguridad aislada (29 PASS / un timeout / 7 omitidas) y en el caso aislado. No se cambió el timeout ni se descarta el fallo. T036 con PostgreSQL y usuario restringido está habilitada. Se omiten seis casos T022 que requieren su clúster dedicado, doce de concurrencia histórica y uno de navegador Next; no se presentan como PASS.
- Auditoría SQL independiente de las mismas comprobaciones S06: PASS, 67 denegaciones esperadas 42501, aislamiento de logins, RLS, ownership, flags del runtime y privilegios de funciones. Duración de las comprobaciones ${n(permissions.elapsedMs)} ms. Esta ejecución con Node assert no usa el plazo Vitest y no transforma su timeout en PASS. Evidencia: cache-permission-audit.json.
- Siete regresiones nuevas respecto del cierre anterior: cinco de caché, una de selección con hechos frescos y una de contabilidad concurrente. Las regresiones previas de revocación y timestamps también pasan.
- Diferencial: 72 historiales exactos contra fuentes anteriores verificadas por SHA-256, incluidas definiciones congeladas. La fixture diferencial grande tiene 1814 actividades y no sustituye las 1600 de L01/L02.
- Validador: cinco calentamientos por escala y veinte medidas rotatorias, sin exclusiones; crecimiento observado ${n(validator.growth.doubling100to200)}× al duplicar y ${n(validator.growth.quadrupling50to200)}× al cuadruplicar. Es evidencia en estas escalas, no prueba de complejidad asintótica. Se conservan mediciones ordenadas anteriores.
- Tipos API, ESLint afectado y \`git diff --check\`: exit 0. Build de contracts, build/tipos/lint web y 98 pruebas editor PASS conservados; fuentes web intactas durante ambas ampliaciones.
- Navegador del componente React real: 1440×900 y 390×844, ocho tipos, teclado, foco, borrador y persistencia HTTP/PostgreSQL; axe sin serious/critical en ese componente.
- Preservación: ${preservation.baselineFiles} archivos baseline, ${preservation.unchangedFiles} intactos; once modificaciones autorizadas y un archivo nuevo de producto. Los hashes finales coinciden con los capturados antes de la carga.
- Limpieza: ${cleanup.databases.length} bases desechables con recibo ausentes y ninguna base sin recibo creada desde el baseline; cero conexiones ajenas. Se conservaron ${cleanup.preexistingDatabasesPreserved.length} bases anteriores a T038, identificadas por OID y fecha de creación del directorio (04–05/10 frente al baseline 07/10). La primera detección sin clasificación se conserva en cache-cleanup-discovery.json. Clúster propio detenido y puertos 31035/41035/55435 libres.

## Entorno y alcance pendiente

Windows 10.0.26300, Intel Core i3-1305U, seis CPU lógicas, 8267882496 bytes RAM, Node 24.19.0; detalles en \`cache-verified-runtime.json\`. Fastify/proveedores/PostgreSQL reales, pool de ocho conexiones y HTTP loopback. Identidad, contenido y reloj de negocio son sintéticos del harness T035. No se instalaron ni actualizaron dependencias, ni se creó commit o despliegue.

La revisión automática rechazó arrancar Next con «blocked by policy» (\`browser-server-rejected.json\`). Next, SSR, BFF, shell completo y recarga autenticada siguen NO VERIFICADO. La evidencia aislada no los sustituye. Producción, staging, Hito S, piloto clínico/editorial, Better Auth real y certificación de accesibilidad siguen fuera de este cierre.

Pendiente: ${l02 === 'FAIL' ? 'cumplir L02 y repetir la carga exacta sobre cualquier corrección posterior, conservando el entorno y los límites; además, ' : ''}resolver el timeout S06 sin presentarlo como PASS a partir de la auditoría independiente. La ampliación de caché está implementada y no queda pendiente de autorización. T038 sigue sin aceptación; no se inicia T039.

## Reproducción

Usar solo el clúster desechable verificado en \`../M01/cluster.json\`, puerto 55435, y Node 24 existente. No leer .env ni usar la base normal. Desde la raíz:

\`\`\`powershell
$env:NODE_ENV='test'
$env:KORAZ_GUIDED_V2_TEST_SERVER='true'
$env:KORAZ_TEST_DATABASE='true'
$env:KORAZ_GUIDED_V2_TEST_DATABASE_URL='postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test'
$env:T038_RUN_TAG='recheck-cache-2' # elegir uno nuevo
node --import ./apps/api/node_modules/tsx/dist/loader.mjs apps/api/test/performance/guided-v2-load.mjs
\`\`\`

El script devuelve 1 si L02 falla. \`--smoke\` nunca acredita L02. \`--profile-only --operation-profile\` audita consultas. \`validator-balanced.mjs\` coteja la fixture con la carga final. \`write-result.mjs\` regenera README y result con comprobaciones de muestras, hashes y limpieza.
`;
await writeFile(new URL('README.md', directory), markdown);
console.log(JSON.stringify({ taskId: result.taskId, status: result.status, counts, acceptance: Object.fromEntries(Object.entries(result.acceptance).map(([key,value]) => [key,value.status])), nextTaskStarted: false }));

