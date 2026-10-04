import Fastify from "fastify";
import { Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler, type CompiledQuery, type DatabaseConnection, type QueryResult } from "kysely";
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { V2HttpContracts, type ContentProvider, type IdentityProvider, type PlatformRole } from "@cediah/contracts";
import { createGuidedV2Database, v2Id } from "./helpers/guided-v2-db.js";
import type { CediahDatabase } from "../src/db/database.js";
import { hashLearningSnapshot } from "../src/guided-learning/snapshot-hash.js";
import { createPostgresGuidedLearningV2Provider } from "../src/providers/postgres-guided-learning-v2.js";
import { registerGuidedV2EditorImportRoutes } from "../src/guided-learning/v2/editor-routes.js";

describe("T024 editorial source catalogue", () => {
  let pg: PGlite, db: Kysely<CediahDatabase>, app: ReturnType<typeof Fastify>, provider: ReturnType<typeof createPostgresGuidedLearningV2Provider>;
  let roles: PlatformRole[] = ["content_creator"];
  const payload = { body: "SYNTHETIC_SOURCE_TEXT_NEVER_IN_CATALOG" };
  const hash = hashLearningSnapshot(payload);
  beforeAll(async () => {
    pg = await createGuidedV2Database();
    const connection: DatabaseConnection = { async executeQuery<R>(query: CompiledQuery): Promise<QueryResult<R>> { const result = await pg.query<R>(query.sql, [...query.parameters]); return { rows: result.rows, numAffectedRows: BigInt(result.affectedRows ?? 0) }; }, async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> { yield { rows: [] }; } };
    db = new Kysely<CediahDatabase>({ dialect: { createAdapter: () => new PostgresAdapter(), createIntrospector: (d) => new PostgresIntrospector(d), createQueryCompiler: () => new PostgresQueryCompiler(), createDriver: () => ({ acquireConnection: async () => connection, beginTransaction: async () => { await pg.exec("begin"); }, commitTransaction: async () => { await pg.exec("commit"); }, rollbackTransaction: async () => { await pg.exec("rollback"); }, destroy: async () => {}, init: async () => {}, releaseConnection: async () => {} }) } });
    await pg.query("insert into auth_users(id,name,email) values($1,'Editor','t024@example.test'),($2,'Other','other-t024@example.test')", [v2Id(1), v2Id(2)]);
    for (const [n, title, status, visibility, owner] of [[10, "Guía vigente", "published", "catalog", 2], [11, "Guía propia", "draft", "guided_only", 1], [12, "Guía ajena privada", "draft", "guided_only", 2], [13, "Guía retirada", "archived", "catalog", 1], [14, "Guía cambiada", "published", "catalog", 2], [15, "Guía sin revisión", "published", "catalog", 2], [16, "Guía corrupta", "published", "catalog", 2], [17, "Guía recurso retirado", "published", "catalog", 2]]) {
      await pg.query("insert into content_items(id,kind,slug,title,summary,topic,status,catalog_visibility,author_user_id,published_at,published_by) values($1,'guide',$2,$3,'Fixture','Tema',$4,$5,$6,$7,$8)", [v2Id(Number(n)), `t024-${n}`, title, status, visibility, v2Id(Number(owner)), status === "published" ? new Date() : null, status === "published" ? v2Id(Number(owner)) : null]);
    }
    await pg.query("insert into content_items(id,kind,slug,title,summary,topic,author_user_id) values($1,'topic','t024-topic','Tema propio','Fixture','Tema',$2)", [v2Id(20), v2Id(1)]);
    for (const n of [10, 11, 12, 13, 14, 16, 17]) {
      await pg.query("insert into learning_resources(id,source_content_id,projection,adapter_key,retired_at) values($1,$2,'guide','guide-adapter',$3)", [v2Id(n + 100), v2Id(n), n === 17 ? new Date() : null]);
      await pg.query("insert into learning_resource_revisions(id,resource_id,revision_number,source_version,adapter_version,schema_version,payload_json,payload_hash) values($1,$2,1,1,1,1,$3,$4)", [v2Id(n + 200), v2Id(n + 100), payload, n === 16 ? "b".repeat(64) : hash]);
    }
    await pg.query("update content_items set version=2 where id=$1", [v2Id(14)]);
    provider = createPostgresGuidedLearningV2Provider(db);
    app = Fastify();
    await registerGuidedV2EditorImportRoutes(app, { provider, identityProvider: { getUser: async (request) => request.authorization ? { id: v2Id(1) } : null } as IdentityProvider, contentProvider: { getRoles: async () => roles } as unknown as ContentProvider });
  }, 120000);
  afterAll(async () => { await app?.close(); await db?.destroy(); await pg?.close(); });
  it("lists authorized names and actual current hashes without document bodies or writes", async () => {
    const before = (await pg.query("select count(*)::int n from learning_resource_revisions")).rows;
    const catalog = await provider.listEditorSourceCatalog({ actorUserId: v2Id(1), canEditAll: false, limit: 100 });
    expect(catalog.items.map((item) => item.title)).not.toContain("Guía ajena privada");
    expect(catalog.items.map((item) => item.title)).not.toContain("Guía retirada");
    expect(catalog.items.find((item) => item.title === "Guía vigente")?.revision).toEqual({ resourceRevisionId: v2Id(210), revisionNumber: 1, documentSha256: hash });
    expect(catalog.items.find((item) => item.title === "Guía propia")?.revision).not.toBeNull();
    for (const title of ["Guía cambiada", "Guía sin revisión", "Guía corrupta", "Guía recurso retirado"]) expect(catalog.items.find((item) => item.title === title)?.revision).toBeNull();
    expect(catalog.topics).toEqual([{ id: v2Id(20), title: "Tema propio" }]);
    expect(JSON.stringify(catalog)).not.toContain(payload.body);
    expect((await pg.query("select count(*)::int n from learning_resource_revisions")).rows).toEqual(before);
  });
  it("paginates deterministically and filters a literal search; reviewer can read private guides", async () => {
    const first = await provider.listEditorSourceCatalog({ actorUserId: v2Id(1), canEditAll: false, limit: 2 });
    const next = await provider.listEditorSourceCatalog({ actorUserId: v2Id(1), canEditAll: false, limit: 2, cursor: first.nextCursor! });
    expect(first.items.map((item) => item.sourceContentId).some((id) => next.items.some((item) => item.sourceContentId === id))).toBe(false);
    expect((await provider.listEditorSourceCatalog({ actorUserId: v2Id(1), canEditAll: true, limit: 100, q: "ajena" })).items).toHaveLength(1);
    expect((await provider.listEditorSourceCatalog({ actorUserId: v2Id(1), canEditAll: false, limit: 100, q: "%" })).items).toHaveLength(0);
  });
  it("checks session/role/query and returns the strict DTO privately", async () => {
    const url = V2HttpContracts.editorSourceCatalog.path;
    expect((await app.inject({ url })).statusCode).toBe(401);
    roles = ["student"]; expect((await app.inject({ url, headers: { authorization: "editor" } })).statusCode).toBe(403);
    roles = ["content_creator"];
    for (const query of ["?limit=101", "?cursor=bad", "?role=administrator"]) expect((await app.inject({ url: `${url}${query}`, headers: { authorization: "editor" } })).statusCode).toBe(400);
    const read = await app.inject({ url, headers: { authorization: "editor" } });
    expect(read.statusCode).toBe(200); expect(read.headers["cache-control"]).toBe("private, no-store");
    expect(V2HttpContracts.editorSourceCatalog.response.safeParse(read.json()).success).toBe(true);
  });
});
