import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {V2HttpContracts} from '../../../packages/contracts/dist/index.js';
const root=new URL('../../../',import.meta.url),evidence=new URL('docs/aprendizaje-guiado/v2/evidencias/RC01/',root);
const accounts=JSON.parse(await readFile(new URL('.env.rc01-staging-private/accounts.json',root),'utf8'));
const api='https://cediah-api-staging-v2.onrender.com';
const web='https://cediah-git-codex-cierre-pendientes-guided-v2-jdqd1s-projects.vercel.app';
let access=(await readFile(new URL('.env.rc01-staging-private/preview-access.txt',root),'utf8')).trim(),protection='';
for(let i=0;i<5;i++){
 const r=await fetch(access,{redirect:'manual',headers:protection?{cookie:protection}:{},signal:AbortSignal.timeout(120000)});
 const cookies=r.headers.getSetCookie().map(c=>c.split(';')[0]);if(cookies.length)protection=cookies.join('; ');
 if(![301,302,303,307,308].includes(r.status)){assert.equal(r.status,200,'Preview protection access failed');break;}
 access=new URL(r.headers.get('location'),access).href;
 assert.equal(new URL(access).hostname,new URL(web).hostname,'Unexpected preview redirect');
}
assert(protection,'The protected preview must issue its own access cookie');
const seed=JSON.parse(await readFile(new URL('staging-seed.json',evidence),'utf8'));
const approval=JSON.parse(await readFile(new URL('pilot-human-review.json',evidence),'utf8'));
const transcript=[],journeys={};
// routes.ts recomputes the current maintenance projection on every receipt replay.
// Only its generatedAt timestamp is volatile; compare all learner facts and receipts.
function stableReceipt(value){const copy=structuredClone(value);if(copy.state?.maintenance)delete copy.state.maintenance.generatedAt;return copy;}
const save=async(name,value)=>writeFile(new URL(name,evidence),JSON.stringify(value,null,2)+'\n');
async function request(name,path,body,who='editor',key=randomUUID(),expected=200){
 const c=V2HttpContracts[name];if(body)c.body.parse(body);
 const cookie=[protection,who?accounts[who].cookie:''].filter(Boolean).join('; ');
 const response=await fetch(web+'/api'+path,{method:c.method,headers:{cookie,origin:web,...(body?{'content-type':'application/json','idempotency-key':key}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(120000)});
 const value=await response.json();
 transcript.push({operation:name,path,who:who??'anonymous',status:response.status,idempotencyKey:body?key:null,...(response.status!==expected?{error:value.error}: {})});
 await save('cloud-flow-transcript.json',transcript);
 assert.equal(response.status,expected,`${name}: ${JSON.stringify(value.error)}`);
 return expected===200?c.response.parse(value):value;
}
function answer(a){switch(a.kind){
 case 'study':return {kind:a.kind,acknowledged:true};
 case 'single_choice':return {kind:a.kind,optionKey:a.payload.correctKey};
 case 'short_answer':return {kind:a.kind,text:a.payload.acceptedAnswers[0]};
 case 'match':return {kind:a.kind,pairs:a.payload.correctByPrompt};
 case 'sequence':return {kind:a.kind,orderedKeys:a.payload.acceptedOrders[0]};
 case 'constructed_response':return {kind:a.kind,text:a.payload.modelAnswer,selfRating:null};
 default:throw new Error('Unsupported staging test activity');}}
const editorRoot='/v2/editor/learning-paths',learnerRoot='/v2/guided-learning';
let routes;try{routes=JSON.parse(await readFile(new URL('cloud-routes.json',evidence),'utf8'));}catch{routes={};}
try{
 for(const name of ['synthetic','pilot']){
  const fixture=JSON.parse(await readFile(new URL(`fixture-run/${name}-server-fixture.json`,evidence),'utf8'));
  const pkg=fixture.package,b=seed.bindings[name];
  assert(pkg.sources.every(s=>s.documentSha256===b.sourceHash),'Staging source snapshot must match the exact locally reviewed binding');
  const bindings={topicContentId:b.topicContentId,sources:pkg.sources.map(s=>({key:s.key,sourceContentId:b.guideContentId,resourceRevisionId:b.resourceRevisionId})),assets:[]};
  if(name==='pilot'){assert.equal(approval.approved,true);assert.equal(fixture.contentHash,approval.contentHash);}
  let route;
  if(routes[name])route=(await request('editorGet',`${editorRoot}/${routes[name].pathId}`)).route;
  else{
   const validated=await request('importValidate',`${editorRoot}/imports/validate`,{package:pkg,bindings,targetPathId:null,expectedVersion:null});assert.equal(validated.readyToImport,true);
   const body={hash:validated.hash,expectedVersion:null},key=randomUUID();
   const committed=await request('importCommit',`${editorRoot}/imports/${validated.importId}/commit`,body,'editor',key);
   assert.deepEqual(await request('importCommit',`${editorRoot}/imports/${validated.importId}/commit`,body,'editor',key),committed);
   route=(await request('editorGet',`${editorRoot}/${committed.pathId}`)).route;
   routes[name]={pathId:route.pathId,contentHash:fixture.contentHash,slug:pkg.route.slug};await save('cloud-routes.json',routes);
  }
  assert.deepEqual((await request('editorExport',`${editorRoot}/${route.pathId}/export`)).package,pkg);
  if(route.status==='draft')route=(await request('editorTransition',`${editorRoot}/${route.pathId}/transition`,{status:'in_review',expectedVersion:route.editVersion,reviewNote:'RC01: revisión del hash exacto para prueba, sin aprobación de producción.'})).route;
  if(route.status==='in_review')route=(await request('editorTransition',`${editorRoot}/${route.pathId}/transition`,{status:'approved',expectedVersion:route.editVersion,reviewNote:name==='pilot'?`Propietario: Revisado y aprobado para prueba; hash ${approval.contentHash}.`:'Fixture ficticio de prueba, sin contenido médico.'})).route;
  if(route.status==='approved')route=(await request('editorTransition',`${editorRoot}/${route.pathId}/transition`,{status:'published',expectedVersion:route.editVersion,reviewNote:'Publicación únicamente en staging aislado RC01.'})).route;
  assert.equal(route.status,'published');routes[name]={...routes[name],pathVersionId:route.pathVersionId,status:route.status};await save('cloud-routes.json',routes);
  await request('publicPath',`${learnerRoot}/paths/${pkg.route.slug}`,undefined,null,undefined,401);
  await request('publicPath',`${learnerRoot}/paths/${pkg.route.slug}`,undefined,'outsider',undefined,403);
  let path=(await request('publicPath',`${learnerRoot}/paths/${pkg.route.slug}`,undefined,'learner')).path;
  if(!path.enrollmentId){const body={pathId:route.pathId},key=randomUUID();const first=await request('enrollmentCreate',`${learnerRoot}/enrollments`,body,'learner',key);assert.deepEqual(await request('enrollmentCreate',`${learnerRoot}/enrollments`,body,'learner',key),first);}
  path=(await request('publicPath',`${learnerRoot}/paths/${pkg.route.slug}`,undefined,'learner')).path;
  const enrollmentId=path.enrollmentId;assert(enrollmentId);
  const state=async()=>(await request('enrollmentState',`${learnerRoot}/enrollments/${enrollmentId}/state`,undefined,'learner')).state;
  const attempts=[];let replayVerified=false;
  for(let count=0;count<60;count++){
   const s=await state();if(s.masteredAt||s.nextAction.kind==='none')break;
   let attempt;
   if(s.nextAction.kind==='resume')attempt=(await request('attemptGet',`${learnerRoot}/attempts/${s.nextAction.key}`,undefined,'learner')).attempt;
   else{
    const action=s.nextAction,target={kind:['gate','retention'].includes(action.kind)?'assessment':action.kind==='review'?'review':'activity',key:action.key};
    attempt=(await request('attemptCreate',`${learnerRoot}/attempts`,{clientAttemptId:randomUUID(),enrollmentId,target,expectedEnrollmentVersion:s.rowVersion},'learner')).attempt;
   }
   const attemptId=attempt.attemptId;
   for(let guard=0;guard<50&&attempt.activeActivity;guard++){
    const publicJson=JSON.stringify(attempt.activeActivity);for(const k of ['correctKey','acceptedAnswers','correctByPrompt','acceptedOrders','modelAnswer','rubric'])assert(!publicJson.includes(`"${k}"`));
    const a=pkg.activities.find(a=>a.key===attempt.activeActivity.key);assert(a);
    let body={activityKey:a.key,answer:answer(a),confidence:null,expectedVersion:attempt.rowVersion};
    const key=randomUUID();let result=await request('attemptResponse',`${learnerRoot}/attempts/${attemptId}/responses`,body,'learner',key);
    if(a.kind==='constructed_response'){
     assert.equal(result.accepted,false);
     const help=await request('attemptHelp',`${learnerRoot}/attempts/${attemptId}/help`,{activityKey:a.key,kind:'reveal',expectedVersion:result.attempt.rowVersion},'learner');
     body={...body,answer:{...body.answer,selfRating:'good'},expectedVersion:help.attempt.rowVersion};
     result=await request('attemptResponse',`${learnerRoot}/attempts/${attemptId}/responses`,body,'learner');
    }else if(!replayVerified){
     assert.deepEqual(stableReceipt(await request('attemptResponse',`${learnerRoot}/attempts/${attemptId}/responses`,body,'learner',key)),stableReceipt(result));replayVerified=true;
    }
    assert.equal(result.accepted,true);attempt=result.attempt;
    assert.equal(attempt.acceptedResponses.filter(r=>r.activityKey===a.key).length,1);
    assert.deepEqual((await request('attemptGet',`${learnerRoot}/attempts/${attemptId}`,undefined,'learner')).attempt,attempt);
   }
   assert.equal(attempt.activeActivity,null);
   const complete=await request('attemptComplete',`${learnerRoot}/attempts/${attemptId}/complete`,{expectedVersion:attempt.rowVersion},'learner');assert.equal(complete.attempt.status,'completed');
   attempts.push({attemptId,status:complete.attempt.status,acceptedResponses:complete.attempt.acceptedResponses.length});
  }
  const final=await state();assert(attempts.length>0||final.masteredAt);assert(replayVerified||final.masteredAt);
  journeys[name]={status:'PASS',scope:'Real Better Auth; protected Vercel BFF; Render API/PostgreSQL; import/export, review/publication, enrollment, answer replay, persisted read and session closure',contentHash:fixture.contentHash,enrollmentId,attempts,replayVerified,masteredAt:final.masteredAt,nextAction:final.nextAction,exhaustedBanks:final.maintenance.exhaustedBanks,
    limitation:'No clock override in cloud. Deferred retention is proven by the local guarded clock journeys; this cloud run only records presently eligible work.'};
  await save(`cloud-${name}-journey.json`,journeys[name]);console.log(`${name}: ${attempts.length} persisted sessions; mastery=${Boolean(final.masteredAt)}`);
 }
 await save('cloud-flow-result.json',{status:'PASS',productionTouched:false,journeys});
}catch(error){await save('cloud-flow-result.json',{status:'FAIL',error:String(error),journeys});throw error;}
