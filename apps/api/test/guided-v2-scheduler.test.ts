import { readdir, readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { Pool } from "pg";
import { Kysely, PostgresDialect, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler,
  type CompiledQuery, type DatabaseConnection, type QueryResult } from "kysely";
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { RoutePackageSchema, type RoutePackage } from "@cediah/contracts";
import type { PGlite } from "@electric-sql/pglite";
import type { CediahDatabase } from "../src/db/database.js";
import { createPostgresGuidedV2AttemptService } from "../src/providers/postgres-guided-learning-v2.js";
import { scheduleReviewV2, reviewDueV2, type ReviewResponseV2 } from "../src/guided-learning/v2/scheduler.js";
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

const receipt = (n: number, days = 0, changes: Partial<ReviewResponseV2> = {}): ReviewResponseV2 => ({
  responseId: `response-${n}`, sessionId: "session", acceptedAt: at(days), gradingSource: "server",
  score01: 1, assisted: false, selfRating: null, purpose: "learning", phase: "retrieve", valid: true, ...changes,
});

describe("guided v2 pure scheduler", () => {
  it("P12 extends once per rolling 24h, uses actual acceptance and caps stage at four", () => {
    const first = scheduleReviewV2(null, receipt(1))!;
    expect(first).toMatchObject({ stage: 1, dueAt: at(1), lastExtendedAt: at() });
    const sameDay = scheduleReviewV2(first, receipt(2, 1 - 1 / 86400000))!;
    expect(sameDay).toMatchObject({ stage: 1, dueAt: at(1) });
    const next = scheduleReviewV2(sameDay, receipt(3, 1))!;
    expect(next).toMatchObject({ stage: 2, dueAt: at(4) });
    let state = next;
    for (let n = 4; n <= 7; n++) state = scheduleReviewV2(state, receipt(n, n * 10))!;
    expect(state).toMatchObject({ stage: 4, dueAt: at(100) });
  });

  it("P13 three semantic failures yield 10min/10min/1d; duplicates never add lapses", () => {
    const history: ReviewResponseV2[] = [];
    let state = null;
    for (let n = 1; n <= 3; n++) {
      const r = receipt(n, 0, { score01: 0, acceptedAt: at(0, n) });
      state = scheduleReviewV2(state, r, history)!;
      expect(state.lapses).toBe(n);
      expect(state.dueAt).toBe(at(n === 3 ? 1 : 0, n + (n === 3 ? 0 : 1 / 6)));
      expect(scheduleReviewV2(state, r, history)).toBe(state);
      history.push(r);
    }
    expect(scheduleReviewV2(state, receipt(4, 0, { acceptedAt: at(0, 4) }), history)).toMatchObject({
      stage: 0, lapses: 3, dueAt: at(1, 3), lastExtendedAt: null,
    });
    expect(scheduleReviewV2(state, receipt(5, 2), history)).toMatchObject({ stage: 1, dueAt: at(3) });
  });

  it.each([
    { assisted: true }, { assisted: true, score01: 0 }, { score01: .5 }, { gradingSource: "self" as const, selfRating: "hard" as const },
    { gradingSource: "self" as const, selfRating: "good" as const },
    { gradingSource: "none" as const, score01: null, assisted: true },
  ])("assistance, partial and self-reports only schedule one day (%j)", (changes) => {
    expect(scheduleReviewV2(null, receipt(1, 0, changes))).toMatchObject({ stage: 0, lapses: 0, dueAt: at(1), lastExtendedAt: null });
  });
  it("self again reinforces; changing session resets immediate retries, never stability", () => {
    const r = receipt(1, 0, { gradingSource: "self", selfRating: "again", score01: null });
    const state = scheduleReviewV2(null, r)!;
    expect(state).toMatchObject({ lapses: 1, stage: 0, dueAt: at(0, 1 / 6) });
    const history = [r, { ...r, responseId: "two" }];
    expect(scheduleReviewV2(state, receipt(3, 0, { score01: 0, sessionId: "new" }), history)?.dueAt).toBe(at(0, 1 / 6));
    expect(scheduleReviewV2(state, receipt(4, 0, { assisted: true }), history)?.dueAt).toBe(state.dueAt);
  });
  it.each([{ purpose: "diagnostic" }, { purpose: "preview" }, { valid: false }, { phase: "learn" }, { gradingSource: "none" as const }])(
    "does not create debt for ineligible responses (%j)", (changes) => expect(scheduleReviewV2(null, receipt(1, 0, changes))).toBeNull(),
  );
  it("retention dates use first mastery, late day7 pushes day30, and absence never fails", () => {
    const first = scheduleReviewV2(null, receipt(1), [], at())!;
    expect(first).toMatchObject({ retention7DueAt: at(7), retention30DueAt: at(30) });
    expect(reviewDueV2(first, new Date(at(25)))).toMatchObject({ kind: "retention7", overdueMs: 18 * 86400000 });
    expect(first.lapses).toBe(0);
    const early = scheduleReviewV2(first, receipt(2, 6, { purpose: "retention7" }), [], at())!;
    expect(early.retention7AcceptedAt).toBeNull();
    const late = scheduleReviewV2(first, receipt(3, 28, { purpose: "retention7" }), [], at())!;
    expect(late).toMatchObject({ retention7AcceptedAt: at(28), retention30DueAt: at(35) });
    expect(scheduleReviewV2(late, receipt(4, 30, { purpose: "retention30" }), [], at())?.retention30AcceptedAt).toBeNull();
    expect(scheduleReviewV2(late, receipt(5, 35, { purpose: "retention30" }), [], at())?.retention30AcceptedAt).toBe(at(35));
    expect(reviewDueV2(late, new Date(at(35))).kind).toBe("retention30");
  });
  it("failed retention records the measurement and keeps reinforcement; assisted cannot accept it", () => {
    const first = scheduleReviewV2(null, receipt(1), [], at())!;
    expect(scheduleReviewV2(first, receipt(2, 7, { purpose: "retention7", assisted: true }), [], at())?.retention7AcceptedAt).toBeNull();
    const failed = receipt(3, 7, { purpose: "retention7", score01: 0 });
    const state = scheduleReviewV2(first, failed, [], at())!;
    expect(state).toMatchObject({ retention7AcceptedAt: at(7), dueAt: at(7, 1 / 6), lapses: 1, stage: 0 });
    expect(scheduleReviewV2(state, receipt(4, 7), [failed], at())?.dueAt).toBe(state.dueAt);
  });
  it("UTC is invariant across offsets and daylight-saving boundaries", () => {
    const a = scheduleReviewV2(null, receipt(1, 0, { acceptedAt: "2026-11-01T01:30:00-04:00" }))!;
    const b = scheduleReviewV2(null, receipt(1, 0, { acceptedAt: "2026-11-01T05:30:00Z" }))!;
    expect(a).toEqual(b);
    expect(a.dueAt).toBe("2026-11-02T05:30:00.000Z");
  });
});

const postgresUrl = process.env.KORAZ_T018_TEST_DATABASE_URL;
for (const backend of ["pglite", "postgres"] as const) {
  describe.skipIf(backend === "postgres" && !postgresUrl)(`guided v2 scheduler ${backend} transactions`, () => {
    let pg: PGlite | null = null;
    let control: Pool | null = null;
    let leftDb: Kysely<CediahDatabase>;
    let rightDb: Kysely<CediahDatabase>;
    let left: ReturnType<typeof createPostgresGuidedV2AttemptService>;
    let right: ReturnType<typeof createPostgresGuidedV2AttemptService>;
    let clock: Date;
    let serial = 2000;
    const query = async (sql: string, params: unknown[] = []) => {
      if (pg) return (await pg.query(sql, params)).rows;
      return (await control!.query(sql, params)).rows;
    };
    beforeAll(async () => {
      if (backend === "pglite") {
        pg = await createGuidedV2Database();
        await seedGuidedV2Runtime(pg);
        leftDb = databaseFor(pg);
        rightDb = leftDb;
      } else {
        const url = new URL(postgresUrl!);
        if (process.env.KORAZ_TEST_DATABASE !== "true" || url.protocol !== "postgresql:"
          || url.hostname !== "127.0.0.1" || url.port !== "55418" || url.pathname !== "/koraz_t018_test") {
          throw new Error("T018 requires a disposable localhost:55418/koraz_t018_test database and test marker");
        }
        control = new Pool({ connectionString: postgresUrl, max: 2 });
        if ((await query("select to_regclass('public.auth_users') as name"))[0]!.name) throw new Error("Refusing to overwrite existing tables");
        await control.query("create role cediah_runtime; create role anon; create role authenticated;");
        const directory = new URL("../../../database/migrations/", import.meta.url);
        for (const file of (await readdir(directory)).filter((f) => /^\d+_[a-z0-9_]+\.sql$/.test(f)
          && f.localeCompare("0031_guided_v2_runtime.sql") <= 0).sort()) {
          if (file === "0005_restore_legacy_content.sql") continue;
          await control.query(`begin;\n${await readFile(new URL(file, directory), "utf8")}\ncommit;`);
        }
        const fixture = await control.connect();
        try {
          await fixture.query("begin");
          await fixture.query("insert into auth_users(id,name,email) values ($1,'Learner','t018@example.test')", [v2Id(1)]);
          await fixture.query("insert into content_items(id,kind,slug,title,summary,topic,author_user_id) values ($1,'topic','scheduler-topic','Topic','Fixture','Topic',$2)", [v2Id(3), v2Id(1)]);
          await fixture.query("insert into learning_paths(id,topic_content_id,slug,title,summary,cover_key,created_by) values ($1,$2,'scheduler-route','Route','Fixture','heart',$3)", [v2Id(4), v2Id(3), v2Id(1)]);
          await fixture.query("insert into learning_path_versions(id,path_id,version_number,policy_version,policy_json,definition_v2_json) values ($1,$2,2,'guided-v2.0','{}','{}')", [v2Id(6), v2Id(4)]);
          await fixture.query("insert into learning_enrollments(id,user_id,path_id,path_version_id) values ($1,$2,$3,$4)", [v2Id(8), v2Id(1), v2Id(4), v2Id(6)]);
          await fixture.query("insert into learning_enrollment_versions(enrollment_id,path_id,path_version_id) values ($1,$2,$3)", [v2Id(8), v2Id(4), v2Id(6)]);
          await fixture.query("commit");
        } catch (error) { await fixture.query("rollback"); throw error; }
        finally { fixture.release(); }
        leftDb = new Kysely<CediahDatabase>({ dialect: new PostgresDialect({ pool: new Pool({ connectionString: postgresUrl, max: 1, application_name: "koraz-t018-left" }) }) });
        rightDb = new Kysely<CediahDatabase>({ dialect: new PostgresDialect({ pool: new Pool({ connectionString: postgresUrl, max: 1, application_name: "koraz-t018-right" }) }) });
      }
      const route = definition();
      route.activities.push({ ...base, use: "learning", key: "self", phase: "retrieve", representation: "text", kind: "constructed_response",
        payload: { rubric: [{ key: "reason", criterion: "Explica", example: "A causa B" }],
          modelAnswer: "A causa B", verificationActivityKey: "recall-a" } });
      route.activities.push({ ...base, use: "learning", key: "partial", phase: "retrieve", representation: "text", kind: "match",
        payload: { presentation: "pairs", prompts: [{ key: "a", text: "A" }, { key: "b", text: "B" }],
          choices: [{ key: "x", text: "X" }, { key: "y", text: "Y" }], allowReuse: true, correctByPrompt: { a: "x", b: "y" }, edges: [] } });
      route.assessments.push({ key: "diagnosis", kind: "diagnostic", afterUnitKey: null, objectiveKeys: ["core"],
        candidateActivityKeys: ["recall-a"], thresholdPercent: 80, thresholdRationale: "Diagnóstico sintético de bajo riesgo para comprobar que no genera deuda." });
      route.assessments.push({ key: "batch", kind: "checkpoint", afterUnitKey: "unit", objectiveKeys: ["core"],
        candidateActivityKeys: ["recall-a", "recall-b", "recall-c", "recall-d"], thresholdPercent: 80,
        thresholdRationale: "Fixture para comprobar varios fallos del mismo objetivo en una sesión." });
      await query("update content_items set status='published',catalog_visibility='catalog',published_at=now(),published_by=$2 where id=$1", [v2Id(3), v2Id(1)]);
      await query("update learning_path_versions set definition_v2_json=$1::jsonb where id=$2", [JSON.stringify(RoutePackageSchema.parse(route)), v2Id(6)]);
      await query("insert into learning_v2_bindings(path_version_id,local_key,kind,topic_content_id) values ($1,'topic','topic',$2)", [v2Id(6), v2Id(3)]);
      await query("update learning_path_versions set status='published',published_at=now(),published_by=$2 where id=$1", [v2Id(6), v2Id(1)]);
      await query("update learning_paths set published_version_id=$1 where id=$2", [v2Id(6), v2Id(4)]);
      left = createPostgresGuidedV2AttemptService(leftDb, { now: () => clock });
      right = createPostgresGuidedV2AttemptService(rightDb, { now: () => clock });
    }, 120000);
    beforeEach(async () => {
      clock = new Date(at());
      await query("delete from learning_events");
      await query("delete from learning_mutation_receipts");
      await query("delete from learning_v2_review_state");
      await query("delete from learning_v2_objective_state");
      await query("delete from learning_v2_activity_state");
      await query("delete from learning_v2_responses");
      await query("delete from learning_v2_attempts");
    });
    afterAll(async () => {
      await leftDb?.destroy();
      if (rightDb && rightDb !== leftDb) await rightDb.destroy();
      await pg?.close();
      await control?.end();
    });
    async function create(key: string, kind: "activity" | "assessment" = "activity") {
      const result = await left.create({ userId: v2Id(1), enrollmentId: v2Id(8), clientAttemptId: v2Id(serial++),
        idempotencyKey: v2Id(serial++), expectedEnrollmentVersion: 1, target: { kind, key } });
      if (result.status !== "success") throw new Error(`create: ${result.status}`);
      return result.value;
    }
    const input = (attemptId: string, activityKey: string, expectedVersion = 1, correct = true) => ({
      userId: v2Id(1), attemptId, activityKey, expectedVersion, idempotencyKey: v2Id(serial++), confidence: null,
      answer: { kind: "single_choice", optionKey: correct ? "yes" : "no" },
    });
    const rows = () => query("select * from learning_v2_review_state order by objective_key");
    async function answer(key: string, correct = true) {
      const attempt = await create(key);
      const request = input(attempt.attemptId, key, 1, correct);
      const result = await left.respond(request);
      expect(result.status).toBe("success");
      return { result, request };
    }
    async function overlap<T>(startLeft: () => Promise<T>, startRight: () => Promise<T>): Promise<[T, T]> {
      const blocker = await control!.connect();
      let pending: Promise<[T, T]> | undefined;
      let released = false;
      try {
        await blocker.query("begin");
        await blocker.query("select id from auth_users where id=$1 for update", [v2Id(1)]);
        pending = Promise.all([startLeft(), startRight()]);
        void pending.catch(() => {});
        const deadline = Date.now() + 5000;
        let waiting = false;
        while (Date.now() < deadline) {
          const sessions = await control!.query(`select pid from pg_stat_activity
            where application_name in ('koraz-t018-left','koraz-t018-right')
              and wait_event_type='Lock' and cardinality(pg_blocking_pids(pid)) > 0`);
          if (sessions.rows.length === 2 && sessions.rows[0].pid !== sessions.rows[1].pid) { waiting = true; break; }
          await delay(10);
        }
        expect(waiting, "both independent PostgreSQL connections must contend").toBe(true);
        await blocker.query("commit");
        released = true;
        return await pending;
      } finally {
        if (!released) await blocker.query("rollback");
        blocker.release();
        if (pending) await Promise.allSettled([pending]);
      }
    }

    it("diagnosis/reading create no debt; assisted and self-reported answers do not extend stability", async () => {
      const diagnosis = await create("diagnosis", "assessment");
      expect((await left.respond(input(diagnosis.attemptId, "recall-a", 1, false))).status).toBe("success");
      const study = await create("explain");
      expect((await left.respond({ ...input(study.attemptId, "explain"), answer: { kind: "study", acknowledged: true } })).status).toBe("success");
      expect(await rows()).toHaveLength(0);
      const assisted = await create("recall-b");
      expect((await left.help({ userId: v2Id(1), attemptId: assisted.attemptId, idempotencyKey: v2Id(serial++),
        activityKey: "recall-b", kind: "hint", expectedVersion: 1 })).status).toBe("success");
      expect((await left.respond(input(assisted.attemptId, "recall-b", 2))).status).toBe("success");
      expect((await rows())[0]).toMatchObject({ stage: 0, last_extended_at: null, due_at: new Date(at(1)) });
      const self = await create("self");
      const pending = await left.respond({ ...input(self.attemptId, "self"),
        answer: { kind: "constructed_response", text: "A causa B", selfRating: null } });
      expect(pending).toMatchObject({ status: "success", value: { accepted: false } });
      expect((await left.help({ userId: v2Id(1), attemptId: self.attemptId, idempotencyKey: v2Id(serial++),
        activityKey: "self", kind: "reveal", expectedVersion: 2 })).status).toBe("success");
      expect((await left.respond({ ...input(self.attemptId, "self", 3),
        answer: { kind: "constructed_response", text: "A causa B", selfRating: "again" } })).status).toBe("success");
      expect((await rows())[0]).toMatchObject({ stage: 0, lapses: 1, last_extended_at: null, due_at: new Date(at(0, 1 / 6)) });
    });
    it("partial objective correctness schedules one day without adding a lapse or mastery", async () => {
      const attempt = await create("partial");
      expect((await left.respond({ ...input(attempt.attemptId, "partial"),
        answer: { kind: "match", pairs: { a: "x", b: "x" } } })).status).toBe("success");
      expect((await rows())[0]).toMatchObject({ stage: 0, lapses: 0, last_extended_at: null, due_at: new Date(at(1)) });
      expect(await left.readEvidence({ userId: v2Id(1), enrollmentId: v2Id(8) })).toMatchObject({
        status: "success", value: { objectives: [{ mastered: false }] },
      });
    });

    it("creates one debt before route completion, replays receipts and repairs caches without extending", async () => {
      const first = await answer("recall-a");
      expect(await rows()).toHaveLength(1);
      const before = (await rows())[0]!;
      expect(before).toMatchObject({ stage: 1, lapses: 0, due_at: new Date(at(1)) });
      expect(await left.respond(first.request)).toEqual(first.result);
      await left.respond({ ...first.request, idempotencyKey: v2Id(serial++) });
      await answer("recall-b");
      expect((await rows())[0]).toMatchObject({ stage: 1, due_at: before.due_at });
      const stable = await rows();
      await left.readEvidence({ userId: v2Id(1), enrollmentId: v2Id(8) });
      expect(await rows()).toEqual(stable);
      await query("update learning_v2_review_state set stage=4,lapses=50,due_at='2000-01-01' where user_id=$1", [v2Id(1)]);
      await left.readEvidence({ userId: v2Id(1), enrollmentId: v2Id(8) });
      expect((await rows())[0]).toMatchObject({ stage: 1, lapses: 0, due_at: new Date(at(1)) });
      expect(await left.readEvidence({ userId: v2Id(1), enrollmentId: v2Id(8) })).toMatchObject({ status: "success", value: { route: { completed: false } } });
    });

    it("same session has two immediate retries, then one day; success cannot erase reinforcement", async () => {
      const batch = await create("batch", "assessment");
      for (let n = 0; n < 3; n++) {
        const r = await left.respond(input(batch.attemptId, ["recall-a", "recall-b", "recall-c"][n]!, n + 1, false));
        expect(r.status).toBe("success");
        expect((await rows())[0]).toMatchObject({ stage: 0, lapses: n + 1,
          due_at: new Date(at(n < 2 ? 0 : 1, n < 2 ? 1 / 6 : 0)) });
      }
      expect((await left.respond(input(batch.attemptId, "recall-d", 4))).status).toBe("success");
      expect((await rows())[0]).toMatchObject({ stage: 0, lapses: 3, due_at: new Date(at(1)) });
    });

    it("persists first mastery dates and deferred measurements; absence does not mutate agenda", async () => {
      await answer("recall-a");
      await answer("recall-b");
      await answer("apply");
      expect((await rows())[0]).toMatchObject({ retention7_due_at: new Date(at(7)), retention30_due_at: new Date(at(30)) });
      const before = await rows();
      clock = new Date(at(28));
      await left.readEvidence({ userId: v2Id(1), enrollmentId: v2Id(8) });
      expect(await rows()).toEqual(before);
      const seven = await create("seven-test", "assessment");
      expect((await left.respond(input(seven.attemptId, "retention-seven", 1, false))).status).toBe("success");
      expect((await rows())[0]).toMatchObject({ retention7_accepted_at: new Date(at(28)),
        retention30_due_at: new Date(at(35)), stage: 0, lapses: 1, due_at: new Date(at(28, 1 / 6)) });
      clock = new Date(at(35));
      const thirty = await create("thirty-test", "assessment");
      expect((await left.respond(input(thirty.attemptId, "retention-thirty"))).status).toBe("success");
      expect((await rows())[0]).toMatchObject({ retention30_accepted_at: new Date(at(35)) });
    });

    it("agenda write failure rolls back response, receipt, event, evidence and attempt version", async () => {
      const attempt = await create("recall-a");
      const request = input(attempt.attemptId, "recall-a");
      const evidenceBefore = await query("select * from learning_v2_objective_state");
      await query("create function t018_reject() returns trigger language plpgsql as $$ begin raise exception 't018_atomicity'; end $$;");
      await query("create trigger t018_reject before insert on learning_v2_review_state for each row execute function t018_reject()");
      try { await expect(left.respond(request)).rejects.toThrow("t018_atomicity"); }
      finally {
        await query("drop trigger t018_reject on learning_v2_review_state");
        await query("drop function t018_reject()");
      }
      expect(await rows()).toHaveLength(0);
      expect(await query("select id from learning_v2_responses")).toHaveLength(0);
      expect(await query("select * from learning_v2_objective_state")).toEqual(evidenceBefore);
      expect(await query("select idempotency_key from learning_mutation_receipts where idempotency_key=$1", [request.idempotencyKey])).toHaveLength(0);
      expect(await query("select id from learning_events where event_type='response_accepted'")).toHaveLength(0);
      expect(await left.read({ userId: v2Id(1), attemptId: attempt.attemptId })).toMatchObject({ status: "success", value: { rowVersion: 1 } });
    });

    it.skipIf(backend !== "postgres")("independent devices cannot extend twice at the exact 24h boundary", async () => {
      await answer("recall-a");
      const a = await create("recall-b");
      const b = await create("recall-c");
      clock = new Date(at(1));
      const results = await overlap(() => left.respond(input(a.attemptId, "recall-b")), () => right.respond(input(b.attemptId, "recall-c")));
      expect(results.map((r) => r.status)).toEqual(["success", "success"]);
      expect(await rows()).toHaveLength(1);
      expect((await rows())[0]).toMatchObject({ stage: 2, due_at: new Date(at(4)), last_extended_at: new Date(at(1)) });
    });
    it.skipIf(backend !== "postgres")("concurrent failure/correct responses leave reinforcement and one lapse", async () => {
      const a = await create("recall-a");
      const b = await create("recall-b");
      const wrong = input(a.attemptId, "recall-a", 1, false);
      const results = await overlap(() => left.respond(wrong), () => right.respond(input(b.attemptId, "recall-b")));
      expect(results.map((r) => r.status)).toEqual(["success", "success"]);
      expect((await rows())[0]).toMatchObject({ stage: 0, lapses: 1, due_at: new Date(at(0, 1 / 6)) });
      await overlap(() => left.respond(wrong), () => right.respond(wrong));
      expect((await rows())[0]).toMatchObject({ stage: 0, lapses: 1, due_at: new Date(at(0, 1 / 6)) });
    });
  });
}


