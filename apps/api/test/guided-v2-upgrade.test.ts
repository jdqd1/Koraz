import Fastify from "fastify";
import { Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler, type CompiledQuery, type DatabaseConnection, type QueryResult } from "kysely";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RoutePackageSchema, V2HttpContracts, type IdentityProvider, type RoutePackage, type ContentProvider } from "@cediah/contracts";
import type { PGlite } from "@electric-sql/pglite";
import type { CediahDatabase } from "../src/db/database.js";
import { createGuidedV2Database, seedGuidedV2Runtime, v2Id } from "./helpers/guided-v2-db.js";
import { createGuidedV2HttpProvider, registerGuidedV2Routes, type GuidedV2Flags } from "../src/guided-learning/v2/routes.js";
import { createPostgresGuidedV2AttemptService, createPostgresGuidedLearningV2Provider } from "../src/providers/postgres-guided-learning-v2.js";
import { transferableObjectiveKeys, convertGuidedV1 } from "../src/guided-learning/v2/upgrade.js";
import { planLearningEnrollmentUpgrade } from "../src/guided-learning/path-upgrade.js";
import { guidedV2PolicySnapshot } from "../src/guided-learning/v2/service.js";
import { registerGuidedV2EditorImportRoutes } from "../src/guided-learning/v2/editor-routes.js";
import { hashLearningSnapshot } from "../src/guided-learning/snapshot-hash.js";

function fixture(): RoutePackage {
  const choices = ["recall-a", "recall-b", "apply"].map((key, index) => ({ key, objectiveKey: "core", relatedObjectiveKeys: [],
    phase: index === 2 ? "apply" : "retrieve", kind: "single_choice", required: true, sourceKeys: [], representation: index === 2 ? "case" : "text", equivalenceKey: key,
    hints: [], use: "learning", prompt: `Pregunta ${key}`, payload: { options: [{ key: "yes", text: "Sí" }, { key: "no", text: "No" }], correctKey: "yes", distractorFeedback: { no: "Revisar el concepto" } },
    feedback: { explanation: "Explicación", commonError: "", sourceKeys: [] }, misconceptionMappings: [], alternativeActivityKey: null }));
  const activities = [...choices, { ...choices[0], key: "explain", equivalenceKey: "explain", phase: "learn", kind: "study", representation: "text",
    payload: { body: "Explicación sintética", focusSpans: [], assetKey: null, scaffold: "explanation", videoRange: null } }];
  return RoutePackageSchema.parse({ schemaVersion: "2.0", packageKey: "upgrade", revision: 1, locale: "es", policyVersion: "guided-v2.0",
    route: { slug: "runtime-route", title: "Ruta", summary: "Fixture de adopción", topicLabel: "Tema", audience: "Alumno", discipline: "general", coverKey: "heart" },
    sources: [], assets: [], objectives: [{ key: "core", title: "Recordar un concepto", unitKey: "unit", verb: "recall", criticality: "core", required: true,
      prerequisiteKeys: [], sourceKeys: [], comparisonGroup: null, misconceptions: [] }],
    units: [{ key: "unit", title: "Unidad", objectiveKeys: ["core"], activityKeys: activities.map(item => item.key), support: "full", estimatedMinutes: null }],
    activities, assessments: [], reviewPlan: { objectiveKeys: ["core"] }, editorial: { notes: "", unresolvedIssues: [] } });
}
function databaseFor(pg: PGlite) {
  const connection: DatabaseConnection = { async executeQuery<R>(query: CompiledQuery): Promise<QueryResult<R>> {
    const result = await pg.query<R>(query.sql, [...query.parameters]); return { rows: result.rows, numAffectedRows: BigInt(result.affectedRows ?? 0) };
  }, async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> { yield { rows: [] }; } };
  return new Kysely<CediahDatabase>({ dialect: { createAdapter: () => new PostgresAdapter(), createIntrospector: db => new PostgresIntrospector(db), createQueryCompiler: () => new PostgresQueryCompiler(),
    createDriver: () => ({ acquireConnection: async () => connection, beginTransaction: async () => { await pg.exec("begin"); }, commitTransaction: async () => { await pg.exec("commit"); },
      rollbackTransaction: async () => { await pg.exec("rollback"); }, destroy: async () => {}, init: async () => {}, releaseConnection: async () => {} }) } });
}
describe("T034 objective equivalence", () => {
  it("requires content, assessment, policy and modality equality", () => {
    const original = fixture();
    expect(transferableObjectiveKeys(null, original, {}, {})).toEqual([]);
    expect(transferableObjectiveKeys(original, structuredClone(original), {}, {})).toEqual(["core"]);
    for (const change of [
      (route: RoutePackage) => { route.activities[0]!.prompt = "Cambio"; },
      (route: RoutePackage) => { route.activities[0]!.representation = "image"; },
      (route: RoutePackage) => { route.activities[0]!.payload = { ...route.activities[0]!.payload, correctKey: "no" } as typeof route.activities[0]["payload"]; },
      (route: RoutePackage) => { route.assessments.push({ key: "final", kind: "final", objectiveKeys: ["core"], candidateActivityKeys: ["recall-a"], afterUnitKey: null, thresholdPercent: 80, thresholdRationale: "Umbral de producto documentado para este fixture sintético." }); },
    ]) { const next = structuredClone(original); change(next); expect(transferableObjectiveKeys(original, next, {}, {})).toEqual([]); }
    expect(transferableObjectiveKeys(original, original, { threshold: 80 }, { threshold: 81 })).toEqual([]);
  });
  it("invalidates dependent evidence when a transitive prerequisite changes", () => {
    const old = fixture(); old.objectives.push({ ...old.objectives[0]!, key: "child", prerequisiteKeys: ["core"] }, { ...old.objectives[0]!, key: "grandchild", prerequisiteKeys: ["child"] });
    const next = structuredClone(old); next.activities[0]!.prompt = "Cambio";
    expect(transferableObjectiveKeys(old, next, {}, {})).toEqual([]);
  });
});
describe("T034 real HTTP adoption and history", () => {
  let pg: PGlite, db: Kysely<CediahDatabase>, app: ReturnType<typeof Fastify>;
  let serial = 70000;
  const flags: GuidedV2Flags = { enabled: true, newEnrollments: true };
  const now = new Date("2026-10-04T12:00:00Z");
  const identity = { getUser: async (request: { authorization?: string }) => request.authorization ? { id: request.authorization.endsWith("other") ? v2Id(2) : v2Id(1) } : null } as unknown as IdentityProvider;
  const get = (id = v2Id(8), actor = "owner") => app.inject({ url: `/v2/guided-learning/enrollments/${id}/upgrade`, headers: { authorization: `Bearer ${actor}` } });
  const post = (body: unknown, key = v2Id(serial++), id = v2Id(8), actor = "owner") => app.inject({ method: "POST", url: `/v2/guided-learning/enrollments/${id}/upgrade`, payload: body, headers: { authorization: `Bearer ${actor}`, "idempotency-key": key } });
  beforeAll(async () => {
    pg = await createGuidedV2Database(); await seedGuidedV2Runtime(pg); db = databaseFor(pg);
    await pg.query("update content_items set status='published',catalog_visibility='catalog',published_at=now(),published_by=$2 where id=$1", [v2Id(3), v2Id(1)]);
    for (const id of [v2Id(6), v2Id(7)]) {
      await pg.query("update learning_path_versions set definition_v2_json=$1,policy_json=$3 where id=$2", [JSON.stringify(fixture()), id, JSON.stringify(guidedV2PolicySnapshot)]);
      await pg.query("insert into learning_v2_bindings(path_version_id,local_key,kind,topic_content_id) values($1,'topic','topic',$2)", [id, v2Id(3)]);
      await pg.query("update learning_path_versions set status='published',published_at=now(),published_by=$2 where id=$1", [id, v2Id(1)]);
    }
    await pg.query("update learning_paths set published_version_id=$1 where id=$2", [v2Id(7), v2Id(4)]);
    app = Fastify(); await registerGuidedV2Routes(app, { flags, identityProvider: identity, provider: createGuidedV2HttpProvider(db, { now: () => now }) });
    await registerGuidedV2EditorImportRoutes(app, { identityProvider: identity,
      contentProvider: { getRoles: async () => ["content_creator"] } as unknown as ContentProvider, provider: createPostgresGuidedLearningV2Provider(db) });
  }, 120000);
  afterAll(async () => { await app?.close(); await db?.destroy(); await pg?.close(); });
  it("publication leaves old enrollment pinned and preview does not adopt", async () => {
    const preview = await get(); expect(preview.statusCode).toBe(200);
    expect(V2HttpContracts.upgradePreview.response.parse(preview.json())).toMatchObject({ targetVersionId: v2Id(7), objectiveImpact: [{ objectiveKey: "core", willResetEvidence: false }], openAttempt: false });
    expect((await pg.query("select path_version_id from learning_enrollments where id=$1", [v2Id(8)])).rows).toEqual([{ path_version_id: v2Id(6) }]);
    expect(preview.headers["cache-control"]).toBe("private, no-store"); expect(preview.body).not.toMatch(/correctKey|payload|policy_json/);
  });
  it("ownership, acknowledgement, CAS and open attempts are enforced before adoption", async () => {
    expect((await get(v2Id(8), "other")).statusCode).toBe(404);
    const body = { targetVersionId: v2Id(7), expectedVersion: 1, acknowledgedReset: true };
    expect((await post({ ...body, acknowledgedReset: false })).statusCode).toBe(400);
    expect((await post({ ...body, expectedVersion: 99 })).json()).toEqual({ error: "version_conflict" });
    const service = createPostgresGuidedV2AttemptService(db, { now: () => now });
    const opened = await service.create({ userId: v2Id(1), enrollmentId: v2Id(8), clientAttemptId: v2Id(serial++), idempotencyKey: v2Id(serial++), expectedEnrollmentVersion: 1, target: { kind: "activity", key: "recall-a" } });
    expect(opened.status).toBe("success"); if (opened.status !== "success") throw new Error("No attempt");
    expect((await get()).json().openAttempt).toBe(true);
    expect((await post(body)).json()).toEqual({ error: "active_attempt" });
    await pg.query("update learning_v2_attempts set status='paused' where id=$1", [opened.value.attemptId]);
    expect((await post(body)).json()).toEqual({ error: "active_attempt" });
    await pg.query("update learning_v2_attempts set status='abandoned' where id=$1", [opened.value.attemptId]);
  });
  it("adopts once, replays exact receipt and preserves historical rows", async () => {
    const before = (await pg.query("select id,snapshot_json,status from learning_v2_attempts order by id")).rows;
    const body = { targetVersionId: v2Id(7), expectedVersion: 1, acknowledgedReset: true }, key = v2Id(serial++);
    const result = await post(body, key); expect(result.statusCode).toBe(200);
    expect(V2HttpContracts.upgradeCommit.response.parse(result.json()).state).toMatchObject({ pathVersionId: v2Id(7), rowVersion: 2 });
    expect((await post(body, key)).json()).toEqual(result.json());
    expect((await post(body)).statusCode).toBe(409); // A second tab cannot re-adopt a stale revision.
    expect((await post({ ...body, expectedVersion: 2 }, key)).json()).toEqual({ error: "idempotency_conflict" });
    expect((await pg.query("select id,snapshot_json,status from learning_v2_attempts order by id")).rows).toEqual(before);
    expect((await pg.query("select count(*)::int as n from learning_enrollment_versions where enrollment_id=$1", [v2Id(8)])).rows).toEqual([{ n: 3 }]);
  });
  it("v1 engine change resets mastery and the v1 adoption dispatcher refuses v2", async () => {
    expect(await planLearningEnrollmentUpgrade(db, { enrollmentId: v2Id(8), userId: v2Id(1) })).toEqual({ status: "conflict" });
    await pg.query("insert into learning_enrollment_versions(enrollment_id,path_id,path_version_id) values($1,$2,$3)", [v2Id(9), v2Id(4), v2Id(5)]);
    await pg.query("update learning_enrollments set path_version_id=$1 where id=$2", [v2Id(5), v2Id(9)]);
    await pg.query("update learning_enrollments set completed_at=$1 where id=$2", ["2026-09-01T12:00:00Z", v2Id(9)]);
    expect(await planLearningEnrollmentUpgrade(db, { enrollmentId: v2Id(9), userId: v2Id(2) })).toEqual({ status: "conflict" });
    const preview = await get(v2Id(9), "other"); expect(preview.statusCode).toBe(200);
    expect(preview.json().objectiveImpact).toMatchObject([{ objectiveKey: "core", willResetEvidence: true }]);
    const open = v2Id(serial++);
    const guide = v2Id(serial++), resource = v2Id(serial++), revision = v2Id(serial++), unit = v2Id(serial++), step = v2Id(serial++), option = v2Id(serial++);
    const payload = { projection: "guide", content: { sections: [{ text: "Texto v1 sintético" }] } };
    await pg.query("insert into content_items(id,kind,slug,title,summary,topic,author_user_id) values($1,'guide','v1-open-guide','Guía v1','Fixture','Tema',$2)", [guide, v2Id(2)]);
    await pg.query("insert into learning_resources(id,source_content_id,projection,adapter_key) values($1,$2,'guide','guide-adapter')", [resource, guide]);
    await pg.query("insert into learning_resource_revisions(id,resource_id,revision_number,source_version,adapter_version,schema_version,payload_json,payload_hash) values($1,$2,1,1,1,1,$3,$4)", [revision, resource, JSON.stringify(payload), hashLearningSnapshot(payload)]);
    await pg.query("insert into learning_path_units(id,path_version_id,stable_key,position,title) values($1,$2,'unit-v1',0,'Unidad v1')", [unit, v2Id(5)]);
    await pg.query("insert into learning_path_steps(id,unit_id,path_version_id,stable_key,position,title,purpose) values($1,$2,$3,'reading-v1',0,'Lectura v1','understand')", [step, unit, v2Id(5)]);
    await pg.query("insert into learning_step_options(id,step_id,path_version_id,position,label,projection,source_content_id,resource_revision_id,reward_identity) values($1,$2,$3,0,'Leer','guide',$4,$5,$6)", [option, step, v2Id(5), guide, revision, v2Id(serial++)]);
    await pg.query("insert into learning_attempts(id,user_id,enrollment_id,path_version_id,client_attempt_id,step_id,step_option_id,projection,purpose,manifest_json) values($1,$2,$3,$4,$5,$6,$7,'guide','understand',$8)", [open, v2Id(2), v2Id(9), v2Id(5), v2Id(serial++), step, option, JSON.stringify(payload)]);
    expect((await get(v2Id(9), "other")).json().openAttempt).toBe(true);
    expect((await post({ targetVersionId: v2Id(7), expectedVersion: 1, acknowledgedReset: true }, v2Id(serial++), v2Id(9), "other")).json()).toEqual({ error: "active_attempt" });
    await pg.query("update learning_attempts set status='abandoned' where id=$1", [open]);
    await pg.query("insert into learning_step_progress(enrollment_id,step_id,path_version_id,state,completion_method,completed_at) values($1,$2,$3,'completed','observed','2026-09-01T12:00:00Z')", [v2Id(9), step, v2Id(5)]);
    const consumed = (await pg.query("select * from learning_step_progress where enrollment_id=$1", [v2Id(9)])).rows;
    expect((await get(v2Id(9), "other")).json().consumedActivities).toEqual([{ title: "Lectura v1", previousActivityKey: "reading-v1", consumptionOnly: true }]);
    const result = await post({ targetVersionId: v2Id(7), expectedVersion: 1, acknowledgedReset: true }, v2Id(serial++), v2Id(9), "other");
    expect(result.statusCode).toBe(200); expect(result.json().state).toMatchObject({ masteredAt: null, consolidatedAt: null, completedActivities: 0 });
    expect(result.json().state.versionHistory).toContainEqual(expect.objectContaining({ engineVersion: "guided-v1", completedAt: "2026-09-01T12:00:00.000Z" }));
    expect(result.json().state.versionHistory).toContainEqual(expect.objectContaining({ engineVersion: "guided-v1", consumedActivities: ["Lectura v1"] }));
    expect((await pg.query("select * from learning_step_progress where enrollment_id=$1", [v2Id(9)])).rows).toEqual(consumed);
    expect((await pg.query("select count(*)::int as n from learning_v2_responses where enrollment_id=$1", [v2Id(9)])).rows).toEqual([{ n: 0 }]);
  });
  it("conversion makes a new blocked draft, preserves importance and never copies recommendedAfter", async () => {
    const id = v2Id(serial++), unit = v2Id(serial++);
    await pg.query("insert into learning_paths(id,topic_content_id,slug,title,summary,cover_key,created_by) values($1,$2,'convert-v1','Original','Resumen','heart',$3)", [id, v2Id(3), v2Id(1)]);
    const old = v2Id(serial++);
    await pg.query("insert into learning_path_versions(id,path_id,version_number,policy_version,policy_json) values($1,$2,1,'guided-v1','{}')", [old, id]);
    const objectives = [1, 2, 3].map(importance => ({ id: v2Id(serial++), title: `Objetivo ${importance}`, importance }));
    await pg.query("insert into learning_path_units(id,path_version_id,stable_key,position,title,objectives_json) values($1,$2,'unit',0,'Unidad original',$3)", [unit, old, JSON.stringify(objectives)]);
    const guide = v2Id(serial++), resource = v2Id(serial++), revision = v2Id(serial++), step = v2Id(serial++), option = v2Id(serial++);
    const payload = { projection: "guide", content: { sections: [{ text: "Texto exacto de la guía sintética." }] } };
    await pg.query("insert into content_items(id,kind,slug,title,summary,topic,author_user_id,status,published_at,published_by) values($1,'guide','conversion-guide','Guía original','Fixture','Tema',$2,'published',now(),$2)", [guide, v2Id(1)]);
    await pg.query("insert into learning_resources(id,source_content_id,projection,adapter_key) values($1,$2,'guide','guide-adapter')", [resource, guide]);
    await pg.query("insert into learning_resource_revisions(id,resource_id,revision_number,source_version,adapter_version,schema_version,payload_json,payload_hash) values($1,$2,1,1,1,1,$3,$4)", [revision, resource, JSON.stringify(payload), hashLearningSnapshot(payload)]);
    await pg.query("insert into learning_path_steps(id,unit_id,path_version_id,stable_key,position,title,purpose,objective_ids_json,recommended_after_json) values($1,$2,$3,'reading',0,'Lectura original','understand',$4,'[\"older-reading\"]')", [step, unit, old, JSON.stringify([objectives[2]!.id])]);
    await pg.query("insert into learning_step_options(id,step_id,path_version_id,position,label,projection,source_content_id,resource_revision_id,reward_identity,config_json,completion_rule_json) values($1,$2,$3,0,'Leer','guide',$4,$5,$6,'{}','{}')", [option, step, old, guide, revision, v2Id(serial++)]);
    const oversizedRevision = v2Id(serial++), oversizedPayload = { projection: "guide", content: { sections: [{ text: "x".repeat(10001) }] } };
    await pg.query("insert into learning_resource_revisions(id,resource_id,revision_number,source_version,adapter_version,schema_version,payload_json,payload_hash) values($1,$2,2,2,1,1,$3,$4)", [oversizedRevision, resource, JSON.stringify(oversizedPayload), hashLearningSnapshot(oversizedPayload)]);
    await pg.query("insert into learning_step_options(id,step_id,path_version_id,position,label,projection,source_content_id,resource_revision_id,reward_identity,config_json,completion_rule_json) values($1,$2,$3,1,'Guía extensa','guide',$4,$5,$6,'{}','{}')", [v2Id(serial++), step, old, guide, oversizedRevision, v2Id(serial++)]);
    const original = (await pg.query("select * from learning_path_versions where id=$1", [old])).rows;
    const originalParts = await Promise.all(["learning_path_units", "learning_path_steps", "learning_step_options"].map(table => pg.query(`select * from ${table} where path_version_id=$1 order by id`, [old]).then(result => result.rows)));
    const result = await db.transaction().execute(async tx => convertGuidedV1(tx, await tx.selectFrom("learning_paths").selectAll().where("id", "=", id).executeTakeFirstOrThrow(), await tx.selectFrom("learning_path_versions").selectAll().where("id", "=", old).executeTakeFirstOrThrow(), v2Id(1)));
    expect(result.value.draft.status).toBe("draft");
    const stored = await db.selectFrom("learning_path_versions").selectAll().where("id", "=", result.value.draft.pathVersionId).executeTakeFirstOrThrow();
    const definition = RoutePackageSchema.parse(stored.definition_v2_json);
    expect(definition.objectives.map(item => item.criticality)).toEqual(["supporting", "high_yield", "core"]);
    expect(definition.objectives.every(item => item.prerequisiteKeys.length === 0)).toBe(true);
    expect(definition.activities).toHaveLength(1); expect(definition.activities[0]).toMatchObject({ kind: "study", prompt: "Lectura original", payload: { body: "Texto exacto de la guía sintética." } });
    expect(definition.editorial.unresolvedIssues).toContainEqual(expect.objectContaining({ code: "CONVERSION_RESOURCE_MISSING", message: expect.stringContaining("excede 10 000 caracteres") }));
    expect((await pg.query("select payload_json from learning_resource_revisions where id=$1", [oversizedRevision])).rows).toEqual([{ payload_json: oversizedPayload }]);
    expect(definition.sources[0]!.documentSha256).toBe(hashLearningSnapshot(payload));
    const identities = (await pg.query<{ metadata: { identities: { fromId: string; toKey: string }[] } }>("select metadata from audit_log where target_id=$1 and action='learning_path_v2_created'", [id])).rows[0]!.metadata.identities;
    expect(identities).toContainEqual({ kind: "step", fromId: step, toKey: definition.activities[0]!.key });
    expect(definition.editorial.unresolvedIssues.every(item => item.severity === "error")).toBe(true);
    expect((await pg.query("select * from learning_path_versions where id=$1", [old])).rows).toEqual(original);
    expect(await Promise.all(["learning_path_units", "learning_path_steps", "learning_step_options"].map(table => pg.query(`select * from ${table} where path_version_id=$1 order by id`, [old]).then(result => result.rows)))).toEqual(originalParts);
    expect((await pg.query("select published_version_id from learning_paths where id=$1", [id])).rows).toEqual([{ published_version_id: null }]);
    const provider = createPostgresGuidedLearningV2Provider(db);
    expect((await provider.transitionPath({ actorUserId: v2Id(1), canEdit: true, canEditAll: true, pathId: id, expectedVersion: 1, status: "published", canReview: true, canPublish: true, reviewNote: null })).status).not.toBe("success");
  });
  it("transfers equivalent v2 evidence from original responses without duplicate rewards, resets changes and never resurrects older mastery", async () => {
    const service = createPostgresGuidedV2AttemptService(db, { now: () => now });
    for (const key of ["recall-a", "recall-b", "apply"]) {
      const created = await service.create({ userId: v2Id(1), enrollmentId: v2Id(8), clientAttemptId: v2Id(serial++), idempotencyKey: v2Id(serial++), expectedEnrollmentVersion: 2, target: { kind: "activity", key } });
      expect(created.status).toBe("success"); if (created.status !== "success") throw new Error("No attempt");
      expect((await service.respond({ userId: v2Id(1), attemptId: created.value.attemptId, activityKey: key, expectedVersion: 1, idempotencyKey: v2Id(serial++), confidence: null, answer: { kind: "single_choice", optionKey: "yes" } })).status).toBe("success");
      expect((await service.complete({ userId: v2Id(1), attemptId: created.value.attemptId, expectedVersion: 2, idempotencyKey: v2Id(serial++) })).status).toBe("success");
    }
    const mastered = await app.inject({ url: `/v2/guided-learning/enrollments/${v2Id(8)}/state`, headers: { authorization: "Bearer owner" } });
    expect(mastered.json().state.objectives[0].firstMasteredAt).toBe(now.toISOString());
    const rows = (await pg.query("select id,path_version_id,answer_json from learning_v2_responses order by id")).rows;
    const rewards = (await pg.query("select count(*)::int as n from learning_rewards")).rows;
    async function publish(number: number, changed: boolean) {
      const next = fixture(); if (changed) next.activities[2]!.prompt = "Aplicación actualizada";
      const version = v2Id(serial++);
      await pg.query("insert into learning_path_versions(id,path_id,version_number,policy_version,policy_json,definition_v2_json) values($1,$2,$3,'guided-v2.0',$4,$5)", [version, v2Id(4), number, JSON.stringify(guidedV2PolicySnapshot), JSON.stringify(next)]);
      await pg.query("insert into learning_v2_bindings(path_version_id,local_key,kind,topic_content_id) values($1,'topic','topic',$2)", [version, v2Id(3)]);
      await pg.query("update learning_path_versions set status='published',published_at=now(),published_by=$2 where id=$1", [version, v2Id(1)]);
      await pg.query("update learning_paths set published_version_id=$1 where id=$2", [version, v2Id(4)]);
      return version;
    }
    const next = await publish(4, false), preview = await get(); expect(preview.json().objectiveImpact[0].willResetEvidence).toBe(false);
    const adopted = await post({ targetVersionId: next, expectedVersion: 2, acknowledgedReset: true }); expect(adopted.statusCode).toBe(200);
    expect(adopted.json().state.objectives[0].firstMasteredAt).toBe(now.toISOString());
    const reread = await app.inject({ url: `/v2/guided-learning/enrollments/${v2Id(8)}/state`, headers: { authorization: "Bearer owner" } });
    expect(reread.json().state.objectives[0].firstMasteredAt).toBe(now.toISOString());
    expect((await pg.query("select count(*)::int as n from learning_rewards")).rows).toEqual(rewards);
    const changed = await publish(5, true); expect((await get()).json().objectiveImpact[0].willResetEvidence).toBe(true);
    const reset = await post({ targetVersionId: changed, expectedVersion: 3, acknowledgedReset: true }); expect(reset.statusCode).toBe(200); expect(reset.json().state.objectives[0].firstMasteredAt).toBeNull();
    const restored = await publish(6, false), final = await post({ targetVersionId: restored, expectedVersion: 4, acknowledgedReset: true });
    expect(final.statusCode).toBe(200); expect(final.json().state.objectives[0].firstMasteredAt).toBeNull();
    expect((await pg.query("select id,path_version_id,answer_json from learning_v2_responses order by id")).rows).toEqual(rows);
  }, 30000);
  it("flags off permit private history reads with zero writes and deny mutations; admission flag blocks only new enrollments", async () => {
    flags.enabled = false;
    const snapshot = async () => (await pg.query("select (select jsonb_agg(to_jsonb(t) order by id) from learning_enrollments t) as enrollments,(select jsonb_agg(to_jsonb(t) order by id) from learning_events t) as events,(select jsonb_agg(to_jsonb(t) order by id) from learning_rewards t) as rewards,(select jsonb_agg(to_jsonb(t) order by idempotency_key) from learning_mutation_receipts t) as receipts,(select jsonb_agg(to_jsonb(t) order by objective_key,path_version_id) from learning_v2_objective_state t) as objectives,(select jsonb_agg(to_jsonb(t) order by objective_key,path_version_id) from learning_v2_review_state t) as reviews")).rows;
    const before = await snapshot();
    const response = await app.inject({ url: `/v2/guided-learning/enrollments/${v2Id(8)}/state`, headers: { authorization: "Bearer owner" } });
    expect(response.statusCode).toBe(200); expect(response.json().state).toMatchObject({ availability: "maintenance", nextAction: { kind: "none", key: null } });
    expect(response.json().state.versionHistory.length).toBeGreaterThan(2);
    expect((await post({ targetVersionId: v2Id(7), expectedVersion: 1, acknowledgedReset: true })).statusCode).toBe(503);
    expect(await snapshot()).toEqual(before); flags.enabled = true;
    flags.newEnrollments = false;
    const denied = await app.inject({ method: "POST", url: "/v2/guided-learning/enrollments", payload: { pathId: v2Id(4) }, headers: { authorization: "Bearer owner", "idempotency-key": v2Id(serial++) } });
    expect(denied.json()).toEqual({ error: "new_enrollments_disabled" }); flags.newEnrollments = true;
  });
  it("convert-v1 HTTP uses ownership, CAS and an idempotent draft receipt", async () => {
    const path = v2Id(serial++), old = v2Id(serial++), key = v2Id(serial++);
    await pg.query("insert into learning_paths(id,topic_content_id,slug,title,summary,cover_key,created_by) values($1,$2,'http-conversion','Original','Resumen','heart',$3)", [path, v2Id(3), v2Id(1)]);
    await pg.query("insert into learning_path_versions(id,path_id,version_number,policy_version,policy_json) values($1,$2,1,'guided-v1','{}')", [old, path]);
    const convert = (actor: string, expectedVersion: number, receipt = key) => app.inject({ method: "POST", url: `/v2/editor/learning-paths/${path}/convert-v1`, payload: { expectedVersion }, headers: { authorization: `Bearer ${actor}`, "idempotency-key": receipt } });
    expect((await convert("other", 1, v2Id(serial++))).statusCode).toBe(404);
    expect((await convert("owner", 99, v2Id(serial++))).json()).toEqual({ error: "version_conflict" });
    const created = await convert("owner", 1); expect(created.statusCode).toBe(200); V2HttpContracts.convertV1.response.parse(created.json());
    expect((await convert("owner", 1)).json()).toEqual(created.json());
    expect((await pg.query("select count(*)::int as n from learning_path_versions where path_id=$1", [path])).rows).toEqual([{ n: 2 }]);
  });
});




