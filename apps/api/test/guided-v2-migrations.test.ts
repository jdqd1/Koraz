import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createGuidedV2Database, seedGuidedV2Runtime, v2Id } from "./helpers/guided-v2-db.js";

const migrationDirectory = new URL("../../../database/migrations/", import.meta.url);
const migrationName = "0030_guided_v2_definition.sql";
const id = (last: number) => `70000000-0000-4000-8000-${String(last).padStart(12, "0")}`;
const digest = "a".repeat(64);
const emptyDb = new PGlite();
const legacyDb = new PGlite();
let legacyBefore = "";

async function legacySnapshot(db: PGlite): Promise<string> {
  const version = await db.query(`select id,path_id,version_number,status,policy_version,policy_json,release_notes from public.learning_path_versions where id='${id(4)}'`);
  const enrollment = await db.query(`select id,user_id,path_id,path_version_id,status,row_version from public.learning_enrollments where id='${id(5)}'`);
  const attempt = await db.query(`select id,user_id,client_attempt_id,purpose,projection,status,manifest_json from public.learning_attempts where id='${id(6)}'`);
  return JSON.stringify([version.rows, enrollment.rows, attempt.rows]);
}

async function apply(db: PGlite, file: string): Promise<void> {
  const sql = await readFile(new URL(file, migrationDirectory), "utf8");
  await db.exec(`begin;\n${sql}\ncommit;`);
}

async function applyPreviousChain(db: PGlite): Promise<void> {
  await db.exec("create role cediah_runtime; create role anon; create role authenticated; alter default privileges in schema public grant all on tables to anon, authenticated;");
  // 0005 restores a specific legacy account and deliberately fails on an empty DB.
  const files = (await readdir(migrationDirectory)).filter((file) => /^\d+_[a-z0-9_]+\.sql$/.test(file)).sort((a, b) => a.localeCompare(b));
  expect(files).toContain(migrationName);
  for (const file of files.filter((name) => name.localeCompare(migrationName) < 0)) {
    if (file !== "0005_restore_legacy_content.sql") await apply(db, file);
  }
}

async function legacyFixture(db: PGlite): Promise<void> {
  await db.exec(`
    begin;
    insert into public.auth_users (id, name, email) values ('${id(1)}', 'Editor', 'v2-migration@example.test');
    insert into public.content_items (id, kind, slug, title, summary, topic, author_user_id)
      values ('${id(2)}', 'topic', 'tema-v2-test', 'Tema', 'Tema de prueba', 'Tema', '${id(1)}');
    insert into public.learning_paths (id, topic_content_id, slug, title, summary, cover_key, created_by)
      values ('${id(3)}', '${id(2)}', 'ruta-v1-test', 'Ruta v1', 'Resumen de prueba', 'heart', '${id(1)}');
    insert into public.learning_path_versions (id, path_id, version_number, policy_version, policy_json)
      values ('${id(4)}', '${id(3)}', 1, 'guided-v1', '{"legacy":true}');
    insert into public.learning_enrollments (id, user_id, path_id, path_version_id)
      values ('${id(5)}', '${id(1)}', '${id(3)}', '${id(4)}');
    insert into public.learning_enrollment_versions (enrollment_id, path_id, path_version_id)
      values ('${id(5)}', '${id(3)}', '${id(4)}');
    insert into public.learning_attempts (id, user_id, client_attempt_id, purpose, projection, manifest_json)
      values ('${id(6)}', '${id(1)}', '${id(7)}', 'recall', 'review', '{}');
    commit;
  `);
}

beforeAll(async () => {
  await applyPreviousChain(emptyDb);
  await apply(emptyDb, migrationName);
  await applyPreviousChain(legacyDb);
  await legacyFixture(legacyDb);
  legacyBefore = await legacySnapshot(legacyDb);
  await apply(legacyDb, migrationName);
}, 120_000);

afterAll(async () => {
  await emptyDb.close();
  await legacyDb.close();
});

describe("guided v2 editorial migration", () => {
  it("M01 installs the schema chain on an empty database, excluding guarded legacy data restoration", async () => {
    const columns = await emptyDb.query<{ column_name: string }>(
      "select column_name from information_schema.columns where table_schema='public' and table_name='learning_path_versions' and column_name='definition_v2_json'",
    );
    expect(columns.rows).toHaveLength(1);
    const table = await emptyDb.query<{ relrowsecurity: boolean }>("select relrowsecurity from pg_class where oid='public.learning_v2_bindings'::regclass");
    expect(table.rows[0]?.relrowsecurity).toBe(true);
  });

  it("M01 preserves v1 versions, enrollment and attempt while rejecting a v1 definition", async () => {
    const result = await legacyDb.query<{ policy_version: string; definition_v2_json: unknown; policy_json: unknown }>(
      `select policy_version, definition_v2_json, policy_json from public.learning_path_versions where id='${id(4)}'`,
    );
    expect(result.rows[0]).toMatchObject({ policy_version: "guided-v1", definition_v2_json: null, policy_json: { legacy: true } });
    expect((await legacyDb.query<{ count: number }>("select count(*)::integer as count from public.learning_enrollments")).rows[0]?.count).toBe(1);
    expect((await legacyDb.query<{ count: number }>("select count(*)::integer as count from public.learning_attempts")).rows[0]?.count).toBe(1);
    expect(await legacySnapshot(legacyDb)).toBe(legacyBefore);
    await expect(legacyDb.exec(`update public.learning_path_versions set definition_v2_json='{"schemaVersion":"2.0"}' where id='${id(4)}'`)).rejects.toThrow();
  });

  it("requires a v2 object only for guided-v2.0", async () => {
    await expect(legacyDb.exec(`insert into public.learning_path_versions (id,path_id,version_number,policy_version) values ('${id(8)}','${id(3)}',2,'guided-v2.0')`)).rejects.toThrow();
    await expect(legacyDb.exec(`insert into public.learning_path_versions (id,path_id,version_number,policy_version,definition_v2_json) values ('${id(8)}','${id(3)}',2,'guided-v2.0','{"schemaVersion":"1.0"}')`)).rejects.toThrow();
    await legacyDb.exec(`insert into public.learning_path_versions (id,path_id,version_number,policy_version,definition_v2_json) values ('${id(8)}','${id(3)}',2,'guided-v2.0','{"schemaVersion":"2.0"}')`);
  });

  it("validates binding shape, FKs and matching route topic", async () => {
    await legacyDb.exec(`
      insert into public.content_items (id,kind,slug,title,summary,topic,author_user_id)
        values ('${id(10)}','guide','guide-v2-test','Guía','Guía de prueba','Tema','${id(1)}');
      insert into public.content_items (id,kind,slug,title,summary,topic,author_user_id)
        values ('${id(15)}','topic','other-topic-v2-test','Otro tema','Tema de prueba','Tema','${id(1)}');
      insert into public.learning_resources (id,source_content_id,projection,adapter_key)
        values ('${id(11)}','${id(10)}','guide','guide-adapter');
      insert into public.learning_resource_revisions (id,resource_id,revision_number,source_version,adapter_version,schema_version,payload_json,payload_hash)
        values ('${id(12)}','${id(11)}',1,1,1,1,'{}','${digest}');
      insert into public.content_assets (id,content_item_id,owner_user_id,kind,storage_bucket,storage_path,original_file_name,mime_type,size_bytes)
        values ('${id(13)}','${id(10)}','${id(1)}','image','assets','v2-test/image.png','image.png','image/png',100);
    `);
    await legacyDb.exec(`insert into public.learning_v2_bindings (path_version_id,local_key,kind,topic_content_id) values ('${id(8)}','topic','topic','${id(2)}')`);
    await legacyDb.exec(`insert into public.learning_v2_bindings (path_version_id,local_key,kind,document_sha256) values ('${id(8)}','reference','source','${digest}')`);
    await legacyDb.exec(`insert into public.learning_v2_bindings (path_version_id,local_key,kind,source_content_id,resource_revision_id,document_sha256) values ('${id(8)}','guide','source','${id(10)}','${id(12)}','${digest}')`);
    await legacyDb.exec(`insert into public.learning_v2_bindings (path_version_id,local_key,kind,asset_id,asset_sha256,rights_status,rights_credit) values ('${id(8)}','image','asset','${id(13)}','${digest}','licensed','Autor')`);
    await expect(legacyDb.exec(`insert into public.learning_v2_bindings (path_version_id,local_key,kind,topic_content_id) values ('${id(8)}','other','topic','${id(2)}')`)).rejects.toThrow();
    await expect(legacyDb.exec(`update public.learning_v2_bindings set topic_content_id='${id(15)}' where path_version_id='${id(8)}' and kind='topic'`)).rejects.toThrow(/match route topic/);
    await expect(legacyDb.exec(`insert into public.learning_v2_bindings (path_version_id,local_key,kind,document_sha256) values ('${id(8)}','bad-source','source','short')`)).rejects.toThrow();
    await expect(legacyDb.exec(`insert into public.learning_v2_bindings (path_version_id,local_key,kind) values ('${id(8)}','missing-hash','source')`)).rejects.toThrow();
    await expect(legacyDb.exec(`insert into public.learning_v2_bindings (path_version_id,local_key,kind,source_content_id,resource_revision_id,document_sha256) values ('${id(8)}','bad-revision','source','${id(2)}','${id(12)}','${digest}')`)).rejects.toThrow(/does not belong/);
    await expect(legacyDb.exec(`insert into public.learning_v2_bindings (path_version_id,local_key,kind,asset_id,rights_status,rights_credit) values ('${id(8)}','image','asset','${id(20)}','licensed','Autor')`)).rejects.toThrow();
    await expect(legacyDb.exec(`insert into public.learning_v2_bindings (path_version_id,local_key,kind,asset_id,rights_credit) values ('${id(8)}','missing-rights','asset','${id(13)}','Autor')`)).rejects.toThrow();
    await expect(legacyDb.exec(`insert into public.learning_v2_bindings (path_version_id,local_key,kind,asset_id,rights_status,rights_credit) values ('${id(8)}','missing-credit','asset','${id(13)}','licensed','')`)).rejects.toThrow();
    await expect(legacyDb.exec(`insert into public.learning_v2_bindings (path_version_id,local_key,kind,document_sha256) values ('${id(4)}','wrong-engine','source','${digest}')`)).rejects.toThrow();
    await expect(legacyDb.exec(`update public.learning_path_versions set policy_version='guided-v1', definition_v2_json=null where id='${id(8)}'`)).rejects.toThrow(/bindings must be removed/);
  });

  it("M02 prevents edits, deletes and additions to published bindings", async () => {
    await legacyDb.exec(`update public.learning_path_versions set status='published', published_at=now(), published_by='${id(1)}' where id='${id(8)}'`);
    await expect(legacyDb.exec(`update public.learning_v2_bindings set document_sha256='${"b".repeat(64)}' where path_version_id='${id(8)}' and local_key='reference'`)).rejects.toThrow(/immutable/);
    await expect(legacyDb.exec(`delete from public.learning_v2_bindings where path_version_id='${id(8)}' and local_key='reference'`)).rejects.toThrow(/immutable/);
    await expect(legacyDb.exec(`insert into public.learning_v2_bindings (path_version_id,local_key,kind,document_sha256) values ('${id(8)}','new-source','source','${digest}')`)).rejects.toThrow(/immutable/);
    await expect(legacyDb.exec(`update public.learning_path_versions set definition_v2_json='{"schemaVersion":"2.0","changed":true}' where id='${id(8)}'`)).rejects.toThrow(/immutable/);
  });

  it("S06 denies browser roles and permits restricted runtime operations on drafts", async () => {
    const grants = await legacyDb.query<{ anon: boolean; authenticated: boolean; runtime: boolean }>(
      "select has_table_privilege('anon','public.learning_v2_bindings','SELECT,INSERT,UPDATE,DELETE') as anon, has_table_privilege('authenticated','public.learning_v2_bindings','SELECT,INSERT,UPDATE,DELETE') as authenticated, has_table_privilege('cediah_runtime','public.learning_v2_bindings','SELECT,INSERT,UPDATE,DELETE') as runtime",
    );
    expect(grants.rows[0]).toEqual({ anon: false, authenticated: false, runtime: true });
    await legacyDb.exec("set role anon");
    await expect(legacyDb.query("select * from public.learning_v2_bindings")).rejects.toThrow(/permission denied/);
    await legacyDb.exec("reset role; set role authenticated");
    await expect(legacyDb.query("select * from public.learning_v2_bindings")).rejects.toThrow(/permission denied/);
    await legacyDb.exec(`reset role; insert into public.learning_path_versions (id,path_id,version_number,policy_version,definition_v2_json) values ('${id(9)}','${id(3)}',3,'guided-v2.0','{"schemaVersion":"2.0"}'); set role cediah_runtime`);
    try {
      const rows = await legacyDb.query<{ local_key: string }>(`select local_key from public.learning_v2_bindings where path_version_id='${id(8)}'`);
      expect(rows.rows.map((row) => row.local_key).sort()).toEqual(["guide", "image", "reference", "topic"]);
      await legacyDb.exec(`insert into public.learning_v2_bindings (path_version_id,local_key,kind,document_sha256) values ('${id(9)}','runtime-source','source','${digest}')`);
      await legacyDb.exec(`update public.learning_v2_bindings set document_sha256='${"b".repeat(64)}' where path_version_id='${id(9)}' and local_key='runtime-source'`);
      await legacyDb.exec(`delete from public.learning_v2_bindings where path_version_id='${id(9)}' and local_key='runtime-source'`);
    } finally { await legacyDb.exec("reset role"); }
  });

  it("keeps explicit route deletion compatible with published binding cleanup", async () => {
    await expect(legacyDb.exec(`delete from public.learning_path_versions where id='${id(8)}'`)).rejects.toThrow(/immutable/);
    await legacyDb.exec(`begin; select set_config('cediah.deleting_learning_path_id','${id(3)}',true); delete from public.learning_path_versions where id='${id(8)}'; commit;`);
    const remaining = await legacyDb.query<{ count: number }>(`select count(*)::integer as count from public.learning_v2_bindings where path_version_id='${id(8)}'`);
    expect(remaining.rows[0]?.count).toBe(0);
    expect(await legacySnapshot(legacyDb)).toBe(legacyBefore);
  });
});

describe("guided v2 runtime migration", () => {
  let db: PGlite;
  const attempt = `insert into public.learning_v2_attempts
    (id,user_id,enrollment_id,path_version_id,client_attempt_id,purpose,snapshot_json)
    values ('${v2Id(10)}','${v2Id(1)}','${v2Id(8)}','${v2Id(6)}','${v2Id(11)}','activity','{}')`;
  const response = `insert into public.learning_v2_responses
    (id,attempt_id,user_id,enrollment_id,path_version_id,activity_key,objective_key,equivalence_key,
      item_revision_hash,modality,purpose,answer_json,grading_json,grading_source)
    values ('${v2Id(12)}','${v2Id(10)}','${v2Id(1)}','${v2Id(8)}','${v2Id(6)}',
      'activity-one','objective-one','family-one','${digest}','text','learning','{}','{}','server')`;

  beforeAll(async () => {
    db = await createGuidedV2Database();
    await seedGuidedV2Runtime(db);
    await db.exec(attempt);
    await db.exec(response);
  }, 120_000);

  afterAll(async () => { await db?.close(); });

  it("installs all six runtime tables with RLS, and keeps v1 rows usable", async () => {
    const tables = await db.query<{ relname: string; relrowsecurity: boolean }>(`
      select relname, relrowsecurity from pg_class
      where relname in ('learning_v2_attempts','learning_v2_responses','learning_v2_objective_state',
        'learning_v2_activity_state','learning_v2_review_state','learning_v2_imports') order by relname`);
    expect(tables.rows).toHaveLength(6);
    expect(tables.rows.every((row) => row.relrowsecurity)).toBe(true);
    expect((await db.query(`select policy_version from public.learning_path_versions where id='${v2Id(5)}'`)).rows[0]).toMatchObject({ policy_version: "guided-v1" });
    expect((await db.query(`select count(*)::int as n from public.learning_enrollments`)).rows[0]).toMatchObject({ n: 2 });
  });

  it("rejects mismatched user, unadopted version, v1 version and duplicate client attempt", async () => {
    await expect(db.exec(attempt.replace(v2Id(10), v2Id(20)))).rejects.toThrow();
    await expect(db.exec(attempt.replace(v2Id(10), v2Id(21)).replace(v2Id(1), v2Id(2)))).rejects.toThrow();
    await expect(db.exec(attempt.replace(v2Id(10), v2Id(22)).replace(v2Id(6), v2Id(7)).replace(v2Id(11), v2Id(23)))).rejects.toThrow();
    await expect(db.exec(attempt.replace(v2Id(10), v2Id(24)).replace(v2Id(6), v2Id(5)).replace(v2Id(11), v2Id(25)))).rejects.toThrow(/guided-v2.0/);
  });

  it("deduplicates by attempt and activity, binds responses to their owner, and rolls back atomically", async () => {
    await expect(db.exec(response.replace(v2Id(12), v2Id(26)))).rejects.toThrow();
    await expect(db.exec(response.replace(v2Id(12), v2Id(27)).replace(v2Id(1), v2Id(2)).replace("activity-one", "activity-two"))).rejects.toThrow();
    await expect(db.exec(response.replace(v2Id(12), v2Id(28)).replace(v2Id(8), v2Id(9)).replace("activity-one", "activity-two"))).rejects.toThrow();
    await expect(db.exec(`begin; insert into public.learning_v2_responses
      (id,attempt_id,user_id,enrollment_id,path_version_id,activity_key,objective_key,equivalence_key,
        item_revision_hash,modality,purpose,answer_json,grading_json,grading_source)
      values ('${v2Id(29)}','${v2Id(10)}','${v2Id(1)}','${v2Id(8)}','${v2Id(6)}',
        'rollback-one','objective-one','family-two','${digest}','text','learning','{}','{}','server');
      insert into public.learning_v2_responses
      (id,attempt_id,user_id,enrollment_id,path_version_id,activity_key,objective_key,equivalence_key,
        item_revision_hash,modality,purpose,answer_json,grading_json,grading_source)
      values ('${v2Id(30)}','${v2Id(10)}','${v2Id(1)}','${v2Id(8)}','${v2Id(6)}',
        'activity-one','objective-one','family-one','${digest}','text','learning','{}','{}','server'); commit;`)).rejects.toThrow();
    await db.exec("rollback");
    expect((await db.query(`select count(*)::int as n from public.learning_v2_responses where activity_key='rollback-one'`)).rows[0]).toMatchObject({ n: 0 });
  });

  it("enforces owner/version on derived states and indexes due review lookup", async () => {
    await db.exec(`insert into public.learning_v2_objective_state
      (enrollment_id,user_id,path_version_id,objective_key) values
      ('${v2Id(8)}','${v2Id(1)}','${v2Id(6)}','objective-one')`);
    await expect(db.exec(`insert into public.learning_v2_objective_state
      (enrollment_id,user_id,path_version_id,objective_key) values
      ('${v2Id(8)}','${v2Id(2)}','${v2Id(6)}','objective-two')`)).rejects.toThrow();
    await db.exec(`insert into public.learning_v2_activity_state
      (enrollment_id,user_id,path_version_id,activity_key,state,evidence_attempt_id) values
      ('${v2Id(8)}','${v2Id(1)}','${v2Id(6)}','activity-one','completed','${v2Id(10)}')`);
    await expect(db.exec(`insert into public.learning_v2_activity_state
      (enrollment_id,user_id,path_version_id,activity_key,state,evidence_attempt_id) values
      ('${v2Id(9)}','${v2Id(2)}','${v2Id(6)}','activity-other','completed','${v2Id(10)}')`)).rejects.toThrow();
    await db.exec(`insert into public.learning_v2_review_state
      (user_id,enrollment_id,path_version_id,objective_key,due_at,last_applied_response_id) values
      ('${v2Id(1)}','${v2Id(8)}','${v2Id(6)}','objective-one',now(),'${v2Id(12)}')`);
    await expect(db.exec(`insert into public.learning_v2_review_state
      (user_id,enrollment_id,path_version_id,objective_key,due_at,last_applied_response_id) values
      ('${v2Id(2)}','${v2Id(9)}','${v2Id(6)}','objective-other',now(),'${v2Id(12)}')`)).rejects.toThrow();
    const futureRows = Array.from({ length: 300 }, (_, index) =>
      `('${v2Id(1)}','${v2Id(8)}','${v2Id(6)}','future-${index}',now()+interval '30 days')`,
    );
    await db.exec(`insert into public.learning_v2_review_state
      (user_id,enrollment_id,path_version_id,objective_key,due_at) values ${futureRows.join(",")}`);
    await db.exec("analyze public.learning_v2_review_state");
    const plan = await db.query<Record<string, string>>(`explain select objective_key from public.learning_v2_review_state
      where user_id='${v2Id(1)}' and due_at <= now() order by due_at limit 10`);
    expect(JSON.stringify(plan.rows)).toContain("learning_v2_review_state_due_index");
  });

  it("deduplicates private imports and limits table rights to the server role", async () => {
    const sql = `insert into public.learning_v2_imports
      (id,actor_user_id,idempotency_key,package_key,revision,content_hash,bindings_hash,normalized_json,bindings_json,expires_at)
      values ('${v2Id(31)}','${v2Id(1)}','${v2Id(32)}','package-one',1,'${digest}','${digest}','{}','{}',now()+interval '1 day')`;
    await db.exec(sql);
    await expect(db.exec(sql.replace(v2Id(31), v2Id(33)))).rejects.toThrow();
    await db.exec(`insert into public.learning_paths (id,topic_content_id,slug,title,summary,cover_key,created_by)
      values ('${v2Id(34)}','${v2Id(3)}','other-runtime-route','Other route','Fixture','heart','${v2Id(1)}')`);
    await expect(db.exec(sql.replace(v2Id(31), v2Id(35)).replace(v2Id(32), v2Id(36))
      .replace("now()+interval '1 day'", `'${v2Id(34)}','${v2Id(6)}',now()+interval '1 day'`)
      .replace("normalized_json,bindings_json,expires_at", "normalized_json,bindings_json,target_path_id,target_version_id,expires_at"))).rejects.toThrow();
    for (const table of ["learning_v2_attempts", "learning_v2_responses", "learning_v2_objective_state", "learning_v2_activity_state", "learning_v2_review_state", "learning_v2_imports"]) {
      const grants = await db.query<{ browser: boolean; authenticated: boolean; runtime: boolean }>(`
        select has_table_privilege('anon','public.${table}','SELECT') as browser,
          has_table_privilege('authenticated','public.${table}','SELECT') as authenticated,
          has_table_privilege('cediah_runtime','public.${table}','SELECT') as runtime`);
      expect(grants.rows[0]).toEqual({ browser: false, authenticated: false, runtime: true });
    }
    const responseUpdate = await db.query<{ allowed: boolean }>("select has_table_privilege('cediah_runtime','public.learning_v2_responses','UPDATE') as allowed");
    expect(responseUpdate.rows[0]?.allowed).toBe(false);
    await db.exec("set role anon");
    await expect(db.query("select * from public.learning_v2_imports")).rejects.toThrow(/permission denied/);
    await db.exec("reset role; set role cediah_runtime");
    try {
      expect((await db.query(`select id from public.learning_v2_attempts where id='${v2Id(10)}'`)).rows).toHaveLength(1);
      await db.exec(`insert into public.learning_v2_imports
        (id,actor_user_id,idempotency_key,package_key,revision,content_hash,bindings_hash,normalized_json,bindings_json,expires_at)
        values ('${v2Id(37)}','${v2Id(1)}','${v2Id(38)}','runtime-import',1,'${digest}','${digest}','{}','{}',now()+interval '1 day')`);
      await expect(db.exec(`update public.learning_v2_responses set assisted=true where id='${v2Id(12)}'`)).rejects.toThrow(/permission denied/);
    } finally { await db.exec("reset role"); }
  });
});
