-- Shared trigger function that keeps updated_at current on every table that has it.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null
    check (char_length(display_name) <= 40 and btrim(display_name) <> ''),
  skin_type text
    check (skin_type in ('dry', 'oily', 'combination', 'balanced')),
  concerns text[] not null default '{}'
    check (concerns <@ array['sensitivity', 'breakouts', 'dark_spots', 'fine_lines', 'redness', 'pores']),
  ritual_style text
    check (ritual_style in ('quick', 'balanced', 'full')),
  starter_categories text[] not null default '{}'
    check (starter_categories <@ array['cleanser', 'toner', 'serum', 'moisturizer', 'spf', 'mask']),
  onboarding_completed_at timestamptz,
  theme text not null default 'auto'
    check (theme in ('auto', 'light', 'dark')),
  morning_reminder_enabled boolean not null default false,
  evening_reminder_enabled boolean not null default false,
  morning_reminder_time time not null default '08:00',
  evening_reminder_time time not null default '21:30',
  expiry_alerts_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Clients may read their row and edit preferences, but never insert, delete, or touch id and timestamps.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (
  display_name,
  skin_type,
  concerns,
  ritual_style,
  starter_categories,
  onboarding_completed_at,
  theme,
  morning_reminder_enabled,
  evening_reminder_enabled,
  morning_reminder_time,
  evening_reminder_time,
  expiry_alerts_enabled
) on public.profiles to authenticated;

-- Creates the profile row for every new auth user, using the name sent at sign-up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(
      coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
        nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
        'Friend'
      ),
      40
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
