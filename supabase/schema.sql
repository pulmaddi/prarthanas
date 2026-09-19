-- ============================================================
-- Prarthanas — Supabase schema (run in the Supabase SQL Editor)
-- Auth is handled by Supabase Auth (auth.users). This adds a
-- public "profiles" row per user with name + preferred language,
-- protected by Row-Level Security.
-- ============================================================

-- 1. Profiles table -------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text,
  phone       text,
  ishta_daiva text,        -- chosen personal deity (Ishta Daiva / favourite god)
  language    text default 'en',
  city        text,
  state       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Additive: ensures columns exist if the table was created earlier.
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists ishta_daiva text;

-- 2. Row-Level Security: a user can see/edit only their own profile -
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- 3. Auto-create a profile when a new auth user signs up ------------
--    Pulls name/language from the metadata sent during signUp().
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'language', 'en')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Keep updated_at fresh ------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ============================================================
-- App data (hosts, occasions, bookings, ...) will be added here
-- later, mirroring apps/api/prisma/schema.prisma, each with its
-- own RLS policies. Registration/profiles is set up first.
-- ============================================================
