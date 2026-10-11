import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, cpSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const evidence = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidence, '../../../../..');
const skill = resolve(root, 'tools/skills/crear-rutas-koraz');
const read = (path) => readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
const json = (path) => JSON.parse(read(path));
const sha = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const local = (path) => relative(root, path).split(sep).join('/');
const checks = [];
const run = (name, action) => {
  try { const detail = action(); checks.push({ name, status: 'PASS', detail }); }
  catch (error) { checks.push({ name, status: 'FAIL', error: error.stack }); }
};
const work = resolve(evidence, 'validator-cases');
mkdirSync(work, { recursive: true });
const invoke = (script, args = [], fsRoot = skill) => {
  const result = spawnSync(process.execPath, ['--permission', `--allow-fs-read=${fsRoot}`,
    `--allow-fs-read=${work}`, resolve(fsRoot, 'scripts', script), ...args], {
    cwd: work, encoding: 'utf8', env: { SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP },
  });
  assert.equal(result.error, undefined);
  assert.equal(result.stderr, '');
  return { exitCode: result.status, output: JSON.parse(result.stdout) };
};
run('T043 PASS and six unchanged frozen resources plus fourteen accepted repository hashes', () => {
  const predecessor = json(resolve(root, 'docs/aprendizaje-guiado/v2/evidencias/T043/result.json'));
  const manifest = json(resolve(skill, 'references/contract-runtime.json'));
  assert.equal(predecessor.status, 'PASS');
  assert.equal(predecessor.implementationAcceptance, true);
  assert.equal(predecessor.originalFullSystemAcceptance, false);
  assert.equal(manifest.deferredCheckStatus, 'NO VERIFICADO');
  assert.equal(manifest.acceptanceKind, 'provisional_implementation_with_user_exception');
  const frozen = json(resolve(skill, 'references/accepted-contract-hashes.json'));
  const resources = manifest.resources.map(({ path, sha256 }) => ({ path, sha256, matches: sha(resolve(skill, path)) === sha256 }));
  const hashes = frozen.hashes.map(({ path, sha256 }) => ({ path, sha256, matches: sha(resolve(root, path)) === sha256 }));
  assert.equal(resources.length, 6);
  assert.equal(hashes.length, 14);
  assert.ok(resources.every(({ matches }) => matches));
  assert.ok(hashes.every(({ matches }) => matches));
  return { resources, hashes, deferredCheck: manifest.deferredCheck, originalFullSystemAcceptance: false };
});
run('All skill Markdown local links resolve', () => {
  const files = [resolve(skill, 'SKILL.md'), ...readdirSync(resolve(skill, 'references')).filter((name) => name.endsWith('.md')).map((name) => resolve(skill, 'references', name))];
  const links = [];
  for (const file of files) for (const match of read(file).matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    if (/^https?:\/\//.test(match[1])) continue;
    const target = resolve(dirname(file), match[1].split('#')[0]);
    const resolved = readFileSync(target).length > 0;
    assert.ok(resolved);
    links.push({ from: local(file), to: local(target), resolved });
  }
  return links;
});
run('Normal skill discovery metadata', () => {
  const text = read(resolve(skill, 'SKILL.md'));
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---/)[1];
  assert.ok(frontmatter.includes('name: crear-rutas-koraz'));
  assert.ok(!frontmatter.includes('disable-model-invocation'));
  const files = readdirSync(skill);
  assert.ok(!files.includes('agents')); // Optional UI metadata was deliberately omitted.
  return { normalDiscoveryOnInstallation: true, uiMetadata: 'omitted', installation: 'T046, not started' };
});
run('Every included executable parses on Node 24', () => {
  assert.equal(Number(process.versions.node.split('.')[0]), 24);
  return readdirSync(resolve(skill, 'scripts')).filter((name) => name.endsWith('.mjs')).map((name) => {
    const result = spawnSync(process.execPath, ['--check', resolve(skill, 'scripts', name)], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return { script: name, exitCode: result.status };
  });
});
run('Resource verifier succeeds from unrelated cwd under filesystem permissions', () => {
  const result = invoke('verify-resources.mjs');
  assert.equal(result.exitCode, 0);
  assert.equal(result.output.valid, true);
  assert.equal(result.output.checks.length, 6);
  return result;
});
const sample = json(resolve(skill, 'assets/ejemplo-valido.koraz-route.json'));
const samplePath = resolve(skill, 'assets/ejemplo-valido.koraz-route.json');
for (const publish of [false, true]) run(`Frozen synthetic example validates${publish ? ' with --publish' : ' structurally'}`, () => {
  const result = invoke('validate-route.mjs', [...(publish ? ['--publish'] : []), samplePath]);
  assert.equal(result.exitCode, 0);
  assert.equal(result.output.valid, true);
  assert.equal(result.output.publishable, true);
  return result;
});
const save = (name, value) => {
  const path = resolve(work, `${name}.koraz-route.json`);
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n');
  return path;
};
run('Schema-invalid payload is rejected', () => {
  const input = structuredClone(sample);
  delete input.activities[0].payload.body;
  const result = invoke('validate-route.mjs', [save('invalid-payload', input)]);
  assert.equal(result.exitCode, 1);
  assert.equal(result.output.valid, false);
  assert.ok(result.output.issues.some(({ code }) => code === 'SCHEMA_INVALID'));
  return result;
});
const draft = structuredClone(sample);
draft.editorial.unresolvedIssues.push({ code: 'SOURCE_CONFLICT', severity: 'error', path: '/sources/0',
  message: 'Incidencia sintética del smoke test: conflicto pendiente de revisión.',
  suggestedFix: 'Resolver el conflicto de prueba antes de acreditar cobertura portable.' });
const draftPath = save('editorial-draft', draft);
for (const publish of [false, true]) run(`Editorial error remains a valid draft${publish ? ' and blocks --publish' : ''}`, () => {
  const result = invoke('validate-route.mjs', [...(publish ? ['--publish'] : []), draftPath]);
  assert.equal(result.exitCode, publish ? 1 : 0);
  assert.equal(result.output.valid, true);
  assert.equal(result.output.publishable, false);
  return result;
});
run('Unknown major version is rejected explicitly', () => {
  const input = structuredClone(sample);
  input.schemaVersion = '3.0';
  const result = invoke('validate-route.mjs', [save('unknown-schema', input)]);
  assert.equal(result.exitCode, 2);
  assert.ok(result.output.issues.some(({ code }) => code === 'SCHEMA_UNSUPPORTED'));
  return result;
});
run('Corrupt JSON is rejected explicitly', () => {
  const result = invoke('validate-route.mjs', [save('corrupt', '{invalid')]);
  assert.equal(result.exitCode, 1);
  assert.equal(result.output.valid, false);
  return result;
});
const isolated = resolve(work, 'resource-copy');
cpSync(skill, isolated, { recursive: true });
run('Resource verifier rejects altered bundle before use', () => {
  const bundle = resolve(isolated, 'scripts/validate-route.mjs');
  writeFileSync(bundle, readFileSync(bundle) + '\n');
  const result = invoke('verify-resources.mjs', [], isolated);
  assert.equal(result.exitCode, 1);
  assert.equal(result.output.valid, false);
  assert.ok(result.output.checks.some(({ path, matches }) => path === 'scripts/validate-route.mjs' && !matches));
  return result;
});
run('Resource verifier reports a missing resource', () => {
  const manifestPath = resolve(isolated, 'references/contract-runtime.json');
  const manifest = json(manifestPath);
  manifest.resources[0].path = 'assets/missing.schema.json';
  writeFileSync(manifestPath, JSON.stringify(manifest));
  const result = invoke('verify-resources.mjs', [], isolated);
  assert.equal(result.exitCode, 1);
  assert.equal(result.output.code, 'RESOURCE_ERROR');
  return result;
});
const report = { taskId: 'T044', at: new Date().toISOString(), runtime: process.version,
  status: checks.every(({ status }) => status === 'PASS') ? 'PASS' : 'FAIL',
  checksCount: checks.length, passed: checks.filter(({ status }) => status === 'PASS').length,
  checks, limitations: ['Authoring behavior K01–K05, server import and learner journeys are T045; these are CLI/resource smoke checks.',
    'Node filesystem permissions restrict CLI reads to skill and fixture directories; this run does not claim OS network isolation.',
    'Optional UI metadata omitted; discovery verified structurally, installation not performed.',
    'Q19/V04 remains NO VERIFICADO under the inherited user exception.'], nextTaskStarted: false };
writeFileSync(resolve(evidence, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, checks: report.checksCount, passed: report.passed,
  failures: checks.filter(({ status }) => status === 'FAIL') }, null, 2));
process.exitCode = report.status === 'PASS' ? 0 : 1;
