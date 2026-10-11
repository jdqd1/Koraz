import { readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { V2HttpContracts } from '../../../../../packages/contracts/src/index.js';
const here = new URL('./', import.meta.url), base = 'http://127.0.0.1:41035';
const transcript:any[] = [], trace:any[] = [];
const out=(n:string,v:any)=>writeFileSync(new URL(n,here),JSON.stringify(v,null,2)+'\n');
const fixtures=await (await fetch(base+'/__test/ready')).json() as any;
assert.equal(fixtures.testOnly,true);
const fixture=fixtures.fixtures.synthetic, pkg=fixture.package;
assert.equal(fixture.status,'published');
const request=async(name:keyof typeof V2HttpContracts,path:string,body?:any,key=randomUUID())=>{
 const c=V2HttpContracts[name];const r=await fetch(base+path,{method:c.method,headers:{cookie:'t035=student-3',...(body?{'content-type':'application/json','idempotency-key':key}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const v=await r.json();transcript.push({name,path,status:r.status,value:v});assert.equal(r.status,200,JSON.stringify(v));return c.response.parse(v) as any;
};
let restartVerified=false,replayVerified=false;
try{
 const root='/v2/guided-learning';
 const enrolled=await request('enrollmentCreate',root+'/enrollments',{pathId:fixture.pathId});
 const enrollmentId=enrolled.state.enrollmentId;
 const state=async()=>(await request('enrollmentState',`${root}/enrollments/${enrollmentId}/state`)).state;
 async function attempt(key:string,kind='activity'){
  const s=await state();let a=(await request('attemptCreate',root+'/attempts',{clientAttemptId:randomUUID(),enrollmentId,target:{kind,key},expectedEnrollmentVersion:s.rowVersion})).attempt;
  const id=a.attemptId;let guard=0;
  while(a.activeActivity){assert(guard++<40);const activity=pkg.activities.find((x:any)=>x.key===a.activeActivity.key);assert(activity);
   for(const hidden of ['correctKey','acceptedAnswers','correctByPrompt','acceptedOrders','modelAnswer','rubric','distractorFeedback'])assert(!JSON.stringify(a.activeActivity).includes(`"${hidden}"`));
   let answer:any;
   switch(activity.kind){
    case 'study':answer={kind:activity.kind,acknowledged:true};break;
    case 'single_choice':answer={kind:activity.kind,optionKey:activity.payload.correctKey};break;
    case 'short_answer':answer={kind:activity.kind,text:activity.payload.acceptedAnswers[0]};break;
    case 'constructed_response':answer={kind:activity.kind,text:activity.payload.modelAnswer,selfRating:null};break;
    case 'match':answer={kind:activity.kind,pairs:activity.payload.correctByPrompt};break;
    case 'sequence':answer={kind:activity.kind,orderedKeys:activity.payload.acceptedOrders[0]};break;
    default:throw Error(activity.kind);
   }
   const body={activityKey:activity.key,answer,confidence:null,expectedVersion:a.rowVersion},responseKey=randomUUID();
   let receipt=await request('attemptResponse',`${root}/attempts/${id}/responses`,body,responseKey);a=receipt.attempt;
   if(!replayVerified&&receipt.accepted){
    const count=async()=>await(await fetch(base+`/__test/response-count/${id}`)).json();const prior=await count();
    const replay=await request('attemptResponse',`${root}/attempts/${id}/responses`,body,responseKey);
    const stable=(v:any)=>{const copy=structuredClone(v);delete copy.state.maintenance.generatedAt;return copy;};
    assert.deepEqual(stable(replay),stable(receipt));assert.deepEqual(await count(),prior);replayVerified=true;
   }
   if(activity.kind==='constructed_response'){
    assert.equal(receipt.accepted,false);a=(await request('attemptHelp',`${root}/attempts/${id}/help`,{activityKey:activity.key,kind:'reveal',expectedVersion:a.rowVersion})).attempt;
    receipt=await request('attemptResponse',`${root}/attempts/${id}/responses`,{...body,answer:{...answer,selfRating:'good'},expectedVersion:a.rowVersion});a=receipt.attempt;assert(receipt.accepted);
   }
   assert(receipt.accepted);assert(receipt.feedback);
   if(!restartVerified){
    const expected=structuredClone(a);const restart=await fetch(base+'/__test/restart',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});assert.equal(restart.status,200);await new Promise(r=>setTimeout(r,300));
    let ready=false;for(let n=0;n<50;n++){try{ready=(await fetch(base+'/__test/ready')).ok;}catch{}if(ready)break;await new Promise(r=>setTimeout(r,100));}assert(ready);
    a=(await request('attemptGet',`${root}/attempts/${id}`)).attempt;assert.deepEqual(a,expected);assert.equal((await state()).pathVersionId,fixture.pathVersionId);restartVerified=true;
   }
  }
  const completed=await request('attemptComplete',`${root}/attempts/${id}/complete`,{expectedVersion:a.rowVersion});assert.equal(completed.attempt.status,'completed');trace.push({key,kind,attemptId:id,state:completed.state});return completed.state;
 }
 const diagnostic=pkg.assessments.find((a:any)=>a.kind==='diagnostic');if(diagnostic)await attempt(diagnostic.key,'assessment');
 const visited=new Set();
 for(let i=0;i<70;i++){const s=await state();if(s.masteredAt)break;const action=s.nextAction;assert(action.key,JSON.stringify(s));assert(!visited.has(action.key),'Completed target repeated');visited.add(action.key);await attempt(action.key,['gate','retention'].includes(action.kind)?'assessment':action.kind==='review'?'review':'activity');}
 const immediate=await state();assert(immediate.masteredAt);assert(immediate.maintenance.gates.every((g:any)=>g.passed));assert.equal(immediate.consolidatedAt,null);
 await fetch(base+'/__test/clock',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({days:8})});
 await attempt(pkg.assessments.find((a:any)=>a.kind==='retention7').key,'assessment');
 await fetch(base+'/__test/clock',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({days:24})});
 await attempt(pkg.assessments.find((a:any)=>a.kind==='retention30').key,'assessment');
 const consolidated=await state();assert(consolidated.consolidatedAt);assert(consolidated.objectives.every((o:any)=>o.firstConsolidatedAt));assert(restartVerified&&replayVerified);
 const facts=await(await fetch(base+'/__test/durable')).json() as any;
 assert.equal(facts.database.name,fixtures.database);assert(facts.database.version.includes('PostgreSQL 17.11'));
 assert(facts.attempts.every((a:any)=>a.status==='completed'));assert(facts.responses.length>=15);
 assert(facts.responses.some((r:any)=>r.purpose==='retention7')&&facts.responses.some((r:any)=>r.purpose==='retention30'));
 out('database-facts.json',{status:'PASS',...facts});
 out('http-journey.json',{status:'PASS',database:fixtures.database,enrollmentId,pathVersionId:fixture.pathVersionId,contentHash:fixture.contentHash,immediate,consolidated,trace,restartVerified,replayVerified,privateAnswersExcluded:true,scope:'HTTP loopback + independent PostgreSQL; fixture identity; fictitious nonmedical source'});
 console.log(JSON.stringify({status:'PASS',attempts:trace.length,requests:transcript.length,persistedResponses:facts.responses.length}));
}catch(e){out('http-journey-failure.json',{error:String(e),stack:(e as Error).stack,trace});throw e;}finally{out('http-transcript.json',transcript);}
