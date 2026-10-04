import Fastify from "fastify";
import { Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler, type CompiledQuery, type DatabaseConnection, type QueryResult } from "kysely";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { RoutePackageSchema, type RoutePackage, type IdentityProvider, type ContentProvider } from "@cediah/contracts";
import type { PGlite } from "@electric-sql/pglite";
import type { CediahDatabase } from "../src/db/database.js";
import { createPostgresGuidedV2AttemptService, createPostgresGuidedV2MetricsService } from "../src/providers/postgres-guided-learning-v2.js";
import { awardObjectiveV2, readLearningRewardsV2, readLearningRewardSummary } from "../src/guided-learning/rewards.js";
import { calculateMetricsV2, activeMillisecondsV2, heartbeatIntervalV2, registerGuidedV2MetricsRoutes, type MetricLearnerV2, type MetricAssessmentV2, type MetricAnswerV2 } from "../src/guided-learning/v2/metrics.js";
import { createGuidedV2Database, seedGuidedV2Runtime, v2Id } from "./helpers/guided-v2-db.js";
const start = Date.parse("2026-08-01T12:00:00Z");
const at = (days = 0, hours = 0) => new Date(start + days * 86400000 + hours * 3600000).toISOString();
const base = { objectiveKey: "core", relatedObjectiveKeys: [], required: true, sourceKeys: [],
  equivalenceKey: "family", hints: ["Pista"], use: "learning", prompt: "Pregunta sintética",
  feedback: { explanation: "Feedback sintético", commonError: "Revisar", sourceKeys: [] },
  misconceptionMappings: [], alternativeActivityKey: null };
const choice = (key: string, phase = "retrieve", representation = "text") => ({ ...base,
  key, equivalenceKey: key, phase, representation, kind: "single_choice",
  payload: { options: [{ key: "yes", text: "Sí" }, { key: "no", text: "No" }], correctKey: "yes", distractorFeedback: { no: "No" } } });
const study = (key: string, phase = "learn") => ({ ...base, key, equivalenceKey: key, phase,
  representation: "text", kind: "study", payload: { body: "Texto sintético", focusSpans: [], assetKey: null,
    scaffold: "explanation", videoRange: null } });
function definition(): RoutePackage {
  return RoutePackageSchema.parse({ schemaVersion: "2.0", packageKey: "evidence", revision: 1, locale: "es",
    route: { slug: "evidence-route", title: "Evidencia", summary: "Fixture", topicLabel: "Tema", audience: "Alumno", discipline: "general", coverKey: "heart" },
    policyVersion: "guided-v2.0", sources: [], assets: [],
    objectives: [{ key: "core", title: "Objetivo", unitKey: "unit", verb: "recall", criticality: "core", required: true,
      prerequisiteKeys: [], sourceKeys: [], comparisonGroup: null, misconceptions: [] }],
    units: [{ key: "unit", title: "Unidad", objectiveKeys: ["core"], activityKeys: ["explain", "recall-a", "recall-b", "apply"], support: "full", estimatedMinutes: null }],
    activities: [study("explain"), choice("recall-a"), choice("recall-b"), choice("apply", "apply", "diagram"),
      { ...choice("final"), use: "final" }, { ...choice("retention-seven"), use: "retention7" },
      { ...choice("retention-thirty"), use: "retention30" }, study("remediate", "remediate"), choice("verify"),
      choice("recall-c"), choice("recall-d"), choice("recall-e")],
    assessments: [{ key: "final-test", kind: "final", afterUnitKey: null, objectiveKeys: ["core"], candidateActivityKeys: ["final"],
      thresholdPercent: 80, thresholdRationale: "Umbral sintético documentado para comprobar la política." },
      ...(["retention7", "retention30"] as const).map((kind) => ({ key: kind === "retention7" ? "seven-test" : "thirty-test", kind,
        afterUnitKey: null, objectiveKeys: ["core"], candidateActivityKeys: [kind === "retention7" ? "retention-seven" : "retention-thirty"],
        thresholdPercent: 80, thresholdRationale: "Umbral sintético documentado para comprobar la retención." }))],
    reviewPlan: { objectiveKeys: [] }, editorial: { notes: "", unresolvedIssues: [] } });
}
function databaseFor(pg: PGlite): Kysely<CediahDatabase> {
  const connection: DatabaseConnection = { async executeQuery<R>(query: CompiledQuery): Promise<QueryResult<R>> {
    const result = await pg.query<R>(query.sql, [...query.parameters]);
    return { rows: result.rows, numAffectedRows: BigInt(result.affectedRows ?? 0) };
  }, async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> { yield { rows: [] }; } };
  return new Kysely<CediahDatabase>({ dialect: {
    createAdapter: () => new PostgresAdapter(), createIntrospector: (db) => new PostgresIntrospector(db), createQueryCompiler: () => new PostgresQueryCompiler(),
    createDriver: () => ({ acquireConnection: async () => connection, beginTransaction: async () => { await pg.exec("begin"); },
      commitTransaction: async () => { await pg.exec("commit"); }, rollbackTransaction: async () => { await pg.exec("rollback"); },
      destroy: async () => {}, init: async () => {}, releaseConnection: async () => {} }),
  } });
}

const learner = (enrollmentId = v2Id(8), overrides: Partial<MetricLearnerV2> = {}): MetricLearnerV2 => ({
  enrollmentId, activatedAt: at(), requiredObjectiveKeys: ["core"], firstMasteredAt: { core: at() },
  completedAt: null, masteredAt: null, consolidatedAt: null, ...overrides,
});
const answer = (overrides: Partial<MetricAnswerV2> = {}): MetricAnswerV2 => ({ objectiveKey: "core", equivalenceKey: "reserved",
  modality: "diagram", score01: 1, gradingSource: "server", assisted: false, novelAtPresentation: true, newModality: true, ...overrides });
const assess = (kind: MetricAssessmentV2["kind"], day: number, overrides: Partial<MetricAssessmentV2> = {}): MetricAssessmentV2 => ({
  enrollmentId: v2Id(8), attemptId: `attempt-${kind}-${day}`, kind, acceptedAt: at(day), objectiveKeys: ["core"], answers: [answer()], ...overrides,
});
const metrics = (learners = [learner()], assessments: MetricAssessmentV2[] = [], heartbeats: Parameters<typeof calculateMetricsV2>[0]["heartbeats"] = []) => calculateMetricsV2({
  pathVersionId: v2Id(6), cohortStart: at(), cohortEnd: at(1), nowUtc: at(50), learners, assessments, heartbeats,
});

describe("guided v2 metrics, explicit denominators and nulls", () => {
  it("A01 omitted diagnosis or zero active time gives null descriptive efficiency", () => {
    expect(metrics([learner()], [assess("final", 1)])).toMatchObject({ enrolled: 1, evaluated: 1, immediate: 100,
      efficiency: null, efficiencyEvaluated: 0, activeMinutes: 0, missingness: { diagnosticOmitted: 1, zeroActiveMinutes: 1 } });
    expect(metrics([learner()], [assess("diagnostic", 0), assess("final", 1)]).efficiency).toBeNull();
  });
  it("A02 retention reports eligible, returned and absent learners separately", () => {
    expect(metrics([learner(), learner(v2Id(9)), learner(v2Id(10), { firstMasteredAt: { core: at(40) } })], [assess("retention30", 31)]))
      .toMatchObject({ enrolled: 3, retention30: { eligible: 2, responded: 1, eligibleObjectives: 2, respondedObjectives: 1, mean: 100, daysElapsed: [31] },
        missingness: { retention30Missing: 1 } });
  });
  it("retention keeps late observations outside the window mean", () => {
    const result = metrics([learner()], [assess("retention7", 15), assess("retention30", 46)]);
    expect(result.retention7).toMatchObject({ responded: 1, lateObjectives: 1, mean: null, daysElapsed: [15] });
    expect(result.retention30).toMatchObject({ responded: 1, lateObjectives: 1, mean: null, daysElapsed: [46] });
  });
  it.each([7, 14])("includes the day %i retention7 boundary", (day) => {
    expect(metrics([learner()], [assess("retention7", day)]).retention7).toMatchObject({ inWindowObjectives: 1, mean: 100 });
  });
  it.each([30, 45])("includes the day %i retention30 boundary", (day) => {
    expect(metrics([learner()], [assess("retention30", day)]).retention30).toMatchObject({ inWindowObjectives: 1, mean: 100 });
  });
  it("uses the first final, with missing required objectives as zero", () => {
    expect(metrics([learner(v2Id(8), { requiredObjectiveKeys: ["core", "omitted"] })], [assess("final", 1), assess("final", 2)])).toMatchObject({ evaluated: 1, immediate: 50 });
    expect(metrics([learner()], [assess("final", 1, { answers: [] })]).immediate).toBe(0);
  });
  it("descriptive efficiency uses comparable objectives and stops the clock at first final", () => {
    const intervals = [{ enrollmentId: v2Id(8), semanticKey: "first", start: at(), end: at(0, 1 / 60) },
      { enrollmentId: v2Id(8), semanticKey: "later-review", start: at(2), end: at(2, 1 / 60) }];
    const result = metrics([learner(v2Id(8), { requiredObjectiveKeys: ["core", "omitted"] })],
      [assess("diagnostic", 0, { answers: [answer({ score01: 0 })] }), assess("final", 1)], intervals);
    expect(result).toMatchObject({ efficiency: 100, efficiencyEvaluated: 1, activeMinutes: 2, immediate: 50 });
  });
  it("A03 repeated families cannot become transfer by changing their item ID or modality", () => {
    const first = assess("final", 1, { answers: [answer({ novelAtPresentation: false })] });
    const repeated = assess("retention7", 8, { answers: [answer({ modality: "case" })] });
    const novel = assess("retention30", 31, { answers: [answer({ equivalenceKey: "another", modality: "image" })] });
    expect(metrics([learner()], [first, repeated, novel]).transfer).toEqual({ eligibleItems: 1, correctItems: 1,
      modalities: [{ modality: "image", eligibleItems: 1, correctItems: 1 }] });
  });
  it.each([{ assisted: true }, { gradingSource: "self" as const }, { gradingSource: "none" as const },
    { newModality: false }, { novelAtPresentation: false }])("transfer excludes ineligible answer %j", (override) => {
    expect(metrics([learner()], [assess("final", 1, { answers: [answer(override)] })]).transfer.eligibleItems).toBe(0);
  });
  it("an assisted first exposure prevents claiming transfer on the next attempt", () => {
    expect(metrics([learner()], [assess("final", 1, { answers: [answer({ assisted: true })] }), assess("retention7", 8)]).transfer.eligibleItems).toBe(0);
  });
  it("diagnostic exposures remain exposed and a later diagnosis cannot create a baseline", () => {
    expect(metrics([learner()], [assess("diagnostic", 0), assess("final", 1)]).transfer.eligibleItems).toBe(0);
    expect(metrics([learner()], [assess("final", 1), assess("diagnostic", 2)])).toMatchObject({ efficiency: null, missingness: { diagnosticOmitted: 1 } });
  });
  it("empty cohorts have null means and zero denominators", () => {
    expect(metrics([])).toMatchObject({ enrolled: 0, evaluated: 0, immediate: null, efficiency: null, retention30: { eligible: 0, mean: null } });
  });
  it("cohort boundaries, replay and future observations do not change denominators", () => {
    const final = assess("final", 1);
    expect(metrics([learner(), learner(v2Id(9), { activatedAt: at(1) })], [final, final, assess("final", 51)])).toMatchObject({ enrolled: 1, evaluated: 1 });
    expect(() => metrics([learner(), learner()])).toThrow("duplicada");
  });
  it("never exports identities, answers, prompts or clinical text", () => {
    const serialized = JSON.stringify(metrics([learner()], [assess("final", 1)]));
    for (const secret of [v2Id(8), "objectiveKey", "equivalenceKey", "answers", "prompt", "userId"]) expect(serialized).not.toContain(secret);
  });
});

describe("guided v2 active time", () => {
  it("deduplicates semantic replays and unions overlapping device intervals", () => {
    const first = { enrollmentId: v2Id(8), semanticKey: "tick", start: at(), end: at(0, 1 / 60) };
    expect(activeMillisecondsV2([first, first, { ...first, semanticKey: "device2", start: at(0, 1 / 120), end: at(0, 1 / 40) }], at(1))).toBe(90000);
  });
  it("hidden tabs, no interaction and future interaction grant zero time", () => {
    expect(heartbeatIntervalV2(new Date(at()), null, true)).toBeNull();
    expect(heartbeatIntervalV2(new Date(at()), new Date(at()), false)).toBeNull();
    expect(heartbeatIntervalV2(new Date(at()), new Date(at(1)), true)).toBeNull();
  });
  it("limits ticks to 30 seconds and cuts intervals at 60 seconds inactivity", () => {
    const seconds = (n: number) => new Date(start + n * 1000);
    expect(heartbeatIntervalV2(seconds(30), seconds(0), true)).toEqual({ start: seconds(0).toISOString(), end: seconds(30).toISOString() });
    expect(heartbeatIntervalV2(seconds(75), seconds(0), true)).toEqual({ start: seconds(45).toISOString(), end: seconds(60).toISOString() });
    expect(heartbeatIntervalV2(seconds(91), seconds(0), true)).toBeNull();
  });
});

describe("guided v2 metric endpoint permissions", () => {
  it.each(["student", "content_creator", "coordinator", "administrator"])("uses existing %s permissions", async (role) => {
    const app = Fastify(); let calls = 0;
    await registerGuidedV2MetricsRoutes(app, { identityProvider: { getUser: async () => ({ id: v2Id(1) }) } as unknown as IdentityProvider,
      contentProvider: { getRoles: async () => [role] } as unknown as ContentProvider,
      provider: { metrics: async () => { calls++; return { status: "success", value: metrics() }; } } });
    try {
      const url = `/v2/editor/learning-paths/${v2Id(4)}/metrics?pathVersionId=${v2Id(6)}&cohortStart=${at()}&cohortEnd=${at(1)}`;
      expect((await app.inject({ url })).statusCode).toBe(401);
      const response = await app.inject({ url, headers: { authorization: "Bearer fixture" } });
      expect(response.statusCode).toBe(["coordinator", "administrator"].includes(role) ? 200 : 403);
      expect(calls).toBe(["coordinator", "administrator"].includes(role) ? 1 : 0);
      if (response.statusCode === 200) expect(response.headers["cache-control"]).toBe("private, no-store");
    } finally { await app.close(); }
  });
  it("rejects reversed date ranges before querying and hides missing versions", async () => {
    const app = Fastify(); let calls = 0;
    await registerGuidedV2MetricsRoutes(app, { identityProvider: { getUser: async () => ({ id: v2Id(1) }) } as unknown as IdentityProvider,
      contentProvider: { getRoles: async () => ["coordinator"] } as unknown as ContentProvider,
      provider: { metrics: async () => { calls++; return { status: "not_found" }; } } });
    try {
      const base = `/v2/editor/learning-paths/${v2Id(4)}/metrics?pathVersionId=${v2Id(6)}`;
      const headers = { authorization: "Bearer fixture" };
      expect((await app.inject({ url: `${base}&cohortStart=${at(1)}&cohortEnd=${at()}`, headers })).statusCode).toBe(400);
      expect(calls).toBe(0);
      expect((await app.inject({ url: `${base}&cohortStart=${at()}&cohortEnd=${at(1)}`, headers })).statusCode).toBe(404);
    } finally { await app.close(); }
  });
});

describe("guided v2 metrics/rewards persisted in isolated PGlite", () => {
  let pg: PGlite, database: Kysely<CediahDatabase>;
  let clock = new Date(at());
  let attempts: ReturnType<typeof createPostgresGuidedV2AttemptService>;
  let adapter: ReturnType<typeof createPostgresGuidedV2MetricsService>;
  let serial = 9000;
  beforeAll(async () => {
    pg = await createGuidedV2Database(); await seedGuidedV2Runtime(pg);
    await pg.query("update public.content_items set status='published',catalog_visibility='catalog',published_at=now(),published_by=$2 where id=$1", [v2Id(3), v2Id(1)]);
    const route = definition();
    route.activities.find((item) => item.key === "final")!.representation = "case";
    route.activities.find((item) => item.key === "recall-c")!.representation = "case";
    await pg.query("update public.learning_path_versions set definition_v2_json=$1::jsonb where id=$2", [JSON.stringify(route), v2Id(6)]);
    await pg.query("insert into public.learning_v2_bindings(path_version_id,local_key,kind,topic_content_id) values($1,'topic','topic',$2)", [v2Id(6), v2Id(3)]);
    await pg.query("update public.learning_path_versions set status='published',published_at=now(),published_by=$2 where id=$1", [v2Id(6), v2Id(1)]);
    await pg.query("update public.learning_paths set published_version_id=$1 where id=$2", [v2Id(6), v2Id(4)]);
    await pg.query("update public.learning_enrollments set created_at=$1", [at()]);
    database = databaseFor(pg); attempts = createPostgresGuidedV2AttemptService(database, { now: () => clock });
    adapter = createPostgresGuidedV2MetricsService(database, { now: () => clock });
  }, 120000);
  afterAll(async () => { await database?.destroy(); await pg?.close(); });
  async function create(key: string, kind: "activity" | "assessment" = "activity") {
    const result = await attempts.create({ userId: v2Id(1), enrollmentId: v2Id(8), clientAttemptId: v2Id(serial++), idempotencyKey: v2Id(serial++),
      expectedEnrollmentVersion: 1, target: { kind, key } });
    if (result.status !== "success") throw new Error(`create: ${result.status}`);
    return result.value.attemptId;
  }
  async function respond(attemptId: string, activityKey: string) {
    const input = { userId: v2Id(1), attemptId, activityKey, idempotencyKey: v2Id(serial++), expectedVersion: 1,
      confidence: null, answer: { kind: "single_choice" as const, optionKey: "yes" } };
    const result = await attempts.respond(input); expect(result.status).toBe("success"); return { input, result };
  }
  it("opening/reading grants zero XP; correct recall grants +5 exactly once", async () => {
    const attemptId = await create("recall-a");
    expect((await readLearningRewardSummary(database, v2Id(1))).points).toBe(0);
    await attempts.read({ userId: v2Id(1), attemptId });
    expect((await readLearningRewardSummary(database, v2Id(1))).points).toBe(0);
    const helped = await create("recall-c");
    expect((await attempts.help({ userId: v2Id(1), attemptId: helped, activityKey: "recall-c",
      idempotencyKey: v2Id(serial++), kind: "hint", expectedVersion: 1 })).status).toBe("success");
    expect((await readLearningRewardSummary(database, v2Id(1))).points).toBe(0);
    const accepted = await respond(attemptId, "recall-a");
    expect(await attempts.respond(accepted.input)).toEqual(accepted.result);
    await attempts.readEvidence({ userId: v2Id(1), enrollmentId: v2Id(8) });
    expect((await readLearningRewardSummary(database, v2Id(1))).points).toBe(5);
    expect(await adapter.feedbackViewed({ userId: v2Id(2), attemptId, activityKey: "recall-a" })).toEqual({ status: "not_found" });
    expect(await adapter.feedbackViewed({ userId: v2Id(1), attemptId, activityKey: "recall-a" })).toEqual({ status: "success" });
  });
  it("persists heartbeat once, unions devices, cuts inactivity and never creates XP", async () => {
    clock = new Date(start + 30000);
    const tick = { userId: v2Id(1), enrollmentId: v2Id(8), deviceKey: v2Id(100), tickKey: v2Id(101), visible: true };
    expect(await adapter.heartbeat(tick)).toEqual({ status: "success" });
    await adapter.heartbeat(tick); await adapter.heartbeat({ ...tick, deviceKey: v2Id(102) });
    clock = new Date(start + 75000); await adapter.heartbeat({ ...tick, tickKey: v2Id(103) });
    clock = new Date(start + 95000); await adapter.heartbeat({ ...tick, tickKey: v2Id(104) });
    const hidden = { ...tick, tickKey: v2Id(105), visible: false }; await adapter.heartbeat(hidden);
    await adapter.heartbeat({ ...hidden, visible: true });
    expect(await adapter.heartbeat({ ...tick, userId: v2Id(2) })).toEqual({ status: "not_found" });
    const aggregate = await adapter.metrics({ pathId: v2Id(4), pathVersionId: v2Id(6), cohortStart: at(), cohortEnd: at(1) });
    expect(aggregate).toMatchObject({ status: "success", value: { enrolled: 2, activeMinutes: .75 } });
    expect((await pg.query("select count(*)::int as n from learning_events where event_type='heartbeat'")).rows).toEqual([{ n: 5 }]);
    expect((await readLearningRewardSummary(database, v2Id(1))).points).toBe(5);
  });
  it("automatic mastery grants +10; cache rebuilding and repeated correct answers grant no extra XP", async () => {
    clock = new Date(at(0, 1)); await respond(await create("recall-b"), "recall-b");
    clock = new Date(at(0, 2)); await respond(await create("apply"), "apply");
    expect((await readLearningRewardSummary(database, v2Id(1))).points).toBe(15);
    await pg.query("update learning_v2_objective_state set evidence_json='{}',first_mastered_at=null where enrollment_id=$1", [v2Id(8)]);
    await attempts.readEvidence({ userId: v2Id(1), enrollmentId: v2Id(8) });
    await respond(await create("recall-a"), "recall-a");
    expect((await readLearningRewardSummary(database, v2Id(1))).points).toBe(15);
  });
  it("first consolidation grants +15 once and records actual retention aggregates", async () => {
    const study = await create("explain");
    await attempts.respond({ userId: v2Id(1), attemptId: study, activityKey: "explain", idempotencyKey: v2Id(serial++), expectedVersion: 1,
      confidence: null, answer: { kind: "study", acknowledged: true } });
    const submit = async (key: string, activityKey: string) => {
      const attemptId = await create(key, "assessment"); await respond(attemptId, activityKey);
      // Synthetic T021 presentation metadata: the family is new, but its modality was already presented without an answer.
      if (key === "final-test") await pg.query("update learning_v2_responses set novel_at_presentation=true where attempt_id=$1", [attemptId]);
      const input = { userId: v2Id(1), attemptId, idempotencyKey: v2Id(serial++), expectedVersion: 2 };
      expect((await attempts.complete(input)).status).toBe("success"); expect((await attempts.complete(input)).status).toBe("success");
    };
    await submit("final-test", "final");
    clock = new Date(at(7, 2)); await submit("seven-test", "retention-seven");
    clock = new Date(at(30, 2)); await submit("thirty-test", "retention-thirty");
    expect((await readLearningRewardSummary(database, v2Id(1))).points).toBe(30);
    const aggregate = await adapter.metrics({ pathId: v2Id(4), pathVersionId: v2Id(6), cohortStart: at(), cohortEnd: at(1) });
    expect(aggregate).toMatchObject({ status: "success", value: { enrolled: 2, evaluated: 1, immediate: 100,
      retention7: { eligible: 1, responded: 1, mean: 100, daysElapsed: [7] },
      retention30: { eligible: 1, responded: 1, mean: 100, daysElapsed: [30] }, consolidated: 1, transfer: { eligibleItems: 0 } } });
    expect(JSON.stringify(aggregate)).not.toContain("Pregunta sintética");
    expect((await pg.query("select event_type,count(*)::int as n from learning_events where event_type in ('final_submitted','retention_submitted','route_consolidated') group by event_type order by event_type")).rows)
      .toEqual([{ event_type: "final_submitted", n: 1 }, { event_type: "retention_submitted", n: 2 }, { event_type: "route_consolidated", n: 1 }]);
  });
  it("mixed v1/v2 account keeps historical rows and reads strict v1 milestones safely", async () => {
    await pg.query("insert into learning_events(user_id,event_type,semantic_key,payload_json,policy_version,occurred_at,local_date,timezone) values($1,'legacy','legacy','{}','guided-v1',$2,'2026-08-01','UTC')", [v2Id(1), at()]);
    await pg.query("insert into learning_rewards(user_id,award_key,reward_kind,xp,event_id,local_date) select $1,'legacy','milestone_first_activity',3,id,'2026-08-01' from learning_events where semantic_key='legacy'", [v2Id(1)]);
    const before = (await pg.query("select * from learning_rewards where award_key='legacy'")).rows;
    await database.transaction().execute((transaction) => awardObjectiveV2(transaction, { userId: v2Id(1), enrollmentId: v2Id(8), pathVersionId: v2Id(6),
      objectiveKey: "core", kind: "v2_objective_mastered", acceptedAt: clock }));
    expect((await readLearningRewardSummary(database, v2Id(1))).points).toBe(33);
    expect((await readLearningRewardSummary(database, v2Id(1))).milestones).toHaveLength(1);
    expect(await readLearningRewardsV2(database, v2Id(1))).toHaveLength(4);
    expect((await pg.query("select * from learning_rewards where award_key='legacy'")).rows).toEqual(before);
    await expect(pg.query("insert into learning_rewards(user_id,award_key,reward_kind,xp,event_id,local_date) select $1,'invalid','unknown',5,id,'2026-08-01' from learning_events where semantic_key='legacy'", [v2Id(1)])).rejects.toThrow("learning_rewards_reward_kind_check");
  });
  it("ledger failure rolls back response, semantic event, receipt and cache", async () => {
    const attemptId = await create("recall-c");
    const before = (await pg.query("select evidence_json,first_mastered_at,row_version from learning_v2_objective_state where enrollment_id=$1", [v2Id(8)])).rows;
    await pg.query("delete from learning_rewards where reward_kind='v2_objective_recalled'");
    await pg.exec("create function t020_reject_reward() returns trigger language plpgsql as $$ begin raise exception 't020_atomicity_probe'; end $$; create trigger t020_reject_reward before insert on learning_rewards for each row execute function t020_reject_reward();");
    const idempotencyKey = v2Id(serial++);
    try {
      await expect(attempts.respond({ userId: v2Id(1), attemptId, activityKey: "recall-c", idempotencyKey, expectedVersion: 1,
        confidence: null, answer: { kind: "single_choice", optionKey: "yes" } })).rejects.toThrow("t020_atomicity_probe");
    } finally { await pg.exec("drop trigger t020_reject_reward on learning_rewards; drop function t020_reject_reward();"); }
    expect((await pg.query("select count(*)::int as n from learning_v2_responses where attempt_id=$1", [attemptId])).rows).toEqual([{ n: 0 }]);
    expect((await pg.query("select count(*)::int as n from learning_mutation_receipts where idempotency_key=$1", [idempotencyKey])).rows).toEqual([{ n: 0 }]);
    expect((await pg.query("select count(*)::int as n from learning_events where semantic_key=$1", [`v2-response:${attemptId}:recall-c`])).rows).toEqual([{ n: 0 }]);
    expect((await pg.query("select evidence_json,first_mastered_at,row_version from learning_v2_objective_state where enrollment_id=$1", [v2Id(8)])).rows).toEqual(before);
    await attempts.readEvidence({ userId: v2Id(1), enrollmentId: v2Id(8) });
    expect((await readLearningRewardSummary(database, v2Id(1))).points).toBe(33);
  });
  it("version/path mismatch returns not_found without revealing cohort information", async () => {
    expect(await adapter.metrics({ pathId: v2Id(999), pathVersionId: v2Id(6), cohortStart: at(), cohortEnd: at(1) })).toEqual({ status: "not_found" });
  });
});


