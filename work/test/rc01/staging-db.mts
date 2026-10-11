import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import pg from '../../../apps/api/node_modules/pg/lib/index.js';
const {Pool}=pg;
const root=new URL('../../../',import.meta.url);
const raw=readFileSync(new URL('.env.rc01-staging',root),'utf8');
const value=raw.split(/\r?\n/).find(line=>line.startsWith('STAGING_DATABASE_URL='))?.slice('STAGING_DATABASE_URL='.length).trim();
assert(value,'Save the isolated staging External Database URL in the Git-ignored local file');
const target=new URL(value.replace(/^['"]|['"]$/g,''));
assert.equal(target.hostname,'dpg-db5gi7id0e5s73fcvc20-a.oregon-postgres.render.com');
assert.equal(decodeURIComponent(target.pathname),'/koraz_guided_v2_staging');
assert.equal(target.username,'koraz_guided_v2_staging_user');
target.searchParams.delete('sslmode');
const pool=new Pool({connectionString:target.toString(),sslNegotiation:'direct',ssl:{rejectUnauthorized:true,servername:target.hostname},max:1,connectionTimeoutMillis:60000});
try{
 const identity=(await pool.query('select current_database() as database, current_user as role, version() as version')).rows[0];
 assert.equal(identity.database,'koraz_guided_v2_staging');
 const migrations=(await pool.query('select file_name,checksum from public.cediah_schema_migrations order by file_name')).rows;
 const exclusions=(await pool.query('select file_name,checksum,reason from public.cediah_schema_migration_exclusions')).rows;
 const roles=(await pool.query('select rolname,rolsuper,rolbypassrls,rolcreatedb,rolcreaterole from pg_roles where rolname=current_user or rolname=$1',['cediah_runtime'])).rows;
 const tables=(await pool.query("select schemaname,tablename,tableowner,rowsecurity from pg_tables where schemaname in ('public','private') order by schemaname,tablename")).rows;
 writeFileSync(new URL('docs/aprendizaje-guiado/v2/evidencias/RC01/staging-db-inventory.json',root),JSON.stringify({at:new Date().toISOString(),identity,migrations,exclusions,roles,tables,tlsCertificateVerified:true},null,2)+'\n');
 console.log(JSON.stringify({database:identity.database,migrations:migrations.length,tables:tables.length,tlsCertificateVerified:true}));
}finally{await pool.end();}
