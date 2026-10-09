import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const requireApi = createRequire(new URL('../../../../../apps/api/package.json', import.meta.url));
const { Pool } = requireApi('pg');
const ready = await (await fetch('http://127.0.0.1:41035/__test/ready')).json();
if (ready.testOnly !== true || !/^koraz_guided_v2_test_[a-f0-9]{32}$/.test(ready.database)) throw new Error('Unmarked fixture database');
const pool = new Pool({ connectionString: `postgresql://koraz_test@127.0.0.1:55435/${ready.database}`, max: 1 });
try {
  const attempts = (await pool.query("select user_id,status,snapshot_json->'orderedKeys' as activity_keys,resume_json->'activeIndex' as active_index from learning_v2_attempts where user_id in ('77000000-0000-4000-8000-000000000033','77000000-0000-4000-8000-000000000034') order by created_at")).rows;
  const connections = (await pool.query("select state,wait_event_type,wait_event from pg_stat_activity where datname=$1 and pid<>pg_backend_pid()", [ready.database])).rows;
  const result = { at: new Date().toISOString(), database: ready.database, attempts, connections };
  writeFileSync(new URL('browser-live-diagnostic.json', import.meta.url), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally { await pool.end(); }
