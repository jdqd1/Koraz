import { createHash } from "node:crypto";
import { readdir, readFile, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readEnvironment } from "../src/config.js";
import { applySqlMigrations } from "../src/db/migrate.js";
import { assertGuidedV2TestControlUrl, createGuidedV2Postgres } from "./helpers/guided-v2-postgres.js";

const directory = fileURLToPath(new URL("../../../database/migrations/", import.meta.url));
const oldId = (n: number) => `76000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
const hash = (source: string) => createHash("sha256").update(source).digest("hex");

describe("M01 safe configuration", () => {
  it("keeps restore as default and requires an explicit empty profile", () => {
    expect(readEnvironment({}).legacyContentMode).toBe("restore");
    expect(readEnvironment({ DATABASE_LEGACY_CONTENT_MODE: "empty" }).legacyContentMode).toBe("empty");
    expect(() => readEnvironment({ DATABASE_LEGACY_CONTENT_MODE: "skip" })).toThrow();
  });
  it("refuses unmarked, remote and unrelated database targets", () => {
    for (const url of [undefined,"postgresql://koraz_test@production.example:55435/koraz_guided_v2_control_test",
      "postgresql://koraz_test@127.0.0.1:5432/koraz_guided_v2_control_test",
      "postgresql://koraz_test@127.0.0.1:55435/production"]) expect(() => assertGuidedV2TestControlUrl(url,"true")).toThrow();
    expect(() => assertGuidedV2TestControlUrl("postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test","false")).toThrow();
  });
});

describe.skipIf(!process.env.KORAZ_GUIDED_V2_TEST_DATABASE_URL)("M01 actual PostgreSQL migration runner", () => {
  let fresh: Awaited<ReturnType<typeof createGuidedV2Postgres>>;
  let guarded: Awaited<ReturnType<typeof createGuidedV2Postgres>>;
  let legacy: Awaited<ReturnType<typeof createGuidedV2Postgres>>;
  let original: string;
  let v1Before: unknown;
  const options = { legacyContentMode: "empty" as const };
  beforeAll(async () => {
    fresh = await createGuidedV2Postgres();
    guarded = await createGuidedV2Postgres({ migrate: false });
    const previous = await mkdtemp(join(tmpdir(),"koraz-m01-before-v2-"));
    for (const file of (await readdir(directory)).filter(f => /^\d+_[a-z0-9_]+\.sql$/.test(f) && f < "0030_guided_v2_definition.sql")) {
      await writeFile(join(previous,file),await readFile(join(directory,file)));
    }
    legacy = await createGuidedV2Postgres({ directory: previous });
    await legacy.pool.query(`insert into auth_users(id,name,email) values('${oldId(1)}','Fixture M01','legacy-fixture@example.test');
      insert into content_items(id,kind,slug,title,summary,topic,author_user_id) values('${oldId(2)}','topic','m01-topic','Tema','Fixture','Tema','${oldId(1)}');
      insert into learning_paths(id,topic_content_id,slug,title,summary,cover_key,created_by) values('${oldId(3)}','${oldId(2)}','m01-v1','Ruta v1','Fixture','heart','${oldId(1)}');
      insert into learning_path_versions(id,path_id,version_number,policy_version,policy_json) values('${oldId(4)}','${oldId(3)}',1,'guided-v1','{"legacy":true}');
      insert into learning_enrollments(id,user_id,path_id,path_version_id) values('${oldId(5)}','${oldId(1)}','${oldId(3)}','${oldId(4)}');
      insert into learning_enrollment_versions(enrollment_id,path_id,path_version_id) values('${oldId(5)}','${oldId(3)}','${oldId(4)}');
      insert into learning_attempts(id,user_id,client_attempt_id,purpose,projection,manifest_json) values('${oldId(6)}','${oldId(1)}','${oldId(7)}','recall','review','{}');`);
    v1Before = await v1Snapshot();
    original = hash(await readFile(join(directory,"0005_restore_legacy_content.sql"),"utf8"));
  },120000);
  afterAll(async () => { await fresh?.close(); await guarded?.close(); await legacy?.close(); });
  async function v1Snapshot() {
    return (await legacy.pool.query(`select
      (select jsonb_agg(to_jsonb(t)) from (select id,path_id,version_number,status,policy_version,policy_json,release_notes from learning_path_versions where id='${oldId(4)}') t) versions,
      (select jsonb_agg(to_jsonb(t)) from (select id,user_id,path_id,path_version_id,status,row_version from learning_enrollments where id='${oldId(5)}') t) enrollments,
      (select jsonb_agg(to_jsonb(t)) from (select id,user_id,client_attempt_id,purpose,projection,status,manifest_json from learning_attempts where id='${oldId(6)}') t) attempts`)).rows;
  }
  it("installs every schema migration, classifies 0005 honestly and preserves checksums",async () => {
    const files = (await readdir(directory)).filter(f => /^\d+_[a-z0-9_]+\.sql$/.test(f)).sort();
    const applied = (await fresh.pool.query("select file_name,checksum from cediah_schema_migrations")).rows;
    const exclusions = (await fresh.pool.query("select file_name,checksum,reason from cediah_schema_migration_exclusions")).rows;
    expect(exclusions).toEqual([{file_name:"0005_restore_legacy_content.sql",checksum:original,reason:"empty_installation"}]);
    expect(applied.map(r => r.file_name).sort()).toEqual(files.filter(f => f !== "0005_restore_legacy_content.sql"));
    for (const row of applied) expect(row.checksum).toBe(hash(await readFile(join(directory,row.file_name),"utf8")));
    expect((await fresh.pool.query("select count(*)::int n from auth_users")).rows).toEqual([{n:0}]);
    expect((await fresh.pool.query("select count(*)::int n from content_items")).rows).toEqual([{n:0}]);
    expect((await fresh.pool.query("select to_regclass('public.learning_v2_attempts') table_name")).rows[0].table_name).toBe("learning_v2_attempts");
  });
  it("repeats without ledger changes and rejects accidentally switching to restore",async () => {
    const before = (await fresh.pool.query("select * from cediah_schema_migrations order by file_name")).rows;
    const result = await applySqlMigrations(fresh.pool,directory,options);
    expect(result.filter(r => r.status === "not_applicable")).toEqual([{fileName:"0005_restore_legacy_content.sql",status:"not_applicable"}]);
    expect(result.every(r => r.status === "already_applied" || r.status === "not_applicable")).toBe(true);
    expect((await fresh.pool.query("select * from cediah_schema_migrations order by file_name")).rows).toEqual(before);
    await expect(applySqlMigrations(fresh.pool,directory)).rejects.toThrow(/installed without the legacy catalog/);
  });
  it("default restore still fails with its exact identity prerequisite; empty mode refuses populated DB",async () => {
    await expect(applySqlMigrations(guarded.pool,directory)).rejects.toThrow(/legacy_administrator_account_not_found/);
    expect((await guarded.pool.query("select count(*)::int n from cediah_schema_migrations")).rows).toEqual([{n:4}]);
    await guarded.pool.query("insert into auth_users(name,email) values('Synthetic fixture','m01-guard@example.test')");
    await expect(applySqlMigrations(guarded.pool,directory,options)).rejects.toThrow(/requires a new database/);
    expect((await guarded.pool.query("select count(*)::int n from cediah_schema_migration_exclusions")).rows).toEqual([{n:0}]);
  });
  it("upgrades the v1 fixture without changing versions, enrollments or attempts",async () => {
    await applySqlMigrations(legacy.pool,directory,options);
    expect(await v1Snapshot()).toEqual(v1Before);
    expect((await legacy.pool.query("select definition_v2_json from learning_path_versions where id=$1",[oldId(4)])).rows).toEqual([{definition_v2_json:null}]);
    await applySqlMigrations(legacy.pool,directory,options);
    expect(await v1Snapshot()).toEqual(v1Before);
  });
  it("rejects checksum drift for both applied SQL and an excluded legacy migration",async () => {
    const stored = (await fresh.pool.query("select checksum from cediah_schema_migrations where file_name='0001_auth.sql'")).rows[0].checksum;
    try {
      await fresh.pool.query("update cediah_schema_migrations set checksum=$1 where file_name='0001_auth.sql'",["0".repeat(64)]);
      await expect(applySqlMigrations(fresh.pool,directory,options)).rejects.toThrow(/changed after it was applied/);
    } finally { await fresh.pool.query("update cediah_schema_migrations set checksum=$1 where file_name='0001_auth.sql'",[stored]); }
    try {
      await fresh.pool.query("update cediah_schema_migration_exclusions set checksum=$1",["0".repeat(64)]);
      await expect(applySqlMigrations(fresh.pool,directory,options)).rejects.toThrow(/exclusion.*inconsistent or changed/);
    } finally { await fresh.pool.query("update cediah_schema_migration_exclusions set checksum=$1",[original]); }
  });
});
