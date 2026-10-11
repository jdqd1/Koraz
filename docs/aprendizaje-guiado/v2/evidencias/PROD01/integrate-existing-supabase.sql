set local lock_timeout='10s'; select pg_advisory_xact_lock(1942880431); create temporary table prod01_preservation(relation_name text primary key,row_count bigint,digest text) on commit drop; do $guard$ declare t record; n bigint; h text; begin for t in select schemaname,tablename from pg_tables where schemaname in ('public','private') and tablename <> 'cediah_schema_migrations' order by schemaname,tablename loop execute format('lock table %I.%I in share row exclusive mode',t.schemaname,t.tablename); execute format('select count(*),md5(coalesce(string_agg(md5((to_jsonb(r)-''definition_v2_json'')::text),'''' order by md5((to_jsonb(r)-''definition_v2_json'')::text)),'''')) from %I.%I r',t.schemaname,t.tablename) into n,h; insert into prod01_preservation values(format('%I.%I',t.schemaname,t.tablename),n,h); end loop; end $guard$;

do $guard$ begin if not exists(select 1 from public.cediah_schema_migrations where file_name='0001_auth.sql' and checksum='70697324ca3ab10118431dcdf5ca2cad391bdfc301867b50f4c6e638cffed945') then raise exception 'Existing migration checksum changed'; end if; end $guard$;

do $guard$ begin if not exists(select 1 from public.cediah_schema_migrations where file_name='0002_platform.sql' and checksum='02734e2209316389316d2b35f99b3cbd18cf5cecf63cd28b227945657f3476e3') then raise exception 'Existing migration checksum changed'; end if; end $guard$;

do $guard$ begin if not exists(select 1 from public.cediah_schema_migrations where file_name='0003_content.sql' and checksum='939591b0e89c08d252a1e413ce81ace0d1b582374e69200fb77a7aa9c7e942d7') then raise exception 'Existing migration checksum changed'; end if; end $guard$;

do $guard$ begin if not exists(select 1 from public.cediah_schema_migrations where file_name='0004_subjects.sql' and checksum='a5ed38c96823124048ddde5a8178181d8d351a90daa9bc74c3acaa0207607943') then raise exception 'Existing migration checksum changed'; end if; end $guard$;

do $guard$ begin if not exists(select 1 from public.cediah_schema_migrations where file_name='0005_restore_legacy_content.sql' and checksum='24f365bda02dee245a8e4b6cb00aa2c592029fa3c9fdc9ab8a2b6f92786b3fb9') then raise exception 'Existing migration checksum changed'; end if; end $guard$;

do $guard$ begin if not exists(select 1 from public.cediah_schema_migrations where file_name='0006_simplify_platform_roles.sql' and checksum='5029478f65c66f1f74483d330b2f94c90e484bcfca968d15f9a669fdebf960fb') then raise exception 'Existing migration checksum changed'; end if; end $guard$;

do $guard$ begin if not exists(select 1 from public.cediah_schema_migrations where file_name='0007_content_views.sql' and checksum='eee2540cba4aa1dbd0a91b32b93afd62881441ac3a8a57b48bc9a64c61ba83ed') then raise exception 'Existing migration checksum changed'; end if; end $guard$;

do $guard$ begin if not exists(select 1 from public.cediah_schema_migrations where file_name='0008_content_reactions.sql' and checksum='9bca63bf471540ae26a4632a4b9ec02c1d1a4fa6fc93312083a6f73de205ced0') then raise exception 'Existing migration checksum changed'; end if; end $guard$;

do $guard$ begin if not exists(select 1 from public.cediah_schema_migrations where file_name='0009_learning_content_identity.sql' and checksum='60ea655f9f9259559e9b930f96c6e3d8440b283874a9fa1999da3bd6cdf2b5a3') then raise exception 'Existing migration checksum changed'; end if; end $guard$;

do $guard$ begin if not exists(select 1 from public.cediah_schema_migrations where file_name='0010_guided_learning_catalog.sql' and checksum='d481c6f6a9aabc97de68563de7e6b228114e459ab33667e22ce1a43fe87be015') then raise exception 'Existing migration checksum changed'; end if; end $guard$;

do $guard$ begin if not exists(select 1 from public.cediah_schema_migrations where file_name='0011_guided_learning_attempts.sql' and checksum='38c29a60e82790b128a6cd7964e37b08ef5933589a92ffaa9b0983490b99572c') then raise exception 'Existing migration checksum changed'; end if; end $guard$;

do $guard$ begin if not exists(select 1 from public.cediah_schema_migrations where file_name='0012_guided_learning_evidence.sql' and checksum='46f1798dcf16fb30a5f8324a83fecf00101fca3cd4d8af148f9f295c735f287b') then raise exception 'Existing migration checksum changed'; end if; end $guard$;

do $guard$ begin if not exists(select 1 from public.cediah_schema_migrations where file_name='0013_guided_learning_rewards.sql' and checksum='8e6df0b09ae8231bc49436a26adc02f5ade0aca349488009ba12472d1f988305') then raise exception 'Existing migration checksum changed'; end if; end $guard$;

do $guard$ begin if not exists(select 1 from public.cediah_schema_migrations where file_name='0014_guided_learning_observability.sql' and checksum='3eb5f3bd5467dcded99cde7edf79d16577cac126eb67c31fac4c709f5a1fdc22') then raise exception 'Existing migration checksum changed'; end if; end $guard$;

do $guard$ begin if not exists(select 1 from public.cediah_schema_migrations where file_name='0015_guided_learning_foreign_key_indexes.sql' and checksum='89ed6bcdb65990512d9aa59687c885580569819ce4098e00f91891bfcba15110') then raise exception 'Existing migration checksum changed'; end if; end $guard$;

do $guard$ begin if not exists(select 1 from public.cediah_schema_migrations where file_name='0016_learning_maps.sql' and checksum='4874aad19fd76288fa89f3bf3f2b4bc4f10c4d58d076eb0936b3fd63b786be4f') then raise exception 'Existing migration checksum changed'; end if; end $guard$;

do $guard$ begin if not exists(select 1 from public.cediah_schema_migrations where file_name='0029_recent_guide_reading.sql' and checksum='10fff275be1cbb0d415e1da98efa4b873922e905967e7e199108544288f8c878') then raise exception 'Existing migration checksum changed'; end if; end $guard$;

do $guard$ begin if to_regclass('public.learning_v2_attempts') is not null or exists(select 1 from public.cediah_schema_migrations where file_name>='0030') then raise exception 'V2 already exists; inspect rather than repeat'; end if; if current_database()<>'postgres' or not exists(select 1 from public.auth_users) then raise exception 'Wrong production target';end if;end $guard$;

-- A route can be removed together with its enrollments and student progress.
-- Published definitions stay immutable during ordinary edits and deletes.
create or replace function private.prevent_published_learning_definition_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, public, private
as $$
declare
  target_version_id uuid;
  target_path_id uuid;
begin
  if tg_table_name = 'learning_path_versions' then
    target_version_id := old.id;
    target_path_id := old.path_id;
  else
    target_version_id := old.path_version_id;
    select path_id into target_path_id
    from public.learning_path_versions where id = target_version_id;
  end if;

  if tg_op = 'DELETE'
     and target_path_id::text = current_setting('cediah.deleting_learning_path_id', true) then
    return old;
  end if;

  if exists (
    select 1 from public.learning_path_versions
    where id = target_version_id and status = 'published'
  ) then
    raise exception 'published learning path versions are immutable';
  end if;
  return old;
end;
$$;

-- The API deletes enrollments in the same transaction before removing versions.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'cediah_runtime') then
    grant delete on public.learning_enrollments to cediah_runtime;
  end if;
end;
$$;


insert into public.cediah_schema_migrations(file_name,checksum) values('0017_delete_guided_learning_paths.sql','2d21eff1eb59b952e1571a4b8e68b4f501bb748a29b5dbcff1feddcde592fed6');

-- The public catalog uses a partial GIN index, but the editorial workspace also
-- searches drafts, review items, archived content and hidden publications.
-- Keep that search server-side without forcing a full scan as the corpus grows.
create index if not exists content_items_editor_search_vector_index
  on public.content_items using gin (search_vector);


insert into public.cediah_schema_migrations(file_name,checksum) values('0023_editor_content_search_index.sql','6df220ef5e207a41b54763c6caa50f2fa9e9b5b2cea45867f99d7fa5617b666c');

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


insert into public.cediah_schema_migrations(file_name,checksum) values('0030_guided_v2_definition.sql','cb47446cbefef5c45bc9921f9a0926c5f710a7e26718032e0b2523f7740d07ca');

-- V2 execution is additive. Historical v1 enrollments, attempts and responses
-- remain in their existing tables.

alter table public.learning_enrollments
  add constraint learning_enrollments_id_user_unique unique (id, user_id);

create table public.learning_v2_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.auth_users (id) on delete cascade,
  enrollment_id uuid not null,
  path_version_id uuid not null,
  client_attempt_id uuid not null,
  purpose text not null check (purpose in ('activity', 'assessment', 'review')),
  snapshot_json jsonb not null,
  resume_json jsonb not null default '{}'::jsonb,
  outcome_json jsonb,
  status text not null default 'in_progress' check (status in ('in_progress', 'paused', 'completed', 'abandoned')),
  row_version integer not null default 1 check (row_version > 0),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_attempt_id),
  unique (id, user_id, enrollment_id, path_version_id),
  foreign key (enrollment_id, user_id)
    references public.learning_enrollments (id, user_id) on delete cascade,
  foreign key (enrollment_id, path_version_id)
    references public.learning_enrollment_versions (enrollment_id, path_version_id) on delete cascade,
  constraint learning_v2_attempts_snapshot_object check (jsonb_typeof(snapshot_json) = 'object'),
  constraint learning_v2_attempts_resume_object check (jsonb_typeof(resume_json) = 'object'),
  constraint learning_v2_attempts_outcome_object check (outcome_json is null or jsonb_typeof(outcome_json) = 'object'),
  constraint learning_v2_attempts_submission_state check (
    (status = 'completed' and submitted_at is not null)
    or (status <> 'completed' and submitted_at is null)
  )
);

create index learning_v2_attempts_enrollment_version_index
  on public.learning_v2_attempts (enrollment_id, path_version_id, status, updated_at desc);
create index learning_v2_attempts_user_index
  on public.learning_v2_attempts (user_id, status, updated_at desc);

create table public.learning_v2_responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null,
  user_id uuid not null,
  enrollment_id uuid not null,
  path_version_id uuid not null,
  activity_key text not null,
  objective_key text not null,
  equivalence_key text not null,
  item_revision_hash char(64) not null,
  modality text not null check (modality in ('text', 'image', 'table', 'diagram', 'case', 'video')),
  purpose text not null check (purpose in ('learning', 'diagnostic', 'gate', 'final', 'retention7', 'retention30', 'review')),
  policy_version text not null default 'guided-v2.0' check (policy_version = 'guided-v2.0'),
  answer_json jsonb not null,
  grading_json jsonb not null,
  grading_source text not null check (grading_source in ('server', 'self', 'none')),
  confidence text check (confidence in ('sure', 'unsure', 'guessed')),
  assisted boolean not null default false,
  novel_at_presentation boolean not null default false,
  score01 double precision check (score01 between 0 and 1),
  accepted_at timestamptz not null default now(),
  unique (attempt_id, activity_key),
  unique (id, user_id, path_version_id),
  foreign key (attempt_id, user_id, enrollment_id, path_version_id)
    references public.learning_v2_attempts (id, user_id, enrollment_id, path_version_id) on delete cascade,
  constraint learning_v2_responses_activity_key check (activity_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint learning_v2_responses_objective_key check (objective_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint learning_v2_responses_equivalence_key check (equivalence_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint learning_v2_responses_revision_hash check (item_revision_hash ~ '^[a-fA-F0-9]{64}$'),
  constraint learning_v2_responses_answer_object check (jsonb_typeof(answer_json) = 'object'),
  constraint learning_v2_responses_grading_object check (jsonb_typeof(grading_json) = 'object')
);

create index learning_v2_responses_context_index
  on public.learning_v2_responses (enrollment_id, path_version_id, accepted_at desc);

create table public.learning_v2_objective_state (
  enrollment_id uuid not null,
  user_id uuid not null,
  path_version_id uuid not null,
  objective_key text not null,
  evidence_json jsonb not null default '{}'::jsonb,
  error_json jsonb not null default '{}'::jsonb,
  first_mastered_at timestamptz,
  first_consolidated_at timestamptz,
  row_version integer not null default 1 check (row_version > 0),
  updated_at timestamptz not null default now(),
  primary key (enrollment_id, path_version_id, objective_key),
  foreign key (enrollment_id, user_id)
    references public.learning_enrollments (id, user_id) on delete cascade,
  foreign key (enrollment_id, path_version_id)
    references public.learning_enrollment_versions (enrollment_id, path_version_id) on delete cascade,
  constraint learning_v2_objective_state_key check (objective_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint learning_v2_objective_state_evidence_object check (jsonb_typeof(evidence_json) = 'object'),
  constraint learning_v2_objective_state_error_object check (jsonb_typeof(error_json) = 'object'),
  constraint learning_v2_objective_state_dates check (first_consolidated_at is null or first_mastered_at is not null)
);

create index learning_v2_objective_state_user_index
  on public.learning_v2_objective_state (user_id, path_version_id);

create table public.learning_v2_activity_state (
  enrollment_id uuid not null,
  user_id uuid not null,
  path_version_id uuid not null,
  activity_key text not null,
  state text not null default 'not_started' check (state in ('not_started', 'dispensed', 'completed')),
  dispensed_reason text,
  evidence_attempt_id uuid,
  row_version integer not null default 1 check (row_version > 0),
  updated_at timestamptz not null default now(),
  primary key (enrollment_id, path_version_id, activity_key),
  foreign key (enrollment_id, user_id)
    references public.learning_enrollments (id, user_id) on delete cascade,
  foreign key (enrollment_id, path_version_id)
    references public.learning_enrollment_versions (enrollment_id, path_version_id) on delete cascade,
  foreign key (evidence_attempt_id, user_id, enrollment_id, path_version_id)
    references public.learning_v2_attempts (id, user_id, enrollment_id, path_version_id) on delete set null (evidence_attempt_id),
  constraint learning_v2_activity_state_key check (activity_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint learning_v2_activity_state_dispensed check (
    (state = 'dispensed' and dispensed_reason is not null and char_length(btrim(dispensed_reason)) > 0)
    or (state <> 'dispensed' and dispensed_reason is null)
  )
);

create index learning_v2_activity_state_user_index
  on public.learning_v2_activity_state (user_id, path_version_id, state);
create index learning_v2_activity_state_attempt_index
  on public.learning_v2_activity_state (evidence_attempt_id) where evidence_attempt_id is not null;

create table public.learning_v2_review_state (
  user_id uuid not null references public.auth_users (id) on delete cascade,
  enrollment_id uuid not null,
  path_version_id uuid not null,
  objective_key text not null,
  stage integer not null default 0 check (stage between 0 and 4),
  lapses integer not null default 0 check (lapses >= 0),
  due_at timestamptz not null,
  last_applied_response_id uuid,
  last_extended_at timestamptz,
  retention7_due_at timestamptz,
  retention7_accepted_at timestamptz,
  retention30_due_at timestamptz,
  retention30_accepted_at timestamptz,
  row_version integer not null default 1 check (row_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, path_version_id, objective_key),
  foreign key (enrollment_id, user_id)
    references public.learning_enrollments (id, user_id) on delete cascade,
  foreign key (enrollment_id, path_version_id)
    references public.learning_enrollment_versions (enrollment_id, path_version_id) on delete cascade,
  foreign key (last_applied_response_id, user_id, path_version_id)
    references public.learning_v2_responses (id, user_id, path_version_id) deferrable initially deferred,
  constraint learning_v2_review_state_key check (objective_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint learning_v2_review_state_retention_dates check (
    (retention7_accepted_at is null or retention7_due_at is not null)
    and (retention30_accepted_at is null or retention30_due_at is not null)
  )
);

create index learning_v2_review_state_due_index
  on public.learning_v2_review_state (user_id, due_at, path_version_id, objective_key);
create index learning_v2_review_state_enrollment_index
  on public.learning_v2_review_state (enrollment_id, path_version_id);
create index learning_v2_review_state_last_response_index
  on public.learning_v2_review_state (last_applied_response_id) where last_applied_response_id is not null;

create table public.learning_v2_imports (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references public.auth_users (id) on delete cascade,
  idempotency_key uuid not null,
  package_key text not null,
  revision integer not null check (revision > 0),
  content_hash char(64) not null,
  bindings_hash char(64) not null,
  normalized_json jsonb not null,
  bindings_json jsonb not null,
  issues_json jsonb not null default '[]'::jsonb,
  target_path_id uuid references public.learning_paths (id) on delete set null,
  target_version_id uuid references public.learning_path_versions (id) on delete set null,
  expected_version integer check (expected_version > 0),
  expires_at timestamptz not null,
  state text not null default 'validated' check (state in ('validated', 'committed', 'expired')),
  committed_path_id uuid references public.learning_paths (id) on delete set null,
  committed_version_id uuid references public.learning_path_versions (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (actor_user_id, idempotency_key),
  foreign key (target_version_id, target_path_id)
    references public.learning_path_versions (id, path_id) on delete set null (target_version_id),
  foreign key (committed_version_id, committed_path_id)
    references public.learning_path_versions (id, path_id) on delete set null (committed_version_id),
  constraint learning_v2_imports_target_context check (target_version_id is null or target_path_id is not null),
  constraint learning_v2_imports_committed_context check (committed_version_id is null or committed_path_id is not null),
  constraint learning_v2_imports_package_key check (package_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint learning_v2_imports_content_hash check (content_hash ~ '^[a-fA-F0-9]{64}$'),
  constraint learning_v2_imports_bindings_hash check (bindings_hash ~ '^[a-fA-F0-9]{64}$'),
  constraint learning_v2_imports_json_shape check (
    jsonb_typeof(normalized_json) = 'object' and jsonb_typeof(bindings_json) = 'object'
    and jsonb_typeof(issues_json) = 'array'
  ),
  constraint learning_v2_imports_expiry check (expires_at > created_at)
);

create index learning_v2_imports_expiry_index
  on public.learning_v2_imports (expires_at) where state = 'validated';
create index learning_v2_imports_target_path_index
  on public.learning_v2_imports (target_path_id) where target_path_id is not null;
create index learning_v2_imports_target_version_index
  on public.learning_v2_imports (target_version_id) where target_version_id is not null;
create index learning_v2_imports_committed_path_index
  on public.learning_v2_imports (committed_path_id) where committed_path_id is not null;
create index learning_v2_imports_committed_version_index
  on public.learning_v2_imports (committed_version_id) where committed_version_id is not null;

create function private.validate_learning_v2_runtime_version()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
begin
  if not exists (
    select 1 from public.learning_path_versions
    where id = new.path_version_id and policy_version = 'guided-v2.0'
  ) then
    raise exception 'learning v2 execution requires a guided-v2.0 version';
  end if;
  return new;
end;
$$;

create trigger learning_v2_attempts_require_version
  before insert or update of path_version_id on public.learning_v2_attempts
  for each row execute function private.validate_learning_v2_runtime_version();
create trigger learning_v2_objective_state_require_version
  before insert or update of path_version_id on public.learning_v2_objective_state
  for each row execute function private.validate_learning_v2_runtime_version();
create trigger learning_v2_activity_state_require_version
  before insert or update of path_version_id on public.learning_v2_activity_state
  for each row execute function private.validate_learning_v2_runtime_version();
create trigger learning_v2_review_state_require_version
  before insert or update of path_version_id on public.learning_v2_review_state
  for each row execute function private.validate_learning_v2_runtime_version();
revoke all on function private.validate_learning_v2_runtime_version() from public;

alter table public.learning_v2_attempts enable row level security;
alter table public.learning_v2_responses enable row level security;
alter table public.learning_v2_objective_state enable row level security;
alter table public.learning_v2_activity_state enable row level security;
alter table public.learning_v2_review_state enable row level security;
alter table public.learning_v2_imports enable row level security;

do $$
declare
  new_table text;
  inherited_grantee text;
begin
  foreach new_table in array array[
    'learning_v2_attempts', 'learning_v2_responses', 'learning_v2_objective_state',
    'learning_v2_activity_state', 'learning_v2_review_state', 'learning_v2_imports'
  ] loop
    execute format('revoke all on public.%I from public', new_table);
    for inherited_grantee in
      select distinct roles.rolname
      from pg_class as tables
      cross join lateral aclexplode(tables.relacl) as privileges
      join pg_roles as roles on roles.oid = privileges.grantee
      where tables.oid = format('public.%I', new_table)::regclass
        and privileges.grantee <> tables.relowner
    loop
      execute format('revoke all on public.%I from %I', new_table, inherited_grantee);
    end loop;
  end loop;

  if exists (select 1 from pg_roles where rolname = 'cediah_runtime') then
    grant select, insert, update on public.learning_v2_attempts,
      public.learning_v2_objective_state, public.learning_v2_activity_state,
      public.learning_v2_review_state, public.learning_v2_imports to cediah_runtime;
    grant select, insert on public.learning_v2_responses to cediah_runtime;
    grant delete on public.learning_v2_imports to cediah_runtime;
    create policy learning_v2_attempts_runtime on public.learning_v2_attempts
      to cediah_runtime using (true) with check (true);
    create policy learning_v2_responses_runtime on public.learning_v2_responses
      to cediah_runtime using (true) with check (true);
    create policy learning_v2_objective_state_runtime on public.learning_v2_objective_state
      to cediah_runtime using (true) with check (true);
    create policy learning_v2_activity_state_runtime on public.learning_v2_activity_state
      to cediah_runtime using (true) with check (true);
    create policy learning_v2_review_state_runtime on public.learning_v2_review_state
      to cediah_runtime using (true) with check (true);
    create policy learning_v2_imports_runtime on public.learning_v2_imports
      to cediah_runtime using (true) with check (true);
  end if;
end;
$$;


insert into public.cediah_schema_migrations(file_name,checksum) values('0031_guided_v2_runtime.sql','fe693db38c5ea818561ac6f0a302c3be87dd058dc63599feffec3e81fd1525e7');

-- Additive v2 reward kinds. Historical rows, keys and balances are unchanged.
alter table public.learning_rewards drop constraint learning_rewards_reward_kind_check;
alter table public.learning_rewards add constraint learning_rewards_reward_kind_check check (reward_kind in (
  'activity_understand', 'activity_recall', 'activity_check', 'review_applied',
  'unit_completed', 'route_completed', 'milestone_first_activity',
  'milestone_first_unit', 'milestone_first_review',
  'v2_objective_recalled', 'v2_objective_mastered', 'v2_objective_consolidated'
));


insert into public.cediah_schema_migrations(file_name,checksum) values('0032_guided_v2_rewards.sql','937d5163542988363694825f982f5af5cb7f1564a6895793948cd2f686be7496');

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


insert into public.cediah_schema_migrations(file_name,checksum) values('0033_guided_v2_runtime_access.sql','358c709312b027058365a4eb1ae7d9f571aafdfe2dc8a9defdd84d22deeb163f');

-- Expose only guided-v2 editorial audit records, preserving the legacy table.
create view private.guided_v2_audit with (security_barrier = true) as
select actor_user_id, action, target_type, target_id, metadata, occurred_at
from public.audit_log
where target_type = 'learning_path'
  and action in (
    'learning_path_v2_created', 'learning_path_v2_updated',
    'learning_path_v2_imported', 'learning_path_v2_version_created',
    'learning_path_v2_in_review', 'learning_path_v2_changes_requested',
    'learning_path_v2_approved', 'learning_path_v2_published',
    'learning_path_v2_archived'
  )
with cascaded check option;

revoke all on private.guided_v2_audit from public;
do $$
declare inherited_grantee text;
begin
  for inherited_grantee in
    select distinct grantee.rolname from pg_class as relation
    cross join lateral aclexplode(relation.relacl) as acl
    join pg_roles as grantee on grantee.oid = acl.grantee
    where relation.oid = 'private.guided_v2_audit'::regclass
      and acl.grantee <> relation.relowner
  loop
    execute format('revoke all on private.guided_v2_audit from %I', inherited_grantee);
  end loop;
  if exists (select 1 from pg_roles where rolname = 'cediah_runtime') then
    grant usage on schema private to cediah_runtime;
    grant select on private.guided_v2_audit to cediah_runtime;
    grant insert (actor_user_id, action, target_type, target_id, metadata)
      on private.guided_v2_audit to cediah_runtime;
  end if;
end;
$$;


insert into public.cediah_schema_migrations(file_name,checksum) values('0034_guided_v2_editor_audit.sql','8be064ec3e86735791c822a72e44226c6387ef018e69f7f6deb7351cd0d55d42');

-- Runtime needs these three private columns to resolve only an authorized active image.
-- No browser role, table-wide grant, write privilege or historical migration changes.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'cediah_runtime') then
    grant select (storage_bucket, storage_path, mime_type)
      on public.content_assets to cediah_runtime;
  end if;
end;
$$;


insert into public.cediah_schema_migrations(file_name,checksum) values('0035_guided_v2_media_access.sql','3da09ebf0c67583dc59c33c78507200bbfbfab22ce8a1d52b0257e807bf0e6a5');

-- Topic ordering belongs to the server API, never to browser database roles.
alter table public.content_topic_item_order enable row level security;
revoke all on public.content_topic_item_order from public;

do $$
declare inherited_grantee text;
begin
  for inherited_grantee in
    select distinct role.rolname
    from pg_class as relation
    cross join lateral aclexplode(relation.relacl) as acl
    join pg_roles as role on role.oid = acl.grantee
    where relation.oid = 'public.content_topic_item_order'::regclass
      and acl.grantee <> relation.relowner
  loop
    execute format('revoke all on public.content_topic_item_order from %I', inherited_grantee);
  end loop;
  if exists (select 1 from pg_roles where rolname = 'cediah_runtime') then
    grant select, insert, update, delete on public.content_topic_item_order to cediah_runtime;
    create policy cediah_runtime_topic_order on public.content_topic_item_order
      to cediah_runtime using (true) with check (true);
  end if;
end;
$$;


insert into public.cediah_schema_migrations(file_name,checksum) values('0036_topic_order_runtime_access.sql','7739a97a0d8d7cc9eca3c3311a9d4ff119a5471cd773ab74963297cf8e3d8337');

drop policy cediah_runtime_all on public.interactive_terms;
drop policy cediah_runtime_all on public.interactive_term_aliases;
drop policy cediah_runtime_all on public.guide_sections;
drop policy cediah_runtime_all on public.interactive_term_links;
drop policy cediah_runtime_all on public.interactive_term_dictionary_state;
drop policy cediah_runtime_all on public.guide_term_manifests;
drop policy cediah_runtime_all on public.guide_term_usage;
drop policy cediah_runtime_all on public.guide_term_reindex_queue;

-- Keep interactive-term storage private from inherited/browser database roles while
-- allowing the dedicated application runtime role when the deployment defines it.

alter table public.interactive_terms enable row level security;
alter table public.interactive_term_aliases enable row level security;
alter table public.guide_sections enable row level security;
alter table public.interactive_term_links enable row level security;
alter table public.interactive_term_dictionary_state enable row level security;
alter table public.guide_term_manifests enable row level security;
alter table public.guide_term_usage enable row level security;
alter table public.guide_term_reindex_queue enable row level security;

revoke all on public.interactive_terms,
  public.interactive_term_aliases,
  public.guide_sections,
  public.interactive_term_links,
  public.interactive_term_dictionary_state,
  public.guide_term_manifests,
  public.guide_term_usage,
  public.guide_term_reindex_queue
from public;

do $$
declare
  inherited_grantee text;
begin
  -- Revoke provider/default grants without naming vendor-specific roles.
  for inherited_grantee in
    select distinct roles.rolname
    from pg_class as tables
    cross join lateral aclexplode(tables.relacl) as privileges
    join pg_roles as roles on roles.oid = privileges.grantee
    where tables.oid in (
      'public.interactive_terms'::regclass,
      'public.interactive_term_aliases'::regclass,
      'public.guide_sections'::regclass,
      'public.interactive_term_links'::regclass,
      'public.interactive_term_dictionary_state'::regclass,
      'public.guide_term_manifests'::regclass,
      'public.guide_term_usage'::regclass,
      'public.guide_term_reindex_queue'::regclass
    )
      and privileges.grantee <> tables.relowner
  loop
    execute format(
      'revoke all on public.interactive_terms, public.interactive_term_aliases, public.guide_sections, public.interactive_term_links, public.interactive_term_dictionary_state, public.guide_term_manifests, public.guide_term_usage, public.guide_term_reindex_queue from %I',
      inherited_grantee
    );
  end loop;

  -- A portable installation may run as the table owner. Production instead uses
  -- a dedicated least-privilege runtime role when cediah_runtime is present.
  if exists (select 1 from pg_roles where rolname = 'cediah_runtime') then
    grant select, insert, update, delete on public.interactive_terms,
      public.interactive_term_aliases,
      public.guide_sections,
      public.interactive_term_links,
      public.interactive_term_dictionary_state,
      public.guide_term_manifests,
      public.guide_term_usage,
      public.guide_term_reindex_queue
    to cediah_runtime;

    create policy cediah_runtime_all on public.interactive_terms
      to cediah_runtime using (true) with check (true);
    create policy cediah_runtime_all on public.interactive_term_aliases
      to cediah_runtime using (true) with check (true);
    create policy cediah_runtime_all on public.guide_sections
      to cediah_runtime using (true) with check (true);
    create policy cediah_runtime_all on public.interactive_term_links
      to cediah_runtime using (true) with check (true);
    create policy cediah_runtime_all on public.interactive_term_dictionary_state
      to cediah_runtime using (true) with check (true);
    create policy cediah_runtime_all on public.guide_term_manifests
      to cediah_runtime using (true) with check (true);
    create policy cediah_runtime_all on public.guide_term_usage
      to cediah_runtime using (true) with check (true);
    create policy cediah_runtime_all on public.guide_term_reindex_queue
      to cediah_runtime using (true) with check (true);
  end if;
end;
$$;


insert into public.cediah_schema_migrations(file_name,checksum) values('0017_editorial_topics_and_drafts.sql','912d4d6631d2dc9f6285b80c7dd555ecd9d9ed1ae29a1b08568141907b9a1290');

insert into public.cediah_schema_migrations(file_name,checksum) values('0018_editor_workspace_indexes.sql','cf2359a37baf4d2d2c1568299236e119045637d7cff4db152c285e19dac34133');

insert into public.cediah_schema_migrations(file_name,checksum) values('0019_content_search.sql','c9fc2d4bf92d8dee08e51b3a8e2503170b4949396c4c4d769916675b76b2a273');

insert into public.cediah_schema_migrations(file_name,checksum) values('0020_content_search_function_hardening.sql','3bbd0625f945a75f0775186a3638f65e14f3640e16b41c6921cd4015b2c52aaa');

insert into public.cediah_schema_migrations(file_name,checksum) values('0021_optional_content_topic.sql','aa0b7af148e1af93bce108a3a01daf928d5da8d860203fb87791a15093487061');

insert into public.cediah_schema_migrations(file_name,checksum) values('0022_content_topic_item_order.sql','2faaa1aa9280b5900ccadb9050917d1966b962ea22459e19cfa2896b4b3f127a');

insert into public.cediah_schema_migrations(file_name,checksum) values('0024_interactive_guide_terms.sql','b6fe090d024e5cbad7f89ac49dd967b62ffb055fd6264150a31f97cfc46fdf88');

insert into public.cediah_schema_migrations(file_name,checksum) values('0025_interactive_term_invalidation.sql','c26bffac99792e8868e70c737cbee1f4fa7a389212fdd9c11f527acfb85ba28c');

insert into public.cediah_schema_migrations(file_name,checksum) values('0026_interactive_terms_runtime_access.sql','e36589740d272097b41d12f28449da2ace6cb9ea7340833b77233d000641c259');

insert into public.cediah_schema_migrations(file_name,checksum) values('0027_interactive_term_function_hardening.sql','f3510989a194a2bd62d33130f4356eec82d37c5487cb7660e9901c70eaf9ffee');

insert into public.cediah_schema_migrations(file_name,checksum) values('0028_interactive_term_link_indexes.sql','f40d6c51e9b51504f9a22ba1e704832e7739d86e89b5bb71cd1814bd0afe978c');

create table public.cediah_schema_migration_exclusions(file_name text primary key,checksum text not null,reason text not null check(reason='empty_installation'),recorded_at timestamptz not null default now()); alter table public.cediah_schema_migration_exclusions enable row level security; revoke all on public.cediah_schema_migration_exclusions from public,anon,authenticated,service_role;

do $guard$ declare t record; n bigint; h text; begin for t in select * from prod01_preservation order by relation_name loop execute format('select count(*),md5(coalesce(string_agg(md5((to_jsonb(r)-''definition_v2_json'')::text),'''' order by md5((to_jsonb(r)-''definition_v2_json'')::text)),'''')) from %s r',t.relation_name) into n,h; if n<>t.row_count or h<>t.digest then raise exception 'Existing rows changed in %',t.relation_name;end if;end loop; if (select count(*) from public.cediah_schema_migrations)<>37 then raise exception 'Incomplete migration ledger';end if; end $guard$;