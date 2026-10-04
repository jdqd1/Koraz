-- Keep row-lock serialization without granting identity/catalog writes to runtime.
-- The migration runner executes this file in one transaction.
create function private.lock_guided_v2_actor(actor_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare locked_id uuid;
begin
  select actor.id into locked_id from public.auth_users as actor
    where actor.id = actor_id for update;
  return locked_id;
end;
$$;

create function private.lock_guided_v2_catalog(resource_kind text, target_resource_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  case resource_kind
    when 'topic' then
      perform item.id from public.content_items as item
        where item.id = target_resource_id for share;
    when 'source' then
      perform revision.id from public.learning_resource_revisions as revision
        join public.learning_resources as resource on resource.id = revision.resource_id
        join public.content_items as item on item.id = resource.source_content_id
        where revision.id = target_resource_id for share of revision, resource, item;
    when 'asset' then
      perform asset.id from public.content_assets as asset
        join public.content_items as item on item.id = asset.content_item_id
        where asset.id = target_resource_id for share of asset, item;
    else
      raise exception 'Invalid guided v2 resource kind' using errcode = '22023';
  end case;
end;
$$;

revoke all on function private.lock_guided_v2_actor(uuid) from public;
revoke all on function private.lock_guided_v2_catalog(text, uuid) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'cediah_runtime') then
    grant usage on schema private to cediah_runtime;
    grant execute on function private.lock_guided_v2_actor(uuid) to cediah_runtime;
    grant execute on function private.lock_guided_v2_catalog(text, uuid) to cediah_runtime;
    -- Editorial validation reads the complete topic row; no catalog writes.
    grant select on public.content_items to cediah_runtime;
    grant select (id, content_item_id, owner_user_id, kind, original_file_name, status)
      on public.content_assets to cediah_runtime;
  end if;
end;
$$;
