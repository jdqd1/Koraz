import { writeFile } from "node:fs/promises";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createImageHarness } from "../../../../../../apps/api/test/helpers/guided-v2-images.js";
import { v2Id } from "../../../../../../apps/api/test/helpers/guided-v2-db.js";
import { prepareGuidedV2AttemptSnapshot, initialGuidedV2AttemptResume } from "../../../../../../apps/api/src/guided-learning/v2/service.js";

let h:Awaited<ReturnType<typeof createImageHarness>>,stop:()=>void;
const attemptId='b2800000-0000-4000-8000-000000000004';
async function seed(kind:string) {
  await h.pg.exec('delete from learning_v2_responses; delete from learning_v2_activity_state; delete from learning_v2_review_state; delete from learning_v2_objective_state; delete from learning_events; delete from learning_mutation_receipts; delete from learning_v2_attempts;');
  const snapshot=prepareGuidedV2AttemptSnapshot(h.definition,v2Id(6),{kind:'activity',key:kind});
  await h.pg.query("insert into learning_v2_attempts(id,user_id,enrollment_id,path_version_id,client_attempt_id,purpose,snapshot_json,resume_json) values($1,$2,$3,$4,$5,'activity',$6,$7)",[attemptId,v2Id(1),v2Id(8),v2Id(6),v2Id(95000),JSON.stringify(snapshot),JSON.stringify(initialGuidedV2AttemptResume())]);
}
beforeAll(async()=>{
  h=await createImageHarness();await seed('hotspot');
  h.app.post('/__test/seed/:kind',async request=>{await seed((request.params as {kind:string}).kind);return {attemptId};});
  h.app.get('/__test/storage',async()=>({responses:(await h.pg.query('select activity_key,modality,assisted,score01 from learning_v2_responses order by accepted_at')).rows,attempt:(await h.pg.query('select row_version,resume_json,status from learning_v2_attempts where id=$1',[attemptId])).rows[0],activityStates:(await h.pg.query('select activity_key,state from learning_v2_activity_state')).rows,objectives:(await h.pg.query('select * from learning_v2_objective_state')).rows,signedCalls:h.signed.length}));
  h.app.post('/__test/stop',async()=>{stop?.();return {stopped:true};});
  await h.app.listen({host:'127.0.0.1',port:41030});
  await writeFile(new URL('http-ready.json',import.meta.url),JSON.stringify({baseUrl:'http://127.0.0.1:41030',attemptId,enrollmentId:v2Id(8),pathVersionId:v2Id(6),identity:'synthetic t030=learner cookie; real Fastify services and isolated PGlite; fake private media signer'},null,2));
},120000);
afterAll(async()=>{
  if(process.env.T030_BROWSER_HOLD==='true') await new Promise<void>(resolve=>{const timer=setTimeout(resolve,1200000);stop=()=>{clearTimeout(timer);resolve();};});
  await h?.close();
},1201000);
it('serves the real typed image endpoint against isolated persistence',async()=>{
  const result=await h.app.inject({url:`/v2/guided-learning/attempts/${attemptId}/image?activityKey=hotspot&expectedVersion=1`,headers:{cookie:'t030=learner'}});
  expect(result.statusCode).toBe(200);expect(result.body).not.toMatch(/polygon|storage_path|PRIVATE/);
});
