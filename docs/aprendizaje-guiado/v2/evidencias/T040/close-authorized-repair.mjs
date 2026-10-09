import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('./', import.meta.url));
const root = resolve(here, '../../../../..');
process.chdir(root);
const read = name => JSON.parse(readFileSync(resolve(here, name), 'utf8'));
const save = (name, value) => writeFileSync(resolve(here, name), JSON.stringify(value, null, 2));
const hash = value => createHash('sha256').update(value).digest('hex');
const authorization = read('repair-authorization.json');
assert.equal(authorization.status, 'AUTORIZADO');
for (const id of ['web-editor-repair-final', 'e2e-editor-repair-final', 'web-lint-repair', 'web-typecheck-repair']) {
  assert.equal(read(`${id}-exit.json`).result, 'PASS', id);
}
execFileSync(process.execPath, [resolve(here, 'audit.mjs'), 'results'], { stdio: 'inherit' });
const counts = read('counts-and-omissions.json');
assert.equal(counts['legacy-effective'].total, 64);
assert.equal(counts['legacy-effective'].passed, 63);
assert.equal(counts['legacy-effective'].failed, 0);
assert.equal(counts['legacy-effective'].skipped, 1);
assert.equal(counts['editor-repair-final'].stats.expected, 4);
assert.equal(counts['editor-repair-final'].stats.unexpected, 0);
assert.equal(counts['web-effective'].passed, 483);
assert.equal(counts['web-effective'].failed, 0);
assert.equal(read('services-final.json').status, 'PASS');
const recordedUtc = new Date().toISOString();
const registryPath = resolve(root, 'docs/aprendizaje-guiado/v2/registro-ejecucion.json');
const before = readFileSync(registryPath, 'utf8');
const registry = JSON.parse(before), oldTask = registry.tasks.find(t => t.taskId === 'T040');
const task = { ...oldTask, status: 'PASS LOCAL', recordedUtc, nextTaskIds: ['T041'], nextTaskStarted: false,
  acceptanceComplete: false, regressionStatus: 'PASS LOCAL SIN REGRESIONES NUEVAS DETECTADAS',
  issues: [
    { code: 'SCREEN_READER', status: 'NO VERIFICADO', detail: 'V04: salida hablada no inspeccionada.' },
    { code: 'M04_BACKUP_RESTORE', status: 'NO VERIFICADO EN T040', owner: 'T041' },
  ],
  repairAuthorization: 'docs/aprendizaje-guiado/v2/evidencias/T040/repair-authorization.json',
};
const eol = before.includes('\r\n') ? '\r\n' : '\n';
const block = value => JSON.stringify(value, null, 2).split('\n').map(line => '    ' + line).join(eol);
assert.ok(before.includes(block(oldTask)), 'Exact T040 registry block must exist');
const after = before.replace(block(oldTask), block(task));
const withoutT040 = r => ({ ...r, tasks: r.tasks.filter(t => t.taskId !== 'T040') });
assert.deepEqual(withoutT040(JSON.parse(after)), withoutT040(registry));
writeFileSync(registryPath, after);
save('repair-registry-mutation.json', { status: 'PASS', recordedUtc, changedTaskIds: ['T040'], otherEntriesPreserved: true,
  beforeSha256: hash(before), afterSha256: hash(after), authorization: 'repair-authorization.json' });
execFileSync(process.execPath, [resolve(here, 'audit.mjs'), 'preservation'], { stdio: 'inherit' });
const preservation = read('preservation.json');
assert.equal(preservation.status, 'PASS');
assert.equal(preservation.changed.length, 11);

const result = read('before-authorized-repair/result.json');
result.status = 'PASS LOCAL';
result.recordedUtc = recordedUtc;
result.acceptanceComplete = false;
result.acceptanceScope = 'Cierre de regresión técnica local; V04 hablado permanece NO VERIFICADO y M04-restauración pertenece a T041. No equivale a aceptación integral/Hito S.';
result.finalSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
result.headMovement.finalSha = result.finalSha;
result.headMovement.contentComparison = `preservation.json compares ${preservation.baselineFiles} original files; only ${preservation.changed.length} authorized paths changed.`;
save('head-movement.json', result.headMovement);
result.changedFiles = preservation.changed.map(c => c.path);
result.summary.legacy = { passed: 63, failed: 0, skipped: 1 };
result.summary.web = { passed: 483, failed: 0, files: counts['web-effective'].files };
result.checks = readdirSync(here).filter(n => n.endsWith('-exit.json')).map(read).sort((a, b) => a.startedUtc.localeCompare(b.startedUtc));
result.issues = result.issues.filter(i => i.code !== 'PREEXISTING_LEGACY_VIDEO_TESTS');
result.preservation = preservation;
result.services = read('services-final.json');
result.nextTaskIds = ['T041'];
result.nextTaskStarted = false;
result.repair = { status: 'PASS LOCAL', authorization: 'repair-authorization.json',
  files: authorization.authorizedSourceFiles, productionBehaviorChanged: false, videoPolicyChanged: false,
  focusedUnit: { passed: 26, failed: 0, files: 3 }, focusedBrowser: { passed: 4, failed: 0, projects: ['desktop', 'mobile'] },
  preservationCheck: 'Full option objects, objectives and activity purposes are identical after editor model -> serialization -> fixture save/read; editVersion advances and edited title persists.',
  initialUnitFailure: 'New test expected save:1 while the legacy fixture starts at editVersion 7. Changed to the exact initial version; all data-preservation assertions already passed.',
  initialBrowserFailure: 'defineConfig(base, overrides) concatenated webServer arrays and tried to start duplicate servers. Replaced with defineConfig({...base, webServer:[base.webServer[1]]}); final run starts only Next dev, without API/DB.',
  evidence: ['web-editor-repair-final.json', 'playwright-editor-repair-final.json', 'web-lint-repair.txt', 'web-typecheck-repair.txt'] };
result.history.authorizedLegacyRepair = 'The owner authorized reconciling video visibility with the existing policy. Four original failures remain in their raw reports; only the affected cases are replaced by their successful final reruns.';
save('result.json', result);

writeFileSync(resolve(here, 'README.md'), `# T040 — regresión funcional y compatibilidad

**Estado: PASS LOCAL de regresión técnica.** La reparación de los dos tests heredados fue autorizada expresamente por el usuario y verificada. No hay fallos pendientes en los resultados locales efectivos. La aceptación integral sigue sin acreditarse: V04 hablado no inspeccionado; M04-restauración corresponde a T041. T041 no se inició.

SHA base: \`${result.baseSha}\`. SHA final: \`${result.finalSha}\`. HEAD avanzó durante la ejecución inicial e incluyó trabajo intermedio; T040 no creó commits. No hubo despliegue. Los cambios anteriores se preservaron por hashes.

| Comprobación | Resultado efectivo |
|---|---|
| Contratos, build completo, typecheck, lint | PASS; lint/typecheck web repetidos tras la reparación |
| API, 60 archivos | 593 PASS, 0 FAIL, 3 omitidos |
| Web, 62 archivos | 483 PASS, 0 FAIL |
| E2E guided-v2, escritorio/móvil | 20 PASS, 0 FAIL, 6 omitidos |
| Legacy mapa/editor | 63 PASS, 0 FAIL, 1 omitido |
| Reparación focal de editor | 26 unitarios PASS y 4 casos navegador PASS |
| Editor 200 objetivos/1600 actividades | 2 PASS, 0 FAIL |
| L01/L02 | PASS; p95 estado 237.16 ms, respuesta 532.20 ms |

Los conteos efectivos reemplazan cada archivo Vitest o cada caso Playwright por su última ejecución; no suman repeticiones. El nuevo test agrega un único caso al total web anterior de 482. Las omisiones siguen explícitas y no cuentan como PASS. [Conteos completos](counts-and-omissions.json).

## Reparación autorizada

[Autorización](repair-authorization.json), [propuesta](REPARACION-LEGADO-PROPUESTA.md), [reporte unitario](web-editor-repair-final.json) y [reporte navegador](playwright-editor-repair-final.json).

- El fixture off-page ofrece primero el cuestionario elegible; la guía fijada continúa fuera de la primera página. Las assertions de paginación permanecen intactas.
- El caso heredado conserva objetivos, guía y propósito integrate, y exige ausencia visible de Video según la política vigente desde antes de T001.
- Un test nuevo modifica el título, pasa por modelo/serialización/guardar/leer y compara los cuatro objetos completos de opciones: guide, video, quiz y flashcards. Conserva configuraciones, identidades, objetivos y propósitos, y comprueba el avance exacto de editVersion. La política de videos del producto no cambia.

Los cuatro FAIL heredados originales permanecen en los reportes crudos y en [el cierre anterior](before-authorized-repair/README.md). La [comparación con T001](baseline-compatibility.json) describe el estado anterior a esta reparación. El primer intento del test nuevo falló por usar versión 1 en vez de 7; el primer arranque Playwright duplicó servidores por la fusión de configuración. Ambos intentos se conservan. La ejecución final usa Node 24.19.0, mismo timeout/retries y solo Next dev con transporte fixture en memoria.

## Evidencia conservada y límites

La pasada global inicial y sus repeticiones de API, E2E v2, mapa persistente, carga y editor grande siguen vigentes: no se cambió lógica del producto. API auth/roles/catálogo/contenidos/storage están incluidos. La carga real PostgreSQL/HTTP mantiene 20 usuarios, 300 s, pool20 y 4264 peticiones sin errores técnicos o de consistencia. Los 82 reportes axe no presentan serious/critical y las 72 geometrías no presentan overflow. Los detalles y límites están en [result.json](result.json), [accesibilidad](accessibility-summary.json), [manifiestos](manifest-summary.json) y [cierre inicial](before-authorized-repair/README.md).

El navegador legacy usa Fastify/PGlite; los dos casos reparados usan transporte en memoria. La evidencia de locks de PostgreSQL corresponde únicamente a las suites independientes identificadas. Los E2E v2 y la carga usan PostgreSQL desechable real. No se acredita salida hablada de lector de pantalla, emisión/firma real de Better Auth, dispositivos físicos, certificación WCAG integral, eficacia educativa, Hito S/T042, staging o producción. M04-restauración se ensaya en T041, sin anticiparla en T040.

[Preservación](preservation.json): ${preservation.baselineFiles} archivos iniciales, ${preservation.changed.length} cambios autorizados, cero faltantes o añadidos fuera del dossier. Diez archivos de tests/harness y solo la entrada T040 del registro; ningún cambio de comportamiento de producción. [Registro](repair-registry-mutation.json) conserva las demás fichas. [Limpieza SQL inicial](database-cleanup-verification.json) conserva DB preexistentes; esta reparación no creó DB persistentes. [Servicios](services-final.json): puertos de prueba sin listeners. Lockfile y SQL anterior preservados.

La siguiente ficha es **T041**. \`acceptanceComplete:false\` se mantiene para distinguir este PASS LOCAL de la aceptación integral del sistema.
`);
console.log('Authorized repair closure generated: PASS LOCAL; acceptanceComplete=false; next=T041, not started');
