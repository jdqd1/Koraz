import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const evidence = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidence, '../../../../..');
const read = (path) => readFileSync(resolve(root, path));
const hash = (path) => createHash('sha256').update(read(path)).digest('hex');
const parse = (bytes) => JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
const baseline = parse(readFileSync(resolve(evidence, 'baseline.json')));
const verification = parse(readFileSync(resolve(evidence, 'verification.json')));
const git = (...args) => execFileSync('git', ['-c', 'core.quotePath=false', ...args], { cwd: root, encoding: 'utf8' });
const allowed = (path) => path.startsWith('tools/skills/crear-rutas-koraz/') || path.startsWith('docs/aprendizaje-guiado/v2/evidencias/T044/');
const current = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean).filter((path) => statSync(resolve(root, path)).isFile());
const initial = new Map(baseline.files.map(({ path, sha256 }) => [path, sha256]));
const preserved = baseline.files.filter(({ path }) => !allowed(path)).map(({ path, sha256 }) => ({ path, matches: hash(path) === sha256 }));
const changedFiles = current.filter((path) => !initial.has(path) || hash(path) !== initial.get(path));
const diff = spawnSync('git', ['diff', '--check'], { cwd: root, encoding: 'utf8' });
const whitespace = changedFiles.filter((path) => /\.(md|json|mjs)$/.test(path)
  && !path.includes('/.python-deps/') && !path.includes('/resource-copy/'))
  .map((path) => {
    const result = spawnSync('git', ['diff', '--no-index', '--check', '--', 'NUL', path], { cwd: root, encoding: 'utf8' });
    return { path, clean: [0, 1].includes(result.status) && result.stdout === '' && result.stderr === '',
      exitCode: result.status, stdout: result.stdout, stderr: result.stderr };
  });
const report = { taskId: 'T044', at: new Date().toISOString(), status: 'PASS',
  baseSha: git('rev-parse', 'HEAD').trim(), initialFiles: baseline.files.length,
  preservedFilesOutsideAllowlist: preserved.length,
  changedOutsideAllowlist: preserved.filter(({ matches }) => !matches),
  unexpectedNewFilesOutsideAllowlist: current.filter((path) => !allowed(path) && !initial.has(path)),
  changedFiles, whitespace,
  diffCheck: { exitCode: diff.status, stdout: diff.stdout, stderr: diff.stderr }, nextTaskStarted: false };
try {
  assert.equal(report.baseSha, baseline.baseSha);
  assert.equal(report.changedOutsideAllowlist.length, 0);
  assert.equal(report.unexpectedNewFilesOutsideAllowlist.length, 0);
  assert.equal(verification.status, 'PASS');
  assert.equal(verification.passed, 14);
  assert.ok(readFileSync(resolve(evidence, 'quick-validate.txt'), 'utf8').includes('Skill is valid!'));
  assert.equal(diff.status, 0);
  assert.ok(whitespace.every(({ clean }) => clean));
} catch (error) { report.status = 'FAIL'; report.failure = error.stack; process.exitCode = 1; }
writeFileSync(resolve(evidence, 'closure-check.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, preservedFilesOutsideAllowlist: preserved.length,
  changedOutsideAllowlist: report.changedOutsideAllowlist.length,
  unexpectedNewFilesOutsideAllowlist: report.unexpectedNewFilesOutsideAllowlist.length,
  whitespaceChecks: whitespace.length, failure: report.failure }, null, 2));
