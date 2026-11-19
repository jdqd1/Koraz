-- Index visible text rather than JSON syntax, editor attributes or internal IDs.
create or replace function public.cediah_visible_search_text(value jsonb)
returns text language plpgsql immutable parallel safe
set search_path = pg_catalog, public
as $$
declare result text := ''; entry record;
begin
  if jsonb_typeof(value) = 'string' then return value #>> '{}'; end if;
  if jsonb_typeof(value) = 'array' then
    for entry in select v from jsonb_array_elements(value) as a(v) loop
      result := concat_ws(' ', result, public.cediah_visible_search_text(entry.v));
    end loop;
  elsif jsonb_typeof(value) = 'object' then
    for entry in select key, v from jsonb_each(value) as a(key,v)
      where key in ('text','content','heading','body','prompt','options','explanation','questions')
      order by key loop
      result := concat_ws(' ', result, public.cediah_visible_search_text(entry.v));
    end loop;
  end if;
  return trim(result);
end;
$$;

create or replace function public.cediah_content_search_text(content_kind public.content_kind, content jsonb)
returns text language sql immutable strict parallel safe
set search_path = pg_catalog, public
as $$
  select case when content_kind in ('guide','video') then concat_ws(' ',
    case when content_kind = 'video' then content->>'description' end,
    public.cediah_visible_search_text(content->'keyPoints'),
    public.cediah_visible_search_text(content->'quiz'),
    public.cediah_visible_search_text(content->'regions'),
    coalesce(nullif(public.cediah_visible_search_text(
      case when content_kind = 'video' then content #> '{guide,document}' else content->'document' end), ''),
      public.cediah_visible_search_text(
        case when content_kind = 'video' then content #> '{guide,sections}' else content->'sections' end)))
    else '' end;
$$;

update public.content_items
set search_vector = public.cediah_content_search_vector(kind, title, topic, summary, content)
where kind in ('guide','video');
