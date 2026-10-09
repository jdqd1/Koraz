import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, openSync, closeSync, mkdtempSync, realpathSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
const here = dirname(fileURLToPath(import.meta.url));
const requireApi = createRequire(resolve(here, '../../../../../apps/api/package.json'));
const { Pool } = requireApi('pg');
const marked = JSON.parse(readFileSync(resolve(here, '../M01/cluster.json'), 'utf8'));
if (!marked.disposable || marked.port !== 55435 || marked.controlUrl !== 'postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test') throw new Error('Unmarked test cluster');
if (realpathSync(marked.data) !== 'C:\\Users\\josed\\AppData\\Local\\Temp\\koraz-guided-v2-3d5cf4ba2d2c45ee8e272fb75da35fbc'
  || realpathSync(marked.postgresBin) !== 'C:\\Users\\josed\\.codex\\tmp\\koraz-t015-postgres\\pgsql\\bin') throw new Error('Unexpected test paths');
function native(binary, args, name, accept = [0]) {
  const fd = openSync(join(here, `${name}.txt`), 'a');
  const result = spawnSync(join(marked.postgresBin, `${binary}.exe`), args, { windowsHide: true, stdio: ['ignore', fd, fd], timeout: 120000 });
  closeSync(fd);
  if (result.error || !accept.includes(result.status)) throw result.error ?? new Error(`${name} exited ${result.status}`);
  return result.status;
}
async function snapshot() {
  const pool = new Pool({ connectionString: marked.controlUrl, max: 1 });
  try { return { at: new Date().toISOString(), databases: (await pool.query("select datname,oid from pg_database where datname like 'koraz_guided_v2_test_%' order by datname")).rows,
    connections: (await pool.query("select datname,usename,application_name from pg_stat_activity where datname like 'koraz_guided_v2_test_%'")).rows }; }
  finally { await pool.end(); }
}
if (process.argv[2] === 'start') {
  if (existsSync(join(here, 'clusters.json'))) throw new Error('Already started');
  const stopped = native('pg_ctl', ['-D', marked.data, 'status'], 'postgres-initial-status', [0, 3]) === 3;
  if (stopped) native('pg_ctl', ['-D', marked.data, '-l', join(here, 'postgres-server.txt'), '-o', '-p 55435 -h 127.0.0.1', '-w', 'start'], 'postgres-start');
  writeFileSync(join(here, 'postgres-baseline.json'), JSON.stringify(await snapshot(), null, 2));
  const clusters = [{ ...marked, startedByT040: stopped }];
  writeFileSync(join(here, 'clusters.json'), JSON.stringify(clusters, null, 2));
  for (const [task, port] of [['T015', 55415], ['T018', 55418], ['T022', 55422]]) {
    const data = mkdtempSync(join(tmpdir(), `koraz-t040-${task.toLowerCase()}-`));
    const name = `koraz_${task.toLowerCase()}_test`;
    const url = `postgresql://koraz_test@127.0.0.1:${port}/${name}`;
    const item = { task, port, data, url, startedByT040: true, disposable: true, postgresBin: marked.postgresBin };
    clusters.push(item); writeFileSync(join(here, 'clusters.json'), JSON.stringify(clusters, null, 2));
    native('initdb', ['-D', data, '-U', 'koraz_test', '-A', 'trust', '--encoding=UTF8', '--locale=C'], `${task}-initdb`);
    native('pg_ctl', ['-D', data, '-l', join(here, `${task}-postgres-server.txt`), '-o', `-p ${port} -h 127.0.0.1`, '-w', 'start'], `${task}-postgres-start`);
    native('createdb', ['-h', '127.0.0.1', '-p', String(port), '-U', 'koraz_test', name], `${task}-createdb`);
  }
  console.log('Four marked local PostgreSQL clusters available; legacy port guards unchanged');
} else if (process.argv[2] === 'verify') {
  const before = JSON.parse(readFileSync(join(here, 'postgres-baseline.json'), 'utf8'));
  const after = await snapshot();
  const added = after.databases.filter(r => !before.databases.some(b => b.oid === r.oid && b.datname === r.datname));
  const removed = before.databases.filter(r => !after.databases.some(b => b.oid === r.oid && b.datname === r.datname));
  const legacy = [];
  const clusters = JSON.parse(readFileSync(join(here, 'clusters.json'), 'utf8'));
  for (const item of clusters.slice(1)) {
    const url = new URL(item.url), name = url.pathname.slice(1);
    if (!['koraz_t015_test', 'koraz_t018_test', 'koraz_t022_test'].includes(name)
      || !realpathSync(item.data).startsWith(join(tmpdir(), 'koraz-t040-'))) throw new Error('Unexpected legacy cleanup target');
    url.pathname = '/postgres';
    const pool = new Pool({ connectionString: url.href, max: 1 });
    try {
      const active = (await pool.query('select pid from pg_stat_activity where datname=$1', [name])).rows;
      if (active.length) throw new Error(`Active test connections remain in ${name}`);
      const existing = (await pool.query('select datname from pg_database where datname=$1', [name])).rows;
      if (existing.length) await pool.query(`drop database "${name}"`);
      const remaining = (await pool.query('select datname from pg_database where datname=$1', [name])).rows;
      legacy.push({ name, remaining, dropped: existing.length === 1 });
    } finally { await pool.end(); }
  }
  const status = !added.length && !removed.length && !after.connections.length && legacy.every(item => !item.remaining.length) ? 'PASS' : 'FAIL';
  writeFileSync(join(here, 'database-cleanup-verification.json'), JSON.stringify({ status, ...after, added, removed, legacy, preexistingPreserved: !removed.length }, null, 2));
  console.log(`PostgreSQL cleanup ${status}; added=${added.length}, removed=${removed.length}, active=${after.connections.length}`);
  if (status !== 'PASS') process.exitCode = 1;
} else if (process.argv[2] === 'stop') {
  const receipt = JSON.parse(readFileSync(join(here, 'database-cleanup-verification.json'), 'utf8'));
  if (receipt.status !== 'PASS' || Date.now() - Date.parse(receipt.at) > 60000) throw new Error('Fresh DB/connection verification required');
  const clusters = JSON.parse(readFileSync(join(here, 'clusters.json'), 'utf8'));
  for (const item of clusters.slice().reverse()) {
    if (!item.startedByT040) continue;
    if (item.port !== 55435 && (!realpathSync(item.data).startsWith(join(tmpdir(), 'koraz-t040-')) || ![55415, 55418, 55422].includes(item.port))) throw new Error('Invalid owned cluster');
    native('pg_ctl', ['-D', item.data, '-m', 'fast', '-w', 'stop'], `${item.port}-postgres-stop`);
  }
  console.log('Owned test clusters stopped; data directories preserved');
} else throw new Error('Use start, verify or stop');
