import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LearningPathCreateRequestSchema, type LearningAttemptMutationResponse, type V2AttemptManifest, type V2RouteState } from "@cediah/contracts";
import { createGuidedV2Server } from "./helpers/guided-v2-server.js";
import { guidedV2FixtureId as id } from "./helpers/guided-v2-fixtures.js";
import { createPostgresGuidedLearningProvider } from "../src/providers/postgres-guided-learning.js";
import { createPostgresGuidedV2AttemptService } from "../src/providers/postgres-guided-learning-v2.js";

/** Exercises both complete HTTP response paths, not just the reward helpers. */
describe.skipIf(process.env.KORAZ_TEST_DATABASE !== "true")("F04 response accounting in PostgreSQL", () => {
  let server: Awaited<ReturnType<typeof createGuidedV2Server>>;
  let serial = 2;
  beforeAll(async () => {
    process.env.KORAZ_GUIDED_V2_TEST_SERVER = "true";
    server = await createGuidedV2Server();
  }, 120_000);
  afterAll(async () => { await server?.close(); });

  function post(actor: string, path: string, payload: Record<string, unknown>, key = randomUUID()) {
    return server.app.inject({ method: "POST", url: path, payload,
      headers: { cookie: `t035=${actor}`, "idempotency-key": key } });
  }
  async function v2(actor: string, path: string, payload: Record<string, unknown>) {
    const response = await post(actor, `/v2/guided-learning/${path}`, payload);
    expect(response.statusCode, path + " " + response.body).toBe(200);
    return response.json<{ attempt: V2AttemptManifest; state: V2RouteState }>();
  }
  it("F05 keeps the V1 active route when a newer V2 enrollment shares the account", async () => {
    const response = await server.app.inject({ url: "/v1/guided-learning/home", headers: { cookie: "t035=f03-desktop" } });
    expect(response.statusCode).toBe(200);
    expect(response.json().activePath).toMatchObject({ title: "Repaso simulado F03", totalSteps: 1 });
    expect(response.json().counts.activePaths).toBe(1);
  });
  async function setup(total: number, previouslyCorrect = true) {
    const n = serial++, actor = `student-${n}`, userId = id(n);
    const enrolled = await v2(actor, "enrollments", { pathId: server.fixtures.small!.pathId });
    let clock = new Date((await server.app.inject({ url: "/__test/ready" })).json().now);
    const service = createPostgresGuidedV2AttemptService(server.db.database, { now: () => clock });
    // Set up a frozen activity directly; creation/selection has separate integration coverage.
    const begin = async () => {
      const result = await service.create({ userId, enrollmentId: enrolled.state.enrollmentId,
        expectedEnrollmentVersion: 1, clientAttemptId: randomUUID(), idempotencyKey: randomUUID(), target: { kind: "activity", key: "short-1" } });
      if (result.status !== "success") throw new Error(JSON.stringify(result));
      return result.value;
    };
    const first = await begin();
    const saved = await v2(actor, `attempts/${first.attemptId}/responses`, { activityKey: "short-1",
      answer: { kind: "short_answer", text: previouslyCorrect ? "respuesta" : "incorrecta" }, confidence: null, expectedVersion: first.rowVersion });
    await v2(actor, `attempts/${first.attemptId}/complete`, { expectedVersion: saved.attempt.rowVersion });
    await server.app.inject({ method: "POST", url: "/__test/clock", payload: { milliseconds: 600_000 } });
    clock = new Date(clock.getTime() + 600_000);
    const attempt = await begin();
    const template = await server.db.pool.query<{ id: string }>("select id from learning_attempts where user_id=$1 and projection='review'", [id(100)]);
    const reviewId = randomUUID();
    await server.db.pool.query(`insert into learning_attempts(id,user_id,client_attempt_id,purpose,projection,manifest_json,resume_json)
      select $1,$2,$1,purpose,projection,manifest_json,resume_json from learning_attempts where id=$3`, [reviewId, userId, template.rows[0]!.id]);
    const item = await server.db.pool.query<{ item_id: string }>(`insert into learning_review_states(user_id,item_id,memory_version,next_due_at)
      select $1,item_id,memory_version,next_due_at from learning_review_states where user_id=$2 returning item_id`, [userId, id(100)]);
    const provider = createPostgresGuidedLearningProvider(server.db.database);
    const review = await provider.getAttempt({ attemptId: reviewId, userId });
    if (review.status !== "success" || review.value.manifest.projection !== "review") throw new Error(JSON.stringify(review));
    const question = review.value.manifest.items[0]!;
    if (question.kind !== "quiz") throw new Error("Expected question");
    const now = (await server.app.inject({ url: "/__test/ready" })).json().now;
    const event = await server.db.pool.query<{ id: string }>(`insert into learning_events(user_id,event_type,semantic_key,payload_json,occurred_at,local_date,timezone)
      values($1,'review_applied','baseline','{}',$2,($2::timestamptz at time zone 'America/Caracas')::date,'America/Caracas') returning id`, [userId, now]);
    await server.db.pool.query(`insert into learning_rewards(user_id,award_key,reward_kind,xp,event_id,local_date)
      select $1,'baseline','review_applied',$2,id,local_date from learning_events where id=$3`, [userId, total, event.rows[0]!.id]);
    const requests = {
      v1: { path: `/v1/guided-learning/attempts/${reviewId}/responses`, key: randomUUID(), body: {
        kind: "quiz", itemId: item.rows[0]!.item_id, optionId: question.options[0]!.id, round: 1, expectedVersion: 1, expectedReviewVersion: 1 } },
      v2: { path: `/v2/guided-learning/attempts/${attempt.attemptId}/responses`, key: randomUUID(), body: {
        activityKey: "short-1", answer: { kind: "short_answer", text: "respuesta" }, confidence: null, expectedVersion: 1 } },
    };
    return { actor, userId, requests, reviewId, attempt, enrollmentId: enrolled.state.enrollmentId, provider };
  }

  async function reconcile(f: Awaited<ReturnType<typeof setup>>) {
    const ledger = await server.db.pool.query<{ total: number; review: number; route: number; session: number }>(`select
      coalesce(sum(r.xp),0)::int total,
      coalesce(sum(r.xp) filter(where r.reward_kind='review_applied'),0)::int review,
      coalesce(sum(r.xp) filter(where e.enrollment_id=$2),0)::int route,
      coalesce(sum(r.xp) filter(where e.payload_json->>'v2AttemptId'=$3),0)::int session
      from learning_rewards r join learning_events e on e.id=r.event_id where r.user_id=$1`, [f.userId, f.enrollmentId, f.attempt.attemptId]);
    const sums = ledger.rows[0]!;
    const stateResponse = await server.app.inject({ url: `/v2/guided-learning/enrollments/${f.enrollmentId}/state`, headers: { cookie: `t035=${f.actor}` } });
    const state = stateResponse.json<{ state: V2RouteState }>().state;
    expect(state.motivation).toMatchObject({ totalXp: sums.total, routeXp: sums.route, extraToday: sums.review });
    expect((await f.provider.getHome({ userId: f.userId })).points).toBe(sums.total);
    const reloaded = await server.app.inject({ url: `/v2/guided-learning/attempts/${f.attempt.attemptId}`, headers: { cookie: `t035=${f.actor}` } });
    expect(reloaded.json().attempt.earnedXp).toBe(sums.session);
    const review = await f.provider.getAttempt({ userId: f.userId, attemptId: f.reviewId });
    if (review.status !== "success") throw new Error(JSON.stringify(review));
    const stored = await server.db.pool.query<{ xp: number }>(`select coalesce(sum(r.xp),0)::int xp from learning_rewards r
      join learning_events e on e.id=r.event_id where e.attempt_id=$1`, [f.reviewId]);
    expect(review.value.awards?.reduce((sum, a) => sum + a.xp, 0)).toBe(stored.rows[0]!.xp);
    return sums;
  }

  it.each([0, 18, 19, 20].flatMap(total => [true, false].map(previouslyCorrect => ({ total, previouslyCorrect }))))(
    "reconciles full responses and replays from $total daily XP (previously correct=$previouslyCorrect)", async ({ total, previouslyCorrect }) => {
    const f = await setup(total, previouslyCorrect);
    for (const engine of ["v1", "v2"] as const) {
      const request = f.requests[engine];
      const response = await post(f.actor, request.path, request.body, request.key);
      expect(response.statusCode, request.path + " " + response.body).toBe(200);
      const before = await reconcile(f);
      const replay = await post(f.actor, request.path, request.body, request.key);
      expect(replay.statusCode, replay.body).toBe(200);
      expect(replay.json().attempt).toEqual(response.json().attempt);
      expect(await reconcile(f)).toEqual(before);
      const conflict = await post(f.actor, request.path, { ...request.body, expectedVersion: 999 }, request.key);
      expect(conflict.statusCode).toBe(409);
      expect(await reconcile(f)).toEqual(before);
      if (engine === "v1") expect(response.json<LearningAttemptMutationResponse>().awards.reduce((sum, a) => sum + a.xp, 0)).toBe(Math.min(2, 20 - total));
    }
    expect((await reconcile(f)).review).toBe(Math.min(20, total + 2 + (previouslyCorrect ? 2 : 5)));
  }, 30_000);

  it.each(["v1", "v2"] as const)("serializes independent HTTP transactions, %s queued first at 19 XP", async first => {
    const f = await setup(19), guard = await server.db.pool.connect();
    const responses: Array<ReturnType<typeof post>> = [];
    try {
      await guard.query("begin");
      await guard.query("select pg_advisory_xact_lock(hashtextextended($1,0))", [`learning-rewards:${f.userId}`]);
      for (const engine of [first, first === "v1" ? "v2" : "v1", first, first === "v1" ? "v2" : "v1"] as const) {
        const request = f.requests[engine];
        responses.push(post(f.actor, request.path, request.body, request.key));
        // Force dispatch, then prove both connections overlap while waiting for the shared lock.
        void responses.at(-1)!.then(() => {});
        await expect.poll(async () => (await server.db.pool.query<{ pid: number }>(`select pid from pg_stat_activity
          where datname=current_database() and wait_event='advisory' and query like '%pg_advisory_xact_lock%'`)).rows.length).toBe(responses.length);
      }
      await guard.query("commit");
      const receipts = await Promise.all(responses);
      for (const response of receipts) expect(response.statusCode, response.body).toBe(200);
      expect((await reconcile(f)).review).toBe(20);
      expect(receipts[0]!.json().attempt).toEqual(receipts[2]!.json().attempt);
      expect(receipts[1]!.json().attempt).toEqual(receipts[3]!.json().attempt);
      expect((await server.db.pool.query("select count(*)::int n from learning_responses where attempt_id=$1", [f.reviewId])).rows).toEqual([{ n: 1 }]);
      expect((await server.db.pool.query("select count(*)::int n from learning_v2_responses where attempt_id=$1", [f.attempt.attemptId])).rows).toEqual([{ n: 1 }]);
      for (const request of Object.values(f.requests)) expect((await post(f.actor, request.path, request.body, request.key)).statusCode).toBe(200);
      expect((await reconcile(f)).review).toBe(20);
    } finally {
      await guard.query("rollback"); guard.release();
      await Promise.allSettled(responses);
    }
  }, 30_000);

  it("awards the unit and route once when the last two readings finish concurrently, and survives repeats", async () => {
    const userId = id(30), actor = "student-30", provider = createPostgresGuidedLearningProvider(server.db.database);
    const objectiveId = randomUUID();
    const created = await provider.createPath({ actorUserId: id(1), draft: LearningPathCreateRequestSchema.parse({
      slug: "f04-readings", title: "Lecturas simuladas", summary: "Simulación de finalizaciones concurrentes", coverKey: "heart", topicContentId: id(120),
      definition: { policyVersion: "guided-v1", evidenceLevel: "standard", releaseNotes: "Simulación F04",
        units: [{ stableKey: "unit", title: "Unidad", pedagogyVersion: 1, objectives: [{ id: objectiveId, title: "Leer el ejemplo", importance: 2 }],
          steps: [0, 1, 2].map(n => ({ stableKey: `read-${n}`, title: `Lectura ${n}`, purpose: "understand", isEssential: true, pedagogyVersion: 1,
            objectiveIds: [objectiveId], recommendedAfter: [], options: [{ label: "Leer", projection: "guide", isDefault: true,
              sourceContentId: id(121), rewardIdentity: randomUUID(), rewardVersion: 1, estimatedMinutes: 1, config: { selectedItemIds: [], objectiveMappings: [] } }] })) }] } }) });
    if (created.status !== "success") throw new Error(JSON.stringify(created));
    const path = created.value;
    await server.db.pool.query("update learning_path_versions set status='published',published_by=$1,published_at=now() where id=$2", [id(1), path.version.id]);
    await server.db.pool.query("update learning_paths set published_version_id=$1 where id=$2", [path.version.id, path.id]);
    const enrolled = await provider.createEnrollment({ userId, pathId: path.id });
    if (enrolled.status !== "success") throw new Error(JSON.stringify(enrolled));
    const enrollmentId = enrolled.value.enrollment.id;
    const options = path.version.units[0]!.steps.map(step => step.options[0]!.id);
    const launch = async (option: string) => {
      const result = await provider.createAttempt({ userId, idempotencyKey: randomUUID(), request: { clientAttemptId: randomUUID(), stepOptionId: option } });
      if (result.status !== "success") throw new Error(JSON.stringify(result));
      return result.value.attempt;
    };
    const complete = async (attempt: Awaited<ReturnType<typeof launch>>, key = randomUUID()) => {
      const response = await post(actor, `/v1/guided-learning/attempts/${attempt.id}/complete`, { confirmation: true, expectedVersion: attempt.rowVersion }, key);
      expect(response.statusCode, response.body).toBe(200);
      return response.json<LearningAttemptMutationResponse>();
    };
    // Establish the first-activity milestone before the last two steps race.
    const nonLinear = await complete(await launch(options[2]!));
    expect(nonLinear.progress?.completedEssentialSteps).toBe(1);
    expect(nonLinear.progress?.units[0]!.steps.filter(step => step.state === "completed").map(step => step.stepId))
      .toEqual([path.version.units[0]!.steps[2]!.id]);
    const home = await provider.getHome({ userId });
    expect(home.activePath?.steps?.filter(step => step.state === "completed").map(step => step.id))
      .toEqual([path.version.units[0]!.steps[2]!.id]);
    expect(home.activePath?.steps).toHaveLength(home.activePath!.totalSteps);
    expect(home.activePath?.pathHref).toBe(`/aprendizaje/rutas/${path.slug}`);
    const attempts = await Promise.all(options.slice(0, 2).map(launch));
    const guard = await server.db.pool.connect();
    let pending: Array<Promise<LearningAttemptMutationResponse>> = [];
    try {
      await guard.query("begin");
      await guard.query("select id from learning_enrollments where id=$1 for no key update", [enrollmentId]);
      pending = attempts.map(attempt => complete(attempt));
      await expect.poll(async () => (await server.db.pool.query(`select pid from pg_stat_activity where datname=current_database()
        and wait_event_type='Lock' and (query like 'update "learning_enrollments"%' or query like '%pg_advisory_xact_lock%')`)).rows.length).toBe(2);
      await guard.query("commit");
      const receipts = await Promise.all(pending);
      expect(receipts.flatMap(r => r.awards).filter(a => a.kind === "unit_completed")).toHaveLength(1);
      expect(receipts.flatMap(r => r.awards).filter(a => a.kind === "route_completed")).toHaveLength(1);
      const progress = await provider.getEnrollmentProgress({ enrollmentId, userId });
      expect(progress.status).toBe("success");
      if (progress.status === "success") expect(progress.value).toMatchObject({ completedEssentialSteps: 3, percentage: 100 });
      expect((await provider.getHome({ userId })).points).toBe(100);
      const repeated = await launch(options[2]!);
      const key = randomUUID(), receipt = await complete(repeated, key);
      expect(receipt.awards).toEqual([]);
      expect(receipt.attempt.awards).toEqual([]);
      expect(await complete(repeated, key)).toEqual(receipt);
      expect((await provider.getHome({ userId })).points).toBe(100);
      const ledger = await server.db.pool.query<{ kind: string; xp: number; n: number }>(`select reward_kind kind,sum(xp)::int xp,count(*)::int n
        from learning_rewards where user_id=$1 group by reward_kind order by reward_kind`, [userId]);
      expect(ledger.rows).toEqual([
        { kind: "activity_understand", xp: 30, n: 3 }, { kind: "milestone_first_activity", xp: 0, n: 1 },
        { kind: "milestone_first_unit", xp: 0, n: 1 }, { kind: "route_completed", xp: 50, n: 1 }, { kind: "unit_completed", xp: 20, n: 1 },
      ]);
    } finally {
      await guard.query("rollback"); guard.release(); await Promise.allSettled(pending);
    }
  }, 30_000);
});
