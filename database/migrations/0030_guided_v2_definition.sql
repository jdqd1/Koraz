-- V2 editorial definitions live beside v1 definitions; existing v1 rows stay unchanged.
alter table public.learning_path_versions
  add column definition_v2_json jsonb;

alter table public.learning_path_versions
  add constraint learning_path_versions_v2_definition_shape check (
    case when policy_version = 'guided-v2.0' then
      definition_v2_json is not null
      and jsonb_typeof(definition_v2_json) = 'object'
      and definition_v2_json ->> 'schemaVersion' = '2.0'
    else definition_v2_json is null end
  );

create table public.learning_v2_bindings (
  path_version_id uuid not null references public.learning_path_versions (id) on delete cascade,
  local_key text not null,
  kind text not null,
  topic_content_id uuid references public.content_items (id) on delete restrict,
  source_content_id uuid references public.content_items (id) on delete restrict,
  resource_revision_id uuid references public.learning_resource_revisions (id) on delete restrict,
  asset_id uuid references public.content_assets (id) on delete restrict,
  document_sha256 text,
  asset_sha256 text,
  rights_status text,
  rights_credit text,
  created_at timestamptz not null default now(),
  primary key (path_version_id, local_key, kind),
  constraint learning_v2_bindings_local_key check (local_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint learning_v2_bindings_kind check (kind in ('topic', 'source', 'asset')),
  constraint learning_v2_bindings_shape check (
    (kind = 'topic' and local_key = 'topic' and topic_content_id is not null
      and source_content_id is null and resource_revision_id is null and asset_id is null
      and document_sha256 is null and asset_sha256 is null and rights_status is null and rights_credit is null)
    or (kind = 'source' and topic_content_id is null and asset_id is null
      and (source_content_id is null) = (resource_revision_id is null)
      and document_sha256 is not null and document_sha256 ~ '^[a-fA-F0-9]{64}$'
      and asset_sha256 is null and rights_status is null and rights_credit is null)
    or (kind = 'asset' and topic_content_id is null and source_content_id is null
      and resource_revision_id is null and document_sha256 is null
      and asset_id is not null and (asset_sha256 is null or asset_sha256 ~ '^[a-fA-F0-9]{64}$')
      and rights_status is not null and rights_status in ('owned', 'licensed', 'public_domain', 'unverified')
      and rights_credit is not null and char_length(rights_credit) <= 1000
      and (rights_status <> 'licensed' or char_length(btrim(rights_credit)) > 0))
  )
);

create index learning_v2_bindings_topic_index on public.learning_v2_bindings (topic_content_id)
  where topic_content_id is not null;
create index learning_v2_bindings_source_index on public.learning_v2_bindings (source_content_id)
  where source_content_id is not null;
create index learning_v2_bindings_revision_index on public.learning_v2_bindings (resource_revision_id)
  where resource_revision_id is not null;
create index learning_v2_bindings_asset_index on public.learning_v2_bindings (asset_id)
  where asset_id is not null;

create function private.validate_learning_v2_binding()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
declare
  bound_version record;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    select version.status, version.path_id into bound_version
    from public.learning_path_versions as version where version.id = old.path_version_id;
    if bound_version.status = 'published' then
      if tg_op = 'DELETE' and bound_version.path_id::text = current_setting('cediah.deleting_learning_path_id', true) then
        return old;
      end if;
      raise exception 'published learning v2 bindings are immutable';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;

  select version.status, version.policy_version, path.topic_content_id
    into bound_version
  from public.learning_path_versions as version
  join public.learning_paths as path on path.id = version.path_id
  where version.id = new.path_version_id;
  if bound_version.policy_version is distinct from 'guided-v2.0' then
    raise exception 'learning v2 binding requires a guided-v2.0 definition';
  end if;
  if bound_version.status = 'published' then
    raise exception 'published learning v2 bindings are immutable';
  end if;
  if new.kind = 'topic' and new.topic_content_id is distinct from bound_version.topic_content_id then
    raise exception 'learning v2 topic binding must match route topic';
  end if;
  if new.kind = 'source' and new.resource_revision_id is not null and not exists (
    select 1 from public.learning_resource_revisions as revision
    join public.learning_resources as resource on resource.id = revision.resource_id
    where revision.id = new.resource_revision_id
      and resource.source_content_id = new.source_content_id
      and resource.projection = 'guide'
  ) then
    raise exception 'learning v2 source revision does not belong to guide';
  end if;
  return new;
end;
$$;

create trigger learning_v2_bindings_validate
before insert or update or delete on public.learning_v2_bindings
for each row execute function private.validate_learning_v2_binding();
revoke all on function private.validate_learning_v2_binding() from public;

create function private.prevent_learning_v2_policy_downgrade()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
begin
  if old.policy_version = 'guided-v2.0' and new.policy_version <> 'guided-v2.0'
    and exists (select 1 from public.learning_v2_bindings where path_version_id = old.id) then
    raise exception 'learning v2 bindings must be removed before changing policy';
  end if;
  return new;
end;
$$;

create trigger learning_path_versions_v2_policy_guard
before update of policy_version on public.learning_path_versions
for each row execute function private.prevent_learning_v2_policy_downgrade();
revoke all on function private.prevent_learning_v2_policy_downgrade() from public;

alter table public.learning_v2_bindings enable row level security;
revoke all on public.learning_v2_bindings from public;

do $$
declare
  inherited_grantee text;
begin
  for inherited_grantee in
    select distinct roles.rolname
    from pg_class as tables
    cross join lateral aclexplode(tables.relacl) as privileges
    join pg_roles as roles on roles.oid = privileges.grantee
    where tables.oid = 'public.learning_v2_bindings'::regclass
      and privileges.grantee <> tables.relowner
  loop
    execute format('revoke all on public.learning_v2_bindings from %I', inherited_grantee);
  end loop;

  if exists (select 1 from pg_roles where rolname = 'cediah_runtime') then
    grant select, insert, update, delete on public.learning_v2_bindings to cediah_runtime;
    create policy learning_v2_bindings_runtime on public.learning_v2_bindings
      to cediah_runtime using (true) with check (true);
  end if;
end;
$$;
