import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../../../../apps/api/package.json',import.meta.url));
const {Pool}=require('pg');
assert.equal(process.env.KORAZ_TEST_DATABASE,'true');
const url='postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test';
assert.equal(process.env.KORAZ_GUIDED_V2_TEST_DATABASE_URL,url);
const pool=new Pool({connectionString:url,max:1}),checks:any[]=[];
try{
 for(const issues of [[],[{code:'SOURCE_CHANGED',severity:'error'}]]){
  try{const r=await pool.query('select $1::jsonb value',[issues]);checks.push({issues,rawDriverResult:r.rows[0].value,rawPreservesArray:Array.isArray(r.rows[0].value)});assert.equal(Array.isArray(r.rows[0].value),false);}
  catch(e){assert.equal((e as any).code,'22P02');checks.push({issues,rawDriverError:(e as any).code});}
  const r=await pool.query('select $1::jsonb value',[JSON.stringify(issues)]);assert.deepEqual(r.rows[0].value,issues);checks.push({serializedPreservesOriginalIssues:true,issues});
 }
 const evidence=new URL('./',import.meta.url);
 const abandoned=JSON.parse(readFileSync(new URL('harness-registration-failure/test-environment.json',evidence),'utf8')).database;
 assert(/^koraz_guided_v2_test_[a-f0-9]{32}$/.test(abandoned));
 assert(!readFileSync(new URL('databases-before.txt',evidence),'utf8').includes(abandoned));
 await pool.query(`drop database "${abandoned}"`);
 writeFileSync(new URL('pg-array-reproduction.json',evidence),JSON.stringify({status:'PASS',checks,removedAbandonedDatabase:abandoned,noValidationChange:true},null,2)+'\n');
 console.log(JSON.stringify({status:'PASS',checks:checks.length,removedAbandonedDatabase:abandoned}));
}finally{await pool.end();}
