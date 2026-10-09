import {createRequire} from 'node:module';
import {readdir,readFile,writeFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
const require=createRequire(new URL('../../../../../apps/api/package.json',import.meta.url));
const {Pool}=require('pg');
const output=new URL('./',import.meta.url);
const names=[];
for(const file of await readdir(output)) if(file.endsWith('-cleanup.json') && file!=='services-cleanup.json') {
  const {database,closed}=JSON.parse(await readFile(new URL(file,output),'utf8'));
  if(!closed || !/^koraz_guided_v2_test_[a-f0-9]{32}$/.test(database))throw new Error('Invalid disposable cleanup receipt');
  names.push(database);
}
const pool=new Pool({connectionString:'postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test',max:1});
try {
  const remaining=(await pool.query('select datname from pg_database where datname=any($1::text[])',[names])).rows;
  const unreceiptedDisposableDatabases=(await pool.query("select datname,oid from pg_database where datname ~ '^koraz_guided_v2_test_[a-f0-9]{32}$' and not(datname=any($1::text[]))",[names])).rows;
  const cluster=JSON.parse(await readFile(new URL('../M01/cluster.json',output),'utf8'));
  if(!cluster.disposable || cluster.port!==55435 || cluster.controlUrl!=='postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test') throw new Error('Unexpected disposable cluster');
  const baselineCreatedAt=(await stat(new URL('baseline-hashes.json',output))).birthtime.toISOString();
  for(const row of unreceiptedDisposableDatabases) {
    if(!/^\d+$/.test(String(row.oid))) throw new Error('Invalid database oid');
    row.directoryCreatedAt=(await stat(join(cluster.data,'base',String(row.oid)))).birthtime.toISOString();
  }
  const preexistingDatabasesPreserved=unreceiptedDisposableDatabases.filter(row=>row.directoryCreatedAt<baselineCreatedAt);
  const unreceiptedCurrentDatabases=unreceiptedDisposableDatabases.filter(row=>row.directoryCreatedAt>=baselineCreatedAt);
  const otherConnections=(await pool.query('select datname,state from pg_stat_activity where pid<>pg_backend_pid() and backend_type=$1',['client backend'])).rows;
  const report={status:remaining.length===0 && otherConnections.length===0 && unreceiptedCurrentDatabases.length===0?'PASS':'FAIL',databases:names,remaining,baselineCreatedAt,preexistingDatabasesPreserved,unreceiptedCurrentDatabases,otherConnections,at:new Date().toISOString()};
  await writeFile(new URL('database-cleanup-verification.json',output),JSON.stringify(report,null,2)+'\n');
  console.log(report);
  if(remaining.length || otherConnections.length || unreceiptedCurrentDatabases.length)process.exitCode=1;
}finally{await pool.end();}
