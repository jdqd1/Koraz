import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {mkdtemp,readFile,unlink} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {Pool}=createRequire(new URL('../package.json',import.meta.url))('pg');
const sha=value=>createHash('sha256').update(value).digest('hex');
export async function restoreDrill(target){
 assert.equal(target.hostname,'dpg-db5gi7id0e5s73fcvc20-a');
 assert.equal(target.pathname,'/koraz_guided_v2_staging');
 const directory=await mkdtemp('/tmp/koraz-rc01-restore-');
 const dump=directory+'/backup.dump';
 const restoreName='koraz_rc01_restore_'+randomUUID().replaceAll('-','');
 assert.match(restoreName,/^koraz_rc01_restore_[a-f0-9]{32}$/);
 const pool=new Pool({connectionString:target.href,max:1});
 const pgEnv={...process.env,PGHOST:target.hostname,PGPORT:target.port||'5432',PGUSER:decodeURIComponent(target.username),
  PGPASSWORD:decodeURIComponent(target.password),PGDATABASE:target.pathname.slice(1)};
 function native(binary,args,database=pgEnv.PGDATABASE){
  const start=performance.now();
  const result=spawnSync(binary,args,{env:{...pgEnv,PGDATABASE:database},encoding:'utf8',timeout:180000,maxBuffer:1048576});
  assert.equal(result.status,0,`${binary} failed (details withheld to protect credentials)`);
  return performance.now()-start;
 }
 async function fingerprint(connection){
  const tables=(await connection.query("select schemaname,tablename from pg_tables where schemaname in ('public','private') order by schemaname,tablename")).rows;
  const rows={};
  for(const t of tables){
   assert.match(t.schemaname,/^[a-z_]+$/);assert.match(t.tablename,/^[a-z0-9_]+$/);
   const data=(await connection.query(`select to_jsonb(t)::text value from "${t.schemaname}"."${t.tablename}" t order by to_jsonb(t)::text`)).rows.map(r=>r.value);
   rows[t.schemaname+'.'+t.tablename]={count:data.length,sha256:sha(data.join('\n'))};
  }
  const sequences=(await connection.query("select schemaname,sequencename,last_value from pg_sequences where schemaname in ('public','private') order by schemaname,sequencename")).rows;
  return {rows,sequences};
 }
 let created=false,restored,phase='dump';
 try{
  const client=await pool.connect();let before,dumpMs;
  try{
   await client.query('begin isolation level repeatable read read only');
   const snapshot=(await client.query('select pg_export_snapshot() snapshot')).rows[0].snapshot;
   before=await fingerprint(client);
   dumpMs=native('pg_dump',['--format=custom','--no-owner','--snapshot',snapshot,'--file',dump]);
   native('pg_dump',['--schema-only','--no-owner','--snapshot',snapshot,'--file',directory+'/before.sql']);
   await client.query('commit');
  }finally{client.release();}
  phase='create-target';
  await pool.query(`create database "${restoreName}"`);created=true;
  phase='restore-command';
  const restoreMs=native('pg_restore',['--exit-on-error','--no-owner','--dbname',restoreName,dump],restoreName);
  const restoredUrl=new URL(target);restoredUrl.pathname='/'+restoreName;
  restored=new Pool({connectionString:restoredUrl.href,max:1});
  phase='compare-rows';
  const after=await fingerprint(restored);assert.deepEqual(after,before);
  native('pg_dump',['--schema-only','--no-owner','--file',directory+'/after.sql'],restoreName);
  const schema=file=>readFile(directory+'/'+file,'utf8').then(s=>s.replace(/^\\(?:un)?restrict .*\r?\n/gm,''));
  phase='compare-schema';
  const beforeSchema=await schema('before.sql'),afterSchema=await schema('after.sql');
  if(sha(afterSchema)!==sha(beforeSchema)){
   const a=beforeSchema.split('\n'),b=afterSchema.split('\n');
   console.log('RC01_RESTORE_SCHEMA_DIFF '+JSON.stringify(a.flatMap((line,index)=>line===b[index]?[]:[{line:index+1,before:line,after:b[index]}]).slice(0,8)));
  }
  assert.equal(sha(afterSchema),sha(beforeSchema));
  const bytes=await readFile(dump);
  console.log('RC01_RESTORE '+JSON.stringify({status:'PASS',scope:'Isolated Render PostgreSQL staging recovery drill',
   sourceDatabase:pgEnv.PGDATABASE,restoreDatabase:restoreName,tables:Object.keys(before.rows).length,
   matchingTableCountsAndHashes:true,matchingSequences:true,matchingSchemaAndGrants:true,
   backupBytes:bytes.length,backupSha256:sha(bytes),dumpMs,restoreMs,rows:before.rows,
   limitation:'Temporary test backup; no production retention or RPO/RTO acceptance'}));
 }catch(error){
  console.log('RC01_RESTORE_FAILURE '+JSON.stringify({status:'FAIL',phase,errorCode:error?.code??error?.name,detail:phase==='restore-command'||phase==='dump'?String(error.message).slice(0,100):'See sanitized comparison phase'}));
  throw error;
 }finally{
  await restored?.end();
  if(created)await pool.query(`drop database "${restoreName}"`);
  await pool.end();
  for(const file of ['backup.dump','before.sql','after.sql'])await unlink(directory+'/'+file).catch(()=>{});
 }
 console.log('RC01_RESTORE_CLEANUP '+JSON.stringify({status:'PASS',removedRestoreDatabase:restoreName,sourcePreserved:true}));
}
