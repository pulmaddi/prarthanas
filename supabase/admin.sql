-- ============================================================
-- Prarthanas — Admin access (run in the Supabase SQL Editor)
-- Lets a logged-in ADMIN user manage the deities catalog + images
-- from the local admin web app, using the public anon key + their
-- session. Row-Level Security restricts writes to admins only.
-- ============================================================

-- 1. Who is an admin --------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz default now()
);
alter table public.admins enable row level security;

-- An admin can read their own admin row (used by the app to check access).
drop policy if exists "admins_read_self" on public.admins;
create policy "admins_read_self" on public.admins
  for select using (auth.uid() = user_id);

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- 2. Deities table: public read (already set), admin write ------------
drop policy if exists "deities_admin_insert" on public.deities;
create policy "deities_admin_insert" on public.deities
  for insert to authenticated with check (public.is_admin());

drop policy if exists "deities_admin_update" on public.deities;
create policy "deities_admin_update" on public.deities
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "deities_admin_delete" on public.deities;
create policy "deities_admin_delete" on public.deities
  for delete to authenticated using (public.is_admin());

-- 3. Storage: 'deities' bucket — public read, admin write -------------
drop policy if exists "deities_obj_public_read" on storage.objects;
create policy "deities_obj_public_read" on storage.objects
  for select using (bucket_id = 'deities');

drop policy if exists "deities_obj_admin_insert" on storage.objects;
create policy "deities_obj_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'deities' and public.is_admin());

drop policy if exists "deities_obj_admin_update" on storage.objects;
create policy "deities_obj_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'deities' and public.is_admin());

drop policy if exists "deities_obj_admin_delete" on storage.objects;
create policy "deities_obj_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'deities' and public.is_admin());

-- 4. Make yourself an admin ------------------------------------------
-- Register/sign in once in the app (or admin page) so your auth user exists,
-- then run this with your email:
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'you@example.com'
--   on conflict do nothing;
