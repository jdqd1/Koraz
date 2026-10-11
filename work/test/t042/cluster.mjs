import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, realpathSync, openSync, closeSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const evidence = resolve(root, 'docs/aprendizaje-guiado/v2/evidencias/T042', process.env.T042_MANUAL_READER === 'true' ? 'reader-manual' : '');
mkdirSync(evidence, { recursive: true });
const marker = JSON.parse(readFileSync(resolve(root, 'docs/aprendizaje-guiado/v2/evidencias/M01/cluster.json'), 'utf8'));
assert.equal(process.env.KORAZ_TEST_DATABASE, 'true');
assert.equal(marker.disposable, true);
assert.equal(marker.controlUrl, 'postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test');
assert.equal(marker.port, 55435);
assert.equal(realpathSync(marker.data), 'C:\\Users\\josed\\AppData\\Local\\Temp\\koraz-guided-v2-3d5cf4ba2d2c45ee8e272fb75da35fbc');
assert.equal(realpathSync(marker.postgresBin), 'C:\\Users\\josed\\.codex\\tmp\\koraz-t015-postgres\\pgsql\\bin');
const { Pool } = createRequire(resolve(root, 'apps/api/package.json'))('pg');
const save = (name, data) => writeFileSync(join(evidence, name), JSON.stringify(data, null, 2) + '\n');
function native(name, args, accepted = [0]) {
  const fd = openSync(join(evidence, `cluster-${name}.txt`), 'a');
  const r = spawnSync(join(marker.postgresBin, `${name}.exe`), args, { windowsHide: true, stdio: ['ignore', fd, fd], timeout: 120000 });
  closeSync(fd); if (r.error) throw r.error; assert.ok(accepted.includes(r.status), `${name}: ${r.status}`); return r.status;
}
async function snapshot() {
  const p = new Pool({ connectionString: marker.controlUrl, max: 1 });
  try { return (await p.query('select datname,oid from pg_database order by datname')).rows; }
  finally { await p.end(); }
}
if (process.argv[2] === 'start') {
  const status = native('pg_ctl', ['-D', marker.data, 'status'], [0, 3]);
  if (status === 3) native('pg_ctl', ['-D', marker.data, '-l', join(evidence, 'cluster-server.txt'), '-o', '-p 55435 -h 127.0.0.1', '-w', 'start']);
  const before = await snapshot();
  save('cluster.json', { ...marker, startedByT042: status === 3 || process.env.T042_CLUSTER_ALREADY_STARTED === 'true', databasesBefore: before });
  console.log('Marked PostgreSQL available on 127.0.0.1:55435; baseline saved');
} else if (process.argv[2] === 'stop') {
  const receipt = JSON.parse(readFileSync(join(evidence, 'cluster.json'), 'utf8'));
  const after = await snapshot();
  assert.deepEqual(after, receipt.databasesBefore, 'Preexisting databases must remain identical; no T042 databases may remain');
  save('cluster-cleanup.json', { status: 'PASS', at: new Date().toISOString(), databasesBefore: receipt.databasesBefore, databasesAfter: after, preexistingPreserved: true });
  if (receipt.startedByT042) native('pg_ctl', ['-D', marker.data, '-m', 'fast', '-w', 'stop']);
  console.log('Test databases cleaned; owned cluster stopped; data directory preserved');
} else throw new Error('Use start or stop');
