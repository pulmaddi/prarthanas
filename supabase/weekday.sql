-- ============================================================
-- Prarthanas — Vaara Pooja (weekday deities). Run in the Supabase SQL Editor.
-- One row per weekday (0=Sun … 6=Sat) with deity name + image/audio.
-- Images/audio live in the existing public 'deities' bucket under weekday/…
-- Managed via the in-app Admin (admins only); everyone reads.
-- Requires admin.sql (admins table + is_admin()).
-- ============================================================

create table if not exists public.weekday_deities (
  day        smallint primary key check (day between 0 and 6),
  day_name   text not null,
  deity_name text,
  image_path text,   -- e.g. 'weekday/sunday.png'  (in the 'deities' bucket)
  audio_path text,   -- e.g. 'weekday/sunday.mp3'
  updated_at timestamptz default now()
);

alter table public.weekday_deities enable row level security;

drop policy if exists "weekday_read_all" on public.weekday_deities;
create policy "weekday_read_all" on public.weekday_deities for select using (true);

drop policy if exists "weekday_admin_insert" on public.weekday_deities;
create policy "weekday_admin_insert" on public.weekday_deities
  for insert to authenticated with check (public.is_admin());

drop policy if exists "weekday_admin_update" on public.weekday_deities;
create policy "weekday_admin_update" on public.weekday_deities
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Seed the 7 days with default deities (image/audio added later via Admin).
insert into public.weekday_deities (day, day_name, deity_name) values
  (0, 'Sunday',    'Aditya'),
  (1, 'Monday',    'Shiva'),
  (2, 'Tuesday',   'Hanuman'),
  (3, 'Wednesday', 'Ganesha'),
  (4, 'Thursday',  'Sai Baba'),
  (5, 'Friday',    'Lakshmi'),
  (6, 'Saturday',  'Venkateswara')
on conflict (day) do nothing;
