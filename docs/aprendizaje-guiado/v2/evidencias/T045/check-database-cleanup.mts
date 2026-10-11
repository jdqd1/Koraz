import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../../../../apps/api/package.json',import.meta.url));
const{Pool}=require('pg');
const here=new URL('./',import.meta.url);
const url='postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test';
assert.equal(process.env.KORAZ_TEST_DATABASE,'true');assert.equal(process.env.KORAZ_GUIDED_V2_TEST_DATABASE_URL,url);
const pool=new Pool({connectionString:url,max:1});
try{
 const before=readFileSync(new URL('databases-before.txt',here),'utf8').replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean).sort();
 const after=(await pool.query('select datname from pg_database order by datname')).rows.map((r:any)=>r.datname).sort();
 assert.deepEqual(after,before);
 const cleanup=JSON.parse(readFileSync(new URL('database-cleanup.json',here),'utf8'));assert.equal(cleanup.status,'PASS');assert(!after.includes(cleanup.removedDatabase));
 writeFileSync(new URL('database-inventory-check.json',here),JSON.stringify({status:'PASS',before,after,newDatabasesRemaining:[],priorDatabasesPreserved:true,latestRemovedDatabase:cleanup.removedDatabase},null,2)+'\n');
 console.log(JSON.stringify({status:'PASS',priorDatabasesPreserved:after.length,newDatabasesRemaining:0}));
}finally{await pool.end();}
