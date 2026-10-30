-- NULL preserves existing sessions until their original expiry without renewal.
alter table public.auth_sessions add column remember_me boolean;
