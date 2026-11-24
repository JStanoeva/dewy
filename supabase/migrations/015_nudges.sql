-- The nudge settings onboarding step 3 asks for, and the mark that a bottle's Running low notification has fired.
alter table public.profiles
  add column expiry_lead_days smallint not null default 14,
  add column low_alerts_enabled boolean not null default false,
  add column low_uses_threshold smallint not null default 5,
  add constraint profiles_expiry_lead_days_check
    check (expiry_lead_days in (3, 7, 14, 30)),
  add constraint profiles_low_uses_threshold_check
    check (low_uses_threshold in (3, 5, 10, 20)),
  -- Nobody was asked for notification permission yet, so no nudge may start out on.
  alter column expiry_alerts_enabled set default false;

update public.profiles
set expiry_alerts_enabled = false
where expiry_alerts_enabled;

grant update (expiry_lead_days, low_alerts_enabled, low_uses_threshold)
  on public.profiles to authenticated;

-- Set once when Running low fires for this bottle; every restart of the count clears it.
alter table public.products
  add column low_notified_at timestamptz;

grant update (low_notified_at) on public.products to authenticated;
