/** Isolated T035 harness: never imported by the application server. */
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";
import { createServer } from "node:https";
import { createGuidedV2Postgres } from "./guided-v2-postgres.js";
import { guidedV2Fixture, guidedV2FixtureId as id, guidedV2FixtureBindings, guidedV2GuidePayload, guidedV2GuideHash, guidedV2Image, guidedV2ImageHash } from "./guided-v2-fixtures.js";
import { createPostgresGuidedLearningV2Provider } from "../../src/providers/postgres-guided-learning-v2.js";
import { createGuidedV2HttpProvider } from "../../src/guided-learning/v2/routes.js";
import { createPostgresLearningMapProvider } from "../../src/providers/postgres-learning-map.js";
import { buildApp } from "../../src/app.js";
import { readEnvironment } from "../../src/config.js";

export async function createGuidedV2Server() {
  if(process.env.NODE_ENV!=="test" || process.env.KORAZ_GUIDED_V2_TEST_SERVER!=="true") throw new Error("Explicit T035 test server required");
  const db=await createGuidedV2Postgres();
  let application:Awaited<ReturnType<typeof buildApp>>|undefined;
  try {
  let clock=new Date("2026-10-04T12:00:00Z");
  const now=()=>clock;
  const assetStorage={bucket:"test-assets",createDownloadUrl:async()=>"https://127.0.0.1:41036/fixture.png"};
  const actors=new Map<string,{id:string;name:string;email:string}>();
  for(let n=1;n<=40;n++){
    const token=n===1?"editor":`student-${n}`;
    const actor={id:id(n),name:n===1?"Editor T035":`Alumno T035 ${n}`,email:`t035-${n}@example.test`};
    actors.set(token,actor);
    await db.pool.query("insert into auth_users(id,name,email) values($1,$2,$3)",[actor.id,actor.name,actor.email]);
  }
  // Catalog identifiers deliberately stay outside the actor range.
  const bindings=structuredClone(guidedV2FixtureBindings);
  bindings.topicContentId=id(120);bindings.sources[0]!.sourceContentId=id(121);bindings.sources[0]!.resourceRevisionId=id(123);bindings.assets[0]!.assetId=id(124);
  await db.pool.query("insert into user_roles(user_id,role,assigned_by) values($1,'administrator',$1)",[id(1)]);
  await db.pool.query("insert into content_items(id,kind,slug,title,summary,topic,author_user_id,status,catalog_visibility,published_at,published_by) values($1,'topic','t035-topic','Tema T035','Fixture','Tema T035',$3,'published','catalog',now(),$3),($2,'guide','t035-guide','Guía T035','Fixture','Tema T035',$3,'published','catalog',now(),$3)",[id(120),id(121),id(1)]);
  await db.pool.query("update content_items set content=$2 where id=$1",[id(120),{introduction:"Contenido sintético para comprobar el software.",objectives:["Aplicar una relación sintética"],regions:["Tema T035"]}]);
  await db.pool.query("update content_items set content=$2 where id=$1",[id(121),{document:null,sections:guidedV2GuidePayload.content.sections,keyPoints:[],linkedVideoId:null,quiz:{questions:[]},regions:["Tema T035"]}]);
  await db.pool.query("insert into learning_resources(id,source_content_id,projection,adapter_key) values($1,$2,'guide','guide-adapter')",[id(122),id(121)]);
  await db.pool.query("insert into learning_resource_revisions(id,resource_id,revision_number,source_version,adapter_version,schema_version,payload_json,payload_hash) values($1,$2,1,1,1,1,$3,$4)",[id(123),id(122),guidedV2GuidePayload,guidedV2GuideHash]);
  await db.pool.query("insert into content_assets(id,content_item_id,owner_user_id,kind,storage_bucket,storage_path,original_file_name,mime_type,size_bytes,status,finalized_at) values($1,$2,$3,'image','test-assets','fixture.png','fixture.png','image/png',$4,'ready',now())",[id(124),id(120),id(1),guidedV2Image.length]);
  const editor=createPostgresGuidedLearningV2Provider(db.database,{now,assetStorage});
  const fixtures:Record<string,{pathId:string;slug:string;versionId:string;objectives:number;activities:number}>={};
  for(const [key,count,publish] of [["small",1,true],["large",200,true],["editorial",1,false],["editorial-mobile",1,false]] as const){
    const pkg=guidedV2Fixture(count); if(key.startsWith("editorial")){pkg.packageKey=`t035-${key}`;pkg.route.slug=`t035-${key}`;pkg.route.title="Ruta editorial T035";}
    const created=await editor.createDraft({actorUserId:id(1),canCreate:true,canEditAll:true,enforceAccess:true,package:pkg,bindings});
    if(created.status!=="success") throw new Error(JSON.stringify(created));
    let route=created.value;
    if(publish) for(const status of ["in_review","approved","published"] as const){
      const result=await editor.transitionPath({actorUserId:id(1),canEdit:true,canEditAll:true,canReview:true,canPublish:true,pathId:route.pathId,expectedVersion:route.editVersion,status,reviewNote:"Revisión sintética para comprobar el software"});
      if(result.status!=="success") throw new Error(JSON.stringify(result)); route=result.value;
    }
    fixtures[key]={pathId:route.pathId,slug:pkg.route.slug,versionId:route.pathVersionId,objectives:pkg.objectives.length,activities:pkg.activities.length};
  }
  const map=createPostgresLearningMapProvider(db.database,{clock:now});
  const app=await buildApp(readEnvironment({NODE_ENV:"test",HOST:"127.0.0.1",PORT:"41035",DATABASE_URL:db.url,DATABASE_MIGRATIONS_ENABLED:"false",GUIDED_LEARNING_ENABLED:"true",GUIDED_LEARNING_MAP_ENABLED:"true",GUIDED_LEARNING_V2_ENABLED:"true",GUIDED_LEARNING_V2_NEW_ENROLLMENTS:"true",WEB_ORIGINS:"http://127.0.0.1:31035"}),{
    identityProvider:{getUser:async r=>actors.get(/(?:^|;\s*)t035=([^;]+)/.exec(r.cookie??"")?.[1]??"")??null,revokeSessions:async()=>{}},
    guidedLearningV2Provider:createGuidedV2HttpProvider(db.database,{now,assetStorage}),guidedLearningV2EditorProvider:editor,learningMapProvider:map,
  });
  application=app;
  const tables=(await db.pool.query<{tablename:string}>("select tablename from pg_tables where schemaname='public' and (tablename like 'learning_%' or tablename like '%reward%') and tablename <> 'learning_mutation_receipts' order by tablename")).rows.map(r=>r.tablename);
  const counts=async()=>Object.fromEntries(await Promise.all(tables.map(async t=>[t,(await db.pool.query(`select count(*)::int n from public.${t}`)).rows[0].n])));
  app.get("/__test/ready",async()=>({testOnly:true,database:db.name,fixtures,imageSha256:guidedV2ImageHash,now:clock.toISOString()}));
  app.get("/__test/counts",counts);
  app.get("/__test/responses/:id",async request=>({rows:(await db.pool.query("select activity_key,assisted from learning_v2_responses where attempt_id=$1",[(request.params as {id:string}).id])).rows}));
  app.get("/__test/fixture.png",async(_request,reply)=>reply.type("image/png").send(guidedV2Image));
  app.post("/__test/clock",async request=>{
    const days=(request.body as {days?:number}).days;
    if(!Number.isInteger(days) || !days || days<1 || days>40) throw new Error("Test clock requires 1..40 days");
    clock=new Date(clock.getTime()+days*86400000);return {now:clock.toISOString()};
  });
  app.post("/__test/map/:actor",async request=>{
    const actor=actors.get((request.params as {actor:string}).actor);if(!actor) throw new Error("Unknown synthetic actor");
    const result=await map.mutate({operation:"ensure",request:{},userId:actor.id,idempotencyKey:randomUUID()});return result;
  });
  let closed=false;
  const close=async()=>{if(closed)return;closed=true;await app.close();await db.close();};
  return {app,db,fixtures,bindings,counts,close};
  } catch(error){await application?.close();await db.close();throw error;}
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const harness=await createGuidedV2Server();
  // Public synthetic key/certificate are fixture data, never deployment credentials.
  const media=createServer({key:await readFile(new URL("guided-v2-tls-key.pem",import.meta.url)),cert:await readFile(new URL("guided-v2-tls-cert.pem",import.meta.url))},(request,response)=>{
    if(request.url!=="/fixture.png"){response.writeHead(404);response.end();return;}
    response.writeHead(200,{"Content-Type":"image/png","Cache-Control":"no-store"});response.end(guidedV2Image);
  });
  await new Promise<void>((resolve,reject)=>{media.once("error",reject);media.listen(41036,"127.0.0.1",resolve);});
  const stop=async()=>{await new Promise<void>(resolve=>media.close(()=>resolve()));await harness.close();};
  harness.app.post("/__test/stop",async()=>{setTimeout(()=>void stop().then(()=>process.exit(0)),100);return {stopped:true};});
  await harness.app.listen({host:"127.0.0.1",port:41035});
  console.log("T035 disposable PostgreSQL API ready on 127.0.0.1:41035");
  for(const signal of ["SIGINT","SIGTERM"] as const) process.once(signal,()=>{void stop().then(()=>process.exit(0));});
}
