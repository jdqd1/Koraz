import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import { sql } from "kysely";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PracticeLibraryQuerySchema, readPracticeLibrary, subjectPracticeCounts } from "../src/practice-catalog.js";
import { createGuidedV2Postgres } from "./helpers/guided-v2-postgres.js";
import { registerPublishedStudyCatalogRoutes } from "../src/study-catalog.js";

describe.skipIf(process.env.KORAZ_TEST_DATABASE !== "true")("H26 practice libraries in isolated PostgreSQL", () => {
  let db: Awaited<ReturnType<typeof createGuidedV2Postgres>>;
  const author = randomUUID(), surgery = randomUUID();
  let anatomy: string;
  const linkedVideo = randomUUID(), guide = randomUUID(), loneVideo = randomUUID(), quiz = randomUUID(), cards = randomUUID();
  const question = { questions: [{ prompt: "Pregunta", options: ["A", "B"], correctOptionIndex: 0 }] };
  const args = (kind: "quiz" | "flashcards", input: Record<string, unknown> = {}) => PracticeLibraryQuerySchema.parse({ kind, ...input });
  beforeAll(async () => {
    db = await createGuidedV2Postgres();
    await db.pool.query("insert into auth_users(id,email,name) values($1,'library@example.test','Fixture')", [author]);
    anatomy = (await db.pool.query<{ id: string }>("select id from subjects where slug='anatomia'")).rows[0]!.id;
    await db.pool.query("insert into subjects(id,slug,name) values($1,'cirugia','Cirugía')", [surgery]);
    async function add(id: string, kind: string, content: object, subject: string, visibility = "catalog", published = true) {
      await db.pool.query(`insert into content_items(id,kind,slug,title,summary,topic,content,author_user_id,status,catalog_visibility,published_at,published_by)
        values($1,$2,$3,'Práctica de abdomen','Fixture','Abdomen',$4,$5,$6,$7,$8,$9)`,
      [id,kind,`material-${id}`,content,author,published ? "published" : "draft",visibility,published ? "2026-11-04T12:00:00Z" : null,published ? author : null]);
      await db.pool.query("insert into content_subjects(content_item_id,subject_id) values($1,$2)", [id,subject]);
    }
    await add(linkedVideo,"video",{quiz:question},surgery);
    await add(guide,"guide",{linkedVideoId:linkedVideo,quiz:question,regions:["Abdomen"]},anatomy);
    await add(loneVideo,"video",{quiz:question},surgery);
    await add(quiz,"quiz",{ ...question, regions: null },anatomy);
    await add(randomUUID(),"guide",{quiz:{questions:null}},anatomy);
    await add(cards,"flashcards",{cards:[{front:"A",back:"B"}]},surgery);
    await add(randomUUID(),"guide",{quiz:question},anatomy,"guided_only");
    await add(randomUUID(),"guide",{quiz:question},anatomy,"catalog",false);
    await db.pool.query(`insert into content_items(kind,slug,title,summary,topic,content,author_user_id,status,published_at,published_by)
      select 'guide','sin-practica-'||n,'Lectura','Fixture','Abdomen','{}'::jsonb,$1,'published',now(),$1 from generate_series(1,1010) n`,[author]);
  },120_000);
  afterAll(async () => { await db?.close(); });

  it.each(["quiz", "flashcards"] as const)("reconciles %s globally, by subject and across pages", async kind => {
    const expected = kind === "quiz" ? [guide, loneVideo, quiz] : [guide, loneVideo, cards];
    const directory = await readPracticeLibrary(db.database,args(kind));
    expect(directory?.resourceCount).toBe(3);
    expect(directory?.groups).toHaveLength(2);
    const pages = await Promise.all([1,2,3].map(page => readPracticeLibrary(db.database,args(kind,{q:"practica",limit:1,page}))));
    expect(pages.every(p => p?.total === 3 && p.items.length === 1)).toBe(true);
    const globalIds = pages.flatMap(p => p!.items.map(item => item.id));
    expect(globalIds.slice().sort()).toEqual(expected.sort());
    expect(globalIds).not.toContain(linkedVideo);
    const subjectIds = new Set<string>();
    for (const [slug,id] of [["anatomia",anatomy],["cirugia",surgery]] as const) {
      const scoped = await readPracticeLibrary(db.database,args(kind,{subject:slug,topic:"Abdomen"}));
      expect(scoped?.total).toBe(directory?.groups.find(group => group.key === slug)?.count);
      expect((await subjectPracticeCounts(db.database,id))[kind]).toBe(scoped?.total);
      for (const item of scoped!.items) { expect(item.subjectSlug).toBe(slug); subjectIds.add(item.id); }
    }
    expect([...subjectIds].sort()).toEqual(globalIds.sort());
    expect((await readPracticeLibrary(db.database,args(kind,{q:"ninguna coincidencia"})))?.items).toEqual([]);
    expect(await readPracticeLibrary(db.database,args(kind,{subject:"inexistente"}))).toBeNull();
  });

  it("uses only runtime permissions and preserves the subject's curated topic order", async () => {
    await db.pool.query("insert into content_topic_item_order(subject_id,topic_key,content_item_id,position) values($1,'abdomen',$2,0)",[anatomy,quiz]);
    const result = await db.database.transaction().execute(async tx => {
      await sql`set local role cediah_runtime`.execute(tx);
      return readPracticeLibrary(tx,args("quiz",{subject:"anatomia",topic:"Abdomen",limit:1}));
    });
    expect(result?.items.map(item => item.id)).toEqual([quiz]);
  });

  it("paginates the complete public metadata union without leaking content or losing native/embedded capabilities", async () => {
    const app = Fastify();
    registerPublishedStudyCatalogRoutes(app, db.database);
    try {
      const first = await app.inject({ url: "/v1/study/catalog?limit=1000&offset=0" });
      expect(first.statusCode, first.body).toBe(200);
      const a = first.json();
      expect(a.items).toHaveLength(1000);
      expect(a.nextOffset).toBe(1000);
      const second = await app.inject({ url: `/v1/study/catalog?limit=1000&offset=${a.nextOffset}` });
      expect(second.statusCode, second.body).toBe(200);
      const b = second.json();
      expect(b.nextOffset).toBeNull();
      const all = [...a.items, ...b.items];
      expect(new Set(all.map(item => item.id)).size).toBe(all.length);
      expect(all.find(item => item.id === guide)).toMatchObject({ hasQuiz: true, hasFlashcards: true, linkedVideoId: linkedVideo });
      expect(all.find(item => item.id === loneVideo)).toMatchObject({ hasQuiz: true, hasFlashcards: true });
      expect(all.length).toBe(1016);
      expect(all.every(item => !("content" in item) && !("questions" in item))).toBe(true);
      const subject = await app.inject({ url: "/v1/study/subjects/cirugia" });
      expect(subject.statusCode, subject.body).toBe(200);
      expect(subject.json().items.map((item: { id: string }) => item.id)).toContain(guide);
    } finally { await app.close(); }
  });
});
