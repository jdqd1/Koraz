import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {Pool}=createRequire(new URL('../package.json',import.meta.url))('pg');
const roleNames=['cediah_runtime','rc01_auth_runtime'];
export async function bootstrap(target){
 const pool=new Pool({connectionString:target.href,max:1});
 try{
  const secrets=roleNames.map(()=>randomBytes(32).toString('hex'));
  await pool.query('begin');
  try{
   const present=(await pool.query('select rolname from pg_roles where rolname=any($1)',[roleNames])).rows;
   assert([0,2].includes(present.length),'Partial role setup requires review');
   if(!present.length){
    for(const role of roleNames)await pool.query(`create role ${role} login nosuperuser nocreatedb nocreaterole noinherit nobypassrls`);
    await pool.query(`grant connect on database koraz_guided_v2_staging to cediah_runtime,rc01_auth_runtime;
      grant usage on schema public,private to cediah_runtime,rc01_auth_runtime;
      grant select on public.auth_users,public.user_roles,public.profiles,public.courses,public.enrollments,
        public.subjects,public.content_topics,public.content_subjects,public.content_topic_subjects,
        public.content_topic_item_order to cediah_runtime;
      grant select,insert,update,delete on public.auth_users,public.auth_sessions,public.auth_accounts,
        public.auth_verifications,public.auth_rate_limits to rc01_auth_runtime;`);
    for(const file of (await readdir('/app/database/migrations')).filter(f=>/^\d+_.*\.sql$/.test(f)).sort()){
     const source=await readFile('/app/database/migrations/'+file,'utf8');
     for(const block of source.matchAll(/do \$\$[\s\S]*?\$\$;/gi)){
      if(block[0].includes("rolname = 'cediah_runtime'")||block[0].includes("rolname='cediah_runtime'"))await pool.query(block[0]);
     }
    }
   }
   for(let i=0;i<roleNames.length;i++)await pool.query(`alter role ${roleNames[i]} password '${secrets[i]}'`);
   await pool.query('commit');
  }catch(error){await pool.query('rollback');throw error;}
  const urls=roleNames.map((role,i)=>{const u=new URL(target);u.username=role;u.password=secrets[i];return u.href;});
  for(let i=0;i<roleNames.length;i++){
   const runtime=new Pool({connectionString:urls[i],max:1});
   try{
    const row=(await runtime.query(`select current_user role,rolsuper,rolcreatedb,rolcreaterole,rolbypassrls
      from pg_roles where rolname=current_user`)).rows[0];
    assert.equal(row.role,roleNames[i]);for(const p of ['rolsuper','rolcreatedb','rolcreaterole','rolbypassrls'])assert.equal(row[p],false);
    const checks=i===0?[
     ['select','public.auth_users',true],['update','public.auth_users',false],
     ['select','public.learning_v2_responses',true],['insert','public.learning_v2_responses',true],
     ['update','public.learning_v2_responses',false],['delete','public.learning_v2_responses',false],
     ['select','public.audit_log',false],['select','private.guided_v2_audit',true]
    ]:[['update','public.auth_users',true],['select','public.learning_v2_responses',false],['update','public.content_items',false]];
    for(const [permission,table,expected] of checks)assert.equal((await runtime.query('select has_table_privilege(current_user,$1,$2) allowed',[table,permission])).rows[0].allowed,expected,`${row.role} ${permission} ${table}`);
    console.log('RC01_ROLE '+JSON.stringify({status:'PASS',role:row,privilegeChecks:checks.length}));
   }finally{await runtime.end();}
  }
  return {databaseUrl:urls[0],authDatabaseUrl:urls[1]};
 }finally{await pool.end();}
}
