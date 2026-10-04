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
