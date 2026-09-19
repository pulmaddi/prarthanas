-- ============================================================
-- Prarthanas — Guided Pooja masters: ritual items + step sequence
-- Run in the Supabase SQL Editor.
-- Requires admin.sql first (defines public.is_admin()).
-- ============================================================

-- 1) Ritual items catalog --------------------------------------------
-- The "things": name (+ hi/te), image, display order. The Deity is dynamic
-- (image_source = 'deity') — its image/audio come from the chosen Ishta Daiva
-- or the Vaara weekday deity at runtime, so it stores no file.
create table if not exists public.ritual_items (
  id           uuid primary key default gen_random_uuid(),
  item_key     text unique not null,          -- stable id: 'wooden_platform', 'deity', ...
  name         text not null,
  name_hi      text,
  name_te      text,
  image_source text not null default 'static'
               check (image_source in ('static', 'deity')),
  image_path   text,                           -- path in the 'ritual-items' bucket (static only)
  sort_order   int  not null default 0,        -- left-panel display order
  is_active    boolean not null default true,
  created_at   timestamptz default now()
);
alter table public.ritual_items enable row level security;

drop policy if exists "ritual_items_read" on public.ritual_items;
create policy "ritual_items_read" on public.ritual_items
  for select using (true);

drop policy if exists "ritual_items_admin_write" on public.ritual_items;
create policy "ritual_items_admin_write" on public.ritual_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 2) Pooja step sequence (the procedure) -----------------------------
-- The ordered instructions. Each step optionally references a ritual item
-- (item_key is null for prep-only steps like "take a bath"). `action` tells the
-- app how to render the step; extend the check list as new interactions ship.
-- `is_active` lets you roll steps out one at a time.
create table if not exists public.pooja_steps (
  id              uuid primary key default gen_random_uuid(),
  pooja_type      text not null default 'common',  -- shared by Prarthanas + Vaara for now
  step_order      int  not null,
  item_key        text references public.ritual_items (item_key) on delete set null,
  action          text not null default 'info'
                  check (action in ('info', 'place')),
  instruction     text not null,
  instruction_hi  text,
  instruction_te  text,
  is_active       boolean not null default true,
  created_at      timestamptz default now(),
  unique (pooja_type, step_order)
);
create index if not exists pooja_steps_order_idx
  on public.pooja_steps (pooja_type, step_order);
alter table public.pooja_steps enable row level security;

drop policy if exists "pooja_steps_read" on public.pooja_steps;
create policy "pooja_steps_read" on public.pooja_steps
  for select using (true);

drop policy if exists "pooja_steps_admin_write" on public.pooja_steps;
create policy "pooja_steps_admin_write" on public.pooja_steps
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 3) Storage bucket for the static item images -----------------------
insert into storage.buckets (id, name, public)
  values ('ritual-items', 'ritual-items', true)
  on conflict (id) do nothing;

drop policy if exists "ritual_items_obj_read" on storage.objects;
create policy "ritual_items_obj_read" on storage.objects
  for select using (bucket_id = 'ritual-items');

drop policy if exists "ritual_items_obj_admin_insert" on storage.objects;
create policy "ritual_items_obj_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'ritual-items' and public.is_admin());

drop policy if exists "ritual_items_obj_admin_update" on storage.objects;
create policy "ritual_items_obj_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'ritual-items' and public.is_admin());

drop policy if exists "ritual_items_obj_admin_delete" on storage.objects;
create policy "ritual_items_obj_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'ritual-items' and public.is_admin());

-- 4) Seed: ritual items ----------------------------------------------
-- Deity is dynamic (no file). The rest expect a PNG uploaded to the
-- 'ritual-items' bucket at the given image_path; until uploaded, the app
-- shows a placeholder.
insert into public.ritual_items (item_key, name, name_hi, name_te, image_source, image_path, sort_order) values
  ('deity',           'Deity',           'देवता',        'దైవం',         'deity',  null,                  1),
  ('wooden_platform', 'Wooden Platform', 'लकड़ी का पटरा', 'చెక్క పీట',     'static', 'wooden-platform.png', 2),
  ('yellow_cloth',    'Yellow Cloth',    'पीला वस्त्र',    'పసుపు వస్త్రం',  'static', 'yellow-cloth.png',    3),
  ('kalash',          'Kalash Pot',      'कलश',          'కలశం',         'static', 'kalash.png',          4),
  ('water',           'Water',           'जल',           'నీరు',         'static', 'water.png',           5),
  ('coin',            'Coin',            'सिक्का',        'నాణెం',        'static', 'coin.png',            6)
on conflict (item_key) do nothing;

-- 5) Seed: the two steps we've built ---------------------------------
insert into public.pooja_steps (pooja_type, step_order, item_key, action, instruction, instruction_hi, instruction_te) values
  ('common', 1, null, 'info',
     'Take a bath and wear fresh, clean clothes before handling any ritual items.',
     'पूजा सामग्री को छूने से पहले स्नान करें और स्वच्छ, ताज़े वस्त्र पहनें।',
     'పూజా సామగ్రిని ముట్టుకునే ముందు స్నానం చేసి, శుభ్రమైన కొత్త దుస్తులు ధరించండి.'),
  ('common', 2, 'wooden_platform', 'place',
     'Place the wooden platform facing East or North at the centre of the screen.',
     'लकड़ी के पटरे को पूर्व या उत्तर की ओर स्क्रीन के केंद्र में रखें।',
     'చెక్క పీటను తూర్పు లేదా ఉత్తర దిశగా స్క్రీన్ మధ్యలో ఉంచండి.')
on conflict (pooja_type, step_order) do nothing;
