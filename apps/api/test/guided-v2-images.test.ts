import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { V2HttpContracts, V2ImageResourceSchema } from "@cediah/contracts";
import { createImageHarness } from "./helpers/guided-v2-images.js";
import { v2Id } from "./helpers/guided-v2-db.js";

describe("T030 authorized active images and accessible detours",()=>{
  let h:Awaited<ReturnType<typeof createImageHarness>>,serial=93000,clock=new Date();
  beforeAll(async()=>{h=await createImageHarness({now:()=>clock});},120000);
  afterAll(async()=>{await h?.close();});
  beforeEach(async()=>{
    clock=new Date();
    await h.pg.exec("delete from learning_v2_responses; delete from learning_v2_activity_state; delete from learning_v2_review_state; delete from learning_v2_objective_state; delete from learning_events; delete from learning_mutation_receipts; delete from learning_v2_attempts;");
    await h.pg.query("update content_assets set status='ready',finalized_at=now() where id=$1",[v2Id(10)]);
    await h.pg.query("update learning_enrollments set status='active' where id=$1",[v2Id(8)]);h.signed.length=0;
  });
  const post=(path:string,body:unknown,key=v2Id(serial++),actor="learner")=>h.app.inject({method:"POST",url:`/v2/guided-learning/${path}`,payload:JSON.stringify(body),headers:{cookie:`t030=${actor}`,"idempotency-key":key,"content-type":"application/json"}});
  const get=(path:string,actor="learner")=>h.app.inject({url:`/v2/guided-learning/${path}`,headers:{cookie:`t030=${actor}`}});
  async function launch(key="hotspot") {
    const body={clientAttemptId:v2Id(serial++),enrollmentId:v2Id(8),target:{kind:"activity",key},expectedEnrollmentVersion:1};
    const requestKey=v2Id(serial++),response=await post("attempts",body,requestKey);
    expect(response.statusCode).toBe(200);return V2HttpContracts.attemptCreate.response.parse(response.json()).attempt;
  }
  it("projects target identities without geometric solutions or alternative answers",async()=>{
    const attempt=await launch(),serialized=JSON.stringify(attempt);
    expect(serialized).not.toMatch(/polygon|correctLabelByTarget|PRIVATE_SPATIAL_SOLUTION|correctKey/);
    expect(attempt.activeActivity).toMatchObject({kind:"image_target",payload:{targets:[{key:"zone",prompt:h.definition.activities[0]!.prompt,marker:null}],accessibleAlternativeKey:"alternative"}});
    expect(serialized).not.toContain("Relación A");
  });
  it("issues only pinned private media with a short expiry and strict request binding",async()=>{
    const attempt=await launch();
    const response=await get(`attempts/${attempt.attemptId}/image?activityKey=hotspot&expectedVersion=1`);
    expect(response.statusCode).toBe(200);expect(response.headers['cache-control']).toBe('private, no-store');
    const resource=V2ImageResourceSchema.parse(response.json());expect(resource.image.alt).toBe(h.definition.assets[0]!.alt);
    expect(Date.parse(resource.image.expiresAt)-Date.now()).toBeGreaterThan(55000);expect(h.signed).toEqual([{key:'t030/pinned-image',expiresInSeconds:60}]);
    expect(response.body).not.toMatch(/storage_path|storage_bucket|polygon|PRIVATE/);
    expect((await get(`attempts/${attempt.attemptId}/image?activityKey=labeling&expectedVersion=1`)).statusCode).toBe(409);
    expect((await get(`attempts/${attempt.attemptId}/image?activityKey=hotspot&expectedVersion=9`)).statusCode).toBe(409);
    expect((await get(`attempts/${attempt.attemptId}/image?activityKey=hotspot&expectedVersion=1&assetKey=other`)).statusCode).toBe(400);
    expect(h.signed).toHaveLength(1);
  });
  it("denies foreign, expired, revoked and completed media before signing",async()=>{
    const attempt=await launch(),path=`attempts/${attempt.attemptId}/image?activityKey=hotspot&expectedVersion=1`;
    expect((await get(path,'other')).statusCode).toBe(404);expect((await get(path,'expired')).statusCode).toBe(401);
    await h.pg.query("update content_assets set status='pending',finalized_at=null where id=$1",[v2Id(10)]);expect((await get(path)).statusCode).toBe(403);
    await h.pg.query("update content_assets set status='ready',finalized_at=now() where id=$1",[v2Id(10)]);
    const resumed=(await get(`attempts/${attempt.attemptId}`)).json().attempt;
    const answer=await post(`attempts/${attempt.attemptId}/responses`,{activityKey:'hotspot',expectedVersion:resumed.rowVersion,answer:{kind:'image_target',mode:'hotspot',targetKey:'zone',point:{x:.5,y:.5}},confidence:null});expect(answer.statusCode).toBe(200);
    expect((await post(`attempts/${attempt.attemptId}/complete`,{expectedVersion:answer.json().attempt.rowVersion})).statusCode).toBe(200);
    expect((await get(path)).statusCode).toBe(409);expect(h.signed).toHaveLength(0);
  });
  it("persists an idempotent accessible transition, resume, modality and original spatial requirement",async()=>{
    const initial=await launch(),key=v2Id(serial++),body={activityKey:'hotspot',expectedVersion:1};
    expect((await post(`attempts/${initial.attemptId}/alternative`,{...body,alternativeActivityKey:'labeling'})).statusCode).toBe(400);
    expect((await post(`attempts/${initial.attemptId}/alternative`,body,v2Id(serial++),'other')).statusCode).toBe(404);
    const first=await post(`attempts/${initial.attemptId}/alternative`,body,key);expect(first.statusCode).toBe(200);
    expect((await post(`attempts/${initial.attemptId}/alternative`,body,key)).json()).toEqual(first.json());
    const alternative=V2HttpContracts.attemptAlternative.response.parse(first.json()).attempt;
    expect(alternative).toMatchObject({rowVersion:2,accessiblePractice:{sourceActivityKey:'hotspot'},activeActivity:{key:'alternative',representation:'text'}});
    expect((await get(`attempts/${initial.attemptId}`)).json().attempt).toEqual(alternative);
    expect((await get(`attempts/${initial.attemptId}/image?activityKey=hotspot&expectedVersion=2`)).statusCode).toBe(409);
    expect((await post(`attempts/${initial.attemptId}/complete`,{expectedVersion:2})).statusCode).toBe(409);
    const responseKey=v2Id(serial++),responseBody={activityKey:'alternative',expectedVersion:2,answer:{kind:'single_choice',optionKey:'yes'},confidence:null};
    const result=await post(`attempts/${initial.attemptId}/responses`,responseBody,responseKey);expect(result.statusCode).toBe(200);
    expect((await post(`attempts/${initial.attemptId}/responses`,responseBody,responseKey)).json()).toEqual(result.json());
    const receipt=V2HttpContracts.attemptResponse.response.parse(result.json());expect(receipt.attempt).toMatchObject({rowVersion:3,accessiblePractice:null,activeActivity:{key:'hotspot',payload:{accessibleAlternativeKey:null}}});
    expect(receipt.state.masteredAt).toBeNull();expect(receipt.state.completedActivities).toBe(0);
    expect((await h.pg.query('select activity_key,modality,assisted,score01 from learning_v2_responses')).rows).toEqual([{activity_key:'alternative',modality:'text',assisted:true,score01:1}]);
    expect((await h.pg.query('select count(*)::int n from learning_v2_activity_state')).rows).toEqual([{n:0}]);
    expect((await h.pg.query("select count(*)::int n from learning_events where semantic_key like 'v2-alternative:%'")).rows).toEqual([{n:1}]);
    const image=await post(`attempts/${initial.attemptId}/responses`,{activityKey:'hotspot',expectedVersion:3,answer:{kind:'image_target',mode:'hotspot',targetKey:'zone',point:{x:.2,y:.5}},confidence:null});expect(image.statusCode).toBe(200);
    expect(image.json().feedback.score01).toBe(1);
    expect((await post(`attempts/${initial.attemptId}/complete`,{expectedVersion:4})).statusCode).toBe(200);
    expect((await h.pg.query("select modality,assisted from learning_v2_responses where activity_key='hotspot'")).rows).toEqual([{modality:'image',assisted:true}]);
  });
  it("rejects stale transition and alternative after revocation without effects",async()=>{
    const initial=await launch();expect((await post(`attempts/${initial.attemptId}/alternative`,{activityKey:'hotspot',expectedVersion:8})).statusCode).toBe(409);
    await h.pg.query("update learning_enrollments set status='paused' where id=$1",[v2Id(8)]);
    expect((await post(`attempts/${initial.attemptId}/alternative`,{activityKey:'hotspot',expectedVersion:1})).statusCode).toBe(403);
    expect((await h.pg.query("select count(*)::int n from learning_events where semantic_key like 'v2-alternative:%'")).rows).toEqual([{n:0}]);
  });
  it("labels only public markers and grades partial correctness in server",async()=>{
    const created=await h.service.create({userId:v2Id(1),idempotencyKey:v2Id(serial++),clientAttemptId:v2Id(serial++),enrollmentId:v2Id(8),target:{kind:'activity',key:'labeling'},expectedEnrollmentVersion:1});expect(created.status).toBe('success');if(created.status!=='success')return;
    const attempt=created.value;expect(JSON.stringify(attempt)).not.toMatch(/polygon|correctLabelByTarget|PRIVATE/);
    expect(attempt.activeActivity).toMatchObject({payload:{targets:[{key:'zone',marker:{x:.5,y:.5}}]}});
    const response=await post(`attempts/${attempt.attemptId}/responses`,{activityKey:'labeling',expectedVersion:1,answer:{kind:'image_target',mode:'labeling',labelsByTarget:{zone:'b'}},confidence:null});expect(response.statusCode).toBe(200);expect(response.json().feedback.score01).toBe(0);
    expect((await h.pg.query("select modality,assisted from learning_v2_responses where activity_key='labeling'")).rows).toEqual([{modality:'image',assisted:false}]);
  });
  it("allows runtime media reads only through additive column grants",async()=>{
    await h.pg.exec('set role cediah_runtime');
    try {expect((await h.pg.query('select storage_bucket,storage_path,mime_type from content_assets where id=$1',[v2Id(10)])).rows).toHaveLength(1);
      expect((await h.pg.query("select has_column_privilege(current_user,'public.content_assets','storage_path','UPDATE') as allowed")).rows).toEqual([{allowed:false}]);
    } finally {await h.pg.exec('reset role');}
  });
  it("returns persisted partial feedback without replacing the binary score",async()=>{
    const created=await h.service.create({userId:v2Id(1),idempotencyKey:v2Id(serial++),clientAttemptId:v2Id(serial++),enrollmentId:v2Id(8),target:{kind:'activity',key:'match'},expectedEnrollmentVersion:1});
    expect(created.status).toBe('success');if(created.status!=='success')return;
    const attempt=created.value,key=v2Id(serial++),body={activityKey:'match',expectedVersion:1,answer:{kind:'match',pairs:{p1:'c1',p2:'c2',p3:'c3',p4:'c3'}},confidence:null};
    const result=await post(`attempts/${attempt.attemptId}/responses`,body,key);
    expect(result.statusCode).toBe(200);expect(result.json().feedback).toMatchObject({score01:0,partialScore01:.75});
    expect((await post(`attempts/${attempt.attemptId}/responses`,body,key)).json()).toEqual(result.json());
    const resumed=(await get(`attempts/${attempt.attemptId}`)).json().attempt;
    expect(resumed.acceptedResponses[0]).toMatchObject({score01:0,feedback:{partialScore01:.75}});
    expect(result.json().state.masteredAt).toBeNull();
  });
  it("refreshes server-time recommendations on retry while preserving the receipt and one response",async()=>{
    const attempt=await launch('match'),key=v2Id(serial++);
    const body={activityKey:'match',expectedVersion:1,answer:{kind:'match',pairs:{p1:'c1',p2:'c2',p3:'c3',p4:'c3'}},confidence:null};
    const first=await post(`attempts/${attempt.attemptId}/responses`,body,key);
    expect(first.statusCode).toBe(200);
    const accepted=first.json();
    expect(accepted.state.maintenance.generatedAt).toBe(clock.toISOString());
    clock=new Date(clock.getTime()+1000);
    const retry=await post(`attempts/${attempt.attemptId}/responses`,body,key);
    expect(retry.statusCode).toBe(200);
    expect(retry.json()).toEqual({...accepted,state:{...accepted.state,maintenance:{...accepted.state.maintenance,generatedAt:clock.toISOString()}}});
    expect((await h.pg.query('select count(*)::int n from learning_v2_responses where attempt_id=$1',[attempt.attemptId])).rows).toEqual([{n:1}]);
    expect((await h.pg.query("select count(*)::int n from learning_events where semantic_key=$1",[`v2-response:${attempt.attemptId}:match`])).rows).toEqual([{n:1}]);
  });
});
