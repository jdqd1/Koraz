const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto'), { execFileSync } = require('node:child_process');
const folder = __dirname, root = path.resolve(folder, '../../../../..');
const baseSha = 'e41c0c1b20adbb9248108c50d7bb0d4bac0ae1e3';
const read = name => fs.readFileSync(path.join(folder, name), 'utf8');
const write = (name, value) => fs.writeFileSync(path.join(folder, name), typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n');
const browser = JSON.parse(read('browser-maintenance.json'));
assert.equal(browser.checks.length, 7); assert.equal(browser.failure, undefined); assert.deepEqual(browser.errors, []);
assert.equal(browser.viewports.length, 4); assert(browser.viewports.every(v => v.pageOverflow === false));
assert.equal(browser.axe.length, 3); assert(browser.axe.every(v => v.seriousCritical === 0));
for (const [name, width] of [['exhausted-real-mobile.png', 390], ['review-real-desktop.png', 1440], ['retention-real-desktop.png', 1440]]) {
  assert.equal(fs.readFileSync(path.join(folder, name)).readUInt32BE(16), width, name);
}
assert.match(read('web-suite-expanded.txt'), /473 passed/);
assert.match(read('web-focused-final.txt'), /56 passed/);
assert.match(read('api-routes-projection-final.txt'), /14 passed/);
assert.match(read('api-focused-expanded-final.txt'), /85 passed.*10 skipped/);
assert.match(read('http-maintenance-verified.txt'), /1 passed/);
const processes = JSON.parse(read('process-status.json')); assert.equal(processes.closed, true);
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), baseSha);
execFileSync('git', ['diff', '--check'], { cwd: root });
const changedFiles = [
  'apps/api/src/guided-learning/v2/routes.ts', 'apps/api/test/guided-v2-contract.test.ts', 'apps/api/test/guided-v2-routes.test.ts',
  'apps/web/src/app/aprendizaje/repaso/page.tsx', 'apps/web/src/components/learning/v2/path-screen.tsx',
  'apps/web/src/components/learning/v2/player.tsx', 'apps/web/src/components/learning/v2/route-action.tsx',
  'apps/web/src/components/learning/v2/today-panel.tsx', 'packages/contracts/src/guided-learning-v2.ts',
  'apps/web/src/components/learning/v2/diagnostic.tsx', 'apps/web/src/components/learning/v2/gate.tsx',
  'apps/web/src/components/learning/v2/maintenance-fixtures.tsx', 'apps/web/src/components/learning/v2/maintenance.module.css',
  'apps/web/src/components/learning/v2/maintenance.test.tsx', 'apps/web/src/components/learning/v2/maintenance.tsx',
  'apps/web/src/components/learning/v2/remediation.tsx', 'apps/web/src/components/learning/v2/review-page.test.tsx',
  'apps/web/src/components/learning/v2/review.tsx',
];
const trackedChanges = execFileSync('git', ['diff', '--name-only'], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
assert(trackedChanges.every(file => changedFiles.includes(file)));
const deleted = execFileSync('git', ['diff', '--name-only', '--diff-filter=D'], { cwd: root, encoding: 'utf8' }).trim(); assert.equal(deleted, '');
write('source-hashes.json', Object.fromEntries(changedFiles.map(file => [file, createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')])));
write('preservation.json', { permittedChangeOnly: true, expandedScopeAuthorizedBy: 'User replied si to AMPLIACION-PROPUESTA.md', trackedChanges, newSourceFiles: changedFiles.filter(file => !trackedChanges.includes(file)), deleted: [], baseSha });
write('diff-check.txt', 'git diff --check: PASS; zero deleted files; all tracked changes are within the original or explicitly authorized expanded scope.\n');
write('state-after.txt', execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }));
const checks = [
  { result: 'PASS', command: 'pnpm --filter @cediah/contracts build', evidence: 'contracts-expanded.txt' },
  { result: '473 PASS, 59 files before final summary wording adjustment', command: 'pnpm --filter @cediah/web test', evidence: 'web-suite-expanded.txt' },
  { result: '56 PASS, final source', command: 'Web vitest: maintenance, review-page, model, player', evidence: 'web-focused-final.txt' },
  { result: '14 PASS, final projection', command: 'API vitest: guided-v2-routes.test.ts', evidence: 'api-routes-projection-final.txt' },
  { result: '85 PASS, 10 SKIP (independent PostgreSQL checks not enabled)', command: 'API vitest: guided-v2-contract, selection, scheduler, assessments', evidence: 'api-focused-expanded-final.txt' },
  { result: 'PASS', command: 'Web and API typecheck', evidence: ['web-typecheck-final.txt', 'api-typecheck-final.txt'] },
  { result: 'PASS, zero warnings', command: 'ESLint changed web and API TS/TSX', evidence: ['web-lint-final.txt', 'api-lint-final.txt'] },
  { result: '1 PASS; actual HTTP/provider with isolated PGlite', command: 'vitest.http-maintenance.config.mts', evidence: 'http-maintenance-verified.txt' },
  { result: '7 flow checks PASS; 4 viewports no overflow; 3 scoped axe inspections with zero serious/critical', command: 'node browser-maintenance.cjs', evidence: ['browser-maintenance.json', 'browser-maintenance-verified.txt', 'next-maintenance-verified.txt'] },
  { result: 'PASS; authorized changes only; zero deletions; source SHA256 recorded', command: 'git diff --check and preservation audit', evidence: ['diff-check.txt', 'preservation.json', 'source-hashes.json'] },
];
write('result.json', {
  taskId: 'T032', status: 'PASS', scope: 'LOCAL', baseSha, clientDate: '2026-10-04', timezone: 'America/Caracas',
  authorization: { request: 'haz la t032', expansion: 'AMPLIACION-PROPUESTA.md', response: 'si', applied: true },
  implementationScope: 'T032 UI plus explicitly authorized public maintenance projection and minimal route/Today/player mounts; existing selection/evidence/scheduler remain unchanged',
  dependencies: ['T017', 'T018', 'T019', 'T028', 'T031'].map(taskId => ({ taskId, status: 'PASS', scope: 'As documented by predecessor evidence', evidence: '../' + taskId + '/result.json' })),
  changedFiles: [...changedFiles, 'docs/aprendizaje-guiado/v2/evidencias/T032/'], checks,
  acceptance: {
    P11: 'Local browser: completed correct/wrong diagnosis and omission change server support/status, never mastery or review debt',
    P12_P13: 'Existing scheduler tests plus local UI: server clock/profile zone, read-only overdue state, one chosen review, no lapse from absence',
    P14_P15: 'Existing selection/assessment tests and HTTP segmented/reserve tests preserved; display batch max10, retention measured on real elapsed days; no reserve payload in maintenance DTO',
    E03_E06: 'T032 local subflows: critical error -> targeted source explanation; route/Today/player/review share pinned state. Full map/help/eight-kinds/system acceptance remains T035',
  },
  runtimeEvidence: { content: 'Synthetic 13-objective package', database: 'Isolated serialized PGlite', identity: 'Synthetic t030 cookie identity', serverDate: 'Controlled Date with chronological ticks; real networking and timers', authIssuanceVerified: false, measurements: 'Approximately day10 and day35, preserving fractional server elapsedDays; display rounds to one decimal' },
  issues: [
    { id: 'T032-missing-public-maintenance-data', blockingT032: false, resolvedBy: 'Authorized strict public projection' },
    { id: 'harness-shell-auth', blockingT032: false, detail: 'Existing AppShell GET /api/auth/get-session is 404 in synthetic identity harness; SSR and BFF use real /v1/auth/me identity helper. BetterAuth issuance and global AppShell auth are not verified.' },
    { id: 'inherited-T024-api-timeout', detail: 'Preserved; no claim of resolution or global API/system regression' },
    { id: 'inherited-T021-upgrade', detail: 'Previous scope retained; no upgrade implemented' },
  ],
  notVerified: ['Full T035 E03/E06/eight-kind journey and large map', 'Native zoom, screen reader and complete T037 accessibility audit', 'Independent PostgreSQL concurrency/grants in this run', 'BetterAuth issuance', 'Hito S, editorial/clinical acceptance, staging and production'],
  nextTaskIds: ['T033'], nextTaskStarted: false, processesClosed: true, committed: false, deployed: false, details: 'README.md',
});
write('README.md', `# T032 — diagnóstico, refuerzo y mantenimiento

**Estado: PASS local.** Petición «haz la t032»; ampliación mínima autorizada con
«si» después de presentar AMPLIACION-PROPUESTA.md. Fecha: 04/10/2026,
America/Caracas. Base: ${baseSha}; árbol inicial limpio.
Dependencias T017/T018/T019/T028/T031: PASS en sus alcances documentados.
No se inició T033, no se hizo commit ni despliegue.

## Resultado

La pantalla de repaso v2, la ruta, Hoy y el cierre del player consultan el mismo
estado de la matrícula/version fijada. El diagnóstico es optativo: completarlo
u omitirlo orienta el apoyo sin acreditar dominio, error crítico o deuda de
repaso. La omisión abre una actividad realmente autorizada por el servidor.
El gate muestra puntuación/umbral, objetivos esenciales y dependencias; el
refuerzo identifica la confusión y abre su explicación específica. Si no hay
variante elegible, muestra su fecha, pausa y otra rama disponible.

La cola ofrece hasta diez objetivos y conserva el orden del servidor. Cada
objetivo abre su propio intento; se puede parar tras cualquiera. En la prueba,
doce pendientes produjeron diez botones; completar uno dejó once pendientes.
Consultar/recargar no añadió respuestas, lapses ni fechas nuevas.

La agenda y la retención de 7/30 días proceden del servidor. Las fechas usan
la zona del perfil (Caracas, con navegador UTC en la prueba); el estado atrasado
usa generatedAt del servidor. Las mediciones realizadas muestran fecha y días
reales desde el primer dominio, incluida una medición a aproximadamente 10 días
y otra a 35, con fecha de primera consolidación del objetivo. No se presenta
la consolidación de un objetivo como consolidación de toda la ruta.

El DTO maintenance es opcional para conservar recibos históricos idempotentes.
Su allowlist pública excluye soluciones, payloads, reservas, equivalenceKeys,
rubrics y campos editoriales. Las claves de refuerzo solo se ofrecen cuando el
proveedor existente permite abrirlas. Las reglas de selección, evidencia,
agenda, umbrales, migraciones, autenticación, economía y v1 no se modificaron.
El launcher v1 se conserva; una lectura v2 fallida no cae silenciosamente a v1.

## Comprobaciones

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Contratos build, Node 24.19.0 existente | PASS | contracts-expanded.txt |
| Suite web | 473 PASS, 59 archivos | web-suite-expanded.txt |
| Web final focalizado | 56 PASS | web-focused-final.txt |
| API HTTP/proyección final | 14 PASS | api-routes-projection-final.txt |
| Contrato/selección/agenda/evaluaciones | 85 PASS / 10 SKIP | api-focused-expanded-final.txt |
| Typecheck web/API y lint de archivos afectados | PASS, cero warnings | *-typecheck-final.txt, *-lint-final.txt |
| Harness HTTP real | 1 PASS | http-maintenance-verified.txt |
| Navegador hidratado -> BFF -> Fastify/provider -> PGlite | 7 comprobaciones PASS | browser-maintenance.json |
| 360/390/768/1440 px en estado de agotamiento | Sin overflow de página | browser-maintenance.json |
| Axe del área guided-v2 en tres estados | 0 serious/critical | browser-maintenance.json |
| Preservación, diff y hashes | PASS, sin eliminaciones | preservation.json, source-hashes.json |

La suite web completa precede al ajuste final de redacción del resumen/agenda;
las 56 pruebas focalizadas finales, typecheck y lint verifican ese ajuste.
La última modificación de proyección API se verificó con las 14 pruebas HTTP,
typecheck, lint y el harness/navegador. No se atribuye a las diez pruebas SKIP
ninguna evidencia PostgreSQL independiente.

Se inspeccionaron las capturas exhausted-real-mobile.png (390 px),
review-real-desktop.png y retention-real-desktop.png (1440 px). Se probaron
diagnóstico/omisión/elección de rama/respuestas mediante teclado. Axe solo
inspecciona el área v2; no acredita lector de pantalla, zoom nativo o AppShell.
El motor confirmó los cierres y la persistencia; no se simularon recibos BFF.

## Alcance y límites

Contenido e identidad son sintéticos; DB PGlite nueva y conexiones serializadas,
red HTTP real, reloj Date controlado con eventos sucesivos. No se usaron datos
productivos. El harness no emite sesiones BetterAuth: su GET /api/auth/get-session
devuelve 404 en AppShell, mientras la identidad SSR/BFF usa el helper /v1/auth/me.
Los logs también conservan avisos de desarrollo ajenos al área v2. Esto no
verifica autenticación productiva ni el recorrido completo de T035.

P11 se comprueba localmente; P12/P13 usan la agenda existente y pruebas de
reloj/ausencia; P14/P15 conservan pruebas de selección, reservas y segmentos.
E03/E06 se acreditan únicamente para los subflujos locales descritos, con
matrícula fijada y estado compartido entre ruta/Hoy/sesión/repaso. El recorrido
completo con mapa, ayuda, ocho tipos, dataset grande y fallos de conexión queda
en T035; la auditoría completa de accesibilidad queda en T037. No se declara
PASS del hito S, aceptación editorial/clínica, staging o producción. T024 y
T021 conservan sus límites heredados. No hubo notificaciones ni instalaciones.

Los procesos propios terminaron y los puertos 31032/41032 quedaron cerrados.
README-before-expansion.md/result-before-expansion.json y las vistas estáticas
conservan el borrador anterior; no son la evidencia final integrada. Los logs
iniciales fallidos se conservan: compilación desde cwd incorrecto, fixture con
rationale corto, envío de teclado durante hidratación y eventos con hora igual.
El harness final separa los eventos cronológicamente sin cambiar reglas del motor.

## Reproducción

Desde raíz con Node 24.19.0/pnpm existentes: build de contratos, tests y
typecheck/lint indicados en result.json. Para la comprobación web local:

1. Establecer T032_BROWSER_HOLD=true y ejecutar Node sobre
   apps/api/node_modules/vitest/vitest.mjs run --config
   docs/aprendizaje-guiado/v2/evidencias/T032/vitest.http-maintenance.config.mts.
2. Desde apps/web, API_BASE_URL=http://127.0.0.1:41032 y
   NEXT_PUBLIC_AUTH_URL=http://127.0.0.1:31032; ejecutar Next dev --webpack
   --hostname 127.0.0.1 --port 31032. Esperar ambas instancias listas.
3. Desde raíz: node docs/aprendizaje-guiado/v2/evidencias/T032/browser-maintenance.cjs.
4. POST http://127.0.0.1:41032/__test/stop con JSON vacío; terminar Next.

Los endpoints __test solo existen en este archivo de evidencia y una DB nueva;
no se incorporan a la aplicación. close-evidence.cjs valida reportes, anchos de
captura y preservación antes de escribir el cierre.
`);
console.log('T032 local evidence closed: PASS; original and authorized expanded allowlists preserved.');
