import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createGuidedV2Database } from "../../../../../apps/api/test/helpers/guided-v2-db.js";
import { createPostgresGuidedLearningV2Provider } from "../../../../../apps/api/src/providers/postgres-guided-learning-v2.js";
import { registerGuidedV2EditorImportRoutes } from "../../../../../apps/api/src/guided-learning/v2/editor-routes.js";
import { hashLearningSnapshot } from "../../../../../apps/api/src/guided-learning/snapshot-hash.js";
import { editorV2FixtureRoute, fixtureV2Id } from "../../../../../apps/web/src/components/learning/editor/v2/editor-fixtures.js";
import { createEditorV2Api } from "../../../../../apps/web/src/components/learning/editor/v2/editor-api.js";
import { createEditorV2Controller } from "../../../../../apps/web/src/components/learning/editor/v2/editor-controller.js";
import { createEditorV2State, draftFromRouteV2 } from "../../../../../apps/web/src/components/learning/editor/v2/editor-model.js";

import { publishableFixture } from "./fixture.js";

// Only loopback and an in-memory PGlite instance; no environment database credentials.
const requireApi = createRequire(new URL("../../../../../apps/api/package.json", import.meta.url));
const Fastify = requireApi("fastify");
const { Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } = requireApi("kysely");
let pg, database, app, createdPathId;
const baseUrl = "http://127.0.0.1:4107";
const actor = fixtureV2Id(1);
const fixture = publishableFixture();
let serial = 1000;
const key = () => fixtureV2Id(++serial);
const api = createEditorV2Api(async (url, init) => fetch(String(url).replace("/api/v2", `${baseUrl}/v2`), { ...init, headers: { ...init?.headers, cookie: "t027=synthetic-editor" } }));
const storage = new Map<string, string>();
let stop;
beforeAll(async () => {
  pg = await createGuidedV2Database();
  const sourcePayload = { body: "Contenido sintético" };
  const digest = hashLearningSnapshot(sourcePayload);
  fixture.definition.sources[0].documentSha256 = digest;
  await pg.query("insert into auth_users(id,name,email) values($1,'Editor T027','t027@example.test')", [actor]);
  for (const [id, kind, slug] of [[fixtureV2Id(3), "topic", "t027-topic"], [fixtureV2Id(5), "guide", "t027-guide"]]) {
    await pg.query("insert into content_items(id,kind,slug,title,summary,topic,author_user_id) values($1,$2,$3,'Tema de prueba','Fixture','Tema',$4)", [id, kind, slug, actor]);
  }
  await pg.query("insert into learning_resources(id,source_content_id,projection,adapter_key) values($1,$2,'guide','guide-adapter')", [fixtureV2Id(8), fixtureV2Id(5)]);
  await pg.query("insert into learning_resource_revisions(id,resource_id,revision_number,source_version,adapter_version,schema_version,payload_json,payload_hash) values($1,$2,1,1,1,1,$3,$4)", [fixtureV2Id(6), fixtureV2Id(8), sourcePayload, digest]);
  await pg.query("insert into content_assets(id,content_item_id,owner_user_id,kind,storage_bucket,storage_path,original_file_name,mime_type,size_bytes,status,finalized_at) values($1,$2,$3,'image','test','synthetic','image.png','image/png',100,'ready',now())", [fixtureV2Id(7), fixtureV2Id(5), actor]);
  await pg.query("insert into content_items(id,kind,slug,title,summary,topic,author_user_id) values($1,'guide','t027-guide-two','Guía adicional T027','Fixture','Tema',$2),($3,'guide','t027-no-revision','Guía sin revisión T027','Fixture','Tema',$2)", [fixtureV2Id(105), actor, fixtureV2Id(109)]);
  await pg.query("insert into learning_resources(id,source_content_id,projection,adapter_key) values($1,$2,'guide','guide-adapter')", [fixtureV2Id(108), fixtureV2Id(105)]);
  await pg.query("insert into learning_resource_revisions(id,resource_id,revision_number,source_version,adapter_version,schema_version,payload_json,payload_hash) values($1,$2,1,1,1,1,$3,$4)", [fixtureV2Id(106), fixtureV2Id(108), sourcePayload, digest]);
  const connection = { async executeQuery(query) { const result = await pg.query(query.sql, [...query.parameters]); return { rows: result.rows, numAffectedRows: BigInt(result.affectedRows ?? 0) }; }, async *streamQuery() { yield { rows: [] }; } };
  database = new Kysely({ dialect: { createAdapter: () => new PostgresAdapter(), createIntrospector: (db) => new PostgresIntrospector(db), createQueryCompiler: () => new PostgresQueryCompiler(), createDriver: () => ({ acquireConnection: async () => connection, beginTransaction: async () => pg.exec("begin"), commitTransaction: async () => pg.exec("commit"), rollbackTransaction: async () => pg.exec("rollback"), destroy: async () => {}, init: async () => {}, releaseConnection: async () => {} }) } });
  app = Fastify();
  app.get("/v1/auth/me", async () => ({ features: { guidedLearning: true, guidedLearningMap: false }, roles: ["administrator"], user: { id: actor, email: "t027@example.test" } }));
  app.get("/v1/editor/learning-resources", async () => ({ items: [], nextCursor: null, resourceTopics: [], topics: [{ id: fixtureV2Id(3), title: "Tema de prueba" }] }));
  app.get("/v1/editor/learning-paths/:id", async (_request, reply) => reply.status(409).send({ error: "engine_version_mismatch" }));
  const provider = createPostgresGuidedLearningV2Provider(database);
  app.get("/__test/state/:id", async (request) => provider.getEditorPath({ pathId: request.params.id, actorUserId: actor, canEdit: true, canEditAll: true }));
  await registerGuidedV2EditorImportRoutes(app, { identityProvider: { getUser: async (request) => request.cookie?.includes("t027=synthetic-editor") ? { id: actor } : null }, contentProvider: { getRoles: async () => ["administrator"] }, provider });
  app.post("/__test/stop", async () => { stop?.(); return { stopped: true }; });
  await app.listen({ host: "127.0.0.1", port: 4107 });
}, 120000);
afterAll(async () => {
  if (process.env.T027_BROWSER_HOLD === "true" && createdPathId) {
    await new Promise((resolve) => { const timer = setTimeout(resolve, 1800000); stop = () => { clearTimeout(timer); resolve(); }; });
  }
  await app?.close(); await database?.destroy(); await pg?.close();
}, 1810000);

it("T027 actual HTTP import dry-run/commit/export/conflicts and reviewed publication", async () => {
  const input = { package: fixture.definition, bindings: fixture.bindings, targetPathId: null, expectedVersion: null };
  const missing = await api.validateImport({ ...input, bindings: { ...input.bindings, sources: [] } }, key());
  expect(missing.ok).toBe(true); expect(missing.value.readyToImport).toBe(false);
  expect(missing.value.issues.some((issue) => issue.code === "SOURCE_UNRESOLVED")).toBe(true);
  expect((await pg.query("select count(*)::int n from learning_paths")).rows[0].n).toBe(0);
  const checked = await api.validateImport(input, key());
  expect(checked.ok).toBe(true); expect(checked.value.readyToImport, JSON.stringify(checked)).toBe(true);
  const commitKey = key();
  const imported = await api.commitImport(checked.value.importId, { hash: checked.value.hash, expectedVersion: null }, commitKey);
  expect(imported.ok).toBe(true); expect(imported.value.status).toBe("draft");
  const replay = await api.commitImport(checked.value.importId, { hash: checked.value.hash, expectedVersion: null }, commitKey);
  expect(replay).toEqual(imported);
  createdPathId = imported.value.pathId;
  const exported = await api.export(createdPathId); expect(exported.ok).toBe(true);
  expect(exported.value.package).toEqual(fixture.definition);
  expect(exported.value.package).not.toHaveProperty("approvedBy");
  const repeated = await api.validateImport(input, key());
  const reimported = await api.commitImport(repeated.value.importId, { hash: repeated.value.hash, expectedVersion: null }, key());
  expect(reimported).toEqual(imported);
  expect((await pg.query("select count(*)::int n from learning_paths")).rows[0].n).toBe(1);
  const changedSameRevision = structuredClone(input); changedSameRevision.package.route.title = "Conflicto de revisión";
  const conflict = await api.validateImport(changedSameRevision, key()); expect(conflict.ok).toBe(true);
  const denied = await api.commitImport(conflict.value.importId, { hash: conflict.value.hash, expectedVersion: null }, key());
  expect(denied).toMatchObject({ ok: false, status: 409 });

  const replacement = structuredClone(input); replacement.package.revision = 2; replacement.package.route.title = "Ruta actualizada T027";
  replacement.targetPathId = createdPathId; replacement.expectedVersion = 1;
  const diff = await api.validateImport(replacement, key()); expect(diff.ok).toBe(true); expect(diff.value.diff.length).toBeGreaterThan(0);
  const replaced = await api.commitImport(diff.value.importId, { hash: diff.value.hash, expectedVersion: 1 }, key());
  expect(replaced.ok).toBe(true); expect(replaced.value.editVersion).toBe(2);
  const stale = await api.transition(createdPathId, { expectedVersion: 1, status: "in_review", reviewNote: "" }, key());
  expect(stale).toMatchObject({ ok: false, status: 409 });

  const changingSource = { ...replacement, expectedVersion: 2, package: { ...replacement.package, revision: 3 } };
  const sourceCheck = await api.validateImport(changingSource, key()); expect(sourceCheck.value.readyToImport).toBe(true);
  await pg.query("update content_items set version=version+1 where id=$1", [fixtureV2Id(5)]);
  const changedSource = await api.commitImport(sourceCheck.value.importId, { hash: sourceCheck.value.hash, expectedVersion: 2 }, key());
  expect(changedSource.ok).toBe(false);
  expect(changedSource.issues?.some((issue) => issue.code === "SOURCE_CHANGED")).toBe(true);
  await pg.query("update content_items set version=version-1 where id=$1", [fixtureV2Id(5)]);

  const unreviewed = await api.transition(createdPathId, { expectedVersion: 2, status: "published", reviewNote: "" }, key());
  expect(unreviewed.ok).toBe(false);
  const review = await api.transition(createdPathId, { expectedVersion: 2, status: "in_review", reviewNote: "Revisión sintética para QA" }, key());
  expect(review.ok).toBe(true); expect(review.value.route.editVersion).toBe(3);
  const approved = await api.transition(createdPathId, { expectedVersion: 3, status: "approved", reviewNote: "Contenido sintético; sin aprobación clínica" }, key());
  expect(approved.ok).toBe(true); expect(approved.value.route.reviewedContentHash).toBe(approved.value.route.contentHash);
  const published = await api.transition(createdPathId, { expectedVersion: 4, status: "published", reviewNote: "Publicación exclusivamente aislada" }, key());
  expect(published.ok).toBe(true); expect(published.value.route.status).toBe("published");
  const version = await api.version(createdPathId, { expectedVersion: 5, releaseNotes: "Borrador de prueba de interfaz" }, key());
  expect(version.ok).toBe(true);
  const read = await api.get(createdPathId); expect(read.ok).toBe(true); expect(read.value.route.status).toBe("draft");
  expect(read.value.route.approvedBy).toBeNull();
  for (const table of ["learning_v2_attempts", "learning_v2_responses", "learning_v2_review_state", "learning_events", "learning_enrollments"]) {
    expect((await pg.query(`select count(*)::int n from ${table}`)).rows[0].n).toBe(0);
  }
  await writeFile(new URL("http-ready.json", import.meta.url), JSON.stringify({ pathId: createdPathId, actorUserId: actor, baseUrl, editVersion: read.value.route.editVersion }, null, 2));
  const ui = structuredClone(fixture.definition); ui.packageKey = "t027-ui-import"; ui.route.slug = "t027-ui-import"; ui.route.title = "Importación T027 desde interfaz";
  await writeFile(new URL("ui-package.json", import.meta.url), JSON.stringify(ui, null, 2));
  await writeFile(new URL("storage-before-ui.json", import.meta.url), JSON.stringify((await pg.query("select id,status,edit_version from learning_path_versions order by created_at")).rows, null, 2));
}, 120000);



