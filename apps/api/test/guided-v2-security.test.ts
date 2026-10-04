import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { readFile, readdir, writeFile } from "node:fs/promises";
import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Kysely, PostgresDialect, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler, type CompiledQuery, type DatabaseConnection, type QueryResult } from "kysely";
import { RoutePackageSchema, V2HttpContracts, type ContentProvider, type IdentityProvider, type PlatformRole } from "@cediah/contracts";
import type { PGlite } from "@electric-sql/pglite";
import type { CediahDatabase } from "../src/db/database.js";
import { registerGuidedV2Routes, createGuidedV2HttpProvider } from "../src/guided-learning/v2/routes.js";
import { registerGuidedV2EditorImportRoutes } from "../src/guided-learning/v2/editor-routes.js";
import { createPostgresGuidedLearningV2Provider } from "../src/providers/postgres-guided-learning-v2.js";
import { createGuidedV2Database, seedGuidedV2Runtime, v2Id } from "./helpers/guided-v2-db.js";
import { buildApp } from "../src/app.js";
import { readEnvironment } from "../src/config.js";
import { registerGuidedLearningRoutes } from "../src/guided-learning/routes.js";
import { registerGuidedLearningEditorRoutes } from "../src/guided-learning/editor-routes.js";
import { createPostgresGuidedLearningProvider } from "../src/providers/postgres-guided-learning.js";
const identity = { getUser: async (request: { authorization?: string; cookie?: string }) => {
  const token = request.authorization ?? request.cookie;
  return token && !token.includes("expired") ? { id: token.includes("other") ? v2Id(2) : v2Id(1) } : null;
} } as unknown as IdentityProvider;
function fixture() {
  const base = { objectiveKey: "core", relatedObjectiveKeys: [], phase: "retrieve", required: true, sourceKeys: [], representation: "text",
    hints: ["PRIVATE_HINT"], use: "learning", prompt: "Pregunta", feedback: { explanation: "PRIVATE_FEEDBACK", commonError: "PRIVATE_ERROR", sourceKeys: [] },
    misconceptionMappings: [], alternativeActivityKey: null, kind: "single_choice", payload: { correctKey: "yes", options: [{ key: "yes", text: "Sí" }, { key: "no", text: "No" }], distractorFeedback: { no: "Revisa la relación" } } };
  const choices = ["a", "b", "apply", "final-a", "final-b", "seven", "thirty", "diagnostic"].map((key) => ({ ...base, key, equivalenceKey: key,
    phase: key === "apply" ? "apply" : "retrieve", representation: ["apply", "final-a", "final-b"].includes(key) ? "diagram" : "text",
    use: key.startsWith("final") ? "final" : key === "seven" ? "retention7" : key === "thirty" ? "retention30" : key === "diagnostic" ? "diagnostic" : "learning" }));
  const activities = [{ ...base, key: "learn", equivalenceKey: "learn", phase: "learn", kind: "study", payload: { body: "Explicación", scaffold: "explanation", focusSpans: [], assetKey: null, videoRange: null } }, ...choices,
    { ...base, key: "constructed", equivalenceKey: "constructed", required: true, kind: "constructed_response", payload: { rubric: [{ key: "reason", criterion: "PRIVATE_RUBRIC", example: "PRIVATE_EXAMPLE" }], modelAnswer: "PRIVATE_MODEL", verificationActivityKey: "a" } }];
  return RoutePackageSchema.parse({ schemaVersion: "2.0", packageKey: "http", revision: 1, locale: "es", policyVersion: "guided-v2.0",
    route: { slug: "http-route", title: "Versión fijada", summary: "Fixture", topicLabel: "Tema", audience: "Alumno", discipline: "general", coverKey: "heart" }, sources: [], assets: [],
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
describe("T022 endpoint authorization and privacy", () => {
  let pg: PGlite, database: Kysely<CediahDatabase>, app: ReturnType<typeof Fastify>;
  let serial = 80000, attemptId: string;
  let roles: PlatformRole[] = ["student"];
  const post = (path: string, payload: unknown, actor = "learner", key = v2Id(serial++)) => app.inject({
    method: "POST", url: path, payload, headers: { authorization: `Bearer ${actor}`, "idempotency-key": key },
  });
  const get = (path: string, actor = "learner") => app.inject({ url: path, headers: { authorization: `Bearer ${actor}` } });
  beforeAll(async () => {
    pg = await createGuidedV2Database(); await seedGuidedV2Runtime(pg);
    await pg.query("update content_items set status='published',catalog_visibility='catalog',published_at=now(),published_by=$2 where id=$1", [v2Id(3), v2Id(1)]);
    await pg.query("update learning_path_versions set definition_v2_json=$1 where id=$2", [JSON.stringify(fixture()), v2Id(6)]);
    await pg.query("insert into learning_v2_bindings(path_version_id,local_key,kind,topic_content_id) values($1,'topic','topic',$2)", [v2Id(6), v2Id(3)]);
    await pg.query("insert into content_assets(id,content_item_id,owner_user_id,kind,storage_bucket,storage_path,original_file_name,mime_type,size_bytes,status,finalized_at) values($1,$2,$3,'image','test-assets','private-diagram','diagram.png','image/png',100,'ready',now())", [v2Id(10), v2Id(3), v2Id(1)]);
    await pg.query("insert into learning_v2_bindings(path_version_id,local_key,kind,asset_id,rights_status,rights_credit) values($1,'diagram','asset',$2,'owned','')", [v2Id(6), v2Id(10)]);
    await pg.query("update learning_path_versions set status='published',published_at=now(),published_by=$2 where id=$1", [v2Id(6), v2Id(1)]);
    await pg.query("update learning_paths set slug='http-route',published_version_id=$1 where id=$2", [v2Id(6), v2Id(4)]);
    database = databaseFor(pg); app = Fastify();
    app.get("/v1/auth/me", async () => ({ features: { guidedLearning: true, guidedLearningMap: false }, roles: ["student"], user: { id: v2Id(1), email: "t022-browser@example.test" } }));
    await registerGuidedV2Routes(app, { identityProvider: identity, flags: { enabled: true, newEnrollments: true }, provider: createGuidedV2HttpProvider(database) });
    await registerGuidedV2EditorImportRoutes(app, { identityProvider: identity,
      contentProvider: { getRoles: async () => roles } as unknown as ContentProvider,
      provider: createPostgresGuidedLearningV2Provider(database) });
    const legacy = createPostgresGuidedLearningProvider(database);
    await registerGuidedLearningRoutes(app, { identityProvider: identity, provider: legacy });
    await registerGuidedLearningEditorRoutes(app, { identityProvider: identity, provider: legacy,
      contentProvider: { getRoles: async () => roles } as unknown as ContentProvider });
    const intro = await post("/v2/guided-learning/attempts", { clientAttemptId: v2Id(serial++), enrollmentId: v2Id(8), target: { kind: "activity", key: "learn" }, expectedEnrollmentVersion: 1 });
    expect(intro.statusCode, intro.body).toBe(200);
    const introId = intro.json().attempt.attemptId;
    expect((await post(`/v2/guided-learning/attempts/${introId}/responses`, { activityKey: "learn", answer: { kind: "study", acknowledged: true }, confidence: null, expectedVersion: 1 })).statusCode).toBe(200);
    expect((await post(`/v2/guided-learning/attempts/${introId}/complete`, { expectedVersion: 2 })).statusCode).toBe(200);
    const created = await post("/v2/guided-learning/attempts", { clientAttemptId: v2Id(serial++), enrollmentId: v2Id(8), target: { kind: "activity", key: "a" }, expectedEnrollmentVersion: 1 });
    expect(created.statusCode, created.body).toBe(200); attemptId = created.json().attempt.attemptId;
  }, 120000);
  afterAll(async () => { await app?.close(); await database?.destroy(); await pg?.close(); });
  const path = (suffix = "") => `/v2/guided-learning/attempts/${attemptId}${suffix}`;
  it("S02 denies every foreign attempt/enrollment operation without writes or resource details", async () => {
    const before = await pg.query("select row_version,status,resume_json from learning_v2_attempts where id=$1", [attemptId]);
    const requests = [
      () => get(path(), "other"),
      () => get(`/v2/guided-learning/enrollments/${v2Id(8)}/state`, "other"),
      () => get(`/v2/guided-learning/enrollments/${v2Id(8)}/upgrade`, "other"),
      () => post(`/v2/guided-learning/enrollments/${v2Id(8)}/upgrade`, { targetVersionId: v2Id(7), expectedVersion: 1, acknowledgedReset: true }, "other"),
      () => post("/v2/guided-learning/attempts", { clientAttemptId: v2Id(serial++), enrollmentId: v2Id(8), target: { kind: "activity", key: "a" }, expectedEnrollmentVersion: 1 }, "other"),
      () => post(path("/help"), { activityKey: "a", kind: "source", expectedVersion: 1 }, "other"),
      () => post(path("/responses"), { activityKey: "a", answer: { kind: "single_choice", optionKey: "yes" }, confidence: null, expectedVersion: 1 }, "other"),
      () => post(path("/complete"), { expectedVersion: 1 }, "other"),
      () => post(path("/heartbeat"), { clientEventId: v2Id(serial++), visible: true, interactionAgeMs: 0 }, "other"),
      () => post(path("/feedback-viewed"), { activityKey: "a", acknowledged: true }, "other"),
    ];
    for (const request of requests) {
      const response = await request(); expect(response.statusCode, response.body).toBe(404);
      expect(response.json()).toEqual({ error: "not_found" }); expect(response.headers["cache-control"]).toBe("private, no-store");
    }
    expect(await pg.query("select row_version,status,resume_json from learning_v2_attempts where id=$1", [attemptId])).toEqual(before);
    expect((await pg.query("select count(*)::int as n from learning_v2_responses where attempt_id=$1", [attemptId])).rows).toEqual([{ n: 0 }]);
  });
  it("S03 allowlists nested learner DTOs and blocks reveal before submission", async () => {
    for (const url of [path(), "/v2/guided-learning/paths/http-route", "/v2/guided-learning/paths", "/v2/guided-learning/home", `/v2/guided-learning/enrollments/${v2Id(8)}/state`]) {
      const response = await get(url); expect(response.statusCode, response.body).toBe(200);
      for (const privateKey of ["correctKey", "PRIVATE_HINT", "PRIVATE_FEEDBACK", "PRIVATE_ERROR", "definition_v2_json", "snapshot_json", "rubric", "acceptedAnswers", "final-a", "seven", "thirty"]) expect(response.body).not.toContain(privateKey);
    }
    const response = await post(path("/help"), { activityKey: "a", kind: "reveal", expectedVersion: 1 });
    expect(response.statusCode, response.body).toBe(409);
    expect((await pg.query("select row_version from learning_v2_attempts where id=$1", [attemptId])).rows).toEqual([{ row_version: 1 }]);
  });
  it.skipIf(process.env.KORAZ_T022_BROWSER !== "true")("S03 browser inspects real production Next SSR and authenticated BFF network before answering", async () => {
    const webDirectory = fileURLToPath(new URL("../../web/", import.meta.url));
    const requireWeb = createRequire(new URL("../../web/package.json", import.meta.url));
    const { chromium } = requireWeb("@playwright/test");
    const apiUrl = await app.listen({ host: "127.0.0.1", port: 33023 });
    const webUrl = "http://127.0.0.1:33022";
    const child = spawn(process.execPath, [requireWeb.resolve("next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", "33022"], { cwd: webDirectory, windowsHide: true, env: { ...process.env, API_BASE_URL: apiUrl } });
    let output = ""; child.stdout.on("data", (chunk) => { output += chunk.toString(); }); child.stderr.on("data", (chunk) => { output += chunk.toString(); });
    const secrets = ["PRIVATE_HINT", "PRIVATE_FEEDBACK", "PRIVATE_ERROR", "definition_v2_json", "snapshot_json", '"correctKey":', '"acceptedAnswers":', '"rubric":', '"polygons":', '"key":"final-a"', '"key":"seven"', '"key":"thirty"'];
    let browser;
    try {
      let ready = false;
      for (let n = 0; n < 80; n++) {
        if (child.exitCode !== null) throw new Error("Next production server stopped before readiness");
        try { const response = await fetch(webUrl + "/acceder"); if (response.ok) { ready = true; break; } } catch { /* bounded startup */ }
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      expect(ready).toBe(true);
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      await context.addCookies([{ name: "t022", value: "learner", url: webUrl }]);
      const page = await context.newPage();
      const response = await page.goto(webUrl + `/aprendizaje/sesiones/${attemptId}`);
      expect(response?.status()).toBe(200);
      const html = await response!.text();
      await writeFile(new URL("../../../docs/aprendizaje-guiado/v2/evidencias/T022/browser-ssr.html", import.meta.url), html);
      await page.getByRole("heading", { name: "404", exact: true }).waitFor({ timeout: 15000 });
      const dom = await page.content();
      expect(page.url()).not.toContain("acceder");
      await writeFile(new URL("../../../docs/aprendizaje-guiado/v2/evidencias/T022/browser-dom.html", import.meta.url), dom);
      expect(html).toContain("NEXT_HTTP_ERROR_FALLBACK;404");
      for (const secret of secrets) { expect(html).not.toContain(secret); expect(dom).not.toContain(secret); }
      const urls = [`/api/v2/guided-learning/attempts/${attemptId}`, "/api/v2/guided-learning/paths/http-route", "/api/v2/guided-learning/paths", "/api/v2/guided-learning/home"];
      const captured = [];
      for (const url of urls) {
        const network = await page.evaluate(async (endpoint: string) => { const result = await fetch(endpoint); return { status: result.status, cache: result.headers.get("cache-control"), body: await result.text() }; }, url);
        expect(network.status, network.body).toBe(200); expect(network.cache).toBe("private, no-store");
        for (const secret of secrets) expect(network.body).not.toContain(secret);
        captured.push({ url, ...network });
      }
      await page.screenshot({ path: fileURLToPath(new URL("../../../docs/aprendizaje-guiado/v2/evidencias/T022/browser-ssr.png", import.meta.url)), fullPage: true });
      await writeFile(new URL("../../../docs/aprendizaje-guiado/v2/evidencias/T022/browser-network-completion.json", import.meta.url), JSON.stringify({ result: "PASS", identity: "synthetic local test adapter", server: "real production Next build", ssrBoundary: "Current v1 session renderer rejects v2 attempts; v2 renderer belongs to T028-T033", htmlBytes: html.length, captured }, null, 2));
    } finally {
      await browser?.close(); child.kill();
      await writeFile(new URL("../../../docs/aprendizaje-guiado/v2/evidencias/T022/next-production-completion.txt", import.meta.url), output);
    }
  }, 120000);
  it("S01 rejects students at every available editorial endpoint", async () => {
    const requests = [
      () => get(`/v2/editor/learning-paths/${v2Id(4)}`),
      () => post("/v2/editor/learning-paths", {}),
      () => app.inject({ method: "PATCH", url: `/v2/editor/learning-paths/${v2Id(4)}`, payload: {}, headers: { authorization: "Bearer learner", "idempotency-key": v2Id(serial++) } }),
      () => post(`/v2/editor/learning-paths/${v2Id(4)}/preview`, {}),
      () => post(`/v2/editor/learning-paths/${v2Id(4)}/convert-v1`, { expectedVersion: 1 }),
      () => get(`/v2/editor/learning-paths/${v2Id(4)}/export`),
      () => post("/v2/editor/learning-paths/imports/validate", {}),
      () => post(`/v2/editor/learning-paths/imports/${v2Id(99)}/commit`, {}),
      () => post(`/v2/editor/learning-paths/${v2Id(4)}/validate`, { expectedVersion: 1 }),
      () => post(`/v2/editor/learning-paths/${v2Id(4)}/transition`, { expectedVersion: 1, status: "published", reviewNote: "" }),
      () => post(`/v2/editor/learning-paths/${v2Id(4)}/versions`, { expectedVersion: 1, releaseNotes: "" }),
    ];
    for (const request of requests) {
      const response = await request(); expect(response.statusCode).toBe(403);
      expect(response.json()).toEqual({ error: "forbidden" }); expect(response.headers["cache-control"]).toBe("private, no-store");
    }
  });
  it("S01 creator cannot export, validate, version or publish another creator's route", async () => {
    roles = ["content_creator"];
    for (const response of [
      await get(`/v2/editor/learning-paths/${v2Id(4)}/export`, "other"),
      await post(`/v2/editor/learning-paths/${v2Id(4)}/validate`, { expectedVersion: 1 }, "other"),
      await post(`/v2/editor/learning-paths/${v2Id(4)}/transition`, { expectedVersion: 1, status: "published", reviewNote: "Review" }, "other"),
      await post(`/v2/editor/learning-paths/${v2Id(4)}/versions`, { expectedVersion: 1, releaseNotes: "Other" }, "other"),
    ]) { expect([403, 404]).toContain(response.statusCode); expect(["forbidden", "not_found"]).toContain(response.json().error); }
    roles = ["student"];
  });
  it("S01 editorial create/read/patch enforce ownership, strict inputs and idempotent CAS", async () => {
    roles = ["content_creator"];
    try {
      const pkg = fixture(); pkg.route.slug = "t022-editor-draft"; pkg.packageKey = "t022-editor-draft";
      const body = { package: pkg, bindings: { topicContentId: v2Id(3), sources: [], assets: [] } };
      const key = v2Id(serial++);
      const create = () => app.inject({ method: "POST", url: "/v2/editor/learning-paths", payload: body, headers: { authorization: "Bearer learner", "idempotency-key": key } });
      const created = await create(); expect(created.statusCode, created.body).toBe(200);
      expect((await create()).json()).toEqual(created.json());
      const id = created.json().pathId;
      expect((await get(`/v2/editor/learning-paths/${id}`, "other")).statusCode).toBe(404);
      const patchKey = v2Id(serial++); const changed = structuredClone(body); changed.package.route.title = "Edición segura";
      const patch = (token = "learner", payload: unknown = { ...changed, expectedVersion: 1 }) => app.inject({ method: "PATCH", url: `/v2/editor/learning-paths/${id}`, payload, headers: { authorization: `Bearer ${token}`, "idempotency-key": patchKey } });
      expect((await patch("other")).statusCode).toBe(404);
      const saved = await patch(); expect(saved.statusCode, saved.body).toBe(200); expect(saved.json().route.editVersion).toBe(2);
      expect((await patch()).json()).toEqual(saved.json());
      expect((await patch("learner", { ...changed, expectedVersion: 1, role: "administrator" })).statusCode).toBe(400);
      const read = await get(`/v2/editor/learning-paths/${id}`); expect(read.json().route.definition.route.title).toBe("Edición segura");
      const denied = structuredClone(body); denied.package.route.slug = "t022-denied-draft"; denied.bindings.topicContentId = v2Id(999);
      expect((await post("/v2/editor/learning-paths", denied)).statusCode).toBe(422);
      const hostile = structuredClone(body); hostile.package.editorial.notes = "<script>PRIVATE_SECRET</script>";
      expect((await post("/v2/editor/learning-paths", hostile)).statusCode).toBe(400);
    } finally { roles = ["student"]; }
  });
  it("S01/S05 preview rejects foreign actors, hides solutions/reserves and enforces durable 30/10min without learner writes", async () => {
    roles = ["content_creator"];
    try {
      const url = `/v2/editor/learning-paths/${v2Id(4)}/preview`;
      const body = { package: fixture(), bindings: { topicContentId: v2Id(3), sources: [], assets: [] } };
      const before = (await pg.query("select (select count(*) from learning_enrollments)::int enrollments, (select count(*) from learning_v2_attempts)::int attempts, (select count(*) from learning_v2_responses)::int responses, (select count(*) from learning_events)::int events, (select count(*) from learning_rewards)::int rewards")).rows;
      expect((await post(url, body, "other")).statusCode).toBe(404);
      const key = v2Id(serial++);
      const preview = await app.inject({ method: "POST", url, payload: body, headers: { authorization: "Bearer learner", "idempotency-key": key } });
      expect(preview.statusCode, preview.body).toBe(200);
      for (const secret of ["PRIVATE_HINT", "PRIVATE_FEEDBACK", "correctKey", "final-a", "seven", "thirty"]) expect(preview.body).not.toContain(secret);
      const retry = await app.inject({ method: "POST", url, payload: body, headers: { authorization: "Bearer learner", "idempotency-key": key } });
      expect(retry.json()).toEqual(preview.json());
      for (let i = 1; i < 30; i++) expect((await post(url, body)).statusCode).toBe(200);
      expect((await post(url, body)).statusCode).toBe(429);
      const after = (await pg.query("select (select count(*) from learning_enrollments)::int enrollments, (select count(*) from learning_v2_attempts)::int attempts, (select count(*) from learning_v2_responses)::int responses, (select count(*) from learning_events)::int events, (select count(*) from learning_rewards)::int rewards")).rows;
      expect(after).toEqual(before);
    } finally { roles = ["student"]; }
  });
  it("S08 deferred conversion stays closed after ownership/CAS checks and preserves v1", async () => {
    roles = ["content_creator"];
    try {
      const oldPath = v2Id(801), oldVersion = v2Id(802);
      await pg.query("insert into learning_paths(id,topic_content_id,slug,title,summary,cover_key,created_by) values($1,$2,'t022-legacy','Ruta antigua','Ruta sintética','heart',$3)", [oldPath, v2Id(3), v2Id(1)]);
      await pg.query("insert into learning_path_versions(id,path_id,version_number,policy_version,policy_json) values($1,$2,1,'guided-v1.0','{}')", [oldVersion, oldPath]);
      const before = (await pg.query("select * from learning_path_versions where id=$1", [oldVersion])).rows;
      const url = `/v2/editor/learning-paths/${oldPath}/convert-v1`;
      expect((await post(url, { expectedVersion: 1 }, "other")).statusCode).toBe(404);
      expect((await post(url, { expectedVersion: 2 })).statusCode).toBe(409);
      const key = v2Id(serial++), request = { method: "POST" as const, url, payload: { expectedVersion: 1 }, headers: { authorization: "Bearer learner", "idempotency-key": key } };
      const converted = await app.inject(request); expect(converted.statusCode, converted.body).toBe(409);
      expect(converted.json()).toEqual({ error: "conflict" });
      expect((await app.inject(request)).json()).toEqual(converted.json());
      expect((await pg.query("select * from learning_path_versions where id=$1", [oldVersion])).rows).toEqual(before);
      expect((await pg.query("select count(*)::int n from learning_path_versions where path_id=$1", [oldPath])).rows).toEqual([{ n: 1 }]);
    } finally { roles = ["student"]; }
  });
  it("S01/S07 full application mounts every editorial endpoint and checks flags/origin before storage", async () => {
    const provider = createPostgresGuidedLearningV2Provider(database);
    const content = { getRoles: async () => ["content_creator"] } as unknown as ContentProvider;
    const live = await buildApp(readEnvironment({ NODE_ENV: "test", GUIDED_LEARNING_ENABLED: "true", GUIDED_LEARNING_V2_ENABLED: "true" }), { identityProvider: identity, contentProvider: content, guidedLearningV2EditorProvider: provider });
    try {
      expect((await live.inject({ url: `/v2/editor/learning-paths/${v2Id(4)}`, headers: { authorization: "Bearer other" } })).statusCode).toBe(404);
      const cross = await live.inject({ method: "POST", url: `/v2/editor/learning-paths/${v2Id(4)}/preview`, payload: {}, headers: { origin: "https://hostile.example", cookie: "session=learner", "idempotency-key": v2Id(serial++) } });
      expect(cross.statusCode).toBe(403); expect(cross.headers["cache-control"]).toBe("private, no-store");
      const expired = await live.inject({ url: `/v2/editor/learning-paths/${v2Id(4)}`, headers: { authorization: "Bearer expired" } });
      expect(expired.statusCode).toBe(401);
    } finally { await live.close(); }
    const disabled = await buildApp(readEnvironment({ NODE_ENV: "test", GUIDED_LEARNING_ENABLED: "true", GUIDED_LEARNING_V2_ENABLED: "false" }), { identityProvider: identity, contentProvider: content, guidedLearningV2EditorProvider: provider });
    try { expect((await disabled.inject({ url: `/v2/editor/learning-paths/${v2Id(4)}`, headers: { authorization: "Bearer learner" } })).statusCode).toBe(404); } finally { await disabled.close(); }
  });
  it("S05 rejects forged identity/score/status and unknown request keys", async () => {
    for (const extra of [{ userId: v2Id(2) }, { score01: 1 }, { role: "administrator" }, { status: "completed" }]) {
      expect((await post(path("/responses"), { activityKey: "a", answer: { kind: "single_choice", optionKey: "yes" }, confidence: null, expectedVersion: 1, ...extra })).statusCode).toBe(400);
    }
    expect((await post(path("/responses"), { text: "x".repeat(1024 * 1024) })).statusCode).toBe(413);
    roles = ["content_creator"];
    expect((await post("/v2/editor/learning-paths/imports/validate", { package: "x".repeat(10 * 1024 * 1024 + 1) })).statusCode).toBe(413);
    roles = ["student"];
  });
  it("S08 legacy enroll, edit and delete reject v2 identities without changing data", async () => {
    expect((await post("/v1/guided-learning/enrollments", { pathId: v2Id(4) })).json()).toEqual({ error: "engine_version_mismatch" });
    roles = ["content_creator"];
    expect((await get(`/v1/editor/learning-paths/${v2Id(4)}`)).json()).toEqual({ error: "engine_version_mismatch" });
    const deleted = await app.inject({ method: "DELETE", url: `/v1/editor/learning-paths/${v2Id(4)}`, payload: { expectedVersion: 1 }, headers: { authorization: "Bearer learner" } });
    expect(deleted.statusCode).toBe(409); expect(deleted.json()).toEqual({ error: "engine_version_mismatch" });
    expect((await pg.query("select id from learning_paths where id=$1", [v2Id(4)])).rows).toHaveLength(1);
    expect((await pg.query("select id from learning_enrollments where path_id=$1", [v2Id(4)])).rows).toHaveLength(2);
    roles = ["student"];
  });
  it("S05 rejects active markup, local URLs and imported capabilities without persisting a route", async () => {
    roles = ["content_creator"];
    const before = (await pg.query("select id from learning_paths order by id")).rows;
    for (const pkg of [
      { ...fixture(), editorial: { notes: "<script>alert('private')</script>", unresolvedIssues: [] } },
      { ...fixture(), role: "administrator", status: "published" },
      { ...fixture(), sources: [{ key: "source", kind: "reference", title: "Source", citation: "Source", url: "file:///private", documentSha256: "a".repeat(64), locator: { heading: "Reference", sectionPath: [], page: null }, excerpt: "", verification: "provided", checkedAt: null }] },
    ]) {
      const response = await post("/v2/editor/learning-paths/imports/validate", { package: pkg, bindings: { topicContentId: v2Id(3), sources: [], assets: [] }, targetPathId: null, expectedVersion: null });
      expect(response.statusCode, response.body).toBe(400);
      if (pkg.sources.length) expect(response.json().fieldErrors).toEqual([{ path: "package.sources.0.url", code: "custom" }]);
    }
    expect((await pg.query("select id from learning_paths order by id")).rows).toEqual(before);
    roles = ["student"];
  });
  it("validate-import enforces 10/10 minutes and permits idempotent replays", async () => {
    roles = ["content_creator"];
    const firstKey = v2Id(serial++);
    const body = (revision: number) => ({ package: { ...fixture(), packageKey: `rate-${revision}`, revision }, bindings: { topicContentId: v2Id(3), sources: [], assets: [] }, targetPathId: null, expectedVersion: null });
    for (let i = 1; i <= 10; i++) expect((await post("/v2/editor/learning-paths/imports/validate", body(i), "learner", i === 1 ? firstKey : v2Id(serial++))).statusCode).toBe(200);
    expect((await post("/v2/editor/learning-paths/imports/validate", body(11))).statusCode).toBe(429);
    expect((await post("/v2/editor/learning-paths/imports/validate", body(1), "learner", firstKey)).statusCode).toBe(200);
    roles = ["student"];
  });
  it("S04 revocation blocks new deliveries and replays, preserves accepted answers", async () => {
    const key = v2Id(serial++), payload = { activityKey: "a", answer: { kind: "single_choice", optionKey: "yes" }, confidence: null, expectedVersion: 1 };
    expect((await post(path("/responses"), payload, "learner", key)).statusCode).toBe(200);
    const before = (await pg.query("select * from learning_v2_responses where attempt_id=$1", [attemptId])).rows;
    await pg.query("update content_items set catalog_visibility='guided_only' where id=$1", [v2Id(3)]);
    for (const response of [await get(path()), await post(path("/responses"), payload, "learner", key), await post(path("/help"), { activityKey: "a", kind: "source", expectedVersion: 2 })]) {
      expect(response.statusCode, response.body).toBe(403); expect(response.json()).toEqual({ error: "access_revoked" });
      expect(response.body).not.toContain("PRIVATE_FEEDBACK");
    }
    expect((await get("/v2/guided-learning/paths/http-route")).statusCode).toBe(404);
    expect((await pg.query("select * from learning_v2_responses where attempt_id=$1", [attemptId])).rows).toEqual(before);
    await pg.query("update content_items set catalog_visibility='catalog' where id=$1", [v2Id(3)]);
  });
  it("S03 constructed reveal requires submitted text and preserves the formatively authorized flow", async () => {
    for (const key of ["b", "apply"]) {
      const started = await post("/v2/guided-learning/attempts", { clientAttemptId: v2Id(serial++), enrollmentId: v2Id(8), target: { kind: "activity", key }, expectedEnrollmentVersion: 1 });
      expect(started.statusCode, started.body).toBe(200);
      const id = started.json().attempt.attemptId;
      expect((await post(`/v2/guided-learning/attempts/${id}/responses`, { activityKey: key, answer: { kind: "single_choice", optionKey: "yes" }, confidence: null, expectedVersion: 1 })).statusCode).toBe(200);
      expect((await post(`/v2/guided-learning/attempts/${id}/complete`, { expectedVersion: 2 })).statusCode).toBe(200);
    }
    const created = await post("/v2/guided-learning/attempts", { clientAttemptId: v2Id(serial++), enrollmentId: v2Id(8), target: { kind: "activity", key: "constructed" }, expectedEnrollmentVersion: 1 });
    expect(created.statusCode, created.body).toBe(200);
    const id = created.json().attempt.attemptId;
    expect(created.body).not.toMatch(/PRIVATE_MODEL|PRIVATE_RUBRIC|PRIVATE_EXAMPLE/);
    const help = (expectedVersion: number) => post(`/v2/guided-learning/attempts/${id}/help`, { activityKey: "constructed", kind: "reveal", expectedVersion });
    expect((await help(1)).statusCode).toBe(409);
    const text = await post(`/v2/guided-learning/attempts/${id}/responses`, { activityKey: "constructed", answer: { kind: "constructed_response", text: "Mi razonamiento", selfRating: null }, confidence: null, expectedVersion: 1 });
    expect(text.statusCode).toBe(200); expect(text.json().accepted).toBe(false);
    const submittedReload = await get(`/v2/guided-learning/attempts/${id}`);
    expect(submittedReload.json().attempt.constructedResponse).toEqual({ activityKey: "constructed", stage: "submitted", text: "Mi razonamiento" });
    expect(submittedReload.body).not.toMatch(/PRIVATE_MODEL|PRIVATE_RUBRIC|PRIVATE_EXAMPLE|modelAnswer|rubric/);
    expect((await get(`/v2/guided-learning/attempts/${id}`, "other")).statusCode).toBe(404);
    const revealed = await help(2); expect(revealed.statusCode, revealed.body).toBe(200); expect(revealed.body).toContain("PRIVATE_MODEL");
    const revealedReload = await get(`/v2/guided-learning/attempts/${id}`);
    expect(revealedReload.json().attempt.constructedResponse).toEqual({ activityKey: "constructed", stage: "revealed", text: "Mi razonamiento", modelAnswer: "PRIVATE_MODEL", rubric: [{ key: "reason", criterion: "PRIVATE_RUBRIC", example: "PRIVATE_EXAMPLE" }] });
    const before = (await pg.query("select id from learning_v2_responses where attempt_id=$1", [id])).rows;
    await pg.query("update content_assets set status='pending',finalized_at=null where id=$1", [v2Id(10)]);
    expect((await get(`/v2/guided-learning/attempts/${id}`)).json()).toEqual({ error: "access_revoked" });
    expect((await pg.query("select id from learning_v2_responses where attempt_id=$1", [id])).rows).toEqual(before);
    await pg.query("update content_assets set status='ready',finalized_at=now() where id=$1", [v2Id(10)]);
  });
  it("120/minute response budget survives provider recreation, allows exact retries and resets by server time", async () => {
    let clock = new Date();
    let provider = createGuidedV2HttpProvider(database, { now: () => clock });
    const start = await provider.invoke("attemptCreate", v2Id(2), {}, { clientAttemptId: v2Id(serial++), enrollmentId: v2Id(9), target: { kind: "activity", key: "learn" }, expectedEnrollmentVersion: 1 }, v2Id(serial++));
    expect(start.status).toBe("success");
    const otherId = V2HttpContracts.attemptCreate.response.parse("value" in start ? start.value : null).attempt.attemptId;
    const body = { activityKey: "learn", answer: { kind: "study", acknowledged: true }, confidence: null, expectedVersion: 999 };
    const firstKey = v2Id(serial++);
    for (let i = 0; i < 120; i++) {
      const result = await provider.invoke("attemptResponse", v2Id(2), { id: otherId }, body, i === 0 ? firstKey : v2Id(serial++));
      expect(result.status).toBe("version_conflict");
    }
    provider = createGuidedV2HttpProvider(database, { now: () => clock });
    expect((await provider.invoke("attemptResponse", v2Id(2), { id: otherId }, body, v2Id(serial++))).status).toBe("rate_limited");
    expect((await provider.invoke("attemptResponse", v2Id(2), { id: otherId }, body, firstKey)).status).toBe("version_conflict");
    expect((await provider.invoke("attemptResponse", v2Id(2), { id: otherId }, { ...body, expectedVersion: 2 }, firstKey)).status).toBe("rate_limited");
    clock = new Date(clock.getTime() + 60000);
    expect((await provider.invoke("attemptResponse", v2Id(2), { id: otherId }, body, v2Id(serial++))).status).toBe("version_conflict");
  }, 60000);
  it("S06 database roles cannot read private v2 tables; runtime has RLS and minimal grants", async () => {
    const tables = ["bindings", "imports", "attempts", "responses", "objective_state", "activity_state", "review_state"].map((name) => `learning_v2_${name}`);
    for (const role of ["anon", "authenticated"]) for (const table of tables) {
      await pg.exec(`set role ${role}`);
      try { await expect(pg.query(`select * from ${table}`)).rejects.toThrow(/permission denied/); }
      finally { await pg.exec("reset role"); }
    }
    await pg.exec("set role cediah_runtime");
    try {
      expect((await pg.query("select snapshot_json from learning_v2_attempts where id=$1", [attemptId])).rows).toHaveLength(1);
      await expect(pg.exec("delete from learning_v2_responses")).rejects.toThrow(/permission denied/);
    } finally { await pg.exec("reset role"); }
    const rls = await pg.query<{ relrowsecurity: boolean }>("select relrowsecurity from pg_class where relname=any($1)", [tables]);
    expect(rls.rows).toHaveLength(tables.length); expect(rls.rows.every((row) => row.relrowsecurity)).toBe(true);
  });
});

describe("T022 transport safeguards", () => {
  it("malformed editor DTOs fail without serializing schema or private field details", async () => {
    const app = Fastify();
    const malformed = async () => ({ status: "success", value: { PRIVATE_SOURCE: "SECRET_SOLUTION" } });
    await registerGuidedV2EditorImportRoutes(app, { identityProvider: identity,
      contentProvider: { getRoles: async () => ["content_creator"] } as unknown as ContentProvider,
      provider: { validateImport: malformed, commitImport: malformed, exportPath: malformed } as unknown as ReturnType<typeof createPostgresGuidedLearningV2Provider> });
    try {
      const headers = { authorization: "Bearer learner", "idempotency-key": v2Id(78) };
      const requests = [
        { method: "POST" as const, url: "/v2/editor/learning-paths/imports/validate", payload: { package: fixture(), bindings: { topicContentId: v2Id(3), sources: [], assets: [] }, targetPathId: null, expectedVersion: null } },
        { method: "POST" as const, url: `/v2/editor/learning-paths/imports/${v2Id(99)}/commit`, payload: { hash: "a".repeat(64), expectedVersion: null } },
        { method: "GET" as const, url: `/v2/editor/learning-paths/${v2Id(4)}/export` },
      ];
      for (const request of requests) {
        const response = await app.inject({ ...request, headers });
        expect(response.statusCode, response.body).toBe(503); expect(response.json()).toEqual({ error: "learning_unavailable" });
        expect(response.headers["cache-control"]).toBe("private, no-store");
      }
    } finally { await app.close(); }
  });
  it("S07 rejects cross-origin mutation and expired identity before provider access", async () => {
    const invoke = vi.fn(async () => ({ status: "not_found" }));
    const app = await buildApp(readEnvironment({ NODE_ENV: "test", GUIDED_LEARNING_ENABLED: "true", GUIDED_LEARNING_V2_ENABLED: "true" }), {
      identityProvider: identity, guidedLearningV2Provider: { invoke },
    });
    try {
      const request = { method: "POST" as const, url: "/v2/guided-learning/enrollments", payload: { pathId: v2Id(4) } };
      const expired = await app.inject({ ...request, headers: { authorization: "Bearer expired", "idempotency-key": v2Id(90) } });
      expect(expired.statusCode).toBe(401);
      const cross = await app.inject({ ...request, headers: { origin: "https://hostile.example", cookie: "session=learner", "idempotency-key": v2Id(91) } });
      expect(cross.statusCode).toBe(403); expect(invoke).not.toHaveBeenCalled();
    } finally { await app.close(); }
  });
  it("provider failures never serialize private error details", async () => {
    const app = Fastify();
    await registerGuidedV2Routes(app, { identityProvider: identity, flags: { enabled: true, newEnrollments: true }, provider: {
      invoke: async () => { throw new Error("PRIVATE_SOURCE secret-token correctKey=yes"); },
    } });
    try {
      const response = await app.inject({ url: "/v2/guided-learning/home", headers: { authorization: "Bearer learner" } });
      expect(response.statusCode).toBe(503); expect(response.json()).toEqual({ error: "learning_unavailable" });
    } finally { await app.close(); }
  });
  it("the public learner projection is free of server credential imports", async () => {
    const source = await readFile(new URL("../../../packages/contracts/src/guided-learning-v2.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/process\.env|service_role|DATABASE_URL|SECRET_ACCESS_KEY/);
  });
});

const securityUrl = process.env.KORAZ_T022_TEST_DATABASE_URL;
describe.skipIf(!securityUrl)("T022 disposable PostgreSQL restricted connections", () => {
  let control: Pool, database: Kysely<CediahDatabase>;
  beforeAll(async () => {
    const url = new URL(securityUrl!);
    if (process.env.KORAZ_TEST_DATABASE !== "true" || url.protocol !== "postgresql:"
      || url.hostname !== "127.0.0.1" || url.port !== "55422" || url.pathname !== "/koraz_t022_test") {
      throw new Error("T022 requires its dedicated disposable localhost:55422/koraz_t022_test database");
    }
    control = new Pool({ connectionString: securityUrl, max: 2 });
    expect((await control.query("select to_regclass('public.auth_users') as existing")).rows[0].existing).toBeNull();
    await control.query("create role cediah_runtime login; create role anon login; create role authenticated login; alter default privileges in schema public grant all on tables to anon,authenticated");
    const directory = new URL("../../../database/migrations/", import.meta.url);
    for (const file of (await readdir(directory)).filter((file) => /^\d+_[a-z0-9_]+\.sql$/.test(file) && file <= "0035_guided_v2_media_access.sql").sort()) {
      if (file === "0005_restore_legacy_content.sql") continue;
      await control.query(`begin;\n${await readFile(new URL(file, directory), "utf8")}\ncommit;`);
    }
    await seedGuidedV2Runtime({ exec: (query: string) => control.query(query) } as unknown as PGlite);
    await control.query("update content_items set status='published',catalog_visibility='catalog',published_at=now(),published_by=$2 where id=$1", [v2Id(3), v2Id(1)]);
    await control.query("update learning_path_versions set definition_v2_json=$1 where id=$2", [JSON.stringify(fixture()), v2Id(6)]);
    await control.query("insert into learning_v2_bindings(path_version_id,local_key,kind,topic_content_id) values($1,'topic','topic',$2)", [v2Id(6), v2Id(3)]);
    await control.query("insert into content_items(id,kind,slug,title,summary,topic,author_user_id,status,published_at,published_by) values($1,'guide','security-guide','Guide','Fixture','Security',$2,'published',now(),$2)", [v2Id(12), v2Id(1)]);
    await control.query("insert into learning_resources(id,source_content_id,projection,adapter_key) values($1,$2,'guide','guide-adapter')", [v2Id(11), v2Id(12)]);
    await control.query("insert into learning_resource_revisions(id,resource_id,revision_number,source_version,adapter_version,schema_version,payload_json,payload_hash) values($1,$2,1,1,1,1,'{}',$3)", [v2Id(13), v2Id(11), "a".repeat(64)]);
    await control.query("insert into learning_v2_bindings(path_version_id,local_key,kind,source_content_id,resource_revision_id,document_sha256) values($1,'guide','source',$2,$3,$4)", [v2Id(6), v2Id(12), v2Id(13), "a".repeat(64)]);
    await control.query("insert into content_assets(id,content_item_id,owner_user_id,kind,storage_bucket,storage_path,original_file_name,mime_type,size_bytes,status,finalized_at) values($1,$2,$3,'image','test-assets','private-diagram','diagram.png','image/png',100,'ready',now())", [v2Id(10), v2Id(3), v2Id(1)]);
    await control.query("insert into learning_v2_bindings(path_version_id,local_key,kind,asset_id,rights_status,rights_credit) values($1,'diagram','asset',$2,'owned','')", [v2Id(6), v2Id(10)]);
    await control.query("update learning_path_versions set status='published',published_at=now(),published_by=$2 where id=$1", [v2Id(6), v2Id(1)]);
    await control.query("update learning_paths set published_version_id=$1 where id=$2", [v2Id(6), v2Id(4)]);
    const runtimeUrl = new URL(securityUrl!); runtimeUrl.username = "cediah_runtime";
    database = new Kysely<CediahDatabase>({ dialect: new PostgresDialect({ pool: new Pool({ connectionString: runtimeUrl.href, max: 2 }) }) });
  }, 120000);
  afterAll(async () => { await database?.destroy(); await control?.end(); });
  it("S06 separate anon/authenticated connections have no private table privileges", async () => {
    for (const role of ["anon", "authenticated"]) {
      const url = new URL(securityUrl!); url.username = role;
      const restricted = new Pool({ connectionString: url.href, max: 1 });
      try {
        expect((await restricted.query("select current_user as actor")).rows[0].actor).toBe(role);
        for (const name of ["bindings", "imports", "attempts", "responses", "objective_state", "activity_state", "review_state"]) {
          await expect(restricted.query(`select * from learning_v2_${name}`)).rejects.toMatchObject({ code: "42501" });
          await expect(restricted.query(`delete from learning_v2_${name}`)).rejects.toMatchObject({ code: "42501" });
        }
      } finally { await restricted.end(); }
    }
  });
  it("S06 runtime is neither owner nor bypassrls and cannot erase accepted answers", async () => {
    const rows = await control.query("select rolname,rolsuper,rolbypassrls from pg_roles where rolname='cediah_runtime'");
    expect(rows.rows[0]).toEqual({ rolname: "cediah_runtime", rolsuper: false, rolbypassrls: false });
    expect((await database.selectFrom("learning_v2_attempts").select("id").execute())).toEqual([]);
    await expect(database.deleteFrom("learning_v2_responses").execute()).rejects.toMatchObject({ code: "42501" });
    expect((await control.query("select relname from pg_class where relname like 'learning_v2_%' and relkind='r' and (not relrowsecurity or pg_get_userbyid(relowner)='cediah_runtime')")).rows).toEqual([]);
    expect((await control.query("select grantee from information_schema.table_privileges where table_name like 'learning_v2_%' and grantee in ('PUBLIC','anon','authenticated')")).rows).toEqual([]);
  });
  it("S06 restricted runtime can execute the real attempt service", async () => {
    const provider = createGuidedV2HttpProvider(database);
    const result = await provider.invoke("attemptCreate", v2Id(1), {}, { clientAttemptId: v2Id(90001), enrollmentId: v2Id(8), target: { kind: "activity", key: "learn" }, expectedEnrollmentVersion: 1 }, v2Id(90000));
    expect(result.status).toBe("success");
    const attempt = V2HttpContracts.attemptCreate.response.parse("value" in result ? result.value : null).attempt;
    const answered = await provider.invoke("attemptResponse", v2Id(1), { id: attempt.attemptId }, { activityKey: "learn", answer: { kind: "study", acknowledged: true }, confidence: null, expectedVersion: 1 }, v2Id(90002));
    expect(answered.status).toBe("success");
    expect((await provider.invoke("attemptComplete", v2Id(1), { id: attempt.attemptId }, { expectedVersion: 2 }, v2Id(90003))).status).toBe("success");
    const choice = await provider.invoke("attemptCreate", v2Id(1), {}, { clientAttemptId: v2Id(90004), enrollmentId: v2Id(8), target: { kind: "activity", key: "a" }, expectedEnrollmentVersion: 1 }, v2Id(90005));
    expect(choice.status).toBe("success");
    const id = V2HttpContracts.attemptCreate.response.parse("value" in choice ? choice.value : null).attempt.attemptId;
    const body = { activityKey: "a", answer: { kind: "single_choice", optionKey: "yes" }, confidence: null, expectedVersion: 1 };
    expect((await provider.invoke("attemptResponse", v2Id(1), { id }, body, v2Id(90006))).status).toBe("success");
    expect((await provider.invoke("attemptResponse", v2Id(1), { id }, body, v2Id(90006))).status).toBe("success");
    await control.query("update content_assets set status='pending',finalized_at=null where id=$1", [v2Id(10)]);
    expect((await provider.invoke("attemptGet", v2Id(1), { id }, {}, "")).status).toBe("access_revoked");
    expect((await provider.invoke("attemptResponse", v2Id(1), { id }, body, v2Id(90006))).status).toBe("access_revoked");
    await control.query("update content_assets set status='ready',finalized_at=now() where id=$1", [v2Id(10)]);
  });
  it("S06 restricted runtime executes editorial CRUD/preview with ownership and no learner progress writes", async () => {
    const editor = createPostgresGuidedLearningV2Provider(database);
    const pkg = fixture(); pkg.route.slug = "t022-runtime-editor"; pkg.packageKey = "t022-runtime-editor";
    const bindings = { topicContentId: v2Id(3), sources: [], assets: [] };
    const input = { actorUserId: v2Id(1), canCreate: true, canEditAll: false, enforceAccess: true, idempotencyKey: v2Id(92001), package: pkg, bindings };
    const created = await editor.createDraft(input); expect(created.status).toBe("success");
    if (created.status !== "success") return;
    expect(await editor.createDraft(input)).toEqual(created);
    const common = { actorUserId: v2Id(1), canEdit: true, canEditAll: false, pathId: created.value.pathId, enforceAccess: true };
    expect((await editor.getEditorPath({ ...common, actorUserId: v2Id(2) })).status).toBe("not_found");
    pkg.route.title = "Editor runtime";
    const saved = await editor.saveDraft({ ...common, idempotencyKey: v2Id(92002), expectedVersion: 1, package: pkg, bindings }); expect(saved.status).toBe("success");
    expect((await editor.getEditorPath(common)).status).toBe("success");
    const before = (await control.query("select (select count(*) from learning_enrollments)::int enrollments,(select count(*) from learning_v2_attempts)::int attempts,(select count(*) from learning_events)::int events,(select count(*) from learning_rewards)::int rewards")).rows;
    expect((await editor.previewPath({ ...common, idempotencyKey: v2Id(92003), package: pkg, bindings })).status).toBe("success");
    const after = (await control.query("select (select count(*) from learning_enrollments)::int enrollments,(select count(*) from learning_v2_attempts)::int attempts,(select count(*) from learning_events)::int events,(select count(*) from learning_rewards)::int rewards")).rows; expect(after).toEqual(before);
  });
  it("S06 lock functions grant no identity/catalog writes, secrets or public execution", async () => {
    const runtimeUrl = new URL(securityUrl!); runtimeUrl.username = "cediah_runtime";
    const runtime = new Pool({ connectionString: runtimeUrl.href, max: 1 });
    try {
      await expect(runtime.query("select storage_bucket,storage_path,mime_type from content_assets limit 1")).resolves.toMatchObject({ rowCount: 1 });
      for (const query of ["select * from auth_users", "select * from auth_sessions", "select * from auth_accounts", "update auth_users set name='spoof'", "update content_items set title='spoof'", "update content_assets set status='pending'", "update learning_resource_revisions set payload_json='{}'", "select size_bytes from content_assets", "select metadata from public.audit_log", "delete from private.guided_v2_audit"]) {
        await expect(runtime.query(query)).rejects.toMatchObject({ code: "42501" });
      }
      await expect(runtime.query("insert into private.guided_v2_audit(actor_user_id,action,target_type,target_id,metadata) values($1,'unrelated_action','learning_path',$2,'{}')", [v2Id(1), v2Id(4)])).rejects.toMatchObject({ code: "44000" });
      expect((await runtime.query("select count(*)::int n from private.guided_v2_audit where action not like 'learning_path_v2_%'")).rows).toEqual([{ n: 0 }]);
      await runtime.query("create temp table auth_users(id uuid)");
      expect((await runtime.query("select private.lock_guided_v2_actor($1) as id", [v2Id(1)])).rows).toEqual([{ id: v2Id(1) }]);
      expect((await runtime.query("select private.lock_guided_v2_actor($1) as id", [v2Id(999)])).rows).toEqual([{ id: null }]);
      await expect(runtime.query("select private.lock_guided_v2_catalog('invalid',$1)", [v2Id(3)])).rejects.toMatchObject({ code: "22023" });
    } finally { await runtime.end(); }
    for (const role of ["anon", "authenticated"]) for (const signature of ["private.lock_guided_v2_actor(uuid)", "private.lock_guided_v2_catalog(text,uuid)"]) {
      expect((await control.query("select has_function_privilege($1,$2,'EXECUTE') as allowed", [role, signature])).rows).toEqual([{ allowed: false }]);
    }
    for (const role of ["anon", "authenticated"]) expect((await control.query("select has_table_privilege($1,'private.guided_v2_audit','SELECT') as allowed", [role])).rows).toEqual([{ allowed: false }]);
    const functions = await control.query("select prosecdef,proconfig,pg_get_userbyid(proowner) as owner from pg_proc where oid in ('private.lock_guided_v2_actor(uuid)'::regprocedure,'private.lock_guided_v2_catalog(text,uuid)'::regprocedure)");
    expect(functions.rows).toHaveLength(2);
    for (const fn of functions.rows) { expect(fn.prosecdef).toBe(true); expect(fn.proconfig).toContain("search_path=pg_catalog, pg_temp"); expect(fn.owner).not.toBe("cediah_runtime"); }
  });
  it("independent runtime connections share the 120/minute budget", async () => {
    const app = Fastify();
    const runtimeUrl = new URL(securityUrl!); runtimeUrl.username = "cediah_runtime";
    const rateDatabase = new Kysely<CediahDatabase>({ dialect: new PostgresDialect({ pool: new Pool({ connectionString: runtimeUrl.href, max: 2, application_name: "t022-rate-concurrency" }) }) });
    const provider = createGuidedV2HttpProvider(rateDatabase);
    await registerGuidedV2Routes(app, { identityProvider: identity, flags: { enabled: true, newEnrollments: true }, provider });
    try {
      const created = await app.inject({ method: "POST", url: "/v2/guided-learning/attempts", headers: { authorization: "Bearer other", "idempotency-key": v2Id(92000) },
        payload: { clientAttemptId: v2Id(92001), enrollmentId: v2Id(9), target: { kind: "activity", key: "learn" }, expectedEnrollmentVersion: 1 } });
      expect(created.statusCode, created.body).toBe(200);
      const attemptId = created.json().attempt.attemptId;
      const payload = { activityKey: "learn", answer: { kind: "study", acknowledged: true }, confidence: null, expectedVersion: 999 };
      const respond = (i: number) => app.inject({ method: "POST", url: `/v2/guided-learning/attempts/${attemptId}/responses`, payload,
        headers: { authorization: "Bearer other", "idempotency-key": v2Id(91000 + i) } });
      for (let i = 0; i < 119; i++) expect((await respond(i)).statusCode).toBe(409);
      const actorLock = await control.connect();
      let pending: Promise<Awaited<ReturnType<typeof respond>>[]> | undefined;
      try {
        await actorLock.query("begin"); await actorLock.query("select id from auth_users where id=$1 for update", [v2Id(2)]);
        pending = Promise.all([respond(119), respond(120)]);
        let waiting = 0;
        const deadline = Date.now() + 5000;
        while (waiting < 2 && Date.now() < deadline) {
          waiting = Number((await control.query("select count(*)::int as n from pg_stat_activity where application_name='t022-rate-concurrency' and wait_event_type='Lock'")).rows[0].n);
          if (waiting < 2) await new Promise((resolve) => setTimeout(resolve, 20));
        }
        expect(waiting).toBe(2);
      } finally { await actorLock.query("commit"); actorLock.release(); }
      expect((await pending!).map((response) => response.statusCode).sort()).toEqual([409, 429]);
      expect((await respond(0)).statusCode).toBe(409);
      expect((await control.query("select count(*)::int as n from learning_mutation_receipts where response_json->>'rateLimitV2'='response' and user_id=$1", [v2Id(2)])).rows).toEqual([{ n: 120 }]);
    } finally { await app.close(); await rateDatabase.destroy(); }
  }, 60000);
});
