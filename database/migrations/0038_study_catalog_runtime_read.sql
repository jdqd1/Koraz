-- A fresh runtime role needs the public catalog taxonomy to resolve practice resources.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'cediah_runtime') then
    grant select (id, slug, name) on public.subjects to cediah_runtime;
    grant select (content_item_id, subject_id) on public.content_subjects to cediah_runtime;
  end if;
end $$;
