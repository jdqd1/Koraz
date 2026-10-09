import assert from 'node:assert/strict';
import { readFileSync,writeFileSync,existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here=fileURLToPath(new URL('./',import.meta.url)),root=resolve(here,'../../../../..');process.chdir(root);
const read=name=>JSON.parse(readFileSync(resolve(here,name),'utf8'));
const result=read('result.json'), counts=read('counts-and-omissions.json');
assert.equal(result.taskId,'T040');assert.equal(result.status,'PASS LOCAL');assert.equal(result.acceptanceComplete,false);
assert.equal(result.nextTaskStarted,false);assert.equal(result.commitCreated,false);
assert.equal(result.finalSha,execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
assert.equal(result.summary.newRegressionsDetected,0);
assert.deepEqual(result.summary.api,{passed:593,failed:0,skipped:3,files:60});
assert.deepEqual(result.summary.web,{passed:483,failed:0,files:62});
assert.deepEqual(result.summary.guidedV2,{passed:20,failed:0,skipped:6});
assert.deepEqual(result.summary.legacy,{passed:63,failed:0,skipped:1});
assert.equal(counts['large-editor-effective'].passed,2);assert.equal(counts['large-editor-effective'].failed,0);
assert.equal(counts['legacy-effective'].failures.length,0);
assert.equal(counts['editor-repair-final'].stats.expected,4);
assert.equal(read('before-authorized-repair/counts-and-omissions.json')['legacy-effective'].failures.length,4);
assert.equal(read('repair-authorization.json').status,'AUTORIZADO');
assert.equal(read('repair-authorization.json').proposalSha256,createHash('sha256').update(readFileSync(resolve(here,'before-authorized-repair/REPARACION-LEGADO-PROPUESTA.md'))).digest('hex'));
assert.equal(result.repair.productionBehaviorChanged,false);
assert.equal(result.matrix.V04.spokenScreenReader,'NO VERIFICADO');
assert.deepEqual(result.nextTaskIds,['T041']);
assert.ok(read('baseline-compatibility.json').compared.every(c=>c.unchangedSinceT001));
assert.equal(read('preservation.json').status,'PASS');assert.equal(read('preservation.json').changed.length,11);
assert.equal(read('database-cleanup-verification.json').status,'PASS');assert.equal(read('services-final.json').status,'PASS');
assert.ok(read('registry-mutation.json').otherEntriesPreserved);
assert.ok(read('repair-registry-mutation.json').otherEntriesPreserved);
const registry=JSON.parse(readFileSync(resolve(root,'docs/aprendizaje-guiado/v2/registro-ejecucion.json'),'utf8'));
assert.equal(registry.tasks.find(t=>t.taskId==='T040').status,result.status);
assert.equal(read('repair-registry-mutation.json').afterSha256,createHash('sha256').update(readFileSync(resolve(root,'docs/aprendizaje-guiado/v2/registro-ejecucion.json'))).digest('hex'));
assert.equal(read('accessibility-summary.json').seriousCritical,0);assert.equal(read('accessibility-summary.json').overflows,0);
assert.equal(read('accessibility-summary.json').largeEditors.length,2);
assert.equal(read('manifest-summary.json').status,'PASS');
assert.ok(!readFileSync(resolve(here,'README.md'),'utf8').includes('undefined'));
for(const check of result.checks) assert.ok(existsSync(resolve(here,check.evidence)),check.evidence);
execFileSync('git',['diff','--check']);
const artifacts=['README.md','result.json','counts-and-omissions.json','preservation.json','registry-mutation.json','head-movement.json',
 'database-cleanup-verification.json','services-final.json','baseline-compatibility.json','api-test.json','api-images-final.json','web-test.json',
 'playwright.json','playwright-guided-recheck.json','playwright-security-recheck.json','playwright-legacy.json','playwright-legacy-production.json',
 'playwright-large-editor-confirmed.json','regression-final-validator.json','regression-final-load.json','accessibility-summary.json','manifest-summary.json',
 'repair-authorization.json','repair-registry-mutation.json','web-editor-repair-final.json','playwright-editor-repair-final.json','REPARACION-LEGADO-PROPUESTA.md'];
writeFileSync(resolve(here,'artifact-integrity.json'),JSON.stringify(artifacts.map(path=>({path,sha256:createHash('sha256').update(readFileSync(resolve(here,path))).digest('hex')})),null,2));
writeFileSync(resolve(here,'closure-check.json'),JSON.stringify({status:'PASS',recordedUtc:new Date().toISOString(),taskStatus:result.status,
 finalSha:result.finalSha,countsConsistent:true,originalFailuresRetained:true,legacyExceptions:0,approval:'AUTORIZADO; aplicado y verificado',
 preservation:'PASS',databaseCleanup:'PASS',services:'PASS',gitDiffCheck:'PASS',artifactHashes:artifacts.length,nextTaskStarted:false},null,2));
console.log(`Closure evidence PASS; task ${result.status}; ${artifacts.length} artifact hashes`);
