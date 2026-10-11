import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, cpSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve, relative, sep, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const evidence = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidence, '../../../../..');
const source = resolve(root, 'tools/skills/crear-rutas-koraz');
const codexHome = resolve(process.env.CODEX_HOME || join(process.env.USERPROFILE, '.codex'));
const skillsRoot = join(codexHome, 'skills');
const target = join(skillsRoot, 'crear-rutas-koraz');
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const readJson = path => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const local = path => relative(root, path).split(sep).join('/');
const save = (name, data) => writeFileSync(join(evidence, name), JSON.stringify(data, null, 2) + '\n');
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    assert.ok(!entry.isSymbolicLink(), `Enlace no admitido: ${path}`);
    return entry.isDirectory() ? files(path) : [path];
  }).sort();
}
function invoke(command, args, cwd, env = {}) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', windowsHide: true,
    env: { SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP, ...env } });
  assert.equal(result.error, undefined);
  return { command: [command, ...args].join(' '), exitCode: result.status,
    stdout: result.stdout, stderr: result.stderr };
}
assert.equal(Number(process.versions.node.split('.')[0]), 24);
assert.ok(existsSync(codexHome) && existsSync(skillsRoot));
assert.equal(relative(skillsRoot, target), 'crear-rutas-koraz');
assert.ok(!isAbsolute(relative(skillsRoot, target)));
for (const dir of [codexHome, skillsRoot, source]) assert.ok(!lstatSync(dir).isSymbolicLink());
if (existsSync(target)) assert.ok(lstatSync(target).isDirectory() && !lstatSync(target).isSymbolicLink());
assert.ok(!existsSync(join(evidence, 'baseline.json')), 'Conservar evidencia previa antes de repetir instalación.');
const t042 = readJson(join(root, 'docs/aprendizaje-guiado/v2/evidencias/T042/result.json'));
const t045 = readJson(join(root, 'docs/aprendizaje-guiado/v2/evidencias/T045/result.json'));
assert.equal(t042.status, 'PASS');
assert.equal(t042.implementationAcceptance, true);
assert.equal(t042.contract.accepted, true);
assert.equal(t042.contract.frozen, true);
assert.equal(t045.status, 'PASS LOCAL');
assert.equal(t045.K.length, 5);
assert.ok(t045.K.every(check => check.status === 'PASS'));
const accepted = readJson(join(source, 'references/accepted-contract-hashes.json'));
const frozen = accepted.hashes.map(item => ({ ...item, actualSha256: sha(join(root, item.path)) }));
assert.equal(frozen.length, 14);
assert.ok(frozen.every(item => item.sha256 === item.actualSha256));
const sourceFiles = files(source).map(path => ({ path: relative(source, path).split(sep).join('/'),
  sha256: sha(path), bytes: readFileSync(path).length }));
assert.equal(sourceFiles.length, 12);
const testedCopy = join(root, 'docs/aprendizaje-guiado/v2/evidencias/T045/cases/pilot/round-3/skill');
const tested = sourceFiles.map(item => ({ ...item, testedSha256: sha(join(testedCopy, item.path)) }));
assert.ok(tested.every(item => item.sha256 === item.testedSha256), 'Fuente difiere de la copia usada por T045.');
const prior = existsSync(target) ? files(target).map(path => ({ path: relative(target, path).split(sep).join('/'), sha256: sha(path) })) : [];
const unrelatedSkills = files(skillsRoot).filter(path => !path.startsWith(target + sep)).map(path => ({ path, sha256: sha(path) }));
const git = (...args) => invoke('git', args, root, { PATH: process.env.PATH });
const list = git('ls-files', '-z', '--cached', '--others', '--exclude-standard');
assert.equal(list.exitCode, 0);
const registry = 'docs/aprendizaje-guiado/v2/registro-ejecucion.json';
const names = [...new Set([...list.stdout.split('\0').filter(Boolean), ...accepted.hashes.map(item => item.path)])];
const priorFiles = names.filter(name => !name.startsWith(local(evidence) + '/') && name !== registry)
  .filter(name => existsSync(join(root, name)) && lstatSync(join(root, name)).isFile())
  .map(path => ({ path, sha256: sha(join(root, path)) }));
const head = git('rev-parse', 'HEAD');
const status = git('status', '--short');
assert.equal(head.exitCode, 0); assert.equal(status.exitCode, 0);
save('baseline.json', { taskId: 'T046', at: new Date().toISOString(), clientDate: '2026-10-10', timezone: 'America/Caracas',
  baseSha: head.stdout.trim(), statusShort: status.stdout, node: process.version, nodePath: process.execPath,
  authorization: 'continua con t046', codexHomeResolution: process.env.CODEX_HOME ? 'CODEX_HOME' : 'USERPROFILE/.codex fallback',
  codexHome, codexHomeVariableModified: false, skillsRoot, installationPath: target,
  priorInstallationExists: existsSync(target), priorInstallationFiles: prior, sourceFiles, protectedFiles: priorFiles,
  unrelatedSkills, registrySha256: sha(join(root, registry)),
  allowedWrites: [target, 'docs/aprendizaje-guiado/v2/', 'isolated backup of this exact skill if already present'] });
cpSync(join(root, registry), join(evidence, 'registry-before-t046.json'));
save('prerequisite-check.json', { status: 'PASS', t042: { status: t042.status, implementationAcceptance: true,
  originalFullSystemAcceptance: false, deferral: t042.scopeAmendment },
  t045: { status: t045.status, K: t045.K, issues: t045.issues }, frozen, testedSourceIdentity: tested,
  interpretation: 'Installation/documentation authorized; full Hito K acceptance remains subject to original unresolved checks.' });
const originalVerifier = invoke(process.execPath, [join(source, 'scripts/verify-resources.mjs')], evidence);
assert.equal(originalVerifier.exitCode, 0);
save('source-resource-check.json', originalVerifier);
let backupPath = null;
let action = 'new_installation';
if (existsSync(target)) {
  const exact = prior.length === sourceFiles.length && sourceFiles.every(item => prior.some(p => p.path === item.path && p.sha256 === item.sha256));
  if (exact) action = 'already_identical';
  else {
    // Never delete or merge an unrelated existing tree. Preserve it, then stop for a reviewed update.
    backupPath = join(evidence, 'prior-skill-backup');
    cpSync(target, backupPath, { recursive: true, errorOnExist: true, force: false });
    save('existing-installation-conflict.json', { status: 'NO VERIFICADO', backupPath, prior, sourceFiles });
    throw new Error('Instalación previa distinta preservada: preparar actualización específica antes de sustituirla.');
  }
} else cpSync(source, target, { recursive: true, errorOnExist: true, force: false });
const installed = files(target).map(path => ({ path: relative(target, path).split(sep).join('/'), sha256: sha(path), bytes: readFileSync(path).length }));
assert.deepEqual(installed, sourceFiles);
save('installation.json', { status: 'PASS', action, source, destination: target, backupPath,
  installedFiles: installed, exactFileCount: installed.length,
  discoverableLayout: 'skills/crear-rutas-koraz/SKILL.md with name and description',
  liveApplicationDiscovery: 'NO VERIFICADO: current conversation skill catalog is a pre-installation snapshot',
  globalConfigChanged: false, otherSkillsChanged: false, memoriesChanged: false });
const python = join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');
const quick = join(skillsRoot, '.system/skill-creator/scripts/quick_validate.py');
const validation = invoke(python, [quick, target], target, { PYTHONUTF8: '1', PYTHONDONTWRITEBYTECODE: '1',
  PYTHONPATH: join(root, 'docs/aprendizaje-guiado/v2/evidencias/T044/.python-deps') });
save('quick-validate.json', { ...validation, originalValidatorSha256: sha(quick), interpreter: python,
  dependencyReuse: 'T044 isolated PyYAML, no installation or global configuration' });
writeFileSync(join(evidence, 'quick-validate.txt'), validation.stdout + validation.stderr);
assert.equal(validation.exitCode, 0);
const resourceCheck = invoke(process.execPath, [join(target, 'scripts/verify-resources.mjs')], target);
save('installed-resources.json', resourceCheck);
assert.equal(resourceCheck.exitCode, 0);
const cases = [
  { key: 'synthetic', path: 'cases/synthetic/round-2/output/ruta.koraz-route.json', publishable: true },
  { key: 'pilot', path: 'cases/pilot/round-3/output/ruta.koraz-route.json', publishable: false },
  { key: 'adversarial', path: 'cases/adversarial/output/ruta.koraz-route.json', publishable: false },
];
const cli = [];
for (const item of cases) {
  const input = join(root, 'docs/aprendizaje-guiado/v2/evidencias/T045', item.path);
  assert.equal(sha(input), t045.generatedPackages[item.key].sourceFileSha256);
  for (const publish of [false, true]) {
    const result = invoke(process.execPath, ['--permission', `--allow-fs-read=${target}`, `--allow-fs-read=${input}`,
      join(target, 'scripts/validate-route.mjs'), ...(publish ? ['--publish'] : []), input], target);
    const expectedExit = publish && !item.publishable ? 1 : 0;
    assert.equal(result.exitCode, expectedExit);
    const output = JSON.parse(result.stdout);
    assert.equal(output.valid, true);
    assert.equal(output.publishable, item.publishable);
    assert.equal(output.scope, 'portable');
    cli.push({ case: item.key, publish, expectedExit, input: local(input), inputSha256: sha(input), ...result, output });
  }
}
const example = invoke(process.execPath, [join(target, 'scripts/validate-route.mjs'), '--publish',
  join(target, 'assets/ejemplo-valido.koraz-route.json')], evidence);
assert.equal(example.exitCode, 0);
cli.push({ case: 'installed-example-from-unrelated-cwd', ...example, output: JSON.parse(example.stdout) });
save('installed-cli.json', { status: 'PASS', node: process.version, checksCount: cli.length, checks: cli,
  portableOnly: true, backendInvoked: false, writesToInputs: false });
console.log(JSON.stringify({ installation: 'PASS', destination: target, files: installed.length,
  quickValidate: 'PASS', resourceCheck: 'PASS', cliChecks: cli.length, originalFullHitoK: false }));
