import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
assert.equal(process.env.KORAZ_TEST_DATABASE, 'true');
const root = new URL('../../../', import.meta.url);
const {Pool} = createRequire(new URL('apps/api/package.json', root))('pg');
const evidence = new URL('docs/aprendizaje-guiado/v2/evidencias/RC01/', root);
const baseline = JSON.parse(readFileSync(new URL('cluster.json',evidence),'utf8'));
assert.equal(baseline.controlUrl,'postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test');
const paths=['fixture-run/test-environment.json',...readdirSync(evidence,{withFileTypes:true})
 .filter(d=>d.isDirectory()&&d.name.includes('browser-run')).map(d=>`${d.name}/fixture-run/test-environment.json`)]
 .filter(p=>existsSync(new URL(p,evidence)));
const owned=new Map();
for(const path of paths){
 const fixture=JSON.parse(readFileSync(new URL(path,evidence),'utf8'));
 assert.equal(fixture.productionTouched,false);
 assert.match(fixture.database,/^koraz_guided_v2_test_[a-f0-9]{32}$/);
 assert(!baseline.databasesBefore.some(x=>x.datname===fixture.database));
 owned.set(fixture.database,path);
}
const pool = new Pool({connectionString:baseline.controlUrl,max:1});
try {
 for(const [name] of owned)await pool.query(`drop database if exists "${name}" with (force)`);
 writeFileSync(new URL('interrupted-database-cleanup.json',evidence),JSON.stringify({ownedDatabases:[...owned].map(([database,evidence])=>({database,evidence})),status:'PASS',scope:'Only databases identified by RC01 fixture receipts; every preexisting database excluded'},null,2)+'\n');
 console.log('Owned interrupted fixture cleaned');
} finally {await pool.end();}
