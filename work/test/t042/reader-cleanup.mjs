// Recover the manual session's cleanup without replacing its original database baseline.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, realpathSync, openSync, closeSync } from 'node:fs';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const dir=resolve(root,'docs/aprendizaje-guiado/v2/evidencias/T042/reader-manual');
const load=path=>JSON.parse(readFileSync(path,'utf8'));
const receipt=load(join(dir,'cluster.json'));
const marker=load(resolve(root,'docs/aprendizaje-guiado/v2/evidencias/M01/cluster.json'));
assert.equal(process.env.KORAZ_TEST_DATABASE,'true');
assert.equal(receipt.disposable,true);
assert.equal(receipt.controlUrl,marker.controlUrl);
assert.equal(receipt.controlUrl,'postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test');
assert.equal(receipt.port,55435);
assert.equal(realpathSync(receipt.data),'C:\\Users\\josed\\AppData\\Local\\Temp\\koraz-guided-v2-3d5cf4ba2d2c45ee8e272fb75da35fbc');
assert.equal(realpathSync(receipt.postgresBin),'C:\\Users\\josed\\.codex\\tmp\\koraz-t015-postgres\\pgsql\\bin');
function native(args,accepted=[0]){
  const fd=openSync(join(dir,'cleanup-recovery.txt'),'a');
  const result=spawnSync(join(receipt.postgresBin,'pg_ctl.exe'),args,{windowsHide:true,stdio:['ignore',fd,fd],timeout:30000});
  closeSync(fd);if(result.error)throw result.error;assert.ok(accepted.includes(result.status));return result.status;
}
const initialStatus=native(['-D',receipt.data,'status'],[0,3]);
let restarted=false;
try{
  if(initialStatus===3){native(['-D',receipt.data,'-l',join(dir,'cleanup-recovery-server.txt'),'-o','-p 55435 -h 127.0.0.1','-w','start']);restarted=true;}
  const {Pool}=createRequire(resolve(root,'apps/api/package.json'))('pg');
  const pool=new Pool({connectionString:receipt.controlUrl,max:1});
  let after;
  let removedManualDatabase=null;
  try{
    after=(await pool.query('select datname,oid from pg_database order by datname')).rows;
    const extras=after.filter(row=>!receipt.databasesBefore.some(before=>before.datname===row.datname));
    if(extras.length){
      writeFileSync(join(dir,'cleanup-first-comparison.json'),JSON.stringify({at:new Date().toISOString(),baseline:receipt.databasesBefore,after,extras},null,2)+'\n');
      assert.deepEqual(extras,[{datname:'koraz_guided_v2_test_47b314ace25f4af4b4eeb8c527eff398',oid:292924}]);
      const url=new URL(receipt.controlUrl);url.pathname='/'+extras[0].datname;
      const inspect=new Pool({connectionString:url.href,max:1});
      try{
        const tables=(await inspect.query("select tablename from pg_tables where schemaname='public' and (tablename like 'learning_v2_%' or tablename='learning_paths') order by tablename")).rows;
        const evidence={at:new Date().toISOString(),database:extras[0],tables:{}};
        for(const {tablename} of tables){
          assert.ok(/^[a-z_0-9]+$/.test(tablename));
          if(['learning_paths','learning_v2_enrollments','learning_v2_attempts','learning_v2_responses','learning_v2_objective_states','learning_v2_misconception_states'].includes(tablename))evidence.tables[tablename]=(await inspect.query(`select to_jsonb(t) as row from public.${tablename} t limit 10`)).rows.map(r=>r.row);
        }
        writeFileSync(join(dir,'persisted-manual-journey.json'),JSON.stringify(evidence,null,2)+'\n');
        if(process.argv[2]==='inspect')console.log(JSON.stringify(evidence));
        else{
          // Attribute the sole new database to this session before using the harness's cleanup operation.
          assert.deepEqual(evidence.tables.learning_paths.map(p=>p.slug).sort(),['t035-small','t035-large','t035-editorial','t035-editorial-mobile'].sort());
          for(const path of evidence.tables.learning_paths){
            assert.equal(path.created_by,'77000000-0000-4000-8000-000000000001');
            assert.ok(Date.parse(path.created_at)>=Date.parse('2026-10-10T22:50:00Z')&&Date.parse(path.created_at)<Date.parse('2026-10-10T22:53:00Z'));
          }
          const actors=(await inspect.query("select id,email from auth_users order by id")).rows;
          assert.equal(actors.length,40);
          for(let n=1;n<=40;n++)assert.deepEqual(actors[n-1],{id:`77000000-0000-4000-8000-${String(n).padStart(12,'0')}`,email:`t035-${n}@example.test`});
          const users=(await inspect.query('select distinct user_id from learning_enrollments')).rows;
          assert.deepEqual(users,[{user_id:'77000000-0000-4000-8000-000000000030'}]);
          removedManualDatabase={...extras[0],attributedBy:'Absent from original baseline; created during manual launch; exact four T035 routes, forty synthetic users, sole learner student-30; persisted state saved before cleanup'};
        }
      }finally{await inspect.end();}
      if(removedManualDatabase){
        const active=(await pool.query('select count(*)::int n from pg_stat_activity where datname=$1',[removedManualDatabase.datname])).rows[0].n;
        assert.equal(active,0,'Do not remove a database still used by a session');
        await pool.query(`drop database "${removedManualDatabase.datname}"`);
        after=(await pool.query('select datname,oid from pg_database order by datname')).rows;
      }
    }
  }finally{await pool.end();}
  if(process.argv[2]!=='inspect'){
  assert.deepEqual(after,receipt.databasesBefore,'Manual baseline must remain identical; do not drop unrecognized databases');
  writeFileSync(join(dir,'cluster-cleanup.json'),JSON.stringify({status:'PASS',at:new Date().toISOString(),databasesBefore:receipt.databasesBefore,databasesAfter:after,preexistingPreserved:true,baselineReplaced:false,initialFailure:'Human stop attempt: ECONNREFUSED after Ctrl+C stopped the cluster; screenshot provided in chat',initialStatus,restartedForVerification:restarted,removedManualDatabase},null,2)+'\n');
  console.log('PASS: exact manual database baseline preserved; no extra databases.');
  }
}finally{
  if(restarted||receipt.startedByT042)native(['-D',receipt.data,'-m','fast','-w','stop']);
}
assert.equal(native(['-D',receipt.data,'status'],[0,3]),3);
console.log('PASS: marked cluster stopped; directory preserved.');
