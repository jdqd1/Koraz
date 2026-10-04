import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import Fastify from "fastify";
import {
  Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler,
  type CompiledQuery, type DatabaseConnection, type QueryResult,
} from "kysely";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  RoutePackageSchema, validateRoutePackage, type ContentProvider, type IdentityProvider,
  type RouteActivity, type RoutePackage,
} from "@cediah/contracts";
import type { CediahDatabase } from "../src/db/database.js";
import { registerGuidedV2EditorImportRoutes } from "../src/guided-learning/v2/editor-routes.js";
import { registerGuidedLearningEditorRoutes } from "../src/guided-learning/editor-routes.js";
import { registerGuidedLearningRoutes } from "../src/guided-learning/routes.js";
import { hashLearningSnapshot } from "../src/guided-learning/snapshot-hash.js";
import { createPostgresGuidedLearningV2Provider } from "../src/providers/postgres-guided-learning-v2.js";
import { createPostgresGuidedLearningProvider } from "../src/providers/postgres-guided-learning.js";
import { createPostgresLearningMapProvider } from "../src/providers/postgres-learning-map.js";

const migrationDirectory = new URL("../../../database/migrations/", import.meta.url);
const id = (last: number) => `74000000-0000-4000-8000-${String(last).padStart(12, "0")}`;
const snapshot = { projection: "guide", content: { sections: [{ title: "Intro", text: "Contenido sintético" }] } };
const digest = hashLearningSnapshot(snapshot);
const rationale = "Umbral editorial inicial de producto para este objetivo sintético.";
const bindings = { topicContentId: id(4), sources: [{ key: "guide", sourceContentId: id(5), resourceRevisionId: id(7) }], assets: [] };

async function testDatabase() {
  const pg = new PGlite();
  await pg.exec("create role cediah_runtime; create role anon; create role authenticated");
  const files = (await readdir(migrationDirectory))
    .filter((file) => /^\d+_[a-z0-9_]+\.sql$/.test(file) && file.localeCompare("0034_guided_v2_editor_audit.sql") <= 0)
    .sort((a, b) => a.localeCompare(b));
  for (const file of files) {
    if (file === "0005_restore_legacy_content.sql") continue;
    await pg.exec(`begin;\n${await readFile(new URL(file, migrationDirectory), "utf8")}\ncommit;`);
  }
  const connection: DatabaseConnection = {
    async executeQuery<R>(query: CompiledQuery): Promise<QueryResult<R>> {
      const result = await pg.query<R>(query.sql, [...query.parameters]);
      return { rows: result.rows, numAffectedRows: BigInt(result.affectedRows ?? 0) };
    },
    async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> { yield { rows: [] }; },
  };
  const database = new Kysely<CediahDatabase>({ dialect: {
    createAdapter: () => new PostgresAdapter(),
    createIntrospector: (db) => new PostgresIntrospector(db),
    createQueryCompiler: () => new PostgresQueryCompiler(),
    createDriver: () => ({
      acquireConnection: async () => connection,
      beginTransaction: async () => { await pg.exec("begin"); },
      commitTransaction: async () => { await pg.exec("commit"); },
      destroy: async () => {}, init: async () => {}, releaseConnection: async () => {},
      rollbackTransaction: async () => { await pg.exec("rollback"); },
    }),
  } });
  return { pg, database };
}

async function seed(pg: PGlite) {
  await pg.exec(`insert into public.auth_users (id,name,email) values
    ('${id(1)}','Creator','creator-workflow@example.test'),
    ('${id(2)}','Reviewer','reviewer-workflow@example.test'),
    ('${id(3)}','Other','other-workflow@example.test');
    insert into public.content_items (id,kind,slug,title,summary,topic,author_user_id,status,published_at,published_by)
      values ('${id(4)}','topic','workflow-topic','Tema','Tema','Tema','${id(1)}','published',now(),'${id(1)}'),
      ('${id(5)}','guide','workflow-guide','Guía','Guía','Tema','${id(1)}','published',now(),'${id(1)}');
    insert into public.learning_resources (id,source_content_id,projection,adapter_key)
      values ('${id(6)}','${id(5)}','guide','guide-adapter');`);
  await pg.query(`insert into public.learning_resource_revisions
    (id,resource_id,revision_number,source_version,adapter_version,schema_version,payload_json,payload_hash)
    values ($1,$2,1,1,1,1,$3,$4)`, [id(7), id(6), JSON.stringify(snapshot), digest]);
}

function fixture(number: number): RoutePackage {
  const base = (key: string, phase: RouteActivity["phase"], use: RouteActivity["use"], representation: RouteActivity["representation"] = "text") => ({
    key, objectiveKey: "objective", relatedObjectiveKeys: [], phase, kind: "single_choice" as const,
    required: true, sourceKeys: ["guide"], representation, equivalenceKey: key, hints: [], use,
    prompt: `Pregunta ${key}`, payload: { options: [{ key: "yes", text: "Sí" }, { key: "no", text: "No" }], correctKey: "yes", distractorFeedback: { no: "Revisa" } },
    feedback: { explanation: "Explicación", commonError: "", sourceKeys: ["guide"] },
    misconceptionMappings: [], alternativeActivityKey: null,
  });
  const activities: RouteActivity[] = [
    { ...base("explain", "learn", "learning"), kind: "study", payload: { body: "Explicación sintética", focusSpans: [], assetKey: null, scaffold: "explanation", videoRange: null } },
    { ...base("elaborate", "elaborate", "learning"), kind: "constructed_response", payload: { rubric: [{ key: "criterion", criterion: "Relaciona", example: "Ejemplo" }], modelAnswer: "Respuesta modelo", verificationActivityKey: "recall-one" } },
    base("recall-one", "retrieve", "learning"),
    { ...base("recall-two", "retrieve", "learning"), kind: "short_answer", payload: { acceptedAnswers: ["respuesta"], maxChars: 100, modelAnswer: "respuesta", normalization: "nfkc-lower-space" } },
    base("apply-one", "apply", "learning", "case"),
    base("recall-three", "retrieve", "gate"),
    { ...base("apply-two", "apply", "gate", "diagram"), kind: "sequence", payload: { items: [{ key: "one", text: "Uno" }, { key: "two", text: "Dos" }, { key: "three", text: "Tres" }], acceptedOrders: [["one", "two", "three"]], whyActivityKey: null } },
    base("diagnostic-one", "activate", "diagnostic"), base("final-one", "retrieve", "final"),
    base("retention-seven", "retrieve", "retention7"), base("retention-thirty", "retrieve", "retention30"),
  ];
  const assessment = (key: string, kind: RoutePackage["assessments"][number]["kind"], candidateActivityKeys: string[], afterUnitKey: string | null = null) =>
    ({ key, kind, afterUnitKey, objectiveKeys: ["objective"], candidateActivityKeys, thresholdPercent: 80, thresholdRationale: rationale });
  return RoutePackageSchema.parse({
    schemaVersion: "2.0", packageKey: `workflow-${number}`, revision: 1, locale: "es",
    route: { slug: `workflow-${number}`, title: "Ruta sintética", summary: "Sin contenido clínico real", topicLabel: "Tema", audience: "Alumno", discipline: "general", coverKey: "heart" },
    policyVersion: "guided-v2.0",
    sources: [{ key: "guide", kind: "guide", title: "Guía sintética", citation: "Guía de prueba (2026)", locator: { heading: "Sección", sectionPath: ["Unidad"], page: 1 }, documentSha256: digest, excerpt: "Texto sintético verificable", url: null, verification: "verified", checkedAt: "2026-09-26" }],
    assets: [],
    objectives: [{ key: "objective", title: "Aplicar un concepto", unitKey: "unit", verb: "apply", criticality: "core", required: true, prerequisiteKeys: [], sourceKeys: ["guide"], comparisonGroup: null, misconceptions: [] }],
    units: [{ key: "unit", title: "Unidad", objectiveKeys: ["objective"], activityKeys: activities.map((activity) => activity.key), support: "standard", estimatedMinutes: null }],
    activities,
    assessments: [
      assessment("diagnostic", "diagnostic", ["diagnostic-one"]),
      assessment("gate", "unit_gate", ["recall-one", "recall-two", "apply-one", "recall-three", "apply-two"], "unit"),
      assessment("final", "final", ["final-one"]), assessment("retention7", "retention7", ["retention-seven"]),
      assessment("retention30", "retention30", ["retention-thirty"]),
    ],
    reviewPlan: { objectiveKeys: ["objective"] }, editorial: { notes: "Revisión sintética", unresolvedIssues: [] },
  });
}

describe("guided v2 editorial workflow and v1 guards", () => {
  let pg: PGlite;
  let database: Kysely<CediahDatabase>;
  let provider: ReturnType<typeof createPostgresGuidedLearningV2Provider>;
  let number = 0;
  beforeAll(async () => {
    ({ pg, database } = await testDatabase());
    await seed(pg);
    provider = createPostgresGuidedLearningV2Provider(database);
  }, 120_000);
  afterAll(async () => { await database?.destroy(); await pg?.close(); });

  const create = async () => {
    const pkg = fixture(++number);
    expect(validateRoutePackage(pkg).publishable).toBe(true);
    const result = await provider.createDraft({ actorUserId: id(1), canCreate: true, package: pkg, bindings });
    expect(result.status).toBe("success");
    if (result.status !== "success") throw new Error(JSON.stringify(result));
    return result.value;
  };
  const transition = (pathId: string, expectedVersion: number, status: "in_review" | "changes_requested" | "approved" | "published" | "archived", actorUserId = id(2), canReview = true, canPublish = true) =>
    provider.transitionPath({ actorUserId, canEdit: true, canEditAll: canReview, canReview, canPublish, pathId, expectedVersion, status, reviewNote: "Revisión de prueba" });

  it("S01 binds approval to the current hash, rejects a second editor's stale publication and preserves the published matrix", async () => {
    const draft = await create();
    const beforeReview = await provider.validatePath({ actorUserId: id(1), canEdit: true, canEditAll: false, canPublish: false, pathId: draft.pathId, expectedVersion: 1 });
    expect(beforeReview).toMatchObject({ status: "success", value: { ready: false } });
    if (beforeReview.status === "success") expect(beforeReview.value.issues.some((issue) => issue.code === "REVIEW_STALE")).toBe(true);
    const review = await transition(draft.pathId, 1, "in_review", id(1), false, false);
    expect(review).toMatchObject({ status: "success", value: { status: "in_review", editVersion: 2 } });
    expect(await transition(draft.pathId, 2, "approved", id(1), false, false)).toEqual({ status: "forbidden" });
    const approved = await transition(draft.pathId, 2, "approved");
    expect(approved).toMatchObject({ status: "success", value: { status: "approved", editVersion: 3, approvedBy: id(2) } });
    if (approved.status !== "success") return;
    expect(approved.value.reviewedContentHash).toBe(draft.contentHash);
    expect(await transition(draft.pathId, 2, "published")).toEqual({ status: "version_conflict" });
    const published = await transition(draft.pathId, 3, "published");
    expect(published).toMatchObject({ status: "success", value: { status: "published", editVersion: 4 } });
    const newVersion = await provider.createVersion({ actorUserId: id(1), canEdit: true, canEditAll: false, pathId: draft.pathId, expectedVersion: 4, releaseNotes: "Nueva edición" });
    expect(newVersion).toMatchObject({ status: "success", value: { status: "draft", editVersion: 1 } });
    if (newVersion.status !== "success") return;
    expect(newVersion.value.pathVersionId).not.toBe(draft.pathVersionId);
    const old = await pg.query<{ status: string; definition_v2_json: RoutePackage }>(
      "select status,definition_v2_json from public.learning_path_versions where id=$1", [draft.pathVersionId]);
    expect(old.rows[0]).toMatchObject({ status: "published", definition_v2_json: draft.definition });
    const path = await pg.query<{ published_version_id: string }>("select published_version_id from public.learning_paths where id=$1", [draft.pathId]);
    expect(path.rows[0]?.published_version_id).toBe(draft.pathVersionId);
    const next = await provider.getEditorPath({ actorUserId: id(1), canEdit: true, canEditAll: false, pathId: draft.pathId });
    expect(next).toMatchObject({ status: "success", value: { status: "draft", approvedBy: null, reviewedContentHash: null } });
  }, 60_000);

  it("S01 revalidates catalog revisions inside publication and blocks a changed guide", async () => {
    const draft = await create();
    expect((await transition(draft.pathId, 1, "in_review", id(1), false, false)).status).toBe("success");
    expect((await transition(draft.pathId, 2, "approved")).status).toBe("success");
    await pg.query("update public.learning_resources set retired_at=now() where id=$1", [id(6)]);
    try {
      const attempt = await transition(draft.pathId, 3, "published");
      expect(attempt.status).toBe("invalid");
      if (attempt.status === "invalid") expect(attempt.issues.some((issue) => issue.code === "SOURCE_UNRESOLVED")).toBe(true);
      expect((await pg.query<{ status: string }>("select status from public.learning_path_versions where id=$1", [draft.pathVersionId])).rows[0]?.status).toBe("approved");
    } finally {
      await pg.query("update public.learning_resources set retired_at=null where id=$1", [id(6)]);
    }
  }, 60_000);

  it("M02 invalidates review after requested changes and never edits an approved version", async () => {
    const draft = await create();
    expect((await transition(draft.pathId, 1, "in_review", id(1), false, false)).status).toBe("success");
    expect((await transition(draft.pathId, 2, "changes_requested")).status).toBe("success");
    const changed = structuredClone(draft.definition);
    changed.revision = 2;
    changed.route.summary = "Resumen corregido";
    const saved = await provider.saveDraft({ actorUserId: id(1), canEdit: true, canEditAll: false,
      pathId: draft.pathId, expectedVersion: 3, package: changed, bindings });
    expect(saved).toMatchObject({ status: "success", value: { status: "draft", editVersion: 4,
      reviewedContentHash: null, approvedBy: null } });
    expect((await transition(draft.pathId, 4, "in_review", id(1), false, false)).status).toBe("success");
    expect((await transition(draft.pathId, 5, "approved")).status).toBe("success");
    expect(await provider.saveDraft({ actorUserId: id(1), canEdit: true, canEditAll: false,
      pathId: draft.pathId, expectedVersion: 6, package: changed, bindings })).toEqual({ status: "conflict" });
    expect((await transition(draft.pathId, 5, "published")).status).toBe("version_conflict");
  }, 60_000);

  it("S08 rejects v1 mutations on v2, preserves enrollments and offers archival", async () => {
    const draft = await create();
    expect((await transition(draft.pathId, 1, "in_review", id(1), false, false)).status).toBe("success");
    expect((await transition(draft.pathId, 2, "approved")).status).toBe("success");
    expect((await transition(draft.pathId, 3, "published")).status).toBe("success");
    await pg.exec(`begin;
      insert into public.learning_enrollments (id,user_id,path_id,path_version_id)
        values ('${id(20)}','${id(3)}','${draft.pathId}','${draft.pathVersionId}');
      insert into public.learning_enrollment_versions (enrollment_id,path_id,path_version_id)
        values ('${id(20)}','${draft.pathId}','${draft.pathVersionId}');
      commit;`);
    const v1 = createPostgresGuidedLearningProvider(database);
    expect(await v1.deletePath({ actorUserId: id(1), canEditAll: false, pathId: draft.pathId, expectedVersion: 4 }))
      .toMatchObject({ status: "conflict", reason: "engine_version_mismatch" });
    expect(await v1.createVersion({ actorUserId: id(1), canEditAll: false, pathId: draft.pathId, releaseNotes: "No" }))
      .toMatchObject({ status: "conflict", reason: "engine_version_mismatch" });
    expect(await v1.getEditorPath({ actorUserId: id(1), canEditAll: false, pathId: draft.pathId }))
      .toMatchObject({ status: "conflict", reason: "engine_version_mismatch" });
    expect(await v1.validatePath({ actorUserId: id(1), canEditAll: false, pathId: draft.pathId, expectedVersion: 4 }))
      .toMatchObject({ status: "conflict", reason: "engine_version_mismatch" });
    expect(await v1.createEnrollment({ userId: id(2), pathId: draft.pathId }))
      .toMatchObject({ status: "conflict", reason: "engine_version_mismatch" });
    expect(await v1.getPathBySlug({ userId: id(2), slug: draft.definition.route.slug })).toBeNull();
    const app = Fastify();
    const identityProvider = { getUser: async () => ({ id: id(2) }) } as unknown as IdentityProvider;
    await registerGuidedLearningRoutes(app, { identityProvider, provider: v1 });
    try {
      const response = await app.inject({ method: "POST", url: "/v1/guided-learning/enrollments",
        headers: { authorization: "Bearer test" }, payload: { pathId: draft.pathId } });
      expect(response.statusCode).toBe(409);
      expect(response.json()).toEqual({ error: "engine_version_mismatch" });
    } finally { await app.close(); }
    const enrollments = await pg.query<{ n: number }>("select count(*)::int as n from public.learning_enrollments where path_id=$1", [draft.pathId]);
    expect(enrollments.rows[0]?.n).toBe(1);
    expect((await transition(draft.pathId, 4, "archived")).status).toBe("success");
    expect((await pg.query<{ archived_at: Date | null }>("select archived_at from public.learning_paths where id=$1", [draft.pathId])).rows[0]?.archived_at).not.toBeNull();
  }, 60_000);

  it("S08 projects a v2 map block without crediting v1 learning progress", async () => {
    const draft = await create();
    expect((await transition(draft.pathId, 1, "in_review", id(1), false, false)).status).toBe("success");
    expect((await transition(draft.pathId, 2, "approved")).status).toBe("success");
    expect((await transition(draft.pathId, 3, "published")).status).toBe("success");
    const map = createPostgresLearningMapProvider(database);
    const userId = id(3);
    const ensure = await map.mutate({ operation: "ensure", request: {}, userId, idempotencyKey: crypto.randomUUID() });
    expect(ensure.status).toBe("success");
    if (ensure.status !== "success") return;
    const node = await map.mutate({ operation: "nodes", request: {
      expectedVersion: ensure.value.structuralVersion, title: "Nodo sintético", iconKey: "heart", items: [],
    }, userId, idempotencyKey: crypto.randomUUID() });
    expect(node.status).toBe("success");
    if (node.status !== "success") return;
    const grouping = await map.mutate({ operation: "complete-block", request: {
      expectedVersion: node.value.structuralVersion, nodeId: node.value.changedIds[0]!, pathId: draft.pathId,
    }, userId, idempotencyKey: crypto.randomUUID() });
    expect(grouping.status).toBe("success");
    const after = await map.summary(userId);
    expect(after.progress.completedEssentialSteps ?? 0).toBe(0);
    expect((await pg.query<{ n: number }>("select count(*)::int as n from public.learning_step_progress where enrollment_id in (select id from public.learning_enrollments where user_id=$1)", [userId])).rows[0]?.n).toBe(0);
    expect((await pg.query<{ n: number }>("select count(*)::int as n from public.learning_enrollments where user_id=$1 and path_id=$2", [userId, draft.pathId])).rows[0]?.n).toBe(0);
  }, 60_000);

  it("M02 resolves roles on the server and returns explicit v1 engine mismatch", async () => {
    const draft = await create();
    const app = Fastify();
    let actor = id(1);
    let roles: Array<"content_creator" | "coordinator"> = ["content_creator"];
    const identityProvider = { getUser: async () => ({ id: actor }) } as unknown as IdentityProvider;
    const contentProvider = { getRoles: async () => roles } as unknown as ContentProvider;
    await registerGuidedV2EditorImportRoutes(app, { identityProvider, contentProvider, provider });
    await registerGuidedLearningEditorRoutes(app, { identityProvider, contentProvider, provider: createPostgresGuidedLearningProvider(database) });
    try {
      const url = `/v2/editor/learning-paths/${draft.pathId}/transition`;
      const headers = { authorization: "Bearer test", "idempotency-key": crypto.randomUUID() };
      const noKey = await app.inject({ method: "POST", url, headers: { authorization: "Bearer test" }, payload: { status: "in_review", expectedVersion: 1, reviewNote: "" } });
      expect(noKey.statusCode).toBe(400);
      const spoofed = await app.inject({ method: "POST", url, headers, payload: { status: "approved", expectedVersion: 1, reviewNote: "", actorUserId: id(2), canReview: true } });
      expect(spoofed.statusCode).toBe(400);
      const v1Delete = await app.inject({ method: "DELETE", url: `/v1/editor/learning-paths/${draft.pathId}`, headers: { authorization: "Bearer test" }, payload: { expectedVersion: 1 } });
      expect(v1Delete.statusCode).toBe(409);
      expect(v1Delete.json()).toEqual({ error: "engine_version_mismatch" });
      actor = id(3);
      roles = ["content_creator"];
      const outsider = await app.inject({ method: "POST", url, headers, payload: { status: "in_review", expectedVersion: 1, reviewNote: "" } });
      expect(outsider.statusCode).toBe(404);
    } finally { await app.close(); }
  }, 60_000);
});
