-- ============================================================
-- Prarthanas — roles model: everyone is a Devotee by default; host roles
-- (Priest/Guru/Temple Exec via host_accounts) are ADDITIONAL and can be
-- granted to an existing account. This adds profiles.email + admin read
-- so an admin can find a user by email and grant them a host role.
-- Requires admin.sql (is_admin()). Run in the Supabase SQL Editor.
-- ============================================================

alter table public.profiles add column if not exists email text;

-- Admins can read all profiles (needed to look up a user by email).
drop policy if exists "profiles_admin_read" on public.profiles;
create policy "profiles_admin_read" on public.profiles
  for select to authenticated using (public.is_admin());

-- Store email on new signups (and keep it in sync on re-trigger).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'language', 'en')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- Backfill email for existing profiles.
update public.profiles p set email = u.email
from auth.users u
where u.id = p.id and (p.email is distinct from u.email);

notify pgrst, 'reload schema';
