import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createGuidedV2Database } from '../../../../../apps/api/test/helpers/guided-v2-db.js';
import { createPostgresGuidedLearningV2Provider } from '../../../../../apps/api/src/providers/postgres-guided-learning-v2.js';
import { createEditorPreviewSimulator, registerGuidedV2EditorImportRoutes } from '../../../../../apps/api/src/guided-learning/v2/editor-routes.js';
import { hashLearningSnapshot } from '../../../../../apps/api/src/guided-learning/snapshot-hash.js';
import { hashRoutePackage } from '../../../../../apps/api/src/guided-learning/v2/validation.js';
import { RoutePackageSchema, V2HttpContracts } from '../../../../../packages/contracts/src/index.js';

const requireApi = createRequire(new URL('../../../../../apps/api/package.json',import.meta.url));
const Fastify=requireApi('fastify');
const {Kysely,PostgresAdapter,PostgresIntrospector,PostgresQueryCompiler}=requireApi('kysely');
const out=(name:string,value:unknown)=>writeFileSync(new URL(name,import.meta.url),JSON.stringify(value,null,2)+'\n');
const pkg=RoutePackageSchema.parse(JSON.parse(readFileSync(new URL('../../piloto/vascularizacion-abdomen.koraz-route.json',import.meta.url),'utf8')));
const snapshot=JSON.parse(readFileSync(new URL('../../piloto/fuente-seleccionada.json',import.meta.url),'utf8'));
const digest=hashLearningSnapshot(snapshot), contentHash=hashRoutePackage(pkg);
const transcript:unknown[]=[];
const pg=await createGuidedV2Database(); let db:any, app:any;
try {
 const actor=randomUUID(),topic=randomUUID(),guide=randomUUID(),resource=randomUUID(),revision=randomUUID();
 assert(pkg.sources.every(s=>s.documentSha256===digest));
 await pg.query("insert into auth_users(id,name,email) values($1,'Operador técnico aislado T039','t039@example.test')",[actor]);
 for(const [id,kind,slug,title] of [[topic,'topic','t039-abdomen','Abdomen'],[guide,'guide','t039-guia-snapshot',snapshot.title]]) await pg.query("insert into content_items(id,kind,slug,title,summary,topic,author_user_id) values($1,$2,$3,$4,'Snapshot local de fragmentos de guía publicada','Abdomen',$5)",[id,kind,slug,title,actor]);
 await pg.query("insert into learning_resources(id,source_content_id,projection,adapter_key) values($1,$2,'guide','guide-adapter')",[resource,guide]);
 await pg.query("insert into learning_resource_revisions(id,resource_id,revision_number,source_version,adapter_version,schema_version,payload_json,payload_hash) values($1,$2,1,1,1,1,$3,$4)",[revision,resource,JSON.stringify(snapshot),digest]);
 const connection={async executeQuery(query:any){const r=await pg.query(query.sql,[...query.parameters]);return {rows:r.rows,numAffectedRows:BigInt(r.affectedRows??0)};},async *streamQuery(){yield {rows:[]};}};
 db=new Kysely({dialect:{createAdapter:()=>new PostgresAdapter(),createIntrospector:(d:any)=>new PostgresIntrospector(d),createQueryCompiler:()=>new PostgresQueryCompiler(),createDriver:()=>({acquireConnection:async()=>connection,beginTransaction:async()=>pg.exec('begin'),commitTransaction:async()=>pg.exec('commit'),rollbackTransaction:async()=>pg.exec('rollback'),destroy:async()=>{},init:async()=>{},releaseConnection:async()=>{}})}});
 app=Fastify(); const provider=createPostgresGuidedLearningV2Provider(db);
 await registerGuidedV2EditorImportRoutes(app,{identityProvider:{getUser:async(r:any)=>r.cookie==='t039=isolated-operator'?{id:actor}:null} as any,contentProvider:{getRoles:async()=>['administrator']} as any,provider});
 const request=async(contract: keyof typeof V2HttpContracts,url:string,body?:unknown,key?:string)=>{const c=V2HttpContracts[contract];const r=await app.inject({method:c.method,url,headers:{cookie:'t039=isolated-operator',...(body?{'content-type':'application/json','idempotency-key':key}:{})},...(body?{payload:JSON.stringify(body)}:{})});const value=r.json();transcript.push({url,method:c.method,status:r.statusCode,body:value});return r.statusCode<300?{ok:true,value:c.response.parse(value)}:{ok:false,status:r.statusCode,value};};
 const root='/v2/editor/learning-paths';
 const api={validateImport:(body:any,key:string)=>request('importValidate',`${root}/imports/validate`,body,key),commitImport:(id:string,body:any,key:string)=>request('importCommit',`${root}/imports/${id}/commit`,body,key),export:(id:string)=>request('editorExport',`${root}/${id}/export`),validate:(id:string,expectedVersion:number,key:string)=>request('editorValidate',`${root}/${id}/validate`,{expectedVersion},key),transition:(id:string,body:any,key:string)=>request('editorTransition',`${root}/${id}/transition`,body,key),get:(id:string)=>request('editorGet',`${root}/${id}`)};
 const bindings={topicContentId:topic,sources:pkg.sources.map(s=>({key:s.key,sourceContentId:guide,resourceRevisionId:revision})),assets:[]};
 const checked=await api.validateImport({package:pkg,bindings,targetPathId:null,expectedVersion:null},randomUUID());
 out('import-dry-run.json',checked);assert(checked.ok,JSON.stringify(checked));assert(checked.value.readyToImport,JSON.stringify(checked));
 const key=randomUUID();const imported=await api.commitImport(checked.value.importId,{hash:checked.value.hash,expectedVersion:null},key);
 out('import-receipt.json',imported);assert(imported.ok,JSON.stringify(imported));assert.equal(imported.value.status,'draft');
 const replay=await api.commitImport(checked.value.importId,{hash:checked.value.hash,expectedVersion:null},key);assert.deepEqual(replay,imported);
 const pathId=imported.value.pathId;const exported=await api.export(pathId);assert(exported.ok,JSON.stringify(exported));assert.deepEqual(exported.value.package,pkg);assert.equal(hashRoutePackage(exported.value.package),contentHash);
 writeFileSync(new URL('../../piloto/exportado-test.koraz-route.json',import.meta.url),JSON.stringify(exported.value.package,null,2)+'\n');
 out('export-check.json',{status:'PASS LOCAL',contentHash,semanticEquality:true,reviewApprovalsIncluded:false});
 const validation=await api.validate(pathId,imported.value.editVersion,randomUUID());out('bound-validation.json',validation);
 assert(validation.ok,JSON.stringify(validation));assert(JSON.stringify(validation).includes('REVIEW_STALE'),'Missing editorial review must remain visible');
 const blocked=await api.transition(pathId,{expectedVersion:imported.value.editVersion,status:'published',reviewNote:''},randomUUID());assert.equal(blocked.ok,false);out('publication-blocked.json',{expected:true,result:blocked,humanApprovalAttempted:false});
 const pendingReview=await api.transition(pathId,{expectedVersion:imported.value.editVersion,status:'in_review',reviewNote:`Contenido nuevo pendiente de revisión del propietario. Hash ${contentHash}. No es aprobación clínica.`},randomUUID());assert(pendingReview.ok,JSON.stringify(pendingReview));
 const reread=await api.get(pathId);assert(reread.ok,JSON.stringify(reread));assert.equal(reread.value.route.status,'in_review');assert.equal(reread.value.route.approvedBy,null);assert.equal(reread.value.route.reviewedContentHash,null);
 const tableNames=(await pg.query<{tablename:string}>("select tablename from pg_tables where schemaname='public' and (tablename like 'learning_%' or tablename like '%reward%') and tablename <> 'learning_mutation_receipts' order by tablename")).rows.map(r=>r.tablename);
 const counts=async()=>Object.fromEntries(await Promise.all(tableNames.map(async t=>[t,(await pg.query<{n:number}>(`select count(*)::int n from public.${t}`)).rows[0]!.n])));
 const before=await counts();
 const now='2026-10-08T23:00:00.000Z';
 function runner(profile:'beginner'|'diagnostic_correct'|'core_error') {
  const sim=createEditorPreviewSimulator(pkg,profile,now); const trace:unknown[]=[];
  const run=(operation:string,body:any={})=>{const result:any=sim.execute({operation,body:{expectedVersion:sim.read().state.rowVersion,...body}},randomUUID());trace.push({operation,target:body.target??body.activityKey??null,accepted:result.accepted??null,state:sim.read().state});return result;};
  function attempt(key:string,kind:'activity'|'assessment'='activity'){
   // Simulate chronological sessions; a single frozen timestamp cannot prove
   // that remediation occurred before its verification.
   run('clock',{now:new Date(Date.parse(sim.read().now)+1000).toISOString()});
   run('start',{target:{kind,key}});let n=0;
   while(sim.read().attempt?.activeActivity){assert(n++<30,'Attempt bounded');const active=sim.read().attempt!.activeActivity!;const a=pkg.activities.find(a=>a.key===active.key)!;const projected=JSON.stringify(active);for(const secret of ['correctKey','acceptedAnswers','distractorFeedback','modelAnswer'])assert(!projected.includes(`"${secret}"`),`Secret in attempt ${a.key}`);
    const body={activityKey:a.key,confidence:null};
    if(a.kind==='study')run('response',{...body,answer:{kind:'study',acknowledged:true}});
    else if(a.kind==='single_choice')run('response',{...body,answer:{kind:'single_choice',optionKey:a.payload.correctKey}});
    else if(a.kind==='short_answer')run('response',{...body,answer:{kind:'short_answer',text:a.payload.acceptedAnswers[0]}});
    else if(a.kind==='constructed_response') {const answer={kind:'constructed_response',text:a.payload.modelAnswer,selfRating:null};const r=run('response',{...body,answer});assert.equal(r.accepted,false);run('help',{activityKey:a.key,kind:'reveal'});run('response',{...body,answer:{...answer,selfRating:'good'}});}
    else throw new Error(`Unhandled ${a.kind}`);
   }run('complete');
  }
  return {sim,run,attempt,trace};
 }
 const beginner=runner('beginner');assert(beginner.sim.read().state.objectives.every(o=>o.firstMasteredAt===null));
 const diagnosed=runner('diagnostic_correct');assert(diagnosed.sim.read().state.objectives.every(o=>o.firstMasteredAt===null));
 beginner.attempt('diagnostico','assessment');assert(beginner.sim.read().state.objectives.every(o=>o.firstMasteredAt===null));
 const children=new Set(pkg.activities.flatMap(a=>a.kind==='case'?a.payload.stages.map(s=>s.childActivityKey):[]));
 for(const unit of pkg.units){
  for(const key of unit.activityKeys){const a=pkg.activities.find(a=>a.key===key)!;if(a.use!=='learning'||a.phase==='remediate'||children.has(key))continue;assert(!beginner.sim.read().state.maintenance?.blockers.some(b=>b.objectiveKey===a.objectiveKey),`Unavailable objective ${a.objectiveKey}`);beginner.attempt(key);}
  beginner.attempt(`${unit.key}-gate`,'assessment');
 }
 beginner.attempt('checkpoint','assessment');
 beginner.attempt('final','assessment');
 const afterFinal=beginner.sim.read().state;assert(afterFinal.objectives.every(o=>o.firstMasteredAt!==null&&o.label==='mastered'));assert(afterFinal.objectives.every(o=>o.firstConsolidatedAt===null));assert(afterFinal.maintenance?.gates.every(g=>g.passed));
 beginner.run('clock',{now:'2026-10-16T23:01:00.000Z'});beginner.attempt('retention7','assessment');
 beginner.run('clock',{now:'2026-11-08T23:02:00.000Z'});beginner.attempt('retention30','assessment');assert(beginner.sim.read().state.objectives.every(o=>o.firstConsolidatedAt!==null&&o.label==='mastered'));
 const critical=runner('core_error');const first=pkg.objectives[0];assert(critical.sim.read().state.objectives.find(o=>o.objectiveKey===first.key)?.criticalErrorOpen);assert(critical.sim.read().state.maintenance?.remediation.some(r=>r.activityKey===`${first.key}-remediar`));
 critical.attempt(`${first.key}-remediar`);assert(critical.sim.read().state.objectives.find(o=>o.objectiveKey===first.key)?.criticalErrorOpen);critical.attempt(`${first.key}-comprobar`);assert.equal(critical.sim.read().state.objectives.find(o=>o.objectiveKey===first.key)?.criticalErrorOpen,false);
 // A fresh simulator must not inherit the first simulator's progress.
 assert(createEditorPreviewSimulator(pkg,'beginner',now).read().state.objectives.every(o=>o.firstMasteredAt===null));
 const after=await counts();assert.deepEqual(after,before);
 out('preview-beginner.json',{status:'PASS LOCAL',scope:'Motor compartido, simulador editorial; respuestas correctas programadas, no validación humana ni matrícula real',afterFinal,finalState:beginner.sim.read().state,trace:beginner.trace});
 out('preview-core-error.json',{status:'PASS LOCAL',scope:'Error CORE simulado, remediación y verificación distinta',finalState:critical.sim.read().state,trace:critical.trace});
 out('preview-isolation.json',{status:'PASS LOCAL',tableCount:tableNames.length,before,after,unchanged:true,newSessionEmpty:true});
 out('test-environment.json',{kind:'PGlite en memoria con migraciones reales; cierre y eliminación al finalizar',productionAccess:false,syntheticTechnicalOperatorId:actor,humanReviewerActorId:null,topicContentId:topic,sourceContentId:guide,resourceRevisionId:revision,pathId,editVersion:reread.value.route.editVersion,pathVersionId:reread.value.route.pathVersionId,contentHash,bindings,status:'in_review',approvedBy:null,reviewedContentHash:null,exportSurvivesDatabaseDisposal:true});
 out('server-transcript.json',transcript);
 out('pilot-check.json',{status:'PASS LOCAL',contentHash,importCommit:true,idempotentReplay:true,exportEquality:true,boundValidation:'REVIEW_STALE only; editorial review pending',unreviewedPublicationBlocked:true,inReview:true,beginnerPreview:true,coreErrorPreview:true,noLearnerEffects:true,realLearnerJourney:false,publishedInTest:false,humanApproved:false});
 console.log('PASS LOCAL: import, replay, export, review guard, beginner/core_error previews and isolation');
} catch(error){out('pilot-check.json',{status:'FAIL',error:String(error),stack:(error as Error).stack});out('server-transcript.json',transcript);throw error;}
finally {await app?.close();await db?.destroy();await pg.close();}
