import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { createGuidedV2Server } from '../../../../../apps/api/test/helpers/guided-v2-server.ts';
const require = createRequire(new URL('../../../../../apps/api/package.json', import.meta.url));
const { Pool } = require('pg');
const h = await createGuidedV2Server();
let runtime, denials = 0;
const start = performance.now();
const denied = async (pool, query) => {
  await assert.rejects(pool.query(query), error => error.code === '42501'); denials++;
};
try {
  const tables = ['bindings','imports','attempts','responses','objective_state','activity_state','review_state'].map(name => `learning_v2_${name}`);
  for (const role of ['anon','authenticated']) {
    const url = new URL(h.db.url); url.username = role;
    const pool = new Pool({ connectionString: url.href, max: 1 });
    try {
      assert.deepEqual((await pool.query('select current_user as actor')).rows, [{actor: role}]);
      for (const table of tables) {
        const column = (await h.db.pool.query("select column_name from information_schema.columns where table_schema='public' and table_name=$1 order by ordinal_position limit 1", [table])).rows[0].column_name;
        for (const query of [`select * from ${table}`,`insert into ${table} default values`,`update ${table} set ${column}=${column}`,`delete from ${table}`]) await denied(pool,query);
      }
      for (const signature of ['private.lock_guided_v2_actor(uuid)','private.lock_guided_v2_catalog(text,uuid)'])
        assert.deepEqual((await h.db.pool.query("select has_function_privilege($1,$2,'EXECUTE') allowed", [role,signature])).rows,[{allowed:false}]);
      await denied(pool,'select * from private.guided_v2_audit');
    } finally { await pool.end(); }
  }
  const url = new URL(h.db.url); url.username = 'cediah_runtime'; runtime = new Pool({connectionString:url.href,max:1});
  assert.deepEqual((await runtime.query('select current_user as actor,rolsuper,rolbypassrls from pg_roles where rolname=current_user')).rows,
    [{actor:'cediah_runtime',rolsuper:false,rolbypassrls:false}]);
  assert.deepEqual((await h.db.pool.query("select relname from pg_class where relname=any($1) and (not relrowsecurity or pg_get_userbyid(relowner)='cediah_runtime')", [tables])).rows,[]);
  for (const query of ['select * from auth_users','select * from auth_sessions','select * from auth_accounts',"update content_items set title='spoof'",
    "update content_assets set status='pending'","update learning_resource_revisions set payload_json='{}'",'delete from learning_v2_responses','update learning_v2_responses set score01=1','select * from audit_log']) await denied(runtime,query);
  assert.equal(denials,67);
  const report = {status:'PASS',elapsedMs:performance.now()-start,denials,connections:['anon','authenticated','cediah_runtime'],
    scope:'Independent exact S06 SQL permission assertions with Node assert; no Vitest 5s deadline; does not turn timed-out Vitest case into PASS',database:h.db.name,at:new Date().toISOString()};
  await writeFile(new URL('cache-permission-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
} finally {
  await runtime?.end(); await h.close();
  await writeFile(new URL('cache-permission-audit-cleanup.json',import.meta.url),JSON.stringify({database:h.db.name,closed:true})+'\n');
}
