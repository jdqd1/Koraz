import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../../..');
process.chdir(root);
const read = name => JSON.parse(readFileSync(resolve(here, name), 'utf8'));
const save = (name, value) => writeFileSync(resolve(here, name), JSON.stringify(value, null, 2));
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const baseline = read('baseline.json');
if (process.argv[2] === 'results') {
  const summary = {};
  for (const id of ['api-test', 'web-test']) {
    const r = read(`${id}.json`);
    summary[id] = { files: r.testResults.length, passed: r.numPassedTests, failed: r.numFailedTests,
      skipped: r.numPendingTests, total: r.numTotalTests,
      failures: r.testResults.flatMap(f => f.assertionResults.filter(a => a.status === 'failed').map(a => ({ file: f.name, title: a.fullName, messages: a.failureMessages }))),
      omissions: r.testResults.flatMap(f => f.assertionResults.filter(a => a.status === 'pending' || a.status === 'skipped').map(a => ({ file: f.name, title: a.fullName }))) };
  }
  if (existsSync(resolve(here, 'api-images-recheck.json'))) {
    const original = read('api-test.json'), recheck = read('api-images-recheck.json');
    const latest = new Map(original.testResults.map(f => [f.name, f]));
    for (const f of recheck.testResults) latest.set(f.name, f);
    const files = [...latest.values()];
    const assertions = files.flatMap(f => f.assertionResults);
    summary['api-effective'] = { method: 'Original global run, affected image/preview files replaced by their final focused rerun; counts are not summed',
      files: files.length, total: assertions.length, passed: assertions.filter(a => a.status === 'passed').length,
      failed: assertions.filter(a => a.status === 'failed').length,
      skipped: assertions.filter(a => a.status === 'pending' || a.status === 'skipped').length,
      failures: assertions.filter(a => a.status === 'failed').map(a => ({ title: a.fullName, messages: a.failureMessages })) };
  }
  for (const [id, name] of [['guided-v2', 'playwright.json'], ['legacy', 'playwright-legacy.json']]) {
    if (!existsSync(resolve(here, name))) continue;
    const r = read(name); const cases = [];
    function walk(suite, ancestors = []) {
      const path = [...ancestors, suite.title].filter(Boolean);
      for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) cases.push({
        file: spec.file, title: [...path, spec.title].join(' > '), project: test.projectName,
        status: test.status, expectedStatus: test.expectedStatus,
        errors: test.results.flatMap(run => run.errors ?? []) });
      for (const s of suite.suites ?? []) walk(s, path);
    }
    for (const s of r.suites) walk(s);
    summary[id] = { stats: r.stats, failures: cases.filter(c => c.status === 'unexpected'),
      omissions: cases.filter(c => c.status === 'skipped'), cases };
  }
  save('counts-and-omissions.json', summary);
  console.log(JSON.stringify(Object.fromEntries(Object.entries(summary).map(([k, v]) => [k,
    { files: v.files, passed: v.passed, failed: v.failed, skipped: v.skipped, stats: v.stats }]))));
} else if (process.argv[2] === 'preservation') {
  const allowed = ['apps/api/test/performance/guided-v2-load.mjs', 'apps/api/test/helpers/guided-v2-images.ts', 'apps/api/test/guided-v2-images.test.ts', 'apps/api/test/helpers/learning-map-db.ts', 'apps/api/test/helpers/learning-map-server.ts', 'apps/web/tests/e2e/guided-v2-journeys.spec.ts', 'apps/web/tests/e2e/guided-v2-accessibility.spec.ts'];
  const changed = [], missing = [];
  for (const item of baseline.files) {
    if (!existsSync(item.path)) { missing.push(item.path); continue; }
    const after = hash(item.path);
    if (after !== item.sha256) changed.push({ path: item.path, before: item.sha256, after, authorized: allowed.includes(item.path) });
  }
  const files = [...new Set(execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean))];
  const added = files.filter(p => !baseline.files.some(b => b.path === p) && !p.startsWith('docs/aprendizaje-guiado/v2/evidencias/T040/'));
  const status = !missing.length && !changed.some(c => !c.authorized) && !added.length ? 'PASS' : 'FAIL';
  save('preservation.json', { status, at: new Date().toISOString(), baselineFiles: baseline.files.length,
    unchangedFiles: baseline.files.length - changed.length - missing.length, changed, missing, added });
  save('source-hashes.json', files.filter(p => /^(apps|packages|database)\//.test(p)).map(path => ({ path, sha256: hash(path) })));
  writeFileSync(resolve(here, 'final-status.txt'), execFileSync('git', ['status', '--short'], { encoding: 'utf8' }));
  console.log(`Preservation ${status}; changed=${changed.length}, missing=${missing.length}, added=${added.length}`);
  if (status !== 'PASS') process.exitCode = 1;
} else throw new Error('Use results or preservation');
