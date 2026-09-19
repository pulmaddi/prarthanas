-- ============================================================
-- Prarthanas — Host onboarding (Priest / Guru / Temple Executive /
-- Numerologist / Astrologer). Run in the Supabase SQL Editor.
-- Requires admin.sql (is_admin()).
-- One host profile per user; a user can hold MULTIPLE roles (host_types
-- array). Created by an ADMIN only (no self-signup grants host access):
-- writable only by admins (RLS); everyone else can read their own.
-- (Existing installs: migrate the single host_type column to host_types.)
-- ============================================================

create table if not exists public.host_accounts (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  host_types text[] not null,
  name       text,
  phone      text,
  city       text,
  org_name   text,            -- temple / ashram / organisation
  created_at timestamptz default now(),
  constraint host_types_allowed check (
    array_length(host_types, 1) >= 1
    and host_types <@ array['priest', 'guru', 'temple_exec', 'numerologist', 'astrologer']::text[]
  )
);

alter table public.host_accounts enable row level security;

-- Admins manage everything.
drop policy if exists "host_accounts_admin_all" on public.host_accounts;
create policy "host_accounts_admin_all" on public.host_accounts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- A host can read their own record (to know their role in the app).
drop policy if exists "host_accounts_read_self" on public.host_accounts;
create policy "host_accounts_read_self" on public.host_accounts
  for select to authenticated using (auth.uid() = user_id);
