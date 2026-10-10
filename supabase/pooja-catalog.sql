-- ============================================================
-- Prarthanas — Pooja Catalog (FR-70 … FR-73)
-- Admin-managed master list of pooja types with attributes.
-- Run in Supabase SQL Editor.
-- ============================================================

create table if not exists public.pooja_catalog (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  name_hi          text,
  name_te          text,
  category         text not null default 'personal'
                     check (category in ('personal','festival','occasion','havan','regular')),
  deity_name       text,
  description      text,
  duration_mins    integer not null default 60,
  base_fee_paise   integer not null default 0,   -- 0 = negotiable/free; stored in paise
  occasion_type    text default 'none'
                     check (occasion_type in (
                       'none','house_warming','naming_ceremony','wedding',
                       'birthday','death_anniversary','other')),
  requires_sankalpa boolean not null default true,
  is_online        boolean not null default true,
  required_items   text,   -- comma-separated list shown to devotee
  notes_for_priest text,
  is_active        boolean not null default true,
  sort_order       integer not null default 100,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table public.pooja_catalog enable row level security;

-- Anyone can read active poojas; only admin can write
drop policy if exists "pooja_catalog_read" on public.pooja_catalog;
create policy "pooja_catalog_read" on public.pooja_catalog
  for select to anon, authenticated using (true);

drop policy if exists "pooja_catalog_admin" on public.pooja_catalog;
create policy "pooja_catalog_admin" on public.pooja_catalog
  for all to authenticated
  using  (is_admin())
  with check (is_admin());

-- ── Seed: common poojas ──────────────────────────────────────

insert into public.pooja_catalog
  (name, name_hi, name_te, category, deity_name, description, duration_mins, base_fee_paise,
   occasion_type, requires_sankalpa, is_online, required_items, sort_order)
values
  ('Satyanarayana Pooja',   'सत्यनारायण पूजा',   'సత్యనారాయణ పూజ',   'personal',  'Vishnu / Satyanarayana',
   'A prayer to Lord Satyanarayana for prosperity, success, and fulfilment of wishes.',
   120, 50000, 'none', true, true,
   'Pancha amrutam (milk, curd, honey, ghee, sugar), bananas, coconut, flowers, incense, lamp',
   10),

  ('Ganesh Pooja',          'गणेश पूजा',           'గణేశ పూజ',           'personal',  'Ganesha',
   'Pooja to Lord Ganesha to remove obstacles and bring auspiciousness before any new venture.',
   60, 30000, 'none', true, true,
   'Durva grass, modak/laddoo, red flowers, coconut, incense, lamp',
   20),

  ('Lakshmi Pooja',         'लक्ष्मी पूजा',         'లక్ష్మీ పూజ',         'personal',  'Lakshmi',
   'Pooja to Goddess Lakshmi for wealth, prosperity, and well-being of the family.',
   90, 40000, 'none', true, true,
   'Lotus flowers or marigold, coins, rice, turmeric, kumkum, incense, lamp, fruits',
   30),

  ('Griha Pravesh',         'गृह प्रवेश',           'గృహ ప్రవేశం',         'occasion',  'Ganesha / Vastu Purusha',
   'House warming ritual performed before entering a new home for blessings and harmony.',
   180, 150000, 'house_warming', true, true,
   'Coconut, mangal kalash, mango leaves, flowers, turmeric, kumkum, rice, lamp, sweets',
   40),

  ('Navagraha Pooja',       'नवग्रह पूजा',         'నవగ్రహ పూజ',          'personal',  'Navagraha (9 planets)',
   'Pooja to the nine planetary deities for balance of cosmic influences in one''s life.',
   120, 60000, 'none', true, true,
   'Nine types of grains, nine flowers, nine incense sticks, nine lamps, turmeric, kumkum',
   50),

  ('Vastu Pooja',           'वास्तु पूजा',           'వాస్తు పూజ',           'occasion',  'Vastu Purusha',
   'Ritual to pacify Vastu Purusha and bring positive energy to a home or office.',
   90, 80000, 'house_warming', true, true,
   'Coconut, flowers, incense, lamp, rice, turmeric, kumkum, camphor',
   60),

  ('Rudrabhishek',          'रुद्राभिषेक',           'రుద్రాభిషేకం',         'regular',   'Shiva',
   'Sacred bathing ritual of Shiva Lingam with Panchabhisheka items while chanting Rudra hymns.',
   120, 70000, 'none', true, true,
   'Milk, curd, honey, ghee, sugarcane juice, bilva leaves, flowers, incense, lamp',
   70),

  ('Durga Pooja',           'दुर्गा पूजा',           'దుర్గా పూజ',           'festival',  'Durga',
   'Pooja to Goddess Durga for strength, protection, and victory over evil.',
   90, 50000, 'none', true, true,
   'Red flowers, coconut, fruits, kumkum, incense, lamp, betel leaves',
   80),

  ('Hanuman Pooja',         'हनुमान पूजा',           'హనుమాన్ పూజ',         'regular',   'Hanuman',
   'Prayer to Lord Hanuman for courage, strength, and protection from negative forces.',
   60, 30000, 'none', true, true,
   'Red flowers, sindoor, oil lamp, coconut, bananas, incense',
   90),

  ('Saraswati Pooja',       'सरस्वती पूजा',         'సరస్వతీ పూజ',         'festival',  'Saraswati',
   'Pooja to Goddess Saraswati for knowledge, education, arts, and wisdom.',
   60, 30000, 'none', true, true,
   'White flowers, books/instruments (for blessing), fruits, incense, lamp',
   100),

  ('Mrityunjaya Havan',     'मृत्युंजय हवन',         'మృత్యుంజయ హోమం',     'havan',     'Shiva (Mrityunjaya)',
   'Havan chanting Mahamrityunjaya mantra for health, longevity, and overcoming illness.',
   150, 120000, 'none', true, true,
   'Havan kund, ghee, samidha (wood sticks), sesame seeds, bilva leaves, flowers',
   110),

  ('Namakaran',             'नामकरण',               'నామకరణం',             'occasion',  'Ganesha / Saraswati',
   'Naming ceremony for a newborn child — a joyous occasion with prayers and blessings.',
   90, 60000, 'naming_ceremony', true, true,
   'Coconut, flowers, kumkum, turmeric, incense, lamp, new clothes for baby',
   120),

  ('Annaprasanam',          'अन्नप्राशन',             'అన్నప్రాశన',           'occasion',  'Annapoorna / Lakshmi',
   'First rice feeding ceremony for a baby — prayer for health, nourishment, and prosperity.',
   60, 50000, 'none', true, true,
   'Rice, ghee, honey, silver vessel, flowers, incense, lamp',
   130),

  ('Upanayanam',            'उपनयन',                 'ఉపనయనం',             'occasion',  'Gayatri / Brahma',
   'Sacred thread ceremony marking a boy''s initiation into Vedic studies.',
   240, 200000, 'none', true, false,
   'Sacred thread (yajnopavita), dhoti, flowers, coconut, fruits, incense',
   140),

  ('Vivah / Wedding Rituals','विवाह संस्कार',        'వివాహ సంస్కారం',      'occasion',  'Agni / Lakshmi',
   'Complete Hindu wedding rituals including saptapadi, mangalsutra, and kanyadaan.',
   300, 500000, 'wedding', true, false,
   'Havan kund, ghee, flowers, mangalsutra, turmeric, kumkum, sarees, fruits',
   150),

  ('Pitru Tarpan / Shraddha','पितृ तर्पण / श्राद्ध', 'పితృ తర్పణ',          'personal',  'Pitru Devatas',
   'Ritual offering to departed ancestors for their peace and liberation.',
   120, 60000, 'death_anniversary', true, false,
   'Sesame seeds, darbha grass, water, barley, flowers, lamp',
   160),

  ('Kali Pooja',            'काली पूजा',             'కాళీ పూజ',             'festival',  'Kali',
   'Pooja to Goddess Kali for protection, courage, and removal of evil forces.',
   90, 60000, 'none', true, true,
   'Red hibiscus flowers, fruits, incense, lamp, kumkum',
   170),

  ('Ayyappa Pooja',         'अयप्पा पूजा',           'అయ్యప్ప పూజ',         'regular',   'Ayyappa',
   'Devotional pooja to Lord Ayyappa for blessings and fulfilment of vows.',
   90, 40000, 'none', true, true,
   'Coconut, camphor, flowers, incense, lamp, black sesame',
   180),

  ('Sudarshana Homa',       'सुदर्शन होम',           'సుదర్శన హోమం',        'havan',     'Sudarshana / Vishnu',
   'Havan to Lord Sudarshana for protection, healing, and removal of negative energies.',
   150, 120000, 'none', true, false,
   'Havan kund, ghee, lotus flowers, samidha, fruits, incense',
   190),

  ('Rama Pooja',            'राम पूजा',               'రామ పూజ',             'regular',   'Rama',
   'Prayer to Lord Rama for righteousness, peace, and family well-being.',
   60, 30000, 'none', true, true,
   'Tulsi leaves, flowers, incense, lamp, fruits, coconut',
   200)
on conflict do nothing;

notify pgrst, 'reload schema';
