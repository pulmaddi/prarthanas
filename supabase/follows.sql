-- ============================================================
-- Prarthanas — Follows + public host directory. Run in the Supabase SQL Editor.
-- Devotees follow priests/gurus/temples. A PII-free view exposes hosts for
-- discovery (name/type/city only — no phone/email). Requires hosts.sql.
-- ============================================================

create table if not exists public.follows (
  follower_id uuid references auth.users (id) on delete cascade,
  host_id     uuid references auth.users (id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (follower_id, host_id)
);

alter table public.follows enable row level security;

-- A user manages only their own follows.
drop policy if exists "follows_own_all" on public.follows;
create policy "follows_own_all" on public.follows
  for all to authenticated
  using (follower_id = auth.uid())
  with check (follower_id = auth.uid());

-- Public directory of hosts for discovery — name/type/city only (no phone).
-- (Runs with owner rights, bypassing host_accounts RLS, so anyone can browse.)
create or replace view public.hosts_public as
  select user_id, host_types, name, city from public.host_accounts;

grant select on public.hosts_public to anon, authenticated;

notify pgrst, 'reload schema';
