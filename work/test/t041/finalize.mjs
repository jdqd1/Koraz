import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const out = resolve(root, 'docs/aprendizaje-guiado/v2/evidencias/T041');
const read = name => JSON.parse(readFileSync(join(out, name), 'utf8'));
const save = (name, data) => writeFileSync(join(out, name), JSON.stringify(data, null, 2) + '\n');
const sha = s => createHash('sha256').update(s).digest('hex');
const git = args => { const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout; };
const api = read('api-result.json'), browser = read('playwright.json'), restored = read('restore.json');
assert.equal(api.status, 'PASS LOCAL'); assert.equal(api.checks.length, 10);
assert.equal(browser.stats.expected, 6); assert.equal(browser.stats.unexpected, 0); assert.equal(browser.stats.skipped, 0); assert.equal(browser.stats.flaky, 0);
assert.equal(restored.status, 'PASS');
assert.equal(read('database-cleanup.json').status, 'PASS');
assert.equal(read('cluster-cleanup.json').status, 'PASS');
assert.equal(read('harness-typecheck-result.json').exitCode, 0);
assert.equal(read('services-final.json').status, 'PASS');
const baseline = read('baseline.json');
const before = readFileSync(resolve(root, 'docs/aprendizaje-guiado/v2/registro-ejecucion.json'), 'utf8');
const registry = JSON.parse(before);
const t034 = JSON.parse(readFileSync(resolve(root, 'docs/aprendizaje-guiado/v2/evidencias/T034/result.json'), 'utf8'));
assert.equal(t034.status, 'PASS'); assert.equal(t034.scope, 'LOCAL');
const recordedUtc = new Date().toISOString();
save('authorization.json', { request: 'puedes solucionarlo todo?', scope: 'Execute T041 and reconcile the T034 registry discrepancy identified immediately before the request.',
  authorizedPaths: ['docs/aprendizaje-guiado/v2/runbook.md', 'work/test/t041/', 'docs/aprendizaje-guiado/v2/evidencias/T041/', 'docs/aprendizaje-guiado/v2/registro-ejecucion.json: T034 and T041 entries only'],
  productionDeploymentAuthorized: false, successorAuthorized: false });
const old034 = registry.tasks.find(t => t.taskId === 'T034');
const old041 = registry.tasks.find(t => t.taskId === 'T041');
assert.equal(old041.status, 'NO VERIFICADO');
const new034 = { ...old034, status: 'PASS LOCAL', evidence: ['docs/aprendizaje-guiado/v2/evidencias/T034/README.md', 'docs/aprendizaje-guiado/v2/evidencias/T034/result.json'],
  scope: 'LOCAL', reconciledUtc: recordedUtc, reconciliationEvidence: 'docs/aprendizaje-guiado/v2/evidencias/T041/registry-reconciliation.json',
  note: 'Reflects the existing T034 PASS/local closure; no T034 execution or broader system acceptance is attributed to this registry repair.' };
const new041 = { ...old041, status: 'PASS LOCAL', scope: 'M04 íntegro en PostgreSQL local desechable con UI/API; sin despliegue ni aceptación Hito S.',
  evidence: ['docs/aprendizaje-guiado/v2/evidencias/T041/README.md', 'docs/aprendizaje-guiado/v2/evidencias/T041/result.json', 'docs/aprendizaje-guiado/v2/runbook.md'],
  baseSha: baseline.head, recordedUtc, acceptance: [{ id: 'M04', status: 'PASS', scope: 'LOCAL' }], nextTaskIds: ['T042'], nextTaskStarted: false };
const newline = before.includes('\r\n') ? '\r\n' : '\n';
const block = obj => JSON.stringify(obj, null, 2).split('\n').map(s => '    ' + s).join(newline);
let after = before;
for (const [old, next] of [[old034, new034], [old041, new041]]) { assert.ok(after.includes(block(old)), 'Exact registry entry must match'); after = after.replace(block(old), block(next)); }
const without = r => ({ ...r, tasks: r.tasks.filter(t => !['T034', 'T041'].includes(t.taskId)) });
assert.deepEqual(without(JSON.parse(after)), without(registry));
writeFileSync(join(out, 'registry-before.json'), before);
writeFileSync(resolve(root, 'docs/aprendizaje-guiado/v2/registro-ejecucion.json'), after);
save('registry-reconciliation.json', { status: 'PASS', changedTaskIds: ['T034', 'T041'], allOtherEntriesPreserved: true,
  t034: { previousStatus: old034.status, status: new034.status, authority: 'Existing result.json status=PASS scope=LOCAL; README confirms local closure.', sourceSha256: sha(readFileSync(resolve(root, 'docs/aprendizaje-guiado/v2/evidencias/T034/result.json'))) },
  t041: { previousStatus: old041.status, status: new041.status }, beforeSha256: sha(before), afterSha256: sha(after) });
const changed = [], missing = [];
for (const [file, hash] of Object.entries(baseline.trackedHashes)) {
  if (!existsSync(resolve(root, file))) missing.push(file);
  else if (sha(readFileSync(resolve(root, file))) !== hash) changed.push(file);
}
assert.deepEqual(missing, []); assert.deepEqual(changed, ['docs/aprendizaje-guiado/v2/registro-ejecucion.json']);
const added = git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean);
const inScope = file => file === 'docs/aprendizaje-guiado/v2/runbook.md' || file.startsWith('docs/aprendizaje-guiado/v2/evidencias/T041/') || file.startsWith('work/test/t041/');
assert.deepEqual(added.filter(f => !inScope(f)), []);
save('preservation.json', { status: 'PASS', trackedBaselineFiles: Object.keys(baseline.trackedHashes).length, changed, missing, addedOutsideScope: [], productCodeChanged: false, appliedMigrationsChanged: false });
git(['diff', '--check']);
const backup = read('backup.json'); assert.equal(sha(readFileSync(join(out, 'v1-v2-backup.dump'))), backup.sha256);
const tables = Object.keys(read('before-backup.json').rows).length;
const head = git(['rev-parse', 'HEAD']).trim();
const limitations = ['Local disposable PostgreSQL; synthetic identity, no real Better Auth session issuance/signature.',
  'SQL references and synthetic local media only; no backup/restore of external storage objects.',
  'No production/staging deployment or measured production RPO/RTO.', 'T040 spoken screen-reader inspection remains outside T041; Hito S/T042 is not accepted.'];
const result = { taskId: 'T041', status: 'PASS LOCAL', scope: 'M04 íntegro; simulacro local de recuperación v1/v2 y rollout reversible preparado.',
  recordedUtc, clientDate: '2026-10-09', timezone: 'America/Caracas', baseSha: baseline.head, finalSha: head,
  predecessors: [{ taskId: 'T034', status: 'PASS LOCAL', evidence: '../T034/result.json', registryReconciled: true }, { taskId: 'T040', status: 'PASS LOCAL', evidence: '../T040/result.json', acceptanceComplete: false }],
  changedFiles: ['docs/aprendizaje-guiado/v2/runbook.md', 'docs/aprendizaje-guiado/v2/registro-ejecucion.json', 'work/test/t041/', 'docs/aprendizaje-guiado/v2/evidencias/T041/'],
  acceptance: [{ id: 'M04', status: 'PASS', scope: 'LOCAL', tableCount: tables, restoredIntoDifferentDatabase: true, historiesAndAgendasVerified: true, v1WritesWithV2Off: true, v2ReenableSessions: true }],
  checks: [
    { command: 'node work/test/t041/cluster.mjs start', exitCode: 0, result: 'PASS', evidence: 'cluster.json' },
    { command: 'pnpm.cmd --filter @cediah/api exec tsx ../../work/test/t041/recovery.mts', exitCode: 0, result: 'PASS', checks: 10, evidence: 'recovery-final.txt' },
    { command: 'pnpm.cmd --filter @cediah/web exec playwright test --config ../../work/test/t041/playwright.config.mts', exitCode: 0, result: 'PASS', passed: 6, failed: 0, skipped: 0, evidence: 'playwright.json' },
    { command: 'node work/test/t041/cluster.mjs stop', exitCode: 0, result: 'PASS', evidence: 'cluster-cleanup.json' },
    { command: 'git diff --check', exitCode: 0, result: 'PASS', evidence: 'preservation.json' }],
  databaseChecks: api.checks, observedTimes: { backupMs: restored.dumpMs, restoreCommandMs: restored.restoreMs, environment: 'Local PostgreSQL, synthetic data; not a production RPO/RTO' },
  runtime: { node: process.version, postgresBin: read('cluster.json').postgresBin, browser: 'Chromium desktop/mobile', web: 'Existing production build via next start; BUILD_ID ' + readFileSync(resolve(root, 'apps/web/.next/BUILD_ID'), 'utf8').trim() },
  issues: [], limitations, productCodeChanged: false, migrationsChanged: false, productionTouched: false, committed: false, deployed: false,
  nextTaskIds: ['T042'], nextTaskStarted: false, systemAcceptance: false,
  initialAttempts: 'Preparation failures are retained as recovery-initial/second/third/fourth/fifth/sixth logs and failure-*.json. Initial dev browser run timed out at reload and was stopped after DB cleanup; its logs/traces are preserved in initial-browser-run. Final run uses same timeout and retries=0 with existing built application.' };
save('result.json', result);
result.checks.push(read('harness-typecheck-result.json'));
result.checks.push({ command: 'Bounded TCP probes for 55435, 31041, 41041, 41042', exitCode: 0, result: 'PASS', evidence: 'services-final.json' });
result.initialAttempts += ' The first built-browser run had 3 PASS/3 FAIL due to test assumptions: a study response goes directly to close, and streamed hidden DOM caused a strict locator collision. built-browser-initial preserves all results. Teardown now waits for the current DB cleanup receipt, not just control socket closure. Strict standalone harness typecheck initially needed an explicit LearningAttempt annotation; corrected final typecheck passed.';
save('result.json', result);
writeFileSync(join(out, 'README.md'), `# T041 — recuperación y rollout reversible\n\n**PASS LOCAL**, 09/10/2026 (America/Caracas). M04 íntegro en el simulacro aislado. SHA base: \`${baseline.head}\`; SHA final: \`${head}\`. T042 no se inició.\n\n## Resultado\n\nBackup custom con datos sintéticos v1/v2; restauración en una DB PostgreSQL distinta. Coinciden conteos y SHA-256 de las **${tables} tablas** de public/private, DDL/grants y secuencias antes de repetir migraciones. Se restauran 9 usuarios, 5 matrículas con 5 registros de historial, 4 intentos v1, 7 intentos v2, 10 respuestas v1, 5 respuestas v2, 10 estados de repaso v1 y 1 agenda v2; además fuentes, bindings, eventos y recompensas.\n\nLa migración real 0035 se aplica sobre datos existentes y después del restore. El runner rechaza una migración sintética con división por cero y revierte su DDL/DML/ledger. Un incidente confirmado en el fixture altera nombre y agenda; los hashes detectan ambos cambios y el backup restaura los valores anteriores. El ledger se verifica por nombre/checksum; timestamps de aplicaciones independientes difieren de forma esperada.\n\n| Verificación | Resultado |\n|---|---|\n| API/DB y flags reales | 10 comprobaciones PASS |\n| Navegador Next → BFF → Fastify → PostgreSQL | 6 PASS, 0 FAIL, 0 omitidas; escritorio y móvil |\n| Mantenimiento v2 | Ruta avisa mantenimiento; consultas privadas y mutaciones bloqueadas no cambian ninguna tabla |\n| v1 con v2 apagada | Ruta/sesión restauradas; lectura completada desde UI y conservada al recargar |\n| Rehabilitación v2 | Sesión abierta restaurada, respuesta/cierre desde UI y persistencia tras recarga |\n| Admisión y allowlist | Nuevas matrículas bloqueadas sin impedir matrículas existentes; v1 continúa |\n| Limpieza | Solo DB propias eliminadas; inventario previo preservado; cluster propio detenido |\n| Preservación | Cero cambios de código de producto o migraciones; solo entradas T034/T041 del registro |\n\nBackup: ${restored.bytes} bytes, SHA-256 \`${restored.sha256}\`. Tiempos observados: backup ${(restored.dumpMs / 1000).toFixed(3)} s; comando de restauración ${(restored.restoreMs / 1000).toFixed(3)} s. No son objetivos de producción ni tiempo total de recuperación.\n\n## Entregables\n\n[Runbook](../../runbook.md), [resultado](result.json), [restore](restore.json), [conteos/hashes originales](before-backup.json), [conteos/hashes restaurados](restored-before-migrations.json), [API/DB](api-result.json), [navegador](playwright.json), [limpieza DB](database-cleanup.json), [cluster](cluster-cleanup.json), [preservación](preservation.json). Scripts reproducibles en \`work/test/t041/\`.\n\nLa [reconciliación](registry-reconciliation.json) refleja el PASS/local ya existente de T034; no reescribe su evidencia histórica ni declara cerrados otros hitos. T040 queda intacta. [Autorización](authorization.json).\n\n## Intentos iniciales y límites\n\nSe conservan todos los fallos de preparación: esquema inicial sin la vista de 0034 requerida por el editor actual; propósito v1 incorrecto; preguntas sin identidades estables; cierre redundante de quiz v1 que ya se completa al responder; assertion de disponibilidad aplicada a un DTO de intento que no contiene ese campo. Son ajustes al fixture/harness, sin alterar reglas del producto. El reintento intermedio tras cambiar itemId aún falló por la identidad faltante y también se conserva.\n\nLa primera pasada de navegador con Next dev agotó 120 s al recargar la ruta y se interrumpió tras limpiar sus DB; [log](browser-initial.txt) y \`initial-browser-run/\` conservan la traza. La pasada final usa el build existente, el mismo timeout y cero retries; no suma repeticiones a los seis PASS. Next start emite un aviso por output standalone; el servidor y los seis recorridos funcionaron.\n\n${limitations.map(s => '- ' + s).join('\n')}\n\nNo hubo commit ni despliegue. Siguiente ficha: **T042**, sin iniciar.\n`);
appendFileSync(join(out, 'README.md'), '\n## Ajustes finales del harness\n\nLa primera pasada con build tuvo 3 PASS y 3 FAIL, conservados en `built-browser-initial/`: la lectura study pasa directamente al cierre, y el streaming mantuvo temporalmente un DOM oculto que colisionó con el locator. Se corrigieron las expectativas para comprobar el flujo y la superficie visibles; no cambiaron producto, timeout ni retries. La limpieza final espera el receipt de las DB de esa ejecución antes de terminar el servidor. Typecheck estricto del harness PASS tras explicitar LearningAttempt; el primer diagnóstico también se conserva. La pasada final de seis casos es la única contada como resultado efectivo.\n');
console.log(`T041 PASS LOCAL: ${tables} tables restored, 10 API/DB checks, 6 browser PASS; registry T034/T041 reconciled`);
