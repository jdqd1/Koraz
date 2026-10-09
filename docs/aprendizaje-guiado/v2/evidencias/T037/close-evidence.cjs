const fs = require('node:fs');
const path = require('node:path');
const read = name => JSON.parse(fs.readFileSync(path.join(__dirname, name)));
const browser = read('closure-playwright.json');
const recheck = read('reflow-recheck-playwright.json');
const matrix = read('browser-matrix-summary.json');
const audit = read('audit-summary.json');
const preservation = read('preservation.json');
const database = read('database-cleanup-verification.json');
const services = read('services-cleanup.json');
const visual = read('visual-review.json');
const exits = read('checks-exits.json');
const sources = read('source-hashes.json');
if (matrix.passed !== 18 || matrix.skipped !== 3 || matrix.failed || browser.stats.flaky || browser.errors.length || recheck.stats.unexpected || recheck.stats.flaky || recheck.errors.length) throw Error('Browser closure incomplete');
if (audit.audits !== 135 || audit.seriousCritical || audit.pageOverflows.length) throw Error('Audit closure incomplete');
if ([preservation, database, services, visual].some(r => r.status !== 'PASS')) throw Error('Preservation, cleanup or visual review incomplete');
if (Object.values(exits).some(r => r.exitCode !== 0)) throw Error('A command did not pass');
const result = {
  taskId: 'T037', status: 'PASS', scope: 'LOCAL: synthetic fixtures, real Fastify/BFF/Next UI and independent disposable PostgreSQL',
  closedAt: new Date().toISOString(), timezone: 'America/Caracas',
  baseSha: '11737fd84562ee5a65e9ef124442b82f9aa16785', request: 'continua con t037; continua',
  authorization: { ficha: 'HANDOFF-EJECUTOR.md T037, section 8.12, V01-V05', extensionsRequired: false },
  predecessors: [{ task: 'T035', status: 'PASS', evidence: '../T035/result.json' }, { task: 'T036', status: 'PASS', evidence: '../T036/result.json' }],
  productFiles: sources.filter(s => !s.path.includes('/tests/')), testFile: 'apps/web/tests/e2e/guided-v2-accessibility.spec.ts',
  preservation: { status: preservation.status, baselineFiles: preservation.baselineFiles, unchangedFiles: preservation.unchangedFiles,
    existingFilesModified: preservation.authorizedChanges.length, newProductFiles: ['apps/web/src/components/learning/v2/player.module.css'],
    unexpectedChanges: preservation.unexpectedChanges, evidence: 'preservation.json' },
  checks: { commands: exits,
    browser: { status: 'PASS', passed: 18, intentionalSkips: 3, failed: 0, method: matrix.method,
      rawCompleteRun: browser.stats, affectedScreenRecheck: recheck.stats,
      reasonForSkips: 'Native browser zoom runs once in desktop Edge; small viewport projects intentionally skip that case',
      reports: ['closure-playwright.json', 'reflow-recheck-playwright.json', 'browser-matrix-summary.json'], logs: ['browser-closure.txt', 'browser-reflow-recheck.txt'] },
    axe: { status: 'PASS', auditedScreens: 135, seriousCritical: 0, pageOverflows: 0, exclusions: [], evidence: 'audit-summary.json' },
    screenshots: { auditedScreens: 135, viewportAndFullPagePngs: 270, gallery: 'gallery.html' },
    regressions: [{ passed: 482, files: 62, log: 'web-regression.txt', stage: 'Initial broad web regression' },
      { passed: 135, files: 12, log: 'affected-regression-closure.txt', stage: 'Editor and map after local dialog corrections' },
      { passed: 112, files: 10, log: 'player-regression-closure.txt', stage: 'Final v2 player, including scoped CSS module' }],
    regressionCountsOverlap: true, visual: { status: 'PASS', evidence: 'visual-review.json', humanSignoff: false },
    cleanup: { status: 'PASS', database: 'database-cleanup-verification.json', services: 'services-cleanup.json' } },
  checklist: {
    V01: { status: 'PASS', evidence: 'audit-summary.json' },
    V02: { status: 'PASS', evidence: 'closure-playwright.json', coverage: 'E01 keyboard creation/persistence, Tab, tabs, matching, sequence, dialog pointer centers/cancel/Escape/restored focus' },
    V03: { status: 'PASS', viewports: ['1440x900', '360x800', '390x844', '768x1024'], zoom: 'CSS 200% on all viewports; native Edge 200%, CSS viewport 720x450/DPR2; focused field center and corners reachable', evidence: 'gallery.html' },
    V04: { accessibilityTree: 'PASS', screenReader: 'NO VERIFICADO', evidence: ['accessibility-tree-summary.json', 'screen-reader.json'], fullWcagCertification: false },
    V05: { status: 'PASS', coverage: 'Touch/pointer, letterboxing, <=1 rendered pixel, preserved normalized coordinates at image zoom200, arrows and server-confirmed text alternative', imageFixture: 'Synthetic one-pixel image' },
  },
  notes: ['Earlier failing runs retained. The complete 21-case run is closure-playwright.json; affected-screen rechecks are reflow-recheck-playwright.json. Latest per-case outcomes are explicit in browser-matrix-summary.json.',
    'CSS and labels remain within T037; server-authoritative learning behavior and eight activity kinds are preserved.',
    'React review found no new data fetching, effect-driven derived state, request state or additional dependency.'],
  notVerified: ['Spoken screen-reader output', 'Physical mobile devices', 'Clinical image readability/content', 'Better Auth cookie issuance/signature', 'Full WCAG or human accessibility certification', 'Hito S/system, staging and production'],
  deploymentPerformed: false, commitCreated: false, nextTaskStarted: false, nextTask: 'T038',
};
fs.writeFileSync(path.join(__dirname, 'result.json'), JSON.stringify(result, null, 2));
const file = path.join(__dirname, 'README.md');
let text = fs.readFileSync(file, 'utf8')
  .replace('Estado de cierre: **EN CURSO**. La ejecución final de navegador y la inspección de la galería deben terminar antes de cerrar la ficha.', 'Estado de cierre: **PASS local**, con inspección de lector de pantalla **NO VERIFICADO**. Fecha: 2026-10-06.')
  .replace('## Validación en curso', '## Validación')
  .replace('Compilación final del producto: `build-web-complete.txt`, PASS. Contratos: `contracts-build.txt`, PASS. Los resultados finales de navegador, tipos, lint, creación por teclado y limpieza se añadirán al cierre.', 'Compilación final: `build-web-header-final.txt`, PASS. Contratos: `contracts-build.txt`, PASS. Tipos y lint: `typecheck-final-state.txt` y `lint-final-state.txt`, PASS. `checks-exits.json` registra los códigos de salida comprobados. `git diff --check`, PASS.');
text += `\n## Resultado final y checklist\n\nLa ejecución completa final, \`closure-playwright.json\`, terminó con **18 PASS, 3 SKIP intencionales y 0 FAIL**. Los tres SKIP corresponden al zoom nativo, ejecutado una vez en el proyecto desktop de Edge. Se conservaron los intentos previos y sus fallos; la ejecución final incorpora todas las correcciones. \`browser-matrix-summary.json\` conserva la trazabilidad por caso.\n\nLa [galería](gallery.html) contiene **135 pantallas auditadas y 270 capturas PNG**, con informes axe de página completa, árbol accesible y geometría. Resultado: **0 serious/critical y 0 desbordes de página**. La revisión visual de capturas por Codex se detalla en \`visual-review.json\`; no constituye aprobación humana.\n\n| Criterio | Resultado |\n| --- | --- |\n| V01 | PASS: axe completo, sin exclusiones. |\n| V02 | PASS: teclado, persistencia E01, diálogo y devolución de foco; botones alcanzables. |\n| V03 | PASS: cuatro viewports, zoom CSS/nativo, campos y cabeceras legibles sin solapamiento. |\n| V04 | Árbol accesible PASS; lector de pantalla **NO VERIFICADO**. |\n| V05 | PASS: touch/puntero, letterboxing, coordenadas, zoom de imagen, flechas y alternativa de texto. |\n\n[Checklist detallado](CHECKLIST.md) · [Resultado estructurado](result.json). Las regresiones finales de editor/mapa (135/12 archivos) y reproductor (112/10 archivos) pasan; se solapan con las 482 pruebas amplias iniciales y no se suman. Los 1911 archivos preexistentes fuera de los diez cambios autorizados conservaron su hash; se añadió un CSS local de v2. Las bases identificadas de esta ficha se eliminaron mediante el cierre cooperativo del servidor de pruebas; se verificó su ausencia, cero conexiones cliente y el apagado del clúster desechable. Los puertos de los tres servicios de prueba quedaron libres. No se borraron bases ajenas.\n\n**T038 no iniciada.**\n`;
text = text.replace(/La ejecución completa final,[^\n]+/, `La matriz consolidada por caso/proyecto terminó con **18 PASS, 3 SKIP intencionales y 0 FAIL pendientes**. El recorrido completo de 21 casos (\`closure-playwright.json\`) registró ${browser.stats.expected} PASS, ${browser.stats.skipped} SKIP y ${browser.stats.unexpected} FAIL; la repetición de las pantallas afectadas (\`reflow-recheck-playwright.json\`) terminó con ${recheck.stats.expected} PASS y 0 FAIL. Los informes originales se conservan; \`browser-matrix-summary.json\` muestra el historial y el último resultado de cada caso. Los tres SKIP corresponden al zoom nativo, ejecutado una vez en desktop Edge.`);
fs.writeFileSync(file, text);
const checklist = path.join(__dirname, 'CHECKLIST.md');
fs.writeFileSync(checklist, fs.readFileSync(checklist, 'utf8').replace('Estado: pendiente de la ejecución completa de cierre. Los resultados definitivos se registran en `result.json`.', 'Estado: **PASS local**, con lector de pantalla **NO VERIFICADO**. Resultados en `result.json`; recorrido completo y repeticiones afectadas trazados en `browser-matrix-summary.json`.'));
console.log(JSON.stringify({ taskId: result.taskId, status: result.status, nextTaskStarted: false }));
