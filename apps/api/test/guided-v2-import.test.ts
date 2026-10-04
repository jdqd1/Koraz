import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import Fastify from "fastify";
import {
  Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler,
  type CompiledQuery, type DatabaseConnection, type QueryResult,
} from "kysely";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { RoutePackageSchema, type ContentProvider, type IdentityProvider, type RoutePackage } from "@cediah/contracts";
import type { CediahDatabase } from "../src/db/database.js";
import { MAX_ROUTE_IMPORT_BYTES, diffRoutePackages, parseRouteImport } from "../src/guided-learning/v2/import.js";
import { registerGuidedV2EditorImportRoutes } from "../src/guided-learning/v2/editor-routes.js";
import { hashLearningSnapshot } from "../src/guided-learning/snapshot-hash.js";
import { createPostgresGuidedLearningV2Provider } from "../src/providers/postgres-guided-learning-v2.js";

const migrationDirectory = new URL("../../../database/migrations/", import.meta.url);
const id = (last: number) => `73000000-0000-4000-8000-${String(last).padStart(12, "0")}`;
const snapshot = { projection: "guide", content: { sections: [{ title: "Introducción", text: "Prueba" }] } };
const digest = hashLearningSnapshot(snapshot);

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

function fixture(): RoutePackage {
  return RoutePackageSchema.parse({
    schemaVersion: "2.0", packageKey: "dry-run", revision: 1, locale: "es",
    route: { slug: "dry-run", title: "Ruta importada", summary: "Prueba", topicLabel: "Tema", audience: "Alumno", discipline: "general", coverKey: "heart" },
    policyVersion: "guided-v2.0",
    sources: [{ key: "guide", kind: "guide", title: "Guía", citation: "Fuente", locator: { heading: "Inicio", sectionPath: [], page: 1 }, documentSha256: digest, excerpt: "Texto", url: null, verification: "provided", checkedAt: null }],
    assets: [], objectives: [], units: [], activities: [], assessments: [],
    reviewPlan: { objectiveKeys: [] }, editorial: { notes: "", unresolvedIssues: [] },
  });
}

const bindings = (offset = 0) => ({ topicContentId: id(3 + offset), sources: [{ key: "guide", sourceContentId: id(4 + offset), resourceRevisionId: id(6 + offset) }], assets: [] });
function namedFixture(name: string): RoutePackage {
  const pkg = fixture();
  pkg.packageKey = name;
  pkg.route.slug = name;
  return pkg;
}
const request = (overrides: Record<string, unknown> = {}) => ({
  actorUserId: id(1), canCreate: true, canEditAll: false, idempotencyKey: crypto.randomUUID(),
  package: fixture(), bindings: bindings(), targetPathId: null, expectedVersion: null, ...overrides,
});

async function seedImportCatalog(pg: PGlite, offset = 0) {
  await pg.exec(`
    insert into public.auth_users (id,name,email) values
      ('${id(1 + offset)}','Editor','import-editor-${offset}@example.test'),
      ('${id(2 + offset)}','Other','import-other-${offset}@example.test');
    insert into public.content_items (id,kind,slug,title,summary,topic,author_user_id) values
      ('${id(3 + offset)}','topic','import-topic-${offset}','Tema','Tema','Tema','${id(1 + offset)}'),
      ('${id(4 + offset)}','guide','import-guide-${offset}','Guía','Guía','Tema','${id(1 + offset)}');
    insert into public.learning_resources (id,source_content_id,projection,adapter_key)
      values ('${id(5 + offset)}','${id(4 + offset)}','guide','guide-adapter');
  `);
  await pg.query(`insert into public.learning_resource_revisions
    (id,resource_id,revision_number,source_version,adapter_version,schema_version,payload_json,payload_hash)
    values ($1,$2,1,1,1,1,$3,$4)`, [id(6 + offset), id(5 + offset), JSON.stringify(snapshot), digest]);
  await pg.exec(`insert into public.content_assets
    (id,content_item_id,owner_user_id,kind,storage_bucket,storage_path,original_file_name,mime_type,size_bytes,status,finalized_at)
    values ('${id(7 + offset)}','${id(4 + offset)}','${id(1 + offset)}','image','test-assets','import-image-${offset}.png','image.png','image/png',100,'ready',now())`);
}

describe("guided v2 import dry-run", () => {
  let pg: PGlite;
  let database: Kysely<CediahDatabase>;
  let provider: ReturnType<typeof createPostgresGuidedLearningV2Provider>;
  beforeAll(async () => {
    ({ pg, database } = await testDatabase());
    await seedImportCatalog(pg);
    provider = createPostgresGuidedLearningV2Provider(database);
  }, 120_000);
  afterAll(async () => { await database?.destroy(); await pg?.close(); });
  beforeEach(async () => { await pg.exec("delete from public.learning_v2_imports"); });

  it("I01 stores a private 24h session without creating or changing a learning path", async () => {
    const before = await pg.query<{ n: number }>("select count(*)::int as n from public.learning_paths");
    const result = await provider.validateImport(request());
    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.value.readyToImport).toBe(true);
    expect(result.value.diff).toContainEqual(expect.objectContaining({ path: "/sources/guide" }));
    expect(new Date(result.value.expiresAt).getTime() - Date.now()).toBeGreaterThan(23 * 60 * 60 * 1000);
    const stored = await pg.query<{ actor_user_id: string; state: string; normalized_json: RoutePackage }>(
      "select actor_user_id,state,normalized_json from public.learning_v2_imports where id=$1", [result.value.importId]);
    expect(stored.rows[0]).toMatchObject({ actor_user_id: id(1), state: "validated", normalized_json: fixture() });
    expect((await pg.query<{ n: number }>("select count(*)::int as n from public.learning_paths")).rows[0]?.n).toBe(before.rows[0]?.n);
  });

  it("reports a missing guide binding precisely and leaves the session unready", async () => {
    const result = await provider.validateImport(request({ bindings: { ...bindings(), sources: [] } }));
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.value.readyToImport).toBe(false);
      expect(result.value.issues).toContainEqual(expect.objectContaining({ code: "SOURCE_UNRESOLVED", path: "/sources/0" }));
    }
  });

  it("detects a changed guide digest and never auto-links by title", async () => {
    const pkg = fixture();
    pkg.sources[0]!.documentSha256 = "b".repeat(64);
    const changed = await provider.validateImport(request({ package: pkg }));
    expect(changed.status).toBe("success");
    if (changed.status === "success") {
      expect(changed.value.readyToImport).toBe(false);
      expect(changed.value.issues).toContainEqual(expect.objectContaining({ code: "SOURCE_CHANGED" }));
    }
    const unbound = await provider.validateImport(request({ bindings: { ...bindings(), sources: [] } }));
    expect(unbound.status).toBe("success");
    if (unbound.status === "success") expect(unbound.value.readyToImport).toBe(false);
  });

  it("computes key-based target diff and enforces owner/CAS without mutating the target", async () => {
    const created = await provider.createDraft({ actorUserId: id(1), canCreate: true, package: fixture(), bindings: bindings() });
    expect(created.status).toBe("success");
    if (created.status !== "success") return;
    const next = fixture();
    next.route.title = "Título nuevo";
    next.revision = 2;
    const input = { targetPathId: created.value.pathId, expectedVersion: 1, package: next };
    const result = await provider.validateImport(request(input));
    expect(result.status).toBe("success");
    if (result.status === "success") expect(result.value.diff).toContainEqual({ path: "/route/title", before: "Ruta importada", after: "Título nuevo" });
    expect(await provider.validateImport(request({ ...input, expectedVersion: 2 }))).toEqual({ status: "version_conflict" });
    expect(await provider.validateImport(request({ ...input, actorUserId: id(2) }))).toEqual({ status: "not_found" });
    const read = await provider.getEditorPath({ actorUserId: id(1), canEdit: true, canEditAll: false, pathId: created.value.pathId });
    expect(read).toMatchObject({ status: "success", value: { editVersion: 1, definition: fixture() } });
  });

  it("S05 rejects >10 MiB, unknown privileged fields and file URLs", () => {
    expect(Buffer.byteLength(" ".repeat(MAX_ROUTE_IMPORT_BYTES + 1), "utf8")).toBeGreaterThan(MAX_ROUTE_IMPORT_BYTES);
    expect(parseRouteImport(" ".repeat(MAX_ROUTE_IMPORT_BYTES + 1)).status).toBe("too_large");
    expect(parseRouteImport({ ...fixture(), status: "published", approvedBy: id(1) }).status).toBe("invalid");
    const pkg = fixture();
    pkg.sources[0]!.url = "file:///secret";
    expect(parseRouteImport(pkg).status).toBe("invalid");
    const executable = fixture();
    executable.editorial.notes = "<script>alert(1)</script>";
    expect(parseRouteImport(executable)).toMatchObject({ status: "invalid", issues: [expect.objectContaining({ path: "/editorial/notes" })] });
  });

  it("uses array order and local keys in diffs", () => {
    const before = fixture();
    const after = fixture();
    after.sources.push({ ...after.sources[0]!, key: "second" });
    expect(diffRoutePackages(before, after).map((item) => item.path)).toContain("/sources/second");
    expect(diffRoutePackages(before, after).map((item) => item.path)).toContain("/sources/@order");
  });

  it("marks an asset digest as unverified when the catalog has no trusted file hash", async () => {
    const pkg = fixture();
    pkg.assets.push({ key: "image", mediaType: "image", originalFileName: "image.png", sha256: "c".repeat(64),
      alt: "Ilustración", caption: "Ilustración", sourceKeys: ["guide"], rightsStatus: "owned", credit: "Editor",
      width: 100, height: 100 });
    const result = await provider.validateImport(request({ package: pkg, bindings: { ...bindings(), assets: [{ key: "image", assetId: id(7) }] } }));
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.value.readyToImport).toBe(false);
      expect(result.value.issues).toContainEqual(expect.objectContaining({ code: "VALIDATION_PENDING", path: "/assets/0/sha256" }));
    }
  });

  it("reuses an idempotency key only for the same package and bindings", async () => {
    const input = request();
    const first = await provider.validateImport(input);
    const replay = await provider.validateImport(input);
    expect(first.status).toBe("success");
    expect(replay).toMatchObject({ status: "success", value: { importId: first.status === "success" ? first.value.importId : "" } });
    const changed = fixture();
    changed.route.title = "Otro contenido";
    expect(await provider.validateImport({ ...input, package: changed })).toEqual({ status: "conflict" });
  });

  it("exposes a validated endpoint with auth, capability and private no-store", async () => {
    const app = Fastify();
    const identityProvider = { getUser: async () => ({ id: id(1) }) } as unknown as IdentityProvider;
    let roles = ["content_creator"];
    const contentProvider = { getRoles: async () => roles } as unknown as ContentProvider;
    await registerGuidedV2EditorImportRoutes(app, { identityProvider, contentProvider, provider });
    try {
      const body = { package: fixture(), bindings: bindings(), targetPathId: null, expectedVersion: null };
      const unauthorized = await app.inject({ method: "POST", url: "/v2/editor/learning-paths/imports/validate", payload: body });
      expect(unauthorized.statusCode).toBe(401);
      const response = await app.inject({ method: "POST", url: "/v2/editor/learning-paths/imports/validate", headers: { authorization: "Bearer test", "idempotency-key": crypto.randomUUID() }, payload: body });
      expect(response.statusCode).toBe(200);
      expect(response.headers["cache-control"]).toBe("private, no-store");
      expect(response.json()).toMatchObject({ readyToImport: true });
      roles = [];
      const forbidden = await app.inject({ method: "POST", url: "/v2/editor/learning-paths/imports/validate",
        headers: { authorization: "Bearer test", "idempotency-key": crypto.randomUUID() }, payload: body });
      expect(forbidden.statusCode).toBe(403);
      roles = ["content_creator"];
      const oversized = fixture();
      oversized.editorial.notes = "x".repeat(MAX_ROUTE_IMPORT_BYTES);
      const tooLarge = await app.inject({ method: "POST", url: "/v2/editor/learning-paths/imports/validate",
        headers: { authorization: "Bearer test", "idempotency-key": crypto.randomUUID() },
        payload: { ...body, package: oversized } });
      expect(tooLarge.statusCode).toBe(413);
    } finally { await app.close(); }
  });

  it("limits validate to 10 sessions per actor per ten minutes", async () => {
    for (let index = 0; index < 10; index++) {
      expect((await provider.validateImport(request({ actorUserId: id(2) }))).status).toBe("success");
    }
    expect(await provider.validateImport(request({ actorUserId: id(2) }))).toEqual({ status: "rate_limited" });
  });

  it("I01/I02 commits once, replays the receipt and exports exact portable content", async () => {
    const pkg = namedFixture("roundtrip-import");
    const validated = await provider.validateImport(request({ package: pkg }));
    expect(validated.status).toBe("success");
    if (validated.status !== "success") return;
    const input = { actorUserId: id(1), canCreate: true, canEditAll: false, importId: validated.value.importId,
      idempotencyKey: crypto.randomUUID(), hash: validated.value.hash, expectedVersion: null };
    const before = (await pg.query<{ n: number }>("select count(*)::int as n from public.learning_paths")).rows[0]!.n;
    const committed = await provider.commitImport(input);
    expect(committed).toMatchObject({ status: "success", value: { editVersion: 1, status: "draft" } });
    if (committed.status !== "success") return;
    expect(await provider.commitImport(input)).toEqual(committed);
    const anotherValidation = await provider.validateImport(request({ package: pkg }));
    expect(anotherValidation.status).toBe("success");
    if (anotherValidation.status === "success") {
      const sameKey = { ...input, importId: anotherValidation.value.importId, hash: anotherValidation.value.hash };
      expect(await provider.commitImport(sameKey)).toEqual({ status: "conflict" });
      expect(await provider.commitImport({ ...sameKey, idempotencyKey: crypto.randomUUID() })).toEqual(committed);
    }
    expect((await pg.query<{ n: number }>("select count(*)::int as n from public.learning_paths")).rows[0]!.n).toBe(before + 1);
    const exported = await provider.exportPath({ actorUserId: id(1), canEdit: true, canEditAll: false, pathId: committed.value.pathId });
    expect(exported).toEqual({ status: "success", value: { package: pkg, bindings: bindings() } });
    expect(JSON.stringify(exported)).not.toMatch(/createdBy|approvedBy|signedUrl|progress/i);
    expect((await pg.query<{ n: number }>("select count(*)::int as n from public.learning_path_steps")).rows[0]!.n).toBe(0);
    const other = await testDatabase();
    try {
      await seedImportCatalog(other.pg, 20);
      const otherProvider = createPostgresGuidedLearningV2Provider(other.database);
      const otherBindings = bindings(20);
      const revalidated = await otherProvider.validateImport({ ...request(), actorUserId: id(21),
        package: pkg, bindings: otherBindings });
      expect(revalidated.status).toBe("success");
      if (revalidated.status !== "success") return;
      const reimported = await otherProvider.commitImport({ actorUserId: id(21), canCreate: true, canEditAll: false,
        importId: revalidated.value.importId, idempotencyKey: crypto.randomUUID(),
        hash: revalidated.value.hash, expectedVersion: null });
      expect(reimported.status).toBe("success");
      if (reimported.status !== "success") return;
      expect(reimported.value.pathId).not.toBe(committed.value.pathId);
      expect(await otherProvider.exportPath({ actorUserId: id(21), canEdit: true, canEditAll: false,
        pathId: reimported.value.pathId })).toEqual({ status: "success", value: { package: pkg, bindings: otherBindings } });
      expect(revalidated.value.hash).toBe(validated.value.hash);
    } finally { await other.database.destroy(); await other.pg.close(); }
  });

  it("I03 updates only the target draft with CAS and rejects reused revision with changed hash", async () => {
    const original = namedFixture("target-import");
    const created = await provider.createDraft({ actorUserId: id(1), canCreate: true, package: original, bindings: bindings() });
    expect(created.status).toBe("success");
    if (created.status !== "success") return;
    const changedSameRevision = structuredClone(original);
    changedSameRevision.route.title = "Revisión reutilizada";
    const invalid = await provider.validateImport(request({ package: changedSameRevision,
      targetPathId: created.value.pathId, expectedVersion: 1 }));
    expect(invalid.status).toBe("success");
    if (invalid.status === "success") expect(await provider.commitImport({ actorUserId: id(1), canCreate: true, canEditAll: false,
      importId: invalid.value.importId, idempotencyKey: crypto.randomUUID(), hash: invalid.value.hash, expectedVersion: 1 })).toEqual({ status: "conflict" });
    const revisionOnly = structuredClone(original);
    revisionOnly.revision = 2;
    const noDiff = await provider.validateImport(request({ package: revisionOnly,
      targetPathId: created.value.pathId, expectedVersion: 1 }));
    expect(noDiff.status).toBe("success");
    if (noDiff.status === "success") expect(await provider.commitImport({ actorUserId: id(1), canCreate: true, canEditAll: false,
      importId: noDiff.value.importId, idempotencyKey: crypto.randomUUID(), hash: noDiff.value.hash, expectedVersion: 1 })).toEqual({ status: "conflict" });
    const next = structuredClone(original);
    next.revision = 2;
    next.route.title = "Nueva revisión";
    const validation = await provider.validateImport(request({ package: next, targetPathId: created.value.pathId, expectedVersion: 1 }));
    expect(validation.status).toBe("success");
    if (validation.status !== "success") return;
    const committed = await provider.commitImport({ actorUserId: id(1), canCreate: true, canEditAll: false,
      importId: validation.value.importId, idempotencyKey: crypto.randomUUID(), hash: validation.value.hash, expectedVersion: 1 });
    expect(committed).toMatchObject({ status: "success", value: { pathId: created.value.pathId,
      pathVersionId: created.value.pathVersionId, editVersion: 2, status: "draft" } });
    expect(await provider.exportPath({ actorUserId: id(1), canEdit: true, canEditAll: false,
      pathId: created.value.pathId })).toMatchObject({ status: "success", value: { package: next } });
    expect(await provider.commitImport({ actorUserId: id(1), canCreate: true, canEditAll: false,
      importId: validation.value.importId, idempotencyKey: crypto.randomUUID(), hash: validation.value.hash, expectedVersion: 2 })).toEqual({ status: "conflict" });
  });

  it("I03 rejects a new import that reuses packageKey and revision with different content", async () => {
    const pkg = namedFixture("reused-revision");
    const first = await provider.validateImport(request({ package: pkg }));
    expect(first.status).toBe("success");
    if (first.status !== "success") return;
    expect((await provider.commitImport({ actorUserId: id(1), canCreate: true, canEditAll: false,
      importId: first.value.importId, idempotencyKey: crypto.randomUUID(), hash: first.value.hash, expectedVersion: null })).status).toBe("success");
    const changed = structuredClone(pkg);
    changed.route.title = "Otro título";
    const second = await provider.validateImport(request({ package: changed }));
    expect(second.status).toBe("success");
    if (second.status === "success") expect(await provider.commitImport({ actorUserId: id(1), canCreate: true, canEditAll: false,
      importId: second.value.importId, idempotencyKey: crypto.randomUUID(), hash: second.value.hash, expectedVersion: null })).toEqual({ status: "conflict" });
  });

  it("I03 rechecks the guide after dry-run and preserves the validated session on failure", async () => {
    const pkg = namedFixture("changed-source");
    const validated = await provider.validateImport(request({ package: pkg }));
    expect(validated.status).toBe("success");
    if (validated.status !== "success") return;
    await pg.query("update public.content_items set version=version+1 where id=$1", [id(4)]);
    try {
      const before = (await pg.query<{ n: number }>("select count(*)::int as n from public.learning_paths")).rows[0]!.n;
      const result = await provider.commitImport({ actorUserId: id(1), canCreate: true, canEditAll: false,
        importId: validated.value.importId, idempotencyKey: crypto.randomUUID(), hash: validated.value.hash, expectedVersion: null });
      expect(result.status).toBe("invalid");
      if (result.status === "invalid") expect(result.issues).toContainEqual(expect.objectContaining({ code: "SOURCE_CHANGED" }));
      expect((await pg.query<{ n: number }>("select count(*)::int as n from public.learning_paths")).rows[0]!.n).toBe(before);
      expect((await pg.query<{ state: string }>("select state from public.learning_v2_imports where id=$1", [validated.value.importId])).rows[0]!.state).toBe("validated");
    } finally { await pg.query("update public.content_items set version=version-1 where id=$1", [id(4)]); }
  });

  it("rejects another actor and an expired session", async () => {
    const validated = await provider.validateImport(request({ package: namedFixture("expired-import") }));
    expect(validated.status).toBe("success");
    if (validated.status !== "success") return;
    const input = { actorUserId: id(1), canCreate: true, canEditAll: false, importId: validated.value.importId,
      idempotencyKey: crypto.randomUUID(), hash: validated.value.hash, expectedVersion: null };
    expect(await provider.commitImport({ ...input, actorUserId: id(2) })).toEqual({ status: "not_found" });
    const future = createPostgresGuidedLearningV2Provider(database, { now: () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) });
    expect(await future.commitImport(input)).toEqual({ status: "conflict" });
    expect((await pg.query<{ state: string }>("select state from public.learning_v2_imports where id=$1", [validated.value.importId])).rows[0]!.state).toBe("expired");
  });

  it("rolls back route, version and bindings when closing the import fails", async () => {
    const validated = await provider.validateImport(request({ package: namedFixture("rollback-import") }));
    expect(validated.status).toBe("success");
    if (validated.status !== "success") return;
    const before = (await pg.query<{ n: number }>("select count(*)::int as n from public.learning_paths")).rows[0]!.n;
    await pg.exec(`create function private.reject_import_commit() returns trigger language plpgsql as $$ begin
      if new.state = 'committed' then raise exception 'injected import failure'; end if; return new; end $$;
      create trigger reject_import_commit before update on public.learning_v2_imports
      for each row execute function private.reject_import_commit();`);
    try {
      expect(await provider.commitImport({ actorUserId: id(1), canCreate: true, canEditAll: false,
        importId: validated.value.importId, idempotencyKey: crypto.randomUUID(), hash: validated.value.hash, expectedVersion: null })).toEqual({ status: "conflict" });
      expect((await pg.query<{ n: number }>("select count(*)::int as n from public.learning_paths")).rows[0]!.n).toBe(before);
      expect((await pg.query<{ state: string }>("select state from public.learning_v2_imports where id=$1", [validated.value.importId])).rows[0]!.state).toBe("validated");
    } finally { await pg.exec("drop trigger reject_import_commit on public.learning_v2_imports; drop function private.reject_import_commit();"); }
  });

  it("returns the original receipt after a later edit and rejects stale target CAS", async () => {
    const pkg = namedFixture("receipt-after-edit");
    const validated = await provider.validateImport(request({ package: pkg }));
    expect(validated.status).toBe("success");
    if (validated.status !== "success") return;
    const input = { actorUserId: id(1), canCreate: true, canEditAll: false, importId: validated.value.importId,
      idempotencyKey: crypto.randomUUID(), hash: validated.value.hash, expectedVersion: null };
    const original = await provider.commitImport(input);
    expect(original.status).toBe("success");
    if (original.status !== "success") return;
    const changed = structuredClone(pkg);
    changed.revision = 2;
    changed.route.title = "Edición posterior";
    expect((await provider.saveDraft({ actorUserId: id(1), canEdit: true, canEditAll: false,
      pathId: original.value.pathId, expectedVersion: 1, package: changed, bindings: bindings() })).status).toBe("success");
    expect(await provider.commitImport(input)).toEqual(original);
    const next = structuredClone(changed);
    next.revision = 3;
    next.route.title = "Importación obsoleta";
    const targetValidation = await provider.validateImport(request({ package: next,
      targetPathId: original.value.pathId, expectedVersion: 2 }));
    expect(targetValidation.status).toBe("success");
    if (targetValidation.status !== "success") return;
    const concurrent = structuredClone(changed);
    concurrent.revision = 4;
    concurrent.route.title = "Cambio concurrente";
    expect((await provider.saveDraft({ actorUserId: id(1), canEdit: true, canEditAll: false,
      pathId: original.value.pathId, expectedVersion: 2, package: concurrent, bindings: bindings() })).status).toBe("success");
    expect(await provider.commitImport({ ...input, idempotencyKey: crypto.randomUUID(), importId: targetValidation.value.importId,
      hash: targetValidation.value.hash, expectedVersion: 2 })).toEqual({ status: "version_conflict" });
  });

  it("serves commit and export through authenticated editor HTTP routes", async () => {
    const app = Fastify();
    const identityProvider = { getUser: async () => ({ id: id(1) }) } as unknown as IdentityProvider;
    const contentProvider = { getRoles: async () => ["content_creator"] } as unknown as ContentProvider;
    await registerGuidedV2EditorImportRoutes(app, { identityProvider, contentProvider, provider });
    try {
      const pkg = namedFixture("http-roundtrip");
      const headers = { authorization: "Bearer test", "idempotency-key": crypto.randomUUID() };
      const validate = await app.inject({ method: "POST", url: "/v2/editor/learning-paths/imports/validate", headers,
        payload: { package: pkg, bindings: bindings(), targetPathId: null, expectedVersion: null } });
      expect(validate.statusCode).toBe(200);
      const validated = validate.json<{ importId: string; hash: string }>();
      const commitUrl = `/v2/editor/learning-paths/imports/${validated.importId}/commit`;
      const committed = await app.inject({ method: "POST", url: commitUrl,
        headers: { ...headers, "idempotency-key": crypto.randomUUID() },
        payload: { hash: validated.hash, expectedVersion: null } });
      expect(committed.statusCode).toBe(200);
      expect(committed.headers["cache-control"]).toBe("private, no-store");
      const receipt = committed.json<{ pathId: string; editVersion: number; status: string }>();
      expect(receipt).toMatchObject({ editVersion: 1, status: "draft" });
      const replay = await app.inject({ method: "POST", url: commitUrl,
        headers: { ...headers, "idempotency-key": crypto.randomUUID() },
        payload: { hash: validated.hash, expectedVersion: null } });
      expect(replay.json()).toEqual(receipt);
      const exported = await app.inject({ method: "GET", url: `/v2/editor/learning-paths/${receipt.pathId}/export`,
        headers: { authorization: "Bearer test" } });
      expect(exported.statusCode).toBe(200);
      expect(exported.headers["cache-control"]).toBe("private, no-store");
      expect(exported.json()).toEqual({ package: pkg, bindings: bindings() });
      const wrongHash = await app.inject({ method: "POST", url: commitUrl,
        headers: { ...headers, "idempotency-key": crypto.randomUUID() },
        payload: { hash: "e".repeat(64), expectedVersion: null } });
      expect(wrongHash.statusCode).toBe(409);
    } finally { await app.close(); }
  });
});
