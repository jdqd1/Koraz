import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, cpSync, mkdtempSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { validateRoutePackage, routePackageJsonSchema } from '../../../../../packages/contracts/dist/learning-route-validation.js';

assert.equal(Number(process.versions.node.split('.')[0]), 24, 'Use Node24 for the required portability check');
const evidence = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidence, '../../../../..');
const skill = resolve(root, 'tools/skills/crear-rutas-koraz');
const read = (path) => readFileSync(path);
const parse = (path) => JSON.parse(read(path).toString('utf8').replace(/^\uFEFF/, ''));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const manifest = parse(join(skill, 'references/contract-runtime.json'));
const accepted = parse(join(skill, 'references/accepted-contract-hashes.json'));
const deferral = parse(join(skill, 'references/reader-deferral.json'));
assert.equal(accepted.accepted, true);
assert.equal(accepted.frozen, true);
assert.equal(deferral.checkStatus, 'NO VERIFICADO');
assert.equal(manifest.catalogueResolution, 'PENDING_AT_IMPORT');
assert.equal(manifest.originalFullSystemAcceptance, false);
for (const { path, sha256 } of accepted.hashes) assert.equal(hash(read(resolve(root, path))), sha256, path);
for (const { path, sourcePath, sha256 } of manifest.resources) {
  assert.equal(hash(read(join(skill, path))), sha256, path);
  assert.equal(hash(read(resolve(root, sourcePath))), sha256, sourcePath);
}
assert.deepEqual(parse(join(skill, 'assets/koraz-route-2.0.schema.json')), routePackageJsonSchema());
const example = parse(join(skill, 'assets/ejemplo-valido.koraz-route.json'));
const pilot = parse(resolve(root, 'docs/aprendizaje-guiado/v2/piloto/vascularizacion-abdomen.koraz-route.json'));
const cases = [];
function add(name, input, mutate, expected, issueCode) {
  const pkg = structuredClone(input);
  mutate?.(pkg);
  cases.push({ name, pkg, expected, issueCode });
}
add('synthetic-valid', example, null, { valid: true, publishable: true });
add('approved-pilot', pilot, null, { valid: true, publishable: true });
add('unknown-field', example, (p) => { p.published = true; }, { valid: false, publishable: false }, 'SCHEMA_INVALID');
add('invalid-answer', example, (p) => { p.activities.find((a) => a.kind === 'single_choice').payload.correctKey = 'missing'; }, { valid: false, publishable: false }, 'SCHEMA_INVALID');
add('file-url', example, (p) => { p.sources[0].url = 'file:///no-download'; }, { valid: false, publishable: false }, 'SCHEMA_INVALID');
add('dag-cycle', pilot, (p) => { p.objectives[0].prerequisiteKeys = [p.objectives[0].key]; }, { valid: true, publishable: false }, 'DAG_CYCLE');
add('missing-reference', pilot, (p) => { p.objectives[0].sourceKeys = ['missing-source']; }, { valid: true, publishable: false }, 'REFERENCE_MISSING');
add('missing-application', pilot, (p) => { for (const a of p.activities) if (a.phase === 'apply') a.phase = 'retrieve'; }, { valid: true, publishable: false }, 'OBJECTIVE_COVERAGE');
add('missing-reserve', pilot, (p) => { for (const a of p.activities) if (a.use === 'retention30') a.use = 'learning'; }, { valid: true, publishable: false }, 'RESERVE_LEAK');
add('missing-core-gate', example, (p) => { p.assessments = p.assessments.filter((a) => a.kind !== 'unit_gate'); }, { valid: true, publishable: false }, 'CRITICAL_GATE_MISSING');
add('unverified-source', example, (p) => { p.sources[0].verification = 'unverified'; }, { valid: true, publishable: false }, 'SOURCE_UNRESOLVED');
add('duplicate-bank-family', example, (p) => { p.activities.find((a) => a.key === 'recall-three').equivalenceKey = 'recall-one'; }, { valid: true, publishable: false }, 'BANK_TOO_SMALL');

const isolated = mkdtempSync(join(tmpdir(), 'koraz-t043-offline-'));
const caseDir = join(evidence, 'cases');
mkdirSync(caseDir, { recursive: true });
const report = { taskId: 'T043', at: new Date().toISOString(), node: process.version,
  status: 'RUNNING', validationScope: 'portable (same shared function imported by backend)',
  schemaExact: true, frozenHashes: accepted.hashes.length, resourceHashes: manifest.resources.length,
  isolation: { directory: isolated, initiallyEmpty: readdirSync(isolated).length === 0,
    repoFilesystemReadable: false, nodeModulesPresent: false, gitPresent: false,
    network: 'Node module/API guards deny net/http/https/http2/tls/dns/dgram/undici/fetch/WebSocket/EventSource; no OS firewall claim',
    environment: 'No NODE_PATH, NODE_OPTIONS, proxies, credentials, or repository environment passed', cleanup: false },
  isolationProbes: [], comparisons: [], ioChecks: [], checksCount: 0,
  catalogueResolution: 'PENDING_AT_IMPORT', originalFullSystemAcceptance: false,
};
const env = { SystemRoot: process.env.SystemRoot ?? 'C:\\Windows', NODE_PATH: '', NODE_OPTIONS: '', HTTP_PROXY: '', HTTPS_PROXY: '' };
const run = (cli, file, publish, offline = false) => {
  const args = offline ? ['--permission', `--allow-fs-read=${isolated}`, '--import', pathToFileURL(join(isolated, 'offline-guard.mjs')).href] : [];
  const child = spawnSync(process.execPath, [...args, cli, ...(publish ? ['--publish'] : []), ...(file ? [file] : [])],
    { cwd: isolated, env, encoding: 'utf8', timeout: 15000 });
  assert.equal(child.error, undefined, String(child.error));
  assert.equal(child.stderr, '', child.stderr);
  return { exitCode: child.status, output: JSON.parse(child.stdout) };
};
try {
  cpSync(skill, isolated, { recursive: true });
  cpSync(join(evidence, 'offline-guard.mjs'), join(isolated, 'offline-guard.mjs'));
  assert.equal(existsSync(join(isolated, 'node_modules')), false);
  assert.equal(existsSync(join(isolated, '.git')), false);
  const probes = `
    import { readFileSync } from 'node:fs';
    import { execFileSync } from 'node:child_process';
    const report = [];
    const probe = async (name, fn, code) => {
      try { await fn(); throw new Error(name + ' was allowed'); }
      catch (error) { if (error.code !== code) throw error; report.push({ name, denied: true, code }); }
    };
    await probe('repo-read', () => readFileSync(${JSON.stringify(join(root, 'package.json'))}), 'ERR_ACCESS_DENIED');
    await probe('child-process', () => execFileSync(process.execPath, ['--version']), 'ERR_ACCESS_DENIED');
    for (const id of ['node:net','node:http','node:https','node:http2','node:tls','node:dns','node:dns/promises','node:dgram','undici']) {
      await probe(id, () => import(id), 'ERR_KORAZ_OFFLINE');
    }
    await probe('fetch', () => fetch('https://example.invalid'), 'ERR_KORAZ_OFFLINE');
    await probe('WebSocket', () => new WebSocket('wss://example.invalid'), 'ERR_KORAZ_OFFLINE');
    await probe('getBuiltinModule/net', () => process.getBuiltinModule('net'), 'ERR_KORAZ_OFFLINE');
    console.log(JSON.stringify(report));
  `;
  const probe = spawnSync(process.execPath, ['--permission', `--allow-fs-read=${isolated}`, '--import', pathToFileURL(join(isolated, 'offline-guard.mjs')).href, '--input-type=module', '-e', probes], { cwd: isolated, env, encoding: 'utf8', timeout: 15000 });
  assert.equal(probe.status, 0, probe.stderr);
  report.isolationProbes = JSON.parse(probe.stdout);
  report.checksCount += report.isolationProbes.length;
  for (const { name, pkg, expected, issueCode } of cases) {
    const result = validateRoutePackage(pkg);
    assert.equal(result.valid, expected.valid, name);
    assert.equal(result.publishable, expected.publishable, name);
    if (issueCode) assert.ok(result.issues.some((i) => i.code === issueCode), `${name}: ${JSON.stringify(result)}`);
    const fileName = `${name}.koraz-route.json`;
    const bytes = JSON.stringify(pkg, null, 2) + '\n';
    writeFileSync(join(caseDir, fileName), bytes);
    const portableFile = join(isolated, fileName);
    writeFileSync(portableFile, bytes);
    for (const publish of [false, true]) {
      for (const [label, cli, offline] of [
        ['repository-cli', join(root, 'packages/contracts/bin/validate-learning-route.mjs'), false],
        ['copied-offline-bundle', join(isolated, 'scripts/validate-route.mjs'), true],
      ]) {
        const actual = run(cli, portableFile, publish, offline);
        assert.equal(actual.exitCode, result.valid && (!publish || result.publishable) ? 0 : 1, name);
        assert.deepEqual(actual.output, result, name);
        report.comparisons.push({ name, mode: publish ? 'publish-check' : 'draft-check', cli: label, matchesBackendShared: true, ...actual });
        report.checksCount++;
      }
    }
  }
  const ioCases = [
    ['unknown-version', JSON.stringify({ ...example, schemaVersion: '3.0' }), 2, 'SCHEMA_UNSUPPORTED'],
    ['corrupt-json', '{', 1, 'SCHEMA_INVALID'],
    ['invalid-utf8', Buffer.from([0xff, 0xfe]), 1, 'SCHEMA_INVALID'],
    ['over-10mib', Buffer.alloc(10 * 1024 * 1024 + 1, 0x20), 2, 'IO_ERROR'],
    ['missing-file', null, 2, 'IO_ERROR'],
    ['no-argument', null, 2, 'IO_ERROR'],
  ];
  for (const [name, bytes, exitCode, issueCode] of ioCases) {
    const file = name === 'no-argument' ? undefined : join(isolated, `${name}.koraz-route.json`);
    if (bytes !== null) writeFileSync(file, bytes);
    const actual = run(join(isolated, 'scripts/validate-route.mjs'), file, false, true);
    assert.equal(actual.exitCode, exitCode, name);
    assert.equal(actual.output.valid, false, name);
    assert.ok(actual.output.issues.some((i) => i.code === issueCode), name);
    report.ioChecks.push({ name, expectedExitCode: exitCode, ...actual });
    report.checksCount++;
  }
  report.status = 'PASS';
} catch (error) {
  report.status = 'FAIL';
  report.failure = String(error.stack ?? error);
  process.exitCode = 1;
} finally {
  // Only this exact directory created by mkdtemp is removed; verify its parent and prefix.
  assert.equal(dirname(isolated), tmpdir());
  assert.ok(isolated.startsWith(join(tmpdir(), 'koraz-t043-offline-')));
  rmSync(isolated, { recursive: true, force: true });
  report.isolation.cleanup = !existsSync(isolated);
  writeFileSync(join(evidence, 'portability.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ status: report.status, node: report.node, checks: report.checksCount,
  semanticCases: cases.length, comparisons: report.comparisons.length, ioCases: report.ioChecks.length,
  isolatedDirectoryRemoved: report.isolation.cleanup, failure: report.failure }, null, 2));
