-- FK checks bypass RLS, so steps reference (id, user_id) to stay on their owner's own products.
alter table public.products
  add constraint products_id_user_id_key unique (id, user_id);

create table public.routine_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id uuid not null,
  period text not null
    check (period in ('morning', 'evening')),
  position integer not null default 0
    check (position >= 0),
  -- ISO weekdays, Monday = 1 … Sunday = 7.
  weekdays smallint[] not null default '{1,2,3,4,5,6,7}'
    check (
      array_ndims(weekdays) = 1
      and cardinality(weekdays) between 1 and 7
      and array_position(weekdays, null) is null
      and weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
    ),
  duration_seconds integer not null default 60
    check (duration_seconds between 10 and 1800),
  wait_minutes smallint
    check (wait_minutes between 1 and 60),
  note text
    check (char_length(note) <= 80 and btrim(note) <> ''),
  created_at timestamptz not null default now(),
  constraint routine_steps_product_fkey
    foreign key (product_id, user_id) references public.products (id, user_id) on delete cascade,
  constraint routine_steps_user_period_product_key unique (user_id, period, product_id)
);

create index routine_steps_product_id_user_id_idx on public.routine_steps (product_id, user_id);

-- A new step always goes to the end of its period, so clients never send a position.
create function public.set_routine_step_position()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.position := coalesce(
    (
      select max(s.position) + 1
      from public.routine_steps s
      where s.user_id = new.user_id and s.period = new.period
    ),
    0
  );
  return new;
end;
$$;

create trigger routine_steps_set_position
  before insert on public.routine_steps
  for each row execute function public.set_routine_step_position();

alter table public.routine_steps enable row level security;

create policy "Users can view their own routine steps"
  on public.routine_steps for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can add their own routine steps"
  on public.routine_steps for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own routine steps"
  on public.routine_steps for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own routine steps"
  on public.routine_steps for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Clients never set id, user_id or created_at, never move a step to the other period, and get positions from the trigger or the RPC.
revoke all on public.routine_steps from anon, authenticated;
grant select, delete on public.routine_steps to authenticated;
grant insert (
  product_id,
  period,
  weekdays,
  duration_seconds,
  wait_minutes,
  note
) on public.routine_steps to authenticated;
grant update (
  product_id,
  weekdays,
  duration_seconds,
  wait_minutes,
  note,
  position
) on public.routine_steps to authenticated;

-- Sets each step's position to its index in p_step_ids, which must list every one of the caller's steps in that period once.
create function public.reorder_routine_steps(p_period text, p_step_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  step_count integer := coalesce(cardinality(p_step_ids), -1);
begin
  if step_count <> (select count(distinct t.id) from unnest(p_step_ids) as t(id))
    or step_count <> (
      select count(*)
      from public.routine_steps s
      where s.user_id = (select auth.uid()) and s.period = p_period
    )
    or step_count <> (
      select count(*)
      from public.routine_steps s
      where s.user_id = (select auth.uid()) and s.period = p_period and s.id = any (p_step_ids)
    )
  then
    raise exception 'p_step_ids must list each of your % steps exactly once', p_period
      using errcode = '22023';
  end if;

  update public.routine_steps s
  set position = t.ord - 1
  from unnest(p_step_ids) with ordinality as t(id, ord)
  where s.id = t.id and s.user_id = (select auth.uid());
end;
$$;

revoke execute on function public.set_routine_step_position() from public, anon, authenticated;
revoke execute on function public.reorder_routine_steps(text, uuid[]) from public, anon;
grant execute on function public.reorder_routine_steps(text, uuid[]) to authenticated;
