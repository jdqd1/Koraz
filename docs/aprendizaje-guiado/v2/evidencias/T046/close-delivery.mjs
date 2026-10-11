import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, readdirSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve, relative, sep, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const evidence = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidence, '../../../../..');
const docs = resolve(evidence, '../..');
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const json = path => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const local = path => relative(root, path).split(sep).join('/');
const save = (name, data) => writeFileSync(join(evidence, name), JSON.stringify(data, null, 2) + '\n');
const baseline = json(join(evidence, 'baseline.json'));
const install = json(join(evidence, 'installation.json'));
const t042 = json(join(docs, 'evidencias/T042/result.json'));
const t043 = json(join(docs, 'evidencias/T043/result.json'));
const t044 = json(join(docs, 'evidencias/T044/result.json'));
const t045 = json(join(docs, 'evidencias/T045/result.json'));
const now = new Date().toISOString();
const mode = process.argv[2];
const git = (...args) => {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true });
  assert.equal(result.error, undefined); assert.equal(result.status, 0, result.stderr);
  return result.stdout;
};
const currentFiles = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const path = join(dir, entry.name); assert.ok(!entry.isSymbolicLink());
  return entry.isDirectory() ? currentFiles(path) : [path];
}).sort();
if (mode === 'prepare') {
  assert.ok(Date.parse(t042.at) < Date.parse(t043.at) && Date.parse(t043.at) < Date.parse(t044.at)
    && Date.parse(t044.at) < Date.parse(t045.at));
  const acta = readFileSync(join(docs, 'acta-HITO-S.md'), 'utf8');
  const inherited = acta.split('\n').filter(line => /^\| Q\d{2} \|/.test(line)).map(line => {
    const cells = line.split('|').map(cell => cell.trim());
    const id = cells[1];
    const inheritedLinks = [...cells.slice(3).join('|').matchAll(/\]\(([^)]+)\)/g)].map(match => {
      const path = join(docs, match[1]); assert.ok(existsSync(path), `Falta evidencia de ${id}: ${path}`);
      return local(path);
    });
    return { id, status: cells[2].includes('NO VERIFICADO') ? 'NO VERIFICADO' : 'PASS',
      verificationKind: 'INHERITED_FROM_T042_NOT_RERUN', evidence: inheritedLinks,
      note: id === 'Q19' ? 'Q19/V04 aplazado por usuario; teclado/móvil/zoom/axe preservados, lector y discrepancia manual pendientes.' : 'Resultado local de T042 preservado; ver alcance exacto en su acta.' };
  });
  assert.equal(inherited.length, 24);
  const skillCommits = git('log', '--format=%H', '--', 'tools/skills/crear-rutas-koraz').trim().split('\n').filter(Boolean);
  const extra = [
    { id: 'Q25', status: 'NO VERIFICADO', adjustedImplementationGate: 'PASS',
      note: 'T042 acepta provisionalmente implementación antes de T043–T045. Hito S original completo no aceptado; sin primer commit de skill. La cronología documental no se presenta como historial de commits.',
      evidence: ['docs/aprendizaje-guiado/v2/evidencias/T042/reader-deferral.json',
        'docs/aprendizaje-guiado/v2/evidencias/T043/prerequisite-check.json',
        'docs/aprendizaje-guiado/v2/evidencias/T046/prerequisite-check.json'],
      chronologyUtc: { T042: t042.at, T043: t043.at, T044: t044.at, T045: t045.at }, skillCommitCount: skillCommits.length },
    { id: 'Q26', status: 'PASS', verificationKind: 'LOCAL_PORTABLE',
      note: 'Contrato provisional congelado e identidad 6+14 comprobados; aislamiento limpio de T043/T045 e instalación exacta T046, sin afirmar accesibilidad completa.',
      evidence: ['docs/aprendizaje-guiado/v2/evidencias/T043/portability.json',
        'docs/aprendizaje-guiado/v2/evidencias/T045/portable-checks.json',
        'docs/aprendizaje-guiado/v2/evidencias/T046/installed-resources.json',
        'docs/aprendizaje-guiado/v2/evidencias/T046/installed-cli.json'] },
    { id: 'Q27', status: 'PASS', verificationKind: 'INHERITED_HTTP_POSTGRES_PLUS_INSTALLED_CLI',
      note: 'Guía+tema genera paquetes, tres round trips y recorrido ficticio persistido por HTTP/PostgreSQL. Browser del nuevo paquete y aprobación/publicación del nuevo piloto médico NO VERIFICADOS.',
      evidence: ['docs/aprendizaje-guiado/v2/evidencias/T045/result.json',
        'docs/aprendizaje-guiado/v2/evidencias/T045/http-journey.json',
        'docs/aprendizaje-guiado/v2/evidencias/T045/content-audit.json',
        'docs/aprendizaje-guiado/v2/evidencias/T045/browser-policy-limitation.json'] },
    { id: 'Q28', status: 'PASS', verificationKind: 'DOCUMENTATION_DELIVERED',
      note: 'Manuales admin/alumno/importación/skill, runbook de operación/mantenimiento, incidencias y límites entregados. ZIP e inventario verificados en el cierre.',
      evidence: ['docs/aprendizaje-guiado/v2/manuales/administracion.md', 'docs/aprendizaje-guiado/v2/manuales/alumno.md',
        'docs/aprendizaje-guiado/v2/manuales/importacion.md', 'docs/aprendizaje-guiado/v2/manuales/skill.md',
        'docs/aprendizaje-guiado/v2/runbook.md', 'docs/aprendizaje-guiado/v2/entrega/README.md'] },
  ];
  const checks = [...inherited, ...extra];
  checks.forEach(check => check.evidence.forEach(path => assert.ok(existsSync(join(root, path)))));
  const summary = { pass: checks.filter(check => check.status === 'PASS').length,
    fail: checks.filter(check => check.status === 'FAIL').length,
    notVerified: checks.filter(check => check.status === 'NO VERIFICADO').length };
  assert.deepEqual(summary, { pass: 26, fail: 0, notVerified: 2 });
  save('checklist-final.json', { at: now, clientDate: '2026-10-10', timezone: 'America/Caracas',
    basis: 'Original Q01–Q28; original full system acceptance distinguished from user-adjusted continuation gate',
    status: 'NO VERIFICADO', summary, checks, implementationException: t042.scopeAmendment,
    originalHitoS: false, originalHitoK: false, localInstallationDocumentation: 'PASS', productionVerified: false });
  const table = checks.map(check => `| ${check.id} | ${check.status} | ${check.note} |`).join('\n');
  writeFileSync(join(docs, 'acta-HITO-K.md'), `# Acta de entrega de Hito K — T046\n\n` +
    `**Hito K original: NO VERIFICADO. Instalación y documentación: PASS local.** Fecha del usuario: 10/10/2026, America/Caracas. Base: \`${baseline.baseSha}\`. Registro UTC: ${now}.\n\n` +
    `La petición «continua con t046» autoriza instalación, documentación y cierre de esta ficha. T042 permite continuación bajo excepción expresa del usuario; T045 registra PASS LOCAL K01–K05 por CLI y HTTP/PostgreSQL. Se preservan sus evidencias y límites. No se transforma la aceptación provisional en Hito S original completo.\n\n` +
    `## Entrega comprobada\n\n` +
    `Skill instalada en \`${install.destination}\`: 12/12 archivos idénticos a la copia probada de T045, sin instalación previa que respaldar. CODEX_HOME se resolvió por USERPROFILE/.codex; no se modificó la variable. Validador original de skills exit 0; seis recursos y 14 archivos del contrato congelado coinciden. Siete comprobaciones CLI desde destino conservan resultados y bloqueos de los tres paquetes originales. [Instalación](evidencias/T046/installation.json), [validaciones](evidencias/T046/installed-cli.json).\n\n` +
    `Manuales [administración](manuales/administracion.md), [alumno](manuales/alumno.md), [importación](manuales/importacion.md) y [skill](manuales/skill.md), con [runbook](runbook.md). [Entrega y ZIP](entrega/README.md). La carpeta cumple el formato descubrible; disponibilidad efectiva en un catálogo de conversación nueva NO VERIFICADA.\n\n` +
    `## Checklist original\n\n` +
    `**26 PASS locales/heredados, 0 FAIL y 2 NO VERIFICADO: Q19 y Q25 originales.** Q25 sí pasa el gate ajustado de implementación provisional en orden T042 → T043 → T044 → T045; no existe primer commit de la skill y no se fabrica esa prueba histórica. Q26–Q28 pasan con el alcance indicado. Q01–Q24 proceden del acta T042 y no son una repetición global en T046. [Checklist con enlaces por criterio](evidencias/T046/checklist-final.json), [acta de Hito S](acta-HITO-S.md).\n\n` +
    `| ID | Estado | Alcance y límites |\n|---|---|---|\n${table}\n\n` +
    `## Incidencias que conservan la aceptación completa pendiente\n\n` +
    `- Q19/V04: lector real y discrepancia manual aplazados expresamente por el usuario, sin convertirlos en PASS. [Excepción exacta](evidencias/T042/reader-deferral.json). Q25 original depende del Hito S completo que aún no se acredita.\n` +
    `- T045: recorrido de UI del nuevo paquete NO VERIFICADO. La revisión automática rechazó arrancar Next de test con «blocked by policy», sin motivo adicional registrado. No se repitió ni se eludió esa acción en T046. [Limitación](evidencias/T045/browser-policy-limitation.json).\n` +
    `- Nuevo piloto médico: SOURCE_UNRESOLVED y SOURCE_CONFLICT preservados; aprobación humana del nuevo hash y publicación NO VERIFICADAS. La aprobación T039 corresponde a otro paquete. [Revisión final del nuevo piloto](evidencias/T045/cases/pilot/round-3/output/revision-de-ruta.md).\n` +
    `- Disponibilidad de skill en conversación nueva, staging, producción y dispositivos físicos NO VERIFICADOS. Better Auth real tiene prueba local propia T042; T045 usa identidades fixture. No se afirma eficacia educativa o competencia clínica.\n\n` +
    `La entrega puede utilizarse para generar borradores y continuar la revisión autorizada. El cierre original 28/28 exige resolver o ajustar expresamente sus requisitos pendientes y registrar la evidencia correspondiente. No se solicita una nueva excepción para convertir la checklist en verde.\n\n` +
    `## Preservación\n\n` +
    `Sin cambios de producto, contratos, políticas, dependencias, migraciones, otras skills, memorias o configuración global. El registro compartido sincroniza T043–T045 desde sus dossiers sin reescribirlos y registra T046 con estado NO VERIFICADO para aceptación total y entrega local PASS. [Baseline y verificación final](evidencias/T046/closure-check.json). Sin commit, despliegue ni producción. nextTaskStarted:false; no hay sucesor iniciado.\n`);
  const issues = [
    { id: 'Q19/V04', status: 'NO VERIFICADO', disposition: 'DEFERRED_BY_USER', evidence: t042.scopeAmendment },
    { id: 'Q25-original', status: 'NO VERIFICADO', adjustedImplementationGate: 'PASS', reason: 'Full original Hito S not accepted; no first skill commit. Documentary provisional order preserved.' },
    ...t045.issues.filter(issue => !issue.item.includes('Q19')),
    { id: 'live-skill-discovery', status: 'NO VERIFICADO', reason: 'Installation layout verified; current conversation catalog predates installation.' },
  ];
  const result = { taskId: 'T046', status: 'NO VERIFICADO', localDeliveryStatus: 'PASS',
    decision: 'deliver_installation_documentation_preserve_pending_full_acceptance', at: now,
    clientDate: '2026-10-10', timezone: 'America/Caracas', baseSha: baseline.baseSha,
    authorization: { requestExact: 'continua con t046', scope: 'T046 allowlist: exact user skill, v2 docs, isolated backup if needed' },
    predecessors: [{ taskId: 'T042', status: 'PASS', implementationAcceptance: true, originalSystemAcceptance: false },
      { taskId: 'T045', status: 'PASS LOCAL', K01_K05: 'PASS', browser: 'NO VERIFICADO' }],
    installation: { path: install.destination, status: 'PASS', files: 12, identicalToTestedT045: true,
      priorInstallation: false, backupRequired: false, codexHomeVariableModified: false, liveDiscovery: 'NO VERIFICADO' },
    changedFiles: ['C:/Users/josed/.codex/skills/crear-rutas-koraz/',
      'docs/aprendizaje-guiado/v2/manuales/', 'docs/aprendizaje-guiado/v2/entrega/README.md',
      'docs/aprendizaje-guiado/v2/acta-HITO-K.md', 'docs/aprendizaje-guiado/v2/registro-ejecucion.json',
      'docs/aprendizaje-guiado/v2/evidencias/T046/'],
    checks: [
      { command: 'Compare 12 source files with tested T045 copy and installed destination; verify six resources and fourteen accepted hashes', exitCode: 0, result: 'PASS', evidence: 'installation.json; prerequisite-check.json; installed-resources.json' },
      { command: 'Original quick_validate.py against installation with isolated existing PyYAML', exitCode: 0, result: 'PASS', evidence: 'quick-validate.json' },
      { command: 'Installed CLI: three generated packages draft/publish plus installed example from other cwd', exitCode: 0, result: '7 PASS; expected publication rejections retained', evidence: 'installed-cli.json' },
      { command: 'Document link review, delivery ZIP integrity and preservation checks', result: 'See final closure-check.json and delivery-archive-check.json', evidence: 'closure-check.json; delivery-archive-check.json' },
    ], summary, checklist: 'checklist-final.json', issues,
    originalAcceptanceCriteriaSatisfied: false, originalFullSystemAcceptance: false, originalHitoKAcceptance: false,
    acceptedContractChanged: false, productCodeChanged: false, registrySynchronizedFromExistingEvidence: ['T043', 'T044', 'T045'],
    otherSkillsChanged: false, globalConfigChanged: false, memoriesChanged: false, productionTouched: false,
    deployed: false, committed: false, nextTaskStarted: false, nextTaskIds: [],
    evidence: ['docs/aprendizaje-guiado/v2/evidencias/T046/result.json', 'docs/aprendizaje-guiado/v2/acta-HITO-K.md'] };
  save('result.json', result);
  const registryPath = join(docs, 'registro-ejecucion.json');
  const registry = json(join(evidence, 'registry-before-t046.json'));
  for (const record of [t043, t044, t045, result]) {
    const task = registry.tasks.find(task => task.taskId === record.taskId); assert.ok(task);
    Object.assign(task, { status: record.status === 'PASS LOCAL' ? 'PASS' : record.status,
      resultStatus: record.status, at: record.at, baseSha: record.baseSha,
      evidence: [`docs/aprendizaje-guiado/v2/evidencias/${record.taskId}/result.json`,
        `docs/aprendizaje-guiado/v2/evidencias/${record.taskId}/README.md`],
      issues: record.issues, acceptanceScope: record.taskId === 'T046' ? 'Installation/documentation PASS; original full acceptance NO VERIFICADO' : 'Local scope per immutable task dossier',
      nextTaskStarted: false, historicalResultNotRerun: record.taskId !== 'T046' });
    if (record.taskId === 'T046') Object.assign(task, { localDeliveryStatus: 'PASS', originalHitoKAcceptance: false, nextTaskIds: [] });
  }
  registry.nextTaskIds = [];
  registry.nextAuthorizedTaskIds = [];
  registry.continuationRequiresUserInstruction = true;
  registry.note = 'T046 installation/documentation delivered PASS local. Original Hito K NO VERIFICADO; Q19 deferred, Q25 original not satisfied, T045 browser and new medical pilot approval pending. T043–T045 synchronized from their preserved dossiers.';
  registry.latestDelivery = { taskId: 'T046', at: now, localDeliveryStatus: 'PASS', originalHitoKAcceptance: false,
    evidence: 'docs/aprendizaje-guiado/v2/evidencias/T046/result.json' };
  writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');
  writeFileSync(join(evidence, 'README.md'), `# T046 — instalación, manuales y entrega\n\n` +
    `**Instalación/documentación: PASS local. Aceptación original completa de T046 y Hito K: NO VERIFICADO.** Fecha del usuario 10/10/2026, America/Caracas; base \`${baseline.baseSha}\`.\n\n` +
    `Se ejecutó únicamente «continua con t046». [Fuente vs copia probada T045, aceptación provisional y hashes](prerequisite-check.json). [Skill instalada](installation.json): 12 archivos exactos en \`${install.destination}\`. No existía instalación anterior; no hubo sobrescritura ni necesidad de backup. CODEX_HOME ausente se resolvió por USERPROFILE/.codex, sin modificar variables o configuración. [Baseline](baseline.json).\n\n` +
    `## Comprobaciones nuevas\n\n` +
    `- [quick_validate.py original](quick-validate.json): exit 0, Skill is valid! Python 3.12 del runtime; PyYAML aislado T044 reutilizado sin escribir bytecode ni instalar paquetes.\n` +
    `- [Verifier desde destino](installed-resources.json): seis recursos congelados PASS; 14 archivos de aceptación también comprobados.\n` +
    `- [CLI instalado](installed-cli.json): siete comprobaciones PASS; los tres archivos generados exactos de T045 en borrador/publicación y ejemplo instalado desde cwd ajeno. Exit 1 esperado en publicación del piloto/adversarial, sin suprimir incidencias.\n` +
    `- [Preservación y links](closure-check.json), [ZIP y hashes](delivery-archive-check.json), [manifest](delivery-manifest.json). Conteos exactos de preservación en la verificación final.\n\n` +
    `La prueba de instalación no repite autoría, importación HTTP, navegador o PostgreSQL. La evidencia T045 permanece intacta: 11 portables, tres round trips, 13 intentos/71 peticiones en sintético, reinicio/replay y consolidación con reloj controlado. No se agregan estos conteos a las siete comprobaciones nuevas.\n\n` +
    `## Entrega\n\n` +
    `[Manuales e índice](../../entrega/README.md), [acta final](../../acta-HITO-K.md), [checklist Q01–Q28](checklist-final.json), [resultado](result.json), [ZIP](entrega-koraz-guided-v2.zip). Registro sincronizado T043–T045 desde sus dossiers; historial anterior preservado en [registry-before-t046.json](registry-before-t046.json). No se cambia el status de los dossiers originales.\n\n` +
    `## Límites\n\n` +
    `26 PASS y 2 NO VERIFICADO en checklist original: Q19/V04 aplazado; Q25 original sin aceptación Hito S completa. Gate provisional de Q25 sí cumplido en orden documental, sin primer commit de skill. T045 browser pendiente por rechazo automático previo «blocked by policy»; no se reintentó esa acción. Nuevo piloto con dos incidencias, revisión médica/publicación pendiente. Skill estructuralmente descubrible; catálogo de nueva conversación NO VERIFICADO. Sin cambios de producto, otras skills, memorias, configuración, producción, commit o despliegue. **nextTaskStarted:false**.\n`);
  console.log(JSON.stringify({ prepared: true, checklist: summary, resultStatus: result.status, localDelivery: 'PASS' }));
} else if (mode === 'verify') {
  const protectedChanged = baseline.protectedFiles.filter(item => !existsSync(join(root, item.path)) || sha(join(root, item.path)) !== item.sha256);
  assert.deepEqual(protectedChanged, []);
  assert.equal(git('rev-parse', 'HEAD').trim(), baseline.baseSha);
  const otherSkillsChanged = baseline.unrelatedSkills.filter(item => !existsSync(item.path) || sha(item.path) !== item.sha256);
  assert.deepEqual(otherSkillsChanged, []);
  const priorSkillPaths = new Set(baseline.unrelatedSkills.map(item => item.path));
  const newOtherSkills = currentFiles(baseline.skillsRoot).filter(path => !path.startsWith(install.destination + sep) && !priorSkillPaths.has(path));
  assert.deepEqual(newOtherSkills, []);
  const installedFiles = currentFiles(install.destination).map(path => ({ path: relative(install.destination, path).split(sep).join('/'), sha256: sha(path), bytes: readFileSync(path).length }));
  assert.deepEqual(installedFiles, baseline.sourceFiles);
  const oldRegistry = json(join(evidence, 'registry-before-t046.json'));
  const newRegistry = json(join(docs, 'registro-ejecucion.json'));
  const changedTasks = ['T043', 'T044', 'T045', 'T046'];
  assert.deepEqual(newRegistry.tasks.filter(task => !changedTasks.includes(task.taskId)), oldRegistry.tasks.filter(task => !changedTasks.includes(task.taskId)));
  for (const key of Object.keys(oldRegistry).filter(key => !['tasks', 'note', 'nextTaskIds', 'nextAuthorizedTaskIds', 'continuationRequiresUserInstruction'].includes(key)))
    assert.deepEqual(newRegistry[key], oldRegistry[key], `Registry historical field changed: ${key}`);
  const newFiles = git('ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0').filter(Boolean)
    .filter(path => !baseline.protectedFiles.some(item => item.path === path) && path !== 'docs/aprendizaje-guiado/v2/registro-ejecucion.json');
  const outsideAllowlist = newFiles.filter(path => !path.startsWith('docs/aprendizaje-guiado/v2/'));
  assert.deepEqual(outsideAllowlist, []);
  // Make the linked report exist while checking its own links; do not mark it PASS before verification.
  save('closure-check.json', { status: 'NO VERIFICADO', verificationInProgress: true });
  const markdown = [...currentFiles(join(docs, 'manuales')), join(docs, 'entrega/README.md'), join(docs, 'acta-HITO-K.md'), join(evidence, 'README.md')].filter(path => path.endsWith('.md'));
  const links = [];
  for (const file of markdown) for (const match of readFileSync(file, 'utf8').matchAll(/\]\(([^)]+)\)/g)) {
    if (/^(https?:|codex:)/.test(match[1])) continue;
    const path = resolve(dirname(file), match[1].split('#')[0]);
    assert.ok(existsSync(path), `Link roto ${local(file)} -> ${match[1]}`);
    links.push({ from: local(file), href: match[1], to: local(path) });
  }
  git('diff', '--check');
  const whitespace = [];
  for (const path of markdown) {
    const lines = readFileSync(path, 'utf8').split('\n');
    lines.forEach((line, index) => { if (/[ \t]+$/.test(line)) whitespace.push({ file: local(path), line: index + 1 }); });
  }
  assert.deepEqual(whitespace, []);
  assert.equal(json(join(evidence, 'delivery-archive-check.json')).status, 'PASS');
  save('closure-check.json', { status: 'PASS', at: new Date().toISOString(), baseSha: baseline.baseSha,
    protectedFilesUnchanged: baseline.protectedFiles.length, protectedChanged,
    otherSkillFilesUnchanged: baseline.unrelatedSkills.length, otherSkillsChanged, newOtherSkills,
    installedFilesIdentical: installedFiles.length, registryHistoricalTasksPreserved: oldRegistry.tasks.length - changedTasks.length,
    registrySynchronizedTaskIds: changedTasks, newFilesOutsideAllowlist: outsideAllowlist,
    documentFilesReviewed: markdown.length, documentLinksChecked: links.length, links,
    whitespaceErrors: whitespace, gitDiffCheck: 'PASS', acceptedContractChanged: false,
    productCodeChanged: false, productionTouched: false, nextTaskStarted: false });
  console.log(JSON.stringify({ preservation: 'PASS', protectedFiles: baseline.protectedFiles.length,
    unrelatedSkillFiles: baseline.unrelatedSkills.length, links: links.length, gitDiffCheck: 'PASS' }));
} else throw new Error('Use prepare or verify. Preserve baseline before rerunning installation.');
