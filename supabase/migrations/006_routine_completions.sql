-- FK checks bypass RLS, so completions reference (id, user_id) to stay on their owner's own steps.
alter table public.routine_steps
  add constraint routine_steps_id_user_id_key unique (id, user_id);

create table public.routine_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  routine_step_id uuid not null,
  -- The ritual day (it turns over at 05:00 local time), with one day of slack because the server runs in UTC.
  local_date date not null
    check (local_date between date '2000-01-01' and current_date + 1),
  completed_at timestamptz not null default now(),
  constraint routine_completions_step_fkey
    foreign key (routine_step_id, user_id) references public.routine_steps (id, user_id) on delete cascade,
  constraint routine_completions_user_date_step_key unique (user_id, local_date, routine_step_id)
);

create index routine_completions_routine_step_id_user_id_idx
  on public.routine_completions (routine_step_id, user_id);

alter table public.routine_completions enable row level security;

create policy "Users can view their own completions"
  on public.routine_completions for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can add their own completions"
  on public.routine_completions for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own completions"
  on public.routine_completions for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- A tick is inserted or deleted, never changed; clients never set id, user_id or completed_at.
revoke all on public.routine_completions from anon, authenticated;
grant select, delete on public.routine_completions to authenticated;
grant insert (routine_step_id, local_date) on public.routine_completions to authenticated;
