import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler,
  type CompiledQuery, type DatabaseConnection, type QueryResult,
} from "kysely";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { RoutePackageSchema, type RoutePackage } from "@cediah/contracts";
import type { CediahDatabase } from "../src/db/database.js";
import { prepareGuidedV2Draft } from "../src/guided-learning/v2/service.js";
import { createPostgresGuidedLearningV2Provider } from "../src/providers/postgres-guided-learning-v2.js";

const migrationDirectory = new URL("../../../database/migrations/", import.meta.url);
const id = (last: number) => `72000000-0000-4000-8000-${String(last).padStart(12, "0")}`;
const digest = "a".repeat(64);

async function testDatabase() {
  const pg = new PGlite();
  await pg.exec("create role cediah_runtime; create role anon; create role authenticated");
  const files = (await readdir(migrationDirectory))
    .filter((file) => /^\d+_[a-z0-9_]+\.sql$/.test(file) && file.localeCompare("0031_guided_v2_runtime.sql") <= 0)
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

async function seed(pg: PGlite, offset = 0) {
  await pg.exec(`
    begin;
    insert into public.auth_users (id,name,email) values
      ('${id(1 + offset)}','Editor','editor-${offset}@example.test'),
      ('${id(2 + offset)}','Other','other-${offset}@example.test');
    insert into public.content_items (id,kind,slug,title,summary,topic,author_user_id) values
      ('${id(3 + offset)}','topic','topic-${offset}','Tema','Tema sintético','Tema','${id(1 + offset)}'),
      ('${id(4 + offset)}','guide','guide-${offset}','Guía','Guía sintética','Tema','${id(1 + offset)}');
    insert into public.learning_resources (id,source_content_id,projection,adapter_key)
      values ('${id(5 + offset)}','${id(4 + offset)}','guide','guide-adapter');
    insert into public.learning_resource_revisions
      (id,resource_id,revision_number,source_version,adapter_version,schema_version,payload_json,payload_hash)
      values ('${id(6 + offset)}','${id(5 + offset)}',1,1,1,1,'{}','${digest}');
    commit;
  `);
}

function packageFixture(number: number): RoutePackage {
  return RoutePackageSchema.parse({
    schemaVersion: "2.0", packageKey: `editor-${number}`, revision: 1, locale: "es",
    route: {
      slug: `editor-${number}`, title: "Borrador sintético", summary: "Contenido de prueba",
      topicLabel: "Tema", audience: "Alumno", discipline: "general", coverKey: "heart",
    },
    policyVersion: "guided-v2.0",
    sources: [
      { key: "guide", kind: "guide", title: "Guía", citation: "Fuente de prueba", locator: { heading: "Inicio", sectionPath: [], page: 1 }, documentSha256: digest, excerpt: "Texto sintético", url: null, verification: "provided", checkedAt: null },
      { key: "reference", kind: "reference", title: "Referencia", citation: "Referencia de prueba", locator: { heading: "Anexo", sectionPath: [], page: 2 }, documentSha256: digest, excerpt: "Otro texto", url: "https://example.test/reference", verification: "verified", checkedAt: "2026-09-27" },
    ],
    assets: [], objectives: [], units: [], activities: [], assessments: [],
    reviewPlan: { objectiveKeys: [] }, editorial: { notes: "", unresolvedIssues: [] },
  });
}

function bindings(offset = 0) {
  return {
    topicContentId: id(3 + offset),
    sources: [{ key: "guide", sourceContentId: id(4 + offset), resourceRevisionId: id(6 + offset) }],
    assets: [],
  };
}

describe("guided v2 editorial storage", () => {
  let pg: PGlite;
  let database: Kysely<CediahDatabase>;
  let provider: ReturnType<typeof createPostgresGuidedLearningV2Provider>;
  let number = 0;
  let pkg: RoutePackage;
  let pathId: string;

  beforeAll(async () => {
    ({ pg, database } = await testDatabase());
    await seed(pg);
    provider = createPostgresGuidedLearningV2Provider(database);
  }, 120_000);
  afterAll(async () => { await database?.destroy(); await pg?.close(); });
  beforeEach(async () => {
    pkg = packageFixture(++number);
    const created = await provider.createDraft({ actorUserId: id(1), canCreate: true, package: pkg, bindings: bindings() });
    if (created.status !== "success") throw new Error(`Fixture creation failed: ${JSON.stringify(created)}`);
    pathId = created.value.pathId;
  });

  it("creates one canonical draft, reads it back and leaves v1 step tables empty", async () => {
    const read = await provider.getEditorPath({ actorUserId: id(1), canEdit: true, canEditAll: false, pathId });
    expect(read.status).toBe("success");
    if (read.status !== "success") return;
    expect(read.value).toMatchObject({
      definition: pkg, bindings: bindings(), editVersion: 1, status: "draft",
      policyVersion: "guided-v2.0", schedulerVersion: "scheduler-v2.0",
      reviewedContentHash: null, approvedBy: null,
    });
    const stored = await pg.query<{ definition_v2_json: RoutePackage }>(`select definition_v2_json from public.learning_path_versions where id='${read.value.pathVersionId}'`);
    expect(stored.rows[0]?.definition_v2_json).toEqual(pkg);
    expect((await pg.query<{ n: number }>("select count(*)::int as n from public.learning_path_units")).rows[0]?.n).toBe(0);
    expect((await pg.query<{ n: number }>("select count(*)::int as n from public.learning_path_steps")).rows[0]?.n).toBe(0);
    expect((await pg.query<{ n: number }>("select count(*)::int as n from public.learning_step_options")).rows[0]?.n).toBe(0);
    expect((await pg.query<{ created_by: string }>(`select created_by from public.learning_paths where id='${pathId}'`)).rows[0]?.created_by).toBe(id(1));
  });

  it("saves and rereads one version with CAS; stale writes do not change metadata", async () => {
    const next = structuredClone(pkg);
    next.route.title = "Título nuevo";
    next.route.slug = `${pkg.route.slug}-new`;
    next.revision = 2;
    const saved = await provider.saveDraft({ actorUserId: id(1), canEdit: true, canEditAll: false, pathId, expectedVersion: 1, package: next, bindings: bindings() });
    expect(saved.status).toBe("success");
    if (saved.status !== "success") return;
    expect(saved.value).toMatchObject({ editVersion: 2, definition: next });
    const stale = await provider.saveDraft({ actorUserId: id(1), canEdit: true, canEditAll: false, pathId, expectedVersion: 1, package: pkg, bindings: bindings() });
    expect(stale).toEqual({ status: "version_conflict" });
    const reread = await provider.getEditorPath({ actorUserId: id(1), canEdit: true, canEditAll: false, pathId });
    expect(reread).toMatchObject({ status: "success", value: { editVersion: 2, definition: next, contentHash: saved.value.contentHash } });
    expect((await pg.query<{ title: string }>(`select title from public.learning_paths where id='${pathId}'`)).rows[0]?.title).toBe("Título nuevo");
  });

  it("hashes canonical object keys but preserves source array order", () => {
    const rearranged = Object.fromEntries(Object.entries(pkg).reverse()) as unknown;
    const original = prepareGuidedV2Draft(pkg, bindings());
    const ordered = prepareGuidedV2Draft(rearranged, bindings());
    expect(original.status).toBe("success");
    expect(ordered.status).toBe("success");
    if (original.status !== "success" || ordered.status !== "success") return;
    expect(ordered.value.contentHash).toBe(original.value.contentHash);
    expect(ordered.value.canonicalJson).toBe(original.value.canonicalJson);
    const swapped = structuredClone(pkg);
    swapped.sources.reverse();
    const arrayChanged = prepareGuidedV2Draft(swapped, bindings());
    expect(arrayChanged.status).toBe("success");
    if (arrayChanged.status === "success") expect(arrayChanged.value.contentHash).not.toBe(original.value.contentHash);
  });

  it("enforces editor ownership and never trusts imported status or actor", async () => {
    expect(await provider.getEditorPath({ actorUserId: id(2), canEdit: true, canEditAll: false, pathId })).toEqual({ status: "not_found" });
    expect(await provider.getEditorPath({ actorUserId: id(1), canEdit: false, canEditAll: false, pathId })).toEqual({ status: "forbidden" });
    expect((await provider.getEditorPath({ actorUserId: id(2), canEdit: true, canEditAll: true, pathId })).status).toBe("success");
    expect(await provider.createDraft({ actorUserId: id(2), canCreate: false, package: pkg, bindings: bindings() })).toEqual({ status: "forbidden" });
    expect(await provider.createDraft({ actorUserId: id(2), canCreate: true, package: { ...pkg, status: "published", createdBy: id(2) }, bindings: bindings() })).toMatchObject({ status: "invalid" });
  });

  it("rolls back route metadata and version when a binding FK fails", async () => {
    const next = structuredClone(pkg);
    next.route.title = "No se debe guardar";
    const bad = { ...bindings(), sources: [{ key: "guide", sourceContentId: id(99), resourceRevisionId: id(6) }] };
    expect(await provider.saveDraft({ actorUserId: id(1), canEdit: true, canEditAll: false, pathId, expectedVersion: 1, package: next, bindings: bad })).toEqual({ status: "conflict" });
    const read = await provider.getEditorPath({ actorUserId: id(1), canEdit: true, canEditAll: false, pathId });
    expect(read).toMatchObject({ status: "success", value: { editVersion: 1, definition: pkg } });
  });

  it("rejects writes to published versions", async () => {
    const version = await pg.query<{ id: string }>(`select id from public.learning_path_versions where path_id='${pathId}'`);
    await pg.exec(`update public.learning_path_versions set status='published',published_at=now(),published_by='${id(1)}' where id='${version.rows[0]?.id}'`);
    const changed = structuredClone(pkg);
    changed.route.title = "No publicado";
    expect(await provider.saveDraft({ actorUserId: id(1), canEdit: true, canEditAll: false, pathId, expectedVersion: 1, package: changed, bindings: bindings() })).toEqual({ status: "conflict" });
    expect((await pg.query<{ edit_version: number }>(`select edit_version from public.learning_path_versions where id='${version.rows[0]?.id}'`)).rows[0]?.edit_version).toBe(1);
  });

  it("I02 keeps portable semantics when reimported with different catalog bindings", async () => {
    const original = await provider.getEditorPath({ actorUserId: id(1), canEdit: true, canEditAll: false, pathId });
    expect(original.status).toBe("success");
    if (original.status !== "success") return;
    const other = await testDatabase();
    try {
      await seed(other.pg, 20);
      const imported = await createPostgresGuidedLearningV2Provider(other.database).createDraft({
        actorUserId: id(21), canCreate: true, package: original.value.definition, bindings: bindings(20),
      });
      expect(imported.status).toBe("success");
      if (imported.status !== "success") return;
      expect(imported.value.definition).toEqual(original.value.definition);
      expect(imported.value.contentHash).toBe(original.value.contentHash);
      expect(imported.value.bindings.topicContentId).not.toBe(original.value.bindings.topicContentId);
      expect(imported.value.pathId).not.toBe(original.value.pathId);
    } finally { await other.database.destroy(); await other.pg.close(); }
  }, 120_000);
});
