-- ============================================================
-- Prarthanas — Deities catalog (run in the Supabase SQL Editor)
-- A reference table of deities for the Ishta Daiva picker + images.
-- Manage rows in the Table Editor; upload images to the 'deities'
-- Storage bucket (file name = image_path). No custom admin page needed.
-- ============================================================

create table if not exists public.deities (
  key          text primary key,           -- slug, e.g. 'venkateswara'
  display_name text not null,               -- shown to users, e.g. 'Venkateswara'
  image_path   text,                        -- image file in the 'deities' bucket, e.g. 'venkateswara.png'
  audio_path   text,                        -- mantra audio in the bucket, e.g. 'audio/venkateswara.mp3'
  sort_order   int  default 100,
  created_at   timestamptz default now()
);

-- Additive: ensure audio column exists if the table was created earlier.
alter table public.deities add column if not exists audio_path text;

-- Public read (anyone may view the catalog); writes only via dashboard/service role.
alter table public.deities enable row level security;
drop policy if exists "deities_read_all" on public.deities;
create policy "deities_read_all" on public.deities for select using (true);

-- Seed the launch set. image_path points at <key>.png in the 'deities' bucket;
-- upload those images via Storage (or edit image_path to whatever you upload).
insert into public.deities (key, display_name, image_path, sort_order) values
  ('ganesha',      'Ganesha',      'ganesha.png',      10),
  ('shiva',        'Shiva',        'shiva.png',        20),
  ('vishnu',       'Vishnu',       'vishnu.png',       30),
  ('venkateswara', 'Venkateswara', 'venkateswara.png', 40),
  ('rama',         'Rama',         'rama.png',         50),
  ('krishna',      'Krishna',      'krishna.png',      60),
  ('hanuman',      'Hanuman',      'hanuman.png',      70),
  ('lakshmi',      'Lakshmi',      'lakshmi.png',      80),
  ('durga',        'Durga',        'durga.png',        90),
  ('saraswati',    'Saraswati',    'saraswati.png',    100),
  ('subrahmanya',  'Subrahmanya',  'subrahmanya.png',  110),
  ('ayyappa',      'Ayyappa',      'ayyappa.png',      120)
on conflict (key) do nothing;
