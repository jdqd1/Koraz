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

// Only loopback and an in-memory PGlite instance; no environment database credentials.
const requireApi = createRequire(new URL("../../../../../apps/api/package.json", import.meta.url));
const Fastify = requireApi("fastify");
const { Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } = requireApi("kysely");
let pg, database, app, createdPathId;
const baseUrl = "http://127.0.0.1:4102";
const actor = fixtureV2Id(1);
const fixture = editorV2FixtureRoute();
let serial = 1000;
const key = () => fixtureV2Id(++serial);
const api = createEditorV2Api(async (url, init) => fetch(String(url).replace("/api/v2", `${baseUrl}/v2`), { ...init, headers: { ...init?.headers, cookie: "t023=synthetic-editor" } }));
const storage = new Map<string, string>();
let stop;
beforeAll(async () => {
  pg = await createGuidedV2Database();
  const sourcePayload = { body: "Contenido sintético" };
  const digest = hashLearningSnapshot(sourcePayload);
  fixture.definition.sources[0].documentSha256 = digest;
  await pg.query("insert into auth_users(id,name,email) values($1,'Editor T023','t023@example.test')", [actor]);
  for (const [id, kind, slug] of [[fixtureV2Id(3), "topic", "t023-topic"], [fixtureV2Id(5), "guide", "t023-guide"]]) {
    await pg.query("insert into content_items(id,kind,slug,title,summary,topic,author_user_id) values($1,$2,$3,'Tema de prueba','Fixture','Tema',$4)", [id, kind, slug, actor]);
  }
  await pg.query("insert into learning_resources(id,source_content_id,projection,adapter_key) values($1,$2,'guide','guide-adapter')", [fixtureV2Id(8), fixtureV2Id(5)]);
  await pg.query("insert into learning_resource_revisions(id,resource_id,revision_number,source_version,adapter_version,schema_version,payload_json,payload_hash) values($1,$2,1,1,1,1,$3,$4)", [fixtureV2Id(6), fixtureV2Id(8), sourcePayload, digest]);
  await pg.query("insert into content_assets(id,content_item_id,owner_user_id,kind,storage_bucket,storage_path,original_file_name,mime_type,size_bytes,status,finalized_at) values($1,$2,$3,'image','test','synthetic','image.png','image/png',100,'ready',now())", [fixtureV2Id(7), fixtureV2Id(5), actor]);
  const connection = { async executeQuery(query) { const result = await pg.query(query.sql, [...query.parameters]); return { rows: result.rows, numAffectedRows: BigInt(result.affectedRows ?? 0) }; }, async *streamQuery() { yield { rows: [] }; } };
  database = new Kysely({ dialect: { createAdapter: () => new PostgresAdapter(), createIntrospector: (db) => new PostgresIntrospector(db), createQueryCompiler: () => new PostgresQueryCompiler(), createDriver: () => ({ acquireConnection: async () => connection, beginTransaction: async () => pg.exec("begin"), commitTransaction: async () => pg.exec("commit"), rollbackTransaction: async () => pg.exec("rollback"), destroy: async () => {}, init: async () => {}, releaseConnection: async () => {} }) } });
  app = Fastify();
  app.get("/v1/auth/me", async () => ({ features: { guidedLearning: true, guidedLearningMap: false }, roles: ["administrator"], user: { id: actor, email: "t023@example.test" } }));
  app.get("/v1/editor/learning-resources", async () => ({ items: [], nextCursor: null, resourceTopics: [], topics: [{ id: fixtureV2Id(3), title: "Tema de prueba" }] }));
  app.get("/v1/editor/learning-paths/:id", async (_request, reply) => reply.status(409).send({ error: "engine_version_mismatch" }));
  const provider = createPostgresGuidedLearningV2Provider(database);
  await registerGuidedV2EditorImportRoutes(app, { identityProvider: { getUser: async (request) => request.cookie?.includes("t023=synthetic-editor") ? { id: actor } : null }, contentProvider: { getRoles: async () => ["administrator"] }, provider });
  app.post("/__test/stop", async () => { stop?.(); return { stopped: true }; });
  await app.listen({ host: "127.0.0.1", port: 4102 });
}, 120000);
afterAll(async () => {
  if (process.env.T023_BROWSER_HOLD === "true") {
    await new Promise((resolve) => { const timer = setTimeout(resolve, 900000); stop = () => { clearTimeout(timer); resolve(); }; });
  }
  await app?.close(); await database?.destroy(); await pg?.close();
}, 910000);
it("uses actual HTTP editor routes and isolated storage for create/edit/save/read/CAS/replay", async () => {
  const c = createEditorV2Controller({ state: createEditorV2State({ draft: draftFromRouteV2(fixture) }), actorUserId: actor, api, createKey: key,
    storage: { setItem: (k, v) => { storage.set(k, v); }, removeItem: (k) => { storage.delete(k); } } });
  expect(await c.save(), c.getSnapshot().notice).toBe(true);
  createdPathId = c.getSnapshot().confirmed.pathId;
  const edit = structuredClone(c.getSnapshot().draft);
  edit.package.route.title = "Título confirmado T023";
  c.edit(edit);
  expect(storage.size).toBe(1);
  expect(await c.save(), c.getSnapshot().notice).toBe(true);
  expect(storage.size).toBe(0);
  const reread = await api.get(createdPathId);
  expect(reread.ok).toBe(true);
  expect(reread.value.route.definition).toEqual(edit.package);
  expect(reread.value.route.bindings).toEqual(edit.bindings);
  expect(reread.value.route.editVersion).toBe(2);
  const requestKey = key();
  const body = { ...edit, expectedVersion: 2 };
  const first = await api.save(createdPathId, body, requestKey);
  const replay = await api.save(createdPathId, body, requestKey);
  expect(replay).toEqual(first);
  expect(first.value.route.editVersion).toBe(3);
  edit.package.route.title = "Copia local conservada";
  c.edit(edit);
  expect(await c.save()).toBe(false);
  expect(c.getSnapshot().conflict).toBe(true);
  expect(c.getSnapshot().draft.package.route.title).toBe("Copia local conservada");
  expect(storage.size).toBe(1);
  expect((await pg.query("select count(*)::int n from learning_path_steps")).rows[0].n).toBe(0);
  await writeFile(new URL("http-ready.json", import.meta.url), JSON.stringify({ pathId: createdPathId, actorUserId: actor, baseUrl, engineVersion: "guided-v2", editVersion: 3, kinds: reread.value.route.definition.activities.map((a) => a.kind) }, null, 2));
}, 120000);
