-- ============================================================
-- Ishta — Host onboarding (Priest / Guru / Temple Executive).
-- Run in the Supabase SQL Editor. Requires admin.sql (is_admin()).
-- These accounts are created by an ADMIN only (no self-signup grants
-- host access): the admin creates the auth user, then records the role
-- here — writable only by admins (RLS). Everyone else can read their own.
-- ============================================================

create table if not exists public.host_accounts (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  host_type  text not null check (host_type in ('priest', 'guru', 'temple_exec')),
  name       text,
  phone      text,
  city       text,
  org_name   text,            -- temple / ashram / organisation
  created_at timestamptz default now()
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
