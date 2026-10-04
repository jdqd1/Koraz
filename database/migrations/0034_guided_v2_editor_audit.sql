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
