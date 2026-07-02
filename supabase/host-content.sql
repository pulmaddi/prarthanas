-- Host content: meeting invites + notification broadcasts
-- Run in Supabase SQL Editor. Hosts (priest / guru / temple_exec) create these;
-- followers read them. Read is open to authenticated; writes are owner-only.

-- ── Meeting invites ─────────────────────────────────────────────
create table if not exists public.host_meetings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  when_text text,          -- free-text schedule, e.g. "Sat 5 Jul, 6:30 PM"
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

-- ── Notification broadcasts ─────────────────────────────────────
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

notify pgrst, 'reload schema';
