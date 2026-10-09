import {createRequire} from 'node:module';
import {randomUUID,createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createGuidedV2Database} from '../../../../../apps/api/test/helpers/guided-v2-db.js';
import {createPostgresGuidedLearningV2Provider} from '../../../../../apps/api/src/providers/postgres-guided-learning-v2.js';
import {registerGuidedV2EditorImportRoutes} from '../../../../../apps/api/src/guided-learning/v2/editor-routes.js';
import {createGuidedV2HttpProvider,registerGuidedV2Routes} from '../../../../../apps/api/src/guided-learning/v2/routes.js';
import {hashRoutePackage} from '../../../../../apps/api/src/guided-learning/v2/validation.js';
import {hashLearningSnapshot} from '../../../../../apps/api/src/guided-learning/snapshot-hash.js';
import {RoutePackageSchema,V2HttpContracts} from '../../../../../packages/contracts/src/index.js';

const here=new URL('./',import.meta.url),pilot=new URL('../../piloto/',here);
const read=(name:string,base=here)=>JSON.parse(readFileSync(new URL(name,base),'utf8'));
const out=(name:string,value:unknown,base=here)=>writeFileSync(new URL(name,base),JSON.stringify(value,null,2)+'\n');
const pkg=RoutePackageSchema.parse(read('vascularizacion-abdomen.koraz-route.json',pilot));
const approval=read('aprobacion-propietario.json',pilot),manifest=read('manifest-piloto.json',pilot),snapshot=read('fuente-seleccionada.json',pilot);
const contentHash=hashRoutePackage(pkg);
assert.equal(approval.status,'APROBACION HUMANA RECIBIDA');assert.equal(approval.statement,'revisado y aprobado');assert.equal(approval.contentHash,contentHash);assert.equal(contentHash,manifest.contentHash);
assert.equal(createHash('sha256').update(readFileSync(new URL('vascularizacion-abdomen.koraz-route.json',pilot))).digest('hex'),approval.packageFileSha256);
const requireApi=createRequire(new URL('../../../../../apps/api/package.json',import.meta.url));
const Fastify=requireApi('fastify');const {Kysely,PostgresAdapter,PostgresIntrospector,PostgresQueryCompiler}=requireApi('kysely');
const pg=await createGuidedV2Database();let db:any,app:any,baseUrl='';
let clock=new Date('2026-10-08T23:00:00.000Z');
const actor=randomUUID(),beginner=randomUUID(),reinforcement=randomUUID(),topic=randomUUID(),guide=randomUUID(),resource=randomUUID(),revision=randomUUID();
const identities=new Map([['operator',actor],['beginner',beginner],['reinforcement',reinforcement]]);
const transcript:any[]=[];let publication:any;
const request=async(name:keyof typeof V2HttpContracts,path:string,body?:any,who='operator',key=randomUUID())=>{
 const contract=V2HttpContracts[name];const response=await fetch(baseUrl+path,{method:contract.method,headers:{cookie:`t039=${who}`,...(body?{'content-type':'application/json','idempotency-key':key}:{})},...(body?{body:JSON.stringify(body)}:{})});const value=await response.json();
 transcript.push({name,path,who,at:clock.toISOString(),status:response.status,body:value});
 assert.equal(response.status,200,`${name} ${path}: ${JSON.stringify(value)}`);
 return contract.response.parse(value) as any;
};
async function openApp(){
 app=Fastify();const identityProvider={getUser:async(r:any)=>{const id=identities.get(/(?:^|;\s*)t039=([^;]+)/.exec(r.cookie??'')?.[1]??'');return id?{id}:null;}};
 await registerGuidedV2EditorImportRoutes(app,{identityProvider:identityProvider as any,contentProvider:{getRoles:async(userId:string)=>userId===actor?['administrator']:[]} as any,provider:createPostgresGuidedLearningV2Provider(db,{now:()=>clock})});
 await registerGuidedV2Routes(app,{identityProvider:identityProvider as any,flags:{enabled:true,newEnrollments:true},provider:createGuidedV2HttpProvider(db,{now:()=>clock})});
 baseUrl=await app.listen({host:'127.0.0.1',port:0});
}
try {
 for(const [id,name,email]of [[actor,'Delegado local: aprobación humana T039','t039-delegate@example.test'],[beginner,'Alumno técnico principiante T039','t039-beginner@example.test'],[reinforcement,'Alumno técnico refuerzo T039','t039-reinforcement@example.test']])await pg.query('insert into auth_users(id,name,email) values($1,$2,$3)',[id,name,email]);
 for(const id of [beginner,reinforcement])await pg.query("insert into learning_preferences(user_id,timezone) values($1,'America/Caracas')",[id]);
 for(const [id,kind,slug,title]of [[topic,'topic','t039-abdomen','Abdomen'],[guide,'guide','t039-guia-snapshot',snapshot.title]])await pg.query("insert into content_items(id,kind,slug,title,summary,topic,author_user_id,status,catalog_visibility,published_at,published_by) values($1,$2,$3,$4,'Fuente local de la guía autorizada','Abdomen',$5,'published','catalog',$6,$5)",[id,kind,slug,title,actor,clock]);
 await pg.query("insert into learning_resources(id,source_content_id,projection,adapter_key) values($1,$2,'guide','guide-adapter')",[resource,guide]);
 await pg.query('insert into learning_resource_revisions(id,resource_id,revision_number,source_version,adapter_version,schema_version,payload_json,payload_hash) values($1,$2,1,1,1,1,$3,$4)',[revision,resource,JSON.stringify(snapshot),hashLearningSnapshot(snapshot)]);
 const connection={async executeQuery(q:any){const r=await pg.query(q.sql,[...q.parameters]);return{rows:r.rows,numAffectedRows:BigInt(r.affectedRows??0)};},async *streamQuery(){yield{rows:[]};}};
 db=new Kysely({dialect:{createAdapter:()=>new PostgresAdapter(),createIntrospector:(d:any)=>new PostgresIntrospector(d),createQueryCompiler:()=>new PostgresQueryCompiler(),createDriver:()=>({acquireConnection:async()=>connection,beginTransaction:async()=>pg.exec('begin'),commitTransaction:async()=>pg.exec('commit'),rollbackTransaction:async()=>pg.exec('rollback'),destroy:async()=>{},init:async()=>{},releaseConnection:async()=>{}})}});
 await openApp();const root='/v2/editor/learning-paths';
 const bindings={topicContentId:topic,sources:pkg.sources.map(s=>({key:s.key,sourceContentId:guide,resourceRevisionId:revision})),assets:[]};
 const dry=await request('importValidate',`${root}/imports/validate`,{package:pkg,bindings,targetPathId:null,expectedVersion:null});assert(dry.readyToImport);out('approved-import-dry-run.json',dry);
 const imported=await request('importCommit',`${root}/imports/${dry.importId}/commit`,{hash:dry.hash,expectedVersion:null});const pathId=imported.pathId;let editVersion=imported.editVersion;
 const transitions:any[]=[];
 for(const status of ['in_review','approved','published']){
  const receipt=await request('editorTransition',`${root}/${pathId}/transition`,{status,expectedVersion:editVersion,reviewNote:`Aprobación humana del propietario recibida por chat: «revisado y aprobado». Hash ${contentHash}. Operador delegado de test; cuenta local, no identidad de producción.`});
  assert.equal(receipt.route.contentHash,contentHash);assert.equal(receipt.route.status,status);transitions.push(receipt);editVersion=receipt.route.editVersion;
  if(status==='approved'){assert.equal(receipt.route.reviewedContentHash,contentHash);assert.equal(receipt.route.approvedBy,actor);const validated=await request('editorValidate',`${root}/${pathId}/validate`,{expectedVersion:editVersion});assert.equal(validated.ready,true);assert.deepEqual(validated.issues,[]);out('approved-bound-validation.json',validated);}
 }
 const final=transitions.at(-1).route;assert.equal(final.reviewedContentHash,contentHash);assert.equal(final.approvedBy,actor);
 publication={status:'PASS LOCAL',contentHash,pathId,pathVersionId:final.pathVersionId,editVersion,approvedByLocalDelegate:actor,humanReviewer:approval.actor,humanApprovalEvidence:'../../piloto/aprobacion-propietario.json',productionReviewerAccountId:null,bindings,transitions,environment:'Fastify HTTP loopback + PGlite en memoria; datos de test desechados al terminar',productionWritten:false};out('publication-receipt.json',publication);
 const exported=await request('editorExport',`${root}/${pathId}/export`);assert.deepEqual(exported.package,pkg);assert.equal(hashRoutePackage(exported.package),approval.contentHash);out('publicado-test.koraz-route.json',exported.package,pilot);
 const publicPath=await request('publicPath',`/v2/guided-learning/paths/${pkg.route.slug}`,undefined,'beginner');assert.equal(publicPath.path.pathVersionId,final.pathVersionId);assert(!JSON.stringify(publicPath).includes('correctKey'));
 const learnerRoot='/v2/guided-learning';
 async function journey(who:'beginner'|'reinforcement',injectError=false){
  clock=new Date('2026-10-08T23:01:00.000Z');const trace:any[]=[];
  const enrolled=await request('enrollmentCreate',`${learnerRoot}/enrollments`,{pathId},who);const enrollmentId=enrolled.state.enrollmentId;
  const state=async()=>(await request('enrollmentState',`${learnerRoot}/enrollments/${enrollmentId}/state`,undefined,who)).state;
  assert.equal(enrolled.state.pathVersionId,final.pathVersionId);assert(enrolled.state.objectives.every((o:any)=>o.firstMasteredAt===null));
  let mistakeInjected=false,remediationRead=false,verificationCleared=false,reloadVerified=false,replayVerified=false;
  async function attempt(targetKey:string,kind:'activity'|'assessment'|'review'='activity'){
   clock=new Date(clock.getTime()+1000);const before=await state();
   let attempt=(await request('attemptCreate',`${learnerRoot}/attempts`,{clientAttemptId:randomUUID(),enrollmentId,target:{kind,key:targetKey},expectedEnrollmentVersion:before.rowVersion},who)).attempt;
   const attemptId=attempt.attemptId;let guard=0;
   while(attempt.activeActivity){assert(guard++<40);clock=new Date(clock.getTime()+1000);const a=pkg.activities.find(a=>a.key===attempt.activeActivity.key)!;
    for(const hidden of ['correctKey','acceptedAnswers','modelAnswer','distractorFeedback'])assert(!JSON.stringify(attempt.activeActivity).includes(`"${hidden}"`),`Private answer ${a.key}`);
    const selectedMistake=injectError&&!mistakeInjected&&a.key==='territorios-recuperar';
    let answer:any;
    if(a.kind==='study')answer={kind:'study',acknowledged:true};
    else if(a.kind==='single_choice')answer={kind:a.kind,optionKey:selectedMistake?a.misconceptionMappings[0].responseKey:a.payload.correctKey};
    else if(a.kind==='short_answer')answer={kind:a.kind,text:a.payload.acceptedAnswers[0]};
    else if(a.kind==='constructed_response')answer={kind:a.kind,text:a.payload.modelAnswer,selfRating:null};
    else throw new Error(`Unhandled activity ${a.kind}`);
    const body={activityKey:a.key,answer,confidence:null,expectedVersion:attempt.rowVersion};const key=randomUUID();
    let receipt=await request('attemptResponse',`${learnerRoot}/attempts/${attemptId}/responses`,body,who,key);attempt=receipt.attempt;
    if(!replayVerified&&receipt.accepted){const priorCount=(await pg.query<{n:number}>('select count(*)::int n from learning_v2_responses where attempt_id=$1',[attemptId])).rows[0]!.n;const replay=await request('attemptResponse',`${learnerRoot}/attempts/${attemptId}/responses`,body,who,key);assert.deepEqual(replay,receipt);assert.equal((await pg.query<{n:number}>('select count(*)::int n from learning_v2_responses where attempt_id=$1',[attemptId])).rows[0]!.n,priorCount);replayVerified=true;}
    if(a.kind==='constructed_response'){
     assert.equal(receipt.accepted,false);const help=await request('attemptHelp',`${learnerRoot}/attempts/${attemptId}/help`,{activityKey:a.key,kind:'reveal',expectedVersion:attempt.rowVersion},who);attempt=help.attempt;
     receipt=await request('attemptResponse',`${learnerRoot}/attempts/${attemptId}/responses`,{...body,answer:{...answer,selfRating:'good'},expectedVersion:attempt.rowVersion},who);attempt=receipt.attempt;assert(receipt.accepted);
    }
    if(selectedMistake){assert.equal(receipt.feedback.score01,0);assert(receipt.feedback.explanation.length>0);assert(receipt.feedback.sources.some((s:any)=>s.key==='arterias'));assert(receipt.state.objectives.find((o:any)=>o.objectiveKey==='territorios').criticalErrorOpen);mistakeInjected=true;}
    if(a.key==='territorios-remediar'&&injectError){assert(receipt.state.objectives.find((o:any)=>o.objectiveKey==='territorios').criticalErrorOpen);remediationRead=true;}
    if(a.key==='territorios-comprobar'&&remediationRead){assert.equal(receipt.state.objectives.find((o:any)=>o.objectiveKey==='territorios').criticalErrorOpen,false);verificationCleared=true;}
    if(!reloadVerified&&receipt.accepted){
     const expected=structuredClone(attempt);await app.close();await openApp();const reloaded=await request('attemptGet',`${learnerRoot}/attempts/${attemptId}`,undefined,who);assert.deepEqual(reloaded.attempt,expected);assert.equal((await state()).pathVersionId,final.pathVersionId);attempt=reloaded.attempt;reloadVerified=true;
    }
   }
   const completed=await request('attemptComplete',`${learnerRoot}/attempts/${attemptId}/complete`,{expectedVersion:attempt.rowVersion},who);assert.equal(completed.attempt.status,'completed');trace.push({targetKey,kind,attemptId,state:completed.state});return completed.state;
  }
  await attempt('diagnostico','assessment');assert((await state()).objectives.every((o:any)=>o.firstMasteredAt===null));
  const visited=new Set<string>();
  for(let turn=0;turn<100;turn++){
   const current=await state();if(current.masteredAt)break;
   const action=current.nextAction;assert(action.key,`No action at turn ${turn}: ${JSON.stringify(current)}`);
   if(visited.has(action.key)){
    const blocked={status:'FAIL',who,enrollmentId,pathVersionId:final.pathVersionId,contentHash,issue:'COMPLETED_CASE_REOFFERED',repeatedTarget:action.key,currentState:current,mistakeInjected,remediationRead,verificationCleared,applicationRestartAndResume:reloadVerified,responseReplayIdempotent:replayVerified,trace};
    out(`learner-${who}.json`,blocked);console.log(`FAIL ${who}: completed case reoffered; remediation=${verificationCleared}`);return blocked;
   }visited.add(action.key);
   const kind=action.kind==='gate'||action.kind==='retention'?'assessment':action.kind==='review'?'review':'activity';
   await attempt(action.key,kind);
  }
  const immediate=await state();assert(immediate.masteredAt);assert(immediate.objectives.every((o:any)=>o.label==='mastered'));assert.equal(immediate.consolidatedAt,null);assert(immediate.maintenance.gates.every((g:any)=>g.passed));
  clock=new Date('2026-10-16T23:01:00.000Z');await attempt('retention7','assessment');
  clock=new Date('2026-11-08T23:02:00.000Z');await attempt('retention30','assessment');const consolidated=await state();assert(consolidated.consolidatedAt);assert(consolidated.objectives.every((o:any)=>o.firstConsolidatedAt));
  if(injectError){assert(mistakeInjected);assert(remediationRead);assert(verificationCleared);}
  assert(reloadVerified);assert(replayVerified);
  const durable=(await pg.query('select id,enrollment_id,activity_key,score01,assisted from learning_v2_responses where user_id=$1 order by accepted_at,id',[identities.get(who)])).rows;assert(durable.length>35);
  const evidence={status:'PASS LOCAL',scope:'Rutas reales de alumno por HTTP loopback, matrícula/respuestas en PGlite; identidades de prueba, no Better Auth real ni PostgreSQL independiente',who,enrollmentId,pathVersionId:final.pathVersionId,contentHash,immediate,consolidated,mistakeInjected,remediationRead,verificationCleared,applicationRestartAndResume:true,responseReplayIdempotent:true,persistedResponseCount:durable.length,trace,persistedResponses:durable};out(`learner-${who}.json`,evidence);console.log(`PASS LOCAL ${who}: ${durable.length} respuestas persistidas; recarga, gates, final, retención`);return evidence;
 }
 const first=await journey('beginner');const second=await journey('reinforcement',true);
 const reread=await request('editorGet',`${root}/${pathId}`);assert.equal(reread.route.status,'published');assert.equal(reread.route.reviewedContentHash,contentHash);
 const audits=(await pg.query('select action,actor_user_id,target_id,metadata from private.guided_v2_audit where target_id=$1 order by occurred_at',[pathId])).rows;
 out('publication-audit.json',{rows:audits});
 out('published-test-environment.json',{...publication,learnerIds:{beginner,reinforcement},enrollmentIds:{beginner:first.enrollmentId,reinforcement:second.enrollmentId},baseUrlAtEnd:baseUrl,lifetime:'API cerrada y base desechada al finalizar; exportación y evidencia conservadas',sourceSnapshotHash:hashLearningSnapshot(snapshot)});
 assert.equal(first.status,'PASS LOCAL','Beginner journey must finish');assert.equal(second.status,'PASS LOCAL','Reinforcement journey must finish');
 out('publication-check.json',{status:'PASS LOCAL',contentHash,humanApprovalRecorded:true,approvedHashMatches:true,serverValidationPassed:true,publishedInTest:true,exportMatchesApprovedPackage:true,beginnerLearnerJourney:true,reinforcementLearnerJourney:true,responsePersistence:true,applicationRestartAndResume:true,idempotentResponse:true,retention7And30:true,clinicalReviewBy:'Propietario, declaración directa en chat',productionWritten:false,independentPostgresVerified:false,realBetterAuthVerified:false,nextTaskStarted:false});
 out('published-server-transcript.json',transcript);console.log('PASS LOCAL T039: aprobación humana exacta, publicación, exportación y dos recorridos persistidos');
}catch(error){out('publication-check.json',{status:'FAIL',contentHash,error:String(error),stack:(error as Error).stack,publicationCreated:!!publication});out('published-server-transcript.json',transcript);throw error;}
finally{await app?.close();await db?.destroy();await pg.close();}
