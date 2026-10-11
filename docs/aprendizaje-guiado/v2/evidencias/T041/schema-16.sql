--
-- PostgreSQL database dump
--

\restrict mS7r20mVOWYJnECmsBmwVp6y1qBPBygdb7U1u2WMOSuSxmRz9YdANoruNOpmCrJ

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: private; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA private;


--
-- Name: catalog_visibility; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.catalog_visibility AS ENUM (
    'catalog',
    'guided_only'
);


--
-- Name: content_asset_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.content_asset_kind AS ENUM (
    'video',
    'document',
    'image'
);


--
-- Name: content_asset_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.content_asset_status AS ENUM (
    'pending',
    'ready'
);


--
-- Name: content_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.content_kind AS ENUM (
    'video',
    'guide',
    'quiz',
    'flashcards',
    'topic'
);


--
-- Name: course_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.course_status AS ENUM (
    'draft',
    'in_review',
    'changes_requested',
    'approved',
    'published',
    'archived'
);


--
-- Name: enrollment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enrollment_status AS ENUM (
    'active',
    'paused',
    'expired',
    'revoked',
    'completed'
);


--
-- Name: lesson_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lesson_kind AS ENUM (
    'video',
    'document',
    'interactive'
);


--
-- Name: platform_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.platform_role AS ENUM (
    'student',
    'content_creator',
    'coordinator',
    'administrator'
);


--
-- Name: progress_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.progress_status AS ENUM (
    'not_started',
    'in_progress',
    'completed'
);


--
-- Name: resource_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.resource_type AS ENUM (
    'guide',
    'atlas',
    'worksheet',
    'link'
);


--
-- Name: term_occurrence_policy; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.term_occurrence_policy AS ENUM (
    'first_per_section',
    'first_per_guide',
    'all'
);


--
-- Name: bootstrap_new_user(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.bootstrap_new_user() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_catalog'
    AS $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.name)
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name;

  insert into public.user_roles (user_id, role)
  values (new.id, 'student')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;


--
-- Name: bump_interactive_term_dictionary_revision(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.bump_interactive_term_dictionary_revision() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog', 'public', 'private'
    AS $$
begin
  update public.interactive_term_dictionary_state
  set revision = revision + 1,
      updated_at = now()
  where singleton = true;

  perform private.enqueue_all_published_guides_for_terms('dictionary_changed');
  return null;
end;
$$;


--
-- Name: enqueue_all_published_guides_for_terms(text); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.enqueue_all_published_guides_for_terms(enqueue_reason text) RETURNS void
    LANGUAGE sql
    SET search_path TO 'pg_catalog', 'public', 'private'
    AS $$
  insert into public.guide_term_reindex_queue (content_item_id, requested_at, reason, attempt_count, last_error)
  select id, now(), left(coalesce(enqueue_reason, 'dictionary_changed'), 120), 0, null
  from public.content_items
  where kind = 'guide' and status = 'published'
  on conflict (content_item_id) do update
  set requested_at = excluded.requested_at,
      reason = excluded.reason,
      attempt_count = 0,
      last_error = null;
$$;


--
-- Name: enqueue_guide_term_reindex(uuid, text); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.enqueue_guide_term_reindex(target_content_id uuid, enqueue_reason text) RETURNS void
    LANGUAGE sql
    SET search_path TO 'pg_catalog', 'public', 'private'
    AS $$
  insert into public.guide_term_reindex_queue (content_item_id, requested_at, reason, attempt_count, last_error)
  select content_items.id, now(), left(coalesce(enqueue_reason, 'content_changed'), 120), 0, null
  from public.content_items
  where content_items.id = target_content_id
    and content_items.kind = 'guide'
    and content_items.status = 'published'
  on conflict (content_item_id) do update
  set requested_at = excluded.requested_at,
      reason = excluded.reason,
      attempt_count = 0,
      last_error = null;
$$;


--
-- Name: lock_guided_v2_actor(uuid); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.lock_guided_v2_actor(actor_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'pg_temp'
    AS $$
declare locked_id uuid;
begin
  select actor.id into locked_id from public.auth_users as actor
    where actor.id = actor_id for update;
  return locked_id;
end;
$$;


--
-- Name: lock_guided_v2_catalog(text, uuid); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.lock_guided_v2_catalog(resource_kind text, target_resource_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'pg_temp'
    AS $$
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


--
-- Name: normalize_learning_content_identity(jsonb, public.content_kind); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.normalize_learning_content_identity(source_content jsonb, source_kind public.content_kind) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog', 'public', 'private'
    AS $$
declare
  cards jsonb;
  normalized jsonb := source_content;
  normalized_entries jsonb := '[]'::jsonb;
  entry jsonb;
  option_count integer;
  option_ids jsonb;
  questions jsonb;
  questions_path text[];
begin
  if source_kind = 'flashcards' then
    cards := coalesce(source_content -> 'cards', '[]'::jsonb);
    if jsonb_typeof(cards) <> 'array' then
      raise exception 'flashcard content must contain an array of cards';
    end if;
    for entry in select value from jsonb_array_elements(cards)
    loop
      if entry ? 'id' then
        perform (entry ->> 'id')::uuid;
      else
        entry := entry || jsonb_build_object('id', gen_random_uuid());
      end if;
      if entry ? 'memoryVersion' then
        if jsonb_typeof(entry -> 'memoryVersion') <> 'number'
          or (entry ->> 'memoryVersion')::integer < 1 then
          raise exception 'flashcard memoryVersion must be a positive integer';
        end if;
      else
        entry := entry || jsonb_build_object('memoryVersion', 1);
      end if;
      normalized_entries := normalized_entries || jsonb_build_array(entry);
    end loop;
    return jsonb_set(normalized, '{cards}', normalized_entries, true);
  end if;

  if source_kind = 'quiz' then
    questions_path := array['questions'];
  elsif source_kind in ('video', 'guide') then
    questions_path := array['quiz', 'questions'];
  else
    return source_content;
  end if;

  questions := coalesce(source_content #> questions_path, '[]'::jsonb);
  if jsonb_typeof(questions) <> 'array' then
    raise exception 'learning content must contain an array of questions';
  end if;

  for entry in select value from jsonb_array_elements(questions)
  loop
    if entry ? 'id' then
      perform (entry ->> 'id')::uuid;
    else
      entry := entry || jsonb_build_object('id', gen_random_uuid());
    end if;
    if entry ? 'memoryVersion' then
      if jsonb_typeof(entry -> 'memoryVersion') <> 'number'
        or (entry ->> 'memoryVersion')::integer < 1 then
        raise exception 'question memoryVersion must be a positive integer';
      end if;
    else
      entry := entry || jsonb_build_object('memoryVersion', 1);
    end if;

    option_count := jsonb_array_length(coalesce(entry -> 'options', '[]'::jsonb));
    if option_count < 2 then
      raise exception 'question must contain at least two options';
    end if;
    if entry ? 'optionIds' then
      option_ids := entry -> 'optionIds';
      if jsonb_typeof(option_ids) <> 'array'
        or jsonb_array_length(option_ids) <> option_count then
        raise exception 'optionIds must match question options';
      end if;
      if (
        select count(*) <> count(distinct value)
        from jsonb_array_elements_text(option_ids)
      ) then
        raise exception 'optionIds must be unique';
      end if;
      perform value::uuid from jsonb_array_elements_text(option_ids);
    else
      select coalesce(jsonb_agg(to_jsonb(gen_random_uuid())), '[]'::jsonb)
      into option_ids
      from generate_series(1, option_count);
      entry := entry || jsonb_build_object('optionIds', option_ids);
    end if;
    normalized_entries := normalized_entries || jsonb_build_array(entry);
  end loop;

  return jsonb_set(normalized, questions_path, normalized_entries, true);
end;
$$;


--
-- Name: normalize_term_key(text); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.normalize_term_key(value text) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    SET search_path TO 'pg_catalog', 'public', 'private'
    AS $$
  select trim(
    regexp_replace(
      translate(
        lower(coalesce(value, '')),
        'áéíóúüñàèìòùâêîôûäëïöü',
        'aeiouunaeiouaeiouaeiou'
      ),
      '[^a-z0-9]+',
      ' ',
      'g'
    )
  );
$$;


--
-- Name: prevent_last_administrator_removal(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.prevent_last_administrator_removal() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_catalog'
    AS $$
begin
  if old.role = 'administrator'
     and not exists (
       select 1
       from public.user_roles
       where role = 'administrator'
         and user_id <> old.user_id
     ) then
    raise exception using
      errcode = 'P0001',
      message = 'last_administrator';
  end if;

  return old;
end;
$$;


--
-- Name: prevent_learning_attempt_manifest_mutation(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.prevent_learning_attempt_manifest_mutation() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog', 'public', 'private'
    AS $$
begin
  if new.manifest_json is distinct from old.manifest_json
     or new.user_id is distinct from old.user_id
     or new.client_attempt_id is distinct from old.client_attempt_id
     or new.enrollment_id is distinct from old.enrollment_id
     or new.path_version_id is distinct from old.path_version_id
     or new.step_id is distinct from old.step_id
     or new.step_option_id is distinct from old.step_option_id
     or new.projection is distinct from old.projection then
    raise exception 'learning attempt manifest and context are immutable';
  end if;
  return new;
end;
$$;


--
-- Name: prevent_learning_response_mutation(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.prevent_learning_response_mutation() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog', 'public', 'private'
    AS $$
begin
  raise exception 'learning responses are immutable';
end;
$$;


--
-- Name: prevent_learning_revision_mutation(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.prevent_learning_revision_mutation() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog', 'public', 'private'
    AS $$
begin
  raise exception 'learning resource revisions are immutable';
end;
$$;


--
-- Name: prevent_learning_v2_policy_downgrade(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.prevent_learning_v2_policy_downgrade() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog', 'public', 'private'
    AS $$
begin
  if old.policy_version = 'guided-v2.0' and new.policy_version <> 'guided-v2.0'
    and exists (select 1 from public.learning_v2_bindings where path_version_id = old.id) then
    raise exception 'learning v2 bindings must be removed before changing policy';
  end if;
  return new;
end;
$$;


--
-- Name: prevent_published_learning_definition_mutation(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.prevent_published_learning_definition_mutation() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog', 'public', 'private'
    AS $$
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


--
-- Name: queue_published_guide_term_reindex(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.queue_published_guide_term_reindex() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog', 'public', 'private'
    AS $$
begin
  if new.kind = 'guide' and new.status = 'published' and (
    tg_op = 'INSERT'
    or old.status is distinct from new.status
    or old.content is distinct from new.content
  ) then
    perform private.enqueue_guide_term_reindex(new.id, 'guide_published_or_changed');
  end if;
  return new;
end;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: validate_active_learning_version_adopted(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.validate_active_learning_version_adopted() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog', 'public', 'private'
    AS $$
begin
  if not exists (
    select 1 from public.learning_enrollment_versions
    where enrollment_id = new.id and path_version_id = new.path_version_id
  ) then
    raise exception 'active learning path version must be adopted by enrollment';
  end if;
  return null;
end;
$$;


--
-- Name: validate_learning_topic(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.validate_learning_topic() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog', 'public', 'private'
    AS $$
begin
  if not exists (
    select 1 from public.content_items
    where id = new.topic_content_id and kind = 'topic'
  ) then
    raise exception 'learning path topic_content_id must reference topic content';
  end if;
  return new;
end;
$$;


--
-- Name: validate_learning_user_enrollment(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.validate_learning_user_enrollment() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog', 'public', 'private'
    AS $$
declare
  selected_enrollment uuid;
begin
  selected_enrollment := case
    when tg_table_name = 'learning_preferences'
      then nullif(to_jsonb(new)->>'pinned_enrollment_id', '')::uuid
    else nullif(to_jsonb(new)->>'enrollment_id', '')::uuid
  end;
  if selected_enrollment is not null and not exists (
    select 1 from public.learning_enrollments
    where id = selected_enrollment and user_id = new.user_id
  ) then
    raise exception 'learning enrollment must belong to preference owner';
  end if;
  return new;
end;
$$;


--
-- Name: validate_learning_v2_binding(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.validate_learning_v2_binding() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog', 'public', 'private'
    AS $$
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


--
-- Name: validate_learning_v2_runtime_version(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.validate_learning_v2_runtime_version() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog', 'public', 'private'
    AS $$
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


--
-- Name: cediah_content_search_text(public.content_kind, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cediah_content_search_text(content_kind public.content_kind, content jsonb) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
    SET search_path TO 'pg_catalog', 'public'
    AS $$
  select case content_kind
    when 'video'::public.content_kind then
      coalesce(content ->> 'description', '') || ' ' ||
      coalesce((content -> 'keyPoints')::text, '') || ' ' ||
      coalesce((content -> 'guide')::text, '') || ' ' ||
      coalesce((content -> 'quiz')::text, '') || ' ' ||
      coalesce((content -> 'regions')::text, '')
    when 'guide'::public.content_kind then
      coalesce((content -> 'document')::text, '') || ' ' ||
      coalesce((content -> 'keyPoints')::text, '') || ' ' ||
      coalesce((content -> 'quiz')::text, '') || ' ' ||
      coalesce((content -> 'regions')::text, '') || ' ' ||
      coalesce((content -> 'sections')::text, '')
    else ''
  end;
$$;


--
-- Name: cediah_content_search_vector(public.content_kind, text, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cediah_content_search_vector(content_kind public.content_kind, content_title text, content_topic text, content_summary text, content jsonb) RETURNS tsvector
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    SET search_path TO 'pg_catalog', 'public'
    AS $$
  select
    setweight(
      to_tsvector(
        'simple'::regconfig,
        public.cediah_search_normalize(coalesce(content_title, ''))
      ),
      'A'
    )
    || setweight(
      to_tsvector(
        'simple'::regconfig,
        public.cediah_search_normalize(
          coalesce(content_topic, '') || ' ' || coalesce(content_summary, '')
        )
      ),
      'B'
    )
    || setweight(
      to_tsvector(
        'simple'::regconfig,
        public.cediah_search_normalize(
          public.cediah_content_search_text(content_kind, coalesce(content, '{}'::jsonb))
        )
      ),
      'C'
    );
$$;


--
-- Name: cediah_refresh_content_search_vector(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cediah_refresh_content_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog', 'public'
    AS $$
begin
  new.search_vector := public.cediah_content_search_vector(
    new.kind,
    new.title,
    new.topic,
    new.summary,
    new.content
  );
  return new;
end;
$$;


--
-- Name: cediah_search_normalize(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cediah_search_normalize(value text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
    SET search_path TO 'pg_catalog', 'public'
    AS $$
  select translate(
    lower(value),
    'áàäâãåéèëêíìïîóòöôõúùüûñç',
    'aaaaaaeeeeiiiiooooouuuunc'
  );
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_user_id uuid,
    action text NOT NULL,
    target_type text NOT NULL,
    target_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT audit_log_action_length CHECK (((char_length(btrim(action)) >= 1) AND (char_length(btrim(action)) <= 120))),
    CONSTRAINT audit_log_metadata_is_object CHECK ((jsonb_typeof(metadata) = 'object'::text)),
    CONSTRAINT audit_log_target_type_length CHECK (((char_length(btrim(target_type)) >= 1) AND (char_length(btrim(target_type)) <= 120)))
);


--
-- Name: guided_v2_audit; Type: VIEW; Schema: private; Owner: -
--

CREATE VIEW private.guided_v2_audit WITH (security_barrier='true') AS
 SELECT actor_user_id,
    action,
    target_type,
    target_id,
    metadata,
    occurred_at
   FROM public.audit_log
  WHERE ((target_type = 'learning_path'::text) AND (action = ANY (ARRAY['learning_path_v2_created'::text, 'learning_path_v2_updated'::text, 'learning_path_v2_imported'::text, 'learning_path_v2_version_created'::text, 'learning_path_v2_in_review'::text, 'learning_path_v2_changes_requested'::text, 'learning_path_v2_approved'::text, 'learning_path_v2_published'::text, 'learning_path_v2_archived'::text])))
  WITH CASCADED CHECK OPTION;


--
-- Name: auth_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    issuer text NOT NULL,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    access_token text,
    refresh_token text,
    id_token text,
    access_token_expires_at timestamp with time zone,
    refresh_token_expires_at timestamp with time zone,
    scope text,
    password text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: auth_rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_rate_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    count integer NOT NULL,
    last_request bigint NOT NULL
);


--
-- Name: auth_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    token text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    ip_address text,
    user_agent text,
    user_id uuid NOT NULL
);


--
-- Name: auth_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    image text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT auth_users_email_length CHECK (((char_length(btrim(email)) >= 3) AND (char_length(btrim(email)) <= 320))),
    CONSTRAINT auth_users_name_length CHECK (((char_length(btrim(name)) >= 1) AND (char_length(btrim(name)) <= 200)))
);


--
-- Name: auth_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cediah_schema_migration_exclusions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cediah_schema_migration_exclusions (
    file_name text NOT NULL,
    checksum text NOT NULL,
    reason text NOT NULL,
    recorded_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cediah_schema_migration_exclusions_reason_check CHECK ((reason = 'empty_installation'::text))
);


--
-- Name: cediah_schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cediah_schema_migrations (
    file_name text NOT NULL,
    checksum text NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: content_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_item_id uuid NOT NULL,
    owner_user_id uuid NOT NULL,
    kind public.content_asset_kind NOT NULL,
    storage_bucket text NOT NULL,
    storage_path text NOT NULL,
    original_file_name text NOT NULL,
    mime_type text NOT NULL,
    size_bytes bigint NOT NULL,
    status public.content_asset_status DEFAULT 'pending'::public.content_asset_status NOT NULL,
    finalized_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT content_assets_bucket_length CHECK (((char_length(btrim(storage_bucket)) >= 2) AND (char_length(btrim(storage_bucket)) <= 63))),
    CONSTRAINT content_assets_file_name_length CHECK (((char_length(btrim(original_file_name)) >= 1) AND (char_length(btrim(original_file_name)) <= 255))),
    CONSTRAINT content_assets_finalization_fields CHECK ((((status = 'ready'::public.content_asset_status) AND (finalized_at IS NOT NULL)) OR ((status = 'pending'::public.content_asset_status) AND (finalized_at IS NULL)))),
    CONSTRAINT content_assets_kind_matches_mime CHECK ((((kind = 'video'::public.content_asset_kind) AND (mime_type = ANY (ARRAY['video/mp4'::text, 'video/quicktime'::text, 'video/webm'::text]))) OR ((kind = 'document'::public.content_asset_kind) AND (mime_type = 'application/pdf'::text)) OR ((kind = 'image'::public.content_asset_kind) AND (mime_type = ANY (ARRAY['image/jpeg'::text, 'image/png'::text, 'image/webp'::text]))))),
    CONSTRAINT content_assets_path_length CHECK (((char_length(btrim(storage_path)) >= 1) AND (char_length(btrim(storage_path)) <= 1000))),
    CONSTRAINT content_assets_size_range CHECK (((size_bytes > 0) AND (size_bytes <= 500000000)))
);


--
-- Name: content_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kind public.content_kind NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    summary text NOT NULL,
    topic text NOT NULL,
    status public.course_status DEFAULT 'draft'::public.course_status NOT NULL,
    content jsonb DEFAULT '{}'::jsonb NOT NULL,
    estimated_minutes integer,
    is_featured boolean DEFAULT false NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    author_user_id uuid NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    published_by uuid,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    catalog_visibility public.catalog_visibility DEFAULT 'catalog'::public.catalog_visibility NOT NULL,
    search_vector tsvector,
    CONSTRAINT content_items_content_is_object CHECK ((jsonb_typeof(content) = 'object'::text)),
    CONSTRAINT content_items_estimated_minutes_positive CHECK (((estimated_minutes IS NULL) OR (estimated_minutes >= 0))),
    CONSTRAINT content_items_publication_fields CHECK ((((status = 'published'::public.course_status) AND (published_at IS NOT NULL) AND (published_by IS NOT NULL)) OR (status <> 'published'::public.course_status))),
    CONSTRAINT content_items_review_fields CHECK ((((reviewed_by IS NULL) AND (reviewed_at IS NULL)) OR ((reviewed_by IS NOT NULL) AND (reviewed_at IS NOT NULL)))),
    CONSTRAINT content_items_slug_format CHECK ((slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)),
    CONSTRAINT content_items_summary_length CHECK (((char_length(btrim(summary)) <= 2000) AND ((status = ANY (ARRAY['draft'::public.course_status, 'changes_requested'::public.course_status])) OR (char_length(btrim(summary)) >= 1)))),
    CONSTRAINT content_items_title_length CHECK (((char_length(btrim(title)) <= 200) AND ((status = ANY (ARRAY['draft'::public.course_status, 'changes_requested'::public.course_status])) OR (char_length(btrim(title)) >= 1)))),
    CONSTRAINT content_items_topic_length CHECK ((char_length(btrim(topic)) <= 120)),
    CONSTRAINT content_items_version_positive CHECK ((version > 0))
);


--
-- Name: content_reaction_counts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_reaction_counts (
    content_item_id uuid NOT NULL,
    like_count bigint DEFAULT 0 NOT NULL,
    dislike_count bigint DEFAULT 0 NOT NULL,
    CONSTRAINT content_reaction_counts_dislike_count_check CHECK ((dislike_count >= 0)),
    CONSTRAINT content_reaction_counts_like_count_check CHECK ((like_count >= 0))
);


--
-- Name: content_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_reactions (
    content_item_id uuid NOT NULL,
    viewer_key text NOT NULL,
    reaction text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT content_reactions_reaction_check CHECK ((reaction = ANY (ARRAY['liked'::text, 'disliked'::text]))),
    CONSTRAINT content_reactions_viewer_key_check CHECK ((char_length(viewer_key) = 64))
);


--
-- Name: content_subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_subjects (
    content_item_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: content_topic_item_order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_topic_item_order (
    subject_id uuid NOT NULL,
    topic_key text NOT NULL,
    content_item_id uuid NOT NULL,
    "position" integer NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT content_topic_item_order_position_nonnegative CHECK (("position" >= 0)),
    CONSTRAINT content_topic_item_order_topic_key_length CHECK (((char_length(btrim(topic_key)) >= 1) AND (char_length(btrim(topic_key)) <= 120)))
);


--
-- Name: content_topic_subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_topic_subjects (
    topic_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: content_topics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_topics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT content_topics_name_length CHECK (((char_length(btrim(name)) >= 1) AND (char_length(btrim(name)) <= 120)))
);


--
-- Name: content_view_counts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_view_counts (
    content_item_id uuid NOT NULL,
    view_count bigint DEFAULT 0 NOT NULL,
    CONSTRAINT content_view_counts_view_count_check CHECK ((view_count >= 0))
);


--
-- Name: content_view_receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_view_receipts (
    content_item_id uuid NOT NULL,
    viewer_key text NOT NULL,
    last_viewed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT content_view_receipts_viewer_key_check CHECK ((char_length(viewer_key) = 64))
);


--
-- Name: course_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    title text NOT NULL,
    "position" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT course_modules_position_positive CHECK (("position" > 0)),
    CONSTRAINT course_modules_title_length CHECK (((char_length(btrim(title)) >= 1) AND (char_length(btrim(title)) <= 200)))
);


--
-- Name: course_resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    lesson_id uuid,
    title text NOT NULL,
    type public.resource_type NOT NULL,
    storage_path text,
    external_url text,
    requires_enrollment boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT course_resources_location CHECK ((((storage_path IS NOT NULL) AND (external_url IS NULL)) OR ((storage_path IS NULL) AND (external_url IS NOT NULL)))),
    CONSTRAINT course_resources_title_length CHECK (((char_length(btrim(title)) >= 1) AND (char_length(btrim(title)) <= 200))),
    CONSTRAINT course_resources_url_format CHECK (((external_url IS NULL) OR (external_url ~ '^https://'::text)))
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    short_description text,
    status public.course_status DEFAULT 'draft'::public.course_status NOT NULL,
    estimated_duration_minutes integer,
    created_by uuid NOT NULL,
    published_by uuid,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT courses_description_length CHECK (((short_description IS NULL) OR (char_length(short_description) <= 2000))),
    CONSTRAINT courses_duration_positive CHECK (((estimated_duration_minutes IS NULL) OR (estimated_duration_minutes >= 0))),
    CONSTRAINT courses_publication_fields CHECK ((((status = 'published'::public.course_status) AND (published_at IS NOT NULL) AND (published_by IS NOT NULL)) OR (status <> 'published'::public.course_status))),
    CONSTRAINT courses_slug_format CHECK ((slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)),
    CONSTRAINT courses_title_length CHECK (((char_length(btrim(title)) >= 1) AND (char_length(btrim(title)) <= 200)))
);


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    course_id uuid NOT NULL,
    status public.enrollment_status DEFAULT 'active'::public.enrollment_status NOT NULL,
    access_starts_at timestamp with time zone DEFAULT now() NOT NULL,
    access_ends_at timestamp with time zone,
    granted_by uuid,
    grant_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT enrollments_access_window CHECK (((access_ends_at IS NULL) OR (access_ends_at > access_starts_at))),
    CONSTRAINT enrollments_grant_reason_length CHECK (((grant_reason IS NULL) OR (char_length(grant_reason) <= 1000)))
);


--
-- Name: guide_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guide_sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_item_id uuid NOT NULL,
    anchor text NOT NULL,
    heading text NOT NULL,
    heading_key text NOT NULL,
    node_path text NOT NULL,
    ordinal integer NOT NULL,
    level smallint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT guide_sections_anchor_format CHECK ((anchor ~ '^[a-z0-9]+(?:-[a-z0-9]+)*(?:--[a-f0-9]{8})?$'::text)),
    CONSTRAINT guide_sections_heading_length CHECK (((char_length(btrim(heading)) >= 1) AND (char_length(btrim(heading)) <= 300))),
    CONSTRAINT guide_sections_level_range CHECK (((level >= 1) AND (level <= 6))),
    CONSTRAINT guide_sections_ordinal_nonnegative CHECK ((ordinal >= 0))
);


--
-- Name: guide_term_manifests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guide_term_manifests (
    content_item_id uuid NOT NULL,
    content_version integer NOT NULL,
    dictionary_revision bigint NOT NULL,
    occurrences jsonb DEFAULT '[]'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT guide_term_manifests_content_version_positive CHECK ((content_version > 0)),
    CONSTRAINT guide_term_manifests_dictionary_revision_positive CHECK ((dictionary_revision > 0)),
    CONSTRAINT guide_term_manifests_occurrences_array CHECK ((jsonb_typeof(occurrences) = 'array'::text))
);


--
-- Name: guide_term_reindex_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guide_term_reindex_queue (
    content_item_id uuid NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    reason text DEFAULT 'content_changed'::text NOT NULL,
    attempt_count integer DEFAULT 0 NOT NULL,
    last_error text,
    CONSTRAINT guide_term_reindex_queue_attempt_nonnegative CHECK ((attempt_count >= 0)),
    CONSTRAINT guide_term_reindex_queue_reason_length CHECK (((char_length(reason) >= 1) AND (char_length(reason) <= 120)))
);


--
-- Name: guide_term_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guide_term_usage (
    content_item_id uuid NOT NULL,
    term_id uuid NOT NULL,
    occurrence_count integer NOT NULL,
    CONSTRAINT guide_term_usage_occurrence_count_positive CHECK ((occurrence_count > 0))
);


--
-- Name: interactive_term_aliases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interactive_term_aliases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    term_id uuid NOT NULL,
    alias text NOT NULL,
    normalized_alias text GENERATED ALWAYS AS (private.normalize_term_key(alias)) STORED,
    auto_match boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT interactive_term_aliases_alias_length CHECK (((char_length(btrim(alias)) >= 2) AND (char_length(btrim(alias)) <= 160))),
    CONSTRAINT interactive_term_aliases_normalized_present CHECK ((char_length(normalized_alias) >= 2))
);


--
-- Name: interactive_term_dictionary_state; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interactive_term_dictionary_state (
    singleton boolean DEFAULT true NOT NULL,
    revision bigint DEFAULT 1 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT interactive_term_dictionary_state_singleton_check CHECK (singleton)
);


--
-- Name: interactive_term_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interactive_term_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    term_id uuid NOT NULL,
    guide_id uuid NOT NULL,
    section_id uuid,
    priority integer DEFAULT 0 NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: interactive_terms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interactive_terms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    normalized_name text GENERATED ALWAYS AS (private.normalize_term_key(name)) STORED,
    short_definition text NOT NULL,
    category text,
    is_active boolean DEFAULT true NOT NULL,
    auto_match boolean DEFAULT true NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    occurrence_policy public.term_occurrence_policy DEFAULT 'first_per_section'::public.term_occurrence_policy NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT interactive_terms_category_length CHECK (((category IS NULL) OR ((char_length(btrim(category)) >= 1) AND (char_length(btrim(category)) <= 120)))),
    CONSTRAINT interactive_terms_definition_length CHECK (((char_length(btrim(short_definition)) >= 1) AND (char_length(btrim(short_definition)) <= 700))),
    CONSTRAINT interactive_terms_name_length CHECK (((char_length(btrim(name)) >= 2) AND (char_length(btrim(name)) <= 160))),
    CONSTRAINT interactive_terms_normalized_name_present CHECK ((char_length(normalized_name) >= 2)),
    CONSTRAINT interactive_terms_slug_format CHECK ((slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text))
);


--
-- Name: learning_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    client_attempt_id uuid NOT NULL,
    enrollment_id uuid,
    path_version_id uuid,
    step_id uuid,
    step_option_id uuid,
    purpose text NOT NULL,
    projection text NOT NULL,
    status text DEFAULT 'in_progress'::text NOT NULL,
    manifest_json jsonb NOT NULL,
    resume_json jsonb DEFAULT '{"currentIndex": 0, "ratedItemIds": [], "guidePosition": null, "observedRanges": [], "answeredItemIds": [], "revealedItemIds": [], "videoPositionSeconds": null}'::jsonb NOT NULL,
    score_json jsonb,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    submitted_at timestamp with time zone,
    row_version integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_attempts_context_complete CHECK ((((enrollment_id IS NULL) AND (path_version_id IS NULL) AND (step_id IS NULL) AND (step_option_id IS NULL)) OR ((enrollment_id IS NOT NULL) AND (path_version_id IS NOT NULL) AND (step_id IS NOT NULL) AND (step_option_id IS NOT NULL)))),
    CONSTRAINT learning_attempts_manifest_object CHECK ((jsonb_typeof(manifest_json) = 'object'::text)),
    CONSTRAINT learning_attempts_projection_check CHECK ((projection = ANY (ARRAY['video'::text, 'guide'::text, 'quiz'::text, 'flashcards'::text, 'review'::text]))),
    CONSTRAINT learning_attempts_projection_context_check CHECK ((((projection = 'review'::text) AND (enrollment_id IS NULL) AND (path_version_id IS NULL) AND (step_id IS NULL) AND (step_option_id IS NULL)) OR ((projection <> 'review'::text) AND (enrollment_id IS NOT NULL) AND (path_version_id IS NOT NULL) AND (step_id IS NOT NULL) AND (step_option_id IS NOT NULL)))),
    CONSTRAINT learning_attempts_purpose_check CHECK ((purpose = ANY (ARRAY['understand'::text, 'recall'::text, 'check'::text, 'integrate'::text, 'diagnostic'::text]))),
    CONSTRAINT learning_attempts_resume_object CHECK ((jsonb_typeof(resume_json) = 'object'::text)),
    CONSTRAINT learning_attempts_row_version_check CHECK ((row_version > 0)),
    CONSTRAINT learning_attempts_score_object CHECK (((score_json IS NULL) OR (jsonb_typeof(score_json) = 'object'::text))),
    CONSTRAINT learning_attempts_status_check CHECK ((status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'abandoned'::text]))),
    CONSTRAINT learning_attempts_submission_state CHECK ((((status = 'completed'::text) AND (submitted_at IS NOT NULL)) OR ((status <> 'completed'::text) AND (submitted_at IS NULL))))
);


--
-- Name: learning_enrollment_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_enrollment_versions (
    enrollment_id uuid NOT NULL,
    path_id uuid NOT NULL,
    path_version_id uuid NOT NULL,
    adopted_at timestamp with time zone DEFAULT now() NOT NULL,
    previous_version_id uuid,
    mapping_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT learning_enrollment_versions_mapping_object CHECK ((jsonb_typeof(mapping_json) = 'object'::text))
);


--
-- Name: learning_enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    path_id uuid NOT NULL,
    path_version_id uuid NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    paused_at timestamp with time zone,
    completed_at timestamp with time zone,
    last_activity_at timestamp with time zone DEFAULT now() NOT NULL,
    row_version integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_enrollments_row_version_check CHECK ((row_version > 0)),
    CONSTRAINT learning_enrollments_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'archived'::text])))
);


--
-- Name: learning_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    event_type text NOT NULL,
    semantic_key text NOT NULL,
    attempt_id uuid,
    enrollment_id uuid,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    local_date date DEFAULT ((now() AT TIME ZONE 'UTC'::text))::date NOT NULL,
    timezone text DEFAULT 'UTC'::text NOT NULL,
    payload_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    policy_version text DEFAULT 'guided-v1'::text NOT NULL,
    CONSTRAINT learning_events_key_length CHECK (((char_length(btrim(semantic_key)) >= 1) AND (char_length(btrim(semantic_key)) <= 300))),
    CONSTRAINT learning_events_payload_object CHECK ((jsonb_typeof(payload_json) = 'object'::text)),
    CONSTRAINT learning_events_type_length CHECK (((char_length(btrim(event_type)) >= 1) AND (char_length(btrim(event_type)) <= 80)))
);


--
-- Name: learning_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_items (
    id uuid NOT NULL,
    source_content_id uuid NOT NULL,
    item_kind text NOT NULL,
    memory_version integer DEFAULT 1 NOT NULL,
    retired_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_items_item_kind_check CHECK ((item_kind = ANY (ARRAY['question'::text, 'flashcard'::text]))),
    CONSTRAINT learning_items_memory_version_check CHECK ((memory_version > 0))
);


--
-- Name: learning_map_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_map_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    map_id uuid NOT NULL,
    node_id uuid NOT NULL,
    kind text NOT NULL,
    path_id uuid NOT NULL,
    unit_stable_key text,
    sort_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_map_entries_check CHECK ((((kind = 'block'::text) AND (unit_stable_key IS NULL)) OR ((kind = 'lesson'::text) AND (unit_stable_key IS NOT NULL) AND ((char_length(unit_stable_key) >= 1) AND (char_length(unit_stable_key) <= 120)) AND (unit_stable_key ~ '^[a-z0-9]+([-_][a-z0-9]+)*$'::text)))),
    CONSTRAINT learning_map_entries_kind_check CHECK ((kind = ANY (ARRAY['block'::text, 'lesson'::text]))),
    CONSTRAINT learning_map_entries_sort_order_check CHECK ((sort_order >= 0))
);


--
-- Name: learning_map_layouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_map_layouts (
    map_id uuid NOT NULL,
    level_key text NOT NULL,
    row_version integer DEFAULT 1 NOT NULL,
    schema_version integer DEFAULT 1 NOT NULL,
    positions_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_map_layouts_level_key_check CHECK ((level_key ~ '^(root|(node|block):[0-9a-f-]{36})$'::text)),
    CONSTRAINT learning_map_layouts_positions_json_check CHECK ((jsonb_typeof(positions_json) = 'object'::text)),
    CONSTRAINT learning_map_layouts_row_version_check CHECK ((row_version >= 1)),
    CONSTRAINT learning_map_layouts_schema_version_check CHECK ((schema_version = 1))
);


--
-- Name: learning_map_nodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_map_nodes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    map_id uuid NOT NULL,
    title text NOT NULL,
    icon_key text NOT NULL,
    origin_topic_id uuid,
    sort_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_map_nodes_icon_key_check CHECK ((icon_key = ANY (ARRAY['anatomy'::text, 'molecule'::text, 'heart'::text, 'tissue'::text, 'pill'::text, 'stethoscope'::text, 'head'::text, 'arm'::text, 'chest'::text, 'abdomen'::text, 'pelvis'::text, 'leg'::text, 'brain'::text, 'skin'::text, 'lungs'::text, 'vessel'::text, 'diaphragm'::text, 'kidney'::text, 'endocrine'::text, 'droplet'::text, 'folder'::text]))),
    CONSTRAINT learning_map_nodes_sort_order_check CHECK ((sort_order >= 0)),
    CONSTRAINT learning_map_nodes_title_check CHECK (((title = btrim(title)) AND ((char_length(title) >= 1) AND (char_length(title) <= 80))))
);


--
-- Name: learning_maps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_maps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    row_version integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_maps_row_version_check CHECK ((row_version >= 1))
);


--
-- Name: learning_mutation_receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_mutation_receipts (
    user_id uuid NOT NULL,
    idempotency_key uuid NOT NULL,
    request_hash character(64) NOT NULL,
    response_json jsonb,
    http_status integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '30 days'::interval) NOT NULL,
    replay_count integer DEFAULT 0 NOT NULL,
    last_replayed_at timestamp with time zone,
    CONSTRAINT learning_mutation_receipts_http_status CHECK (((http_status IS NULL) OR ((http_status >= 200) AND (http_status <= 599)))),
    CONSTRAINT learning_mutation_receipts_replay_count_check CHECK ((replay_count >= 0)),
    CONSTRAINT learning_mutation_receipts_replay_timestamp_check CHECK ((((replay_count = 0) AND (last_replayed_at IS NULL)) OR ((replay_count > 0) AND (last_replayed_at IS NOT NULL)))),
    CONSTRAINT learning_mutation_receipts_response_object CHECK (((response_json IS NULL) OR (jsonb_typeof(response_json) = 'object'::text)))
);


--
-- Name: learning_objective_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_objective_progress (
    enrollment_id uuid NOT NULL,
    path_version_id uuid NOT NULL,
    objective_id uuid NOT NULL,
    evidence_state text DEFAULT 'unassessed'::text NOT NULL,
    evidence_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    last_assessed_at timestamp with time zone,
    policy_version text DEFAULT 'evidence-v1'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_objective_progress_evidence_object CHECK ((jsonb_typeof(evidence_json) = 'object'::text)),
    CONSTRAINT learning_objective_progress_evidence_state_check CHECK ((evidence_state = ANY (ARRAY['unassessed'::text, 'practicing'::text, 'developing'::text, 'consolidated'::text]))),
    CONSTRAINT learning_objective_progress_policy_length CHECK (((char_length(btrim(policy_version)) >= 1) AND (char_length(btrim(policy_version)) <= 80)))
);


--
-- Name: learning_path_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_path_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    unit_id uuid NOT NULL,
    path_version_id uuid NOT NULL,
    stable_key text NOT NULL,
    pedagogy_version integer DEFAULT 1 NOT NULL,
    title text NOT NULL,
    "position" integer NOT NULL,
    is_essential boolean DEFAULT true NOT NULL,
    purpose text NOT NULL,
    objective_ids_json jsonb DEFAULT '[]'::jsonb NOT NULL,
    recommended_after_json jsonb DEFAULT '[]'::jsonb NOT NULL,
    CONSTRAINT learning_path_steps_objective_ids_array CHECK ((jsonb_typeof(objective_ids_json) = 'array'::text)),
    CONSTRAINT learning_path_steps_pedagogy_version_check CHECK ((pedagogy_version > 0)),
    CONSTRAINT learning_path_steps_position_check CHECK (("position" >= 0)),
    CONSTRAINT learning_path_steps_purpose_check CHECK ((purpose = ANY (ARRAY['understand'::text, 'recall'::text, 'check'::text, 'integrate'::text, 'diagnostic'::text]))),
    CONSTRAINT learning_path_steps_recommended_after_array CHECK ((jsonb_typeof(recommended_after_json) = 'array'::text)),
    CONSTRAINT learning_path_steps_stable_key_format CHECK ((stable_key ~ '^[a-z0-9]+(?:[-_][a-z0-9]+)*$'::text)),
    CONSTRAINT learning_path_steps_title_length CHECK (((char_length(btrim(title)) >= 1) AND (char_length(btrim(title)) <= 240)))
);


--
-- Name: learning_path_units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_path_units (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    path_version_id uuid NOT NULL,
    stable_key text NOT NULL,
    pedagogy_version integer DEFAULT 1 NOT NULL,
    title text NOT NULL,
    "position" integer NOT NULL,
    objectives_json jsonb DEFAULT '[]'::jsonb NOT NULL,
    CONSTRAINT learning_path_units_objectives_array CHECK ((jsonb_typeof(objectives_json) = 'array'::text)),
    CONSTRAINT learning_path_units_pedagogy_version_check CHECK ((pedagogy_version > 0)),
    CONSTRAINT learning_path_units_position_check CHECK (("position" >= 0)),
    CONSTRAINT learning_path_units_stable_key_format CHECK ((stable_key ~ '^[a-z0-9]+(?:[-_][a-z0-9]+)*$'::text)),
    CONSTRAINT learning_path_units_title_length CHECK (((char_length(btrim(title)) >= 1) AND (char_length(btrim(title)) <= 240)))
);


--
-- Name: learning_path_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_path_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    path_id uuid NOT NULL,
    version_number integer NOT NULL,
    status public.course_status DEFAULT 'draft'::public.course_status NOT NULL,
    edit_version integer DEFAULT 1 NOT NULL,
    policy_version text NOT NULL,
    policy_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    release_notes text DEFAULT ''::text NOT NULL,
    published_at timestamp with time zone,
    published_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    definition_v2_json jsonb,
    CONSTRAINT learning_path_versions_edit_version_check CHECK ((edit_version > 0)),
    CONSTRAINT learning_path_versions_policy_length CHECK (((char_length(btrim(policy_version)) >= 1) AND (char_length(btrim(policy_version)) <= 80))),
    CONSTRAINT learning_path_versions_policy_object CHECK ((jsonb_typeof(policy_json) = 'object'::text)),
    CONSTRAINT learning_path_versions_publication_fields CHECK ((((status = 'published'::public.course_status) AND (published_at IS NOT NULL) AND (published_by IS NOT NULL)) OR (status <> 'published'::public.course_status))),
    CONSTRAINT learning_path_versions_release_notes_length CHECK ((char_length(release_notes) <= 4000)),
    CONSTRAINT learning_path_versions_v2_definition_shape CHECK (
CASE
    WHEN (policy_version = 'guided-v2.0'::text) THEN ((definition_v2_json IS NOT NULL) AND (jsonb_typeof(definition_v2_json) = 'object'::text) AND ((definition_v2_json ->> 'schemaVersion'::text) = '2.0'::text))
    ELSE (definition_v2_json IS NULL)
END),
    CONSTRAINT learning_path_versions_version_number_check CHECK ((version_number > 0))
);


--
-- Name: learning_paths; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_paths (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    topic_content_id uuid NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    summary text NOT NULL,
    cover_asset_id uuid,
    cover_key text,
    created_by uuid NOT NULL,
    published_version_id uuid,
    archived_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_paths_cover_key_allowed CHECK (((cover_key IS NULL) OR (cover_key = ANY (ARRAY['back-muscles'::text, 'heart'::text, 'intestines'::text, 'lungs'::text, 'neck-muscles'::text, 'pelvis'::text, 'skull'::text, 'thigh'::text])))),
    CONSTRAINT learning_paths_cover_present CHECK (((((cover_asset_id IS NOT NULL))::integer + ((cover_key IS NOT NULL))::integer) = 1)),
    CONSTRAINT learning_paths_slug_format CHECK ((slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)),
    CONSTRAINT learning_paths_summary_length CHECK (((char_length(btrim(summary)) >= 1) AND (char_length(btrim(summary)) <= 2000))),
    CONSTRAINT learning_paths_title_length CHECK (((char_length(btrim(title)) >= 1) AND (char_length(btrim(title)) <= 200)))
);


--
-- Name: learning_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_preferences (
    user_id uuid NOT NULL,
    timezone text DEFAULT 'UTC'::text NOT NULL,
    session_minutes integer DEFAULT 10 NOT NULL,
    weekly_goal_days integer,
    pinned_enrollment_id uuid,
    exam_date date,
    pending_preferences_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    row_version integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_preferences_pending_object CHECK ((jsonb_typeof(pending_preferences_json) = 'object'::text)),
    CONSTRAINT learning_preferences_row_version_check CHECK ((row_version > 0)),
    CONSTRAINT learning_preferences_session_minutes_check CHECK ((session_minutes = ANY (ARRAY[5, 10, 20]))),
    CONSTRAINT learning_preferences_timezone_length CHECK (((char_length(btrim(timezone)) >= 1) AND (char_length(btrim(timezone)) <= 80))),
    CONSTRAINT learning_preferences_weekly_goal_days_check CHECK ((weekly_goal_days = ANY (ARRAY[2, 3, 5])))
);


--
-- Name: learning_resource_revisions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_resource_revisions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    resource_id uuid NOT NULL,
    revision_number integer NOT NULL,
    source_version integer NOT NULL,
    adapter_version integer NOT NULL,
    schema_version integer NOT NULL,
    payload_json jsonb NOT NULL,
    payload_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_resource_revisions_adapter_version_check CHECK ((adapter_version > 0)),
    CONSTRAINT learning_resource_revisions_payload_hash_check CHECK ((char_length(payload_hash) = 64)),
    CONSTRAINT learning_resource_revisions_payload_json_check CHECK ((jsonb_typeof(payload_json) = 'object'::text)),
    CONSTRAINT learning_resource_revisions_revision_number_check CHECK ((revision_number > 0)),
    CONSTRAINT learning_resource_revisions_schema_version_check CHECK ((schema_version > 0)),
    CONSTRAINT learning_resource_revisions_source_version_check CHECK ((source_version > 0))
);


--
-- Name: learning_resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_content_id uuid NOT NULL,
    projection text NOT NULL,
    adapter_key text NOT NULL,
    retired_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_resources_adapter_key_check CHECK (((char_length(btrim(adapter_key)) >= 1) AND (char_length(btrim(adapter_key)) <= 80))),
    CONSTRAINT learning_resources_projection_check CHECK ((projection = ANY (ARRAY['video'::text, 'guide'::text, 'quiz'::text, 'flashcards'::text])))
);


--
-- Name: learning_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    attempt_id uuid NOT NULL,
    item_id uuid NOT NULL,
    memory_version integer NOT NULL,
    round integer DEFAULT 1 NOT NULL,
    answer_json jsonb NOT NULL,
    grading_json jsonb NOT NULL,
    schedule_applied boolean DEFAULT false NOT NULL,
    answered_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_responses_answer_object CHECK ((jsonb_typeof(answer_json) = 'object'::text)),
    CONSTRAINT learning_responses_grading_object CHECK ((jsonb_typeof(grading_json) = 'object'::text)),
    CONSTRAINT learning_responses_memory_version_check CHECK ((memory_version > 0)),
    CONSTRAINT learning_responses_round_check CHECK (((round > 0) AND (round <= 10)))
);


--
-- Name: learning_review_states; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_review_states (
    user_id uuid NOT NULL,
    item_id uuid NOT NULL,
    memory_version integer NOT NULL,
    stage integer DEFAULT 0 NOT NULL,
    next_due_at timestamp with time zone NOT NULL,
    last_reviewed_at timestamp with time zone,
    lapses integer DEFAULT 0 NOT NULL,
    row_version integer DEFAULT 1 NOT NULL,
    policy_version text DEFAULT 'scheduler-v1'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_review_states_lapses_check CHECK ((lapses >= 0)),
    CONSTRAINT learning_review_states_memory_version_check CHECK ((memory_version > 0)),
    CONSTRAINT learning_review_states_policy_length CHECK (((char_length(btrim(policy_version)) >= 1) AND (char_length(btrim(policy_version)) <= 80))),
    CONSTRAINT learning_review_states_row_version_check CHECK ((row_version > 0)),
    CONSTRAINT learning_review_states_stage_check CHECK (((stage >= 0) AND (stage <= 4)))
);


--
-- Name: learning_rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    award_key text NOT NULL,
    reward_kind text NOT NULL,
    xp integer NOT NULL,
    event_id uuid NOT NULL,
    local_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_rewards_key_length CHECK (((char_length(btrim(award_key)) >= 1) AND (char_length(btrim(award_key)) <= 300))),
    CONSTRAINT learning_rewards_reward_kind_check CHECK ((reward_kind = ANY (ARRAY['activity_understand'::text, 'activity_recall'::text, 'activity_check'::text, 'review_applied'::text, 'unit_completed'::text, 'route_completed'::text, 'milestone_first_activity'::text, 'milestone_first_unit'::text, 'milestone_first_review'::text, 'v2_objective_recalled'::text, 'v2_objective_mastered'::text, 'v2_objective_consolidated'::text]))),
    CONSTRAINT learning_rewards_xp_check CHECK ((xp >= 0))
);


--
-- Name: learning_step_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_step_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    step_id uuid NOT NULL,
    path_version_id uuid NOT NULL,
    resource_revision_id uuid NOT NULL,
    source_content_id uuid NOT NULL,
    projection text NOT NULL,
    label text NOT NULL,
    "position" integer NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    estimated_minutes integer,
    config_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    completion_rule_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    reward_identity uuid NOT NULL,
    reward_version integer DEFAULT 1 NOT NULL,
    CONSTRAINT learning_step_options_completion_rule_object CHECK ((jsonb_typeof(completion_rule_json) = 'object'::text)),
    CONSTRAINT learning_step_options_config_object CHECK ((jsonb_typeof(config_json) = 'object'::text)),
    CONSTRAINT learning_step_options_estimated_minutes_check CHECK (((estimated_minutes IS NULL) OR (estimated_minutes > 0))),
    CONSTRAINT learning_step_options_label_length CHECK (((char_length(btrim(label)) >= 1) AND (char_length(btrim(label)) <= 120))),
    CONSTRAINT learning_step_options_position_check CHECK (("position" >= 0)),
    CONSTRAINT learning_step_options_projection_check CHECK ((projection = ANY (ARRAY['video'::text, 'guide'::text, 'quiz'::text, 'flashcards'::text]))),
    CONSTRAINT learning_step_options_reward_version_check CHECK ((reward_version > 0))
);


--
-- Name: learning_step_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_step_progress (
    enrollment_id uuid NOT NULL,
    step_id uuid NOT NULL,
    path_version_id uuid NOT NULL,
    state text DEFAULT 'not_started'::text NOT NULL,
    completion_method text,
    completed_at timestamp with time zone,
    evidence_attempt_id uuid,
    row_version integer DEFAULT 1 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_step_progress_completion_fields CHECK ((((state = 'completed'::text) AND (completed_at IS NOT NULL) AND (completion_method IS NOT NULL)) OR ((state <> 'completed'::text) AND (completed_at IS NULL) AND (completion_method IS NULL)))),
    CONSTRAINT learning_step_progress_completion_method_check CHECK ((completion_method = ANY (ARRAY['graded'::text, 'observed'::text, 'rated'::text, 'self_reported'::text]))),
    CONSTRAINT learning_step_progress_row_version_check CHECK ((row_version > 0)),
    CONSTRAINT learning_step_progress_state_check CHECK ((state = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text, 'skipped'::text])))
);


--
-- Name: learning_task_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_task_overrides (
    user_id uuid NOT NULL,
    task_key text NOT NULL,
    enrollment_id uuid,
    action text NOT NULL,
    snoozed_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_task_overrides_action_check CHECK ((action = ANY (ARRAY['snooze'::text, 'dismiss'::text, 'pin'::text]))),
    CONSTRAINT learning_task_overrides_key_length CHECK (((char_length(btrim(task_key)) >= 1) AND (char_length(btrim(task_key)) <= 300))),
    CONSTRAINT learning_task_overrides_snooze_fields CHECK ((((action = 'snooze'::text) AND (snoozed_until IS NOT NULL)) OR ((action <> 'snooze'::text) AND (snoozed_until IS NULL))))
);


--
-- Name: learning_v2_activity_state; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_v2_activity_state (
    enrollment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    path_version_id uuid NOT NULL,
    activity_key text NOT NULL,
    state text DEFAULT 'not_started'::text NOT NULL,
    dispensed_reason text,
    evidence_attempt_id uuid,
    row_version integer DEFAULT 1 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_v2_activity_state_dispensed CHECK ((((state = 'dispensed'::text) AND (dispensed_reason IS NOT NULL) AND (char_length(btrim(dispensed_reason)) > 0)) OR ((state <> 'dispensed'::text) AND (dispensed_reason IS NULL)))),
    CONSTRAINT learning_v2_activity_state_key CHECK ((activity_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)),
    CONSTRAINT learning_v2_activity_state_row_version_check CHECK ((row_version > 0)),
    CONSTRAINT learning_v2_activity_state_state_check CHECK ((state = ANY (ARRAY['not_started'::text, 'dispensed'::text, 'completed'::text])))
);


--
-- Name: learning_v2_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_v2_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    enrollment_id uuid NOT NULL,
    path_version_id uuid NOT NULL,
    client_attempt_id uuid NOT NULL,
    purpose text NOT NULL,
    snapshot_json jsonb NOT NULL,
    resume_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    outcome_json jsonb,
    status text DEFAULT 'in_progress'::text NOT NULL,
    row_version integer DEFAULT 1 NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    submitted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_v2_attempts_outcome_object CHECK (((outcome_json IS NULL) OR (jsonb_typeof(outcome_json) = 'object'::text))),
    CONSTRAINT learning_v2_attempts_purpose_check CHECK ((purpose = ANY (ARRAY['activity'::text, 'assessment'::text, 'review'::text]))),
    CONSTRAINT learning_v2_attempts_resume_object CHECK ((jsonb_typeof(resume_json) = 'object'::text)),
    CONSTRAINT learning_v2_attempts_row_version_check CHECK ((row_version > 0)),
    CONSTRAINT learning_v2_attempts_snapshot_object CHECK ((jsonb_typeof(snapshot_json) = 'object'::text)),
    CONSTRAINT learning_v2_attempts_status_check CHECK ((status = ANY (ARRAY['in_progress'::text, 'paused'::text, 'completed'::text, 'abandoned'::text]))),
    CONSTRAINT learning_v2_attempts_submission_state CHECK ((((status = 'completed'::text) AND (submitted_at IS NOT NULL)) OR ((status <> 'completed'::text) AND (submitted_at IS NULL))))
);


--
-- Name: learning_v2_bindings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_v2_bindings (
    path_version_id uuid NOT NULL,
    local_key text NOT NULL,
    kind text NOT NULL,
    topic_content_id uuid,
    source_content_id uuid,
    resource_revision_id uuid,
    asset_id uuid,
    document_sha256 text,
    asset_sha256 text,
    rights_status text,
    rights_credit text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_v2_bindings_kind CHECK ((kind = ANY (ARRAY['topic'::text, 'source'::text, 'asset'::text]))),
    CONSTRAINT learning_v2_bindings_local_key CHECK ((local_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)),
    CONSTRAINT learning_v2_bindings_shape CHECK ((((kind = 'topic'::text) AND (local_key = 'topic'::text) AND (topic_content_id IS NOT NULL) AND (source_content_id IS NULL) AND (resource_revision_id IS NULL) AND (asset_id IS NULL) AND (document_sha256 IS NULL) AND (asset_sha256 IS NULL) AND (rights_status IS NULL) AND (rights_credit IS NULL)) OR ((kind = 'source'::text) AND (topic_content_id IS NULL) AND (asset_id IS NULL) AND ((source_content_id IS NULL) = (resource_revision_id IS NULL)) AND (document_sha256 IS NOT NULL) AND (document_sha256 ~ '^[a-fA-F0-9]{64}$'::text) AND (asset_sha256 IS NULL) AND (rights_status IS NULL) AND (rights_credit IS NULL)) OR ((kind = 'asset'::text) AND (topic_content_id IS NULL) AND (source_content_id IS NULL) AND (resource_revision_id IS NULL) AND (document_sha256 IS NULL) AND (asset_id IS NOT NULL) AND ((asset_sha256 IS NULL) OR (asset_sha256 ~ '^[a-fA-F0-9]{64}$'::text)) AND (rights_status IS NOT NULL) AND (rights_status = ANY (ARRAY['owned'::text, 'licensed'::text, 'public_domain'::text, 'unverified'::text])) AND (rights_credit IS NOT NULL) AND (char_length(rights_credit) <= 1000) AND ((rights_status <> 'licensed'::text) OR (char_length(btrim(rights_credit)) > 0)))))
);


--
-- Name: learning_v2_imports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_v2_imports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_user_id uuid NOT NULL,
    idempotency_key uuid NOT NULL,
    package_key text NOT NULL,
    revision integer NOT NULL,
    content_hash character(64) NOT NULL,
    bindings_hash character(64) NOT NULL,
    normalized_json jsonb NOT NULL,
    bindings_json jsonb NOT NULL,
    issues_json jsonb DEFAULT '[]'::jsonb NOT NULL,
    target_path_id uuid,
    target_version_id uuid,
    expected_version integer,
    expires_at timestamp with time zone NOT NULL,
    state text DEFAULT 'validated'::text NOT NULL,
    committed_path_id uuid,
    committed_version_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_v2_imports_bindings_hash CHECK ((bindings_hash ~ '^[a-fA-F0-9]{64}$'::text)),
    CONSTRAINT learning_v2_imports_committed_context CHECK (((committed_version_id IS NULL) OR (committed_path_id IS NOT NULL))),
    CONSTRAINT learning_v2_imports_content_hash CHECK ((content_hash ~ '^[a-fA-F0-9]{64}$'::text)),
    CONSTRAINT learning_v2_imports_expected_version_check CHECK ((expected_version > 0)),
    CONSTRAINT learning_v2_imports_expiry CHECK ((expires_at > created_at)),
    CONSTRAINT learning_v2_imports_json_shape CHECK (((jsonb_typeof(normalized_json) = 'object'::text) AND (jsonb_typeof(bindings_json) = 'object'::text) AND (jsonb_typeof(issues_json) = 'array'::text))),
    CONSTRAINT learning_v2_imports_package_key CHECK ((package_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)),
    CONSTRAINT learning_v2_imports_revision_check CHECK ((revision > 0)),
    CONSTRAINT learning_v2_imports_state_check CHECK ((state = ANY (ARRAY['validated'::text, 'committed'::text, 'expired'::text]))),
    CONSTRAINT learning_v2_imports_target_context CHECK (((target_version_id IS NULL) OR (target_path_id IS NOT NULL)))
);


--
-- Name: learning_v2_objective_state; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_v2_objective_state (
    enrollment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    path_version_id uuid NOT NULL,
    objective_key text NOT NULL,
    evidence_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    error_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    first_mastered_at timestamp with time zone,
    first_consolidated_at timestamp with time zone,
    row_version integer DEFAULT 1 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_v2_objective_state_dates CHECK (((first_consolidated_at IS NULL) OR (first_mastered_at IS NOT NULL))),
    CONSTRAINT learning_v2_objective_state_error_object CHECK ((jsonb_typeof(error_json) = 'object'::text)),
    CONSTRAINT learning_v2_objective_state_evidence_object CHECK ((jsonb_typeof(evidence_json) = 'object'::text)),
    CONSTRAINT learning_v2_objective_state_key CHECK ((objective_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)),
    CONSTRAINT learning_v2_objective_state_row_version_check CHECK ((row_version > 0))
);


--
-- Name: learning_v2_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_v2_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    attempt_id uuid NOT NULL,
    user_id uuid NOT NULL,
    enrollment_id uuid NOT NULL,
    path_version_id uuid NOT NULL,
    activity_key text NOT NULL,
    objective_key text NOT NULL,
    equivalence_key text NOT NULL,
    item_revision_hash character(64) NOT NULL,
    modality text NOT NULL,
    purpose text NOT NULL,
    policy_version text DEFAULT 'guided-v2.0'::text NOT NULL,
    answer_json jsonb NOT NULL,
    grading_json jsonb NOT NULL,
    grading_source text NOT NULL,
    confidence text,
    assisted boolean DEFAULT false NOT NULL,
    novel_at_presentation boolean DEFAULT false NOT NULL,
    score01 double precision,
    accepted_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_v2_responses_activity_key CHECK ((activity_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)),
    CONSTRAINT learning_v2_responses_answer_object CHECK ((jsonb_typeof(answer_json) = 'object'::text)),
    CONSTRAINT learning_v2_responses_confidence_check CHECK ((confidence = ANY (ARRAY['sure'::text, 'unsure'::text, 'guessed'::text]))),
    CONSTRAINT learning_v2_responses_equivalence_key CHECK ((equivalence_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)),
    CONSTRAINT learning_v2_responses_grading_object CHECK ((jsonb_typeof(grading_json) = 'object'::text)),
    CONSTRAINT learning_v2_responses_grading_source_check CHECK ((grading_source = ANY (ARRAY['server'::text, 'self'::text, 'none'::text]))),
    CONSTRAINT learning_v2_responses_modality_check CHECK ((modality = ANY (ARRAY['text'::text, 'image'::text, 'table'::text, 'diagram'::text, 'case'::text, 'video'::text]))),
    CONSTRAINT learning_v2_responses_objective_key CHECK ((objective_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)),
    CONSTRAINT learning_v2_responses_policy_version_check CHECK ((policy_version = 'guided-v2.0'::text)),
    CONSTRAINT learning_v2_responses_purpose_check CHECK ((purpose = ANY (ARRAY['learning'::text, 'diagnostic'::text, 'gate'::text, 'final'::text, 'retention7'::text, 'retention30'::text, 'review'::text]))),
    CONSTRAINT learning_v2_responses_revision_hash CHECK ((item_revision_hash ~ '^[a-fA-F0-9]{64}$'::text)),
    CONSTRAINT learning_v2_responses_score01_check CHECK (((score01 >= (0)::double precision) AND (score01 <= (1)::double precision)))
);


--
-- Name: learning_v2_review_state; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_v2_review_state (
    user_id uuid NOT NULL,
    enrollment_id uuid NOT NULL,
    path_version_id uuid NOT NULL,
    objective_key text NOT NULL,
    stage integer DEFAULT 0 NOT NULL,
    lapses integer DEFAULT 0 NOT NULL,
    due_at timestamp with time zone NOT NULL,
    last_applied_response_id uuid,
    last_extended_at timestamp with time zone,
    retention7_due_at timestamp with time zone,
    retention7_accepted_at timestamp with time zone,
    retention30_due_at timestamp with time zone,
    retention30_accepted_at timestamp with time zone,
    row_version integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT learning_v2_review_state_key CHECK ((objective_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)),
    CONSTRAINT learning_v2_review_state_lapses_check CHECK ((lapses >= 0)),
    CONSTRAINT learning_v2_review_state_retention_dates CHECK ((((retention7_accepted_at IS NULL) OR (retention7_due_at IS NOT NULL)) AND ((retention30_accepted_at IS NULL) OR (retention30_due_at IS NOT NULL)))),
    CONSTRAINT learning_v2_review_state_row_version_check CHECK ((row_version > 0)),
    CONSTRAINT learning_v2_review_state_stage_check CHECK (((stage >= 0) AND (stage <= 4)))
);


--
-- Name: lesson_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_progress (
    user_id uuid NOT NULL,
    lesson_id uuid NOT NULL,
    status public.progress_status DEFAULT 'not_started'::public.progress_status NOT NULL,
    watched_seconds integer DEFAULT 0 NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT lesson_progress_completion_fields CHECK ((((status = 'completed'::public.progress_status) AND (completed_at IS NOT NULL)) OR (status <> 'completed'::public.progress_status))),
    CONSTRAINT lesson_progress_watched_seconds_positive CHECK ((watched_seconds >= 0))
);


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    kind public.lesson_kind NOT NULL,
    "position" integer NOT NULL,
    external_video_id text,
    duration_seconds integer,
    is_preview boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT lessons_description_length CHECK (((description IS NULL) OR (char_length(description) <= 4000))),
    CONSTRAINT lessons_duration_positive CHECK (((duration_seconds IS NULL) OR (duration_seconds >= 0))),
    CONSTRAINT lessons_position_positive CHECK (("position" > 0)),
    CONSTRAINT lessons_title_length CHECK (((char_length(btrim(title)) >= 1) AND (char_length(btrim(title)) <= 200))),
    CONSTRAINT lessons_video_reference CHECK ((((kind = 'video'::public.lesson_kind) AND (external_video_id IS NOT NULL)) OR ((kind <> 'video'::public.lesson_kind) AND (external_video_id IS NULL))))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    display_name text,
    university text,
    degree_program text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT profiles_degree_program_length CHECK (((degree_program IS NULL) OR ((char_length(btrim(degree_program)) >= 1) AND (char_length(btrim(degree_program)) <= 200)))),
    CONSTRAINT profiles_display_name_length CHECK (((display_name IS NULL) OR ((char_length(btrim(display_name)) >= 1) AND (char_length(btrim(display_name)) <= 160)))),
    CONSTRAINT profiles_email_length CHECK (((char_length(btrim(email)) >= 3) AND (char_length(btrim(email)) <= 320))),
    CONSTRAINT profiles_full_name_length CHECK (((char_length(btrim(full_name)) >= 1) AND (char_length(btrim(full_name)) <= 200))),
    CONSTRAINT profiles_university_length CHECK (((university IS NULL) OR ((char_length(btrim(university)) >= 1) AND (char_length(btrim(university)) <= 200))))
);


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT subjects_name_length CHECK (((char_length(btrim(name)) >= 1) AND (char_length(btrim(name)) <= 120))),
    CONSTRAINT subjects_slug_format CHECK ((slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text))
);


--
-- Name: user_recent_guides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_recent_guides (
    user_id uuid NOT NULL,
    content_item_id uuid NOT NULL,
    read_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role public.platform_role NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    assigned_by uuid
);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: auth_accounts auth_accounts_issuer_account_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_accounts
    ADD CONSTRAINT auth_accounts_issuer_account_id_key UNIQUE (issuer, account_id);


--
-- Name: auth_accounts auth_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_accounts
    ADD CONSTRAINT auth_accounts_pkey PRIMARY KEY (id);


--
-- Name: auth_rate_limits auth_rate_limits_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_rate_limits
    ADD CONSTRAINT auth_rate_limits_key_key UNIQUE (key);


--
-- Name: auth_rate_limits auth_rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_rate_limits
    ADD CONSTRAINT auth_rate_limits_pkey PRIMARY KEY (id);


--
-- Name: auth_sessions auth_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_pkey PRIMARY KEY (id);


--
-- Name: auth_sessions auth_sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_token_key UNIQUE (token);


--
-- Name: auth_users auth_users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_email_key UNIQUE (email);


--
-- Name: auth_users auth_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_pkey PRIMARY KEY (id);


--
-- Name: auth_verifications auth_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_verifications
    ADD CONSTRAINT auth_verifications_pkey PRIMARY KEY (id);


--
-- Name: cediah_schema_migration_exclusions cediah_schema_migration_exclusions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cediah_schema_migration_exclusions
    ADD CONSTRAINT cediah_schema_migration_exclusions_pkey PRIMARY KEY (file_name);


--
-- Name: cediah_schema_migrations cediah_schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cediah_schema_migrations
    ADD CONSTRAINT cediah_schema_migrations_pkey PRIMARY KEY (file_name);


--
-- Name: content_assets content_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_assets
    ADD CONSTRAINT content_assets_pkey PRIMARY KEY (id);


--
-- Name: content_assets content_assets_storage_path_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_assets
    ADD CONSTRAINT content_assets_storage_path_key UNIQUE (storage_path);


--
-- Name: content_items content_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT content_items_pkey PRIMARY KEY (id);


--
-- Name: content_items content_items_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT content_items_slug_key UNIQUE (slug);


--
-- Name: content_reaction_counts content_reaction_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_reaction_counts
    ADD CONSTRAINT content_reaction_counts_pkey PRIMARY KEY (content_item_id);


--
-- Name: content_reactions content_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_reactions
    ADD CONSTRAINT content_reactions_pkey PRIMARY KEY (content_item_id, viewer_key);


--
-- Name: content_subjects content_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_subjects
    ADD CONSTRAINT content_subjects_pkey PRIMARY KEY (content_item_id, subject_id);


--
-- Name: content_topic_item_order content_topic_item_order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_topic_item_order
    ADD CONSTRAINT content_topic_item_order_pkey PRIMARY KEY (subject_id, topic_key, content_item_id);


--
-- Name: content_topic_subjects content_topic_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_topic_subjects
    ADD CONSTRAINT content_topic_subjects_pkey PRIMARY KEY (topic_id, subject_id);


--
-- Name: content_topics content_topics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_topics
    ADD CONSTRAINT content_topics_pkey PRIMARY KEY (id);


--
-- Name: content_view_counts content_view_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_view_counts
    ADD CONSTRAINT content_view_counts_pkey PRIMARY KEY (content_item_id);


--
-- Name: content_view_receipts content_view_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_view_receipts
    ADD CONSTRAINT content_view_receipts_pkey PRIMARY KEY (content_item_id, viewer_key);


--
-- Name: course_modules course_modules_course_id_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_modules
    ADD CONSTRAINT course_modules_course_id_position_key UNIQUE (course_id, "position");


--
-- Name: course_modules course_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_modules
    ADD CONSTRAINT course_modules_pkey PRIMARY KEY (id);


--
-- Name: course_resources course_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_resources
    ADD CONSTRAINT course_resources_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: courses courses_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_slug_key UNIQUE (slug);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_user_id_course_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_user_id_course_id_key UNIQUE (user_id, course_id);


--
-- Name: guide_sections guide_sections_content_item_id_anchor_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_sections
    ADD CONSTRAINT guide_sections_content_item_id_anchor_key UNIQUE (content_item_id, anchor);


--
-- Name: guide_sections guide_sections_content_item_id_node_path_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_sections
    ADD CONSTRAINT guide_sections_content_item_id_node_path_key UNIQUE (content_item_id, node_path);


--
-- Name: guide_sections guide_sections_id_content_item_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_sections
    ADD CONSTRAINT guide_sections_id_content_item_id_key UNIQUE (id, content_item_id);


--
-- Name: guide_sections guide_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_sections
    ADD CONSTRAINT guide_sections_pkey PRIMARY KEY (id);


--
-- Name: guide_term_manifests guide_term_manifests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_term_manifests
    ADD CONSTRAINT guide_term_manifests_pkey PRIMARY KEY (content_item_id);


--
-- Name: guide_term_reindex_queue guide_term_reindex_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_term_reindex_queue
    ADD CONSTRAINT guide_term_reindex_queue_pkey PRIMARY KEY (content_item_id);


--
-- Name: guide_term_usage guide_term_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_term_usage
    ADD CONSTRAINT guide_term_usage_pkey PRIMARY KEY (content_item_id, term_id);


--
-- Name: interactive_term_aliases interactive_term_aliases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactive_term_aliases
    ADD CONSTRAINT interactive_term_aliases_pkey PRIMARY KEY (id);


--
-- Name: interactive_term_aliases interactive_term_aliases_term_id_normalized_alias_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactive_term_aliases
    ADD CONSTRAINT interactive_term_aliases_term_id_normalized_alias_key UNIQUE (term_id, normalized_alias);


--
-- Name: interactive_term_dictionary_state interactive_term_dictionary_state_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactive_term_dictionary_state
    ADD CONSTRAINT interactive_term_dictionary_state_pkey PRIMARY KEY (singleton);


--
-- Name: interactive_term_links interactive_term_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactive_term_links
    ADD CONSTRAINT interactive_term_links_pkey PRIMARY KEY (id);


--
-- Name: interactive_term_links interactive_term_links_term_id_guide_id_section_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactive_term_links
    ADD CONSTRAINT interactive_term_links_term_id_guide_id_section_id_key UNIQUE (term_id, guide_id, section_id);


--
-- Name: interactive_terms interactive_terms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactive_terms
    ADD CONSTRAINT interactive_terms_pkey PRIMARY KEY (id);


--
-- Name: interactive_terms interactive_terms_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactive_terms
    ADD CONSTRAINT interactive_terms_slug_key UNIQUE (slug);


--
-- Name: learning_attempts learning_attempts_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_attempts
    ADD CONSTRAINT learning_attempts_id_user_id_key UNIQUE (id, user_id);


--
-- Name: learning_attempts learning_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_attempts
    ADD CONSTRAINT learning_attempts_pkey PRIMARY KEY (id);


--
-- Name: learning_attempts learning_attempts_user_id_client_attempt_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_attempts
    ADD CONSTRAINT learning_attempts_user_id_client_attempt_id_key UNIQUE (user_id, client_attempt_id);


--
-- Name: learning_enrollment_versions learning_enrollment_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_enrollment_versions
    ADD CONSTRAINT learning_enrollment_versions_pkey PRIMARY KEY (enrollment_id, path_version_id);


--
-- Name: learning_enrollments learning_enrollments_id_path_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_enrollments
    ADD CONSTRAINT learning_enrollments_id_path_id_key UNIQUE (id, path_id);


--
-- Name: learning_enrollments learning_enrollments_id_user_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_enrollments
    ADD CONSTRAINT learning_enrollments_id_user_unique UNIQUE (id, user_id);


--
-- Name: learning_enrollments learning_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_enrollments
    ADD CONSTRAINT learning_enrollments_pkey PRIMARY KEY (id);


--
-- Name: learning_enrollments learning_enrollments_user_id_path_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_enrollments
    ADD CONSTRAINT learning_enrollments_user_id_path_id_key UNIQUE (user_id, path_id);


--
-- Name: learning_events learning_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_events
    ADD CONSTRAINT learning_events_pkey PRIMARY KEY (id);


--
-- Name: learning_events learning_events_user_id_semantic_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_events
    ADD CONSTRAINT learning_events_user_id_semantic_key_key UNIQUE (user_id, semantic_key);


--
-- Name: learning_items learning_items_id_source_content_id_memory_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_items
    ADD CONSTRAINT learning_items_id_source_content_id_memory_version_key UNIQUE (id, source_content_id, memory_version);


--
-- Name: learning_items learning_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_items
    ADD CONSTRAINT learning_items_pkey PRIMARY KEY (id);


--
-- Name: learning_map_entries learning_map_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_map_entries
    ADD CONSTRAINT learning_map_entries_pkey PRIMARY KEY (id);


--
-- Name: learning_map_layouts learning_map_layouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_map_layouts
    ADD CONSTRAINT learning_map_layouts_pkey PRIMARY KEY (map_id, level_key);


--
-- Name: learning_map_nodes learning_map_nodes_id_map_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_map_nodes
    ADD CONSTRAINT learning_map_nodes_id_map_id_key UNIQUE (id, map_id);


--
-- Name: learning_map_nodes learning_map_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_map_nodes
    ADD CONSTRAINT learning_map_nodes_pkey PRIMARY KEY (id);


--
-- Name: learning_maps learning_maps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_maps
    ADD CONSTRAINT learning_maps_pkey PRIMARY KEY (id);


--
-- Name: learning_maps learning_maps_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_maps
    ADD CONSTRAINT learning_maps_user_id_key UNIQUE (user_id);


--
-- Name: learning_mutation_receipts learning_mutation_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_mutation_receipts
    ADD CONSTRAINT learning_mutation_receipts_pkey PRIMARY KEY (user_id, idempotency_key);


--
-- Name: learning_objective_progress learning_objective_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_objective_progress
    ADD CONSTRAINT learning_objective_progress_pkey PRIMARY KEY (enrollment_id, path_version_id, objective_id);


--
-- Name: learning_path_steps learning_path_steps_id_path_version_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_path_steps
    ADD CONSTRAINT learning_path_steps_id_path_version_id_key UNIQUE (id, path_version_id);


--
-- Name: learning_path_steps learning_path_steps_path_version_id_stable_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_path_steps
    ADD CONSTRAINT learning_path_steps_path_version_id_stable_key_key UNIQUE (path_version_id, stable_key);


--
-- Name: learning_path_steps learning_path_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_path_steps
    ADD CONSTRAINT learning_path_steps_pkey PRIMARY KEY (id);


--
-- Name: learning_path_steps learning_path_steps_unit_id_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_path_steps
    ADD CONSTRAINT learning_path_steps_unit_id_position_key UNIQUE (unit_id, "position");


--
-- Name: learning_path_units learning_path_units_id_path_version_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_path_units
    ADD CONSTRAINT learning_path_units_id_path_version_id_key UNIQUE (id, path_version_id);


--
-- Name: learning_path_units learning_path_units_path_version_id_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_path_units
    ADD CONSTRAINT learning_path_units_path_version_id_position_key UNIQUE (path_version_id, "position");


--
-- Name: learning_path_units learning_path_units_path_version_id_stable_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_path_units
    ADD CONSTRAINT learning_path_units_path_version_id_stable_key_key UNIQUE (path_version_id, stable_key);


--
-- Name: learning_path_units learning_path_units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_path_units
    ADD CONSTRAINT learning_path_units_pkey PRIMARY KEY (id);


--
-- Name: learning_path_versions learning_path_versions_id_path_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_path_versions
    ADD CONSTRAINT learning_path_versions_id_path_id_key UNIQUE (id, path_id);


--
-- Name: learning_path_versions learning_path_versions_path_id_version_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_path_versions
    ADD CONSTRAINT learning_path_versions_path_id_version_number_key UNIQUE (path_id, version_number);


--
-- Name: learning_path_versions learning_path_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_path_versions
    ADD CONSTRAINT learning_path_versions_pkey PRIMARY KEY (id);


--
-- Name: learning_paths learning_paths_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_paths
    ADD CONSTRAINT learning_paths_pkey PRIMARY KEY (id);


--
-- Name: learning_paths learning_paths_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_paths
    ADD CONSTRAINT learning_paths_slug_key UNIQUE (slug);


--
-- Name: learning_preferences learning_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_preferences
    ADD CONSTRAINT learning_preferences_pkey PRIMARY KEY (user_id);


--
-- Name: learning_resource_revisions learning_resource_revisions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_resource_revisions
    ADD CONSTRAINT learning_resource_revisions_pkey PRIMARY KEY (id);


--
-- Name: learning_resource_revisions learning_resource_revisions_resource_id_revision_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_resource_revisions
    ADD CONSTRAINT learning_resource_revisions_resource_id_revision_number_key UNIQUE (resource_id, revision_number);


--
-- Name: learning_resource_revisions learning_resource_revisions_resource_id_source_version_adap_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_resource_revisions
    ADD CONSTRAINT learning_resource_revisions_resource_id_source_version_adap_key UNIQUE (resource_id, source_version, adapter_version, payload_hash);


--
-- Name: learning_resources learning_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_resources
    ADD CONSTRAINT learning_resources_pkey PRIMARY KEY (id);


--
-- Name: learning_resources learning_resources_source_content_id_projection_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_resources
    ADD CONSTRAINT learning_resources_source_content_id_projection_key UNIQUE (source_content_id, projection);


--
-- Name: learning_responses learning_responses_attempt_id_item_id_round_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_responses
    ADD CONSTRAINT learning_responses_attempt_id_item_id_round_key UNIQUE (attempt_id, item_id, round);


--
-- Name: learning_responses learning_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_responses
    ADD CONSTRAINT learning_responses_pkey PRIMARY KEY (id);


--
-- Name: learning_review_states learning_review_states_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_review_states
    ADD CONSTRAINT learning_review_states_pkey PRIMARY KEY (user_id, item_id, memory_version);


--
-- Name: learning_rewards learning_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_rewards
    ADD CONSTRAINT learning_rewards_pkey PRIMARY KEY (id);


--
-- Name: learning_rewards learning_rewards_user_id_award_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_rewards
    ADD CONSTRAINT learning_rewards_user_id_award_key_key UNIQUE (user_id, award_key);


--
-- Name: learning_step_options learning_step_options_id_path_version_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_step_options
    ADD CONSTRAINT learning_step_options_id_path_version_id_key UNIQUE (id, path_version_id);


--
-- Name: learning_step_options learning_step_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_step_options
    ADD CONSTRAINT learning_step_options_pkey PRIMARY KEY (id);


--
-- Name: learning_step_options learning_step_options_step_id_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_step_options
    ADD CONSTRAINT learning_step_options_step_id_position_key UNIQUE (step_id, "position");


--
-- Name: learning_step_progress learning_step_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_step_progress
    ADD CONSTRAINT learning_step_progress_pkey PRIMARY KEY (enrollment_id, step_id);


--
-- Name: learning_task_overrides learning_task_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_task_overrides
    ADD CONSTRAINT learning_task_overrides_pkey PRIMARY KEY (user_id, task_key);


--
-- Name: learning_v2_activity_state learning_v2_activity_state_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_activity_state
    ADD CONSTRAINT learning_v2_activity_state_pkey PRIMARY KEY (enrollment_id, path_version_id, activity_key);


--
-- Name: learning_v2_attempts learning_v2_attempts_id_user_id_enrollment_id_path_version__key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_attempts
    ADD CONSTRAINT learning_v2_attempts_id_user_id_enrollment_id_path_version__key UNIQUE (id, user_id, enrollment_id, path_version_id);


--
-- Name: learning_v2_attempts learning_v2_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_attempts
    ADD CONSTRAINT learning_v2_attempts_pkey PRIMARY KEY (id);


--
-- Name: learning_v2_attempts learning_v2_attempts_user_id_client_attempt_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_attempts
    ADD CONSTRAINT learning_v2_attempts_user_id_client_attempt_id_key UNIQUE (user_id, client_attempt_id);


--
-- Name: learning_v2_bindings learning_v2_bindings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_bindings
    ADD CONSTRAINT learning_v2_bindings_pkey PRIMARY KEY (path_version_id, local_key, kind);


--
-- Name: learning_v2_imports learning_v2_imports_actor_user_id_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_imports
    ADD CONSTRAINT learning_v2_imports_actor_user_id_idempotency_key_key UNIQUE (actor_user_id, idempotency_key);


--
-- Name: learning_v2_imports learning_v2_imports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_imports
    ADD CONSTRAINT learning_v2_imports_pkey PRIMARY KEY (id);


--
-- Name: learning_v2_objective_state learning_v2_objective_state_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_objective_state
    ADD CONSTRAINT learning_v2_objective_state_pkey PRIMARY KEY (enrollment_id, path_version_id, objective_key);


--
-- Name: learning_v2_responses learning_v2_responses_attempt_id_activity_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_responses
    ADD CONSTRAINT learning_v2_responses_attempt_id_activity_key_key UNIQUE (attempt_id, activity_key);


--
-- Name: learning_v2_responses learning_v2_responses_id_user_id_path_version_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_responses
    ADD CONSTRAINT learning_v2_responses_id_user_id_path_version_id_key UNIQUE (id, user_id, path_version_id);


--
-- Name: learning_v2_responses learning_v2_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_responses
    ADD CONSTRAINT learning_v2_responses_pkey PRIMARY KEY (id);


--
-- Name: learning_v2_review_state learning_v2_review_state_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_review_state
    ADD CONSTRAINT learning_v2_review_state_pkey PRIMARY KEY (user_id, path_version_id, objective_key);


--
-- Name: lesson_progress lesson_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_pkey PRIMARY KEY (user_id, lesson_id);


--
-- Name: lessons lessons_module_id_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_module_id_position_key UNIQUE (module_id, "position");


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_slug_key UNIQUE (slug);


--
-- Name: user_recent_guides user_recent_guides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_recent_guides
    ADD CONSTRAINT user_recent_guides_pkey PRIMARY KEY (user_id, content_item_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role);


--
-- Name: audit_log_actor_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_actor_user_id_index ON public.audit_log USING btree (actor_user_id);


--
-- Name: audit_log_target_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_target_index ON public.audit_log USING btree (target_type, target_id);


--
-- Name: auth_accounts_provider_account_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_accounts_provider_account_index ON public.auth_accounts USING btree (provider_id, account_id);


--
-- Name: auth_accounts_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_accounts_user_id_index ON public.auth_accounts USING btree (user_id);


--
-- Name: auth_sessions_expires_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_sessions_expires_at_index ON public.auth_sessions USING btree (expires_at);


--
-- Name: auth_sessions_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_sessions_user_id_index ON public.auth_sessions USING btree (user_id);


--
-- Name: auth_users_email_lower_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX auth_users_email_lower_unique ON public.auth_users USING btree (lower(email));


--
-- Name: auth_verifications_expires_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_verifications_expires_at_index ON public.auth_verifications USING btree (expires_at);


--
-- Name: auth_verifications_identifier_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_verifications_identifier_index ON public.auth_verifications USING btree (identifier);


--
-- Name: content_assets_content_item_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_assets_content_item_id_index ON public.content_assets USING btree (content_item_id);


--
-- Name: content_assets_owner_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_assets_owner_user_id_index ON public.content_assets USING btree (owner_user_id);


--
-- Name: content_items_author_updated_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_items_author_updated_at_index ON public.content_items USING btree (author_user_id, updated_at DESC);


--
-- Name: content_items_author_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_items_author_user_id_index ON public.content_items USING btree (author_user_id);


--
-- Name: content_items_editor_search_vector_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_items_editor_search_vector_index ON public.content_items USING gin (search_vector);


--
-- Name: content_items_kind_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_items_kind_status_index ON public.content_items USING btree (kind, status);


--
-- Name: content_items_published_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_items_published_by_index ON public.content_items USING btree (published_by);


--
-- Name: content_items_published_search_vector_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_items_published_search_vector_index ON public.content_items USING gin (search_vector) WHERE ((status = 'published'::public.course_status) AND (catalog_visibility = 'catalog'::public.catalog_visibility) AND (kind = ANY (ARRAY['guide'::public.content_kind, 'video'::public.content_kind])));


--
-- Name: content_items_reviewed_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_items_reviewed_by_index ON public.content_items USING btree (reviewed_by);


--
-- Name: content_items_status_published_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_items_status_published_at_index ON public.content_items USING btree (status, published_at DESC);


--
-- Name: content_items_topic_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_items_topic_status_index ON public.content_items USING btree (topic, status);


--
-- Name: content_items_updated_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_items_updated_at_index ON public.content_items USING btree (updated_at DESC);


--
-- Name: content_items_visibility_status_published_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_items_visibility_status_published_index ON public.content_items USING btree (catalog_visibility, status, published_at DESC);


--
-- Name: content_subjects_content_item_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_subjects_content_item_id_index ON public.content_subjects USING btree (content_item_id, subject_id);


--
-- Name: content_subjects_subject_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_subjects_subject_id_index ON public.content_subjects USING btree (subject_id, content_item_id);


--
-- Name: content_topic_item_order_content_item_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_topic_item_order_content_item_index ON public.content_topic_item_order USING btree (content_item_id);


--
-- Name: content_topic_item_order_position_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX content_topic_item_order_position_unique ON public.content_topic_item_order USING btree (subject_id, topic_key, "position");


--
-- Name: content_topic_subjects_subject_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_topic_subjects_subject_id_index ON public.content_topic_subjects USING btree (subject_id, topic_id);


--
-- Name: content_topic_subjects_topic_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_topic_subjects_topic_id_index ON public.content_topic_subjects USING btree (topic_id, subject_id);


--
-- Name: content_topics_name_lower_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX content_topics_name_lower_unique ON public.content_topics USING btree (lower(name));


--
-- Name: content_view_counts_rank_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_view_counts_rank_index ON public.content_view_counts USING btree (view_count DESC, content_item_id);


--
-- Name: course_modules_course_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX course_modules_course_id_index ON public.course_modules USING btree (course_id);


--
-- Name: course_resources_course_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX course_resources_course_id_index ON public.course_resources USING btree (course_id);


--
-- Name: course_resources_lesson_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX course_resources_lesson_id_index ON public.course_resources USING btree (lesson_id);


--
-- Name: courses_created_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX courses_created_by_index ON public.courses USING btree (created_by);


--
-- Name: courses_published_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX courses_published_by_index ON public.courses USING btree (published_by);


--
-- Name: courses_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX courses_status_index ON public.courses USING btree (status);


--
-- Name: enrollments_course_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX enrollments_course_id_index ON public.enrollments USING btree (course_id);


--
-- Name: enrollments_granted_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX enrollments_granted_by_index ON public.enrollments USING btree (granted_by);


--
-- Name: enrollments_user_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX enrollments_user_status_index ON public.enrollments USING btree (user_id, status);


--
-- Name: guide_sections_heading_key_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX guide_sections_heading_key_index ON public.guide_sections USING btree (content_item_id, heading_key);


--
-- Name: guide_term_reindex_queue_requested_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX guide_term_reindex_queue_requested_index ON public.guide_term_reindex_queue USING btree (requested_at);


--
-- Name: guide_term_usage_term_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX guide_term_usage_term_index ON public.guide_term_usage USING btree (term_id, content_item_id);


--
-- Name: interactive_term_aliases_auto_match_key_index; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX interactive_term_aliases_auto_match_key_index ON public.interactive_term_aliases USING btree (normalized_alias) WHERE (auto_match = true);


--
-- Name: interactive_term_links_guide_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX interactive_term_links_guide_id_index ON public.interactive_term_links USING btree (guide_id);


--
-- Name: interactive_term_links_primary_index; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX interactive_term_links_primary_index ON public.interactive_term_links USING btree (term_id) WHERE (is_primary = true);


--
-- Name: interactive_term_links_section_guide_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX interactive_term_links_section_guide_index ON public.interactive_term_links USING btree (section_id, guide_id) WHERE (section_id IS NOT NULL);


--
-- Name: interactive_term_links_term_priority_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX interactive_term_links_term_priority_index ON public.interactive_term_links USING btree (term_id, is_primary DESC, priority DESC);


--
-- Name: interactive_terms_normalized_name_index; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX interactive_terms_normalized_name_index ON public.interactive_terms USING btree (normalized_name);


--
-- Name: learning_attempts_enrollment_step_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_attempts_enrollment_step_index ON public.learning_attempts USING btree (enrollment_id, step_id, status, updated_at DESC);


--
-- Name: learning_attempts_enrollment_version_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_attempts_enrollment_version_fk_index ON public.learning_attempts USING btree (enrollment_id, path_version_id);


--
-- Name: learning_attempts_option_version_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_attempts_option_version_fk_index ON public.learning_attempts USING btree (step_option_id, path_version_id);


--
-- Name: learning_attempts_step_version_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_attempts_step_version_fk_index ON public.learning_attempts USING btree (step_id, path_version_id);


--
-- Name: learning_attempts_user_recent_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_attempts_user_recent_index ON public.learning_attempts USING btree (user_id, status, updated_at DESC);


--
-- Name: learning_enrollment_versions_enrollment_path_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_enrollment_versions_enrollment_path_fk_index ON public.learning_enrollment_versions USING btree (enrollment_id, path_id);


--
-- Name: learning_enrollment_versions_previous_path_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_enrollment_versions_previous_path_fk_index ON public.learning_enrollment_versions USING btree (previous_version_id, path_id);


--
-- Name: learning_enrollment_versions_version_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_enrollment_versions_version_index ON public.learning_enrollment_versions USING btree (path_version_id);


--
-- Name: learning_enrollment_versions_version_path_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_enrollment_versions_version_path_fk_index ON public.learning_enrollment_versions USING btree (path_version_id, path_id);


--
-- Name: learning_enrollments_user_activity_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_enrollments_user_activity_index ON public.learning_enrollments USING btree (user_id, status, last_activity_at DESC);


--
-- Name: learning_enrollments_version_path_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_enrollments_version_path_fk_index ON public.learning_enrollments USING btree (path_version_id, path_id);


--
-- Name: learning_events_attempt_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_events_attempt_fk_index ON public.learning_events USING btree (attempt_id);


--
-- Name: learning_events_enrollment_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_events_enrollment_fk_index ON public.learning_events USING btree (enrollment_id);


--
-- Name: learning_events_user_date_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_events_user_date_index ON public.learning_events USING btree (user_id, local_date DESC, occurred_at DESC);


--
-- Name: learning_items_source_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_items_source_index ON public.learning_items USING btree (source_content_id, item_kind);


--
-- Name: learning_map_entries_blocks_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX learning_map_entries_blocks_unique ON public.learning_map_entries USING btree (node_id, path_id) WHERE (kind = 'block'::text);


--
-- Name: learning_map_entries_lessons_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX learning_map_entries_lessons_unique ON public.learning_map_entries USING btree (node_id, path_id, unit_stable_key) WHERE (kind = 'lesson'::text);


--
-- Name: learning_map_entries_map_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_map_entries_map_index ON public.learning_map_entries USING btree (map_id);


--
-- Name: learning_map_entries_node_map_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_map_entries_node_map_index ON public.learning_map_entries USING btree (node_id, map_id);


--
-- Name: learning_map_entries_path_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_map_entries_path_index ON public.learning_map_entries USING btree (path_id);


--
-- Name: learning_map_nodes_map_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_map_nodes_map_index ON public.learning_map_nodes USING btree (map_id, sort_order);


--
-- Name: learning_map_nodes_topic_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_map_nodes_topic_index ON public.learning_map_nodes USING btree (origin_topic_id);


--
-- Name: learning_mutation_receipts_expiry_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_mutation_receipts_expiry_index ON public.learning_mutation_receipts USING btree (expires_at);


--
-- Name: learning_mutation_receipts_replay_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_mutation_receipts_replay_index ON public.learning_mutation_receipts USING btree (last_replayed_at DESC) WHERE (replay_count > 0);


--
-- Name: learning_objective_progress_enrollment_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_objective_progress_enrollment_index ON public.learning_objective_progress USING btree (enrollment_id, path_version_id, evidence_state);


--
-- Name: learning_path_steps_unit_position_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_path_steps_unit_position_index ON public.learning_path_steps USING btree (unit_id, "position");


--
-- Name: learning_path_steps_unit_version_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_path_steps_unit_version_fk_index ON public.learning_path_steps USING btree (unit_id, path_version_id);


--
-- Name: learning_path_versions_path_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_path_versions_path_status_index ON public.learning_path_versions USING btree (path_id, status, version_number DESC);


--
-- Name: learning_path_versions_publisher_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_path_versions_publisher_fk_index ON public.learning_path_versions USING btree (published_by);


--
-- Name: learning_paths_cover_asset_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_paths_cover_asset_fk_index ON public.learning_paths USING btree (cover_asset_id);


--
-- Name: learning_paths_creator_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_paths_creator_fk_index ON public.learning_paths USING btree (created_by);


--
-- Name: learning_paths_published_version_path_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_paths_published_version_path_fk_index ON public.learning_paths USING btree (published_version_id, id);


--
-- Name: learning_paths_topic_published_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_paths_topic_published_index ON public.learning_paths USING btree (topic_content_id, published_version_id, id);


--
-- Name: learning_preferences_pinned_enrollment_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_preferences_pinned_enrollment_fk_index ON public.learning_preferences USING btree (pinned_enrollment_id);


--
-- Name: learning_resource_revisions_resource_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_resource_revisions_resource_index ON public.learning_resource_revisions USING btree (resource_id, revision_number DESC);


--
-- Name: learning_resources_source_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_resources_source_index ON public.learning_resources USING btree (source_content_id, projection);


--
-- Name: learning_responses_attempt_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_responses_attempt_index ON public.learning_responses USING btree (attempt_id, answered_at, id);


--
-- Name: learning_responses_item_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_responses_item_index ON public.learning_responses USING btree (item_id, memory_version, answered_at DESC);


--
-- Name: learning_review_states_due_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_review_states_due_index ON public.learning_review_states USING btree (user_id, next_due_at, item_id, memory_version);


--
-- Name: learning_review_states_item_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_review_states_item_fk_index ON public.learning_review_states USING btree (item_id);


--
-- Name: learning_rewards_event_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_rewards_event_index ON public.learning_rewards USING btree (event_id);


--
-- Name: learning_rewards_user_date_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_rewards_user_date_index ON public.learning_rewards USING btree (user_id, local_date DESC, created_at DESC);


--
-- Name: learning_step_options_one_default_index; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX learning_step_options_one_default_index ON public.learning_step_options USING btree (step_id) WHERE is_default;


--
-- Name: learning_step_options_revision_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_step_options_revision_index ON public.learning_step_options USING btree (resource_revision_id);


--
-- Name: learning_step_options_source_content_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_step_options_source_content_fk_index ON public.learning_step_options USING btree (source_content_id);


--
-- Name: learning_step_options_step_version_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_step_options_step_version_fk_index ON public.learning_step_options USING btree (step_id, path_version_id);


--
-- Name: learning_step_progress_evidence_attempt_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_step_progress_evidence_attempt_fk_index ON public.learning_step_progress USING btree (evidence_attempt_id);


--
-- Name: learning_step_progress_step_version_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_step_progress_step_version_fk_index ON public.learning_step_progress USING btree (step_id, path_version_id);


--
-- Name: learning_step_progress_version_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_step_progress_version_index ON public.learning_step_progress USING btree (enrollment_id, path_version_id, state);


--
-- Name: learning_task_overrides_enrollment_fk_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_task_overrides_enrollment_fk_index ON public.learning_task_overrides USING btree (enrollment_id);


--
-- Name: learning_task_overrides_snooze_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_task_overrides_snooze_index ON public.learning_task_overrides USING btree (user_id, snoozed_until) WHERE (action = 'snooze'::text);


--
-- Name: learning_v2_activity_state_attempt_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_v2_activity_state_attempt_index ON public.learning_v2_activity_state USING btree (evidence_attempt_id) WHERE (evidence_attempt_id IS NOT NULL);


--
-- Name: learning_v2_activity_state_user_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_v2_activity_state_user_index ON public.learning_v2_activity_state USING btree (user_id, path_version_id, state);


--
-- Name: learning_v2_attempts_enrollment_version_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_v2_attempts_enrollment_version_index ON public.learning_v2_attempts USING btree (enrollment_id, path_version_id, status, updated_at DESC);


--
-- Name: learning_v2_attempts_user_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_v2_attempts_user_index ON public.learning_v2_attempts USING btree (user_id, status, updated_at DESC);


--
-- Name: learning_v2_bindings_asset_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_v2_bindings_asset_index ON public.learning_v2_bindings USING btree (asset_id) WHERE (asset_id IS NOT NULL);


--
-- Name: learning_v2_bindings_revision_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_v2_bindings_revision_index ON public.learning_v2_bindings USING btree (resource_revision_id) WHERE (resource_revision_id IS NOT NULL);


--
-- Name: learning_v2_bindings_source_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_v2_bindings_source_index ON public.learning_v2_bindings USING btree (source_content_id) WHERE (source_content_id IS NOT NULL);


--
-- Name: learning_v2_bindings_topic_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_v2_bindings_topic_index ON public.learning_v2_bindings USING btree (topic_content_id) WHERE (topic_content_id IS NOT NULL);


--
-- Name: learning_v2_imports_committed_path_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_v2_imports_committed_path_index ON public.learning_v2_imports USING btree (committed_path_id) WHERE (committed_path_id IS NOT NULL);


--
-- Name: learning_v2_imports_committed_version_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_v2_imports_committed_version_index ON public.learning_v2_imports USING btree (committed_version_id) WHERE (committed_version_id IS NOT NULL);


--
-- Name: learning_v2_imports_expiry_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_v2_imports_expiry_index ON public.learning_v2_imports USING btree (expires_at) WHERE (state = 'validated'::text);


--
-- Name: learning_v2_imports_target_path_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_v2_imports_target_path_index ON public.learning_v2_imports USING btree (target_path_id) WHERE (target_path_id IS NOT NULL);


--
-- Name: learning_v2_imports_target_version_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_v2_imports_target_version_index ON public.learning_v2_imports USING btree (target_version_id) WHERE (target_version_id IS NOT NULL);


--
-- Name: learning_v2_objective_state_user_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_v2_objective_state_user_index ON public.learning_v2_objective_state USING btree (user_id, path_version_id);


--
-- Name: learning_v2_responses_context_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_v2_responses_context_index ON public.learning_v2_responses USING btree (enrollment_id, path_version_id, accepted_at DESC);


--
-- Name: learning_v2_review_state_due_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_v2_review_state_due_index ON public.learning_v2_review_state USING btree (user_id, due_at, path_version_id, objective_key);


--
-- Name: learning_v2_review_state_enrollment_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_v2_review_state_enrollment_index ON public.learning_v2_review_state USING btree (enrollment_id, path_version_id);


--
-- Name: learning_v2_review_state_last_response_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX learning_v2_review_state_last_response_index ON public.learning_v2_review_state USING btree (last_applied_response_id) WHERE (last_applied_response_id IS NOT NULL);


--
-- Name: lesson_progress_lesson_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lesson_progress_lesson_id_index ON public.lesson_progress USING btree (lesson_id);


--
-- Name: lessons_module_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lessons_module_id_index ON public.lessons USING btree (module_id);


--
-- Name: profiles_email_lower_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX profiles_email_lower_unique ON public.profiles USING btree (lower(email));


--
-- Name: subjects_name_lower_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX subjects_name_lower_unique ON public.subjects USING btree (lower(name));


--
-- Name: user_recent_guides_latest_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_recent_guides_latest_index ON public.user_recent_guides USING btree (user_id, read_at DESC, content_item_id);


--
-- Name: user_roles_assigned_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_roles_assigned_by_index ON public.user_roles USING btree (assigned_by);


--
-- Name: user_roles_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_roles_user_id_index ON public.user_roles USING btree (user_id);


--
-- Name: auth_accounts auth_accounts_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER auth_accounts_set_updated_at BEFORE UPDATE ON public.auth_accounts FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: auth_sessions auth_sessions_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER auth_sessions_set_updated_at BEFORE UPDATE ON public.auth_sessions FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: auth_users auth_users_bootstrap_profile_and_role; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER auth_users_bootstrap_profile_and_role AFTER INSERT ON public.auth_users FOR EACH ROW EXECUTE FUNCTION private.bootstrap_new_user();


--
-- Name: auth_users auth_users_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER auth_users_set_updated_at BEFORE UPDATE ON public.auth_users FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: auth_verifications auth_verifications_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER auth_verifications_set_updated_at BEFORE UPDATE ON public.auth_verifications FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: content_items content_items_queue_interactive_term_reindex; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER content_items_queue_interactive_term_reindex AFTER INSERT OR UPDATE OF status, content ON public.content_items FOR EACH ROW EXECUTE FUNCTION private.queue_published_guide_term_reindex();


--
-- Name: content_items content_items_refresh_search_vector; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER content_items_refresh_search_vector BEFORE INSERT OR UPDATE OF kind, title, topic, summary, content ON public.content_items FOR EACH ROW EXECUTE FUNCTION public.cediah_refresh_content_search_vector();


--
-- Name: content_items content_items_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER content_items_set_updated_at BEFORE UPDATE ON public.content_items FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: course_modules course_modules_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER course_modules_set_updated_at BEFORE UPDATE ON public.course_modules FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: course_resources course_resources_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER course_resources_set_updated_at BEFORE UPDATE ON public.course_resources FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: courses courses_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER courses_set_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: enrollments enrollments_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enrollments_set_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: guide_sections guide_sections_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER guide_sections_set_updated_at BEFORE UPDATE ON public.guide_sections FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: interactive_term_aliases interactive_term_aliases_dictionary_revision; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER interactive_term_aliases_dictionary_revision AFTER INSERT OR DELETE OR UPDATE ON public.interactive_term_aliases FOR EACH STATEMENT EXECUTE FUNCTION private.bump_interactive_term_dictionary_revision();


--
-- Name: interactive_term_links interactive_term_links_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER interactive_term_links_set_updated_at BEFORE UPDATE ON public.interactive_term_links FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: interactive_terms interactive_terms_dictionary_insert_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER interactive_terms_dictionary_insert_delete AFTER INSERT OR DELETE ON public.interactive_terms FOR EACH STATEMENT EXECUTE FUNCTION private.bump_interactive_term_dictionary_revision();


--
-- Name: interactive_terms interactive_terms_dictionary_match_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER interactive_terms_dictionary_match_update AFTER UPDATE OF name, is_active, auto_match, priority, occurrence_policy ON public.interactive_terms FOR EACH STATEMENT EXECUTE FUNCTION private.bump_interactive_term_dictionary_revision();


--
-- Name: interactive_terms interactive_terms_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER interactive_terms_set_updated_at BEFORE UPDATE ON public.interactive_terms FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: learning_attempts learning_attempts_manifest_immutable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_attempts_manifest_immutable BEFORE UPDATE ON public.learning_attempts FOR EACH ROW EXECUTE FUNCTION private.prevent_learning_attempt_manifest_mutation();


--
-- Name: learning_attempts learning_attempts_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_attempts_set_updated_at BEFORE UPDATE ON public.learning_attempts FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: learning_enrollments learning_enrollments_active_version_adopted; Type: TRIGGER; Schema: public; Owner: -
--

CREATE CONSTRAINT TRIGGER learning_enrollments_active_version_adopted AFTER INSERT OR UPDATE OF path_version_id ON public.learning_enrollments DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION private.validate_active_learning_version_adopted();


--
-- Name: learning_enrollments learning_enrollments_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_enrollments_set_updated_at BEFORE UPDATE ON public.learning_enrollments FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: learning_items learning_items_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_items_set_updated_at BEFORE UPDATE ON public.learning_items FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: learning_path_steps learning_path_steps_published_immutable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_path_steps_published_immutable BEFORE DELETE OR UPDATE ON public.learning_path_steps FOR EACH ROW EXECUTE FUNCTION private.prevent_published_learning_definition_mutation();


--
-- Name: learning_path_units learning_path_units_published_immutable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_path_units_published_immutable BEFORE DELETE OR UPDATE ON public.learning_path_units FOR EACH ROW EXECUTE FUNCTION private.prevent_published_learning_definition_mutation();


--
-- Name: learning_path_versions learning_path_versions_published_immutable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_path_versions_published_immutable BEFORE DELETE OR UPDATE ON public.learning_path_versions FOR EACH ROW WHEN ((old.status = 'published'::public.course_status)) EXECUTE FUNCTION private.prevent_published_learning_definition_mutation();


--
-- Name: learning_path_versions learning_path_versions_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_path_versions_set_updated_at BEFORE UPDATE ON public.learning_path_versions FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: learning_path_versions learning_path_versions_v2_policy_guard; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_path_versions_v2_policy_guard BEFORE UPDATE OF policy_version ON public.learning_path_versions FOR EACH ROW EXECUTE FUNCTION private.prevent_learning_v2_policy_downgrade();


--
-- Name: learning_paths learning_paths_require_topic; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_paths_require_topic BEFORE INSERT OR UPDATE OF topic_content_id ON public.learning_paths FOR EACH ROW EXECUTE FUNCTION private.validate_learning_topic();


--
-- Name: learning_paths learning_paths_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_paths_set_updated_at BEFORE UPDATE ON public.learning_paths FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: learning_preferences learning_preferences_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_preferences_set_updated_at BEFORE UPDATE ON public.learning_preferences FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: learning_preferences learning_preferences_validate_enrollment; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_preferences_validate_enrollment BEFORE INSERT OR UPDATE ON public.learning_preferences FOR EACH ROW EXECUTE FUNCTION private.validate_learning_user_enrollment();


--
-- Name: learning_resource_revisions learning_resource_revisions_are_immutable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_resource_revisions_are_immutable BEFORE DELETE OR UPDATE ON public.learning_resource_revisions FOR EACH ROW EXECUTE FUNCTION private.prevent_learning_revision_mutation();


--
-- Name: learning_responses learning_responses_immutable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_responses_immutable BEFORE DELETE OR UPDATE ON public.learning_responses FOR EACH ROW EXECUTE FUNCTION private.prevent_learning_response_mutation();


--
-- Name: learning_review_states learning_review_states_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_review_states_set_updated_at BEFORE UPDATE ON public.learning_review_states FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: learning_step_options learning_step_options_published_immutable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_step_options_published_immutable BEFORE DELETE OR UPDATE ON public.learning_step_options FOR EACH ROW EXECUTE FUNCTION private.prevent_published_learning_definition_mutation();


--
-- Name: learning_step_progress learning_step_progress_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_step_progress_set_updated_at BEFORE UPDATE ON public.learning_step_progress FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: learning_task_overrides learning_task_overrides_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_task_overrides_set_updated_at BEFORE UPDATE ON public.learning_task_overrides FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: learning_task_overrides learning_task_overrides_validate_enrollment; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_task_overrides_validate_enrollment BEFORE INSERT OR UPDATE ON public.learning_task_overrides FOR EACH ROW EXECUTE FUNCTION private.validate_learning_user_enrollment();


--
-- Name: learning_v2_activity_state learning_v2_activity_state_require_version; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_v2_activity_state_require_version BEFORE INSERT OR UPDATE OF path_version_id ON public.learning_v2_activity_state FOR EACH ROW EXECUTE FUNCTION private.validate_learning_v2_runtime_version();


--
-- Name: learning_v2_attempts learning_v2_attempts_require_version; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_v2_attempts_require_version BEFORE INSERT OR UPDATE OF path_version_id ON public.learning_v2_attempts FOR EACH ROW EXECUTE FUNCTION private.validate_learning_v2_runtime_version();


--
-- Name: learning_v2_bindings learning_v2_bindings_validate; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_v2_bindings_validate BEFORE INSERT OR DELETE OR UPDATE ON public.learning_v2_bindings FOR EACH ROW EXECUTE FUNCTION private.validate_learning_v2_binding();


--
-- Name: learning_v2_objective_state learning_v2_objective_state_require_version; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_v2_objective_state_require_version BEFORE INSERT OR UPDATE OF path_version_id ON public.learning_v2_objective_state FOR EACH ROW EXECUTE FUNCTION private.validate_learning_v2_runtime_version();


--
-- Name: learning_v2_review_state learning_v2_review_state_require_version; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_v2_review_state_require_version BEFORE INSERT OR UPDATE OF path_version_id ON public.learning_v2_review_state FOR EACH ROW EXECUTE FUNCTION private.validate_learning_v2_runtime_version();


--
-- Name: lesson_progress lesson_progress_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER lesson_progress_set_updated_at BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: lessons lessons_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER lessons_set_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: profiles profiles_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();


--
-- Name: user_roles user_roles_prevent_last_administrator_removal; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER user_roles_prevent_last_administrator_removal BEFORE DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION private.prevent_last_administrator_removal();


--
-- Name: audit_log audit_log_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.auth_users(id) ON DELETE SET NULL;


--
-- Name: auth_accounts auth_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_accounts
    ADD CONSTRAINT auth_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: auth_sessions auth_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: content_assets content_assets_content_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_assets
    ADD CONSTRAINT content_assets_content_item_id_fkey FOREIGN KEY (content_item_id) REFERENCES public.content_items(id) ON DELETE CASCADE;


--
-- Name: content_assets content_assets_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_assets
    ADD CONSTRAINT content_assets_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.auth_users(id) ON DELETE RESTRICT;


--
-- Name: content_items content_items_author_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT content_items_author_user_id_fkey FOREIGN KEY (author_user_id) REFERENCES public.auth_users(id) ON DELETE RESTRICT;


--
-- Name: content_items content_items_published_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT content_items_published_by_fkey FOREIGN KEY (published_by) REFERENCES public.auth_users(id) ON DELETE SET NULL;


--
-- Name: content_items content_items_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT content_items_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.auth_users(id) ON DELETE SET NULL;


--
-- Name: content_reaction_counts content_reaction_counts_content_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_reaction_counts
    ADD CONSTRAINT content_reaction_counts_content_item_id_fkey FOREIGN KEY (content_item_id) REFERENCES public.content_items(id) ON DELETE CASCADE;


--
-- Name: content_reactions content_reactions_content_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_reactions
    ADD CONSTRAINT content_reactions_content_item_id_fkey FOREIGN KEY (content_item_id) REFERENCES public.content_items(id) ON DELETE CASCADE;


--
-- Name: content_subjects content_subjects_content_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_subjects
    ADD CONSTRAINT content_subjects_content_item_id_fkey FOREIGN KEY (content_item_id) REFERENCES public.content_items(id) ON DELETE CASCADE;


--
-- Name: content_subjects content_subjects_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_subjects
    ADD CONSTRAINT content_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: content_topic_item_order content_topic_item_order_content_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_topic_item_order
    ADD CONSTRAINT content_topic_item_order_content_item_id_fkey FOREIGN KEY (content_item_id) REFERENCES public.content_items(id) ON DELETE CASCADE;


--
-- Name: content_topic_item_order content_topic_item_order_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_topic_item_order
    ADD CONSTRAINT content_topic_item_order_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: content_topic_subjects content_topic_subjects_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_topic_subjects
    ADD CONSTRAINT content_topic_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: content_topic_subjects content_topic_subjects_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_topic_subjects
    ADD CONSTRAINT content_topic_subjects_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.content_topics(id) ON DELETE CASCADE;


--
-- Name: content_view_counts content_view_counts_content_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_view_counts
    ADD CONSTRAINT content_view_counts_content_item_id_fkey FOREIGN KEY (content_item_id) REFERENCES public.content_items(id) ON DELETE CASCADE;


--
-- Name: content_view_receipts content_view_receipts_content_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_view_receipts
    ADD CONSTRAINT content_view_receipts_content_item_id_fkey FOREIGN KEY (content_item_id) REFERENCES public.content_items(id) ON DELETE CASCADE;


--
-- Name: course_modules course_modules_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_modules
    ADD CONSTRAINT course_modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_resources course_resources_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_resources
    ADD CONSTRAINT course_resources_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_resources course_resources_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_resources
    ADD CONSTRAINT course_resources_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL;


--
-- Name: courses courses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.auth_users(id) ON DELETE RESTRICT;


--
-- Name: courses courses_published_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_published_by_fkey FOREIGN KEY (published_by) REFERENCES public.auth_users(id) ON DELETE SET NULL;


--
-- Name: enrollments enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: enrollments enrollments_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.auth_users(id) ON DELETE SET NULL;


--
-- Name: enrollments enrollments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: guide_sections guide_sections_content_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_sections
    ADD CONSTRAINT guide_sections_content_item_id_fkey FOREIGN KEY (content_item_id) REFERENCES public.content_items(id) ON DELETE CASCADE;


--
-- Name: guide_term_manifests guide_term_manifests_content_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_term_manifests
    ADD CONSTRAINT guide_term_manifests_content_item_id_fkey FOREIGN KEY (content_item_id) REFERENCES public.content_items(id) ON DELETE CASCADE;


--
-- Name: guide_term_reindex_queue guide_term_reindex_queue_content_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_term_reindex_queue
    ADD CONSTRAINT guide_term_reindex_queue_content_item_id_fkey FOREIGN KEY (content_item_id) REFERENCES public.content_items(id) ON DELETE CASCADE;


--
-- Name: guide_term_usage guide_term_usage_content_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_term_usage
    ADD CONSTRAINT guide_term_usage_content_item_id_fkey FOREIGN KEY (content_item_id) REFERENCES public.content_items(id) ON DELETE CASCADE;


--
-- Name: guide_term_usage guide_term_usage_term_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guide_term_usage
    ADD CONSTRAINT guide_term_usage_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.interactive_terms(id) ON DELETE CASCADE;


--
-- Name: interactive_term_aliases interactive_term_aliases_term_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactive_term_aliases
    ADD CONSTRAINT interactive_term_aliases_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.interactive_terms(id) ON DELETE CASCADE;


--
-- Name: interactive_term_links interactive_term_links_guide_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactive_term_links
    ADD CONSTRAINT interactive_term_links_guide_id_fkey FOREIGN KEY (guide_id) REFERENCES public.content_items(id) ON DELETE CASCADE;


--
-- Name: interactive_term_links interactive_term_links_section_guide_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactive_term_links
    ADD CONSTRAINT interactive_term_links_section_guide_fk FOREIGN KEY (section_id, guide_id) REFERENCES public.guide_sections(id, content_item_id) ON DELETE SET NULL (section_id);


--
-- Name: interactive_term_links interactive_term_links_term_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactive_term_links
    ADD CONSTRAINT interactive_term_links_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.interactive_terms(id) ON DELETE CASCADE;


--
-- Name: learning_attempts learning_attempts_enrollment_id_path_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_attempts
    ADD CONSTRAINT learning_attempts_enrollment_id_path_version_id_fkey FOREIGN KEY (enrollment_id, path_version_id) REFERENCES public.learning_enrollment_versions(enrollment_id, path_version_id) ON DELETE CASCADE;


--
-- Name: learning_attempts learning_attempts_step_id_path_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_attempts
    ADD CONSTRAINT learning_attempts_step_id_path_version_id_fkey FOREIGN KEY (step_id, path_version_id) REFERENCES public.learning_path_steps(id, path_version_id) ON DELETE RESTRICT;


--
-- Name: learning_attempts learning_attempts_step_option_id_path_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_attempts
    ADD CONSTRAINT learning_attempts_step_option_id_path_version_id_fkey FOREIGN KEY (step_option_id, path_version_id) REFERENCES public.learning_step_options(id, path_version_id) ON DELETE RESTRICT;


--
-- Name: learning_attempts learning_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_attempts
    ADD CONSTRAINT learning_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: learning_enrollment_versions learning_enrollment_versions_enrollment_id_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_enrollment_versions
    ADD CONSTRAINT learning_enrollment_versions_enrollment_id_path_id_fkey FOREIGN KEY (enrollment_id, path_id) REFERENCES public.learning_enrollments(id, path_id) ON DELETE CASCADE;


--
-- Name: learning_enrollment_versions learning_enrollment_versions_path_version_id_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_enrollment_versions
    ADD CONSTRAINT learning_enrollment_versions_path_version_id_path_id_fkey FOREIGN KEY (path_version_id, path_id) REFERENCES public.learning_path_versions(id, path_id) ON DELETE RESTRICT;


--
-- Name: learning_enrollment_versions learning_enrollment_versions_previous_version_id_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_enrollment_versions
    ADD CONSTRAINT learning_enrollment_versions_previous_version_id_path_id_fkey FOREIGN KEY (previous_version_id, path_id) REFERENCES public.learning_path_versions(id, path_id) ON DELETE RESTRICT;


--
-- Name: learning_enrollments learning_enrollments_path_version_id_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_enrollments
    ADD CONSTRAINT learning_enrollments_path_version_id_path_id_fkey FOREIGN KEY (path_version_id, path_id) REFERENCES public.learning_path_versions(id, path_id) ON DELETE RESTRICT;


--
-- Name: learning_enrollments learning_enrollments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_enrollments
    ADD CONSTRAINT learning_enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: learning_events learning_events_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_events
    ADD CONSTRAINT learning_events_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.learning_attempts(id) ON DELETE CASCADE;


--
-- Name: learning_events learning_events_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_events
    ADD CONSTRAINT learning_events_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.learning_enrollments(id) ON DELETE CASCADE;


--
-- Name: learning_events learning_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_events
    ADD CONSTRAINT learning_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: learning_items learning_items_source_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_items
    ADD CONSTRAINT learning_items_source_content_id_fkey FOREIGN KEY (source_content_id) REFERENCES public.content_items(id) ON DELETE RESTRICT;


--
-- Name: learning_map_entries learning_map_entries_map_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_map_entries
    ADD CONSTRAINT learning_map_entries_map_id_fkey FOREIGN KEY (map_id) REFERENCES public.learning_maps(id) ON DELETE CASCADE;


--
-- Name: learning_map_entries learning_map_entries_node_id_map_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_map_entries
    ADD CONSTRAINT learning_map_entries_node_id_map_id_fkey FOREIGN KEY (node_id, map_id) REFERENCES public.learning_map_nodes(id, map_id) ON DELETE CASCADE;


--
-- Name: learning_map_entries learning_map_entries_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_map_entries
    ADD CONSTRAINT learning_map_entries_path_id_fkey FOREIGN KEY (path_id) REFERENCES public.learning_paths(id);


--
-- Name: learning_map_layouts learning_map_layouts_map_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_map_layouts
    ADD CONSTRAINT learning_map_layouts_map_id_fkey FOREIGN KEY (map_id) REFERENCES public.learning_maps(id) ON DELETE CASCADE;


--
-- Name: learning_map_nodes learning_map_nodes_map_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_map_nodes
    ADD CONSTRAINT learning_map_nodes_map_id_fkey FOREIGN KEY (map_id) REFERENCES public.learning_maps(id) ON DELETE CASCADE;


--
-- Name: learning_map_nodes learning_map_nodes_origin_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_map_nodes
    ADD CONSTRAINT learning_map_nodes_origin_topic_id_fkey FOREIGN KEY (origin_topic_id) REFERENCES public.content_items(id);


--
-- Name: learning_maps learning_maps_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_maps
    ADD CONSTRAINT learning_maps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: learning_mutation_receipts learning_mutation_receipts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_mutation_receipts
    ADD CONSTRAINT learning_mutation_receipts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: learning_objective_progress learning_objective_progress_enrollment_id_path_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_objective_progress
    ADD CONSTRAINT learning_objective_progress_enrollment_id_path_version_id_fkey FOREIGN KEY (enrollment_id, path_version_id) REFERENCES public.learning_enrollment_versions(enrollment_id, path_version_id) ON DELETE CASCADE;


--
-- Name: learning_path_steps learning_path_steps_unit_id_path_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_path_steps
    ADD CONSTRAINT learning_path_steps_unit_id_path_version_id_fkey FOREIGN KEY (unit_id, path_version_id) REFERENCES public.learning_path_units(id, path_version_id) ON DELETE CASCADE;


--
-- Name: learning_path_units learning_path_units_path_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_path_units
    ADD CONSTRAINT learning_path_units_path_version_id_fkey FOREIGN KEY (path_version_id) REFERENCES public.learning_path_versions(id) ON DELETE CASCADE;


--
-- Name: learning_path_versions learning_path_versions_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_path_versions
    ADD CONSTRAINT learning_path_versions_path_id_fkey FOREIGN KEY (path_id) REFERENCES public.learning_paths(id) ON DELETE RESTRICT;


--
-- Name: learning_path_versions learning_path_versions_published_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_path_versions
    ADD CONSTRAINT learning_path_versions_published_by_fkey FOREIGN KEY (published_by) REFERENCES public.auth_users(id) ON DELETE SET NULL;


--
-- Name: learning_paths learning_paths_cover_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_paths
    ADD CONSTRAINT learning_paths_cover_asset_id_fkey FOREIGN KEY (cover_asset_id) REFERENCES public.content_assets(id) ON DELETE RESTRICT;


--
-- Name: learning_paths learning_paths_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_paths
    ADD CONSTRAINT learning_paths_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.auth_users(id) ON DELETE RESTRICT;


--
-- Name: learning_paths learning_paths_published_version_belongs_to_path; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_paths
    ADD CONSTRAINT learning_paths_published_version_belongs_to_path FOREIGN KEY (published_version_id, id) REFERENCES public.learning_path_versions(id, path_id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: learning_paths learning_paths_topic_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_paths
    ADD CONSTRAINT learning_paths_topic_content_id_fkey FOREIGN KEY (topic_content_id) REFERENCES public.content_items(id) ON DELETE RESTRICT;


--
-- Name: learning_preferences learning_preferences_pinned_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_preferences
    ADD CONSTRAINT learning_preferences_pinned_enrollment_id_fkey FOREIGN KEY (pinned_enrollment_id) REFERENCES public.learning_enrollments(id) ON DELETE SET NULL;


--
-- Name: learning_preferences learning_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_preferences
    ADD CONSTRAINT learning_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: learning_resource_revisions learning_resource_revisions_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_resource_revisions
    ADD CONSTRAINT learning_resource_revisions_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.learning_resources(id) ON DELETE RESTRICT;


--
-- Name: learning_resources learning_resources_source_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_resources
    ADD CONSTRAINT learning_resources_source_content_id_fkey FOREIGN KEY (source_content_id) REFERENCES public.content_items(id) ON DELETE RESTRICT;


--
-- Name: learning_responses learning_responses_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_responses
    ADD CONSTRAINT learning_responses_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.learning_attempts(id) ON DELETE CASCADE;


--
-- Name: learning_responses learning_responses_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_responses
    ADD CONSTRAINT learning_responses_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.learning_items(id) ON DELETE RESTRICT;


--
-- Name: learning_review_states learning_review_states_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_review_states
    ADD CONSTRAINT learning_review_states_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.learning_items(id) ON DELETE RESTRICT;


--
-- Name: learning_review_states learning_review_states_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_review_states
    ADD CONSTRAINT learning_review_states_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: learning_rewards learning_rewards_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_rewards
    ADD CONSTRAINT learning_rewards_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.learning_events(id) ON DELETE CASCADE;


--
-- Name: learning_rewards learning_rewards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_rewards
    ADD CONSTRAINT learning_rewards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: learning_step_options learning_step_options_resource_revision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_step_options
    ADD CONSTRAINT learning_step_options_resource_revision_id_fkey FOREIGN KEY (resource_revision_id) REFERENCES public.learning_resource_revisions(id) ON DELETE RESTRICT;


--
-- Name: learning_step_options learning_step_options_source_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_step_options
    ADD CONSTRAINT learning_step_options_source_content_id_fkey FOREIGN KEY (source_content_id) REFERENCES public.content_items(id) ON DELETE RESTRICT;


--
-- Name: learning_step_options learning_step_options_step_id_path_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_step_options
    ADD CONSTRAINT learning_step_options_step_id_path_version_id_fkey FOREIGN KEY (step_id, path_version_id) REFERENCES public.learning_path_steps(id, path_version_id) ON DELETE CASCADE;


--
-- Name: learning_step_progress learning_step_progress_enrollment_id_path_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_step_progress
    ADD CONSTRAINT learning_step_progress_enrollment_id_path_version_id_fkey FOREIGN KEY (enrollment_id, path_version_id) REFERENCES public.learning_enrollment_versions(enrollment_id, path_version_id) ON DELETE CASCADE;


--
-- Name: learning_step_progress learning_step_progress_evidence_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_step_progress
    ADD CONSTRAINT learning_step_progress_evidence_attempt_id_fkey FOREIGN KEY (evidence_attempt_id) REFERENCES public.learning_attempts(id) ON DELETE SET NULL;


--
-- Name: learning_step_progress learning_step_progress_step_id_path_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_step_progress
    ADD CONSTRAINT learning_step_progress_step_id_path_version_id_fkey FOREIGN KEY (step_id, path_version_id) REFERENCES public.learning_path_steps(id, path_version_id) ON DELETE RESTRICT;


--
-- Name: learning_task_overrides learning_task_overrides_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_task_overrides
    ADD CONSTRAINT learning_task_overrides_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.learning_enrollments(id) ON DELETE CASCADE;


--
-- Name: learning_task_overrides learning_task_overrides_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_task_overrides
    ADD CONSTRAINT learning_task_overrides_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: learning_v2_activity_state learning_v2_activity_state_enrollment_id_path_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_activity_state
    ADD CONSTRAINT learning_v2_activity_state_enrollment_id_path_version_id_fkey FOREIGN KEY (enrollment_id, path_version_id) REFERENCES public.learning_enrollment_versions(enrollment_id, path_version_id) ON DELETE CASCADE;


--
-- Name: learning_v2_activity_state learning_v2_activity_state_enrollment_id_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_activity_state
    ADD CONSTRAINT learning_v2_activity_state_enrollment_id_user_id_fkey FOREIGN KEY (enrollment_id, user_id) REFERENCES public.learning_enrollments(id, user_id) ON DELETE CASCADE;


--
-- Name: learning_v2_activity_state learning_v2_activity_state_evidence_attempt_id_user_id_enr_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_activity_state
    ADD CONSTRAINT learning_v2_activity_state_evidence_attempt_id_user_id_enr_fkey FOREIGN KEY (evidence_attempt_id, user_id, enrollment_id, path_version_id) REFERENCES public.learning_v2_attempts(id, user_id, enrollment_id, path_version_id) ON DELETE SET NULL (evidence_attempt_id);


--
-- Name: learning_v2_attempts learning_v2_attempts_enrollment_id_path_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_attempts
    ADD CONSTRAINT learning_v2_attempts_enrollment_id_path_version_id_fkey FOREIGN KEY (enrollment_id, path_version_id) REFERENCES public.learning_enrollment_versions(enrollment_id, path_version_id) ON DELETE CASCADE;


--
-- Name: learning_v2_attempts learning_v2_attempts_enrollment_id_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_attempts
    ADD CONSTRAINT learning_v2_attempts_enrollment_id_user_id_fkey FOREIGN KEY (enrollment_id, user_id) REFERENCES public.learning_enrollments(id, user_id) ON DELETE CASCADE;


--
-- Name: learning_v2_attempts learning_v2_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_attempts
    ADD CONSTRAINT learning_v2_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: learning_v2_bindings learning_v2_bindings_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_bindings
    ADD CONSTRAINT learning_v2_bindings_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.content_assets(id) ON DELETE RESTRICT;


--
-- Name: learning_v2_bindings learning_v2_bindings_path_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_bindings
    ADD CONSTRAINT learning_v2_bindings_path_version_id_fkey FOREIGN KEY (path_version_id) REFERENCES public.learning_path_versions(id) ON DELETE CASCADE;


--
-- Name: learning_v2_bindings learning_v2_bindings_resource_revision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_bindings
    ADD CONSTRAINT learning_v2_bindings_resource_revision_id_fkey FOREIGN KEY (resource_revision_id) REFERENCES public.learning_resource_revisions(id) ON DELETE RESTRICT;


--
-- Name: learning_v2_bindings learning_v2_bindings_source_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_bindings
    ADD CONSTRAINT learning_v2_bindings_source_content_id_fkey FOREIGN KEY (source_content_id) REFERENCES public.content_items(id) ON DELETE RESTRICT;


--
-- Name: learning_v2_bindings learning_v2_bindings_topic_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_bindings
    ADD CONSTRAINT learning_v2_bindings_topic_content_id_fkey FOREIGN KEY (topic_content_id) REFERENCES public.content_items(id) ON DELETE RESTRICT;


--
-- Name: learning_v2_imports learning_v2_imports_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_imports
    ADD CONSTRAINT learning_v2_imports_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: learning_v2_imports learning_v2_imports_committed_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_imports
    ADD CONSTRAINT learning_v2_imports_committed_path_id_fkey FOREIGN KEY (committed_path_id) REFERENCES public.learning_paths(id) ON DELETE SET NULL;


--
-- Name: learning_v2_imports learning_v2_imports_committed_version_id_committed_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_imports
    ADD CONSTRAINT learning_v2_imports_committed_version_id_committed_path_id_fkey FOREIGN KEY (committed_version_id, committed_path_id) REFERENCES public.learning_path_versions(id, path_id) ON DELETE SET NULL (committed_version_id);


--
-- Name: learning_v2_imports learning_v2_imports_committed_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_imports
    ADD CONSTRAINT learning_v2_imports_committed_version_id_fkey FOREIGN KEY (committed_version_id) REFERENCES public.learning_path_versions(id) ON DELETE SET NULL;


--
-- Name: learning_v2_imports learning_v2_imports_target_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_imports
    ADD CONSTRAINT learning_v2_imports_target_path_id_fkey FOREIGN KEY (target_path_id) REFERENCES public.learning_paths(id) ON DELETE SET NULL;


--
-- Name: learning_v2_imports learning_v2_imports_target_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_imports
    ADD CONSTRAINT learning_v2_imports_target_version_id_fkey FOREIGN KEY (target_version_id) REFERENCES public.learning_path_versions(id) ON DELETE SET NULL;


--
-- Name: learning_v2_imports learning_v2_imports_target_version_id_target_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_imports
    ADD CONSTRAINT learning_v2_imports_target_version_id_target_path_id_fkey FOREIGN KEY (target_version_id, target_path_id) REFERENCES public.learning_path_versions(id, path_id) ON DELETE SET NULL (target_version_id);


--
-- Name: learning_v2_objective_state learning_v2_objective_state_enrollment_id_path_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_objective_state
    ADD CONSTRAINT learning_v2_objective_state_enrollment_id_path_version_id_fkey FOREIGN KEY (enrollment_id, path_version_id) REFERENCES public.learning_enrollment_versions(enrollment_id, path_version_id) ON DELETE CASCADE;


--
-- Name: learning_v2_objective_state learning_v2_objective_state_enrollment_id_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_objective_state
    ADD CONSTRAINT learning_v2_objective_state_enrollment_id_user_id_fkey FOREIGN KEY (enrollment_id, user_id) REFERENCES public.learning_enrollments(id, user_id) ON DELETE CASCADE;


--
-- Name: learning_v2_responses learning_v2_responses_attempt_id_user_id_enrollment_id_pat_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_responses
    ADD CONSTRAINT learning_v2_responses_attempt_id_user_id_enrollment_id_pat_fkey FOREIGN KEY (attempt_id, user_id, enrollment_id, path_version_id) REFERENCES public.learning_v2_attempts(id, user_id, enrollment_id, path_version_id) ON DELETE CASCADE;


--
-- Name: learning_v2_review_state learning_v2_review_state_enrollment_id_path_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_review_state
    ADD CONSTRAINT learning_v2_review_state_enrollment_id_path_version_id_fkey FOREIGN KEY (enrollment_id, path_version_id) REFERENCES public.learning_enrollment_versions(enrollment_id, path_version_id) ON DELETE CASCADE;


--
-- Name: learning_v2_review_state learning_v2_review_state_enrollment_id_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_review_state
    ADD CONSTRAINT learning_v2_review_state_enrollment_id_user_id_fkey FOREIGN KEY (enrollment_id, user_id) REFERENCES public.learning_enrollments(id, user_id) ON DELETE CASCADE;


--
-- Name: learning_v2_review_state learning_v2_review_state_last_applied_response_id_user_id__fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_review_state
    ADD CONSTRAINT learning_v2_review_state_last_applied_response_id_user_id__fkey FOREIGN KEY (last_applied_response_id, user_id, path_version_id) REFERENCES public.learning_v2_responses(id, user_id, path_version_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: learning_v2_review_state learning_v2_review_state_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_v2_review_state
    ADD CONSTRAINT learning_v2_review_state_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: lesson_progress lesson_progress_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: lesson_progress lesson_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: lessons lessons_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.course_modules(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: user_recent_guides user_recent_guides_content_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_recent_guides
    ADD CONSTRAINT user_recent_guides_content_item_id_fkey FOREIGN KEY (content_item_id) REFERENCES public.content_items(id) ON DELETE CASCADE;


--
-- Name: user_recent_guides user_recent_guides_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_recent_guides
    ADD CONSTRAINT user_recent_guides_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.auth_users(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: guide_sections cediah_runtime_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cediah_runtime_all ON public.guide_sections TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: guide_term_manifests cediah_runtime_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cediah_runtime_all ON public.guide_term_manifests TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: guide_term_reindex_queue cediah_runtime_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cediah_runtime_all ON public.guide_term_reindex_queue TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: guide_term_usage cediah_runtime_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cediah_runtime_all ON public.guide_term_usage TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: interactive_term_aliases cediah_runtime_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cediah_runtime_all ON public.interactive_term_aliases TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: interactive_term_dictionary_state cediah_runtime_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cediah_runtime_all ON public.interactive_term_dictionary_state TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: interactive_term_links cediah_runtime_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cediah_runtime_all ON public.interactive_term_links TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: interactive_terms cediah_runtime_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cediah_runtime_all ON public.interactive_terms TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: content_reaction_counts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_reaction_counts ENABLE ROW LEVEL SECURITY;

--
-- Name: content_reaction_counts content_reaction_counts_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY content_reaction_counts_runtime ON public.content_reaction_counts TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: content_reactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_reactions ENABLE ROW LEVEL SECURITY;

--
-- Name: content_reactions content_reactions_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY content_reactions_runtime ON public.content_reactions TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: content_view_counts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_view_counts ENABLE ROW LEVEL SECURITY;

--
-- Name: content_view_counts content_view_counts_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY content_view_counts_runtime ON public.content_view_counts TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: content_view_receipts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_view_receipts ENABLE ROW LEVEL SECURITY;

--
-- Name: content_view_receipts content_view_receipts_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY content_view_receipts_runtime ON public.content_view_receipts TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: guide_sections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guide_sections ENABLE ROW LEVEL SECURITY;

--
-- Name: guide_term_manifests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guide_term_manifests ENABLE ROW LEVEL SECURITY;

--
-- Name: guide_term_reindex_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guide_term_reindex_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: guide_term_usage; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guide_term_usage ENABLE ROW LEVEL SECURITY;

--
-- Name: interactive_term_aliases; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.interactive_term_aliases ENABLE ROW LEVEL SECURITY;

--
-- Name: interactive_term_dictionary_state; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.interactive_term_dictionary_state ENABLE ROW LEVEL SECURITY;

--
-- Name: interactive_term_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.interactive_term_links ENABLE ROW LEVEL SECURITY;

--
-- Name: interactive_terms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.interactive_terms ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_attempts learning_attempts_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_attempts_runtime ON public.learning_attempts TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_enrollment_versions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_enrollment_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_enrollment_versions learning_enrollment_versions_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_enrollment_versions_runtime ON public.learning_enrollment_versions TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_enrollments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_enrollments ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_enrollments learning_enrollments_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_enrollments_runtime ON public.learning_enrollments TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_events ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_events learning_events_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_events_runtime ON public.learning_events TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_items ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_items learning_items_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_items_runtime ON public.learning_items TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_map_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_map_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_map_entries learning_map_entries_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_map_entries_runtime ON public.learning_map_entries TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_map_layouts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_map_layouts ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_map_layouts learning_map_layouts_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_map_layouts_runtime ON public.learning_map_layouts TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_map_nodes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_map_nodes ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_map_nodes learning_map_nodes_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_map_nodes_runtime ON public.learning_map_nodes TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_maps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_maps ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_maps learning_maps_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_maps_runtime ON public.learning_maps TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_mutation_receipts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_mutation_receipts ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_mutation_receipts learning_mutation_receipts_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_mutation_receipts_runtime ON public.learning_mutation_receipts TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_objective_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_objective_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_objective_progress learning_objective_progress_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_objective_progress_runtime ON public.learning_objective_progress TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_path_steps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_path_steps ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_path_steps learning_path_steps_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_path_steps_runtime ON public.learning_path_steps TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_path_units; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_path_units ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_path_units learning_path_units_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_path_units_runtime ON public.learning_path_units TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_path_versions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_path_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_path_versions learning_path_versions_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_path_versions_runtime ON public.learning_path_versions TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_paths; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_paths learning_paths_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_paths_runtime ON public.learning_paths TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_preferences learning_preferences_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_preferences_runtime ON public.learning_preferences TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_resource_revisions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_resource_revisions ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_resource_revisions learning_resource_revisions_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_resource_revisions_runtime ON public.learning_resource_revisions TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_resources; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_resources learning_resources_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_resources_runtime ON public.learning_resources TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_responses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_responses ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_responses learning_responses_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_responses_runtime ON public.learning_responses TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_review_states; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_review_states ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_review_states learning_review_states_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_review_states_runtime ON public.learning_review_states TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_rewards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_rewards ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_rewards learning_rewards_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_rewards_runtime ON public.learning_rewards TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_step_options; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_step_options ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_step_options learning_step_options_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_step_options_runtime ON public.learning_step_options TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_step_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_step_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_step_progress learning_step_progress_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_step_progress_runtime ON public.learning_step_progress TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_task_overrides; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_task_overrides ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_task_overrides learning_task_overrides_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_task_overrides_runtime ON public.learning_task_overrides TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_v2_activity_state; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_v2_activity_state ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_v2_activity_state learning_v2_activity_state_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_v2_activity_state_runtime ON public.learning_v2_activity_state TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_v2_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_v2_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_v2_attempts learning_v2_attempts_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_v2_attempts_runtime ON public.learning_v2_attempts TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_v2_bindings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_v2_bindings ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_v2_bindings learning_v2_bindings_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_v2_bindings_runtime ON public.learning_v2_bindings TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_v2_imports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_v2_imports ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_v2_imports learning_v2_imports_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_v2_imports_runtime ON public.learning_v2_imports TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_v2_objective_state; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_v2_objective_state ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_v2_objective_state learning_v2_objective_state_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_v2_objective_state_runtime ON public.learning_v2_objective_state TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_v2_responses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_v2_responses ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_v2_responses learning_v2_responses_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_v2_responses_runtime ON public.learning_v2_responses TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: learning_v2_review_state; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.learning_v2_review_state ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_v2_review_state learning_v2_review_state_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY learning_v2_review_state_runtime ON public.learning_v2_review_state TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: user_recent_guides; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_recent_guides ENABLE ROW LEVEL SECURITY;

--
-- Name: user_recent_guides user_recent_guides_runtime; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_recent_guides_runtime ON public.user_recent_guides TO cediah_runtime USING (true) WITH CHECK (true);


--
-- Name: SCHEMA private; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA private TO cediah_runtime;


--
-- Name: FUNCTION lock_guided_v2_actor(actor_id uuid); Type: ACL; Schema: private; Owner: -
--

REVOKE ALL ON FUNCTION private.lock_guided_v2_actor(actor_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION private.lock_guided_v2_actor(actor_id uuid) TO cediah_runtime;


--
-- Name: FUNCTION lock_guided_v2_catalog(resource_kind text, target_resource_id uuid); Type: ACL; Schema: private; Owner: -
--

REVOKE ALL ON FUNCTION private.lock_guided_v2_catalog(resource_kind text, target_resource_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION private.lock_guided_v2_catalog(resource_kind text, target_resource_id uuid) TO cediah_runtime;


--
-- Name: FUNCTION prevent_learning_v2_policy_downgrade(); Type: ACL; Schema: private; Owner: -
--

REVOKE ALL ON FUNCTION private.prevent_learning_v2_policy_downgrade() FROM PUBLIC;


--
-- Name: FUNCTION validate_learning_v2_binding(); Type: ACL; Schema: private; Owner: -
--

REVOKE ALL ON FUNCTION private.validate_learning_v2_binding() FROM PUBLIC;


--
-- Name: FUNCTION validate_learning_v2_runtime_version(); Type: ACL; Schema: private; Owner: -
--

REVOKE ALL ON FUNCTION private.validate_learning_v2_runtime_version() FROM PUBLIC;


--
-- Name: TABLE guided_v2_audit; Type: ACL; Schema: private; Owner: -
--

GRANT SELECT ON TABLE private.guided_v2_audit TO cediah_runtime;


--
-- Name: COLUMN guided_v2_audit.actor_user_id; Type: ACL; Schema: private; Owner: -
--

GRANT INSERT(actor_user_id) ON TABLE private.guided_v2_audit TO cediah_runtime;


--
-- Name: COLUMN guided_v2_audit.action; Type: ACL; Schema: private; Owner: -
--

GRANT INSERT(action) ON TABLE private.guided_v2_audit TO cediah_runtime;


--
-- Name: COLUMN guided_v2_audit.target_type; Type: ACL; Schema: private; Owner: -
--

GRANT INSERT(target_type) ON TABLE private.guided_v2_audit TO cediah_runtime;


--
-- Name: COLUMN guided_v2_audit.target_id; Type: ACL; Schema: private; Owner: -
--

GRANT INSERT(target_id) ON TABLE private.guided_v2_audit TO cediah_runtime;


--
-- Name: COLUMN guided_v2_audit.metadata; Type: ACL; Schema: private; Owner: -
--

GRANT INSERT(metadata) ON TABLE private.guided_v2_audit TO cediah_runtime;


--
-- Name: COLUMN content_assets.id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(id) ON TABLE public.content_assets TO cediah_runtime;


--
-- Name: COLUMN content_assets.content_item_id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(content_item_id) ON TABLE public.content_assets TO cediah_runtime;


--
-- Name: COLUMN content_assets.owner_user_id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(owner_user_id) ON TABLE public.content_assets TO cediah_runtime;


--
-- Name: COLUMN content_assets.kind; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(kind) ON TABLE public.content_assets TO cediah_runtime;


--
-- Name: COLUMN content_assets.storage_bucket; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(storage_bucket) ON TABLE public.content_assets TO cediah_runtime;


--
-- Name: COLUMN content_assets.storage_path; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(storage_path) ON TABLE public.content_assets TO cediah_runtime;


--
-- Name: COLUMN content_assets.original_file_name; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(original_file_name) ON TABLE public.content_assets TO cediah_runtime;


--
-- Name: COLUMN content_assets.mime_type; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(mime_type) ON TABLE public.content_assets TO cediah_runtime;


--
-- Name: COLUMN content_assets.status; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(status) ON TABLE public.content_assets TO cediah_runtime;


--
-- Name: TABLE content_items; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.content_items TO cediah_runtime;


--
-- Name: TABLE content_reaction_counts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,UPDATE ON TABLE public.content_reaction_counts TO cediah_runtime;


--
-- Name: TABLE content_reactions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.content_reactions TO cediah_runtime;


--
-- Name: TABLE content_view_counts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.content_view_counts TO cediah_runtime;


--
-- Name: TABLE content_view_receipts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.content_view_receipts TO cediah_runtime;


--
-- Name: TABLE guide_sections; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.guide_sections TO cediah_runtime;


--
-- Name: TABLE guide_term_manifests; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.guide_term_manifests TO cediah_runtime;


--
-- Name: TABLE guide_term_reindex_queue; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.guide_term_reindex_queue TO cediah_runtime;


--
-- Name: TABLE guide_term_usage; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.guide_term_usage TO cediah_runtime;


--
-- Name: TABLE interactive_term_aliases; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.interactive_term_aliases TO cediah_runtime;


--
-- Name: TABLE interactive_term_dictionary_state; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.interactive_term_dictionary_state TO cediah_runtime;


--
-- Name: TABLE interactive_term_links; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.interactive_term_links TO cediah_runtime;


--
-- Name: TABLE interactive_terms; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.interactive_terms TO cediah_runtime;


--
-- Name: TABLE learning_attempts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,UPDATE ON TABLE public.learning_attempts TO cediah_runtime;


--
-- Name: TABLE learning_enrollment_versions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT ON TABLE public.learning_enrollment_versions TO cediah_runtime;


--
-- Name: TABLE learning_enrollments; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.learning_enrollments TO cediah_runtime;


--
-- Name: TABLE learning_events; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT ON TABLE public.learning_events TO cediah_runtime;


--
-- Name: TABLE learning_items; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,UPDATE ON TABLE public.learning_items TO cediah_runtime;


--
-- Name: TABLE learning_map_entries; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.learning_map_entries TO cediah_runtime;


--
-- Name: TABLE learning_map_layouts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.learning_map_layouts TO cediah_runtime;


--
-- Name: TABLE learning_map_nodes; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.learning_map_nodes TO cediah_runtime;


--
-- Name: TABLE learning_maps; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.learning_maps TO cediah_runtime;


--
-- Name: TABLE learning_mutation_receipts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,UPDATE ON TABLE public.learning_mutation_receipts TO cediah_runtime;


--
-- Name: TABLE learning_objective_progress; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,UPDATE ON TABLE public.learning_objective_progress TO cediah_runtime;


--
-- Name: TABLE learning_path_steps; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.learning_path_steps TO cediah_runtime;


--
-- Name: TABLE learning_path_units; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.learning_path_units TO cediah_runtime;


--
-- Name: TABLE learning_path_versions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.learning_path_versions TO cediah_runtime;


--
-- Name: TABLE learning_paths; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.learning_paths TO cediah_runtime;


--
-- Name: TABLE learning_preferences; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,UPDATE ON TABLE public.learning_preferences TO cediah_runtime;


--
-- Name: TABLE learning_resource_revisions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT ON TABLE public.learning_resource_revisions TO cediah_runtime;


--
-- Name: TABLE learning_resources; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,UPDATE ON TABLE public.learning_resources TO cediah_runtime;


--
-- Name: TABLE learning_responses; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT ON TABLE public.learning_responses TO cediah_runtime;


--
-- Name: TABLE learning_review_states; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,UPDATE ON TABLE public.learning_review_states TO cediah_runtime;


--
-- Name: TABLE learning_rewards; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT ON TABLE public.learning_rewards TO cediah_runtime;


--
-- Name: TABLE learning_step_options; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.learning_step_options TO cediah_runtime;


--
-- Name: TABLE learning_step_progress; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,UPDATE ON TABLE public.learning_step_progress TO cediah_runtime;


--
-- Name: TABLE learning_task_overrides; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.learning_task_overrides TO cediah_runtime;


--
-- Name: TABLE learning_v2_activity_state; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,UPDATE ON TABLE public.learning_v2_activity_state TO cediah_runtime;


--
-- Name: TABLE learning_v2_attempts; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,UPDATE ON TABLE public.learning_v2_attempts TO cediah_runtime;


--
-- Name: TABLE learning_v2_bindings; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.learning_v2_bindings TO cediah_runtime;


--
-- Name: TABLE learning_v2_imports; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.learning_v2_imports TO cediah_runtime;


--
-- Name: TABLE learning_v2_objective_state; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,UPDATE ON TABLE public.learning_v2_objective_state TO cediah_runtime;


--
-- Name: TABLE learning_v2_responses; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT ON TABLE public.learning_v2_responses TO cediah_runtime;


--
-- Name: TABLE learning_v2_review_state; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,UPDATE ON TABLE public.learning_v2_review_state TO cediah_runtime;


--
-- Name: TABLE user_recent_guides; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_recent_guides TO cediah_runtime;


--
-- PostgreSQL database dump complete
--

\unrestrict mS7r20mVOWYJnECmsBmwVp6y1qBPBygdb7U1u2WMOSuSxmRz9YdANoruNOpmCrJ

