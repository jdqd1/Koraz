import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const root=new URL('../../../',import.meta.url),ev=new URL('docs/aprendizaje-guiado/v2/evidencias/RC01/',root);
const accounts=JSON.parse(await readFile(new URL('.env.rc01-staging-private/accounts.json',root),'utf8'));
const web='https://cediah-git-codex-cierre-pendientes-guided-v2-jdqd1s-projects.vercel.app';
let access=(await readFile(new URL('.env.rc01-staging-private/preview-access.txt',root),'utf8')).trim(),protection='';
for(let i=0;i<5;i++){
 const r=await fetch(access,{redirect:'manual',headers:protection?{cookie:protection}:{},signal:AbortSignal.timeout(120000)});
 const cookies=r.headers.getSetCookie().map(c=>c.split(';')[0]);if(cookies.length)protection=cookies.join('; ');
 if(![301,302,303,307,308].includes(r.status)){assert.equal(r.status,200);break;}
 access=new URL(r.headers.get('location'),access).href;assert.equal(new URL(access).hostname,new URL(web).hostname);
}
assert(protection);
const mode=process.argv[2];assert(['capture','maintenance','restored'].includes(mode));
const save=(name,value)=>writeFile(new URL(name,ev),JSON.stringify(value,null,2)+'\n');
const checks=[];
async function request(path,body,expected=200,who='learner'){
 const response=await fetch(web+'/api'+path,{method:body?'POST':'GET',headers:{cookie:protection+'; '+accounts[who].cookie,origin:web,...(body?{'content-type':'application/json','idempotency-key':randomUUID()}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(120000)});
 const value=await response.json();checks.push({path,status:response.status,who});assert.equal(response.status,expected);return value;
}
function facts(state){const copy=structuredClone(state);delete copy.availability;delete copy.nextAction;delete copy.maintenance.generatedAt;return copy;}
const baseline=mode==='capture'?{}:JSON.parse(await readFile(new URL('cloud-restart-baseline.json',ev),'utf8'));
for(const name of ['synthetic','pilot']){
 const journey=JSON.parse(await readFile(new URL(`cloud-${name}-journey.json`,ev),'utf8'));
 const state=(await request(`/v2/guided-learning/enrollments/${journey.enrollmentId}/state`)).state;
 const attemptId=journey.attempts.at(-1).attemptId;
 const attempt=(await request(`/v2/guided-learning/attempts/${attemptId}`)).attempt;
 if(mode==='capture')baseline[name]={state,attempt};
 else{
  assert.deepEqual(facts(state),facts(baseline[name].state),'Persisted learner facts must survive flag deployment');
  assert.deepEqual(attempt,baseline[name].attempt,'The saved manifest and receipts must survive restart');
  assert.equal(state.availability,mode==='maintenance'?'maintenance':'active');
  if(mode==='maintenance'){
   const denied=await request(`/v2/guided-learning/attempts/${attemptId}/complete`,{expectedVersion:attempt.rowVersion},503);assert.equal(denied.error,'guided_v2_maintenance');
  }
 }
}
if(mode==='capture')await save('cloud-restart-baseline.json',baseline);
if(mode==='restored'){
 const routes=JSON.parse(await readFile(new URL('cloud-routes.json',ev),'utf8'));
 const denied=await request('/v2/guided-learning/enrollments',{pathId:routes.synthetic.pathId},403);assert.equal(denied.error,'new_enrollments_disabled');
 await request('/v2/guided-learning/paths/circuito-neral',undefined,403,'outsider');
 const r=await fetch('https://cediah-api-staging-v2.onrender.com/__test/ready');assert.equal(r.status,404);checks.push({path:'/__test/ready',status:r.status});
}
await save(`cloud-rollback-${mode}.json`,{status:'PASS',at:new Date().toISOString(),scope:'Real protected Vercel BFF / Render API / PostgreSQL flag deployment and persisted read',productionTouched:false,checks});
console.log(mode+': PASS');
