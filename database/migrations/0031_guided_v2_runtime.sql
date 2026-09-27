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
