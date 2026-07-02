-- Scheduling fields for host_meetings: meeting vs special pooja, date/time,
-- recurrence (one-time / daily / weekly / monthly).
--
-- Self-contained: creates host_meetings + host_notifications (with RLS) if they
-- don't exist yet, then adds the scheduling columns. Safe to run on its own or
-- after host-content.sql (fully idempotent). Run in the SQL Editor.

-- ── Base tables (from host-content.sql — created only if missing) ───────────
create table if not exists public.host_meetings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  when_text text,
  description text,
  join_url text,
  created_at timestamptz default now()
);
alter table public.host_meetings enable row level security;

drop policy if exists "meetings_read_all" on public.host_meetings;
create policy "meetings_read_all" on public.host_meetings
  for select to authenticated using (true);

drop policy if exists "meetings_host_write" on public.host_meetings;
create policy "meetings_host_write" on public.host_meetings
  for all to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());

create table if not exists public.host_notifications (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text,
  created_at timestamptz default now()
);
alter table public.host_notifications enable row level security;

drop policy if exists "notifications_read_all" on public.host_notifications;
create policy "notifications_read_all" on public.host_notifications
  for select to authenticated using (true);

drop policy if exists "notifications_host_write" on public.host_notifications;
create policy "notifications_host_write" on public.host_notifications
  for all to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());

-- ── Scheduling columns ──────────────────────────────────────────────────────
alter table public.host_meetings
  add column if not exists meeting_type text not null default 'meeting',
  add column if not exists deity_name  text,
  add column if not exists start_date  date,
  add column if not exists start_time  text,          -- 'HH:MM' (24h)
  add column if not exists recurrence  text not null default 'none',
  add column if not exists weekdays    text,          -- CSV of 0-6 (Sun=0) for weekly
  add column if not exists status      text not null default 'scheduled';

alter table public.host_meetings drop constraint if exists host_meetings_type_chk;
alter table public.host_meetings
  add constraint host_meetings_type_chk check (meeting_type in ('meeting','special_pooja'));

alter table public.host_meetings drop constraint if exists host_meetings_recurrence_chk;
alter table public.host_meetings
  add constraint host_meetings_recurrence_chk check (recurrence in ('none','daily','weekly','monthly'));

notify pgrst, 'reload schema';
