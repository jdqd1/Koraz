// Only the named, newly created RC01 staging service may run this inventory.
// No credentials, account rows or arbitrary SQL are exposed through HTTP or logs.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readdir, readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const require=createRequire(new URL('../package.json',import.meta.url));
const {Pool}=require('pg');
const emit=value=>console.log('RC01_INVENTORY '+JSON.stringify(value));
try {
 assert.equal(process.env.RENDER_SERVICE_ID,'srv-db5gma942hec738t9gu0');
 assert.equal(process.env.DATABASE_MIGRATIONS_ENABLED,'false');
 const target=new URL(process.env.DATABASE_URL);
 assert.equal(target.hostname,'dpg-db5gi7id0e5s73fcvc20-a');
 assert.equal(target.pathname,'/koraz_guided_v2_staging');
 assert.equal(target.username,'koraz_guided_v2_staging_user');
 const pool=new Pool({connectionString:target.href,max:1,connectionTimeoutMillis:15000});
 try {
  await pool.query('begin read only');
  const identity=(await pool.query(`select current_database() database,current_user db_role,
    current_setting('server_version') version,r.rolsuper,r.rolcreatedb,r.rolcreaterole,r.rolbypassrls
    from pg_roles r where r.rolname=current_user`)).rows[0];
  const applied=(await pool.query('select file_name,checksum from public.cediah_schema_migrations order by file_name')).rows;
  const excluded=(await pool.query('select file_name,checksum,reason from public.cediah_schema_migration_exclusions order by file_name')).rows;
  const expected=[];
  for(const file of (await readdir('/app/database/migrations')).filter(f=>/^\d+_[a-z0-9_]+\.sql$/.test(f)).sort()){
   const sha=createHash('sha256').update(await readFile('/app/database/migrations/'+file)).digest('hex');
   const row=applied.find(r=>r.file_name===file)??excluded.find(r=>r.file_name===file);
   assert.equal(row?.checksum,sha,`Migration mismatch ${file}`);
   expected.push(file);
  }
  assert.equal(applied.length+excluded.length,expected.length);
  const tables=(await pool.query(`select schemaname,tablename,tableowner from pg_tables
    where schemaname in ('public','private') order by schemaname,tablename`)).rows;
  const roles=(await pool.query(`select rolname,rolsuper,rolcreatedb,rolcreaterole,rolbypassrls
    from pg_roles where rolname in ('cediah_runtime','anon','authenticated') order by rolname`)).rows;
  const counts=(await pool.query(`select (select count(*)::int from public.auth_users) accounts,
    (select count(*)::int from public.learning_path_versions where engine_version='v2') v2_versions,
    (select count(*)::int from public.learning_enrollments) enrollments`)).rows[0];
  await pool.query('commit');
  emit({status:'PASS',scope:'Read-only internal RC01 staging inventory',identity,
    migrationChecksumsVerified:true,applied,excluded,tables,roles,counts});
 } finally {await pool.end();}
} catch(error) {
 // Error messages can contain connection details; only print a known error code/name.
 emit({status:'FAIL',errorCode:error?.code??error?.name??'unknown'});
 process.exit(1);
}
await import('../dist/server.js');
