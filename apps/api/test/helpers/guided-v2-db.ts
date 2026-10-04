import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const directory = new URL("../../../../database/migrations/", import.meta.url);
export const v2Id = (last: number) => `71000000-0000-4000-8000-${String(last).padStart(12, "0")}`;

export async function createGuidedV2Database(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec("create role cediah_runtime; create role anon; create role authenticated; alter default privileges in schema public grant all on tables to anon, authenticated;");
  const files = (await readdir(directory))
    .filter((file) => /^\d+_[a-z0-9_]+\.sql$/.test(file) && file.localeCompare("0035_guided_v2_media_access.sql") <= 0)
    .sort((a, b) => a.localeCompare(b));
  for (const file of files) {
    // This historical migration requires a real legacy administrator identity.
    if (file === "0005_restore_legacy_content.sql") continue;
    const sql = await readFile(new URL(file, directory), "utf8");
    await db.exec(`begin;\n${sql}\ncommit;`);
  }
  return db;
}

export async function seedGuidedV2Runtime(db: PGlite): Promise<void> {
  await db.exec(`
    begin;
    insert into public.auth_users (id,name,email) values
      ('${v2Id(1)}','Learner A','runtime-a@example.test'),
      ('${v2Id(2)}','Learner B','runtime-b@example.test');
    insert into public.content_items (id,kind,slug,title,summary,topic,author_user_id)
      values ('${v2Id(3)}','topic','runtime-topic','Runtime topic','Fixture','Runtime','${v2Id(1)}');
    insert into public.learning_paths (id,topic_content_id,slug,title,summary,cover_key,created_by)
      values ('${v2Id(4)}','${v2Id(3)}','runtime-route','Runtime route','Fixture','heart','${v2Id(1)}');
    insert into public.learning_path_versions (id,path_id,version_number,policy_version,policy_json)
      values ('${v2Id(5)}','${v2Id(4)}',1,'guided-v1','{}');
    insert into public.learning_path_versions (id,path_id,version_number,policy_version,policy_json,definition_v2_json)
      values ('${v2Id(6)}','${v2Id(4)}',2,'guided-v2.0','{}','{"schemaVersion":"2.0"}'),
             ('${v2Id(7)}','${v2Id(4)}',3,'guided-v2.0','{}','{"schemaVersion":"2.0"}');
    insert into public.learning_enrollments (id,user_id,path_id,path_version_id)
      values ('${v2Id(8)}','${v2Id(1)}','${v2Id(4)}','${v2Id(6)}'),
             ('${v2Id(9)}','${v2Id(2)}','${v2Id(4)}','${v2Id(6)}');
    insert into public.learning_enrollment_versions (enrollment_id,path_id,path_version_id) values
      ('${v2Id(8)}','${v2Id(4)}','${v2Id(5)}'),
      ('${v2Id(8)}','${v2Id(4)}','${v2Id(6)}'),
      ('${v2Id(9)}','${v2Id(4)}','${v2Id(6)}');
    commit;
  `);
}
