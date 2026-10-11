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
