import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, delimiter } from 'node:path';
import os from 'node:os';

const evidence = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidence, '../../../../..');
const runtime = 'C:/Users/josed/.cache/codex-runtimes/codex-primary-runtime/dependencies';
const pnpm = `${runtime}/node/node_modules/pnpm/bin/pnpm.mjs`;
process.chdir(root);
const env = { ...process.env, PATH: `${runtime}/node/bin${delimiter}${runtime}/bin/fallback${delimiter}${process.env.PATH}`,
  pnpm_config_pm_on_fail: 'ignore', KORAZ_TEST_DATABASE: 'true', KORAZ_GUIDED_V2_TEST_SERVER: 'true',
  KORAZ_GUIDED_V2_TEST_DATABASE_URL: 'postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test',
  KORAZ_T015_TEST_DATABASE_URL: 'postgresql://koraz_test@127.0.0.1:55415/koraz_t015_test',
  KORAZ_T018_TEST_DATABASE_URL: 'postgresql://koraz_test@127.0.0.1:55418/koraz_t018_test',
  KORAZ_T022_TEST_DATABASE_URL: 'postgresql://koraz_test@127.0.0.1:55422/koraz_t022_test',
  T038_EVIDENCE_TASK: 'T040', T038_RUN_TAG: 'regression' };
// Production/environment DATABASE_URL is never used by these opt-in harnesses.
delete env.DATABASE_URL;
const commands = {
  'e2e-editor-repair-final': ['--filter', '@cediah/web', 'exec', 'playwright', 'test', '--config', `${evidence}/playwright.editor-repair-final.config.mts`, 'route-editor.spec.ts', '--grep', 'mantiene material fijado|contenido heredado conserva'],
  'web-editor-repair-final': ['--filter', '@cediah/web', 'exec', 'vitest', 'run', 'src/components/learning/editor/editor-fixtures.test.ts', 'src/components/learning/editor/editor-model.test.ts', 'src/components/learning/editor/editor-serialization.test.ts', '--maxWorkers=1', '--reporter=default', '--reporter=json', `--outputFile=${evidence}/web-editor-repair-final.json`],
  'web-editor-repair': ['--filter', '@cediah/web', 'exec', 'vitest', 'run', 'src/components/learning/editor/editor-fixtures.test.ts', 'src/components/learning/editor/editor-model.test.ts', 'src/components/learning/editor/editor-serialization.test.ts', '--maxWorkers=1', '--reporter=default', '--reporter=json', `--outputFile=${evidence}/web-editor-repair.json`],
  'web-lint-repair': ['--filter', '@cediah/web', 'lint'],
  'web-typecheck-repair': ['--filter', '@cediah/web', 'typecheck'],
  'e2e-editor-repair': ['--filter', '@cediah/web', 'exec', 'playwright', 'test', '--config', `${evidence}/playwright.editor-repair.config.mts`, 'route-editor.spec.ts', '--grep', 'mantiene material fijado|contenido heredado conserva'],
  'contracts-build': ['--filter', '@cediah/contracts', 'build'],
  build: ['build'], typecheck: ['typecheck'], lint: ['lint'],
  'api-test': ['--filter', '@cediah/api', 'test', '--maxWorkers=1', '--reporter=default', '--reporter=json', `--outputFile=${evidence}/api-test.json`],
  'web-test': ['--filter', '@cediah/web', 'test', '--maxWorkers=1', '--reporter=default', '--reporter=json', `--outputFile=${evidence}/web-test.json`],
  'e2e-guided-v2': ['--filter', '@cediah/web', 'exec', 'playwright', 'test', '--config', `${evidence}/playwright.config.mts`],
  'e2e-legacy': ['--filter', '@cediah/web', 'exec', 'playwright', 'test', '--config', `${evidence}/playwright.legacy.config.mts`],
  performance: ['--filter', '@cediah/api', 'exec', 'node', '--import', 'tsx', 'test/performance/guided-v2-load.mjs', '--pool-size=20'],
  'performance-recheck': ['--filter', '@cediah/api', 'exec', 'node', '--import', 'tsx', 'test/performance/guided-v2-load.mjs', '--pool-size=20'],
  'api-images-recheck': ['--filter', '@cediah/api', 'exec', 'vitest', 'run', 'test/guided-v2-images.test.ts', 'test/guided-v2-preview.test.ts', 'test/learning-map-storage.test.ts', '--maxWorkers=1', '--reporter=default', '--reporter=json', `--outputFile=${evidence}/api-images-recheck.json`],
  'api-images-final': ['--filter', '@cediah/api', 'exec', 'vitest', 'run', 'test/guided-v2-images.test.ts', '--maxWorkers=1', '--reporter=default', '--reporter=json', `--outputFile=${evidence}/api-images-final.json`],
  'api-typecheck-final': ['--filter', '@cediah/api', 'typecheck'],
  'api-lint-final': ['--filter', '@cediah/api', 'lint'],
  'web-lint-final': ['--filter', '@cediah/web', 'lint'],
  'web-typecheck-final': ['--filter', '@cediah/web', 'typecheck'],
  'e2e-guided-recheck': ['--filter', '@cediah/web', 'exec', 'playwright', 'test', '--config', `${evidence}/playwright.recheck.config.mts`, '--grep', 'E02|E03|E04|stable map'],
  'e2e-security-recheck': ['--filter', '@cediah/web', 'exec', 'playwright', 'test', '--config', `${evidence}/playwright.security-recheck.config.mts`, '--project', 'mobile', '--grep', 'S03'],
  'e2e-legacy-recheck': ['--filter', '@cediah/web', 'exec', 'playwright', 'test', '--config', `${evidence}/playwright.legacy-recheck.config.mts`, 'learning-map-persistence.spec.ts'],
  'e2e-large-editor': ['--filter', '@cediah/web', 'exec', 'playwright', 'test', '--config', `${evidence}/playwright.large-editor.config.mts`],
  'e2e-legacy-final': ['--filter', '@cediah/web', 'exec', 'playwright', 'test', '--config', `${evidence}/playwright.legacy-final.config.mts`, 'learning-map-persistence.spec.ts'],
  'e2e-legacy-production': ['--filter', '@cediah/web', 'exec', 'playwright', 'test', '--config', `${evidence}/playwright.legacy-production.config.mts`, 'learning-map-persistence.spec.ts'],
  'e2e-large-editor-final': ['--filter', '@cediah/web', 'exec', 'playwright', 'test', '--config', `${evidence}/playwright.large-editor-final.config.mts`],
  'e2e-large-editor-recheck': ['--filter', '@cediah/web', 'exec', 'playwright', 'test', '--config', `${evidence}/playwright.large-editor-recheck.config.mts`],
  'e2e-large-editor-confirmed': ['--filter', '@cediah/web', 'exec', 'playwright', 'test', '--config', `${evidence}/playwright.large-editor-confirmed.config.mts`],
};
function hash(path) { return createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex'); }
if (process.argv[2] === 'baseline') {
  if (existsSync(`${evidence}/baseline.json`)) throw new Error('Baseline already exists');
  const files = [...new Set(execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean))]
    .filter(p => !p.startsWith('docs/aprendizaje-guiado/v2/evidencias/T040/'));
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  writeFileSync(`${evidence}/baseline.json`, JSON.stringify({ taskId: 'T040', baseSha: sha, at: new Date().toISOString(), node: process.version,
    pnpm: execFileSync(process.execPath, [pnpm, '--version'], { env, encoding: 'utf8' }).trim(), cpu: os.cpus()[0].model,
    memoryBytes: os.totalmem(), platform: os.platform(), release: os.release(), handoff: 'C:/Users/josed/Documents/Codex/2026-09-26/act-a-como-arquitecto-principal-de-2/outputs/koraz-rutas-aprendizaje/HANDOFF-EJECUTOR.md',
    files: files.map(path => ({ path, sha256: hash(path) })) }, null, 2));
  writeFileSync(`${evidence}/initial-status.txt`, execFileSync('git', ['status', '--short'], { encoding: 'utf8' }));
  writeFileSync(`${evidence}/next-env.before.txt`, readFileSync('apps/web/next-env.d.ts'));
  console.log(`Baseline ${sha}: ${files.length} existing files hashed`);
} else {
  for (const id of process.argv.slice(2)) {
    if (!commands[id]) throw new Error(`Unknown check: ${id}`);
    if (existsSync(`${evidence}/${id}.txt`)) throw new Error(`Do not overwrite check ${id}`);
    const args = commands[id];
    const startedUtc = new Date().toISOString();
    const log = createWriteStream(`${evidence}/${id}.txt`);
    log.write(`Command: pnpm.cmd ${args.join(' ')}\nNode: ${process.version}\nStarted: ${startedUtc}\n`);
    console.log(`START ${id} ${startedUtc}`);
    const checkEnv = id.startsWith('performance') ? { ...env, NODE_ENV: 'test', T038_RUN_TAG: id === 'performance' ? 'regression' : 'regression-final' }
      : id === 'e2e-guided-recheck' ? { ...env, T040_BROWSER_RUN: 'guided-recheck' }
      : id === 'e2e-security-recheck' ? { ...env, T040_BROWSER_RUN: 'security-recheck' }
      : id === 'e2e-large-editor' ? { ...env, T040_BROWSER_RUN: 'large-editor' }
      : id === 'e2e-large-editor-final' ? { ...env, T040_BROWSER_RUN: 'large-editor-final' }
      : id === 'e2e-large-editor-recheck' ? { ...env, T040_BROWSER_RUN: 'large-editor-recheck' }
      : id === 'e2e-large-editor-confirmed' ? { ...env, T040_BROWSER_RUN: 'large-editor-confirmed' } : env;
    const child = spawn(process.execPath, [pnpm, ...args], { cwd: root, env: checkEnv, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    for (const stream of [child.stdout, child.stderr]) stream.on('data', data => log.write(data));
    const exitCode = await new Promise((done, reject) => { child.once('error', reject); child.once('exit', code => done(code)); });
    const finishedUtc = new Date().toISOString();
    await new Promise(done => log.end(`\nExit code: ${exitCode}\nFinished: ${finishedUtc}\n`, done));
    const entry = { id, command: `pnpm.cmd ${args.join(' ')}`, exitCode, result: exitCode === 0 ? 'PASS' : 'FAIL', startedUtc, finishedUtc, evidence: `${id}.txt` };
    writeFileSync(`${evidence}/${id}-exit.json`, JSON.stringify(entry, null, 2));
    console.log(`END ${id}: ${entry.result} (${exitCode}) ${finishedUtc}`);
  }
}
