import { Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler,
  type CompiledQuery, type DatabaseConnection, type QueryResult } from "kysely";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { RoutePackageSchema } from "@cediah/contracts";
import type { PGlite } from "@electric-sql/pglite";
import type { CediahDatabase } from "../src/db/database.js";
import { createPostgresGuidedV2AttemptService } from "../src/providers/postgres-guided-learning-v2.js";
import { createGuidedV2Database, seedGuidedV2Runtime, v2Id } from "./helpers/guided-v2-db.js";

const userId = v2Id(1);
const enrollmentId = v2Id(8);
const versionId = v2Id(6);
const assetId = v2Id(10);
const id = (last: number) => v2Id(100 + last);

const base = {
  objectiveKey: "objective", relatedObjectiveKeys: [], phase: "retrieve", required: true,
  sourceKeys: [], representation: "text", equivalenceKey: "family", hints: ["Piensa en la relación."],
  use: "learning", prompt: "Pregunta sintética", feedback: {
    explanation: "Explicación posterior", commonError: "Revisa la relación", sourceKeys: [],
  }, misconceptionMappings: [], alternativeActivityKey: null,
};

const definition = RoutePackageSchema.parse({
  schemaVersion: "2.0", packageKey: "runtime", revision: 1, locale: "es",
  route: { slug: "runtime-route", title: "Ruta sintética", summary: "Prueba", topicLabel: "Tema",
    audience: "Alumno", discipline: "general", coverKey: "heart" },
  policyVersion: "guided-v2.0", sources: [],
  assets: [{ key: "diagram", mediaType: "image", originalFileName: "diagram.png", sha256: null,
    alt: "Diagrama", caption: "", sourceKeys: [], rightsStatus: "owned", credit: "",
    width: 100, height: 100 }],
  objectives: [{ key: "objective", title: "Objetivo", unitKey: "unit", verb: "recall", criticality: "core",
    required: true, prerequisiteKeys: [], sourceKeys: [], comparisonGroup: null, misconceptions: [] }],
  units: [{ key: "unit", title: "Unidad", objectiveKeys: ["objective"],
    activityKeys: ["choice", "short", "constructed", "case-wrapper"], support: "full", estimatedMinutes: 10 }],
  activities: [
    { ...base, key: "choice", kind: "single_choice", payload: {
      options: [{ key: "yes", text: "Sí" }, { key: "no", text: "No" }], correctKey: "yes",
      distractorFeedback: { no: "No es esa relación." },
    } },
    { ...base, key: "short", kind: "short_answer", equivalenceKey: "second-family", payload: {
      acceptedAnswers: ["15 mg"], maxChars: 80, modelAnswer: "15 mg", normalization: "nfkc-lower-space",
    } },
    { ...base, key: "constructed", kind: "constructed_response", equivalenceKey: "third-family", payload: {
      rubric: [{ key: "reason", criterion: "Explica la relación", example: "A causa B" }],
      modelAnswer: "A causa B", verificationActivityKey: "choice",
    } },
    { ...base, key: "case-wrapper", kind: "case", representation: "case", equivalenceKey: "case-family",
      payload: { stages: [
        { key: "first", narrative: "Etapa uno", childActivityKey: "choice" },
        { key: "second", narrative: "Etapa dos privada", childActivityKey: "short" },
      ] } },
  ],
  assessments: [
    { key: "check", kind: "checkpoint", afterUnitKey: "unit", objectiveKeys: ["objective"],
      candidateActivityKeys: ["choice", "short"], thresholdPercent: 80,
      thresholdRationale: "Umbral definido para esta comprobación sintética de persistencia." },
    { key: "mixed", kind: "checkpoint", afterUnitKey: "unit", objectiveKeys: ["objective"],
      candidateActivityKeys: ["case-wrapper", "constructed"], thresholdPercent: 80,
      thresholdRationale: "Umbral definido para este caso y comprobación sintética." },
  ],
  reviewPlan: { objectiveKeys: [] }, editorial: { notes: "", unresolvedIssues: [] },
});

function databaseFor(pg: PGlite): Kysely<CediahDatabase> {
  const connection: DatabaseConnection = {
    async executeQuery<R>(query: CompiledQuery): Promise<QueryResult<R>> {
      const result = await pg.query<R>(query.sql, [...query.parameters]);
      return { rows: result.rows, numAffectedRows: BigInt(result.affectedRows ?? 0) };
    },
    async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> { yield { rows: [] }; },
  };
  return new Kysely<CediahDatabase>({ dialect: {
    createAdapter: () => new PostgresAdapter(), createIntrospector: (db) => new PostgresIntrospector(db),
    createQueryCompiler: () => new PostgresQueryCompiler(),
    createDriver: () => ({ acquireConnection: async () => connection,
      beginTransaction: async () => { await pg.exec("begin"); },
      commitTransaction: async () => { await pg.exec("commit"); },
      rollbackTransaction: async () => { await pg.exec("rollback"); },
      destroy: async () => {}, init: async () => {}, releaseConnection: async () => {},
    }),
  } });
}

describe("guided v2 attempt persistence", () => {
  let pg: PGlite;
  let database: Kysely<CediahDatabase>;
  let service: ReturnType<typeof createPostgresGuidedV2AttemptService>;

  beforeAll(async () => {
    pg = await createGuidedV2Database();
    await seedGuidedV2Runtime(pg);
    await pg.query("update public.content_items set status = 'published', catalog_visibility = 'catalog', published_at = now(), published_by = $2 where id = $1", [v2Id(3), userId]);
    await pg.query(`insert into public.content_assets
      (id,content_item_id,owner_user_id,kind,storage_bucket,storage_path,original_file_name,mime_type,size_bytes,status,finalized_at)
      values ($1,$2,$3,'image','test-assets','v2-diagram','diagram.png','image/png',100,'ready',now())`,
    [assetId, v2Id(3), userId]);
    await pg.query("update public.learning_path_versions set definition_v2_json = $1::jsonb where id = $2",
      [JSON.stringify(definition), versionId]);
    await pg.query("insert into public.learning_v2_bindings (path_version_id,local_key,kind,topic_content_id) values ($1,'topic','topic',$2)",
      [versionId, v2Id(3)]);
    await pg.query(`insert into public.learning_v2_bindings
      (path_version_id,local_key,kind,asset_id,rights_status,rights_credit)
      values ($1,'diagram','asset',$2,'owned','')`, [versionId, assetId]);
    await pg.query("update public.learning_path_versions set status = 'published', published_at = now(), published_by = $2 where id = $1", [versionId, userId]);
    await pg.query("update public.learning_paths set published_version_id = $1 where id = $2", [versionId, v2Id(4)]);
    database = databaseFor(pg);
    service = createPostgresGuidedV2AttemptService(database, { now: () => new Date("2026-09-28T12:00:00Z") });
  }, 120000);
  beforeEach(async () => {
    await pg.query("delete from public.learning_events where policy_version = 'guided-v2.0'");
    await pg.query("delete from public.learning_mutation_receipts where user_id = $1", [userId]);
    await pg.query("delete from public.learning_v2_activity_state where user_id = $1", [userId]);
    await pg.query("delete from public.learning_v2_attempts where user_id = $1", [userId]);
    await pg.query("update public.content_assets set status = 'ready', finalized_at = now() where id = $1", [assetId]);
    await pg.query("update public.learning_enrollments set status = 'active', row_version = 1 where id = $1", [enrollmentId]);
  });
  afterAll(async () => { await database?.destroy(); await pg?.close(); });

  const create = (clientAttemptId: string, idempotencyKey: string, target: { kind: "activity" | "assessment" | "review"; key: string }) =>
    service.create({ userId, enrollmentId, clientAttemptId, idempotencyKey, target, expectedEnrollmentVersion: 1 });

  it("fixes a private snapshot and resumes the same stage without exposing future answers", async () => {
    const first = await create(id(1), id(2), { kind: "assessment", key: "check" });
    expect(first.status).toBe("success");
    if (first.status !== "success") return;
    expect(first.value.activeActivity).toMatchObject({ key: "choice", kind: "single_choice" });
    expect(JSON.stringify(first.value)).not.toContain("correctKey");
    expect(JSON.stringify(first.value)).not.toContain("15 mg");
    const again = await service.read({ userId, attemptId: first.value.attemptId });
    expect(again).toEqual(first);
    expect(await create(id(1), id(2), { kind: "assessment", key: "check" })).toEqual(first);
    expect(await create(id(1), id(2), { kind: "activity", key: "short" }))
      .toEqual({ status: "idempotency_conflict" });
    const privateRow = await pg.query<{ snapshot_json: { activities: unknown[] } }>(
      "select snapshot_json from public.learning_v2_attempts where id = $1", [first.value.attemptId]);
    expect(JSON.stringify(privateRow.rows[0]!.snapshot_json)).toContain("correctKey");
  });

  it("accepts each response once, blocks future answers, and commits completion with the receipt", async () => {
    const created = await create(id(3), id(4), { kind: "assessment", key: "check" });
    if (created.status !== "success") throw new Error("create failed");
    const attemptId = created.value.attemptId;
    const future = await service.respond({ userId, attemptId, idempotencyKey: id(5), activityKey: "short",
      answer: { kind: "short_answer", text: "15 mg" }, confidence: null, expectedVersion: 1 });
    expect(future).toEqual({ status: "conflict" });
    expect(await service.complete({ userId, attemptId, idempotencyKey: id(6), expectedVersion: 1 }))
      .toEqual({ status: "conflict" });
    const response = { userId, attemptId, idempotencyKey: id(7), activityKey: "choice",
      answer: { kind: "single_choice", optionKey: "yes" }, confidence: "sure" as const, expectedVersion: 1 };
    const accepted = await service.respond(response);
    expect(accepted).toMatchObject({ status: "success", value: { accepted: true, feedback: { score01: 1 },
      attempt: { rowVersion: 2, activeActivity: { key: "short" } } } });
    expect(await service.respond(response)).toEqual(accepted);
    expect(await service.respond({ ...response, idempotencyKey: id(8), answer: { kind: "single_choice", optionKey: "no" } }))
      .toEqual({ status: "conflict" });
    expect(await service.respond({ ...response, idempotencyKey: id(9), answer: response.answer, expectedVersion: 1 }))
      .toMatchObject({ status: "success", value: { accepted: true } });
    const short = await service.respond({ userId, attemptId, idempotencyKey: id(10), activityKey: "short",
      answer: { kind: "short_answer", text: "15 MG" }, confidence: null, expectedVersion: 2 });
    expect(short).toMatchObject({ status: "success", value: { accepted: true,
      attempt: { rowVersion: 3, activeActivity: null } } });
    const completed = await service.complete({ userId, attemptId, idempotencyKey: id(11), expectedVersion: 3 });
    expect(completed).toMatchObject({ status: "success", value: { status: "completed", rowVersion: 4 } });
    expect(await service.complete({ userId, attemptId, idempotencyKey: id(11), expectedVersion: 3 })).toEqual(completed);
    const persisted = await pg.query<{ responses: number; events: number; receipts: number }>(`
      select (select count(*)::int from public.learning_v2_responses where attempt_id = $1) as responses,
        (select count(*)::int from public.learning_events where payload_json->>'v2AttemptId' = $1::text) as events,
        (select count(*)::int from public.learning_mutation_receipts where user_id = $2) as receipts`,
    [attemptId, userId]);
    expect(persisted.rows[0]).toMatchObject({ responses: 2, events: 4 });
    expect(persisted.rows[0]!.receipts).toBeGreaterThanOrEqual(6);
  });

  it("persists help as assisted on the server and rejects stale expectedVersion", async () => {
    const created = await create(id(12), id(13), { kind: "activity", key: "choice" });
    if (created.status !== "success") throw new Error("create failed");
    const attemptId = created.value.attemptId;
    const help = await service.help({ userId, attemptId, idempotencyKey: id(14), activityKey: "choice",
      kind: "hint", expectedVersion: 1 });
    expect(help).toMatchObject({ status: "success", value: { help: { kind: "hint", text: "Piensa en la relación." },
      attempt: { rowVersion: 2 } } });
    expect(await service.respond({ userId, attemptId, idempotencyKey: id(15), activityKey: "choice",
      answer: { kind: "single_choice", optionKey: "yes" }, confidence: null, expectedVersion: 1 }))
      .toEqual({ status: "version_conflict" });
    expect(await service.respond({ userId, attemptId, idempotencyKey: id(16), activityKey: "choice",
      answer: { kind: "single_choice", optionKey: "yes" }, confidence: null, expectedVersion: 2 }))
      .toMatchObject({ status: "success", value: { accepted: true } });
    const stored = await pg.query<{ assisted: boolean; score01: number }>(
      "select assisted, score01 from public.learning_v2_responses where attempt_id = $1", [attemptId]);
    expect(stored.rows[0]).toMatchObject({ assisted: true, score01: 1 });
  });

  it("keeps constructed text pending until a persisted reveal and self-rating", async () => {
    const created = await create(id(24), id(25), { kind: "activity", key: "constructed" });
    if (created.status !== "success") throw new Error("create failed");
    const attemptId = created.value.attemptId;
    expect(JSON.stringify(created.value)).not.toContain("A causa B");
    const submission = await service.respond({ userId, attemptId, idempotencyKey: id(26), activityKey: "constructed",
      answer: { kind: "constructed_response", text: "B causa A", selfRating: null },
      confidence: null, expectedVersion: 1 });
    expect(submission).toMatchObject({ status: "success", value: { accepted: false,
      attempt: { rowVersion: 2, activeActivity: { key: "constructed" } } } });
    expect(await service.read({ userId, attemptId })).toMatchObject({ status: "success", value: {
      rowVersion: 2, activeActivity: { key: "constructed" } } });
    const reveal = await service.help({ userId, attemptId, idempotencyKey: id(27),
      activityKey: "constructed", kind: "reveal", expectedVersion: 2 });
    expect(reveal).toMatchObject({ status: "success", value: { help: { text: "A causa B" },
      attempt: { rowVersion: 3 } } });
    const accepted = await service.respond({ userId, attemptId, idempotencyKey: id(28),
      activityKey: "constructed", answer: { kind: "constructed_response", text: "B causa A", selfRating: "good" },
      confidence: null, expectedVersion: 3 });
    expect(accepted).toMatchObject({ status: "success", value: { accepted: true,
      feedback: { score01: null }, attempt: { rowVersion: 4, activeActivity: null } } });
    const stored = await pg.query<{ grading_source: string; assisted: boolean; score01: number | null }>(
      "select grading_source, assisted, score01 from public.learning_v2_responses where attempt_id = $1", [attemptId]);
    expect(stored.rows[0]).toMatchObject({ grading_source: "self", assisted: true, score01: null });
  });

  it("resumes a case at the next child without scoring its wrapper twice", async () => {
    const created = await create(id(17), id(18), { kind: "activity", key: "case-wrapper" });
    if (created.status !== "success") throw new Error("create failed");
    const attemptId = created.value.attemptId;
    expect(created.value.activeActivity).toMatchObject({ key: "choice", prompt: "Etapa uno\n\nPregunta sintética" });
    expect(JSON.stringify(created.value)).not.toContain("Etapa dos privada");
    const first = await service.respond({ userId, attemptId, idempotencyKey: id(19), activityKey: "choice",
      answer: { kind: "single_choice", optionKey: "yes" }, confidence: null, expectedVersion: 1 });
    expect(first).toMatchObject({ status: "success", value: { attempt: { activeActivity: {
      key: "short", prompt: "Etapa dos privada\n\nPregunta sintética" } } } });
    const resumed = await service.read({ userId, attemptId });
    expect(resumed).toMatchObject({ status: "success", value: { activeActivity: { key: "short" } } });
    expect(await service.respond({ userId, attemptId, idempotencyKey: id(20), activityKey: "choice",
      answer: { kind: "single_choice", optionKey: "no" }, confidence: null, expectedVersion: 2 }))
      .toEqual({ status: "conflict" });
    const rows = await pg.query<{ activity_key: string }>(
      "select activity_key from public.learning_v2_responses where attempt_id = $1", [attemptId]);
    expect(rows.rows.map((row) => row.activity_key)).toEqual(["choice"]);
  });

  it("keeps case completion separate within a longer assessment", async () => {
    const created = await create(id(29), id(30), { kind: "assessment", key: "mixed" });
    if (created.status !== "success") throw new Error("create failed");
    const attemptId = created.value.attemptId;
    expect(created.value.activeActivity).toMatchObject({ key: "choice" });
    await service.respond({ userId, attemptId, idempotencyKey: id(31), activityKey: "choice",
      answer: { kind: "single_choice", optionKey: "yes" }, confidence: null, expectedVersion: 1 });
    const second = await service.respond({ userId, attemptId, idempotencyKey: id(32), activityKey: "short",
      answer: { kind: "short_answer", text: "15 mg" }, confidence: null, expectedVersion: 2 });
    expect(second).toMatchObject({ status: "success", value: { attempt: { activeActivity: {
      key: "constructed" } } } });
    const states = await pg.query<{ activity_key: string }>(
      "select activity_key from public.learning_v2_activity_state where evidence_attempt_id = $1 order by activity_key", [attemptId]);
    expect(states.rows.map((row) => row.activity_key)).toEqual(["case-wrapper", "choice", "short"]);
  });

  it("pauses on withdrawn content without revealing the next item or creating progress", async () => {
    const created = await create(id(21), id(22), { kind: "assessment", key: "check" });
    if (created.status !== "success") throw new Error("create failed");
    const attemptId = created.value.attemptId;
    await pg.query("update public.content_assets set status = 'pending', finalized_at = null where id = $1", [assetId]);
    expect(await service.read({ userId, attemptId })).toEqual({ status: "access_revoked" });
    expect(await create(id(21), id(22), { kind: "assessment", key: "check" }))
      .toEqual({ status: "access_revoked" });
    expect(await service.respond({ userId, attemptId, idempotencyKey: id(23), activityKey: "choice",
      answer: { kind: "single_choice", optionKey: "yes" }, confidence: null, expectedVersion: 1 }))
      .toEqual({ status: "access_revoked" });
    const counts = await pg.query<{ responses: number; progress: number; status: string }>(`
      select (select count(*)::int from public.learning_v2_responses where attempt_id = $1) as responses,
        (select count(*)::int from public.learning_v2_activity_state where evidence_attempt_id = $1) as progress,
        status from public.learning_v2_attempts where id = $1`, [attemptId]);
    expect(counts.rows[0]).toMatchObject({ responses: 0, progress: 0, status: "paused" });
    await pg.query("update public.content_assets set status = 'ready', finalized_at = now() where id = $1", [assetId]);
    expect(await service.read({ userId, attemptId })).toMatchObject({ status: "success", value: {
      status: "open", activeActivity: { key: "choice" } } });
  });
});
