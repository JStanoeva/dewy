-- Accounts made before onboarding existed are already set up, so they go straight to the tabs.
update public.profiles
set onboarding_completed_at = created_at
where onboarding_completed_at is null;
