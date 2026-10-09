import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Pool } from "pg";

const migrationLockId = 1_942_880_431;

export type AppliedMigration = {
  fileName: string;
  status: "applied" | "already_applied" | "not_applicable";
};

export type MigrationOptions = { legacyContentMode?: "restore" | "empty" };
const legacyContentMigration = "0005_restore_legacy_content.sql";

function checksum(source: string) {
  return createHash("sha256").update(source).digest("hex");
}

export async function applySqlMigrations(
  pool: Pool,
  migrationsDirectory: string,
  options: MigrationOptions = {},
): Promise<AppliedMigration[]> {
  const directory = resolve(migrationsDirectory);
  const fileNames = (await readdir(directory))
    .filter((fileName) => /^\d+_[a-z0-9_]+\.sql$/.test(fileName))
    .sort((left, right) => left.localeCompare(right));
  const client = await pool.connect();

  try {
    await client.query("select pg_advisory_lock($1)", [migrationLockId]);
    await client.query("create schema if not exists public");
    await client.query(`
      create table if not exists public.cediah_schema_migrations (
        file_name text primary key,
        checksum text not null,
        applied_at timestamptz not null default now()
      )
    `);

    const existing = await client.query<{ checksum: string; file_name: string }>(
      "select file_name, checksum from public.cediah_schema_migrations",
    );
    const applied = new Map(existing.rows.map((row) => [row.file_name, row.checksum]));
    await client.query(`create table if not exists public.cediah_schema_migration_exclusions (
      file_name text primary key, checksum text not null,
      reason text not null check (reason = 'empty_installation'),
      recorded_at timestamptz not null default now()
    )`);
    const exclusions = await client.query<{ file_name: string; checksum: string }>(
      "select file_name, checksum from public.cediah_schema_migration_exclusions",
    );
    const excluded = new Map(exclusions.rows.map(row => [row.file_name, row.checksum]));
    const results: AppliedMigration[] = [];

    for (const fileName of fileNames) {
      const source = await readFile(resolve(directory, fileName), "utf8");
      const sourceChecksum = checksum(source);
      const storedChecksum = applied.get(fileName);
      const excludedChecksum = excluded.get(fileName);

      if (excludedChecksum) {
        if (storedChecksum || fileName !== legacyContentMigration || excludedChecksum !== sourceChecksum) {
          throw new Error(`Migration exclusion ${fileName} is inconsistent or changed.`);
        }
        if (options.legacyContentMode !== "empty") {
          throw new Error("This database was installed without the legacy catalog. Keep DATABASE_LEGACY_CONTENT_MODE=empty; historical restoration cannot be replayed after later schema migrations.");
        }
        results.push({ fileName, status: "not_applicable" });
        continue;
      }

      if (storedChecksum) {
        if (storedChecksum !== sourceChecksum) {
          throw new Error(`Migration ${fileName} changed after it was applied.`);
        }
        results.push({ fileName, status: "already_applied" });
        continue;
      }

      await client.query("begin");
      try {
        if (fileName === legacyContentMigration && options.legacyContentMode === "empty") {
          const data = await client.query<{ has_data: boolean }>(`select
            exists(select 1 from public.auth_users) or exists(select 1 from public.content_items)
            or exists(select 1 from public.content_assets) or exists(select 1 from public.user_roles) as has_data`);
          if (data.rows[0]?.has_data || [...applied.keys()].some(name => name.localeCompare(fileName) > 0)) {
            throw new Error("Legacy catalog exclusion requires a new database without users, content or later migrations.");
          }
          await client.query("insert into public.cediah_schema_migration_exclusions(file_name,checksum,reason) values($1,$2,'empty_installation')", [fileName, sourceChecksum]);
          await client.query("commit");
          results.push({ fileName, status: "not_applicable" });
          continue;
        }
        await client.query(source);
        await client.query(
          "insert into public.cediah_schema_migrations (file_name, checksum) values ($1, $2)",
          [fileName, sourceChecksum],
        );
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw error;
      }

      results.push({ fileName, status: "applied" });
    }

    return results;
  } finally {
    try {
      await client.query("select pg_advisory_unlock($1)", [migrationLockId]);
    } finally {
      client.release();
    }
  }
}
