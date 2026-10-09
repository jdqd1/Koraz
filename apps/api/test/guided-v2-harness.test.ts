import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { guidedV2Fixture } from "./helpers/guided-v2-fixtures.js";
import { createGuidedV2Server } from "./helpers/guided-v2-server.js";
import { assertGuidedV2TestControlUrl } from "./helpers/guided-v2-postgres.js";

describe("T035 disposable database boundary", () => {
  const target = "postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test";
  it("accepts only the explicit local control database and marker", () => {
    expect(assertGuidedV2TestControlUrl(target, "true").href).toBe(target);
    for (const marker of ["", "false", "TRUE"]) {
      expect(() => assertGuidedV2TestControlUrl(target, marker)).toThrow();
    }
    for (const forbidden of [
      target.replace("127.0.0.1", "production.example.com"),
      target.replace("55435", "5432"),
      target.replace("koraz_test@", "administrator@"),
      target.replace("control_test", "production"),
      target.replace("koraz_test@", "koraz_test:secret@"),
      target + "?sslmode=require",
    ]) expect(() => assertGuidedV2TestControlUrl(forbidden, "true")).toThrow();
  });
});

describe("T035 deterministic fixtures", () => {
  it("includes all eight kinds in a publishable small route", () => {
    const fixture = guidedV2Fixture();
    expect(new Set(fixture.activities.map(a => a.kind)).size).toBe(8);
    expect(fixture.objectives).toHaveLength(1);
  });
  it("builds the publishable 200-objective route deterministically", () => {
    const fixture = guidedV2Fixture(200);
    expect(fixture.objectives).toHaveLength(200);
    expect(guidedV2Fixture(200)).toEqual(fixture);
  });
});

describe.skipIf(process.env.KORAZ_GUIDED_V2_TEST_SERVER !== "true")("I04 independent PostgreSQL HTTP transactions", () => {
  let h: Awaited<ReturnType<typeof createGuidedV2Server>>;
  beforeAll(async()=>{h=await createGuidedV2Server();},120000);
  afterAll(async()=>{await h?.close();});
  let actor="student-35";
  const post=(path:string,payload:unknown,key=randomUUID())=>h.app.inject({method:"POST",url:`/v2/guided-learning/${path}`,payload:payload as Record<string,unknown>,headers:{cookie:`t035=${actor}`,"idempotency-key":key}});
  async function start(){
    const enrollment=await post("enrollments",{pathId:h.fixtures.small!.pathId});expect(enrollment.statusCode,enrollment.body).toBe(200);
    const state=enrollment.json().state;
    const attempt=await post("attempts",{clientAttemptId:randomUUID(),enrollmentId:state.enrollmentId,target:{kind:"activity",key:"study-1"},expectedEnrollmentVersion:state.rowVersion});expect(attempt.statusCode,attempt.body).toBe(200);
    return attempt.json().attempt;
  }
  it("same request concurrently persists one answer and returns the same receipt",async()=>{
    const a=await start(),key=randomUUID();
    const body={activityKey:"study-1",answer:{kind:"study",acknowledged:true},confidence:null,expectedVersion:a.rowVersion};
    const replies=await Promise.all([post(`attempts/${a.attemptId}/responses`,body,key),post(`attempts/${a.attemptId}/responses`,body,key)]);
    expect(replies.map(r=>r.statusCode)).toEqual([200,200]);expect(replies[0]!.json()).toEqual(replies[1]!.json());
    expect((await h.db.pool.query("select count(*)::int n from learning_v2_responses where attempt_id=$1",[a.attemptId])).rows).toEqual([{n:1}]);
    await post(`attempts/${a.attemptId}/complete`,{expectedVersion:replies[0]!.json().attempt.rowVersion});
  });
  it("different concurrent requests at the same version accept once and return 409 once",async()=>{
    actor="student-36";
    const a=await start();
    const response=await post(`attempts/${a.attemptId}/responses`,{activityKey:"study-1",answer:{kind:"study",acknowledged:true},confidence:null,expectedVersion:1});
    expect(response.statusCode,response.body).toBe(200);
    const closed=await post(`attempts/${a.attemptId}/complete`,{expectedVersion:response.json().attempt.rowVersion});expect(closed.statusCode,closed.body).toBe(200);
    const enrollmentId=a.enrollmentId;
    async function launch(key:string){
      const state=(await h.app.inject({url:`/v2/guided-learning/enrollments/${enrollmentId}/state`,headers:{cookie:`t035=${actor}`}})).json().state;
      const result=await post("attempts",{clientAttemptId:randomUUID(),enrollmentId,target:{kind:"activity",key},expectedEnrollmentVersion:state.rowVersion});expect(result.statusCode,result.body).toBe(200);return result.json().attempt;
    }
    const constructed=await launch("constructed-1");
    const submitted=await post(`attempts/${constructed.attemptId}/responses`,{activityKey:"constructed-1",answer:{kind:"constructed_response",text:"Una relación sintética.",selfRating:null},confidence:null,expectedVersion:1});expect(submitted.statusCode,submitted.body).toBe(200);
    const revealed=await post(`attempts/${constructed.attemptId}/help`,{activityKey:"constructed-1",kind:"reveal",expectedVersion:submitted.json().attempt.rowVersion});expect(revealed.statusCode,revealed.body).toBe(200);
    const rated=await post(`attempts/${constructed.attemptId}/responses`,{activityKey:"constructed-1",answer:{kind:"constructed_response",text:"Una relación sintética.",selfRating:"good"},confidence:null,expectedVersion:revealed.json().attempt.rowVersion});expect(rated.statusCode,rated.body).toBe(200);
    expect((await post(`attempts/${constructed.attemptId}/complete`,{expectedVersion:rated.json().attempt.rowVersion})).statusCode).toBe(200);
    const choice=await launch("choice-1");
    const replies=await Promise.all(["yes","no"].map(optionKey=>post(`attempts/${choice.attemptId}/responses`,{activityKey:"choice-1",answer:{kind:"single_choice",optionKey},confidence:null,expectedVersion:choice.rowVersion})));
    expect(replies.map(r=>r.statusCode).sort()).toEqual([200,409]);
    expect((await h.db.pool.query("select count(*)::int n from learning_v2_responses where attempt_id=$1",[choice.attemptId])).rows).toEqual([{n:1}]);
  });
});
