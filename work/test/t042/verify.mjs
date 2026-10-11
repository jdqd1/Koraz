import assert from 'node:assert/strict';
import { readFileSync,writeFileSync,existsSync } from 'node:fs';
import { resolve,dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const dossier=resolve(root,'docs/aprendizaje-guiado/v2/evidencias/T042');
const load=path=>JSON.parse(readFileSync(path,'utf8').replace(/^\uFEFF/,''));
const acta=resolve(root,'docs/aprendizaje-guiado/v2/acta-HITO-S.md');
const docs=[acta,resolve(dossier,'README.md'),resolve(dossier,'reader-manual.md')];
let links=0;
for(const file of docs){
  const body=readFileSync(file,'utf8');assert.ok(!/[ \t]+$/m.test(body));
  for(const match of body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){
    if(/^https?:/.test(match[1]))continue;
    assert.ok(existsSync(resolve(dirname(file),match[1].split('#')[0])),`Missing link: ${match[1]}`);links++;
  }
}
const task=load(resolve(root,'docs/aprendizaje-guiado/v2/registro-ejecucion.json')).tasks.find(t=>t.taskId==='T042');
assert.equal(new Set(task.checklist.map(c=>c.id)).size,24);
assert.equal(task.checklist.filter(c=>c.status==='PASS').length,23);
assert.equal(task.checklist.filter(c=>c.status==='NO VERIFICADO').length,1);
assert.equal(task.nextTaskStarted,false);
const deferred=task.scopeAmendment==='docs/aprendizaje-guiado/v2/evidencias/T042/reader-deferral.json';
if(deferred){
  const waiver=load(resolve(dossier,'reader-deferral.json'));
  assert.equal(waiver.authorizedBy,'Direct human user message in this chat');
  assert.equal(waiver.checkStatus,'NO VERIFICADO');assert.equal(waiver.doesNotVerifyAccessibility,true);
  assert.equal(task.status,'PASS');assert.equal(task.decision,'accept_with_exception');
  assert.equal(task.systemAcceptance,false);assert.equal(task.implementationAcceptance,true);
  assert.equal(task.originalAcceptanceCriteriaSatisfied,false);
  assert.equal(task.checklist.find(c=>c.id==='Q19').status,'NO VERIFICADO');
  assert.equal(task.successorBlocked,false);assert.deepEqual(task.nextTaskIds,['T043']);
  assert.equal(task.contract.accepted,true);assert.equal(task.contract.frozen,true);
  const frozen=load(resolve(dossier,'accepted-contract-hashes.json'));
  assert.equal(frozen.acceptanceKind,'provisional_implementation_with_user_exception');
  assert.equal(frozen.originalFullSystemAcceptance,false);
  for(const item of frozen.hashes)assert.equal(createHash('sha256').update(readFileSync(resolve(root,item.path))).digest('hex'),item.sha256);
  assert.equal(createHash('sha256').update(readFileSync(resolve(dossier,'accepted-contract-hashes.json'))).digest('hex'),task.contract.manifestSha256);
}else assert.equal(task.contract.frozen,false);
const preservation=load(resolve(dossier,'preservation.json'));
assert.equal(preservation.otherRegistryUnchanged,true);assert.equal(preservation.headUnchanged,true);assert.deepEqual(preservation.missing,[]);
const allowed=['apps/api/test/guided-v2-package.test.ts','apps/web/tests/e2e/guided-v2-journeys.spec.ts','packages/contracts/bin/validate-learning-route.bundle.mjs','docs/aprendizaje-guiado/v2/acta-HITO-S.md','docs/aprendizaje-guiado/v2/registro-ejecucion.json'];
assert.deepEqual(preservation.changed.map(c=>c.path).sort(),allowed.sort());
const hashList=load(resolve(dossier,'candidate-hashes.json')).hashes;
for(const item of hashList)assert.equal(createHash('sha256').update(readFileSync(resolve(root,item.path))).digest('hex'),item.sha256);
const currentRegistry=load(resolve(root,'docs/aprendizaje-guiado/v2/registro-ejecucion.json'));
const originalRegistry=load(resolve(dossier,'registry-before-repair.json'));
const other=record=>({...record,tasks:record.tasks.filter(t=>t.taskId!=='T042')});
assert.deepEqual(other(currentRegistry),other(originalRegistry));
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),task.baseSha);
execFileSync('git',['diff','--check'],{cwd:root,encoding:'utf8'});
const result={status:'PASS',at:new Date().toISOString(),existingLocalLinks:links,exactCandidateHashes:hashList.length,uniqueChecklistItems:24,summary:task.summary,implementationAcceptance:task.implementationAcceptance??false,readerDeferred:deferred,originalFullSystemAcceptance:false,
  preservation:'7522 baseline files; only five authorized preexisting files changed; no missing files; other registry entries/metadata and HEAD unchanged',gitDiffCheckExit:0};
writeFileSync(resolve(dossier,'closure-verification.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
