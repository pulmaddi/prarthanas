-- Scheduling fields for host_meetings: meeting vs special pooja, date/time,
-- recurrence (one-time / daily / weekly / monthly). Run in the SQL Editor.

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
