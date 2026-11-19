-- Each tick also records its product, so a removed step or a move to the other ritual keeps the uses it counted.
alter table public.routine_completions
  add column product_id uuid;

update public.routine_completions c
set product_id = s.product_id
from public.routine_steps s
where s.id = c.routine_step_id and s.user_id = c.user_id;

-- A CHECK instead of NOT NULL: the trigger below always fills product_id, and the app's typed upsert can't send it.
alter table public.routine_completions
  add constraint routine_completions_product_present check (product_id is not null),
  alter column routine_step_id drop not null,
  drop constraint routine_completions_step_fkey,
  -- Only the step id is cleared; user_id stays, so the tick still belongs to its owner.
  add constraint routine_completions_step_fkey
    foreign key (routine_step_id, user_id) references public.routine_steps (id, user_id)
    on delete set null (routine_step_id),
  add constraint routine_completions_product_fkey
    foreign key (product_id, user_id) references public.products (id, user_id)
    on delete cascade;

create index routine_completions_product_id_user_id_idx
  on public.routine_completions (product_id, user_id);

-- Clients send only the step; a missing step fails with 23503 as the foreign key did, which Today relies on.
create function public.set_completion_product()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select s.product_id into new.product_id
  from public.routine_steps s
  where s.id = new.routine_step_id and s.user_id = new.user_id;
  if new.product_id is null then
    raise exception 'routine step not found' using errcode = '23503';
  end if;
  return new;
end;
$$;

create trigger routine_completions_set_product
  before insert on public.routine_completions
  for each row execute function public.set_completion_product();

revoke execute on function public.set_completion_product() from public, anon, authenticated;

-- A step's product never changes (remove and re-add to swap), so its ticks always match it.
revoke update (product_id) on public.routine_steps from authenticated;

-- Past days are frozen: clients add or remove ticks only around today, whatever their time zone.
alter policy "Users can add their own completions"
  on public.routine_completions
  with check (
    user_id = (select auth.uid())
    and local_date between (now() at time zone 'utc')::date - 1 and (now() at time zone 'utc')::date + 1
  );

alter policy "Users can delete their own completions"
  on public.routine_completions
  using (
    user_id = (select auth.uid())
    and local_date between (now() at time zone 'utc')::date - 1 and (now() at time zone 'utc')::date + 1
  );

-- Each of the caller's products that has ticks on or after its tracked_from, with how many.
create function public.product_uses()
returns table (product_id uuid, uses integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.product_id, count(*)::integer
  from public.routine_completions c
  join public.products p on p.id = c.product_id and p.user_id = c.user_id
  where c.user_id = (select auth.uid()) and c.local_date >= p.tracked_from
  group by c.product_id;
$$;

revoke execute on function public.product_uses() from public, anon;
grant execute on function public.product_uses() to authenticated;

-- A finished ritual for a day. It references no product or step, so deleting either never undoes it.
create table public.ritual_days (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_date date not null
    check (local_date between date '2000-01-01' and current_date + 1),
  period text not null
    check (period in ('morning', 'evening')),
  completed_at timestamptz not null default now(),
  primary key (user_id, local_date, period)
);

alter table public.ritual_days enable row level security;

create policy "Users can view their own ritual days"
  on public.ritual_days for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can add their own ritual days"
  on public.ritual_days for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and local_date between (now() at time zone 'utc')::date - 1 and (now() at time zone 'utc')::date + 1
  );

create policy "Users can delete their own ritual days"
  on public.ritual_days for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    and local_date between (now() at time zone 'utc')::date - 1 and (now() at time zone 'utc')::date + 1
  );

-- A stamp is inserted or deleted, never changed; clients never set user_id or completed_at.
revoke all on public.ritual_days from anon, authenticated;
grant select, delete on public.ritual_days to authenticated;
grant insert (local_date, period) on public.ritual_days to authenticated;
