// Apply the user's explicit temporary change of acceptance scope; never manufacture Q19 PASS.
import assert from 'node:assert/strict';
import { readFileSync,writeFileSync,copyFileSync,existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const dir='docs/aprendizaje-guiado/v2/evidencias/T042/';
const registryPath='docs/aprendizaje-guiado/v2/registro-ejecucion.json';
const actaPath='docs/aprendizaje-guiado/v2/acta-HITO-S.md';
const load=path=>JSON.parse(readFileSync(root+path,'utf8').replace(/^\uFEFF/,''));
const save=(path,value)=>writeFileSync(root+path,JSON.stringify(value,null,2)+'\n');
const sha=path=>createHash('sha256').update(readFileSync(root+path)).digest('hex');
const registry=load(registryPath),task=registry.tasks.find(t=>t.taskId==='T042');
const previousOther=JSON.stringify({...registry,tasks:registry.tasks.filter(t=>t.taskId!=='T042')});
assert.equal(task.nextTaskStarted,false);
assert.equal(task.checklist.filter(c=>c.status==='PASS').length,23);
assert.equal(task.checklist.find(c=>c.id==='Q19').status,'NO VERIFICADO');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),task.baseSha);
const hashes=load(dir+'candidate-hashes.json').hashes;
for(const item of hashes)assert.equal(sha(item.path),item.sha256,`Contract drift: ${item.path}`);
assert.equal(load(dir+'validator-tests.json').numPassedTests,23);
assert.equal(load(dir+'validator-tests.json').numFailedTests,0);
assert.equal(load(dir+'auth-api.json').success,true);
for(const [name,count] of [['mobile',7],['desktop',2],['auth-bff',1]]){
  const stats=load(dir+name+'.json').stats;
  assert.equal(stats.expected,count);assert.equal(stats.unexpected,0);assert.equal(stats.skipped,0);
}
assert.equal(load(dir+'reader-manual/cluster-cleanup.json').preexistingPreserved,true);
assert.equal(load(dir+'reader-manual/services-cleanup.json').testServicesStopped,true);
for(const [source,target] of [[dir+'result.json',dir+'result-before-reader-deferral.json'],[actaPath,dir+'acta-before-reader-deferral.md'],[registryPath,dir+'registry-before-reader-deferral.json'],[dir+'README.md',dir+'README-before-reader-deferral.md'],[dir+'closure-verification.json',dir+'closure-before-reader-deferral.json']]){
  if(!existsSync(root+target))copyFileSync(root+source,root+target);
}
const at=new Date().toISOString();
const deferral={at,clientDate:'2026-10-10',timezone:'America/Caracas',authorizedBy:'Direct human user message in this chat',requestExact:'por ahora la accesibilidad no me importa, salta esa parte del narrador, me interesa mas la implementacion del sistema de rutas',temporary:true,scope:'Defer the remaining real screen-reader inspection Q19/V04 and its unresolved manual-journey discrepancy; retain the completed keyboard/mobile/zoom/axe evidence',overrides:'Original handoff requires full Q19/V04 before acceptance. User explicitly changes that gate for continued route implementation.',checkStatus:'NO VERIFICADO',doesNotVerifyAccessibility:true,originalFullSystemAcceptance:false,implementationAcceptance:true,successorBlockedByDeferredReader:false,pendingEvidence:dir+'reader-manual/observations.json',runtimeChanged:false,otherCriteriaWaived:false,productionAuthorized:false,nextTaskStarted:false};
save(dir+'reader-deferral.json',deferral);
const frozen={at,baseSha:task.baseSha,accepted:true,frozen:true,acceptanceKind:'provisional_implementation_with_user_exception',originalFullSystemAcceptance:false,schemaVersion:'2.0',policyVersion:'guided-v2.0',schedulerVersion:'scheduler-v2.0',deferralEvidence:dir+'reader-deferral.json',hashes};
save(dir+'accepted-contract-hashes.json',frozen);
const result=load(dir+'result.json');
Object.assign(result,{at,status:'PASS',decision:'accept_with_exception',systemAcceptance:false,implementationAcceptance:true,originalAcceptanceCriteriaSatisfied:false,acceptanceScope:'Provisional acceptance for continued route implementation, under the explicit user deferral of real screen-reader Q19/V04',scopeAmendment:dir+'reader-deferral.json',nextTaskIds:['T043'],successorBlocked:false,nextTaskStarted:false,requiredScopeSummary:{pass:23,fail:0,notVerified:0,deferred:1}});
result.summary={passLocal:23,fail:0,notVerified:1};
result.contract={...result.contract,accepted:true,frozen:true,acceptanceKind:frozen.acceptanceKind,hashRecordKind:'Frozen contract for provisional implementation acceptance with explicit user exception',hashesEvidence:dir+'accepted-contract-hashes.json',manifestSha256:sha(dir+'accepted-contract-hashes.json'),originalFullSystemAcceptance:false,deferralEvidence:dir+'reader-deferral.json'};
const issue=result.issues.find(i=>i.code==='R42-02_ACCESSIBILITY_AND_MOBILE');
Object.assign(issue,{status:'NO VERIFICADO',disposition:'DEFERRED_BY_USER',blockingSystemAcceptance:true,blockingImplementationAcceptance:false,deferralEvidence:dir+'reader-deferral.json'});
issue.detail+=' User explicitly defers the remaining reader inspection and its discrepancy for continued implementation; this does not resolve or verify that inspection.';
result.limits=[...new Set(result.limits)];
result.limits.push('Provisional implementation acceptance with Q19/V04 deferred by the user; original 24/24 Hito S and complete accessibility acceptance not claimed');
result.checks.push({command:'User-authorized Q19/V04 scope amendment and exact contract hash verification',result:'PASS for revised implementation gate; reader remains NO VERIFICADO',evidence:dir+'reader-deferral.json'});
if(!result.changedFiles.includes('work/test/t042/defer-reader.mjs'))result.changedFiles.push('work/test/t042/defer-reader.mjs');
save(dir+'result.json',result);
Object.assign(task,{recordedUtc:at,status:result.status,decision:result.decision,scope:result.acceptanceScope,checks:result.checks,issues:result.issues,changedFiles:result.changedFiles,contract:result.contract,systemAcceptance:false,implementationAcceptance:true,originalAcceptanceCriteriaSatisfied:false,scopeAmendment:result.scopeAmendment,requiredScopeSummary:result.requiredScopeSummary,summary:result.summary,successorBlocked:false,nextTaskIds:['T043'],nextTaskStarted:false,remediationProposalIds:[],deferredCheckIds:['Q19'],priorReaderReview:{status:'NO VERIFICADO',evidence:dir+'acta-before-reader-deferral.md'}});
delete task.resumeTaskId;
assert.equal(JSON.stringify({...registry,tasks:registry.tasks.filter(t=>t.taskId!=='T042')}),previousOther);
save(registryPath,registry);
// Keep the historical acta as a snapshot and write a single, unambiguous current decision.
const oldActa=readFileSync(root+dir+'acta-before-reader-deferral.md','utf8');
const rows=oldActa.split('\n').filter(line=>/^\| Q\d\d \|/.test(line));
assert.equal(rows.length,24);
const currentRows=rows.map(line=>line.startsWith('| Q19 |')?'| Q19 | **NO VERIFICADO — aplazado por el usuario** | [Excepción expresa](evidencias/T042/reader-deferral.json). Se conserva teclado/móvil/zoom/axe y la [inspección humana parcial](evidencias/T042/reader-manual/observations.md), incluida la discrepancia de persistencia. V04 deja de bloquear la continuación de implementación; no se declara superado. |':line);
writeFileSync(root+actaPath,`# Acta de Hito S — T042

**Decisión actual: aceptación provisional de implementación con excepción expresa del usuario. T042: PASS en el alcance ajustado; 23 criterios PASS, Q19 NO VERIFICADO y aplazado.** No se declara el Hito S original 24/24 ni accesibilidad completa. T043 puede continuar con este contrato y esta excepción; todavía no se inició.

El usuario pidió literalmente: «${deferral.requestExact}». Su instrucción cambia temporalmente el requisito de lector del handoff para priorizar implementación de rutas. [Autorización, alcance y límites](evidencias/T042/reader-deferral.json). No se marca Q19 PASS ni se eliminan resultados anteriores. El desacuerdo entre el informe humano y la sesión persistida permanece abierto dentro de esa inspección aplazada; no invalida ni sustituye las pruebas HTTP/browser automatizadas existentes.

Base: ${task.baseSha}. Revisión: ${at}. Schema 2.0, policy guided-v2.0, scheduler scheduler-v2.0. Identidad del contrato verificada nuevamente antes de congelar. [Resultado](evidencias/T042/result.json), [manifest de contrato congelado](evidencias/T042/accepted-contract-hashes.json).

## Criterios y evidencia

El criterio original y su resultado permanecen visibles. El alcance requerido actual contiene 23 criterios satisfechos y una excepción temporal; los conteos históricos de tests no se suman ni se convierten en otra ejecución.

| ID | Estado | Evidencia y conclusión |
|---|---|---|
${currentRows.join('\n')}

## Contrato congelado para la implementación

accepted:true, frozen:true, acceptanceKind:provisional_implementation_with_user_exception. La excepción debe acompañar el contrato en cualquier trabajo posterior; no habilita afirmaciones de accesibilidad completa o del Hito S original sin reservas. Se conservan las mismas reglas, versiones y fuentes runtime.

| Artefacto | SHA-256 de bytes |
|---|---|
${hashes.map(h=>'| `'+h.path+'` | `'+h.sha256+'` |').join('\n')}

## Preservación y límites

[Acta antes del aplazamiento](evidencias/T042/acta-before-reader-deferral.md), [resultado anterior](evidencias/T042/result-before-reader-deferral.json) y [registro anterior](evidencias/T042/registry-before-reader-deferral.json) conservan el rechazo y la discrepancia. La revisión inicial y fallos de pruebas anteriores siguen preservados en el dossier. Las reparaciones de bundle, equivalencia backend/CLI, móvil y autenticación permanecen verificadas; no se reescribió su evidencia.

El contenido piloto y su aprobación editorial quedan intactos. [Limpieza de sesión manual](evidencias/T042/reader-manual/cluster-cleanup.json) y [servicios detenidos](evidencias/T042/reader-manual/services-cleanup.json). [Preservación del workspace](evidencias/T042/preservation.json). No se modificaron runtime, políticas, dependencias ni otras tareas en esta decisión. No hubo despliegue o commit. No se afirma producción, eficacia educativa, competencia clínica, dispositivo físico ni certificación WCAG completa.

El siguiente paso disponible es T043, empaquetado de este contrato con su excepción. T043 y la skill no fueron iniciados por este cierre.
`);
writeFileSync(root+dir+'README.md',`# T042 — aceptación provisional para implementación

**PASS en el alcance ajustado por el usuario: 23 PASS, Q19/V04 NO VERIFICADO y aplazado.** La prueba de lector deja de bloquear el trabajo de rutas. No se declara 24/24 ni accesibilidad completa; T043 queda disponible, sin iniciar.

[Acta actual](../../acta-HITO-S.md), [resultado](result.json), [excepción autorizada](reader-deferral.json), [contrato congelado](accepted-contract-hashes.json), [preservación](preservation.json).

El usuario pidió priorizar implementación y saltar por ahora Narrator. La excepción es temporal y se limita al lector pendiente y a su discrepancia manual. La inspección permanece NO VERIFICADO; otras pruebas y políticas no cambian. La aceptación completa del Hito S original sigue pendiente.

Pruebas ya realizadas: equivalencia backend/CLI/bundle 23 PASS; auth API real 1 PASS; auth BFF real 1 PASS; móvil E01–E07 7 PASS sin omisiones; escritorio E02/E07 2 PASS. Tipos/lint focalizado y contratos build exit 0. Se recalcularon los 14 hashes exactos para esta aceptación, sin repetir suites cuyos archivos no cambiaron.

[Informe humano conservado](reader-manual/observations.md), [recorrido persistido](reader-manual/persisted-manual-journey.json), [limpieza](reader-manual/cluster-cleanup.json), [puertos y Narrator detenidos](reader-manual/services-cleanup.json). No se solicita otra inspección de lector mientras esté aplazada.

[Acta anterior](acta-before-reader-deferral.md), [resultado anterior](result-before-reader-deferral.json), [README anterior con reproducción de las suites](README-before-reader-deferral.md) conservados. El script finalize.mjs y record-reader-review.mjs documentan estados anteriores y no deben usarse para reemplazar este cierre vigente.

Sin cambios runtime/editoriales, dependencias, producción, despliegue o commit en este aplazamiento. No se inició T043.
`);
let manual=readFileSync(root+dir+'reader-manual.md','utf8');
manual=manual.replace(/^# .*$/m,'# V04 — prueba aplazada por el usuario');
manual=manual.replace(/\n\nActualización 2026-10-10:/,'\n\nEstado vigente: aplazado por instrucción del usuario. [Excepción y alcance](reader-deferral.json). Este procedimiento y su discrepancia se conservan como evidencia histórica; no bloquean la implementación ni requieren repetición ahora.\n\nActualización 2026-10-10:');
writeFileSync(root+dir+'reader-manual.md',manual);
console.log('T042: provisional implementation acceptance; Q19 remains NO VERIFICADO, explicitly deferred; contract hashes frozen; T043 not started.');
