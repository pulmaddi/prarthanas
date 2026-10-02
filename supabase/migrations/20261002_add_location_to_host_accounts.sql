-- Add locality/area field to host_accounts (used for temples to distinguish
-- branches of the same temple in different parts of a city).
alter table public.host_accounts
  add column if not exists location text;
