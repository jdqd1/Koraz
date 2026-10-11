begin;
set local lock_timeout='5s';
do $cleanup$
declare qa uuid := '5e0de895-d532-4660-9105-bfcf659a81f8'; before_users text; before_enrollments text; before_responses text;
begin
if not exists(select 1 from public.auth_users where id=qa and email ~ '^prod01-qa-[a-f0-9]+@example\.test$') then raise exception 'QA identity guard failed'; end if;
if exists(select 1 from public.content_items where author_user_id=qa) or exists(select 1 from public.learning_paths where created_by=qa) then raise exception 'QA owns published content'; end if;
if (select count(*) from public.learning_v2_attempts where user_id=qa and status='completed') <> 32 or (select count(*) from public.learning_v2_responses where user_id=qa) <> 32 then raise exception 'Journey count guard failed'; end if;
select md5(coalesce(string_agg(to_jsonb(u)::text, '' order by id),'')) into before_users from public.auth_users u where id<>qa;
select md5(coalesce(string_agg(to_jsonb(e)::text, '' order by id),'')) into before_enrollments from public.learning_enrollments e where user_id<>qa;
select md5(coalesce(string_agg(to_jsonb(r)::text, '' order by id),'')) into before_responses from public.learning_responses r;
delete from public.auth_users where id=qa and email ~ '^prod01-qa-[a-f0-9]+@example\.test$';
if before_users<>(select md5(coalesce(string_agg(to_jsonb(u)::text,'' order by id),'')) from public.auth_users u) or before_enrollments<>(select md5(coalesce(string_agg(to_jsonb(e)::text,'' order by id),'')) from public.learning_enrollments e) or before_responses<>(select md5(coalesce(string_agg(to_jsonb(r)::text,'' order by id),'')) from public.learning_responses r) then raise exception 'Original rows changed'; end if;
end $cleanup$;
commit;
select jsonb_build_object('users',(select count(*) from public.auth_users),'content',(select count(*) from public.content_items),'enrollments',(select count(*) from public.learning_enrollments),'v1responses',(select count(*) from public.learning_responses),'qaUsers',(select count(*) from public.auth_users where id='5e0de895-d532-4660-9105-bfcf659a81f8'),'qaSessions',(select count(*) from public.auth_sessions where user_id='5e0de895-d532-4660-9105-bfcf659a81f8'),'qaAttempts',(select count(*) from public.learning_v2_attempts where user_id='5e0de895-d532-4660-9105-bfcf659a81f8'),'qaResponses',(select count(*) from public.learning_v2_responses where user_id='5e0de895-d532-4660-9105-bfcf659a81f8')) as cleanup;