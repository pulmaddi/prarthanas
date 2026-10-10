-- ============================================================
-- Prarthanas — On-demand personal sessions (FR-57…FR-68)
-- Priest / Astrologer / Numerologist availability + session
-- requests + 1:1 direct messages.  Run in Supabase SQL Editor.
-- ============================================================

-- 1. Availability status on host_accounts --------------------------
alter table public.host_accounts
  add column if not exists availability_status text
    not null default 'offline'
    check (availability_status in ('available', 'live', 'offline'));

-- 2. Refresh hosts_public view to expose availability_status -------
drop view if exists public.hosts_public;
create view public.hosts_public as
  select user_id, host_types, name, org_name, location, city, availability_status
  from public.host_accounts;

grant select on public.hosts_public to anon, authenticated;

-- 3. Session requests ----------------------------------------------
create table if not exists public.session_requests (
  id            uuid primary key default gen_random_uuid(),
  devotee_id    uuid references auth.users(id) on delete cascade not null,
  host_id       uuid references auth.users(id) on delete cascade not null,
  service_type  text not null,
  description   text,
  devotee_phone text,
  devotee_name  text,
  status        text not null default 'pending'
                  check (status in ('pending','accepted','declined','meeting_started','completed')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.session_requests enable row level security;

-- Devotee manages their own requests
drop policy if exists "session_requests_devotee" on public.session_requests;
create policy "session_requests_devotee" on public.session_requests
  for all to authenticated
  using  (devotee_id = auth.uid())
  with check (devotee_id = auth.uid());

-- Host reads requests directed to them
drop policy if exists "session_requests_host_select" on public.session_requests;
create policy "session_requests_host_select" on public.session_requests
  for select to authenticated
  using (host_id = auth.uid());

-- Host updates status of their requests
drop policy if exists "session_requests_host_update" on public.session_requests;
create policy "session_requests_host_update" on public.session_requests
  for update to authenticated
  using  (host_id = auth.uid())
  with check (host_id = auth.uid());

-- 4. Direct messages -----------------------------------------------
create table if not exists public.direct_messages (
  id               uuid primary key default gen_random_uuid(),
  request_id       uuid references public.session_requests(id) on delete cascade not null,
  sender_id        uuid references auth.users(id) on delete cascade not null,
  recipient_id     uuid references auth.users(id) on delete cascade not null,
  body             text not null,
  is_meeting_invite boolean not null default false,
  meeting_room_id  text,     -- LiveKit room name when is_meeting_invite = true
  created_at       timestamptz default now()
);

alter table public.direct_messages enable row level security;

-- Sender or recipient can read; only sender can insert
drop policy if exists "direct_messages_read" on public.direct_messages;
create policy "direct_messages_read" on public.direct_messages
  for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists "direct_messages_send" on public.direct_messages;
create policy "direct_messages_send" on public.direct_messages
  for insert to authenticated
  with check (sender_id = auth.uid());

-- Enable Realtime on direct_messages so chat updates live
alter publication supabase_realtime add table public.direct_messages;

notify pgrst, 'reload schema';
