import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as contracts from "@cediah/contracts";
import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler, type CompiledQuery, type DatabaseConnection, type QueryResult } from "kysely";
import { RoutePackageSchema, V2HttpContracts, V2CatalogResponseSchema, V2HomeSnapshotSchema, type IdentityProvider } from "@cediah/contracts";
import type { PGlite } from "@electric-sql/pglite";
import type { CediahDatabase } from "../src/db/database.js";
import { buildApp } from "../src/app.js";
import { createGuidedV2HttpProvider, registerGuidedV2Routes, type GuidedV2Flags } from "../src/guided-learning/v2/routes.js";
import { createGuidedV2Database, seedGuidedV2Runtime, v2Id } from "./helpers/guided-v2-db.js";
import { readEnvironment } from "../src/config.js";

const epoch = Date.parse("2026-09-01T12:00:00Z");
const at = (days = 0, seconds = 0) => new Date(epoch + days * 86400000 + seconds * 1000);
const identity = { getUser: async (request: { authorization?: string }) => request.authorization ? { id: request.authorization.endsWith("other") ? v2Id(2) : v2Id(1) } : null } as unknown as IdentityProvider;
function fixture() {
  const base = { objectiveKey: "core", relatedObjectiveKeys: [], phase: "retrieve", required: true, sourceKeys: ["citation"], representation: "text",
    hints: ["PRIVATE_HINT"], use: "learning", prompt: "Pregunta", feedback: { explanation: "PRIVATE_FEEDBACK", commonError: "PRIVATE_ERROR", sourceKeys: ["citation"] },
    misconceptionMappings: [], alternativeActivityKey: null, kind: "single_choice", payload: { correctKey: "yes", options: [{ key: "yes", text: "Sí" }, { key: "no", text: "No" }], distractorFeedback: { no: "Revisa la relación" } } };
  const choices = ["a", "b", "apply", "final-a", "final-b", "seven", "thirty", "diagnostic"].map((key) => ({ ...base, key, equivalenceKey: key,
    phase: key === "apply" ? "apply" : "retrieve", representation: ["apply", "final-a", "final-b"].includes(key) ? "diagram" : "text",
    use: key.startsWith("final") ? "final" : key === "seven" ? "retention7" : key === "thirty" ? "retention30" : key === "diagnostic" ? "diagnostic" : "learning" }));
  const activities = [{ ...base, key: "learn", equivalenceKey: "learn", phase: "learn", kind: "study", payload: { body: "Explicación", scaffold: "explanation", focusSpans: [], assetKey: null, videoRange: null } }, ...choices];
  return RoutePackageSchema.parse({ schemaVersion: "2.0", packageKey: "http", revision: 1, locale: "es", policyVersion: "guided-v2.0",
    route: { slug: "http-route", title: "Versión fijada", summary: "Fixture", topicLabel: "Tema", audience: "Alumno", discipline: "general", coverKey: "heart" }, sources: [{ key: "citation", kind: "reference", title: "Fuente de la versión fijada", citation: "Referencia sintética, sección 1", locator: { heading: "Sección 1", sectionPath: [], page: 1 }, documentSha256: "a".repeat(64), excerpt: "PRIVATE_SOURCE_FEEDBACK", url: null, verification: "provided", checkedAt: null }], assets: [],
    objectives: [{ key: "core", title: "Objetivo", unitKey: "unit", verb: "recall", criticality: "core", required: true, prerequisiteKeys: [], sourceKeys: [], comparisonGroup: null, misconceptions: [] }],
    units: [{ key: "unit", title: "Unidad", objectiveKeys: ["core"], activityKeys: activities.map((item) => item.key), support: "full", estimatedMinutes: 5 }], activities,
    assessments: [
      { key: "diagnosis", kind: "diagnostic", candidateActivityKeys: ["diagnostic"] },
      { key: "final-test", kind: "final", candidateActivityKeys: ["final-a", "final-b"] },
      { key: "seven-test", kind: "retention7", candidateActivityKeys: ["seven"] },
      { key: "thirty-test", kind: "retention30", candidateActivityKeys: ["thirty"] },
    ].map((item) => ({ ...item, afterUnitKey: null, objectiveKeys: ["core"], thresholdPercent: 80, thresholdRationale: "Umbral sintético documentado para comprobar el flujo HTTP." })),
    reviewPlan: { objectiveKeys: ["core"] }, editorial: { notes: "", unresolvedIssues: [] } });
}
function databaseFor(pg: PGlite) {
  const connection: DatabaseConnection = { async executeQuery<R>(query: CompiledQuery): Promise<QueryResult<R>> {
    const result = await pg.query<R>(query.sql, [...query.parameters]); return { rows: result.rows, numAffectedRows: BigInt(result.affectedRows ?? 0) };
  }, async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> { yield { rows: [] }; } };
  return new Kysely<CediahDatabase>({ dialect: { createAdapter: () => new PostgresAdapter(), createIntrospector: (db) => new PostgresIntrospector(db), createQueryCompiler: () => new PostgresQueryCompiler(),
    createDriver: () => ({ acquireConnection: async () => connection, beginTransaction: async () => { await pg.exec("begin"); }, commitTransaction: async () => { await pg.exec("commit"); },
      rollbackTransaction: async () => { await pg.exec("rollback"); }, destroy: async () => {}, init: async () => {}, releaseConnection: async () => {} }) } });
}
describe("T021 actual learner HTTP and persisted services", () => {
  let pg: PGlite, database: Kysely<CediahDatabase>, app: ReturnType<typeof Fastify>;
  let clock = at(), serial = 50000;
  const flags: GuidedV2Flags = { enabled: true, newEnrollments: true };
  beforeAll(async () => {
    pg = await createGuidedV2Database(); await seedGuidedV2Runtime(pg);
    await pg.query("delete from learning_enrollments where id=$1", [v2Id(9)]);
    await pg.query("update content_items set status='published',catalog_visibility='catalog',published_at=now(),published_by=$2 where id=$1", [v2Id(3), v2Id(1)]);
    await pg.query("update learning_path_versions set definition_v2_json=$1 where id=$2", [JSON.stringify(fixture()), v2Id(6)]);
    await pg.query("insert into learning_v2_bindings(path_version_id,local_key,kind,topic_content_id) values($1,'topic','topic',$2)", [v2Id(6), v2Id(3)]);
    await pg.query("update learning_path_versions set status='published',published_at=now(),published_by=$2 where id=$1", [v2Id(6), v2Id(1)]);
    await pg.query("update learning_paths set slug='http-route',published_version_id=$1 where id=$2", [v2Id(6), v2Id(4)]);
    database = databaseFor(pg); app = Fastify();
    await registerGuidedV2Routes(app, { flags, identityProvider: identity, provider: createGuidedV2HttpProvider(database, { now: () => clock }) });
  }, 120000);
  afterAll(async () => { await app?.close(); await database?.destroy(); await pg?.close(); });
  const get = (path: string, actor = "learner") => app.inject({ url: `/v2/guided-learning/${path}`, headers: { authorization: `Bearer ${actor}` } });
  const post = (path: string, payload: unknown, key = v2Id(serial++), actor = "learner") => app.inject({ method: "POST", url: `/v2/guided-learning/${path}`, payload,
    headers: { authorization: `Bearer ${actor}`, "idempotency-key": key } });
  it("returns 401/404/403 and no-store before provider calls when disabled or outside allowlist", async () => {
    const anonymous = await app.inject({ url: `/v2/guided-learning/enrollments/${v2Id(8)}/state` }); expect(anonymous.statusCode).toBe(401);
    flags.enabled = false; expect((await get(`enrollments/${v2Id(8)}/state`)).statusCode).toBe(404); flags.enabled = true;
    flags.allowlist = new Set([v2Id(2)]); expect((await get("home")).statusCode).toBe(403); flags.allowlist = undefined;
    flags.newEnrollments = false; expect((await post("enrollments", { pathId: v2Id(4) })).statusCode).toBe(403); flags.newEnrollments = true;
    expect(anonymous.headers["cache-control"]).toBe("private, no-store");
  });
  it("projects a safe path and explicit engine version in catalog/home", async () => {
    const response = await get("paths/http-route"); expect(response.statusCode).toBe(200);
    expect(V2HttpContracts.publicPath.response.parse(response.json()).path.pathVersionId).toBe(v2Id(6));
    expect(response.body).not.toContain("correctKey"); expect(response.body).not.toContain("PRIVATE_FEEDBACK");
    const catalog = await get("paths?limit=1"); expect(catalog.statusCode).toBe(200);
    expect(V2CatalogResponseSchema.parse(catalog.json()).items[0]!.engineVersion).toBe("guided-v2");
    const home = await get("home"); expect(home.statusCode).toBe(200); V2HomeSnapshotSchema.parse(home.json());
  });
  it("enrollment is pinned, idempotent and has a request receipt", async () => {
    const key = v2Id(serial++), payload = { pathId: v2Id(4) };
    const first = await post("enrollments", payload, key, "other"); expect(first.statusCode).toBe(200);
    expect((await post("enrollments", payload, key, "other")).json()).toEqual(first.json());
    expect((await post("enrollments", { pathId: v2Id(999) }, key, "other")).statusCode).toBe(409);
    expect((await pg.query("select count(*)::int as n from learning_enrollments where user_id=$1", [v2Id(2)])).rows).toEqual([{ n: 1 }]);
  });
  it("strict requests reject client scores/extra fields and foreign attempts/enrollments", async () => {
    expect((await post("attempts", { clientAttemptId: v2Id(serial++), enrollmentId: v2Id(8), target: { kind: "activity", key: "learn" }, expectedEnrollmentVersion: 1, score01: 1 })).statusCode).toBe(400);
    expect((await get(`enrollments/${v2Id(8)}/state`, "other")).statusCode).toBe(404);
    expect((await get(`attempts/${v2Id(999)}`)).statusCode).toBe(404);
    expect((await get("home?private=true")).statusCode).toBe(400);
  });
  async function launch(key: string, kind: "activity" | "assessment" = "activity") {
    return post("attempts", { clientAttemptId: v2Id(serial++), enrollmentId: v2Id(8), target: { kind, key }, expectedEnrollmentVersion: 1 });
  }
  it("server availability blocks reserved practice, early final and deferred tests", async () => {
    expect((await launch("final-a")).statusCode).toBe(409);
    expect((await launch("final-test", "assessment")).statusCode).toBe(409);
    expect((await launch("seven-test", "assessment")).statusCode).toBe(409);
  });
  it("resumes one attempt and commits learning/feedback/heartbeat with server versions", async () => {
    const created = await launch("learn"); expect(created.statusCode).toBe(200);
    const manifest = V2HttpContracts.attemptCreate.response.parse(created.json()).attempt;
    expect((await get(`attempts/${manifest.attemptId}`)).json()).toEqual(created.json());
    expect((await launch("learn")).statusCode).toBe(409);
    const heartbeat = await post(`attempts/${manifest.attemptId}/heartbeat`, { clientEventId: v2Id(serial++), visible: true, interactionAgeMs: 0 });
    expect(heartbeat.statusCode).toBe(200);
    const answered = await post(`attempts/${manifest.attemptId}/responses`, { activityKey: "learn", answer: { kind: "study", acknowledged: true }, confidence: null, expectedVersion: 1 });
    expect(answered.statusCode).toBe(200); V2HttpContracts.attemptResponse.response.parse(answered.json());
    expect((await post(`attempts/${manifest.attemptId}/complete`, { expectedVersion: 2 })).statusCode).toBe(200);
    const feedback = { activityKey: "learn", acknowledged: true };
    expect((await post(`attempts/${manifest.attemptId}/feedback-viewed`, feedback)).statusCode).toBe(200);
    expect((await post(`attempts/${manifest.attemptId}/feedback-viewed`, feedback)).statusCode).toBe(200);
    expect((await pg.query("select count(*)::int as n from learning_events where event_type='feedback_viewed'")).rows).toEqual([{ n: 1 }]);
    for (const key of ["a", "b", "apply"]) {
      clock = at(0, serial);
      const started = await launch(key); expect(started.statusCode, started.body).toBe(200);
      const id = started.json().attempt.attemptId as string;
      expect(started.body).not.toContain("PRIVATE_SOURCE_FEEDBACK");
      const response = await post(`attempts/${id}/responses`, { activityKey: key, answer: { kind: "single_choice", optionKey: "yes" }, confidence: "sure", expectedVersion: 1 });
      expect(response.statusCode, response.body).toBe(200); expect(response.json().state.pathVersionId).toBe(v2Id(6));
      expect(response.json().feedback.sources[0]).toMatchObject({ key: "citation", title: "Fuente de la versión fijada", excerpt: "PRIVATE_SOURCE_FEEDBACK", locator: { page: 1 } });
      const reloaded = await get(`attempts/${id}`);
      expect(reloaded.json().attempt.acceptedResponses[0].feedback.sources).toEqual(response.json().feedback.sources);
      expect((await pg.query("select assisted from learning_v2_responses where attempt_id=$1", [id])).rows).toEqual([{ assisted: false }]);
      expect((await post(`attempts/${id}/complete`, { expectedVersion: 2 })).statusCode).toBe(200);
    }
    const state = await get(`enrollments/${v2Id(8)}/state`); expect(state.statusCode).toBe(200);
    expect(state.json().state.objectives[0].label).toBe("mastered"); expect(state.body).not.toContain("evidenceWindow");
  });
  it("selects/fixes one reserved item per objective and exposes correction only on segment submission", async () => {
    const created = await launch("final-test", "assessment"); expect(created.statusCode, created.body).toBe(200);
    const manifest = created.json().attempt;
    const stored = (await pg.query<{ snapshot_json: { orderedKeys: string[]; novelKeys: string[] } }>("select snapshot_json from learning_v2_attempts where id=$1", [manifest.attemptId])).rows[0]!;
    expect(stored.snapshot_json.orderedKeys).toHaveLength(1); expect(stored.snapshot_json.novelKeys).toHaveLength(1);
    expect(created.body).not.toContain("PRIVATE_FEEDBACK");
    expect((await post(`attempts/${manifest.attemptId}/help`, { activityKey: manifest.activeActivity.key, kind: "reveal", expectedVersion: 1 })).statusCode).toBe(409);
    const input = { activityKey: manifest.activeActivity.key, answer: { kind: "single_choice", optionKey: "yes" }, confidence: null, expectedVersion: 1 };
    const response = await post(`attempts/${manifest.attemptId}/responses`, input); expect(response.statusCode, response.body).toBe(200);
    expect(response.json().feedback.explanation).toBe("PRIVATE_FEEDBACK");
    expect((await pg.query("select novel_at_presentation from learning_v2_responses where attempt_id=$1", [manifest.attemptId])).rows).toEqual([{ novel_at_presentation: true }]);
    const completed = await post(`attempts/${manifest.attemptId}/complete`, { expectedVersion: 2 }); expect(completed.statusCode).toBe(200);
    expect(completed.json().state.completedAt).not.toBeNull();
    expect((await launch("seven-test", "assessment")).statusCode).toBe(409);
  });
  it("a later publication never replaces an enrolled version", async () => {
    const route = fixture(); route.route.title = "Versión nueva";
    route.sources[0]!.excerpt = "NEW_VERSION_SOURCE_MUST_NOT_REPLACE_PINNED";
    await pg.query("update learning_path_versions set definition_v2_json=$1 where id=$2", [JSON.stringify(route), v2Id(7)]);
    await pg.query("insert into learning_v2_bindings(path_version_id,local_key,kind,topic_content_id) values($1,'topic','topic',$2)", [v2Id(7), v2Id(3)]);
    await pg.query("update learning_path_versions set status='published',published_at=now(),published_by=$2 where id=$1", [v2Id(7), v2Id(1)]);
    await pg.query("update learning_paths set published_version_id=$1 where id=$2", [v2Id(7), v2Id(4)]);
    const response = await get("paths/http-route"); expect(response.statusCode).toBe(200);
    expect(response.json().path).toMatchObject({ pathVersionId: v2Id(6), title: "Versión fijada" });
    expect((await get(`enrollments/${v2Id(8)}/state`)).json().state.pathVersionId).toBe(v2Id(6));
  });
  it("scheduler eligibility admits actual day7/day30 evaluations on the pinned version", async () => {
    for (const [days, key] of [[9, "seven-test"], [32, "thirty-test"]] as const) {
      clock = at(days);
      const response = await launch(key, "assessment"); expect(response.statusCode, response.body).toBe(200);
      const attempt = response.json().attempt;
      const answer = await post(`attempts/${attempt.attemptId}/responses`, { activityKey: attempt.activeActivity.key,
        answer: { kind: "single_choice", optionKey: "yes" }, confidence: null, expectedVersion: 1 });
      expect(answer.statusCode).toBe(200);
      expect(answer.json().feedback.sources[0].excerpt).toBe("PRIVATE_SOURCE_FEEDBACK");
      expect(answer.body).not.toContain("NEW_VERSION_SOURCE_MUST_NOT_REPLACE_PINNED");
      const completed = await post(`attempts/${attempt.attemptId}/complete`, { expectedVersion: 2 }); expect(completed.statusCode).toBe(200);
      expect(completed.json().state.pathVersionId).toBe(v2Id(6));
    }
    expect((await get(`enrollments/${v2Id(8)}/state`)).json().state.consolidatedAt).not.toBeNull();
  });
  it("12 reserved objectives keep correction private until each ten-item segment is submitted", async () => {
    const route = fixture(), choice = route.activities.find((item) => item.key === "a")!;
    route.route.slug = "segments";
    route.objectives = Array.from({ length: 12 }, (_, i) => ({ ...route.objectives[0]!, key: `obj-${i}` }));
    route.activities = route.objectives.flatMap((objective) => [
      { ...choice, key: `${objective.key}-learn`, objectiveKey: objective.key, equivalenceKey: `${objective.key}-learn` },
      { ...choice, key: `${objective.key}-final`, objectiveKey: objective.key, equivalenceKey: `${objective.key}-final`, use: "final" as const, representation: "diagram" as const },
    ]);
    route.units[0]!.objectiveKeys = route.objectives.map((item) => item.key); route.units[0]!.activityKeys = route.activities.map((item) => item.key);
    route.assessments = [{ ...route.assessments.find((item) => item.kind === "final")!, objectiveKeys: route.units[0]!.objectiveKeys,
      candidateActivityKeys: route.activities.filter((item) => item.use === "final").map((item) => item.key) }];
    route.reviewPlan.objectiveKeys = route.units[0]!.objectiveKeys;
    await pg.query("insert into learning_paths(id,topic_content_id,slug,title,summary,cover_key,created_by) values($1,$2,'segments','Segments','Fixture','heart',$3)", [v2Id(20), v2Id(3), v2Id(1)]);
    await pg.query("insert into learning_path_versions(id,path_id,version_number,policy_version,policy_json,definition_v2_json) values($1,$2,1,'guided-v2.0','{}',$3)", [v2Id(21), v2Id(20), JSON.stringify(route)]);
    await pg.query("insert into learning_v2_bindings(path_version_id,local_key,kind,topic_content_id) values($1,'topic','topic',$2)", [v2Id(21), v2Id(3)]);
    await pg.query("update learning_path_versions set status='published',published_at=now(),published_by=$2 where id=$1", [v2Id(21), v2Id(1)]);
    await pg.query("update learning_paths set published_version_id=$1 where id=$2", [v2Id(21), v2Id(20)]);
    const enrolled = await post("enrollments", { pathId: v2Id(20) }, undefined, "other"); expect(enrolled.statusCode).toBe(200);
    const enrollmentId = enrolled.json().state.enrollmentId as string;
    const begin = async (key: string, kind: "activity" | "assessment") => {
      const result = await post("attempts", { enrollmentId, clientAttemptId: v2Id(serial++), target: { kind, key }, expectedEnrollmentVersion: 1 }, undefined, "other");
      expect(result.statusCode, result.body).toBe(200); return result.json().attempt;
    };
    for (const objective of route.objectives) {
      const key = `${objective.key}-learn`, attempt = await begin(key, "activity");
      expect((await post(`attempts/${attempt.attemptId}/responses`, { activityKey: key, answer: { kind: "single_choice", optionKey: "yes" }, confidence: null, expectedVersion: 1 }, undefined, "other")).statusCode).toBe(200);
      expect((await post(`attempts/${attempt.attemptId}/complete`, { expectedVersion: 2 }, undefined, "other")).statusCode).toBe(200);
    }
    const attempt = await begin("final-test", "assessment");
    const frozen = (await pg.query<{ snapshot_json: { assessmentSelection: { selectionHash: string; segments: { items: unknown[] }[] } } }>(
      "select snapshot_json from learning_v2_attempts where id=$1", [attempt.attemptId])).rows[0]!.snapshot_json.assessmentSelection;
    expect(frozen.selectionHash).toMatch(/^[a-f0-9]{64}$/); expect(frozen.segments.map((segment) => segment.items.length)).toEqual([10, 2]);
    let key = attempt.activeActivity.key as string;
    for (let i = 0; i < 12; i++) {
      const response = await post(`attempts/${attempt.attemptId}/responses`, { activityKey: key, answer: { kind: "single_choice", optionKey: "yes" }, confidence: null, expectedVersion: i + 1 }, undefined, "other");
      expect(response.statusCode, response.body).toBe(200);
      const value = V2HttpContracts.attemptResponse.response.parse(response.json());
      expect(value.feedback.explanation).toBe(i === 9 || i === 11 ? "PRIVATE_FEEDBACK" : "");
      if (i < 9) { expect(response.body).not.toContain("PRIVATE_FEEDBACK"); expect(response.body).not.toContain("PRIVATE_SOURCE_FEEDBACK"); }
      if (i === 9) expect(value.attempt.acceptedResponses.filter((item) => item.feedback.explanation)).toHaveLength(10);
      if (i === 9 || i === 11) expect(value.feedback.sources?.[0]?.excerpt).toBe("PRIVATE_SOURCE_FEEDBACK");
      if (i === 10) { expect(value.attempt.acceptedResponses[10]!.feedback.explanation).toBe(""); expect(value.attempt.acceptedResponses[10]!.feedback.sources).toEqual([]); }
      key = value.nextStep?.key ?? "";
    }
    const completed = await post(`attempts/${attempt.attemptId}/complete`, { expectedVersion: 13 }, undefined, "other");
    expect(completed.statusCode).toBe(200); expect(completed.json().state.completedActivities).toBe(12);
  });
});
describe("T021 application registration and same-origin transport", () => {
  it("config defaults are closed and flags are enforced in buildApp", async () => {
    const environment = readEnvironment({ NODE_ENV: "test", GUIDED_LEARNING_ENABLED: "true" });
    expect(environment.guidedLearningV2Enabled).toBe(false); expect(environment.guidedLearningV2NewEnrollments).toBe(false);
    let called = false;
    const app = await buildApp(environment, { identityProvider: identity, guidedLearningV2Provider: { invoke: async () => { called = true; return { status: "not_found" }; } } });
    try { expect((await app.inject({ url: "/v2/guided-learning/home", headers: { authorization: "Bearer learner" } })).statusCode).toBe(404); expect(called).toBe(false); }
    finally { await app.close(); }
  });
  it("executes the new BFF and existing forwarder with real origin checks and cookie/header propagation", async () => {
    // Load the actual Next source with framework/session adapters; no source-string assertions.
    async function load(file: string, imports: Record<string, unknown>): Promise<Record<string, (...args: unknown[]) => Promise<Response>>> {
      const source = await readFile(new URL(file, import.meta.url), "utf8");
      const module = { exports: {} };
      runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
        { module, exports: module.exports, URL, Response, Request, require: (name: string) => {
          if (!(name in imports)) throw new Error(`Unexpected BFF dependency ${name}`); return imports[name];
        } });
      return module.exports;
    }
    const origin = await load("../../web/src/lib/request-origin.ts", {});
    const calls: unknown[] = [];
    const next = { NextResponse: { json: Response.json } };
    const forwarder = await load("../../web/src/lib/server/guided-learning-route.ts", { "server-only": {}, "next/server": next,
      "./api-session": { getApiRequestCookie: async () => ({ status: "authenticated", cookie: "session=fixture" }) },
      "./content-api": { getContentApiError: () => "unavailable", requestContentApi: async (input: unknown) => {
        calls.push(input); return { status: 200, body: { accepted: true, rowVersion: 1 } };
      } }, "../request-origin": origin });
    const route = await load("../../web/src/app/api/v2/guided-learning/[...path]/route.ts", { "@cediah/contracts": contracts,
      "next/server": next, "@/lib/server/guided-learning-route": forwarder });
    const url = `https://koraz.test/api/v2/guided-learning/attempts/${v2Id(50)}/heartbeat`;
    const context = { params: Promise.resolve({ path: ["attempts", v2Id(50), "heartbeat"] }) };
    const payload = { clientEventId: v2Id(51), visible: true, interactionAgeMs: 0 };
    const foreign = await route.POST!(new Request(url, { method: "POST", headers: { origin: "https://evil.test" }, body: JSON.stringify(payload) }), context);
    expect(foreign.status).toBe(403); expect(calls).toHaveLength(0);
    const response = await route.POST!(new Request(url, { method: "POST", headers: { origin: "https://koraz.test", "Idempotency-Key": v2Id(52) }, body: JSON.stringify(payload) }), context);
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(calls[0]).toMatchObject({ cookie: "session=fixture", path: `/v2/guided-learning/attempts/${v2Id(50)}/heartbeat`,
      headers: { "Idempotency-Key": v2Id(52) }, body: payload });
    const malformed = await route.GET!(new Request(url), { params: Promise.resolve({ path: ["attempts", "invalid"] }) });
    expect(malformed.status).toBe(404); expect(calls).toHaveLength(1);
    const card = { id: v2Id(4), slug: "http-route", title: "Fixture", summary: "", coverKey: "heart", unitCount: 1 };
    const transport = await load("../../web/src/lib/server/guided-learning-api.ts", { "server-only": {}, "@cediah/contracts": contracts,
      "./api-session": { getApiRequestCookie: async () => ({ status: "authenticated", cookie: "session=fixture" }) },
      "./content-api": { requestContentApi: async ({ path }: { path: string }) => ({ status: 200, body: { items: [path.startsWith("/v1/")
        ? { ...card, enrollment: null, estimatedMinutes: 5, topic: { id: v2Id(3), title: "Tema" } }
        : { ...card, engineVersion: "guided-v2", policyVersion: "guided-v2.0", pathVersionId: v2Id(6), enrollmentId: v2Id(8), topicLabel: "Tema", completed: false, mastered: false, consolidated: false }], nextCursor: null } }) } });
    const mixed = await transport.getLearningCatalogByEngine!() as unknown as { status: string; items: { engineVersion: string }[] };
    expect(mixed.status).toBe("ready"); expect(mixed.items).toHaveLength(1); expect(mixed.items[0]!.engineVersion).toBe("guided-v2");
  });
});
