import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { createPostgresDatabase } from "../../src/db/database.js";
import { applySqlMigrations } from "../../src/db/migrate.js";
import { fileURLToPath } from "node:url";

export function assertGuidedV2TestControlUrl(value: string | undefined, marker = process.env.KORAZ_TEST_DATABASE) {
  if (!value || marker !== "true") throw new Error("Explicit disposable PostgreSQL environment required");
  const url = new URL(value);
  if (url.protocol !== "postgresql:" || url.hostname !== "127.0.0.1" || url.port !== "55435"
    || url.username !== "koraz_test" || url.pathname !== "/koraz_guided_v2_control_test"
    || url.search || url.hash || url.password) throw new Error("Refusing non-test PostgreSQL target");
  return url;
}

export async function createGuidedV2Postgres(options: { migrate?: boolean; directory?: string } = {}) {
  const controlUrl = assertGuidedV2TestControlUrl(process.env.KORAZ_GUIDED_V2_TEST_DATABASE_URL);
  const control = new Pool({ connectionString: controlUrl.href, max: 1 });
  const name = "koraz_guided_v2_test_" + randomUUID().replaceAll("-", "");
  await control.query(`do $$ begin
    if not exists(select 1 from pg_roles where rolname='cediah_runtime') then create role cediah_runtime login; end if;
    if not exists(select 1 from pg_roles where rolname='anon') then create role anon login; end if;
    if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated login; end if;
  end $$`);
  await control.query(`create database "${name}"`);
  const url = new URL(controlUrl); url.pathname = "/" + name;
  const pool = new Pool({ connectionString: url.href, max: 8 });
  const database = createPostgresDatabase(pool);
  try {
    if (options.migrate !== false) await applySqlMigrations(pool, options.directory ?? fileURLToPath(new URL("../../../../database/migrations/", import.meta.url)), { legacyContentMode: "empty" });
  } catch (error) {
    await database.destroy(); if (!pool.ended) await pool.end();
    try { await control.query(`drop database "${name}"`); } finally { await control.end(); } throw error;
  }
  let closed = false;
  return { pool, database, url: url.href, name, async close() {
    if (closed) return; closed = true;
    await database.destroy();
    if (!pool.ended) await pool.end();
    if (!/^koraz_guided_v2_test_[a-f0-9]{32}$/.test(name)) throw new Error("Refusing invalid cleanup target");
    try { await control.query(`drop database "${name}"`); } finally { await control.end(); }
  } };
}
