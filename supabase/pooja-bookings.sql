-- Book Pooja: pooja_bookings table with RLS
-- Implements FR-74–FR-82

create table if not exists public.pooja_bookings (
  id              uuid primary key default gen_random_uuid(),
  devotee_id      uuid references auth.users(id) on delete cascade not null,
  pooja_id        uuid references public.pooja_catalog(id) not null,
  host_id         uuid references auth.users(id),   -- null until a priest/coordinator accepts
  pooja_name      text not null,                     -- snapshot at booking time
  amount_paise    integer not null default 0,
  status          text not null default 'pending'
                    check (status in ('pending','accepted','declined','completed','cancelled')),
  payment_status  text not null default 'pending'
                    check (payment_status in ('pending','paid','refunded')),
  devotee_name    text,
  devotee_phone   text,
  sankalpa_name   text,
  sankalpa_gotra  text,
  notes           text,
  preferred_date  date,
  preferred_time  text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.pooja_bookings enable row level security;

-- Devotees: see own bookings
create policy "devotee_select_own_bookings"
  on public.pooja_bookings for select
  using (devotee_id = auth.uid());

-- Devotees: create bookings for themselves
create policy "devotee_insert_own_bookings"
  on public.pooja_bookings for insert
  with check (devotee_id = auth.uid());

-- Devotees: cancel own pending bookings
create policy "devotee_cancel_own_bookings"
  on public.pooja_bookings for update
  using (devotee_id = auth.uid() and status = 'pending')
  with check (status = 'cancelled');

-- Priests and temple coordinators: see all pending unassigned + their own accepted bookings
create policy "host_select_bookings"
  on public.pooja_bookings for select
  using (
    exists (
      select 1 from public.host_accounts
      where user_id = auth.uid()
        and (host_types && array['priest','temple_exec'])
    )
    and (host_id is null or host_id = auth.uid())
  );

-- Priests and temple coordinators: accept a pending booking
create policy "host_accept_booking"
  on public.pooja_bookings for update
  using (
    exists (
      select 1 from public.host_accounts
      where user_id = auth.uid()
        and (host_types && array['priest','temple_exec'])
    )
    and status = 'pending'
    and host_id is null
  )
  with check (host_id = auth.uid() and status = 'accepted');

-- Hosts: decline or complete their own accepted booking
create policy "host_decline_complete_booking"
  on public.pooja_bookings for update
  using (
    host_id = auth.uid()
    and status in ('accepted', 'pending')
  )
  with check (status in ('declined', 'completed'));

-- Admin: full access
create policy "admin_all_bookings"
  on public.pooja_bookings for all
  using (is_admin());

-- Auto-update updated_at on changes
create or replace function public.set_booking_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pooja_bookings_updated_at on public.pooja_bookings;
create trigger pooja_bookings_updated_at
  before update on public.pooja_bookings
  for each row execute procedure public.set_booking_updated_at();
