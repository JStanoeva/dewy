-- Adds a product to one or both rituals in one statement, so both rows are saved or neither is.
create function public.add_routine_steps(
  p_product_id uuid,
  p_periods text[],
  p_weekdays smallint[],
  p_duration_seconds integer,
  p_wait_minutes smallint default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if coalesce(cardinality(p_periods), 0) not between 1 and 2
    or cardinality(p_periods) <> (select count(distinct t.period) from unnest(p_periods) as t(period))
    or not (p_periods <@ array['morning', 'evening'])
  then
    raise exception 'p_periods must name one or two different rituals'
      using errcode = '22023';
  end if;

  insert into public.routine_steps (product_id, period, weekdays, duration_seconds, wait_minutes)
  select p_product_id, t.period, p_weekdays, p_duration_seconds, p_wait_minutes
  from unnest(p_periods) as t(period)
  -- A fixed order, so two phones adding the same product at once get 23505 rather than a deadlock.
  order by t.period;
end;
$$;

revoke execute on function public.add_routine_steps(uuid, text[], smallint[], integer, smallint) from public, anon;
grant execute on function public.add_routine_steps(uuid, text[], smallint[], integer, smallint) to authenticated;
