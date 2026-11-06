import { sql } from "kysely";
import { PracticeKindSchema, PracticeLibrarySchema, type PracticeLibrary } from "@cediah/contracts";
import { z } from "zod";
import type { DatabaseClient } from "./db/database.js";

export const PracticeLibraryQuerySchema = z.object({
  kind: PracticeKindSchema,
  subject: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120).optional(),
  topic: z.string().trim().max(120).default(""),
  q: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
type PracticeQuery = z.infer<typeof PracticeLibraryQuerySchema>;

// The newest published linked guide owns the projection and inherits its published video's subjects.
const resources = sql`with published as (
  select id, slug, title, summary, topic, kind, updated_at, published_at, content->'regions' as regions,
    nullif(content->>'linkedVideoId','') as linked_video,
    case when kind in ('guide','video') then jsonb_typeof(content #> '{quiz,questions,0}') = 'object'
         when kind='quiz' then jsonb_typeof(content #> '{questions,0}') = 'object'
         else jsonb_typeof(content #> '{cards,0}') = 'object' end as has_material
  from content_items where status='published' and catalog_visibility='catalog' and kind in ('guide','video','quiz','flashcards')
), linked as (
  select distinct on (linked_video) id, linked_video from published where kind='guide' and linked_video is not null
  order by linked_video, updated_at desc, id
), sources as (
  select p.*, case when jsonb_typeof(p.regions)='array' and p.regions->>0 is not null then p.regions
    when trim(p.topic) <> '' then jsonb_build_array(p.topic) else '[]'::jsonb end as topics
  from published p where p.has_material and
    (p.kind <> 'video' or not exists(select 1 from linked l where l.linked_video=p.id::text)) and
    (p.kind <> 'guide' or p.linked_video is null or exists(select 1 from linked l where l.id=p.id))
), membership as (
  select r.id, cs.subject_id from sources r join content_subjects cs on cs.content_item_id=r.id
  union
  select r.id, cs.subject_id from sources r join published v on v.kind='video' and v.id::text=r.linked_video
    join content_subjects cs on cs.content_item_id=v.id where r.kind='guide'
)`;

export async function subjectPracticeCounts(database: DatabaseClient, subjectId: string) {
  const result = await sql<{ quiz: number; flashcards: number }>`${resources}
    select count(*) filter(where r.kind <> 'flashcards')::int as quiz,
      count(*) filter(where r.kind <> 'quiz')::int as flashcards
    from sources r join membership m on m.id=r.id where m.subject_id=${subjectId}::uuid`.execute(database);
  return result.rows[0]!;
}

export async function readPracticeLibrary(database: DatabaseClient, input: PracticeQuery): Promise<PracticeLibrary | null> {
  const subject = input.subject ? await database.selectFrom("subjects").select(["id", "slug", "name"])
    .where("slug", "=", input.subject).executeTakeFirst() : undefined;
  if (input.subject && !subject) return null;
  const search = input.q.trim();
  const groups = subject
    ? sql`select min(t.name) as name, min(t.name) as key, count(distinct r.id)::int as count from scoped r
        cross join lateral jsonb_array_elements_text(r.topics) t(name) group by public.cediah_search_normalize(t.name)`
    : sql`select s.name, s.slug as key, count(*)::int as count from scoped r join membership m on m.id=r.id
        join subjects s on s.id=m.subject_id group by s.id`;
  const selection = search
    ? sql`strpos(public.cediah_search_normalize(concat_ws(' ',r.title,r.summary,r.topic,r.topics::text,r.subject_names)),public.cediah_search_normalize(${search})) > 0`
    : input.topic && subject ? sql`exists(select 1 from jsonb_array_elements_text(r.topics) t where public.cediah_search_normalize(t)=public.cediah_search_normalize(${input.topic}))`
      : subject ? sql`jsonb_array_length(r.topics)=0` : sql`false`;
  const result = await sql<{ groups: unknown; items: unknown; total: number; resourceCount: number }>`${resources}, scoped as (
    select r.*, s.first_slug, s.subject_names from sources r join lateral (
      select min(s.slug) as first_slug, string_agg(s.name,' ') as subject_names from membership m
      join subjects s on s.id=m.subject_id where m.id=r.id ${subject ? sql`and s.id=${subject.id}::uuid` : sql``}
    ) s on s.first_slug is not null where r.kind in ('video','guide',${input.kind}::content_kind)
  ), groups as (${groups}), filtered as (
    select r.*, ${subject && input.topic && !search ? sql`(select position from content_topic_item_order o where o.content_item_id=r.id and o.subject_id=${subject.id}::uuid and o.topic_key=public.cediah_search_normalize(${input.topic}))` : sql`null::int`} as position
    from scoped r where ${selection}
  ), page as (
    select * from filtered order by position nulls last,published_at desc nulls last,id limit ${input.limit} offset ${(input.page-1)*input.limit}
  ) select coalesce((select jsonb_agg(to_jsonb(g) order by name,key) from groups g),'[]'::jsonb) as groups,
    (select count(*)::int from filtered) as total, (select count(*)::int from scoped) as "resourceCount",
    coalesce((select jsonb_agg(jsonb_build_object('id',id,'slug',slug,'title',title,'kind',${input.kind}::text,
      'topic',coalesce(topics->>0,''),'subjectSlug',first_slug) order by position nulls last,published_at desc nulls last,id) from page),'[]'::jsonb) as items`.execute(database);
  return PracticeLibrarySchema.parse({ ...result.rows[0], subject: subject ?? null, page: input.page, limit: input.limit });
}
