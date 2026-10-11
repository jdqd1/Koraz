import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {hashLearningSnapshot} from '../dist/guided-learning/snapshot-hash.js';
const {Pool}=createRequire(new URL('../package.json',import.meta.url))('pg');
export async function seed(target){
 const actor=process.env.RC01_EDITOR_USER_ID;assert.match(actor??'',/^[a-f0-9-]{36}$/);
 const pool=new Pool({connectionString:target.href,max:1});
 const result={editorUserId:actor,bindings:{}};
 try{
  await pool.query('begin');
  const user=(await pool.query('select email from auth_users where id=$1',[actor])).rows[0];
  assert.match(user?.email??'',/^rc01-editor-[a-f0-9]+@example\.test$/);
  await pool.query("insert into user_roles(user_id,role,assigned_by) values($1,'administrator',$1) on conflict do nothing",[actor]);
  for(const name of ['synthetic','pilot']){
   const text=await readFile(new URL(`./inputs/${name}-guide.md`,import.meta.url),'utf8');
   const title=name==='pilot'?'Vascularización del abdomen':'Circuito de señales Neral';
   const documentSha=createHash('sha256').update(text).digest('hex');
   const snapshot={title,originalDocumentSha256:documentSha,text};
   const digest=hashLearningSnapshot(snapshot);
   const ids={};
   for(const kind of ['topic','guide']){
    const slug=`rc01-${name}-${kind}`;
    const previous=(await pool.query('select id from content_items where slug=$1',[slug])).rows[0];
    ids[kind]=previous?.id??randomUUID();
    if(!previous)await pool.query(`insert into content_items(id,kind,slug,title,summary,topic,author_user_id,status,catalog_visibility,published_at,published_by)
      values($1,$2,$3,$4,'Contenido de prueba RC01, sin aprobación de producción',$4,$5,'published','catalog',now(),$5)`,[ids[kind],kind,slug,title,actor]);
   }
   let resource=(await pool.query('select id from learning_resources where source_content_id=$1 and projection=$2',[ids.guide,'guide'])).rows[0]?.id;
   if(!resource){resource=randomUUID();await pool.query("insert into learning_resources(id,source_content_id,projection,adapter_key) values($1,$2,'guide','guide-adapter')",[resource,ids.guide]);}
   let revision=(await pool.query('select id,payload_hash from learning_resource_revisions where resource_id=$1 order by revision_number desc limit 1',[resource])).rows[0];
   if(!revision){revision={id:randomUUID(),payload_hash:digest};await pool.query('insert into learning_resource_revisions(id,resource_id,revision_number,source_version,adapter_version,schema_version,payload_json,payload_hash) values($1,$2,1,1,1,1,$3,$4)',[revision.id,resource,snapshot,digest]);}
   assert.equal(revision.payload_hash,digest);
   result.bindings[name]={topicContentId:ids.topic,guideContentId:ids.guide,resourceRevisionId:revision.id,sourceHash:digest};
  }
  await pool.query('commit');
  console.log('RC01_SEED '+JSON.stringify({status:'PASS',...result}));
 }catch(error){await pool.query('rollback');throw error;}finally{await pool.end();}
}
