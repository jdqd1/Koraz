import Fastify from "fastify";
import { Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler, type CompiledQuery, type DatabaseConnection, type QueryResult } from "kysely";
import { RoutePackageSchema, type IdentityProvider } from "@cediah/contracts";
import type { CediahDatabase } from "../../src/db/database.js";
import { createGuidedV2HttpProvider, registerGuidedV2Routes } from "../../src/guided-learning/v2/routes.js";
import { createPostgresGuidedV2AttemptService } from "../../src/providers/postgres-guided-learning-v2.js";
import { createGuidedV2Database, seedGuidedV2Runtime, v2Id } from "./guided-v2-db.js";

export function imageDefinition() {
  const base = { objectiveKey: "objective-a", relatedObjectiveKeys: [], phase: "apply", required: true, sourceKeys: [], representation: "image", hints: [], use: "learning", prompt: "Señala un punto de la figura sintética", feedback: { explanation: "La zona seleccionada se comprueba en servidor.", commonError: "Revisa la posición en la figura.", sourceKeys: [] }, misconceptionMappings: [], alternativeActivityKey: null };
  const polygon = [{x:.2,y:.2},{x:.8,y:.2},{x:.8,y:.8},{x:.2,y:.8}];
  const image = (key: string, mode = "hotspot") => ({ ...base, key, equivalenceKey: key, kind: "image_target", payload: {assetKey:"figure",mode,targets:[{key:"zone",prompt:"Identifica el punto numerado",polygon,label:"PRIVATE_SPATIAL_SOLUTION"}],labels:mode==='labeling'?[{key:"a",text:"Opción A"},{key:"b",text:"Opción B"}]:[],correctLabelByTarget:mode==='labeling'?{zone:"a"}:{},accessibleAlternativeKey:"alternative",masking:"no_labels"} });
  const activities = [image("hotspot"), image("labeling","labeling"), { ...base, key:"alternative",equivalenceKey:"alternative",kind:"single_choice",representation:"text",required:false,prompt:"Practica la relación en texto",payload:{options:[{key:"yes",text:"Relación A"},{key:"no",text:"Relación B"}],correctKey:"yes",distractorFeedback:{no:"Revisa la relación textual."}} }, { ...base, key:"match",equivalenceKey:"match",kind:"match",representation:"table",prompt:"Relaciona los cuatro elementos sintéticos",payload:{presentation:"comparison_table",prompts:[1,2,3,4].map(n=>({key:`p${n}`,text:`Elemento ${n}`})),choices:[1,2,3,4].map(n=>({key:`c${n}`,text:`Relación ${n}`})),correctByPrompt:{p1:'c1',p2:'c2',p3:'c3',p4:'c4'},allowReuse:true,edges:[]} }];
  return RoutePackageSchema.parse({schemaVersion:"2.0",packageKey:"t030",revision:1,locale:"es",policyVersion:"guided-v2.0",route:{slug:"t030-images",title:"Práctica visual sintética",summary:"Prueba aislada",topicLabel:"Geometría",audience:"Alumno",discipline:"general",coverKey:"heart"},sources:[],assets:[{key:"figure",mediaType:"image",originalFileName:"synthetic.png",sha256:null,alt:"Figura sintética sin etiquetas ni soluciones",caption:"",sourceKeys:[],rightsStatus:"owned",credit:"Fixture de prueba",width:800,height:400}],objectives:[{key:"objective-a",title:"Identificar una posición",unitKey:"unit",verb:"identify",criticality:"core",required:true,prerequisiteKeys:[],sourceKeys:[],comparisonGroup:null,misconceptions:[]}],units:[{key:"unit",title:"Práctica visual",objectiveKeys:["objective-a"],activityKeys:["hotspot","labeling","alternative","match"],support:"full",estimatedMinutes:5}],activities,assessments:[],reviewPlan:{objectiveKeys:[]},editorial:{notes:"Fixture sintético; no acredita revisión editorial.",unresolvedIssues:[]}});
}
export async function createImageHarness() {
  const pg=await createGuidedV2Database();await seedGuidedV2Runtime(pg);
  await pg.query("update content_items set status='published',catalog_visibility='catalog',published_at=now(),published_by=$2 where id=$1",[v2Id(3),v2Id(1)]);
  const definition=imageDefinition();
  await pg.query("update learning_path_versions set definition_v2_json=$1 where id=$2",[JSON.stringify(definition),v2Id(6)]);
  await pg.query("insert into content_assets(id,content_item_id,owner_user_id,kind,storage_bucket,storage_path,original_file_name,mime_type,size_bytes,status,finalized_at) values($1,$2,$3,'image','test-assets','t030/pinned-image','synthetic.png','image/png',100,'ready',now())",[v2Id(10),v2Id(3),v2Id(1)]);
  await pg.query("insert into learning_v2_bindings(path_version_id,local_key,kind,topic_content_id) values($1,'topic','topic',$2)",[v2Id(6),v2Id(3)]);
  await pg.query("insert into learning_v2_bindings(path_version_id,local_key,kind,asset_id,rights_status,rights_credit) values($1,'figure','asset',$2,'owned','Fixture')",[v2Id(6),v2Id(10)]);
  await pg.query("update learning_path_versions set status='published',published_at=now(),published_by=$2 where id=$1",[v2Id(6),v2Id(1)]);
  const connection: DatabaseConnection={async executeQuery<R>(query:CompiledQuery):Promise<QueryResult<R>>{const result=await pg.query<R>(query.sql,[...query.parameters]);return {rows:result.rows,numAffectedRows:BigInt(result.affectedRows??0)};},async *streamQuery<R>():AsyncIterableIterator<QueryResult<R>>{yield {rows:[]};}};
  const database=new Kysely<CediahDatabase>({dialect:{createAdapter:()=>new PostgresAdapter(),createIntrospector:db=>new PostgresIntrospector(db),createQueryCompiler:()=>new PostgresQueryCompiler(),createDriver:()=>({acquireConnection:async()=>connection,beginTransaction:async()=>{await pg.exec('begin');},commitTransaction:async()=>{await pg.exec('commit');},rollbackTransaction:async()=>{await pg.exec('rollback');},destroy:async()=>{},init:async()=>{},releaseConnection:async()=>{}})}});
  const signed: {key:string;expiresInSeconds:number}[]=[];
  const assetStorage={bucket:"test-assets",async createDownloadUrl(input:{key:string;expiresInSeconds:number}){signed.push(input);return `https://t030-media.example.test/figure.png?signature=test-only&n=${signed.length}`;}};
  const service=createPostgresGuidedV2AttemptService(database,{assetStorage});
  const identity={getUser:async(request:{cookie?:string;authorization?:string})=>{const token=request.cookie??request.authorization;return token&&!token.includes("expired")?{id:token.includes("other")?v2Id(2):v2Id(1),email:"t030@example.test",name:"Alumno T030"}:null;}} as unknown as IdentityProvider;
  const app=Fastify();
  const provider=createGuidedV2HttpProvider(database,{assetStorage});
  await registerGuidedV2Routes(app,{flags:{enabled:true,newEnrollments:true},identityProvider:identity,provider});
  app.get('/v1/auth/me',async()=>({features:{guidedLearning:true,guidedLearningMap:false},roles:['student'],user:{id:v2Id(1),email:'t030@example.test',name:'Alumno T030'}}));
  return {pg,database,app,service,provider,definition,signed,async close(){await app.close();await database.destroy();await pg.close();}};
}
