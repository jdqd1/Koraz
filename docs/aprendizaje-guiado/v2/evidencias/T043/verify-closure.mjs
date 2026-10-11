import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { resolve, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const evidence = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidence, '../../../../..');
const parse = (path) => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const hashBytes = (bytes) => createHash('sha256').update(bytes).digest('hex');
const hash = (path) => hashBytes(readFileSync(path));
const baseline = parse(resolve(evidence, 'baseline.json'));
const prerequisite = parse(resolve(evidence, 'prerequisite-check.json'));
const portability = parse(resolve(evidence, 'portability.json'));
const tests = parse(resolve(evidence, 'validator-tests.json'));
const git = (...args) => execFileSync('git', ['-c', 'core.quotePath=false', ...args], { cwd: root, encoding: 'utf8' }).trim();
const allowed = (path) => path.startsWith('docs/aprendizaje-guiado/v2/evidencias/T043/')
  || /^tools\/skills\/crear-rutas-koraz\/(assets|scripts|references)\//.test(path)
  || path === 'packages/contracts/bin/export-route-skill.mjs';
const preserved = baseline.files.map(({ path, sha256 }) => ({ path, matches: hash(resolve(root, path)) === sha256 }));
const currentFiles = git('ls-files', '--cached', '--others', '--exclude-standard').split('\n').filter(Boolean);
const baselinePaths = new Set(baseline.files.map(({ path }) => path));
const omitted = currentFiles.filter((path) => !allowed(path) && !baselinePaths.has(path));
// The PowerShell baseline skipped six tracked paths because Git quoted their accented
// names. Preserve that failure; prove these exact historical files equal the base commit.
const supplemental = omitted.filter((path) => /^docs\/aprendizaje-guiado\/v2\/evidencias\/T040\/legacy-browser-artifacts\/route-editor-editor-cotidi-3a446-ágina-y-pagina-sin-perderlo-(desktop|mobile)\/(error-context\.md|test-failed-1\.png|trace\.zip)$/.test(path))
  .map((path) => {
    const baseBytes = execFileSync('git', ['show', `${baseline.baseSha}:${path}`], { cwd: root, maxBuffer: 64 * 1024 * 1024 });
    const baseSha256 = hashBytes(baseBytes);
    return { path, baseSha256, actualSha256: hash(resolve(root, path)), matches: baseSha256 === hash(resolve(root, path)), basis: 'Exact blob from baseline HEAD; omitted by filename quoting in initial hash inventory' };
  });
const supplementalPaths = new Set(supplemental.filter(({ matches }) => matches).map(({ path }) => path));
const unexpected = omitted.filter((path) => !supplementalPaths.has(path));
const scripts = [resolve(root, 'packages/contracts/bin/export-route-skill.mjs')];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'initial-blocked') walk(path);
    } else if (path.endsWith('.mjs')) scripts.push(path);
  }
};
walk(evidence);
walk(resolve(root, 'tools/skills/crear-rutas-koraz/scripts'));
const syntax = scripts.map((path) => {
  const check = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
  return { path: relative(root, path).split(sep).join('/'), exitCode: check.status, stderr: check.stderr };
});
const diff = spawnSync('git', ['diff', '--check', '--', 'packages/contracts/bin/export-route-skill.mjs',
  'tools/skills/crear-rutas-koraz', 'docs/aprendizaje-guiado/v2/evidencias/T043'], { cwd: root, encoding: 'utf8' });
const whitespace = currentFiles.filter(allowed).filter((path) => /\.(mjs|md|json)$/.test(path)
  && !path.includes('/initial-blocked/') && !path.endsWith('/scripts/validate-route.mjs'))
  .map((path) => {
    const check = spawnSync('git', ['diff', '--no-index', '--check', '--', 'NUL', path], { cwd: root, encoding: 'utf8' });
    // --no-index can exit 1 for a differing file even with no whitespace diagnostics.
    return { path, exitCode: check.status, stdout: check.stdout, stderr: check.stderr,
      clean: [0, 1].includes(check.status) && check.stdout === '' && check.stderr === '' };
  });
const report = { at: new Date().toISOString(), status: 'RUNNING', baseSha: git('rev-parse', 'HEAD'),
  preservedFiles: preserved.length, changedOutsideAllowlist: preserved.filter(({ matches }) => !matches),
  supplementalTrackedFiles: supplemental,
  unexpectedFilesOutsideAllowlist: unexpected, frozenHashesVerified: prerequisite.currentHashes.length,
  prerequisiteAccepted: prerequisite.prerequisiteAccepted,
  portability: { status: portability.status, count: portability.checksCount, comparisons: portability.comparisons.length },
  focusedTests: { passed: tests.numPassedTests, failed: tests.numFailedTests, pending: tests.numPendingTests },
  syntax, diffCheck: { exitCode: diff.status, stdout: diff.stdout, stderr: diff.stderr },
  newFileWhitespaceChecks: whitespace,
  changedFiles: currentFiles.filter(allowed), nextTaskStarted: false };
try {
  assert.equal(report.baseSha, baseline.baseSha);
  assert.equal(report.changedOutsideAllowlist.length, 0);
  assert.equal(unexpected.length, 0);
  assert.ok(prerequisite.prerequisiteAccepted);
  assert.ok(prerequisite.allCandidateHashesMatch);
  assert.equal(portability.status, 'PASS');
  assert.equal(tests.numPassedTests, 23);
  assert.equal(tests.numFailedTests, 0);
  assert.equal(tests.numPendingTests, 0);
  assert.ok(syntax.every((check) => check.exitCode === 0));
  assert.equal(diff.status, 0);
  assert.ok(whitespace.every(({ clean }) => clean), JSON.stringify(whitespace.filter(({ clean }) => !clean)));
  report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.failure = String(error.stack ?? error); process.exitCode = 1; }
writeFileSync(resolve(evidence, 'closure-check.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, preservedFiles: report.preservedFiles,
  focusedTests: report.focusedTests, failure: report.failure }, null, 2));
