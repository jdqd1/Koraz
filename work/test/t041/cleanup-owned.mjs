/** Recovery after an interrupted harness: only the two names in its ownership receipt. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const out = new URL('../../../docs/aprendizaje-guiado/v2/evidencias/T041/', import.meta.url);
const read = name => JSON.parse(readFileSync(new URL(name, out), 'utf8'));
const cluster = read('cluster.json'), owned = read('owned-databases.json');
assert.equal(process.env.KORAZ_TEST_DATABASE, 'true');
assert.equal(cluster.controlUrl, 'postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test');
const { Pool } = createRequire(new URL('../../../apps/api/package.json', import.meta.url))('pg');
const pool = new Pool({ connectionString: cluster.controlUrl, max: 1 });
const removed = [];
try {
  for (const name of [owned.restored, owned.source].filter(Boolean)) {
    assert.match(name, /^koraz_guided_v2_test_[a-f0-9]{32}$/);
    assert.ok(!cluster.databasesBefore.some(r => r.datname === name));
    const active = (await pool.query('select pid from pg_stat_activity where datname=$1', [name])).rows;
    assert.deepEqual(active, [], 'Refuse cleanup while connections remain');
    const present = (await pool.query('select datname from pg_database where datname=$1', [name])).rows;
    if (present.length) { await pool.query(`drop database "${name}"`); removed.push(name); }
  }
} finally { await pool.end(); }
writeFileSync(new URL('interrupted-cleanup.json', out), JSON.stringify({ status: 'PASS', removedOwnedDatabases: removed, existingDatabasesUntouched: true, reason: 'Initial Playwright teardown waited for socket close before DB cleanup finished; teardown now waits for this run-specific receipt.' }, null, 2));
console.log('Interrupted harness cleanup PASS: ' + removed.length + ' owned databases removed');
