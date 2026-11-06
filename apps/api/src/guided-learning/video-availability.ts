import { sql } from "kysely";

export const optionHasVideoSource = sql<boolean>`(
  learning_step_options.projection <> 'video' or exists (
    select 1 from learning_resource_revisions r where r.id = learning_step_options.resource_revision_id
      and nullif(trim(r.payload_json #>> '{content,externalUrl}'), '') is not null
  ) or exists (
    select 1 from content_assets a where a.content_item_id = learning_step_options.source_content_id
      and a.kind = 'video' and a.status = 'ready'
  )
)`;
